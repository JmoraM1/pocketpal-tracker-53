import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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

    // Parse body ONCE and extract all fields
    const body = await req.json();
    const { action, credential, deviceName } = body;

    if (action === "options") {
      const challengeBytes = crypto.getRandomValues(new Uint8Array(32));
      const challenge = bufferToBase64Url(challengeBytes);

      await supabaseAdmin.rpc("cleanup_old_challenges");

      await supabaseAdmin.from("webauthn_challenges").insert({
        user_email: userEmail,
        challenge,
        type: "registration",
      });

      const { data: existing } = await supabaseAdmin
        .from("webauthn_credentials")
        .select("credential_id")
        .eq("user_id", userId);

      const rpId = new URL(req.headers.get("origin") || req.headers.get("referer") || "https://localhost").hostname;

      const options = {
        challenge,
        rp: { name: "Mis Finanzas", id: rpId },
        user: {
          id: bufferToBase64Url(new TextEncoder().encode(userId)),
          name: userEmail,
          displayName: userEmail,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        timeout: 60000,
        attestation: "none",
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
          requireResidentKey: false,
        },
        excludeCredentials: (existing || []).map((c) => ({
          type: "public-key",
          id: c.credential_id,
        })),
      };

      console.log("[webauthn-register] options generated for user:", userEmail, "rpId:", rpId);

      return new Response(JSON.stringify(options), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      if (!credential?.id || !credential?.publicKey) {
        console.error("[webauthn-register] verify: missing credential data", JSON.stringify(body));
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
        console.error("[webauthn-register] verify: challenge not found for", userEmail);
        return new Response(JSON.stringify({ error: "Challenge expired or not found" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabaseAdmin.from("webauthn_challenges").delete().eq("id", challengeData.id);

      await supabaseAdmin.from("webauthn_credentials").insert({
        user_id: userId,
        credential_id: credential.id,
        public_key: credential.publicKey,
        counter: credential.counter || 0,
        device_name: deviceName || "Dispositivo",
      });

      console.log("[webauthn-register] credential stored for user:", userEmail, "device:", deviceName);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[webauthn-register] error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
