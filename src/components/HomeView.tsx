import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { formatCOP } from "@/lib/constants";
import { formatCompactNumber } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
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
  prevExpenses?: { category: string; amount: number }[];
  monthPayments: (InstallmentPayment & { plan_name: string })[];
  installmentMonthTotal: number;
  savingsTotal?: number;
  onNavigate: (v: AppView) => void;
  onOpenIncome: () => void;
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

function relativeDay(dateStr: string | null, t: (s: string, v?: Record<string, string | number>) => string, locale: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const diff = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000);
  if (diff <= 0) return t("Hoy");
  if (diff === 1) return t("Ayer");
  if (diff < 7) return t("Hace {n} días", { n: diff });
  return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

export function HomeView({
  alias,
  userEmail,
  income,
  totalExpenses,
  available,
  expenses,
  prevExpenses = [],
  monthPayments,
  installmentMonthTotal,
  savingsTotal = 0,
  onNavigate,
  onOpenIncome,
}: HomeViewProps) {
  const { t, locale } = useI18n();
  const name = alias?.trim() || (userEmail ? userEmail.split("@")[0] : "");
  const spentPct = income > 0 ? Math.min(Math.round((totalExpenses / income) * 100), 999) : 0;

  const stats: {
    label: string;
    value: number;
    icon: LucideIcon;
    tint: string;
    trend: string;
    up: boolean;
    onClick?: () => void;
  }[] = [
    {
      label: t("Ingresos"),
      value: income,
      icon: TrendingUp,
      tint: "bg-success/10 text-success",
      trend: t("Este mes"),
      up: true,
      onClick: onOpenIncome,
    },
    {
      label: t("Disponible"),
      value: available,
      icon: Wallet,
      tint: "bg-info/10 text-info",
      trend: income > 0 ? t("{n}% disponible", { n: Math.max(100 - spentPct, 0) }) : "—",
      up: available >= 0,
    },
    {
      label: t("Gastos"),
      value: totalExpenses,
      icon: TrendingDown,
      tint: "bg-destructive/10 text-destructive",
      trend: income > 0 ? t("{n}% del ingreso", { n: spentPct }) : "—",
      up: false,
      onClick: () => onNavigate("expenses"),
    },
    {
      label: t("Ahorros"),
      value: savingsTotal,
      icon: PiggyBank,
      tint: "bg-info/10 text-info",
      trend: t("Total ahorrado"),
      up: true,
      onClick: () => onNavigate("savings"),
    },
    {
      label: t("Deudas"),
      value: installmentMonthTotal,
      icon: CreditCard,
      tint: "bg-accent-violet/10 text-accent-violet",
      trend: monthPayments.length === 1 ? t("{n} cuota", { n: 1 }) : t("{n} cuotas", { n: monthPayments.length }),
      up: false,
      onClick: () => onNavigate("debts"),
    },
  ];


  const insights = useMemo(() => {
    const out: string[] = [];
    const prevTotal = prevExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const currentTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);

    if (prevTotal > 0 && currentTotal > 0) {
      const diff = Math.round(((currentTotal - prevTotal) / prevTotal) * 100);
      if (Math.abs(diff) >= 3) {
        out.push(
          diff > 0
            ? t("Gastas {n}% más que el mes pasado.", { n: diff })
            : t("Gastas {n}% menos que el mes pasado.", { n: Math.abs(diff) }),
        );
      }
    }

    // Categoría con mayor aumento (o mayor peso si no hay historial)
    const curMap = new Map<string, number>();
    expenses.forEach((e) => curMap.set(e.category, (curMap.get(e.category) ?? 0) + Number(e.amount)));
    const prevMap = new Map<string, number>();
    prevExpenses.forEach((e) => prevMap.set(e.category, (prevMap.get(e.category) ?? 0) + Number(e.amount)));

    if (prevMap.size > 0) {
      let topCat = "";
      let topDelta = 0;
      curMap.forEach((v, k) => {
        const delta = v - (prevMap.get(k) ?? 0);
        if (delta > topDelta) {
          topDelta = delta;
          topCat = k;
        }
      });
      if (topCat && topDelta > 0) {
        out.push(t("{c} subió {v}.", { c: topCat, v: formatCOP(topDelta) }));
      }
    } else if (curMap.size > 0 && currentTotal > 0) {
      const [cat, val] = [...curMap.entries()].sort((a, b) => b[1] - a[1])[0];
      out.push(t("{c} es tu mayor gasto: {p}% del total.", { c: cat, p: Math.round((val / currentTotal) * 100) }));
    }

    if (income > 0 && installmentMonthTotal > 0) {
      const debtPct = Math.round((installmentMonthTotal / income) * 100);
      if (debtPct >= 10) out.push(t("Las cuotas consumen el {n}% de tus ingresos.", { n: debtPct }));
    } else if (income > 0 && available > 0 && spentPct < 70) {
      out.push(t("Puedes ahorrar {v} este mes.", { v: formatCOP(Math.round(available * 0.2)) }));
    }

    return out.slice(0, 3);
  }, [expenses, prevExpenses, income, installmentMonthTotal, available, spentPct, t]);


  const flowData = useMemo(() => {
    const sorted = [...expenses].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    let acc = 0;
    const points = sorted.map((e, i) => {
      acc += Number(e.amount);
      return { name: e.category?.slice(0, 12) ?? `#${i + 1}`, Ingresos: income, Gastos: acc };
    });
    return [{ name: t("Inicio"), Ingresos: income, Gastos: 0 }, ...points];
  }, [expenses, income, t]);

  // El ancho del eje Y se adapta al valor más alto (miles, millones, decenas de millones)
  const yAxisWidth = useMemo(() => {
    const max = flowData.reduce((m, d) => Math.max(m, d.Ingresos, d.Gastos), 0);
    const label = formatCompactNumber(max);
    return Math.min(96, Math.max(44, label.length * 9 + 16));
  }, [flowData]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount)));
    monthPayments.forEach((p) => map.set(t("Deudas"), (map.get(t("Deudas")) ?? 0) + Number(p.amount)));
    const all = [...map.entries()].sort((a, b) => b[1] - a[1]);
    const top = all.slice(0, 5);
    const rest = all.slice(5).reduce((s, [, v]) => s + v, 0);
    if (rest > 0) top.push([t("Otros"), rest]);
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
      subtitle: `${t("Gastos")} · ${e.category}`,
      amount: -Number(e.amount),
      date: e.updated_at ?? e.created_at,
      category: e.category,
    }));
    const fromPayments = monthPayments
      .filter((p) => p.is_paid)
      .map((p) => ({
        id: p.id,
        title: `${t("Pago cuota")} ${p.plan_name}`,
        subtitle: `${t("Deudas")} · ${t("Cuota")} ${p.payment_number}`,
        amount: -Number(p.amount),
        date: p.paid_at ?? p.created_at,
        category: "deuda",
      }));
    const list = [...fromExpenses, ...fromPayments];
    if (income > 0) {
      list.push({
        id: "income",
        title: t("Ingreso del mes"),
        subtitle: t("Ingresos"),
        amount: income,
        date: new Date().toISOString(),
        category: "ingreso",
      });
    }
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);
  }, [expenses, monthPayments, income]);

  const shortcuts: { label: string; icon: LucideIcon; view: AppView; tint: string }[] = [
    { label: t("Nueva meta"), icon: Target, view: "goals", tint: "bg-success/10 text-success" },
    { label: t("Nuevo gasto"), icon: Receipt, view: "expenses", tint: "bg-destructive/10 text-destructive" },
    { label: t("Nuevo ahorro"), icon: PiggyBank, view: "savings", tint: "bg-info/10 text-info" },
    { label: t("Nueva deuda"), icon: CreditCard, view: "debts", tint: "bg-accent-violet/10 text-accent-violet" },
    { label: t("Ver deudas"), icon: Wallet, view: "debts", tint: "bg-warning/10 text-warning" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Saludo */}
      <motion.div variants={item}>
        <h2 className="font-display text-2xl font-semibold tracking-tight capitalize sm:text-3xl">
          {t("Hola {name} 👋", { name })}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("Este mes tienes el control de tus finanzas.")}</p>
      </motion.div>

      {/* Mensaje inteligente */}
      <motion.div variants={item}>
        <SmartMessage pct={spentPct} hasIncome={income > 0} insights={insights} />
      </motion.div>

      {/* Tarjetas principales: slider en móvil, grid en desktop */}
      <motion.div variants={item}>
        <StatSlider stats={stats} />
      </motion.div>


      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Gráfico de evolución */}
        <motion.div variants={item} className="min-w-0 lg:col-span-3">
          <Card className="h-full overflow-hidden rounded-2xl border shadow-soft">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-base font-semibold">{t("Evolución de ingresos y gastos")}</h3>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-success" /> {t("Ingresos")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-destructive" /> {t("Gastos")}
                  </span>
                </div>
              </div>

              <div className="mt-5 h-60 w-full sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={flowData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
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
                      tickFormatter={(v) => formatCompactNumber(Number(v))}
                      width={yAxisWidth}
                      domain={[0, "auto"]}
                      allowDecimals={false}
                      tickCount={5}
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
        <motion.div variants={item} className="min-w-0 lg:col-span-2">
          <Card className="h-full rounded-2xl border shadow-soft">
            <CardContent className="p-5 sm:p-6">
              <h3 className="font-display text-base font-semibold">{t("Gastos por categoría")}</h3>

              <div className="mt-5 space-y-4">
                {categoryData.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t("Aún no hay gastos registrados.")}</p>
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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Actividad reciente */}
        <motion.div variants={item} className="min-w-0 lg:col-span-3">
          <Card className="h-full rounded-2xl border shadow-soft">
            <CardContent className="p-5 sm:p-6">
              <h3 className="font-display text-base font-semibold">{t("Actividad reciente")}</h3>

              <div className="mt-4 divide-y divide-border">
                {activity.length === 0 && (
                  <p className="py-6 text-sm text-muted-foreground">{t("Sin movimientos todavía.")}</p>
                )}
                {activity.map((a) => {
                  const visual = getCategoryVisual(a.category);
                  const Icon = a.amount > 0 ? TrendingUp : visual.icon;
                  const positive = a.amount > 0;
                  return (
                    <div key={a.id} className="flex items-center gap-2 py-3 sm:gap-3">
                      <span className="hidden w-16 shrink-0 text-[11px] font-medium text-muted-foreground sm:block">
                        {relativeDay(a.date, t, locale)}
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
                        <p className="truncate text-xs text-muted-foreground">
                          <span className="sm:hidden">{relativeDay(a.date, t, locale)} · </span>
                          {a.subtitle}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 whitespace-nowrap text-xs font-semibold tabular-nums sm:text-sm ${
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

        {/* Acciones rápidas (solo desktop: en móvil se usa el botón +) */}
        <motion.div variants={item} className="hidden min-w-0 md:block lg:col-span-2">

          <Card className="h-full rounded-2xl border shadow-soft">
            <CardContent className="p-5 sm:p-6">
              <h3 className="font-display text-base font-semibold">{t("Acciones rápidas")}</h3>
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

interface StatItem {
  label: string;
  value: number;
  icon: LucideIcon;
  tint: string;
  trend: string;
  up: boolean;
  onClick?: () => void;
}

function StatCard({ s }: { s: StatItem }) {
  const Icon = s.icon;
  const Trend = s.up ? ArrowUpRight : ArrowDownRight;
  const interactive = Boolean(s.onClick);
  const Comp = interactive ? motion.button : motion.div;
  return (
    <Comp
      whileHover={interactive ? { y: -3 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      onClick={s.onClick}
      className={`h-full w-full rounded-2xl border bg-card p-5 text-left shadow-soft transition-shadow ${
        interactive ? "hover:shadow-card" : "cursor-default"
      }`}
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.tint}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 truncate text-sm font-medium text-muted-foreground">{s.label}</p>
      <p className="mt-1 truncate font-display text-2xl font-semibold tracking-tight">{formatCOP(s.value)}</p>
      <span
        className={`mt-2 inline-flex max-w-full items-center gap-1 text-xs font-medium ${
          s.up ? "text-success" : "text-destructive"
        }`}
      >
        <Trend className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{s.trend}</span>
      </span>
    </Comp>
  );

}

function StatSlider({ stats }: { stats: StatItem[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / (el.clientWidth * 0.85));
    setActive(Math.max(0, Math.min(stats.length - 1, idx)));
  };

  return (
    <>
      {/* Móvil: slider táctil */}
      <div className="md:hidden">
        <div
          ref={scroller}
          onScroll={onScroll}
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {stats.map((s) => (
            <div key={s.label} className="w-[85%] shrink-0 snap-center">
              <StatCard s={s} />
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-center gap-1.5">
          {stats.map((s, i) => (
            <span
              key={s.label}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Desktop: grid de 4 tarjetas */}
      <div className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} s={s} />
        ))}
      </div>
    </>
  );
}
