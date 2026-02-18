import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "@/hooks/use-toast";

export function useNetworkStatus(onReconnect?: () => void) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const wasOfflineRef = useRef(false);
  const onReconnectRef = useRef(onReconnect);
  onReconnectRef.current = onReconnect;

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    if (wasOfflineRef.current) {
      toast({
        title: "Conexión restaurada",
        description: "Recargando datos...",
      });
      wasOfflineRef.current = false;
      // Small delay to let the network stabilize
      setTimeout(() => onReconnectRef.current?.(), 1500);
    }
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    wasOfflineRef.current = true;
    toast({
      title: "Sin conexión",
      description: "Se reintentará automáticamente cuando vuelvas a tener red.",
      variant: "destructive",
    });
  }, []);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return isOnline;
}
