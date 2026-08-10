import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "https://esm.sh/@simplewebauthn/server@10.0.1?target=deno";
import { isoBase64URL } from "https://esm.sh/@simplewebauthn/server@10.0.1/helpers?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

function getOrigin(req: Request): string | null {
  const raw = req.headers.get("origin") || req.headers.get("referer");
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;

    const body = await req.json();
    const { action, credential, deviceName } = body;

    const origin = getOrigin(req);
    if (!origin) {
      console.error("[webauthn-register] missing or invalid origin header");
      return new Response(JSON.stringify({ error: "Invalid request origin" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const rpId = new URL(origin).hostname;

    if (action === "options") {
      const { data: existing } = await supabaseAdmin
        .from("webauthn_credentials")
        .select("credential_id")
        .eq("user_id", userId);

      const options = await generateRegistrationOptions({
        rpName: "Mis Finanzas",
        rpID: rpId,
        userID: new TextEncoder().encode(userId),
        userName: userEmail,
        userDisplayName: userEmail,
        attestationType: "none",
        timeout: 60000,
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
          requireResidentKey: false,
        },
        excludeCredentials: (existing || []).map((c) => ({
          id: c.credential_id,
          type: "public-key",
        })),
        supportedAlgorithmIDs: [-7, -257],
      });

      await supabaseAdmin.rpc("cleanup_old_challenges");
      await supabaseAdmin.from("webauthn_challenges").insert({
        user_email: userEmail,
        challenge: options.challenge,
        type: "registration",
      });

      return new Response(JSON.stringify(options), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      if (!credential?.id || !credential?.response) {
        return new Response(JSON.stringify({ error: "Missing credential data" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: challengeData } = await supabaseAdmin
        .from("webauthn_challenges")
        .select("*")
        .eq("user_email", userEmail)
        .eq("type", "registration")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!challengeData) {
        return new Response(JSON.stringify({ error: "Challenge expired or not found" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabaseAdmin.from("webauthn_challenges").delete().eq("id", challengeData.id);

      let verification;
      try {
        verification = await verifyRegistrationResponse({
          response: credential,
          expectedChallenge: challengeData.challenge,
          expectedOrigin: origin,
          expectedRPID: rpId,
          requireUserVerification: true,
        });
      } catch (e) {
        console.error("[webauthn-register] verification error:", (e as Error).message);
        return new Response(JSON.stringify({ error: "Verification failed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!verification.verified || !verification.registrationInfo) {
        return new Response(JSON.stringify({ error: "Registration not verified" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Support both @simplewebauthn/server v10 (credentialID/credentialPublicKey)
      // and v11+ (registrationInfo.credential.{id,publicKey}) response shapes.
      const info = verification.registrationInfo as Record<string, any>;
      const verifiedCred = info.credential ?? {};
      const rawId = verifiedCred.id ?? info.credentialID;
      const rawPublicKey = verifiedCred.publicKey ?? info.credentialPublicKey;
      const counter = verifiedCred.counter ?? info.counter ?? 0;

      if (!rawId || !rawPublicKey) {
        console.error("[webauthn-register] unexpected registrationInfo shape");
        return new Response(JSON.stringify({ error: "Registration not verified" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const credentialIdB64 =
        typeof rawId === "string" ? rawId : isoBase64URL.fromBuffer(rawId as Uint8Array);
      const publicKeyB64 =
        typeof rawPublicKey === "string"
          ? rawPublicKey
          : isoBase64URL.fromBuffer(rawPublicKey as Uint8Array);

      await supabaseAdmin.from("webauthn_credentials").insert({
        user_id: userId,
        credential_id: credentialIdB64,
        public_key: publicKeyB64,
        counter,
        device_name: deviceName || "Dispositivo",
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[webauthn-register] error:", (err as Error).message);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
