import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Wallet, AlertCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useT } from "@/lib/i18n";

const MIN_PASSWORD_LENGTH = 6;

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const t = useT();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from the magic link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // User arrived via recovery link — they're now in a recovery session
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const validate = (): boolean => {
    const newErrors: { password?: string; confirm?: string } = {};

    if (!password) {
      newErrors.password = t("La contraseña es obligatoria.");
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      newErrors.password = t("Mínimo {n} caracteres.", { n: MIN_PASSWORD_LENGTH });
    }

    if (!confirmPassword) {
      newErrors.confirm = t("Confirma tu contraseña.");
    } else if (password !== confirmPassword) {
      newErrors.confirm = t("Las contraseñas no coinciden.");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({ title: t("Error"), description: error.message, variant: "destructive" });
    } else {
      setSuccess(true);
      toast({ title: t("¡Listo!"), description: t("Tu contraseña ha sido actualizada.") });
      setTimeout(() => navigate("/auth"), 3000);
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
              <CheckCircle2 className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">{t("Contraseña actualizada")}</CardTitle>
            <CardDescription>{t("Serás redirigido al inicio de sesión...")}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Wallet className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">{t("Nueva contraseña")}</CardTitle>
          <CardDescription>{t("Ingresa y confirma tu nueva contraseña")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="new-password">{t("Nueva contraseña")}</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((p) => { const n = { ...p }; delete n.password; return n; });
                }}
                placeholder={t("••••••••")}
                className={errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.password}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t("Confirmar contraseña")}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((p) => { const n = { ...p }; delete n.confirm; return n; });
                }}
                placeholder={t("••••••••")}
                className={errors.confirm ? "border-destructive focus-visible:ring-destructive" : ""}
                aria-invalid={!!errors.confirm}
              />
              {errors.confirm && (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.confirm}
                </p>
              )}
              {!errors.password && !errors.confirm && (
                <p className="text-xs text-muted-foreground">{t("Mínimo {n} caracteres.", { n: MIN_PASSWORD_LENGTH })}</p>
              )}
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? t("Guardando...") : t("Actualizar contraseña")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
