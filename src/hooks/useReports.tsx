import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMonthKey } from "@/lib/constants";

export type ReportPeriodId = "current" | "previous" | "last3" | "custom";

export interface ReportItem {
  /** Concepto: categoría del gasto o nombre de la deuda */
  name: string;
  type: "gasto" | "deuda";
  amount: number;
  /** Fecha identificable del movimiento (YYYY-MM-DD) */
  date: string;
  category: string;
  description: string;
}


export interface CategoryTotal {
  name: string;
  type: "gasto" | "deuda";
  amount: number;
  /** Monto del período anterior */
  prev: number;
}

export interface ReportData {
  items: ReportItem[];
  totals: CategoryTotal[];
  totalOut: number;
  prevTotalOut: number;
  income: number;
  available: number;
  prevAvailable: number;
  categoriesUsed: number;
  prevCategoriesUsed: number;
  biggest: { name: string; type: "gasto" | "deuda"; amount: number } | null;
  loading: boolean;
}

function monthsBetween(from: Date, to: Date): string[] {
  const out: string[] = [];
  const cur = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  while (cur <= end) {
    out.push(getMonthKey(cur));
    cur.setMonth(cur.getMonth() + 1);
  }
  return out;
}

/** Meses del período seleccionado y del período anterior (misma longitud) */
export function resolvePeriod(
  period: ReportPeriodId,
  selectedMonth: Date,
  custom?: { from?: Date; to?: Date },
): { months: string[]; prevMonths: string[] } {
  let from: Date;
  let to: Date;
  const base = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);

  if (period === "previous") {
    from = new Date(base.getFullYear(), base.getMonth() - 1, 1);
    to = from;
  } else if (period === "last3") {
    from = new Date(base.getFullYear(), base.getMonth() - 2, 1);
    to = base;
  } else if (period === "custom" && custom?.from) {
    from = new Date(custom.from.getFullYear(), custom.from.getMonth(), 1);
    const end = custom.to ?? custom.from;
    to = new Date(end.getFullYear(), end.getMonth(), 1);
    if (to < from) to = from;
  } else {
    from = base;
    to = base;
  }

  const months = monthsBetween(from, to);
  const len = months.length;
  const prevTo = new Date(from.getFullYear(), from.getMonth() - 1, 1);
  const prevFrom = new Date(prevTo.getFullYear(), prevTo.getMonth() - (len - 1), 1);
  return { months, prevMonths: monthsBetween(prevFrom, prevTo) };
}

async function fetchPeriod(userId: string, months: string[]) {
  if (months.length === 0) return { items: [] as ReportItem[], income: 0 };

  const [{ data: budgets }, { data: payments }, { data: extraIncomes }] = await Promise.all([
    supabase.from("monthly_budgets").select("id, income, month").eq("user_id", userId).in("month", months),
    supabase
      .from("installment_payments")
      .select("amount, plan_id, due_month, paid_at")
      .eq("user_id", userId)
      .in("due_month", months),
    supabase.from("additional_incomes").select("amount").eq("user_id", userId).in("month", months),
  ]);

  const budgetMonth: Record<string, string> = {};
  for (const b of budgets ?? []) budgetMonth[b.id] = b.month;

  const budgetIds = (budgets ?? []).map((b) => b.id);
  let expenses: {
    category: string;
    amount: number;
    description: string | null;
    due_date: string | null;
    created_at: string;
    budget_id: string;
  }[] = [];
  if (budgetIds.length > 0) {
    const { data } = await supabase
      .from("expenses")
      .select("category, amount, description, due_date, created_at, budget_id")
      .in("budget_id", budgetIds);
    expenses = (data ?? []) as typeof expenses;
  }

  const planIds = Array.from(new Set((payments ?? []).map((p) => p.plan_id)));
  const planNames: Record<string, string> = {};
  if (planIds.length > 0) {
    const { data } = await supabase.from("installment_plans").select("id, name").in("id", planIds);
    for (const p of data ?? []) planNames[p.id] = p.name;
  }

  const items: ReportItem[] = [
    ...expenses.map((e) => ({
      name: e.category,
      type: "gasto" as const,
      amount: Number(e.amount),
      date: e.due_date ?? budgetMonth[e.budget_id] ?? e.created_at.slice(0, 10),
      category: e.category,
      description: e.description ?? "",
    })),
    // Las deudas se contabilizan SOLO por la cuota del período
    ...(payments ?? []).map((p) => ({
      name: planNames[p.plan_id] ?? "Deuda",
      type: "deuda" as const,
      amount: Number(p.amount),
      date: (p.paid_at ?? p.due_month).slice(0, 10),
      category: planNames[p.plan_id] ?? "Deuda",
      description: "",
    })),
  ].filter((i) => i.amount > 0);


  const income =
    (budgets ?? []).reduce((s, b) => s + Number(b.income), 0) +
    (extraIncomes ?? []).reduce((s, i) => s + Number(i.amount), 0);

  return { items, income };
}

function groupItems(items: ReportItem[]) {
  const map = new Map<string, { name: string; type: "gasto" | "deuda"; amount: number }>();
  for (const it of items) {
    const key = `${it.type}::${it.name}`;
    const found = map.get(key);
    if (found) found.amount += it.amount;
    else map.set(key, { ...it });
  }
  return map;
}

export function useReports(
  userId: string | undefined,
  period: ReportPeriodId,
  selectedMonth: Date,
  custom?: { from?: Date; to?: Date },
): ReportData & { months: string[]; prevMonths: string[]; reload: () => void } {
  const { months, prevMonths } = useMemo(
    () => resolvePeriod(period, selectedMonth, custom),
    [period, selectedMonth, custom?.from?.getTime(), custom?.to?.getTime()],
  );

  const monthsKey = months.join(",");
  const prevKey = prevMonths.join(",");

  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<{ items: ReportItem[]; income: number }>({ items: [], income: 0 });
  const [previous, setPrevious] = useState<{ items: ReportItem[]; income: number }>({ items: [], income: 0 });

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [cur, prev] = await Promise.all([
      fetchPeriod(userId, monthsKey ? monthsKey.split(",") : []),
      fetchPeriod(userId, prevKey ? prevKey.split(",") : []),
    ]);
    setCurrent(cur);
    setPrevious(prev);
    setLoading(false);
  }, [userId, monthsKey, prevKey]);

  useEffect(() => {
    load();
  }, [load]);

  const data = useMemo<ReportData>(() => {
    const curMap = groupItems(current.items);
    const prevMap = groupItems(previous.items);

    const totals: CategoryTotal[] = Array.from(curMap.values())
      .map((c) => ({ ...c, prev: prevMap.get(`${c.type}::${c.name}`)?.amount ?? 0 }))
      .sort((a, b) => b.amount - a.amount);

    const totalOut = totals.reduce((s, c) => s + c.amount, 0);
    const prevTotalOut = Array.from(prevMap.values()).reduce((s, c) => s + c.amount, 0);
    const biggest = totals[0] ? { name: totals[0].name, type: totals[0].type, amount: totals[0].amount } : null;

    return {
      items: current.items,
      totals,
      totalOut,
      prevTotalOut,
      income: current.income,
      available: current.income - totalOut,
      prevAvailable: previous.income - prevTotalOut,
      categoriesUsed: curMap.size,
      prevCategoriesUsed: prevMap.size,
      biggest,
      loading,
    };
  }, [current, previous, loading]);

  return { ...data, months, prevMonths, reload: load };
}
