import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useWebAuthn, isWebAuthnSupported } from "@/hooks/useWebAuthn";
import { toast } from "@/hooks/use-toast";
import { Wallet, AlertCircle, ArrowLeft, Eye, EyeOff, Fingerprint, TrendingUp, PiggyBank, ShieldCheck, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

type ViewMode = "login" | "register" | "forgot";

interface FormErrors {
  email?: string;
  password?: string;
}

const FEATURES = [
  { icon: BarChart3, title: "Visualiza tus gastos", desc: "Gráficos claros e intuitivos" },
  { icon: PiggyBank, title: "Ahorra más", desc: "Control total de tu presupuesto" },
  { icon: ShieldCheck, title: "100% Seguro", desc: "Tus datos siempre protegidos" },
  { icon: TrendingUp, title: "Crece financieramente", desc: "Decisiones basadas en datos" },
];

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

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const formContent = view === "forgot" ? (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Recuperar contraseña</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {forgotSent
            ? "Si el correo está registrado, recibirás un enlace."
            : "Ingresa tu correo para recibir un enlace de recuperación."}
        </p>
      </div>
      {!forgotSent && (
        <form onSubmit={handleForgotPassword} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
              placeholder="tu@correo.com"
              className={`h-12 rounded-xl bg-secondary/50 border-border/50 transition-all duration-200 focus:bg-card focus:shadow-lg focus:shadow-primary/10 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="flex items-center gap-1 text-sm text-destructive animate-fade-in">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.email}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300" disabled={submitting}>
            {submitting ? "Enviando..." : "Enviar enlace"}
          </Button>
        </form>
      )}
      <div className="mt-6 text-center">
        <button
          onClick={() => { setView("login"); setErrors({}); setForgotSent(false); }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al inicio de sesión
        </button>
      </div>
    </>
  ) : (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {view === "login" ? "Bienvenido de vuelta" : "Crea tu cuenta"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {view === "login" ? "Inicia sesión para gestionar tus finanzas" : "Comienza a controlar tus gastos hoy"}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
            placeholder="tu@correo.com"
            className={`h-12 rounded-xl bg-secondary/50 border-border/50 transition-all duration-200 focus:bg-card focus:shadow-lg focus:shadow-primary/10 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="flex items-center gap-1 text-sm text-destructive animate-fade-in">
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.email}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
              placeholder="••••••••"
              className={`h-12 rounded-xl bg-secondary/50 border-border/50 pr-12 transition-all duration-200 focus:bg-card focus:shadow-lg focus:shadow-primary/10 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
              aria-invalid={!!errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="flex items-center gap-1 text-sm text-destructive animate-fade-in">
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
              className="text-sm font-medium text-primary/80 hover:text-primary transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}
        <Button
          type="submit"
          className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          disabled={submitting || webauthnLoading}
        >
          {submitting ? "Cargando..." : view === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </Button>
        {view === "login" && webauthnSupported && (
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl gap-2 text-base border-border/50 hover:bg-secondary/80 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            disabled={webauthnLoading || submitting || !email.trim()}
            onClick={async () => {
              if (!email.trim()) {
                toast({ title: "Correo requerido", description: "Ingresa tu correo para usar biometría.", variant: "destructive" });
                return;
              }
              await authenticateWithPasskey(email.trim());
            }}
          >
            <Fingerprint className="h-5 w-5" />
            {webauthnLoading ? "Verificando..." : "Iniciar con huella / Face ID"}
          </Button>
        )}
      </form>
      <div className="mt-6 text-center text-sm text-muted-foreground">
        {view === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
        <button
          onClick={() => { setView(view === "login" ? "register" : "login"); setErrors({}); }}
          className="font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          {view === "login" ? "Regístrate gratis" : "Inicia sesión"}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding & features */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between overflow-hidden"
        style={{
          background: `linear-gradient(135deg, hsl(220 70% 50%), hsl(250 70% 60%), hsl(190 80% 50%))`,
        }}
      >
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, hsla(0,0%,100%,0.3), transparent 70%)",
              animation: "float 20s ease-in-out infinite",
            }}
          />
          <div className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full opacity-15"
            style={{
              background: "radial-gradient(circle, hsla(0,0%,100%,0.3), transparent 70%)",
              animation: "float 25s ease-in-out infinite reverse",
            }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-10"
            style={{
              background: "radial-gradient(circle, hsla(0,0%,100%,0.4), transparent 70%)",
              animation: "float 15s ease-in-out infinite 5s",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-center flex-1 px-12 xl:px-20">
          <div className={`transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="flex items-center gap-3 mb-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                <Wallet className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">Mis Finanzas</span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-6">
              Toma el control<br />
              de tu <span className="text-white/90" style={{ textShadow: "0 0 40px rgba(255,255,255,0.3)" }}>dinero</span>
            </h1>
            <p className="text-lg text-white/75 max-w-md mb-12">
              Organiza tus gastos, visualiza tu presupuesto y ahorra más cada mes con herramientas inteligentes.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className={`group flex items-start gap-3 rounded-2xl bg-white/10 backdrop-blur-sm p-4 hover:bg-white/20 transition-all duration-300 cursor-default ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                  style={{ transitionDelay: `${300 + i * 100}ms` }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors">
                    <f.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    <p className="text-xs text-white/60 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 px-12 xl:px-20 pb-8">
          <p className="text-xs text-white/40">© 2026 Mis Finanzas. Tu dinero, tu control.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-6 sm:p-8 lg:p-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
            <Wallet className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">Mis Finanzas</span>
        </div>

        <div
          className={`w-full max-w-[420px] transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          style={{ transitionDelay: "200ms" }}
        >
          {formContent}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
      `}</style>
    </div>
  );
}
