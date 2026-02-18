import { useAuth } from "@/hooks/useAuth";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";

const Index = () => {
  const { user, loading } = useAuth();
  useInactivityTimeout();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Auth />;
};

export default Index;
