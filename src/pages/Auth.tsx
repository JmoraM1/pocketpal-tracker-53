import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { toast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Wallet, AlertCircle, ArrowLeft, Eye, EyeOff, Fingerprint, Mail, Lock, ShieldCheck, CheckCircle2 } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [forgotSent, setForgotSent] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { signIn, signUp } = useAuth();
  const { loading: webauthnLoading, authenticateWithPasskey, isSupported: webauthnSupported } = useWebAuthn();

  useEffect(() => { setMounted(true); }, []);

  const validate = (emailOnly = false): boolean => {
    const newErrors: FormErrors = {};
    if (!email.trim()) newErrors.email = "El correo electrónico es obligatorio.";
    else if (!EMAIL_REGEX.test(email.trim())) newErrors.email = "El formato del correo no es válido.";
    if (!emailOnly) {
      if (!password) newErrors.password = "La contraseña es obligatoria.";
      else if (password.length < MIN_PASSWORD_LENGTH) newErrors.password = `Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(true)) return;
    setSubmitting(true);
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    setForgotSent(true);
    toast({ title: "Correo enviado", description: "Si el correo está registrado, recibirás un enlace de recuperación." });
    setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const { error } = view === "login" ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else if (view === "register") toast({ title: "Registro exitoso", description: "Revisa tu correo para confirmar tu cuenta." });
    setSubmitting(false);
  };

  const clearError = (field: keyof FormErrors) => setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });

  const inputClass = (hasError: boolean) =>
    `h-12 rounded-2xl border bg-background pl-11 text-[15px] transition-all duration-200 placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring/40 ${
      hasError ? "border-destructive/60 focus-visible:ring-destructive/30" : "border-border"
    }`;

  const subtitle =
    view === "forgot"
      ? forgotSent ? "Revisa tu bandeja de entrada" : "Recupera el acceso a tu cuenta"
      : view === "login" ? "Bienvenido de vuelta" : "Crea tu cuenta gratis";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Halo sutil de fondo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-[0.14] blur-[120px]"
        style={{ background: "hsl(var(--primary))" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-10rem] right-[-6rem] h-[420px] w-[420px] rounded-full opacity-[0.10] blur-[120px]"
        style={{ background: "hsl(var(--accent-cool))" }}
      />

      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={mounted ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* Marca */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-primary shadow-float">
            <Wallet className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">PocketPal Tracker</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {/* Tarjeta */}
        <div className="rounded-3xl border bg-card p-6 shadow-card sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={view + String(forgotSent)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {view === "forgot" ? (
                <>
                  {forgotSent ? (
                    <div className="flex flex-col items-center gap-3 py-4 text-center">
                      <span className="icon-tile h-14 w-14 bg-success/10 text-success">
                        <CheckCircle2 className="h-7 w-7" />
                      </span>
                      <p className="text-sm text-muted-foreground">
                        Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-5" noValidate>
                      <Field
                        id="email"
                        label="Correo electrónico"
                        icon={Mail}
                        error={errors.email}
                      >
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
                          placeholder="tu@correo.com"
                          className={inputClass(!!errors.email)}
                          aria-invalid={!!errors.email}
                        />
                      </Field>
                      <Button type="submit" disabled={submitting} className="h-12 w-full rounded-2xl text-[15px] font-semibold shadow-soft transition-all hover:shadow-float active:scale-[0.99]">
                        {submitting ? "Enviando..." : "Enviar enlace"}
                      </Button>
                    </form>
                  )}
                  <button
                    onClick={() => { setView("login"); setErrors({}); setForgotSent(false); }}
                    className="mx-auto mt-6 flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Volver al inicio
                  </button>
                </>
              ) : (
                <>
                  <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    <Field id="email" label="Correo electrónico" icon={Mail} error={errors.email}>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
                        placeholder="tu@correo.com"
                        className={inputClass(!!errors.email)}
                        aria-invalid={!!errors.email}
                      />
                    </Field>

                    <Field id="password" label="Contraseña" icon={Lock} error={errors.password}>
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
                        placeholder="••••••••"
                        className={`${inputClass(!!errors.password)} pr-12`}
                        aria-invalid={!!errors.password}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </Field>
                    {view === "register" && !errors.password && (
                      <p className="-mt-3 text-[11px] text-muted-foreground">Mínimo {MIN_PASSWORD_LENGTH} caracteres</p>
                    )}

                    {view === "login" && (
                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => { setView("forgot"); setErrors({}); }}
                          className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={submitting || webauthnLoading}
                      className="h-12 w-full rounded-2xl text-[15px] font-semibold shadow-soft transition-all hover:shadow-float active:scale-[0.99]"
                    >
                      {submitting ? "Cargando..." : view === "login" ? "Iniciar sesión" : "Crear cuenta"}
                    </Button>

                    {view === "login" && webauthnSupported && (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={webauthnLoading || submitting || !email.trim()}
                        onClick={async () => {
                          if (!email.trim()) { toast({ title: "Correo requerido", description: "Ingresa tu correo para usar biometría.", variant: "destructive" }); return; }
                          await authenticateWithPasskey(email.trim());
                        }}
                        className="h-12 w-full gap-2 rounded-2xl text-[15px] font-medium"
                      >
                        <Fingerprint className="h-4.5 w-4.5" />
                        {webauthnLoading ? "Verificando..." : "Huella / Face ID"}
                      </Button>
                    )}
                  </form>

                  <div className="my-6 border-t" />

                  <p className="text-center text-xs text-muted-foreground">
                    {view === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
                    <button
                      onClick={() => { setView(view === "login" ? "register" : "login"); setErrors({}); }}
                      className="font-semibold text-primary transition-colors hover:text-primary/80"
                    >
                      {view === "login" ? "Regístrate" : "Inicia sesión"}
                    </button>
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Tus datos viajan cifrados y solo tú puedes verlos
        </p>
      </motion.div>
    </div>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  error,
  children,
}: {
  id: string;
  label: string;
  icon: typeof Mail;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
      {error && (
        <p className="flex animate-fade-in items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
