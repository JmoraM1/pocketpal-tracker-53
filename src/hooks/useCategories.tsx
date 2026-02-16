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

    setCategories(data ? data.map((c) => c.name) : []);

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

  const editCategory = async (oldName: string, newName: string) => {
    if (!userId || categories.includes(newName)) return;
    const { error } = await supabase
      .from("user_categories")
      .update({ name: newName })
      .eq("user_id", userId)
      .eq("name", oldName);
    if (!error) {
      setCategories((prev) => prev.map((c) => (c === oldName ? newName : c)));
      // Also update expenses that use this category
      await supabase
        .from("expenses")
        .update({ category: newName })
        .eq("user_id", userId)
        .eq("category", oldName);
    }
  };

  return { categories, loading, addCategory, removeCategory, editCategory };
}
