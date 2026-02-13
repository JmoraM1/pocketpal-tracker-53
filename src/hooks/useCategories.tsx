import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_CATEGORIES } from "@/lib/constants";

export function useCategories(userId: string | undefined) {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data } = await supabase
      .from("user_categories")
      .select("name")
      .eq("user_id", userId)
      .order("created_at");

    if (data && data.length > 0) {
      setCategories(data.map((c) => c.name));
    } else {
      // First time: seed with defaults + Ahorro + Otro
      const defaults = [...DEFAULT_CATEGORIES, "Ahorro", "Otro"];
      const rows = defaults.map((name) => ({ user_id: userId, name }));
      await supabase.from("user_categories").insert(rows);
      setCategories(defaults);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const addCategory = async (name: string) => {
    if (!userId || categories.includes(name)) return;
    const { error } = await supabase
      .from("user_categories")
      .insert({ user_id: userId, name });
    if (!error) {
      setCategories((prev) => [...prev, name]);
    }
  };

  const removeCategory = async (name: string) => {
    if (!userId) return;
    await supabase
      .from("user_categories")
      .delete()
      .eq("user_id", userId)
      .eq("name", name);
    setCategories((prev) => prev.filter((c) => c !== name));
  };

  return { categories, loading: loading, addCategory, removeCategory };
}
