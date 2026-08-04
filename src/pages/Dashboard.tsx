import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBudget } from "@/hooks/useBudget";
import { useCategories } from "@/hooks/useCategories";
import { useInstallments } from "@/hooks/useInstallments";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { useProfilePrefs } from "@/hooks/useProfilePrefs";
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
import { QuickAddFab } from "@/components/QuickAddFab";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Wallet, Fingerprint, ChevronRight, User, ShieldCheck, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { prefs, savePrefs } = useProfilePrefs();
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
  const { plans, monthPayments, allPayments, createPlan, togglePayment, updatePaymentAmount, deletePlan, monthlyInstallmentTotal } = useInstallments(user?.id, selectedMonth);
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
    more: "Configuración",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary shadow-soft">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">{titleMap[view]}</h1>
          </div>

          <div className="hidden md:block">
            <BottomNav active={view} onChange={setView} />
          </div>

          <div className="flex items-center gap-1">
            <span className="hidden text-sm text-muted-foreground lg:inline">
              {user?.email}
            </span>
            <ThemeToggle />
            {webauthnSupported && (
              <Button variant="ghost" size="icon" className="rounded-full" onClick={registerPasskey} disabled={webauthnLoading} title="Registrar biometría">
                <Fingerprint className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="rounded-full" onClick={signOut} title="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 pb-32 md:pb-12">
        <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-5"
        >
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
            displayName={prefs.alias}
            income={income}
            totalExpenses={combinedTotalExpenses}
            available={combinedAvailable}
            paidCount={paidCount}
            totalCount={expenses.length}
            expenses={expenses}
            monthPayments={monthPayments}
            installmentMonthTotal={monthlyInstallmentTotal}
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
            allPayments={allPayments}
            onCreatePlan={createPlan}
            onTogglePayment={togglePayment}
            onDeletePlan={deletePlan}
            onUpdatePaymentAmount={updatePaymentAmount}
          />
        )}

        {view === "more" && (
          <MoreView
            userEmail={user?.email}
            prefs={prefs}
            onSavePrefs={savePrefs}
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
        </motion.div>
        </AnimatePresence>
      </main>

      <QuickAddFab onNavigate={setView} />

      <div className="md:hidden">
        <BottomNav active={view} onChange={setView} />
      </div>
    </div>
  );
}

function MoreView({
  userEmail,
  prefs,
  onSavePrefs,
  exportButton,
  biometricButton,
  onSignOut,
}: {
  userEmail?: string;
  prefs: { alias: string; currency: string; language: string };
  onSavePrefs: (p: Partial<{ alias: string; currency: string; language: string }>) => void;
  exportButton: React.ReactNode;
  biometricButton: React.ReactNode;
  onSignOut: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Perfil */}
      <Card className="rounded-3xl border shadow-soft">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="icon-tile h-11 w-11 bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold tracking-tight">Perfil</h3>
              <p className="text-xs text-muted-foreground">Cómo te mostramos en la app</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="alias">Alias o nombre mostrado</Label>
            <Input
              id="alias"
              value={prefs.alias}
              onChange={(e) => onSavePrefs({ alias: e.target.value })}
              placeholder="Ej: Juan"
            />
            <p className="text-[11px] text-muted-foreground">Se usa en el saludo del inicio.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Moneda</Label>
              <Select value={prefs.currency} onValueChange={(v) => onSavePrefs({ currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="COP">Peso colombiano (COP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Idioma</Label>
              <Select value={prefs.language} onValueChange={(v) => onSavePrefs({ language: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-2xl bg-muted/50 px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Correo</p>
            <p className="mt-0.5 truncate text-sm font-semibold">{userEmail}</p>
          </div>
        </CardContent>
      </Card>

      {/* Seguridad */}
      <Card className="rounded-3xl border shadow-soft">
        <CardContent className="p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-3">
            <span className="icon-tile h-11 w-11 bg-success/10 text-success">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold tracking-tight">Seguridad</h3>
              <p className="text-xs text-muted-foreground">Acceso y sesión</p>
            </div>
          </div>

          <div className="divide-y">
            {biometricButton && <Row label="Biometría" action={biometricButton} />}
            <Row
              label="Cambiar contraseña"
              action={
                <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={() => (window.location.href = "/reset-password")}>
                  <KeyRound className="h-4 w-4" />
                  Cambiar
                </Button>
              }
            />
            <Row label="Exportar datos" action={exportButton} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border shadow-soft">
        <CardContent className="p-2">
          <button
            onClick={onSignOut}
            className="flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-destructive transition-colors hover:bg-destructive/5"
          >
            <span className="flex items-center gap-3 font-semibold">
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
    <div className="flex items-center justify-between gap-3 py-3">
      <span className="text-sm font-medium">{label}</span>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

