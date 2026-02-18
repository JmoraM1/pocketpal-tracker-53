import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

function base64UrlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function isWebAuthnSupported(): boolean {
  return !!(window.PublicKeyCredential && navigator.credentials);
}

export function useWebAuthn() {
  const [loading, setLoading] = useState(false);

  const registerPasskey = useCallback(async () => {
    if (!isWebAuthnSupported()) {
      toast({ title: "No soportado", description: "Tu navegador no soporta autenticación biométrica.", variant: "destructive" });
      return false;
    }

    setLoading(true);
    try {
      // 1. Get registration options from server
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("No session");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const optionsRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/webauthn-register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: "options" }),
        }
      );

      if (!optionsRes.ok) throw new Error("Failed to get options");
      const options = await optionsRes.json();

      // 2. Create credential using browser API
      const publicKeyOptions: PublicKeyCredentialCreationOptions = {
        challenge: base64UrlToBuffer(options.challenge),
        rp: options.rp,
        user: {
          id: base64UrlToBuffer(options.user.id),
          name: options.user.name,
          displayName: options.user.displayName,
        },
        pubKeyCredParams: options.pubKeyCredParams,
        timeout: options.timeout,
        attestation: options.attestation as AttestationConveyancePreference,
        authenticatorSelection: options.authenticatorSelection,
        excludeCredentials: (options.excludeCredentials || []).map((c: any) => ({
          type: c.type,
          id: base64UrlToBuffer(c.id),
        })),
      };

      const credential = (await navigator.credentials.create({
        publicKey: publicKeyOptions,
      })) as PublicKeyCredential | null;

      if (!credential) throw new Error("Registration cancelled");

      const response = credential.response as AuthenticatorAttestationResponse;

      // 3. Send credential to server for verification
      const verifyRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/webauthn-register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            action: "verify",
            credential: {
              id: bufferToBase64Url(credential.rawId),
              publicKey: bufferToBase64Url(response.getPublicKey()!),
              counter: 0,
            },
            deviceName: navigator.userAgent.includes("iPhone") || navigator.userAgent.includes("iPad")
              ? "iPhone/iPad"
              : navigator.userAgent.includes("Android")
                ? "Android"
                : "Computadora",
          }),
        }
      );

      if (!verifyRes.ok) throw new Error("Verification failed");

      toast({ title: "¡Listo!", description: "Huella/Face ID registrado exitosamente." });
      return true;
    } catch (err: any) {
      if (err.name !== "NotAllowedError") {
        toast({ title: "Error", description: err.message || "No se pudo registrar la biometría.", variant: "destructive" });
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const authenticateWithPasskey = useCallback(async (email: string) => {
    if (!isWebAuthnSupported()) {
      toast({ title: "No soportado", description: "Tu navegador no soporta autenticación biométrica.", variant: "destructive" });
      return false;
    }

    setLoading(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // 1. Get authentication options
      const optionsRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/webauthn-authenticate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey },
          body: JSON.stringify({ action: "options", email }),
        }
      );

      if (!optionsRes.ok) {
        const err = await optionsRes.json();
        if (err.error === "No passkeys registered") {
          toast({ title: "Sin biometría", description: "No tienes huella registrada. Inicia sesión con contraseña y regístrala.", variant: "destructive" });
          return false;
        }
        throw new Error(err.error || "Failed to get options");
      }

      const options = await optionsRes.json();

      // 2. Get credential from browser
      const publicKeyOptions: PublicKeyCredentialRequestOptions = {
        challenge: base64UrlToBuffer(options.challenge),
        rpId: options.rpId,
        timeout: options.timeout,
        userVerification: options.userVerification as UserVerificationRequirement,
        allowCredentials: (options.allowCredentials || []).map((c: any) => ({
          type: c.type,
          id: base64UrlToBuffer(c.id),
        })),
      };

      const credential = (await navigator.credentials.get({
        publicKey: publicKeyOptions,
      })) as PublicKeyCredential | null;

      if (!credential) throw new Error("Authentication cancelled");

      const response = credential.response as AuthenticatorAssertionResponse;

      // 3. Verify on server
      const verifyRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/webauthn-authenticate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey },
          body: JSON.stringify({
            action: "verify",
            email,
            credential: {
              id: bufferToBase64Url(credential.rawId),
              counter: new DataView(response.authenticatorData.slice(33, 37)).getUint32(0),
            },
          }),
        }
      );

      if (!verifyRes.ok) throw new Error("Verification failed");

      const result = await verifyRes.json();

      if (result.success && result.token_hash) {
        // Use the token to sign in
        const { error } = await supabase.auth.verifyOtp({
          token_hash: result.token_hash,
          type: "magiclink",
        });

        if (error) throw error;

        toast({ title: "¡Bienvenido!", description: "Sesión iniciada con biometría." });
        return true;
      }

      throw new Error("Authentication failed");
    } catch (err: any) {
      if (err.name !== "NotAllowedError") {
        toast({ title: "Error", description: err.message || "No se pudo autenticar con biometría.", variant: "destructive" });
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, registerPasskey, authenticateWithPasskey, isSupported: isWebAuthnSupported() };
}
