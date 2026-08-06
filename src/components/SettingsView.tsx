import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Fingerprint, KeyRound, LogOut, Mail, User } from "lucide-react";
import type { Profile } from "@/hooks/useProfile";

interface SettingsViewProps {
  email?: string;
  profile: Profile;
  onSaveProfile: (updates: Partial<Profile>) => void | Promise<void>;
  onRegisterPasskey: () => void;
  biometricSupported: boolean;
  biometricLoading: boolean;
  onSignOut: () => void;
}

export function SettingsView({
  email,
  profile,
  onSaveProfile,
  onRegisterPasskey,
  biometricSupported,
  biometricLoading,
  onSignOut,
}: SettingsViewProps) {
  const [alias, setAlias] = useState(profile.alias);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSaveProfile({ alias: alias.trim() });
    setSaving(false);
    toast({ title: "Perfil actualizado", description: "Tus datos se guardaron correctamente." });
  };

  const handlePassword = async () => {
    if (!email) return;
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    toast({ title: "Correo enviado", description: "Te enviamos un enlace para cambiar tu contraseña." });
  };

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
            <h3 className="font-display text-base font-semibold">Perfil</h3>
          </div>

          <div className="space-y-2">
            <Label>Alias</Label>
            <Input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Ej. Juan" />
            <p className="text-xs text-muted-foreground">Se usa en el saludo del inicio.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select value={profile.currency} onValueChange={(v) => onSaveProfile({ currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="COP">COP — Peso colombiano</SelectItem>
                  <SelectItem value="USD">USD — Dólar</SelectItem>
                  <SelectItem value="EUR">EUR — Euro</SelectItem>
                  <SelectItem value="MXN">MXN — Peso mexicano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Idioma</Label>
              <Select value={profile.language} onValueChange={(v) => onSaveProfile({ language: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Correo</Label>
            <Input value={email ?? ""} readOnly className="bg-muted text-muted-foreground" />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            Guardar cambios
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border shadow-soft">
        <CardContent className="space-y-3 p-6">
          <h3 className="font-display text-base font-semibold">Seguridad</h3>

          {biometricSupported && (
            <button
              onClick={onRegisterPasskey}
              disabled={biometricLoading}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-muted"
            >
              <Fingerprint className="h-4 w-4 text-primary" /> Biometría
            </button>
          )}

          <button
            onClick={handlePassword}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-muted"
          >
            <KeyRound className="h-4 w-4 text-info" /> Cambiar contraseña
          </button>

          <button
            onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
