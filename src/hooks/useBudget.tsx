import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_CATEGORIES, getMonthKey } from "@/lib/constants";
import type { Tables } from "@/integrations/supabase/types";

type Budget = Tables<"monthly_budgets">;
type Expense = Tables<"expenses">;

export function useBudget(userId: string | undefined, selectedMonth: Date) {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const monthKey = getMonthKey(selectedMonth);

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // Get or create budget for month
    let { data: budgetData } = await supabase
      .from("monthly_budgets")
      .select("*")
      .eq("user_id", userId)
      .eq("month", monthKey)
      .maybeSingle();

    if (!budgetData) {
      const { data: newBudget } = await supabase
        .from("monthly_budgets")
        .insert({ user_id: userId, month: monthKey, income: 0 })
        .select()
        .single();
      budgetData = newBudget;

      // Create default expenses
      if (budgetData) {
        const defaultExpenses = DEFAULT_CATEGORIES.map((cat) => ({
          user_id: userId,
          budget_id: budgetData!.id,
          category: cat,
          amount: 0,
          description: "",
          is_paid: false,
        }));
        await supabase.from("expenses").insert(defaultExpenses);
      }
    }

    if (budgetData) {
      setBudget(budgetData);
      const { data: expensesData } = await supabase
        .from("expenses")
        .select("*")
        .eq("budget_id", budgetData.id)
        .order("created_at");
      setExpenses(expensesData ?? []);
    }

    setLoading(false);
  }, [userId, monthKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateIncome = async (income: number) => {
    if (!budget) return;
    await supabase.from("monthly_budgets").update({ income }).eq("id", budget.id);
    setBudget({ ...budget, income });
  };

  const updateExpense = async (id: string, updates: { amount?: number; description?: string; is_paid?: boolean }) => {
    await supabase.from("expenses").update(updates).eq("id", id);
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const copyFromPreviousMonth = async () => {
    if (!userId || !budget) return;
    const prevMonth = new Date(selectedMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevKey = getMonthKey(prevMonth);

    const { data: prevBudget } = await supabase
      .from("monthly_budgets")
      .select("*")
      .eq("user_id", userId)
      .eq("month", prevKey)
      .maybeSingle();

    if (!prevBudget) return;

    const { data: prevExpenses } = await supabase
      .from("expenses")
      .select("*")
      .eq("budget_id", prevBudget.id);

    if (prevExpenses && prevExpenses.length > 0) {
      await updateIncome(prevBudget.income);
      // Delete current expenses and recreate from previous
      await supabase.from("expenses").delete().eq("budget_id", budget.id);
      const newExpenses = prevExpenses.map((e) => ({
        user_id: userId,
        budget_id: budget.id,
        category: e.category,
        amount: e.amount,
        description: e.description ?? "",
        is_paid: false,
      }));
      await supabase.from("expenses").insert(newExpenses);
      await loadData();
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const available = Number(budget?.income ?? 0) - totalExpenses;
  const paidCount = expenses.filter((e) => e.is_paid).length;

  return {
    budget,
    expenses,
    loading,
    totalExpenses,
    available,
    paidCount,
    updateIncome,
    updateExpense,
    copyFromPreviousMonth,
    reload: loadData,
  };
}
