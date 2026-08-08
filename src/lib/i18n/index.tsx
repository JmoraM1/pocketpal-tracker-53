import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { EN } from "./en";
import { setActiveCurrency } from "@/lib/currency";

export type Language = "es" | "en";

const STORAGE_KEY = "app.language";

interface I18nValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  /** Translate a Spanish source string. Falls back to the Spanish text. */
  t: (es: string, vars?: Record<string, string | number>) => string;
  locale: string;
}

const I18nContext = createContext<I18nValue | null>(null);

function interpolate(text: string, vars?: Record<string, string | number>) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export function readStoredLanguage(): Language {
  if (typeof window === "undefined") return "es";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "en" ? "en" : "es";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    setUiLocale(language === "en" ? "en-US" : "es-CO");
  }, [language]);

  const value = useMemo<I18nValue>(() => {
    const t = (es: string, vars?: Record<string, string | number>) =>
      interpolate(language === "en" ? EN[es] ?? es : es, vars);
    return { language, setLanguage, t, locale: language === "en" ? "en-US" : "es-CO" };
  }, [language, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Safe fallback so components can render outside the provider (tests, etc.)
    return { language: "es", setLanguage: () => {}, t: (es) => es, locale: "es-CO" };
  }
  return ctx;
}

/** Shorthand: const t = useT(); t("Guardar") */
export function useT() {
  return useI18n().t;
}

export { setActiveCurrency };
