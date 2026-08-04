import { useCallback, useEffect, useState } from "react";

export interface ProfilePrefs {
  alias: string;
  currency: string;
  language: string;
}

const STORAGE_KEY = "pocketpal:profile-prefs";

const DEFAULTS: ProfilePrefs = {
  alias: "",
  currency: "COP",
  language: "es",
};

function read(): ProfilePrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

/** Preferencias de presentación (solo UI, almacenadas localmente). */
export function useProfilePrefs() {
  const [prefs, setPrefs] = useState<ProfilePrefs>(DEFAULTS);

  useEffect(() => {
    setPrefs(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setPrefs(read());
    };
    window.addEventListener("storage", onStorage);
    const onLocal = () => setPrefs(read());
    window.addEventListener("pocketpal:prefs-changed", onLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pocketpal:prefs-changed", onLocal);
    };
  }, []);

  const savePrefs = useCallback((next: Partial<ProfilePrefs>) => {
    const merged = { ...read(), ...next };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    setPrefs(merged);
    window.dispatchEvent(new Event("pocketpal:prefs-changed"));
  }, []);

  return { prefs, savePrefs };
}
