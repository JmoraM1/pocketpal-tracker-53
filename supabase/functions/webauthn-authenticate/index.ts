import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "https://esm.sh/@simplewebauthn/server@13.1.1?target=deno";
import { isoBase64URL } from "https://esm.sh/@simplewebauthn/server@13.1.1/helpers?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

const EXPECTED_ORIGIN = "https://pocketpal-tracker-53.lovable.app";
const EXPECTED_RP_ID = "pocketpal-tracker-53.lovable.app";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getReceivedOrigin(req: Request): string | null {
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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action, email, credential } = body;

    if (!email || typeof email !== "string") {
      return json({ error: "Email is required" }, 400);
    }

    const receivedOrigin = getReceivedOrigin(req);
    if (!receivedOrigin || receivedOrigin !== EXPECTED_ORIGIN) {
      console.error("[webauthn-auth] invalid or mismatched origin header", receivedOrigin);
      return json({ error: "Invalid request origin" }, 400);
    }

    // Look up the user across all pages (listUsers is paginated: a user beyond
    // the first page would otherwise never be found).
    const normalizedEmail = email.trim().toLowerCase();
    let user: { id: string; email?: string | null } | undefined;
    for (let page = 1; page <= 20 && !user; page++) {
      const { data: pageData } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      const users = pageData?.users ?? [];
      user = users.find((u) => u.email?.toLowerCase() === normalizedEmail);
      if (users.length < 1000) break;
    }

    if (action === "options") {
      // Same response for "unknown user" and "user without passkeys" so the
      // endpoint cannot be used to enumerate registered accounts.
      if (!user) return json({ error: "No passkeys registered" }, 404);

      const { data: credentials } = await supabaseAdmin
        .from("webauthn_credentials")
        .select("credential_id")
        .eq("user_id", user.id);

      if (!credentials || credentials.length === 0) {
        return json({ error: "No passkeys registered" }, 404);
      }

      const options = await generateAuthenticationOptions({
        rpID: EXPECTED_RP_ID,
        timeout: 60000,
        userVerification: "required",
        allowCredentials: credentials.map((c) => ({
          id: c.credential_id,
          type: "public-key" as const,
        })),
      });

      await supabaseAdmin.rpc("cleanup_old_challenges");
      await supabaseAdmin.from("webauthn_challenges").insert({
        user_email: email,
        challenge: options.challenge,
        type: "authentication",
      });

      return json(options);
    }

    if (action === "verify") {
      if (!credential?.id || !credential?.response?.signature || !credential?.response?.authenticatorData) {
        return json({ error: "Missing credential data" }, 400);
      }
      if (!user) {
        console.error("[webauthn-auth] verify for unknown user");
        return json({ error: "Authentication failed" }, 401);
      }

      // 1. Fetch and immediately consume the challenge (single use).
      const { data: challengeData } = await supabaseAdmin
        .from("webauthn_challenges")
        .select("*")
        .eq("user_email", email)
        .eq("type", "authentication")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!challengeData) {
        return json({ error: "Challenge expired" }, 400);
      }

      // Burn the challenge before any verification so it can never be replayed.
      const { data: consumed } = await supabaseAdmin
        .from("webauthn_challenges")
        .delete()
        .eq("id", challengeData.id)
        .select("id");

      if (!consumed || consumed.length === 0) {
        console.error("[webauthn-auth] challenge already consumed");
        return json({ error: "Challenge expired" }, 400);
      }

      if (Date.now() - new Date(challengeData.created_at).getTime() > CHALLENGE_TTL_MS) {
        return json({ error: "Challenge expired" }, 400);
      }

      // 2. The credential must exist AND belong to the user claiming this email.
      const { data: storedCred } = await supabaseAdmin
        .from("webauthn_credentials")
        .select("*")
        .eq("credential_id", credential.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!storedCred) {
        console.error("[webauthn-auth] credential not found for this user");
        return json({ error: "Authentication failed" }, 401);
      }

      // 3. Full cryptographic verification of the assertion signature against
      //    the stored public key, challenge, origin, RP ID and UV flag.
      let verification;
      try {
        verification = await verifyAuthenticationResponse({
          response: credential,
          expectedChallenge: challengeData.challenge,
          expectedOrigin: EXPECTED_ORIGIN,
          expectedRPID: EXPECTED_RP_ID,
          requireUserVerification: true,
          credential: {
            id: storedCred.credential_id,
            publicKey: isoBase64URL.toBuffer(storedCred.public_key),
            counter: Number(storedCred.counter ?? 0),
          },
        });
      } catch (e) {
        console.error("[webauthn-auth] verification error:", (e as Error).message);
        return json({ error: "Authentication failed" }, 401);
      }

      if (!verification.verified || !verification.authenticationInfo) {
        console.error("[webauthn-auth] assertion not verified");
        return json({ error: "Authentication failed" }, 401);
      }

      // 4. Signature counter regression check (cloned authenticator defense).
      const newCounter = verification.authenticationInfo.newCounter;
      const storedCounter = Number(storedCred.counter ?? 0);
      if (storedCounter > 0 && newCounter !== 0 && newCounter <= storedCounter) {
        console.error("[webauthn-auth] counter regression detected");
        return json({ error: "Authentication failed" }, 401);
      }

      await supabaseAdmin
        .from("webauthn_credentials")
        .update({ counter: newCounter })
        .eq("id", storedCred.id);

      // 5. Only now — after full verification — issue a session.
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: user.email!,
      });

      if (linkError || !linkData) {
        console.error("[webauthn-auth] generateLink failed");
        return json({ error: "Failed to generate session" }, 500);
      }

      const actionLink = linkData.properties?.action_link;
      const url = new URL(actionLink);
      const token_hash = url.searchParams.get("token") || url.hash?.match(/token=([^&]+)/)?.[1];

      if (!token_hash) {
        return json({ error: "Failed to generate session" }, 500);
      }

      return json({ success: true, token_hash, email: user.email });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (err) {
    console.error("[webauthn-auth] error:", (err as Error).message);
    return json({ error: "Unexpected error" }, 500);
  }
});
