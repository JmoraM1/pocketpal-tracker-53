import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutes
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll"] as const;

export function useInactivityTimeout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    toast({
      title: "Sesión cerrada",
      description: "Tu sesión se cerró por inactividad.",
    });
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, INACTIVITY_LIMIT_MS);
  }, [logout]);

  useEffect(() => {
    resetTimer();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true });
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer);
      }
    };
  }, [resetTimer]);
}
