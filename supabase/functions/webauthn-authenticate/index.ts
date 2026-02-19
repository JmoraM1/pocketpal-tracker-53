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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action, email, credential } = body;

    if (action === "options") {
      if (!email) {
        return new Response(JSON.stringify({ error: "Email is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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

      const challengeBytes = crypto.getRandomValues(new Uint8Array(32));
      const challenge = bufferToBase64Url(challengeBytes);

      await supabaseAdmin.rpc("cleanup_old_challenges");
      await supabaseAdmin.from("webauthn_challenges").insert({
        user_email: email,
        challenge,
        type: "authentication",
      });

      const rpId = new URL(req.headers.get("origin") || req.headers.get("referer") || "https://localhost").hostname;

      console.log("[webauthn-auth] options for:", email, "rpId:", rpId, "credentials:", credentials.length);

      const options = {
        challenge,
        rpId,
        timeout: 60000,
        userVerification: "required",
        allowCredentials: credentials.map((c) => ({
          type: "public-key",
          id: c.credential_id,
        })),
      };

      return new Response(JSON.stringify(options), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      if (!credential || !email) {
        console.error("[webauthn-auth] verify: missing data", JSON.stringify({ hasCredential: !!credential, hasEmail: !!email }));
        return new Response(JSON.stringify({ error: "Missing data" }), {
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
        console.error("[webauthn-auth] verify: challenge not found for", email);
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
        console.error("[webauthn-auth] verify: credential not found:", credential.id);
        return new Response(JSON.stringify({ error: "Credential not found. You may need to re-register on this domain." }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabaseAdmin
        .from("webauthn_credentials")
        .update({ counter: (credential.counter || 0) })
        .eq("id", storedCred.id);

      const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
      const user = userData?.users?.find((u) => u.id === storedCred.user_id);

      if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: user.email!,
      });

      if (linkError || !linkData) {
        console.error("[webauthn-auth] verify: generateLink failed:", linkError?.message);
        return new Response(JSON.stringify({ error: "Failed to generate session" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const actionLink = linkData.properties?.action_link;
      const url = new URL(actionLink);
      const token_hash = url.searchParams.get("token") || url.hash?.match(/token=([^&]+)/)?.[1];

      console.log("[webauthn-auth] verify: success for", user.email, "token_hash present:", !!token_hash);

      return new Response(JSON.stringify({
        success: true,
        token_hash,
        email: user.email,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[webauthn-auth] error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
