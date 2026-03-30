import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCOP } from "@/lib/constants";
import { DollarSign, TrendingDown, PiggyBank, CheckCircle, Landmark, CreditCard } from "lucide-react";

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

export function SummaryCards({ income, totalExpenses, available, paidCount, totalCount, cumulativeSavings, installmentPending = 0, installmentPendingCount = 0 }: SummaryCardsProps) {
  const expenseRatio = income > 0 ? Math.min((totalExpenses / income) * 100, 100) : 0;
  const isHealthy = available >= 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ingreso del mes</p>
            <p className="text-xl font-bold">{formatCOP(income)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
            <TrendingDown className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total gastos</p>
            <p className="text-xl font-bold">{formatCOP(totalExpenses)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${isHealthy ? "bg-success/10" : "bg-destructive/10"}`}>
            <PiggyBank className={`h-6 w-6 ${isHealthy ? "text-success" : "text-destructive"}`} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Disponible ahorro</p>
            <p className={`text-xl font-bold ${isHealthy ? "text-success" : "text-destructive"}`}>
              {formatCOP(available)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Landmark className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ahorro acumulado</p>
            <p className="text-xl font-bold text-primary">{formatCOP(cumulativeSavings)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Pagados</p>
              <p className="text-xl font-bold">{paidCount}/{totalCount}</p>
            </div>
          </div>
          <Progress value={expenseRatio} className="mt-3 h-2" />
          <p className="mt-1 text-xs text-muted-foreground">
            {expenseRatio.toFixed(0)}% del ingreso comprometido
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-warning/10">
            <CreditCard className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Cuotas pendientes</p>
            <p className="text-xl font-bold text-warning">{formatCOP(installmentPending)}</p>
            <p className="text-xs text-muted-foreground">{installmentPendingCount} cuota{installmentPendingCount !== 1 ? "s" : ""} por pagar</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
