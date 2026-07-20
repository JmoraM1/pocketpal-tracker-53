import { Card, CardContent } from "@/components/ui/card";
import { formatCOP } from "@/lib/constants";
import { DollarSign, TrendingDown, PiggyBank, CheckCircle, Target, Plus, CreditCard, Tag } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { AppView } from "@/components/BottomNav";

interface HomeViewProps {
  userEmail?: string;
  income: number;
  totalExpenses: number;
  available: number;
  paidCount: number;
  totalCount: number;
  onNavigate: (v: AppView) => void;
}

const TINT: Record<string, { bg: string; text: string }> = {
  primary: { bg: "bg-primary/10", text: "text-primary" },
  success: { bg: "bg-success/10", text: "text-success" },
  destructive: { bg: "bg-destructive/10", text: "text-destructive" },
  warning: { bg: "bg-warning/10", text: "text-warning" },
};

export function HomeView({ userEmail, income, totalExpenses, available, paidCount, totalCount, onNavigate }: HomeViewProps) {
  const spentPct = income > 0 ? Math.min(Math.round((totalExpenses / income) * 100), 100) : 0;
  const savings = Math.max(available, 0);

  const donutData = [
    { name: "Gastos", value: Math.max(totalExpenses, 0.0001), color: "hsl(var(--destructive))" },
    { name: "Ahorros", value: Math.max(savings, 0.0001), color: "hsl(var(--success))" },
  ];

  const name = userEmail ? userEmail.split("@")[0] : "";

  const stats = [
    { label: "Ingreso del mes", value: income, icon: DollarSign, tint: "primary" as const, valueClass: "" },
    { label: "Total gastos", value: totalExpenses, icon: TrendingDown, tint: "destructive" as const, valueClass: "" },
    { label: "Disponible ahorro", value: available, icon: PiggyBank, tint: (available >= 0 ? "success" : "destructive") as "success" | "destructive", valueClass: available >= 0 ? "text-success" : "text-destructive" },
  ];

  const quick: { label: string; icon: typeof Plus; view: AppView; tint: keyof typeof TINT }[] = [
    { label: "Nueva meta", icon: Target, view: "goals", tint: "primary" },
    { label: "Nuevo gasto", icon: Plus, view: "expenses", tint: "success" },
    { label: "Ver deudas", icon: CreditCard, view: "debts", tint: "destructive" },
    { label: "Categorías", icon: Tag, view: "more", tint: "warning" },
  ];

  return (
    <div className="space-y-5">
      {name && (
        <div>
          <h2 className="text-2xl font-bold capitalize">Hola {name} 👋</h2>
          <p className="text-sm text-muted-foreground">Este es tu resumen financiero</p>
        </div>
      )}

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          const t = TINT[s.tint];
          return (
            <Card key={s.label} className="rounded-2xl border shadow-sm">
              <CardContent className="p-4">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.bg}`}>
                  <Icon className={`h-4 w-4 ${t.text}`} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{s.label}</p>
                <p className={`mt-0.5 text-lg font-bold tracking-tight ${s.valueClass}`}>
                  {formatCOP(s.value)}
                </p>
              </CardContent>
            </Card>
          );
        })}
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Gastos pagados</p>
            <p className="mt-0.5 text-lg font-bold tracking-tight">{paidCount}/{totalCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Donut resumen */}
      <Card className="rounded-2xl border shadow-sm">
        <CardContent className="p-5">
          <h3 className="mb-4 font-semibold">Resumen rápido</h3>
          <div className="flex items-center gap-4">
            <div className="relative h-36 w-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{spentPct}%</span>
                <span className="text-[10px] text-muted-foreground">Gastado</span>
              </div>
            </div>
            <div className="flex-1 space-y-3 text-sm">
              <LegendRow color="hsl(var(--destructive))" label="Gastos" value={formatCOP(totalExpenses)} />
              <LegendRow color="hsl(var(--success))" label="Ahorros" value={formatCOP(savings)} />
              <LegendRow color="hsl(var(--primary))" label="Disponible" value={formatCOP(available)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accesos rápidos */}
      <div>
        <h3 className="mb-3 font-semibold">Accesos rápidos</h3>
        <div className="grid grid-cols-4 gap-3">
          {quick.map((q) => {
            const Icon = q.icon;
            const t = TINT[q.tint];
            return (
              <button
                key={q.label}
                onClick={() => onNavigate(q.view)}
                className="flex flex-col items-center gap-2 rounded-2xl border bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.bg}`}>
                  <Icon className={`h-5 w-5 ${t.text}`} />
                </div>
                <span className="text-[11px] font-medium text-center leading-tight">{q.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        <span className="text-muted-foreground">{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
