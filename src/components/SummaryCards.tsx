import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCOP } from "@/lib/constants";
import { DollarSign, TrendingDown, PiggyBank, CheckCircle } from "lucide-react";

interface SummaryCardsProps {
  income: number;
  totalExpenses: number;
  available: number;
  paidCount: number;
  totalCount: number;
  cumulativeSavings: number;
  installmentPending?: number;
  installmentPendingCount?: number;
  installmentMonthTotal?: number;
}

export function SummaryCards({ income, totalExpenses, available, paidCount, totalCount, installmentMonthTotal = 0 }: SummaryCardsProps) {
  const expenseRatio = income > 0 ? Math.min((totalExpenses / income) * 100, 100) : 0;
  const isHealthy = available >= 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Ingreso */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <DollarSign className="h-7 w-7 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">Ingreso del mes</p>
              <p className="mt-1 text-2xl font-bold tracking-tight">{formatCOP(income)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total gastos */}
      <Card className="border-l-4 border-l-destructive">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
              <TrendingDown className="h-7 w-7 text-destructive" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">Total gastos</p>
              <p className="mt-1 text-2xl font-bold tracking-tight">{formatCOP(totalExpenses)}</p>
              {installmentMonthTotal > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Incluye {formatCOP(installmentMonthTotal)} en cuotas
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disponible ahorro */}
      <Card className={`border-l-4 ${isHealthy ? "border-l-success" : "border-l-destructive"}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${isHealthy ? "bg-success/10" : "bg-destructive/10"}`}>
              <PiggyBank className={`h-7 w-7 ${isHealthy ? "text-success" : "text-destructive"}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">Disponible ahorro</p>
              <p className={`mt-1 text-2xl font-bold tracking-tight ${isHealthy ? "text-success" : "text-destructive"}`}>
                {formatCOP(available)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pagados + progreso */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <CheckCircle className="h-7 w-7 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">Gastos pagados</p>
              <p className="mt-1 text-2xl font-bold tracking-tight">{paidCount}/{totalCount}</p>
            </div>
          </div>
          <Progress value={expenseRatio} className="mt-4 h-2.5" />
          <p className="mt-2 text-xs text-muted-foreground">
            {expenseRatio.toFixed(0)}% del ingreso comprometido
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
