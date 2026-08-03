import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { toast } from "@/hooks/use-toast";
import { Wallet, AlertCircle, ArrowLeft, Eye, EyeOff, Fingerprint } from "lucide-react";
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
    `h-12 rounded-2xl border-0 bg-white/[0.07] text-white placeholder:text-white/30 backdrop-blur-md transition-all duration-300 focus:bg-white/[0.12] focus:ring-2 focus:ring-white/20 focus:shadow-[0_0_30px_rgba(255,255,255,0.06)] ${hasError ? "ring-2 ring-red-400/60" : ""}`;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Animated gradient background */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(140deg, hsl(230 40% 12%) 0%, hsl(250 50% 18%) 30%, hsl(220 60% 14%) 60%, hsl(200 50% 10%) 100%)",
      }} />

      {/* Floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[20%] w-[300px] h-[300px] rounded-full opacity-30 blur-[100px]"
          style={{ background: "hsl(158 58% 40%)", animation: "orb1 18s ease-in-out infinite" }} />
        <div className="absolute bottom-[10%] right-[15%] w-[250px] h-[250px] rounded-full opacity-25 blur-[90px]"
          style={{ background: "hsl(200 60% 40%)", animation: "orb2 22s ease-in-out infinite" }} />
        <div className="absolute top-[60%] left-[60%] w-[200px] h-[200px] rounded-full opacity-20 blur-[80px]"
          style={{ background: "hsl(158 60% 50%)", animation: "orb3 15s ease-in-out infinite" }} />
      </div>

      {/* Glass card */}
      <div className={`relative z-10 w-full max-w-[400px] transition-all duration-700 ease-out ${mounted ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-8"}`}>
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-primary-glow opacity-80 blur-lg" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow shadow-2xl shadow-primary/30">
              <Wallet className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Mis Finanzas</h1>
          <p className="mt-1.5 text-sm text-white/40">
            {view === "forgot"
              ? (forgotSent ? "Revisa tu bandeja de entrada" : "Recupera el acceso a tu cuenta")
              : view === "login" ? "Bienvenido de vuelta" : "Crea tu cuenta gratis"}
          </p>
        </div>

        {/* Glass form container */}
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-7 backdrop-blur-xl shadow-[0_8px_60px_rgba(0,0,0,0.4)]">
          {view === "forgot" ? (
            <>
              {!forgotSent && (
                <form onSubmit={handleForgotPassword} className="space-y-5" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-medium text-white/50 uppercase tracking-wider">Correo electrónico</Label>
                    <Input id="email" type="email" value={email}
                      onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
                      placeholder="tu@correo.com" className={inputClass(!!errors.email)} aria-invalid={!!errors.email} />
                    {errors.email && <p className="flex items-center gap-1 text-xs text-red-400 animate-fade-in"><AlertCircle className="h-3 w-3" />{errors.email}</p>}
                  </div>
                  <Button type="submit" disabled={submitting}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-primary-glow text-white font-semibold text-sm border-0 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98] transition-all duration-300">
                    {submitting ? "Enviando..." : "Enviar enlace"}
                  </Button>
                </form>
              )}
              <button onClick={() => { setView("login"); setErrors({}); setForgotSent(false); }}
                className="mt-5 flex items-center gap-1.5 mx-auto text-xs font-medium text-white/40 hover:text-white/70 transition-colors">
                <ArrowLeft className="h-3 w-3" /> Volver al inicio
              </button>
            </>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-medium text-white/50 uppercase tracking-wider">Correo electrónico</Label>
                  <Input id="email" type="email" value={email}
                    onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
                    placeholder="tu@correo.com" className={inputClass(!!errors.email)} aria-invalid={!!errors.email} />
                  {errors.email && <p className="flex items-center gap-1 text-xs text-red-400 animate-fade-in"><AlertCircle className="h-3 w-3" />{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-medium text-white/50 uppercase tracking-wider">Contraseña</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} value={password}
                      onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
                      placeholder="••••••••" className={`${inputClass(!!errors.password)} pr-12`} aria-invalid={!!errors.password} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="flex items-center gap-1 text-xs text-red-400 animate-fade-in"><AlertCircle className="h-3 w-3" />{errors.password}</p>}
                  {view === "register" && !errors.password && <p className="text-[11px] text-white/25">Mínimo {MIN_PASSWORD_LENGTH} caracteres</p>}
                </div>

                {view === "login" && (
                  <div className="text-right">
                    <button type="button" onClick={() => { setView("forgot"); setErrors({}); }}
                      className="text-xs text-white/35 hover:text-white/60 transition-colors">
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                )}

                <Button type="submit" disabled={submitting || webauthnLoading}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-primary-glow text-white font-semibold text-sm border-0 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98] transition-all duration-300">
                  {submitting ? "Cargando..." : view === "login" ? "Iniciar sesión" : "Crear cuenta"}
                </Button>

                {view === "login" && webauthnSupported && (
                  <button type="button" disabled={webauthnLoading || submitting || !email.trim()}
                    onClick={async () => {
                      if (!email.trim()) { toast({ title: "Correo requerido", description: "Ingresa tu correo para usar biometría.", variant: "destructive" }); return; }
                      await authenticateWithPasskey(email.trim());
                    }}
                    className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl border border-white/[0.08] bg-white/[0.04] text-white/60 text-sm font-medium hover:bg-white/[0.08] hover:text-white/80 active:scale-[0.98] transition-all duration-300 disabled:opacity-30">
                    <Fingerprint className="h-4.5 w-4.5" />
                    {webauthnLoading ? "Verificando..." : "Huella / Face ID"}
                  </button>
                )}
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]" /></div>
              </div>

              <p className="text-center text-xs text-white/30">
                {view === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
                <button onClick={() => { setView(view === "login" ? "register" : "login"); setErrors({}); }}
                  className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                  {view === "login" ? "Regístrate" : "Inicia sesión"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes orb1 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(60px, -40px); }
          66% { transform: translate(-30px, 50px); }
        }
        @keyframes orb2 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(-50px, 30px); }
          66% { transform: translate(40px, -60px); }
        }
        @keyframes orb3 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(30px, 40px); }
          66% { transform: translate(-50px, -20px); }
        }
      `}</style>
    </div>
  );
}
