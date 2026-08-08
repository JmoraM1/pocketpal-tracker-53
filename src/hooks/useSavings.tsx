import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMonthKey } from "@/lib/constants";
import { getActiveCurrency } from "@/lib/currency";

export type SavingsGoal = {
  id: string;
  name: string;
  target_amount: number;
  is_completed: boolean;
  currency: string;
};

export type GoalContribution = {
  id: string;
  goal_id: string;
  month: string;
  amount: number;
  created_at: string;
};

export type FreeSaving = {
  id: string;
  name: string;
  currency: string;
};

export type FreeContribution = {
  id: string;
  saving_id: string;
  month: string;
  amount: number;
  created_at: string;
};

export function useSavings(userId: string | undefined, selectedMonth: Date) {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [goalContribs, setGoalContribs] = useState<GoalContribution[]>([]);
  const [freeSavings, setFreeSavings] = useState<FreeSaving[]>([]);
  const [freeContribs, setFreeContribs] = useState<FreeContribution[]>([]);
  const [loading, setLoading] = useState(true);

  const monthKey = getMonthKey(selectedMonth);

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [g, gc, f, fc] = await Promise.all([
      supabase.from("savings_goals").select("*").eq("user_id", userId).order("created_at"),
      supabase.from("savings_goal_contributions").select("*").eq("user_id", userId),
      supabase.from("free_savings").select("*").eq("user_id", userId).order("created_at"),
      supabase.from("free_savings_contributions").select("*").eq("user_id", userId),
    ]);
    setGoals((g.data ?? []) as SavingsGoal[]);
    setGoalContribs((gc.data ?? []) as GoalContribution[]);
    setFreeSavings((f.data ?? []) as FreeSaving[]);
    setFreeContribs((fc.data ?? []) as FreeContribution[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  // --- GOALS ---
  const createGoal = async (name: string, target: number, initial: number = 0) => {
    if (!userId) return;
    const { data } = await supabase
      .from("savings_goals")
      .insert({ user_id: userId, name, target_amount: target, currency: getActiveCurrency() })
      .select()
      .single();
    if (data && initial > 0) {
      await supabase.from("savings_goal_contributions").insert({
        user_id: userId, goal_id: data.id, month: monthKey, amount: initial,
      });
      if (initial >= target && target > 0) {
        await supabase.from("savings_goals").update({ is_completed: true }).eq("id", data.id);
      }
    }
    await loadData();
  };

  const updateGoal = async (id: string, updates: Partial<Pick<SavingsGoal, "name" | "target_amount">>) => {
    await supabase.from("savings_goals").update(updates).eq("id", id);

    if (updates.target_amount !== undefined && Number(updates.target_amount) > 0) {
      const totalForGoal = goalContribs
        .filter((c) => c.goal_id === id)
        .reduce((sum, c) => sum + Number(c.amount), 0);

      if (totalForGoal >= Number(updates.target_amount)) {
        await supabase.from("savings_goals").update({ is_completed: true }).eq("id", id);
      }
    }

    await loadData();
  };

  const deleteGoal = async (id: string) => {
    await supabase.from("savings_goals").delete().eq("id", id);
    await loadData();
  };

  const setGoalContribution = async (goalId: string, amount: number) => {
    if (!userId || amount <= 0) return;
    await supabase.from("savings_goal_contributions").insert({
      user_id: userId, goal_id: goalId, month: monthKey, amount,
    });
    // Check completion
    const totalForGoal = goalContribs
      .filter((c) => c.goal_id === goalId)
      .reduce((s, c) => s + Number(c.amount), 0) + amount;
    const goal = goals.find((g) => g.id === goalId);
    if (goal && !goal.is_completed && totalForGoal >= Number(goal.target_amount) && Number(goal.target_amount) > 0) {
      await supabase.from("savings_goals").update({ is_completed: true }).eq("id", goalId);
    }
    await loadData();
  };

  const deleteGoalContribution = async (id: string) => {
    await supabase.from("savings_goal_contributions").delete().eq("id", id);
    await loadData();
  };

  // --- FREE SAVINGS ---
  const createFreeSaving = async (name: string, initial: number = 0) => {
    if (!userId) return;
    const { data } = await supabase
      .from("free_savings")
      .insert({ user_id: userId, name, currency: getActiveCurrency() })
      .select()
      .single();
    if (data && initial > 0) {
      await supabase.from("free_savings_contributions").insert({
        user_id: userId, saving_id: data.id, month: monthKey, amount: initial,
      });
    }
    await loadData();
  };

  const updateFreeSaving = async (id: string, name: string) => {
    await supabase.from("free_savings").update({ name }).eq("id", id);
    await loadData();
  };

  const deleteFreeSaving = async (id: string) => {
    await supabase.from("free_savings").delete().eq("id", id);
    await loadData();
  };

  const setFreeContribution = async (savingId: string, amount: number) => {
    if (!userId || amount <= 0) return;
    await supabase.from("free_savings_contributions").insert({
      user_id: userId, saving_id: savingId, month: monthKey, amount,
    });
    await loadData();
  };

  const deleteFreeContribution = async (id: string) => {
    await supabase.from("free_savings_contributions").delete().eq("id", id);
    await loadData();
  };

  const goalTotal = (goalId: string) =>
    goalContribs.filter((c) => c.goal_id === goalId).reduce((s, c) => s + Number(c.amount), 0);

  const goalMonthAmount = (goalId: string) =>
    goalContribs.filter((c) => c.goal_id === goalId && c.month === monthKey)
      .reduce((s, c) => s + Number(c.amount), 0);

  const freeTotal = (savingId: string) =>
    freeContribs.filter((c) => c.saving_id === savingId).reduce((s, c) => s + Number(c.amount), 0);

  const freeMonthAmount = (savingId: string) =>
    freeContribs.filter((c) => c.saving_id === savingId && c.month === monthKey)
      .reduce((s, c) => s + Number(c.amount), 0);

  const isGoalCompleted = (goal: SavingsGoal) => {
    const target = Number(goal.target_amount);
    return goal.is_completed || (target > 0 && goalTotal(goal.id) >= target);
  };

  const activeGoals = goals.filter((g) => !isGoalCompleted(g));
  const completedGoals = goals.filter((g) => isGoalCompleted(g));

  return {
    loading,
    goals, activeGoals, completedGoals, goalContribs,
    freeSavings, freeContribs,
    createGoal, updateGoal, deleteGoal, setGoalContribution, deleteGoalContribution,
    createFreeSaving, updateFreeSaving, deleteFreeSaving, setFreeContribution, deleteFreeContribution,
    goalTotal, goalMonthAmount, freeTotal, freeMonthAmount,
    monthKey,
  };
}
