import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useT } from "@/lib/i18n";

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

function getWebAuthnErrorMessage(err: any): string | null {
  if (!err) return "Error desconocido.";
  
  switch (err.name) {
    case "NotAllowedError":
      return null; // User cancelled, don't show error
    case "AbortError":
      return null; // User cancelled
    case "InvalidStateError":
      return "Este dispositivo ya tiene una huella registrada.";
    case "SecurityError":
      return "Error de seguridad. Asegúrate de estar en una conexión segura (HTTPS).";
    case "NotSupportedError":
      return "Tu dispositivo no soporta este tipo de autenticación.";
    default:
      return err.message || "No se pudo completar la operación biométrica.";
  }
}

function getEdgeFunctionUrl(functionName: string): string {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  return `https://${projectId}.supabase.co/functions/v1/${functionName}`;
}

export interface WebAuthnCredential {
  id: string;
  device_name: string | null;
  created_at: string;
}

export function useWebAuthn() {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<WebAuthnCredential[]>([]);
  const [platformAvailable, setPlatformAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => {
          if (mounted) setPlatformAvailable(available);
        })
        .catch(() => {
          if (mounted) setPlatformAvailable(false);
        });
    }
    return () => {
      mounted = false;
    };
  }, []);

  const loadCredentials = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      setCredentials([]);
      return;
    }
    const { data, error } = await supabase
      .from("webauthn_credentials")
      .select("id, device_name, created_at")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setCredentials(data as WebAuthnCredential[]);
    }
  }, []);

  const removePasskey = useCallback(async (id: string) => {
    const { error } = await supabase.from("webauthn_credentials").delete().eq("id", id);
    if (error) {
      toast({ title: t("Error"), description: t("No se pudo eliminar la huella."), variant: "destructive" });
      return false;
    }
    toast({ title: t("Biometría desactivada"), description: t("La huella fue eliminada correctamente.") });
    await loadCredentials();
    return true;
  }, [loadCredentials, t]);

  const registerPasskey = useCallback(async () => {
    if (!isWebAuthnSupported()) {
      toast({
        title: t("No soportado"),
        description: t("Este dispositivo o navegador no admite autenticación biométrica."),
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("No hay sesión activa. Inicia sesión primero.");

      const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // 1. Get registration options
      const optionsRes = await fetch(getEdgeFunctionUrl("webauthn-register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey,
        },
        body: JSON.stringify({ action: "options" }),
      });

      if (!optionsRes.ok) {
        const errData = await optionsRes.json().catch(() => ({}));
        throw new Error(errData.error || "No se pudieron obtener las opciones de registro.");
      }
      const options = await optionsRes.json();
      if (!options?.challenge || !options?.user?.id || !options?.rp) {
        console.error("[webauthn] unexpected registration options", options);
        throw new Error("INVALID_OPTIONS");
      }

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

      if (!credential || !credential.rawId || !credential.response) throw new Error("CANCELLED");

      const response = credential.response as AuthenticatorAttestationResponse;

      // 3. Send FULL attestation to server for cryptographic verification
      const verifyRes = await fetch(getEdgeFunctionUrl("webauthn-register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey,
        },
        body: JSON.stringify({
          action: "verify",
          credential: {
            id: bufferToBase64Url(credential.rawId),
            rawId: bufferToBase64Url(credential.rawId),
            type: credential.type,
            clientExtensionResults: credential.getClientExtensionResults(),
            response: {
              attestationObject: bufferToBase64Url(response.attestationObject),
              clientDataJSON: bufferToBase64Url(response.clientDataJSON),
            },
          },
          deviceName: navigator.userAgent.includes("iPhone") || navigator.userAgent.includes("iPad")
            ? "iPhone/iPad"
            : navigator.userAgent.includes("Android")
              ? "Android"
              : "Computadora",
        }),
      });

      if (!verifyRes.ok) {
        const errData = await verifyRes.json().catch(() => ({}));
        throw new Error(errData.error || "No se pudo verificar el registro.");
      }

      toast({ title: t("¡Listo!"), description: t("Biometría activada correctamente.") });
      await loadCredentials();
      return true;
    } catch (err: any) {
      console.error("[webauthn] register error:", err?.name, err?.message);
      if (err?.name === "NotAllowedError" || err?.name === "AbortError" || err?.message === "CANCELLED") {
        toast({ title: t("Biometría"), description: t("No se activó la biometría.") });
        return false;
      }
      if (err?.name === "InvalidStateError") {
        toast({
          title: t("Biometría"),
          description: t("Este dispositivo ya tiene una huella registrada."),
          variant: "destructive",
        });
        return false;
      }
      if (err?.name === "NotSupportedError" || err?.name === "SecurityError") {
        toast({
          title: t("No soportado"),
          description: t("Este dispositivo o navegador no admite autenticación biométrica."),
          variant: "destructive",
        });
        return false;
      }
      toast({
        title: t("Error de registro"),
        description: t("No se pudo activar la biometría. Inténtalo de nuevo."),
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadCredentials, t]);

  const authenticateWithPasskey = useCallback(async (email: string) => {
    if (!isWebAuthnSupported()) {
      toast({
        title: t("No soportado"),
        description: t("Este dispositivo o navegador no admite autenticación biométrica."),
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    try {
      const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // 1. Get authentication options
      const optionsRes = await fetch(getEdgeFunctionUrl("webauthn-authenticate"), {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey },
        body: JSON.stringify({ action: "options", email }),
      });

      if (!optionsRes.ok) {
        const err = await optionsRes.json().catch(() => ({}));
        if (err.error === "No passkeys registered") {
          toast({
            title: t("Sin biometría"),
            description: t("No tienes huella registrada. Inicia sesión con contraseña y regístrala desde el menú."),
            variant: "destructive",
          });
          return false;
        }
        throw new Error(err.error || "No se pudieron obtener las opciones de autenticación.");
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

      if (!credential) throw new Error("Autenticación cancelada.");

      const response = credential.response as AuthenticatorAssertionResponse;

      // 3. Verify on server
      const verifyRes = await fetch(getEdgeFunctionUrl("webauthn-authenticate"), {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey },
        body: JSON.stringify({
          action: "verify",
          email,
          credential: {
            id: bufferToBase64Url(credential.rawId),
            rawId: bufferToBase64Url(credential.rawId),
            type: credential.type,
            clientExtensionResults: credential.getClientExtensionResults(),
            response: {
              authenticatorData: bufferToBase64Url(response.authenticatorData),
              clientDataJSON: bufferToBase64Url(response.clientDataJSON),
              signature: bufferToBase64Url(response.signature),
              userHandle: response.userHandle ? bufferToBase64Url(response.userHandle) : undefined,
            },
          },
        }),
      });

      if (!verifyRes.ok) {
        const errData = await verifyRes.json().catch(() => ({}));
        throw new Error(errData.error || "No se pudo verificar la huella.");
      }

      const result = await verifyRes.json();

      if (result.success && result.token_hash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: result.token_hash,
          type: "magiclink",
        });

        if (error) {
          console.error("[webauthn] verifyOtp failed:", error.message);
          throw new Error("No se pudo iniciar sesión. Intenta con tu contraseña.");
        }

        toast({ title: t("¡Bienvenido!"), description: t("Sesión iniciada con biometría.") });
        return true;
      }

      throw new Error("No se pudo completar la autenticación.");
    } catch (err: any) {
      const message = getWebAuthnErrorMessage(err);
      if (message) {
        toast({ title: t("Error de autenticación"), description: t(message), variant: "destructive" });
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    registerPasskey,
    authenticateWithPasskey,
    isSupported: isWebAuthnSupported(),
    credentials,
    loadCredentials,
    removePasskey,
    platformAvailable,
  };
}
