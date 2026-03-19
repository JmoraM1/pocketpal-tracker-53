import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import ModuleSelector from "@/pages/ModuleSelector";
import MotoDashboard from "@/pages/MotoDashboard";

const MOTO_ENABLED_EMAIL = "mora60774@gmail.com";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [selectedModule, setSelectedModule] = useState<"wallet" | "moto" | null>(null);
  useInactivityTimeout();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!user) return <Auth />;

  const isMotoUser = user.email === MOTO_ENABLED_EMAIL;

  // If user has moto access and hasn't selected a module, show selector
  if (isMotoUser && !selectedModule) {
    return <ModuleSelector onSelect={setSelectedModule} onSignOut={signOut} userEmail={user.email ?? ""} />;
  }

  // Moto dashboard
  if (selectedModule === "moto" && isMotoUser) {
    return <MotoDashboard userId={user.id} onBack={() => setSelectedModule(null)} />;
  }

  // Default: wallet/finance dashboard
  return <Dashboard />;
};

export default Index;
