import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBudget } from "@/hooks/useBudget";
import { useCategories } from "@/hooks/useCategories";
import { useInstallments } from "@/hooks/useInstallments";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { MonthSelector } from "@/components/MonthSelector";
import { ExpenseList } from "@/components/ExpenseList";
import { IncomeEditor } from "@/components/IncomeEditor";
import { ExportButton } from "@/components/ExportButton";
import { CategoryManager } from "@/components/CategoryManager";
import { InstallmentTracker } from "@/components/InstallmentTracker";
import { SavingsModule } from "@/components/SavingsModule";
import { BottomNav, type AppView } from "@/components/BottomNav";
import { HomeView } from "@/components/HomeView";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, Wallet, Fingerprint, ChevronRight } from "lucide-react";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [view, setView] = useState<AppView>("home");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const {
    budget, expenses, loading, totalExpenses, paidCount,
    cumulativeSavings, updateIncome, updateExpense, addExpense, deleteExpense,
    copyFromPreviousMonth,
  } = useBudget(user?.id, selectedMonth);

  const { categories, categoryNames, addCategory, removeCategory, editCategory, toggleCumulativeSavings } = useCategories(user?.id);
  const { plans, monthPayments, createPlan, togglePayment, updatePaymentAmount, deletePlan, monthlyInstallmentTotal } = useInstallments(user?.id, selectedMonth);
  const { loading: webauthnLoading, registerPasskey, isSupported: webauthnSupported } = useWebAuthn();

  const combinedTotalExpenses = totalExpenses + monthlyInstallmentTotal;
  const income = Number(budget?.income ?? 0);
  const combinedAvailable = income - combinedTotalExpenses;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  const titleMap: Record<AppView, string> = {
    home: "Mis Finanzas",
    goals: "Metas",
    savings: "Ahorros",
    expenses: "Gastos",
    debts: "Deudas",
    more: "Más",
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold">{titleMap[view]}</h1>
          </div>

          <div className="hidden md:block">
            <BottomNav active={view} onChange={setView} />
          </div>

          <div className="flex items-center gap-1">
            <span className="hidden text-sm text-muted-foreground lg:inline">
              {user?.email}
            </span>
            {webauthnSupported && (
              <Button variant="ghost" size="icon" onClick={registerPasskey} disabled={webauthnLoading} title="Registrar biometría">
                <Fingerprint className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 pb-28 md:pb-8">
        {/* Month selector on data screens */}
        {view !== "more" && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <MonthSelector
              selectedMonth={selectedMonth}
              onChangeMonth={setSelectedMonth}
              onCopyPrevious={copyFromPreviousMonth}
            />
            {view === "home" && (
              <IncomeEditor income={income} onSave={updateIncome} />
            )}
            {view === "expenses" && (
              <CategoryManager
                categories={categories}
                onAdd={addCategory}
                onRemove={removeCategory}
                onEdit={editCategory}
                onToggleCumulative={toggleCumulativeSavings}
              />
            )}
          </div>
        )}

        {view === "home" && (
          <HomeView
            userEmail={user?.email}
            income={income}
            totalExpenses={combinedTotalExpenses}
            available={combinedAvailable}
            paidCount={paidCount}
            totalCount={expenses.length}
            onNavigate={setView}
          />
        )}

        {view === "goals" && (
          <SavingsModule userId={user?.id} selectedMonth={selectedMonth} mode="goals" />
        )}

        {view === "savings" && (
          <SavingsModule userId={user?.id} selectedMonth={selectedMonth} mode="savings" />
        )}

        {view === "expenses" && (
          <ExpenseList
            expenses={expenses}
            categories={categoryNames}
            onUpdate={updateExpense}
            onAdd={addExpense}
            onDelete={deleteExpense}
          />
        )}

        {view === "debts" && (
          <InstallmentTracker
            plans={plans}
            monthPayments={monthPayments}
            onCreatePlan={createPlan}
            onTogglePayment={togglePayment}
            onDeletePlan={deletePlan}
            onUpdatePaymentAmount={updatePaymentAmount}
          />
        )}

        {view === "more" && (
          <MoreView
            userEmail={user?.email}
            exportButton={
              <ExportButton
                expenses={expenses}
                income={income}
                selectedMonth={selectedMonth}
                totalExpenses={combinedTotalExpenses}
                available={combinedAvailable}
                cumulativeSavings={cumulativeSavings}
              />
            }
            biometricButton={
              webauthnSupported ? (
                <Button variant="outline" size="sm" onClick={registerPasskey} disabled={webauthnLoading} className="gap-2">
                  <Fingerprint className="h-4 w-4" />
                  Registrar biometría
                </Button>
              ) : null
            }
            onSignOut={signOut}
          />
        )}
      </main>

      <div className="md:hidden">
        <BottomNav active={view} onChange={setView} />
      </div>
    </div>
  );
}

function MoreView({
  userEmail,
  exportButton,
  biometricButton,
  onSignOut,
}: {
  userEmail?: string;
  exportButton: React.ReactNode;
  biometricButton: React.ReactNode;
  onSignOut: () => void;
}) {
  return (
    <div className="space-y-5">
      <Card className="rounded-2xl border shadow-sm">
        <CardContent className="p-5">
          <p className="text-xs text-muted-foreground">Sesión activa</p>
          <p className="mt-1 font-semibold truncate">{userEmail}</p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border shadow-sm">
        <CardContent className="p-2">
          <Row label="Exportar datos" action={exportButton} />
          {biometricButton && <Row label="Biometría" action={biometricButton} />}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border shadow-sm">
        <CardContent className="p-2">
          <button
            onClick={onSignOut}
            className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-destructive hover:bg-destructive/5"
          >
            <span className="flex items-center gap-3 font-medium">
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </span>
            <ChevronRight className="h-4 w-4 opacity-60" />
          </button>
        </CardContent>
      </Card>
    </div>
  );
}




function Row({ label, action }: { label: string; action: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-3">
      <span className="font-medium">{label}</span>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
