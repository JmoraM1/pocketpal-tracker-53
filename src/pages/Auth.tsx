import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Wallet, AlertCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

type ViewMode = "login" | "register" | "forgot";

interface FormErrors {
  email?: string;
  password?: string;
}

export default function Auth() {
  const [view, setView] = useState<ViewMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [forgotSent, setForgotSent] = useState(false);
  const { signIn, signUp } = useAuth();

  const validate = (emailOnly = false): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = "El formato del correo no es válido.";
    }

    if (!emailOnly) {
      if (!password) {
        newErrors.password = "La contraseña es obligatoria.";
      } else if (password.length < MIN_PASSWORD_LENGTH) {
        newErrors.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(true)) return;

    setSubmitting(true);
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    // Generic message — never reveal if email exists
    setForgotSent(true);
    toast({
      title: "Correo enviado",
      description: "Si el correo está registrado, recibirás un enlace de recuperación.",
    });
    setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    const { error } = view === "login"
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (view === "register") {
      toast({ title: "Registro exitoso", description: "Revisa tu correo para confirmar tu cuenta." });
    }
    setSubmitting(false);
  };

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  if (view === "forgot") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
              <Wallet className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Recuperar contraseña</CardTitle>
            <CardDescription>
              {forgotSent
                ? "Si el correo está registrado, recibirás un enlace de recuperación."
                : "Ingresa tu correo electrónico para recibir un enlace de recuperación."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!forgotSent ? (
              <form onSubmit={handleForgotPassword} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
                    placeholder="tu@correo.com"
                    className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && (
                    <p className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.email}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? "Enviando..." : "Enviar enlace"}
                </Button>
              </form>
            ) : null}
            <div className="mt-4 text-center">
              <button
                onClick={() => { setView("login"); setErrors({}); setForgotSent(false); }}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver al inicio de sesión
              </button>
            </div>
          </CardContent>
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
          <CardTitle className="text-2xl">Control de Finanzas</CardTitle>
          <CardDescription>
            {view === "login" ? "Inicia sesión para gestionar tus gastos" : "Crea tu cuenta para comenzar"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
                placeholder="tu@correo.com"
                className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.email}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
                placeholder="••••••••"
                className={errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.password}
                </p>
              )}
              {view === "register" && !errors.password && (
                <p className="text-xs text-muted-foreground">Mínimo {MIN_PASSWORD_LENGTH} caracteres.</p>
              )}
            </div>
            {view === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setView("forgot"); setErrors({}); }}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? "Cargando..." : view === "login" ? "Iniciar sesión" : "Registrarse"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {view === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button
              onClick={() => { setView(view === "login" ? "register" : "login"); setErrors({}); }}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {view === "login" ? "Regístrate" : "Inicia sesión"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
