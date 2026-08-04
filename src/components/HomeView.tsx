import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { formatCOP } from "@/lib/constants";
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
  Sparkles,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AppView } from "@/components/BottomNav";
import type { Tables } from "@/integrations/supabase/types";
import type { InstallmentPayment } from "@/hooks/useInstallments";

type Expense = Tables<"expenses">;

interface HomeViewProps {
  userEmail?: string;
  displayName?: string;
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


const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

const BAR_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent-cool))",
  "hsl(var(--warning))",
  "hsl(var(--accent-warm))",
  "hsl(var(--secondary))",
];

function relativeDay(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const today = new Date();
  const diff = Math.floor((today.setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000);
  if (diff <= 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff < 7) return `Hace ${diff} días`;
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

export function HomeView({
  userEmail,
  income,
  totalExpenses,
  available,
  paidCount,
  totalCount,
  expenses,
  monthPayments,
  installmentMonthTotal,
  onNavigate,
}: HomeViewProps) {
  const name = userEmail ? userEmail.split("@")[0] : "";
  const spentPct = income > 0 ? Math.min(Math.round((totalExpenses / income) * 100), 999) : 0;

  const message = useMemo(() => {
    if (income <= 0) return "Registra tu ingreso del mes para ver tu historia financiera.";
    if (spentPct < 50) return `Este mes vas muy bien. Has gastado el ${spentPct}%. Aún puedes ahorrar.`;
    if (spentPct < 85) return `Vas a buen ritmo. Llevas el ${spentPct}% de tu ingreso comprometido.`;
    if (spentPct <= 100) return `Cuidado, has comprometido el ${spentPct}% de tu ingreso este mes.`;
    return `Te excediste: llevas el ${spentPct}% de tu ingreso comprometido.`;
  }, [income, spentPct]);

  const stats = [
    {
      label: "Disponible",
      value: available,
      icon: Wallet,
      accent: available >= 0 ? "text-success" : "text-destructive",
      chip: available >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
      trend: income > 0 ? `${Math.max(100 - spentPct, 0)}% libre` : "—",
      up: available >= 0,
      view: "expenses" as AppView,
    },
    {
      label: "Ingresos",
      value: income,
      icon: TrendingUp,
      accent: "",
      chip: "bg-primary/10 text-primary",
      trend: "Este mes",
      up: true,
      view: "home" as AppView,
    },
    {
      label: "Gastos",
      value: totalExpenses,
      icon: TrendingDown,
      accent: "",
      chip: "bg-destructive/10 text-destructive",
      trend: income > 0 ? `${spentPct}% del ingreso` : "—",
      up: false,
      view: "expenses" as AppView,
    },
    {
      label: "Deudas",
      value: installmentMonthTotal,
      icon: CreditCard,
      accent: "",
      chip: "bg-warning/10 text-warning",
      trend: `${monthPayments.length} cuota${monthPayments.length === 1 ? "" : "s"}`,
      up: false,
      view: "debts" as AppView,
    },
  ];

  // Curva de flujo del mes: ingreso constante vs gasto acumulado
  const flowData = useMemo(() => {
    const sorted = [...expenses].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    let acc = 0;
    const points = sorted.map((e, i) => {
      acc += Number(e.amount);
      return {
        name: e.category?.slice(0, 12) ?? `#${i + 1}`,
        Ingresos: income,
        Gastos: acc,
      };
    });
    return [{ name: "Inicio", Ingresos: income, Gastos: 0 }, ...points];
  }, [expenses, income]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount));
    });
    monthPayments.forEach((p) => {
      map.set("Cuotas", (map.get("Cuotas") ?? 0) + Number(p.amount));
    });
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
      subtitle: e.category,
      amount: -Number(e.amount),
      date: e.updated_at ?? e.created_at,
      icon: Receipt,
    }));
    const fromPayments = monthPayments
      .filter((p) => p.is_paid)
      .map((p) => ({
        id: p.id,
        title: `Cuota ${p.plan_name}`,
        subtitle: `Cuota ${p.payment_number}`,
        amount: -Number(p.amount),
        date: p.paid_at ?? p.created_at,
        icon: CreditCard,
      }));
    const list = [...fromExpenses, ...fromPayments];
    if (income > 0) {
      list.push({
        id: "income",
        title: "Ingreso del mes",
        subtitle: "Ingresos",
        amount: income,
        date: new Date().toISOString(),
        icon: TrendingUp,
      });
    }
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);
  }, [expenses, monthPayments, income]);

  const shortcuts: { label: string; icon: typeof Target; view: AppView; tint: string }[] = [
    { label: "Metas", icon: Target, view: "goals", tint: "bg-primary/10 text-primary" },
    { label: "Ahorros", icon: PiggyBank, view: "savings", tint: "bg-success/10 text-success" },
    { label: "Gastos", icon: Receipt, view: "expenses", tint: "bg-destructive/10 text-destructive" },
    { label: "Deudas", icon: CreditCard, view: "debts", tint: "bg-warning/10 text-warning" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Saludo + mensaje */}
      <motion.div variants={item} className="space-y-3">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight capitalize sm:text-4xl">
            Hola {name || "👋"} {name && "👋"}
          </h2>
        </div>
        <div className="flex items-start gap-3 rounded-3xl border border-primary/15 bg-accent/60 p-4">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <p className="text-sm font-medium leading-relaxed text-accent-foreground">{message}</p>
        </div>
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
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(s.view)}
              className="group rounded-3xl border bg-card p-6 text-left shadow-soft transition-shadow hover:shadow-card"
            >
              <div className="flex items-start justify-between">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${s.chip}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.chip}`}>
                  <Trend className="h-3 w-3" />
                  {s.trend}
                </span>
              </div>
              <p className="mt-6 text-sm font-medium text-muted-foreground">{s.label}</p>
              <p className={`mt-1 text-2xl font-extrabold tracking-tight sm:text-[1.7rem] ${s.accent}`}>
                {formatCOP(s.value)}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Gráfica protagonista */}
      <motion.div variants={item}>
        <Card className="overflow-hidden rounded-3xl border shadow-card">
          <CardContent className="p-5 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold tracking-tight">Ingresos vs gastos</h3>
                <p className="text-sm text-muted-foreground">Evolución acumulada del mes</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Ingresos
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive" /> Gastos
                </span>
              </div>
            </div>

            <div className="mt-6 h-64 w-full sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={flowData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
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
                  <Area
                    type="monotone"
                    dataKey="Ingresos"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    fill="url(#gIncome)"
                    animationDuration={900}
                  />
                  <Area
                    type="monotone"
                    dataKey="Gastos"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2.5}
                    fill="url(#gExpense)"
                    animationDuration={1100}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Gastos por categoría */}
        <motion.div variants={item}>
          <Card className="h-full rounded-3xl border shadow-soft">
            <CardContent className="p-5 sm:p-6">
              <h3 className="text-lg font-bold tracking-tight">Gastos por categoría</h3>
              <p className="text-sm text-muted-foreground">Distribución del mes</p>

              <div className="mt-5 space-y-4">
                {categoryData.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aún no hay gastos registrados.</p>
                )}
                {categoryData.map((c, i) => (
                  <div key={c.label}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate font-medium">{c.label}</span>
                      <span className="shrink-0 text-muted-foreground">
                        <span className="font-semibold text-foreground">{c.pct}%</span> · {formatCOP(c.value)}
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${c.pct}%` }}
                        transition={{ duration: 0.8, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full"
                        style={{ background: c.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actividad reciente */}
        <motion.div variants={item}>
          <Card className="h-full rounded-3xl border shadow-soft">
            <CardContent className="p-5 sm:p-6">
              <h3 className="text-lg font-bold tracking-tight">Actividad reciente</h3>
              <p className="text-sm text-muted-foreground">
                {paidCount}/{totalCount} gastos pagados
              </p>

              <div className="mt-4 divide-y">
                {activity.length === 0 && (
                  <p className="py-3 text-sm text-muted-foreground">Sin movimientos todavía.</p>
                )}
                {activity.map((a) => {
                  const Icon = a.icon;
                  const positive = a.amount > 0;
                  return (
                    <div key={a.id} className="flex items-center gap-3 py-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                          positive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{a.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {relativeDay(a.date)} · {a.subtitle}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-bold ${positive ? "text-success" : "text-foreground"}`}
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
      </div>

      {/* Accesos con iconos grandes */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {shortcuts.map((s) => {
          const Icon = s.icon;
          return (
            <motion.button
              key={s.label}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate(s.view)}
              className="flex flex-col items-center gap-3 rounded-3xl border bg-card p-6 shadow-soft transition-shadow hover:shadow-card"
            >
              <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${s.tint}`}>
                <Icon className="h-7 w-7" />
              </span>
              <span className="text-sm font-semibold">{s.label}</span>
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
