import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutes
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll", "mousemove", "click"] as const;

export function useInactivityTimeout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isAuthenticatedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const logout = useCallback(async () => {
    // Double-check we're still authenticated before logging out
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;

    await supabase.auth.signOut();
    toast({
      title: "Sesión cerrada",
      description: "Tu sesión se cerró por inactividad.",
    });
  }, []);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    clearTimer();
    if (isAuthenticatedRef.current) {
      timerRef.current = setTimeout(logout, INACTIVITY_LIMIT_MS);
    }
  }, [logout, clearTimer]);

  // Handle visibility change - check elapsed time when tab becomes visible again
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === "visible" && isAuthenticatedRef.current) {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= INACTIVITY_LIMIT_MS) {
        logout();
      } else {
        clearTimer();
        timerRef.current = setTimeout(logout, INACTIVITY_LIMIT_MS - elapsed);
      }
    }
  }, [logout, clearTimer]);

  useEffect(() => {
    // Listen for auth state to only run when authenticated
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      isAuthenticatedRef.current = !!session;
      if (session) {
        resetTimer();
      } else {
        clearTimer();
      }
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      isAuthenticatedRef.current = !!session;
      if (session) resetTimer();
    });

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true });
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimer();
      subscription.unsubscribe();
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [resetTimer, clearTimer, handleVisibilityChange]);
}
