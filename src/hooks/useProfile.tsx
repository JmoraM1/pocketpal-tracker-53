import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { setActiveCurrency } from "@/lib/currency";
import { useI18n, type Language } from "@/lib/i18n";

export interface Profile {
  alias: string;
  currency: string;
  language: string;
}

const DEFAULT_PROFILE: Profile = { alias: "", currency: "COP", language: "es" };

export function useProfile(userId: string | undefined) {
  const { language, setLanguage } = useI18n();
  const [profile, setProfile] = useState<Profile>({ ...DEFAULT_PROFILE, language });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("alias, currency, language")
      .eq("id", userId)
      .maybeSingle();
    if (data) {
      const next: Profile = {
        alias: data.alias ?? "",
        currency: data.currency ?? "COP",
        language: data.language ?? "es",
      };
      setProfile(next);
      setActiveCurrency(next.currency);
      setLanguage(next.language === "en" ? "en" : "es");
    }
    setLoading(false);
  }, [userId, setLanguage]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the money formatter in sync with the selected currency.
  useEffect(() => {
    setActiveCurrency(profile.currency);
  }, [profile.currency]);

  const saveProfile = async (updates: Partial<Profile>) => {
    if (!userId) return;
    const next = { ...profile, ...updates };
    const { error } = await supabase.from("profiles").upsert({ id: userId, ...next });

    if (error) throw error;

    // Apply user-facing preferences only after the profile was saved successfully.
    setProfile(next);
    setActiveCurrency(next.currency);
    if (updates.language) {
      setLanguage((updates.language === "en" ? "en" : "es") as Language);
    }
  };

  return { profile, loading, saveProfile, reload: load };
}
