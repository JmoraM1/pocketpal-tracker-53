import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "https://esm.sh/@simplewebauthn/server@10.0.1?target=deno";
import { isoBase64URL } from "https://esm.sh/@simplewebauthn/server@10.0.1/helpers?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getOrigin(req: Request): string {
  return req.headers.get("origin") || req.headers.get("referer")?.replace(/\/$/, "") || "https://localhost";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action, email, credential } = body;

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = getOrigin(req);
    const rpId = new URL(origin).hostname;

    if (action === "options") {
      const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
      const user = userData?.users?.find((u) => u.email === email);
      if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: credentials } = await supabaseAdmin
        .from("webauthn_credentials")
        .select("credential_id")
        .eq("user_id", user.id);

      if (!credentials || credentials.length === 0) {
        return new Response(JSON.stringify({ error: "No passkeys registered" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const options = await generateAuthenticationOptions({
        rpID: rpId,
        timeout: 60000,
        userVerification: "required",
        allowCredentials: credentials.map((c) => ({
          id: c.credential_id,
          type: "public-key",
        })),
      });

      await supabaseAdmin.rpc("cleanup_old_challenges");
      await supabaseAdmin.from("webauthn_challenges").insert({
        user_email: email,
        challenge: options.challenge,
        type: "authentication",
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
        .eq("user_email", email)
        .eq("type", "authentication")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!challengeData) {
        return new Response(JSON.stringify({ error: "Challenge expired" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabaseAdmin.from("webauthn_challenges").delete().eq("id", challengeData.id);

      const { data: storedCred } = await supabaseAdmin
        .from("webauthn_credentials")
        .select("*")
        .eq("credential_id", credential.id)
        .single();

      if (!storedCred) {
        return new Response(JSON.stringify({ error: "Credential not found. You may need to re-register." }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // The credential must belong to the user claiming this email
      const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
      const user = userData?.users?.find((u) => u.id === storedCred.user_id);
      if (!user || user.email !== email) {
        return new Response(JSON.stringify({ error: "Credential does not belong to this account" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let verification;
      try {
        verification = await verifyAuthenticationResponse({
          response: credential,
          expectedChallenge: challengeData.challenge,
          expectedOrigin: origin,
          expectedRPID: rpId,
          requireUserVerification: true,
          credential: {
            id: storedCred.credential_id,
            publicKey: isoBase64URL.toBuffer(storedCred.public_key),
            counter: storedCred.counter ?? 0,
          },
        });
      } catch (e) {
        console.error("[webauthn-auth] verification error:", (e as Error).message);
        return new Response(JSON.stringify({ error: "Verification failed" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!verification.verified) {
        return new Response(JSON.stringify({ error: "Authentication not verified" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Signature counter regression check (defense against cloned authenticators)
      const newCounter = verification.authenticationInfo.newCounter;
      if (storedCred.counter > 0 && newCounter !== 0 && newCounter <= storedCred.counter) {
        console.error("[webauthn-auth] counter regression detected");
        return new Response(JSON.stringify({ error: "Authenticator compromised" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabaseAdmin
        .from("webauthn_credentials")
        .update({ counter: newCounter })
        .eq("id", storedCred.id);

      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: user.email!,
      });

      if (linkError || !linkData) {
        return new Response(JSON.stringify({ error: "Failed to generate session" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const actionLink = linkData.properties?.action_link;
      const url = new URL(actionLink);
      const token_hash = url.searchParams.get("token") || url.hash?.match(/token=([^&]+)/)?.[1];

      return new Response(JSON.stringify({ success: true, token_hash, email: user.email }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[webauthn-auth] error:", (err as Error).message);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
