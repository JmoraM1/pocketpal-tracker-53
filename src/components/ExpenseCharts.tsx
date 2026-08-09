import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { formatCOP } from "@/lib/constants";
import type { Tables } from "@/integrations/supabase/types";
import { useT } from "@/lib/i18n";

type Expense = Tables<"expenses">;

const COLORS = [
  "hsl(220, 70%, 50%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(280, 65%, 55%)",
  "hsl(180, 60%, 45%)",
  "hsl(340, 70%, 55%)",
  "hsl(60, 70%, 45%)",
  "hsl(200, 70%, 50%)",
  "hsl(100, 60%, 45%)",
  "hsl(310, 60%, 50%)",
];

interface ExpenseChartsProps {
  expenses: Expense[];
}

export function ExpenseCharts({ expenses }: ExpenseChartsProps) {
  const t = useT();
  const data = expenses
    .filter((e) => Number(e.amount) > 0)
    .map((e) => ({
      name: e.category,
      value: Number(e.amount),
    }));

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center text-muted-foreground">
          {t("Agrega montos a tus gastos para ver las gráficas")}
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.[0]) {
      return (
        <div className="rounded-lg border bg-card p-2 text-xs shadow-lg">
          <p className="font-semibold">{payload[0].payload?.name ?? t("Valor")}</p>
          <p>{formatCOP(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg leading-snug">{t("Distribución de Gastos")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={110}
                dataKey="value"
                nameKey="name"
                paddingAngle={2}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1 text-xs">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg leading-snug">{t("Comparación por Categoría")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name={t("Valor")} radius={[0, 4, 4, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
