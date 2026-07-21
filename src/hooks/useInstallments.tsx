import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMonthKey } from "@/lib/constants";

export interface InstallmentPlan {
  id: string;
  user_id: string;
  name: string;
  total_amount: number;
  num_installments: number;
  installment_amount: number;
  paid_installments: number;
  start_date: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstallmentPayment {
  id: string;
  plan_id: string;
  user_id: string;
  payment_number: number;
  due_month: string;
  amount: number;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
}

export function useInstallments(userId: string | undefined, selectedMonth: Date) {
  const [plans, setPlans] = useState<InstallmentPlan[]>([]);
  const [allPayments, setAllPayments] = useState<InstallmentPayment[]>([]);
  const [monthPayments, setMonthPayments] = useState<(InstallmentPayment & { plan_name: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const monthKey = getMonthKey(selectedMonth);

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // Load all plans
    const { data: plansData } = await supabase
      .from("installment_plans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const allPlans = (plansData ?? []) as unknown as InstallmentPlan[];

    // For completed plans, find their last payment month to determine visibility
    const completedPlanIds = allPlans.filter((p) => p.is_completed).map((p) => p.id);
    let lastPaymentMonths: Record<string, string> = {};
    
    if (completedPlanIds.length > 0) {
      // Get the last due_month for each completed plan
      const { data: lastPayments } = await supabase
        .from("installment_payments")
        .select("plan_id, due_month")
        .in("plan_id", completedPlanIds)
        .order("due_month", { ascending: false });
      
      if (lastPayments) {
        for (const p of lastPayments as any[]) {
          if (!lastPaymentMonths[p.plan_id]) {
            lastPaymentMonths[p.plan_id] = p.due_month;
          }
        }
      }
    }

    // Filter plans: hide completed plans in months AFTER their last payment month
    const visiblePlans = allPlans.filter((plan) => {
      if (!plan.is_completed) return true;
      const lastMonth = lastPaymentMonths[plan.id];
      if (!lastMonth) return true;
      // Show only if current month <= last payment month
      return monthKey <= lastMonth;
    });

    setPlans(visiblePlans);

    // Load payments for current month, excluding completed plans
    const completedVisibleIds = visiblePlans.filter((p) => p.is_completed).map((p) => p.id);
    const allCompletedIds = allPlans.filter((p) => p.is_completed).map((p) => p.id);
    
    let paymentsQuery = supabase
      .from("installment_payments")
      .select("*")
      .eq("user_id", userId)
      .eq("due_month", monthKey);

    // Filter out payments from completed plans (don't show in "cuotas del mes")
    if (allCompletedIds.length > 0) {
      paymentsQuery = paymentsQuery.not("plan_id", "in", `(${allCompletedIds.join(",")})`);
    }

    const { data: paymentsData } = await paymentsQuery;

    const payments = (paymentsData ?? []) as unknown as InstallmentPayment[];
    
    // Enrich payments with plan name
    const enriched = payments.map((p) => {
      const plan = allPlans.find((pl) => pl.id === p.plan_id);
      return { ...p, plan_name: plan?.name ?? "Desconocido" };
    });
    setMonthPayments(enriched);

    setLoading(false);
  }, [userId, monthKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createPlan = async (data: {
    name: string;
    total_amount: number;
    num_installments: number;
    start_date: string;
  }) => {
    if (!userId) return;
    const installment_amount = Math.round(data.total_amount / data.num_installments);

    const { data: newPlan, error } = await supabase
      .from("installment_plans")
      .insert({
        user_id: userId,
        name: data.name,
        total_amount: data.total_amount,
        num_installments: data.num_installments,
        installment_amount,
        start_date: data.start_date,
      })
      .select()
      .single();

    if (error || !newPlan) return;

    const plan = newPlan as unknown as InstallmentPlan;

    // Generate individual payments
    const payments = [];
    const startDate = new Date(data.start_date + "T12:00:00");
    for (let i = 0; i < data.num_installments; i++) {
      const dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      payments.push({
        plan_id: plan.id,
        user_id: userId,
        payment_number: i + 1,
        due_month: getMonthKey(dueDate),
        amount: installment_amount,
      });
    }

    await supabase.from("installment_payments").insert(payments);
    await loadData();
  };

  const togglePayment = async (paymentId: string, isPaid: boolean) => {
    if (!userId) return;

    await supabase
      .from("installment_payments")
      .update({
        is_paid: isPaid,
        paid_at: isPaid ? new Date().toISOString() : null,
      })
      .eq("id", paymentId);

    // Update plan's paid count
    const payment = monthPayments.find((p) => p.id === paymentId);
    if (payment) {
      // Recalculate since we already updated
      const { data: freshPayments } = await supabase
        .from("installment_payments")
        .select("is_paid")
        .eq("plan_id", payment.plan_id);

      const freshPaid = (freshPayments ?? []).filter((p: any) => p.is_paid).length;
      const plan = plans.find((p) => p.id === payment.plan_id);

      await supabase
        .from("installment_plans")
        .update({
          paid_installments: freshPaid,
          ...(plan && freshPaid >= plan.num_installments ? { is_completed: true } : {}),
        })
        .eq("id", payment.plan_id);
    }

    await loadData();
  };

  const updatePaymentAmount = async (paymentId: string, amount: number) => {
    if (!userId) return;
    await supabase
      .from("installment_payments")
      .update({ amount })
      .eq("id", paymentId);

    // Also update the plan's installment_amount so the active debts dashboard reflects it
    const payment = monthPayments.find((p) => p.id === paymentId);
    if (payment) {
      await supabase
        .from("installment_plans")
        .update({ installment_amount: amount })
        .eq("id", payment.plan_id);
    }

    await loadData();
  };

  const deletePlan = async (planId: string) => {
    await supabase.from("installment_plans").delete().eq("id", planId);
    await loadData();
  };

  // Summary calculations for current month
  const monthlyInstallmentTotal = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingCount = monthPayments.filter((p) => !p.is_paid).length;
  const pendingTotal = monthPayments.filter((p) => !p.is_paid).reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    plans,
    monthPayments,
    loading,
    createPlan,
    togglePayment,
    updatePaymentAmount,
    deletePlan,
    monthlyInstallmentTotal,
    pendingCount,
    pendingTotal,
    reload: loadData,
  };
}
