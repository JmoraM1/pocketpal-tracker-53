import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Fingerprint, KeyRound, LogOut, Mail, Trash2, User } from "lucide-react";
import type { Profile } from "@/hooks/useProfile";
import { useT, useI18n } from "@/lib/i18n";
import { CURRENCIES } from "@/lib/currency";
import type { WebAuthnCredential } from "@/hooks/useWebAuthn";

interface SettingsViewProps {
  email?: string;
  profile: Profile;
  onSaveProfile: (updates: Partial<Profile>) => void | Promise<void>;
  onRegisterPasskey: () => void;
  biometricSupported: boolean;
  biometricLoading: boolean;
  onSignOut: () => void;
  passkeys: WebAuthnCredential[];
  onRemovePasskey: (id: string) => void | Promise<void>;
  biometricPlatformAvailable: boolean;
}

export function SettingsView({
  email,
  profile,
  onSaveProfile,
  onRegisterPasskey,
  biometricSupported,
  biometricLoading,
  onSignOut,
  passkeys,
  onRemovePasskey,
  biometricPlatformAvailable,
}: SettingsViewProps) {
  const t = useT();
  const { language } = useI18n();
  const [alias, setAlias] = useState(profile.alias);
  // Pending (unsaved) language selection: only applied on "Guardar cambios".
  const [pendingLanguage, setPendingLanguage] = useState(profile.language);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAlias(profile.alias);
    setPendingLanguage(profile.language);
  }, [profile.alias, profile.language]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveProfile({ alias: alias.trim(), language: pendingLanguage });
      toast({ title: t("Perfil actualizado"), description: t("Tus datos se guardaron correctamente.") });
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async () => {
    if (!email) return;
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    toast({ title: t("Correo enviado"), description: t("Te enviamos un enlace para cambiar tu contraseña.") });
  };

  const biometricEnabled = passkeys.length > 0;
  const canUseBiometrics = biometricSupported && biometricPlatformAvailable;
  const locale = language === "en" ? "en-US" : "es-ES";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-2xl space-y-5"
    >
      <Card className="rounded-2xl border shadow-soft">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-semibold">{t("Perfil")}</h3>
          </div>

          <div className="space-y-2">
            <Label>{t("Alias")}</Label>
            <Input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder={t("Ej. Juan")} />
            <p className="text-xs text-muted-foreground">{t("Se usa en el saludo del inicio.")}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("Moneda")}</Label>
              <Select value={profile.currency} onValueChange={(v) => onSaveProfile({ currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {language === "en" ? c.labelEn : c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("Idioma")}</Label>
              <Select value={pendingLanguage} onValueChange={setPendingLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">{t("Español")}</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
              {pendingLanguage !== profile.language && (
                <p className="text-xs text-muted-foreground">
                  {t("Pulsa \u201cGuardar cambios\u201d para aplicar el idioma.")}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {t("Correo")}</Label>
            <Input value={email ?? ""} readOnly className="bg-muted text-muted-foreground" />
          </div>

          <Button onClick={handleSave} disabled={saving} className="btn-compact w-full md:w-auto">
            {t("Guardar cambios")}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border shadow-soft">
        <CardContent className="space-y-3 p-6">
          <h3 className="font-display text-base font-semibold">{t("Seguridad")}</h3>

          <div className="space-y-3 rounded-xl border px-3 py-3">
            <div className="row-item justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Fingerprint className="h-4 w-4 text-primary" /> {t("Biometría")}
              </div>
              <Badge variant={biometricEnabled ? "default" : "secondary"}>
                {biometricEnabled ? t("Activada") : t("Desactivada")}
              </Badge>
            </div>

            {!canUseBiometrics ? (
              <p className="text-xs text-muted-foreground">
                {t("Tu dispositivo o navegador no es compatible con la autenticación biométrica.")}
              </p>
            ) : (
              <>
                {passkeys.length > 0 && (
                  <ul className="space-y-2">
                    {passkeys.map((p) => (
                      <li key={p.id} className="row-item justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs">
                        <div>
                          <p className="font-medium text-foreground">{p.device_name ?? t("Biometría")}</p>
                          <p className="text-muted-foreground">
                            {t("Registrado el {date}").replace(
                              "{date}",
                              new Date(p.created_at).toLocaleDateString(locale)
                            )}
                          </p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("¿Desactivar biometría?")}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("¿Estás seguro de que deseas eliminar esta huella? Podrás volver a registrarla cuando quieras.")}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t("Cancelar")}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onRemovePasskey(p.id)}>
                                {t("Desactivar")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </li>
                    ))}
                  </ul>
                )}

                {!biometricEnabled && (
                  <Button
                    onClick={onRegisterPasskey}
                    disabled={biometricLoading}
                    variant="secondary"
                    className="w-full"
                  >
                    <Fingerprint className="h-4 w-4" /> {t("Activar biometría")}
                  </Button>
                )}
              </>
            )}
          </div>

          <button
            onClick={handlePassword}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-muted"
          >
            <KeyRound className="h-4 w-4 text-info" /> {t("Cambiar contraseña")}
          </button>

          <button
            onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" /> {t("Cerrar sesión")}
          </button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
