import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isSavingsCategory } from "@/lib/constants";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export interface CategoryInfo {
  name: string;
  is_cumulative_savings: boolean;
}

export function useCategories(userId: string | undefined) {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data } = await supabase
      .from("user_categories")
      .select("name, is_cumulative_savings")
      .eq("user_id", userId)
      .order("created_at");

    setCategories(data ? data.map((c) => ({ name: c.name, is_cumulative_savings: c.is_cumulative_savings })) : []);

    setLoading(false);
  }, [userId]);

  useNetworkStatus(loadCategories);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const addCategory = async (name: string, is_cumulative_savings = false) => {
    if (!userId || categories.some((c) => c.name === name)) return;
    const { error } = await supabase
      .from("user_categories")
      .insert({ user_id: userId, name, is_cumulative_savings });
    if (!error) {
      setCategories((prev) => [...prev, { name, is_cumulative_savings }]);
    }
  };

  const removeCategory = async (name: string) => {
    if (!userId) return;
    await supabase
      .from("user_categories")
      .delete()
      .eq("user_id", userId)
      .eq("name", name);
    setCategories((prev) => prev.filter((c) => c.name !== name));
  };

  const editCategory = async (oldName: string, newName: string) => {
    if (!userId || categories.some((c) => c.name === newName)) return;
    const { error } = await supabase
      .from("user_categories")
      .update({ name: newName })
      .eq("user_id", userId)
      .eq("name", oldName);
    if (!error) {
      setCategories((prev) => prev.map((c) => (c.name === oldName ? { ...c, name: newName } : c)));
      await supabase
        .from("expenses")
        .update({ category: newName })
        .eq("user_id", userId)
        .eq("category", oldName);
    }
  };

  const toggleCumulativeSavings = async (name: string, value: boolean) => {
    if (!userId) return;
    const { error } = await supabase
      .from("user_categories")
      .update({ is_cumulative_savings: value })
      .eq("user_id", userId)
      .eq("name", name);
    if (!error) {
      setCategories((prev) => prev.map((c) => (c.name === name ? { ...c, is_cumulative_savings: value } : c)));
    }
  };

  const categoryNames = categories.map((c) => c.name);

  return { categories, categoryNames, loading, addCategory, removeCategory, editCategory, toggleCumulativeSavings };
}
