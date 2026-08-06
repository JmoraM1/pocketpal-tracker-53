import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { formatCOP } from "@/lib/constants";
import { getCategoryVisual } from "@/lib/categoryIcons";
import { SmartMessage } from "@/components/SmartMessage";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Target,
  PiggyBank,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AppView } from "@/components/BottomNav";
import type { Tables } from "@/integrations/supabase/types";
import type { InstallmentPayment } from "@/hooks/useInstallments";

type Expense = Tables<"expenses">;

interface HomeViewProps {
  alias?: string;
  userEmail?: string;
  income: number;
  totalExpenses: number;
  available: number;
  paidCount: number;
  totalCount: number;
  expenses: Expense[];
  monthPayments: (InstallmentPayment & { plan_name: string })[];
  installmentMonthTotal: number;
  onNavigate: (v: AppView) => void;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

const BAR_COLORS = [
  "hsl(var(--accent-violet))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--info))",
  "hsl(var(--accent-cool))",
];

function relativeDay(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const diff = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000);
  if (diff <= 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff < 7) return `Hace ${diff} días`;
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

export function HomeView({
  alias,
  userEmail,
  income,
  totalExpenses,
  available,
  expenses,
  monthPayments,
  installmentMonthTotal,
  onNavigate,
}: HomeViewProps) {
  const name = alias?.trim() || (userEmail ? userEmail.split("@")[0] : "");
  const spentPct = income > 0 ? Math.min(Math.round((totalExpenses / income) * 100), 999) : 0;

  const stats: {
    label: string;
    value: number;
    icon: LucideIcon;
    tint: string;
    trend: string;
    up: boolean;
    view: AppView;
  }[] = [
    {
      label: "Ingresos",
      value: income,
      icon: TrendingUp,
      tint: "bg-success/10 text-success",
      trend: "Este mes",
      up: true,
      view: "home",
    },
    {
      label: "Disponible",
      value: available,
      icon: Wallet,
      tint: "bg-info/10 text-info",
      trend: income > 0 ? `${Math.max(100 - spentPct, 0)}% libre` : "—",
      up: available >= 0,
      view: "expenses",
    },
    {
      label: "Gastos",
      value: totalExpenses,
      icon: TrendingDown,
      tint: "bg-destructive/10 text-destructive",
      trend: income > 0 ? `${spentPct}% del ingreso` : "—",
      up: false,
      view: "expenses",
    },
    {
      label: "Deudas",
      value: installmentMonthTotal,
      icon: CreditCard,
      tint: "bg-accent-violet/10 text-accent-violet",
      trend: `${monthPayments.length} cuota${monthPayments.length === 1 ? "" : "s"}`,
      up: false,
      view: "debts",
    },
  ];

  const flowData = useMemo(() => {
    const sorted = [...expenses].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    let acc = 0;
    const points = sorted.map((e, i) => {
      acc += Number(e.amount);
      return { name: e.category?.slice(0, 12) ?? `#${i + 1}`, Ingresos: income, Gastos: acc };
    });
    return [{ name: "Inicio", Ingresos: income, Gastos: 0 }, ...points];
  }, [expenses, income]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount)));
    monthPayments.forEach((p) => map.set("Deudas", (map.get("Deudas") ?? 0) + Number(p.amount)));
    const all = [...map.entries()].sort((a, b) => b[1] - a[1]);
    const top = all.slice(0, 5);
    const rest = all.slice(5).reduce((s, [, v]) => s + v, 0);
    if (rest > 0) top.push(["Otros", rest]);
    const total = all.reduce((s, [, v]) => s + v, 0) || 1;
    return top.map(([label, value], i) => ({
      label,
      value,
      pct: Math.round((value / total) * 100),
      color: BAR_COLORS[i % BAR_COLORS.length],
    }));
  }, [expenses, monthPayments]);

  const activity = useMemo(() => {
    const fromExpenses = expenses.map((e) => ({
      id: e.id,
      title: e.description || e.category,
      subtitle: `Gastos · ${e.category}`,
      amount: -Number(e.amount),
      date: e.updated_at ?? e.created_at,
      category: e.category,
    }));
    const fromPayments = monthPayments
      .filter((p) => p.is_paid)
      .map((p) => ({
        id: p.id,
        title: `Pago cuota ${p.plan_name}`,
        subtitle: `Deudas · Cuota ${p.payment_number}`,
        amount: -Number(p.amount),
        date: p.paid_at ?? p.created_at,
        category: "deuda",
      }));
    const list = [...fromExpenses, ...fromPayments];
    if (income > 0) {
      list.push({
        id: "income",
        title: "Ingreso del mes",
        subtitle: "Ingresos",
        amount: income,
        date: new Date().toISOString(),
        category: "ingreso",
      });
    }
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);
  }, [expenses, monthPayments, income]);

  const shortcuts: { label: string; icon: LucideIcon; view: AppView; tint: string }[] = [
    { label: "Nueva meta", icon: Target, view: "goals", tint: "bg-success/10 text-success" },
    { label: "Nuevo gasto", icon: Receipt, view: "expenses", tint: "bg-destructive/10 text-destructive" },
    { label: "Nuevo ahorro", icon: PiggyBank, view: "savings", tint: "bg-info/10 text-info" },
    { label: "Nueva deuda", icon: CreditCard, view: "debts", tint: "bg-accent-violet/10 text-accent-violet" },
    { label: "Ver deudas", icon: Wallet, view: "debts", tint: "bg-warning/10 text-warning" },
    { label: "Categorías", icon: LayoutGrid, view: "categories", tint: "bg-accent-cool/10 text-accent-cool" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Saludo */}
      <motion.div variants={item}>
        <h2 className="font-display text-2xl font-semibold tracking-tight capitalize sm:text-3xl">
          Hola {name} 👋
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Este mes tienes el control de tus finanzas.</p>
      </motion.div>

      {/* Mensaje inteligente */}
      <motion.div variants={item}>
        <SmartMessage pct={spentPct} hasIncome={income > 0} />
      </motion.div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          const Trend = s.up ? ArrowUpRight : ArrowDownRight;
          return (
            <motion.button
              key={s.label}
              variants={item}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(s.view)}
              className="rounded-2xl border bg-card p-5 text-left shadow-soft transition-shadow hover:shadow-card"
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.tint}`}>
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-4 text-sm font-medium text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-display text-2xl font-semibold tracking-tight">{formatCOP(s.value)}</p>
              <span
                className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${
                  s.up ? "text-success" : "text-destructive"
                }`}
              >
                <Trend className="h-3.5 w-3.5" />
                {s.trend}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Gráfico de evolución */}
        <motion.div variants={item} className="lg:col-span-3">
          <Card className="h-full overflow-hidden rounded-2xl border shadow-soft">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-base font-semibold">Evolución de ingresos y gastos</h3>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-success" /> Ingresos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-destructive" /> Gastos
                  </span>
                </div>
              </div>

              <div className="mt-5 h-60 w-full sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={flowData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                      width={48}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.9rem",
                        color: "hsl(var(--popover-foreground))",
                        fontSize: 12,
                      }}
                      formatter={(v: number | string) => formatCOP(Number(v))}
                    />
                    <Area type="monotone" dataKey="Ingresos" stroke="hsl(var(--success))" strokeWidth={2.5} fill="url(#gIncome)" animationDuration={900} />
                    <Area type="monotone" dataKey="Gastos" stroke="hsl(var(--destructive))" strokeWidth={2.5} fill="url(#gExpense)" animationDuration={1100} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Gastos por categoría */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full rounded-2xl border shadow-soft">
            <CardContent className="p-5 sm:p-6">
              <h3 className="font-display text-base font-semibold">Gastos por categoría</h3>

              <div className="mt-5 space-y-4">
                {categoryData.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aún no hay gastos registrados.</p>
                )}
                {categoryData.map((c) => {
                  const visual = getCategoryVisual(c.label);
                  const Icon = visual.icon;
                  return (
                    <div key={c.label} className="flex items-center gap-3">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${visual.tint}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2 text-sm">
                          <span className="truncate font-medium">{c.label}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{c.pct}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${c.pct}%` }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full rounded-full"
                            style={{ background: c.color }}
                          />
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                        {formatCOP(c.value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Actividad reciente */}
        <motion.div variants={item} className="lg:col-span-3">
          <Card className="h-full rounded-2xl border shadow-soft">
            <CardContent className="p-5 sm:p-6">
              <h3 className="font-display text-base font-semibold">Actividad reciente</h3>

              <div className="mt-4 divide-y divide-border">
                {activity.length === 0 && (
                  <p className="py-6 text-sm text-muted-foreground">Sin movimientos todavía.</p>
                )}
                {activity.map((a) => {
                  const visual = getCategoryVisual(a.category);
                  const Icon = a.amount > 0 ? TrendingUp : visual.icon;
                  const positive = a.amount > 0;
                  return (
                    <div key={a.id} className="flex items-center gap-3 py-3">
                      <span className="w-16 shrink-0 text-[11px] font-medium text-muted-foreground">
                        {relativeDay(a.date)}
                      </span>
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          positive ? "bg-success/10 text-success" : visual.tint
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{a.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{a.subtitle}</p>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-semibold tabular-nums ${
                          positive ? "text-success" : "text-destructive"
                        }`}
                      >
                        {positive ? "+" : "-"}
                        {formatCOP(Math.abs(a.amount))}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Acciones rápidas */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full rounded-2xl border shadow-soft">
            <CardContent className="p-5 sm:p-6">
              <h3 className="font-display text-base font-semibold">Acciones rápidas</h3>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {shortcuts.map((s) => {
                  const Icon = s.icon;
                  return (
                    <motion.button
                      key={s.label}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => onNavigate(s.view)}
                      className="flex flex-col items-center gap-2 rounded-2xl border bg-card p-3 text-center transition-colors hover:bg-muted"
                    >
                      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.tint}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-[11px] font-medium leading-tight">{s.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
