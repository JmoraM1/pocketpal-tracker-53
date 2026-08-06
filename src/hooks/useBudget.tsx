import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_CATEGORIES, getMonthKey } from "@/lib/constants";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import type { Tables } from "@/integrations/supabase/types";

type Budget = Tables<"monthly_budgets">;
type Expense = Tables<"expenses">;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (i + 1)));
    }
  }
  throw new Error("Max retries reached");
}

export function useBudget(userId: string | undefined, selectedMonth: Date) {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [cumulativeSavings, setCumulativeSavings] = useState(0);

  const monthKey = getMonthKey(selectedMonth);

  const loadData = useCallback(async (isRetry = false) => {
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

      // No default expenses — user adds their own categories
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

    // Calculate cumulative savings
    await calculateCumulativeSavings(userId, selectedMonth);

    setLoading(false);
  }, [userId, monthKey]);

  const calculateCumulativeSavings = async (uid: string, upToMonth: Date) => {
    // Get cumulative savings category names
    const { data: savingsCategories } = await supabase
      .from("user_categories")
      .select("name")
      .eq("user_id", uid)
      .eq("is_cumulative_savings", true);

    const savingsCatNames = savingsCategories?.map((c) => c.name) ?? [];
    if (savingsCatNames.length === 0) {
      setCumulativeSavings(0);
      return;
    }

    // Get all budgets up to and including this month
    const { data: allBudgets } = await supabase
      .from("monthly_budgets")
      .select("id, month")
      .eq("user_id", uid)
      .lte("month", getMonthKey(upToMonth))
      .order("month");

    if (!allBudgets || allBudgets.length === 0) {
      setCumulativeSavings(0);
      return;
    }

    let total = 0;
    for (const b of allBudgets) {
      const { data: savingsExpenses } = await supabase
        .from("expenses")
        .select("amount, category")
        .eq("budget_id", b.id)
        .in("category", savingsCatNames);

      if (savingsExpenses) {
        total += savingsExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      }
    }
    setCumulativeSavings(total);
  };

  // Reconnect handler
  useNetworkStatus(loadData);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateIncome = async (income: number) => {
    if (!budget) return;
    await supabase.from("monthly_budgets").update({ income }).eq("id", budget.id);
    setBudget({ ...budget, income });
  };

  const updateExpense = async (id: string, updates: { amount?: number; description?: string; is_paid?: boolean; category?: string; due_date?: string | null; frequency?: string }) => {
    await supabase.from("expenses").update(updates).eq("id", id);
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    if (userId) {
      await calculateCumulativeSavings(userId, selectedMonth);
    }
  };

  const addExpense = async (data: { category: string; amount: number; description: string; is_paid: boolean; due_date?: string | null; frequency?: string }) => {
    if (!userId || !budget) return;
    const { data: newExpense } = await supabase
      .from("expenses")
      .insert({
        user_id: userId,
        budget_id: budget.id,
        category: data.category,
        amount: data.amount,
        description: data.description,
        is_paid: data.is_paid,
        due_date: data.due_date ?? null,
        frequency: data.frequency ?? "unico",
      })
      .select()
      .single();

    if (newExpense) {
      setExpenses((prev) => [...prev, newExpense]);
      if (userId) {
        await calculateCumulativeSavings(userId, selectedMonth);
      }
    }
  };

  const deleteExpense = async (id: string) => {
    await supabase.from("expenses").delete().eq("id", id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (userId) {
      await calculateCumulativeSavings(userId, selectedMonth);
    }
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
      await supabase.from("expenses").delete().eq("budget_id", budget.id);
      const newExpenses = prevExpenses.map((e) => ({
        user_id: userId,
        budget_id: budget.id,
        category: e.category,
        amount: e.amount,
        description: e.description ?? "",
        is_paid: false,
        due_date: e.due_date,
        frequency: e.frequency,
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
    cumulativeSavings,
    updateIncome,
    updateExpense,
    addExpense,
    deleteExpense,
    copyFromPreviousMonth,
    reload: loadData,
  };
}
