import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBudget } from "@/hooks/useBudget";
import { useCategories } from "@/hooks/useCategories";
import { useInstallments } from "@/hooks/useInstallments";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { useProfile } from "@/hooks/useProfile";
import { useAdditionalIncomes } from "@/hooks/useAdditionalIncomes";
import { useSavings } from "@/hooks/useSavings";
import { IncomeDialog } from "@/components/IncomeDialog";
import { MonthSelector } from "@/components/MonthSelector";
import { ExpenseList } from "@/components/ExpenseList";
import { ExportButton } from "@/components/ExportButton";
import { CategoryManager } from "@/components/CategoryManager";
import { InstallmentTracker } from "@/components/InstallmentTracker";
import { SavingsModule } from "@/components/SavingsModule";
import { ReportsView } from "@/components/ReportsView";
import { BottomNav, type AppView } from "@/components/BottomNav";
import { AppSidebar } from "@/components/AppSidebar";
import { HomeView } from "@/components/HomeView";
import { SettingsView } from "@/components/SettingsView";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuickAddFab } from "@/components/QuickAddFab";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnimatePresence, motion } from "framer-motion";
import { useT } from "@/lib/i18n";
import {
  Wallet,
  ChevronRight,
  BarChart3,
  Settings,
} from "lucide-react";

const TITLES: Record<AppView, string> = {
  home: "Inicio",
  goals: "Metas",
  savings: "Ahorros",
  expenses: "Gastos",
  debts: "Deudas",
  reports: "Reportes",
  export: "Exportar",
  settings: "Configuración",
  more: "Más",
};

export default function Dashboard() {
  const t = useT();
  const { user, signOut } = useAuth();
  const [view, setView] = useState<AppView>("home");
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const {
    budget, expenses, loading, totalExpenses, paidCount, prevExpenses,
    cumulativeSavings, updateIncome, updateExpense, addExpense, deleteExpense,
    copyFromPreviousMonth,
  } = useBudget(user?.id, selectedMonth);

  const { categories, categoryNames, addCategory, removeCategory, editCategory, toggleCumulativeSavings } = useCategories(user?.id);
  const { plans, monthPayments, allPayments, createPlan, togglePayment, updatePaymentAmount, deletePlan, monthlyInstallmentTotal } = useInstallments(user?.id, selectedMonth);
  const {
    loading: webauthnLoading,
    registerPasskey,
    isSupported: webauthnSupported,
    credentials: passkeys,
    removePasskey,
    platformAvailable,
  } = useWebAuthn();
  const { profile, saveProfile } = useProfile(user?.id);

  const { freeContribs } = useSavings(user?.id, selectedMonth);
  const savingsTotal = freeContribs.reduce((sum, c) => sum + Number(c.amount), 0);

  const { incomes: additionalIncomes, additionalTotal, addIncome, updateIncomeItem, deleteIncome } =
    useAdditionalIncomes(user?.id, selectedMonth);

  const combinedTotalExpenses = totalExpenses + monthlyInstallmentTotal;
  const salary = Number(budget?.income ?? 0);
  const income = salary + additionalTotal;
  const combinedAvailable = income - combinedTotalExpenses;

  const exportButton = (
    <ExportButton
      expenses={expenses}
      income={income}
      selectedMonth={selectedMonth}
      totalExpenses={combinedTotalExpenses}
      available={combinedAvailable}
      cumulativeSavings={cumulativeSavings}
    />
  );

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t("Cargando...")}</div>
      </div>
    );
  }

  const showMonthSelector = ["home", "goals", "savings", "expenses", "debts", "reports", "export"].includes(view);

  return (
    <div className="flex min-h-dvh bg-background md:h-dvh md:min-h-0 md:overflow-hidden">
      <AppSidebar active={view} onChange={setView} alias={profile.alias} email={user?.email} />

      <div className="min-w-0 flex-1 md:h-dvh md:overflow-y-auto">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-xl md:hidden">
          <div className="row-item justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-soft">
                <Wallet className="h-4.5 w-4.5 text-primary-foreground" />
              </span>
              <h1 className="font-display text-base font-semibold tracking-tight">{t(TITLES[view])}</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 app-scroll-pad md:px-8 md:py-8 md:pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              {showMonthSelector && (
                <div className="section-head">
                  <div className="section-head-text">
                    <MonthSelector
                      selectedMonth={selectedMonth}
                      onChangeMonth={setSelectedMonth}
                      onCopyPrevious={copyFromPreviousMonth}
                    />
                  </div>
                  <div className="section-head-actions">
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
                </div>
              )}

              {view === "home" && (
                <HomeView
                  alias={profile.alias}
                  userEmail={user?.email}
                  income={income}
                  totalExpenses={combinedTotalExpenses}
                  available={combinedAvailable}
                  paidCount={paidCount}
                  totalCount={expenses.length}
                  expenses={expenses}
                  prevExpenses={prevExpenses}
                  monthPayments={monthPayments}
                  installmentMonthTotal={monthlyInstallmentTotal}
                  savingsTotal={savingsTotal}
                  onNavigate={setView}
                  onOpenIncome={() => setIncomeOpen(true)}
                />
              )}

              {view === "goals" && <SavingsModule userId={user?.id} selectedMonth={selectedMonth} mode="goals" />}
              {view === "savings" && <SavingsModule userId={user?.id} selectedMonth={selectedMonth} mode="savings" />}

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
                  allPayments={allPayments}
                  onCreatePlan={createPlan}
                  onTogglePayment={togglePayment}
                  onDeletePlan={deletePlan}
                  onUpdatePaymentAmount={updatePaymentAmount}
                />
              )}

              {view === "reports" && (
                <ReportsView userId={user?.id} selectedMonth={selectedMonth} />
              )}


              {view === "export" && (
                <Card className="card-std">
                  <CardContent className="space-y-4 p-0">
                    <div>
                      <h3 className="section-title text-base">Exportar datos</h3>
                      <p className="text-sm text-muted-foreground">Descarga el resumen del mes seleccionado.</p>
                    </div>
                    {exportButton}
                  </CardContent>
                </Card>
              )}

              {view === "settings" && (
                <SettingsView
                  email={user?.email}
                  profile={profile}
                  onSaveProfile={saveProfile}
                  onRegisterPasskey={registerPasskey}
                  biometricSupported={webauthnSupported}
                  biometricLoading={webauthnLoading}
                  passkeys={passkeys}
                  onRemovePasskey={(id) => { void removePasskey(id); }}
                  biometricPlatformAvailable={platformAvailable}
                  onSignOut={signOut}
                />
              )}

              {view === "more" && <MoreView onNavigate={setView} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <IncomeDialog
        open={incomeOpen}
        onOpenChange={setIncomeOpen}
        salary={salary}
        onSaveSalary={updateIncome}
        incomes={additionalIncomes}
        onAdd={addIncome}
        onUpdate={updateIncomeItem}
        onDelete={deleteIncome}
      />

      <QuickAddFab onNavigate={setView} />

      <BottomNav active={view} onChange={setView} />
    </div>
  );
}

const MORE_ITEMS: { key: AppView; label: string; icon: typeof BarChart3 }[] = [
  { key: "reports", label: "Reportes", icon: BarChart3 },
  { key: "settings", label: "Configuración", icon: Settings },
];

function MoreView({ onNavigate }: { onNavigate: (v: AppView) => void }) {
  const t = useT();
  return (
    <Card className="rounded-2xl border shadow-soft">
      <CardContent className="p-2">
        {MORE_ITEMS.map((it) => {
          const Icon = it.icon;
          return (
            <button
              key={it.key}
              onClick={() => onNavigate(it.key)}
              className="row-item w-full justify-between rounded-xl px-3 py-3.5 text-left transition-colors hover:bg-muted"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <Icon className="h-4 w-4 text-primary" /> {t(it.label)}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
