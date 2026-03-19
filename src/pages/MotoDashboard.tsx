import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Target, Fuel, Wrench, ShieldCheck, FileCheck, Trash2, Pencil } from "lucide-react";
import { formatCOP } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import motoImage from "@/assets/moto.jpeg";

const MOTO_CATEGORIES = [
  { name: "SOAT", icon: ShieldCheck, color: "from-red-500 to-rose-600" },
  { name: "Tecnomecánica", icon: FileCheck, color: "from-amber-500 to-orange-600" },
  { name: "Mantenimiento", icon: Wrench, color: "from-blue-500 to-indigo-600" },
  { name: "Gasolina", icon: Fuel, color: "from-emerald-500 to-teal-600" },
];

interface MotoExpense {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  expense_date: string;
  created_at: string;
}

interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
}

interface MotoDashboardProps {
  userId: string;
  onBack: () => void;
}

export default function MotoDashboard({ userId, onBack }: MotoDashboardProps) {
  const [expenses, setExpenses] = useState<MotoExpense[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);

  // New expense form
  const [newCategory, setNewCategory] = useState("SOAT");
  const [newAmount, setNewAmount] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);

  // New goal form
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");

  // Contribution form
  const [contributionAmount, setContributionAmount] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data: expData }, { data: goalData }] = await Promise.all([
      supabase.from("moto_expenses").select("*").eq("user_id", userId).order("expense_date", { ascending: false }).limit(50),
      supabase.from("moto_savings_goals").select("*").eq("user_id", userId).order("created_at"),
    ]);
    setExpenses((expData as MotoExpense[]) ?? []);
    setGoals((goalData as SavingsGoal[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddExpense = async () => {
    const amount = parseFloat(newAmount);
    if (!amount || amount <= 0) return;
    const { data } = await supabase.from("moto_expenses").insert({
      user_id: userId, category: newCategory, amount, description: newDescription || null, expense_date: newDate,
    }).select().single();
    if (data) {
      setExpenses((prev) => [data as MotoExpense, ...prev]);
      setAddExpenseOpen(false);
      setNewAmount(""); setNewDescription("");
      toast({ title: "Gasto registrado" });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    await supabase.from("moto_expenses").delete().eq("id", id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const handleAddGoal = async () => {
    const target = parseFloat(goalTarget);
    if (!goalName.trim() || !target || target <= 0) return;
    const { data } = await supabase.from("moto_savings_goals").insert({
      user_id: userId, name: goalName.trim(), target_amount: target,
      deadline: goalDeadline || null,
    }).select().single();
    if (data) {
      setGoals((prev) => [...prev, data as SavingsGoal]);
      setAddGoalOpen(false);
      setGoalName(""); setGoalTarget(""); setGoalDeadline("");
      toast({ title: "Meta creada" });
    }
  };

  const handleContribute = async () => {
    if (!contributeGoalId) return;
    const amount = parseFloat(contributionAmount);
    if (!amount || amount <= 0) return;
    await supabase.from("moto_savings_contributions").insert({
      goal_id: contributeGoalId, user_id: userId, amount,
    });
    const goal = goals.find((g) => g.id === contributeGoalId);
    if (goal) {
      const newCurrent = goal.current_amount + amount;
      await supabase.from("moto_savings_goals").update({ current_amount: newCurrent }).eq("id", contributeGoalId);
      setGoals((prev) => prev.map((g) => g.id === contributeGoalId ? { ...g, current_amount: newCurrent } : g));
    }
    setContributeGoalId(null);
    setContributionAmount("");
    toast({ title: "Abono registrado 💰" });
  };

  const handleUpdateGoalTarget = async () => {
    if (!editGoal) return;
    const target = parseFloat(goalTarget);
    if (!target || target <= 0) return;
    await supabase.from("moto_savings_goals").update({
      name: goalName.trim() || editGoal.name,
      target_amount: target,
      deadline: goalDeadline || null,
    }).eq("id", editGoal.id);
    setGoals((prev) => prev.map((g) => g.id === editGoal.id ? {
      ...g, name: goalName.trim() || g.name, target_amount: target, deadline: goalDeadline || null,
    } : g));
    setEditGoal(null);
    setGoalName(""); setGoalTarget(""); setGoalDeadline("");
    toast({ title: "Meta actualizada" });
  };

  const handleDeleteGoal = async (id: string) => {
    await supabase.from("moto_savings_goals").delete().eq("id", id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
    toast({ title: "Meta eliminada" });
  };

  const totalByCategory = MOTO_CATEGORIES.map((cat) => ({
    ...cat,
    total: expenses.filter((e) => e.category === cat.name).reduce((s, e) => s + Number(e.amount), 0),
  }));

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="animate-pulse text-muted-foreground">Cargando...</div></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with moto image */}
      <header className="relative overflow-hidden border-b bg-card">
        <div className="absolute inset-0">
          <img src={motoImage} alt="Mi moto" className="h-full w-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/60" />
        </div>
        <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Mi Moto 🏍️</h1>
              <p className="text-xs text-muted-foreground">Gastos y metas de ahorro</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {/* Category summary cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {totalByCategory.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.name} className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${cat.color}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs text-muted-foreground">{cat.name}</p>
                <p className="text-lg font-bold">{formatCOP(cat.total)}</p>
              </div>
            );
          })}
        </div>

        {/* Savings Goals */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Metas de Ahorro</h2>
            <Dialog open={addGoalOpen} onOpenChange={setAddGoalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1"><Plus className="h-4 w-4" /> Meta</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nueva Meta de Ahorro</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Nombre (ej: SOAT 2027)</Label>
                    <Input value={goalName} onChange={(e) => setGoalName(e.target.value)} placeholder="SOAT 2027" />
                  </div>
                  <div className="space-y-2">
                    <Label>Monto objetivo</Label>
                    <Input type="number" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} placeholder="500000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha límite (opcional)</Label>
                    <Input type="date" value={goalDeadline} onChange={(e) => setGoalDeadline(e.target.value)} />
                  </div>
                  <Button onClick={handleAddGoal} className="w-full">Crear Meta</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {goals.length === 0 && (
            <div className="rounded-2xl border border-dashed bg-card/50 p-6 text-center text-sm text-muted-foreground">
              No tienes metas de ahorro aún. ¡Crea una para SOAT o Tecnomecánica!
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {goals.map((goal) => {
              const pct = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
              const remaining = Math.max(goal.target_amount - goal.current_amount, 0);
              return (
                <div key={goal.id} className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold">{goal.name}</h3>
                      {goal.deadline && (
                        <p className="text-xs text-muted-foreground">Fecha límite: {new Date(goal.deadline).toLocaleDateString("es-CO")}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                        setEditGoal(goal);
                        setGoalName(goal.name);
                        setGoalTarget(String(goal.target_amount));
                        setGoalDeadline(goal.deadline ?? "");
                      }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteGoal(goal.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span>{formatCOP(goal.current_amount)}</span>
                      <span className="text-muted-foreground">{formatCOP(goal.target_amount)}</span>
                    </div>
                    <Progress value={pct} className="h-3" />
                    <p className="text-xs text-muted-foreground">{pct.toFixed(0)}% — Faltan {formatCOP(remaining)}</p>
                  </div>
                  <Button size="sm" variant="secondary" className="w-full gap-1" onClick={() => setContributeGoalId(goal.id)}>
                    <Plus className="h-4 w-4" /> Abonar
                  </Button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Expenses List */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Gastos Registrados</h2>
            <Dialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Gasto</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Registrar Gasto</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MOTO_CATEGORIES.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Monto</Label>
                    <Input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="50000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción (opcional)</Label>
                    <Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Cambio de aceite" />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                  </div>
                  <Button onClick={handleAddExpense} className="w-full">Registrar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {expenses.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card/50 p-6 text-center text-sm text-muted-foreground">
              No hay gastos registrados aún.
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((exp) => {
                const catInfo = MOTO_CATEGORIES.find((c) => c.name === exp.category);
                const Icon = catInfo?.icon ?? Wrench;
                return (
                  <div key={exp.id} className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${catInfo?.color ?? "from-gray-500 to-gray-600"}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{exp.category}{exp.description ? ` — ${exp.description}` : ""}</p>
                      <p className="text-xs text-muted-foreground">{new Date(exp.expense_date).toLocaleDateString("es-CO")}</p>
                    </div>
                    <p className="font-bold text-sm">{formatCOP(Number(exp.amount))}</p>
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-destructive" onClick={() => handleDeleteExpense(exp.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Contribute Dialog */}
      <Dialog open={!!contributeGoalId} onOpenChange={(o) => { if (!o) setContributeGoalId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Abonar a meta</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Monto a abonar</Label>
              <Input type="number" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} placeholder="50000" />
            </div>
            <Button onClick={handleContribute} className="w-full">Abonar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Goal Dialog */}
      <Dialog open={!!editGoal} onOpenChange={(o) => { if (!o) { setEditGoal(null); setGoalName(""); setGoalTarget(""); setGoalDeadline(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Meta</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={goalName} onChange={(e) => setGoalName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Monto objetivo</Label>
              <Input type="number" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fecha límite (opcional)</Label>
              <Input type="date" value={goalDeadline} onChange={(e) => setGoalDeadline(e.target.value)} />
            </div>
            <Button onClick={handleUpdateGoalTarget} className="w-full">Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
