import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  alias: string;
  currency: string;
  language: string;
}

const DEFAULT_PROFILE: Profile = { alias: "", currency: "COP", language: "es" };

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
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
      setProfile({
        alias: data.alias ?? "",
        currency: data.currency ?? "COP",
        language: data.language ?? "es",
      });
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveProfile = async (updates: Partial<Profile>) => {
    if (!userId) return;
    const next = { ...profile, ...updates };
    setProfile(next);
    await supabase.from("profiles").upsert({ id: userId, ...next });
  };

  return { profile, loading, saveProfile, reload: load };
}
