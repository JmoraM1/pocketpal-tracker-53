import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMonthKey } from "@/lib/constants";
import { getActiveCurrency } from "@/lib/currency";
import type { Tables } from "@/integrations/supabase/types";

export type AdditionalIncome = Tables<"additional_incomes">;

/**
 * Ingresos adicionales del mes seleccionado.
 * Incluye los del propio mes y los marcados como recurrentes creados en meses anteriores.
 */
export function useAdditionalIncomes(userId: string | undefined, selectedMonth: Date) {
  const [incomes, setIncomes] = useState<AdditionalIncome[]>([]);
  const monthKey = getMonthKey(selectedMonth);

  const load = useCallback(async () => {
    if (!userId) {
      setIncomes([]);
      return;
    }
    const { data } = await supabase
      .from("additional_incomes")
      .select("*")
      .eq("user_id", userId)
      .lte("month", monthKey)
      .order("created_at");

    const list = (data ?? []).filter((i) => i.is_recurring || i.month === monthKey);
    setIncomes(list);
  }, [userId, monthKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const addIncome = async (name: string, amount: number, isRecurring: boolean) => {
    if (!userId) return;
    const { data } = await supabase
      .from("additional_incomes")
      .insert({
        user_id: userId,
        name,
        amount,
        month: monthKey,
        is_recurring: isRecurring,
        currency: getActiveCurrency(),
      })
      .select()
      .single();
    if (data) setIncomes((prev) => [...prev, data]);
  };

  const updateIncomeItem = async (
    id: string,
    updates: { name?: string; amount?: number; is_recurring?: boolean },
  ) => {
    await supabase.from("additional_incomes").update(updates).eq("id", id);
    setIncomes((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };

  const deleteIncome = async (id: string) => {
    await supabase.from("additional_incomes").delete().eq("id", id);
    setIncomes((prev) => prev.filter((i) => i.id !== id));
  };

  const additionalTotal = incomes.reduce((s, i) => s + Number(i.amount), 0);

  return { incomes, additionalTotal, addIncome, updateIncomeItem, deleteIncome, reload: load };
}
