import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBudget } from "@/hooks/useBudget";
import { useCategories } from "@/hooks/useCategories";
import { useInstallments } from "@/hooks/useInstallments";
import { useWebAuthn, isWebAuthnSupported } from "@/hooks/useWebAuthn";
import { MonthSelector } from "@/components/MonthSelector";
import { SummaryCards } from "@/components/SummaryCards";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseCharts } from "@/components/ExpenseCharts";
import { IncomeEditor } from "@/components/IncomeEditor";
import { ExportButton } from "@/components/ExportButton";
import { CategoryManager } from "@/components/CategoryManager";
import { InstallmentTracker } from "@/components/InstallmentTracker";
import { Button } from "@/components/ui/button";
import { LogOut, Wallet, Fingerprint } from "lucide-react";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const {
    budget, expenses, loading, totalExpenses, available, paidCount,
    cumulativeSavings, updateIncome, updateExpense, addExpense, deleteExpense,
    copyFromPreviousMonth,
  } = useBudget(user?.id, selectedMonth);

  const { categories, categoryNames, addCategory, removeCategory, editCategory, toggleCumulativeSavings } = useCategories(user?.id);
  const { plans, monthPayments, createPlan, togglePayment, deletePlan, pendingTotal, pendingCount } = useInstallments(user?.id, selectedMonth);
  const { loading: webauthnLoading, registerPasskey, isSupported: webauthnSupported } = useWebAuthn();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold">Mis Finanzas</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user?.email}
            </span>
            {webauthnSupported && (
              <Button
                variant="ghost"
                size="icon"
                onClick={registerPasskey}
                disabled={webauthnLoading}
                title="Registrar huella / Face ID"
              >
                <Fingerprint className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <MonthSelector
            selectedMonth={selectedMonth}
            onChangeMonth={setSelectedMonth}
            onCopyPrevious={copyFromPreviousMonth}
          />
          <div className="flex flex-wrap items-center gap-2">
            <IncomeEditor income={Number(budget?.income ?? 0)} onSave={updateIncome} />
            <CategoryManager categories={categories} onAdd={addCategory} onRemove={removeCategory} onEdit={editCategory} onToggleCumulative={toggleCumulativeSavings} />
            <ExportButton
              expenses={expenses}
              income={Number(budget?.income ?? 0)}
              selectedMonth={selectedMonth}
              totalExpenses={totalExpenses}
              available={available}
              cumulativeSavings={cumulativeSavings}
            />
          </div>
        </div>

        <SummaryCards
          income={Number(budget?.income ?? 0)}
          totalExpenses={totalExpenses}
          available={available}
          paidCount={paidCount}
          totalCount={expenses.length}
          cumulativeSavings={cumulativeSavings}
        />

        <ExpenseCharts expenses={expenses} />

        <ExpenseList
          expenses={expenses}
          categories={categoryNames}
          onUpdate={updateExpense}
          onAdd={addExpense}
          onDelete={deleteExpense}
        />
      </main>
    </div>
  );
}
