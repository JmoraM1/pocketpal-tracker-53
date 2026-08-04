import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Target, PiggyBank, Plus, Pencil, Trash2, Trophy, CalendarClock, History, Sparkles, Flag } from "lucide-react";
import { formatCOP } from "@/lib/constants";
import { useSavings } from "@/hooks/useSavings";

function formatDateTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("es-CO", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
}

const cardMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
};

interface Props {
  userId: string | undefined;
  selectedMonth: Date;
  mode: "goals" | "savings";
}

export function SavingsModule({ userId, selectedMonth, mode }: Props) {
  const s = useSavings(userId, selectedMonth);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalInitial, setNewGoalInitial] = useState("");
  const [newSavingName, setNewSavingName] = useState("");
  const [newSavingInitial, setNewSavingInitial] = useState("");
  const [openGoal, setOpenGoal] = useState(false);
  const [openSaving, setOpenSaving] = useState(false);

  const handleCreateGoal = async () => {
    if (!newGoalName.trim() || !newGoalTarget) return;
    await s.createGoal(newGoalName.trim(), Number(newGoalTarget), Number(newGoalInitial || 0));
    setNewGoalName(""); setNewGoalTarget(""); setNewGoalInitial(""); setOpenGoal(false);
  };

  const handleCreateSaving = async () => {
    if (!newSavingName.trim()) return;
    await s.createFreeSaving(newSavingName.trim(), Number(newSavingInitial || 0));
    setNewSavingName(""); setNewSavingInitial(""); setOpenSaving(false);
  };

  if (mode === "goals") {
    return (
      <Card className="rounded-3xl border shadow-soft">
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="icon-tile h-11 w-11 bg-primary/10 text-primary">
              <Target className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-lg font-bold tracking-tight">Metas</CardTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Define objetivos y registra aportes cada mes.
              </p>
            </div>
          </div>
          <Dialog open={openGoal} onOpenChange={setOpenGoal}>
            <DialogTrigger asChild>
              <Button size="sm" className="shrink-0 gap-1 rounded-full px-4 shadow-soft">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nueva meta</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle>Nueva meta de ahorro</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Nombre</Label>
                  <Input value={newGoalName} onChange={(e) => setNewGoalName(e.target.value)} placeholder="Ej: Viaje a la costa" />
                </div>
                <div className="space-y-1.5">
                  <Label>Valor objetivo</Label>
                  <MoneyInput value={newGoalTarget} onChange={(v) => setNewGoalTarget(v)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Monto inicial (opcional)</Label>
                  <MoneyInput value={newGoalInitial} onChange={(v) => setNewGoalInitial(v)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateGoal}>Crear</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl">
              <TabsTrigger value="active" className="rounded-xl">Activas ({s.activeGoals.length})</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-xl">Completadas ({s.completedGoals.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-3 pt-4">
              {s.activeGoals.length === 0 && <EmptyState icon={Target} text="Aún no tienes metas activas." />}
              {s.activeGoals.map((g) => (
                <GoalCard
                  key={g.id}
                  goal={g}
                  total={s.goalTotal(g.id)}
                  monthAmount={s.goalMonthAmount(g.id)}
                  contributions={s.goalContribs.filter((c) => c.goal_id === g.id)}
                  onUpdate={s.updateGoal}
                  onDelete={s.deleteGoal}
                  onSetMonth={s.setGoalContribution}
                  onDeleteContrib={s.deleteGoalContribution}
                />
              ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-3 pt-4">
              {s.completedGoals.length === 0 && <EmptyState icon={Trophy} text="Aún no tienes metas completadas." />}
              {s.completedGoals.map((g) => (
                <motion.div
                  key={g.id}
                  {...cardMotion}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-success/20 bg-success/5 p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="icon-tile h-10 w-10 bg-success/15 text-success">
                      <Trophy className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{g.name}</p>
                      <p className="text-xs text-success">Meta completada</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="hidden text-sm font-bold tabular-nums sm:inline">
                      {formatCOP(s.goalTotal(g.id))} / {formatCOP(Number(g.target_amount))}
                    </span>
                    <ConfirmDeleteButton onConfirm={() => s.deleteGoal(g.id)} />
                  </div>
                </motion.div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  // mode === "savings"
  return (
    <Card className="rounded-3xl border shadow-soft">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="icon-tile h-11 w-11 bg-success/10 text-success">
            <PiggyBank className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-lg font-bold tracking-tight">Ahorros</CardTitle>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Registra aportes libres y consulta el total acumulado.
            </p>
          </div>
        </div>
        <Dialog open={openSaving} onOpenChange={setOpenSaving}>
          <DialogTrigger asChild>
            <Button size="sm" className="shrink-0 gap-1 rounded-full px-4 shadow-soft">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo ahorro</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader><DialogTitle>Nuevo ahorro</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input value={newSavingName} onChange={(e) => setNewSavingName(e.target.value)} placeholder="Ej: Ahorro libre" />
              </div>
              <div className="space-y-1.5">
                <Label>Monto inicial (opcional)</Label>
                <MoneyInput value={newSavingInitial} onChange={(v) => setNewSavingInitial(v)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateSaving}>Crear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3 p-5 pt-0 sm:p-6 sm:pt-0">
        {s.freeSavings.length === 0 && <EmptyState icon={PiggyBank} text="Aún no tienes ahorros registrados." />}
        {s.freeSavings.map((f) => (
          <FreeSavingCard
            key={f.id}
            saving={f}
            total={s.freeTotal(f.id)}
            monthAmount={s.freeMonthAmount(f.id)}
            contributions={s.freeContribs.filter((c) => c.saving_id === f.id)}
            onUpdate={s.updateFreeSaving}
            onDelete={s.deleteFreeSaving}
            onSetMonth={s.setFreeContribution}
            onDeleteContrib={s.deleteFreeContribution}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Target; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-10 text-center">
      <span className="icon-tile h-12 w-12 bg-muted text-muted-foreground">
        <Icon className="h-6 w-6" />
      </span>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function ProgressBar({ pct, tone = "primary" }: { pct: number; tone?: "primary" | "success" }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`h-full rounded-full ${tone === "success" ? "bg-success" : "bg-gradient-primary"}`}
      />
    </div>
  );
}

function Metric({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl bg-muted/50 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-0.5 truncate text-sm font-bold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

// ---------------- GOAL CARD ----------------
function GoalCard({ goal, total, monthAmount, contributions, onUpdate, onDelete, onSetMonth, onDeleteContrib }: any) {
  const [editName, setEditName] = useState(goal.name);
  const [editTarget, setEditTarget] = useState(String(goal.target_amount));
  const [amount, setAmount] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const target = Number(goal.target_amount);
  const pct = target > 0 ? Math.min(100, (total / target) * 100) : 0;
  const remaining = Math.max(0, target - total);

  const sorted = [...contributions].sort((a: any, b: any) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  const last = sorted[0];

  // Fecha estimada según el ritmo promedio de aportes (solo informativa)
  const estimated = (() => {
    if (remaining <= 0 || contributions.length === 0) return null;
    const months = new Set(contributions.map((c: any) => c.month)).size || 1;
    const avg = total / months;
    if (avg <= 0) return null;
    const monthsLeft = Math.ceil(remaining / avg);
    if (!isFinite(monthsLeft) || monthsLeft > 600) return null;
    const d = new Date();
    d.setMonth(d.getMonth() + monthsLeft);
    return formatShortDate(d);
  })();

  const save = async () => {
    if (Number(amount) > 0) {
      await onSetMonth(goal.id, Number(amount));
      setAmount("");
      setAddOpen(false);
    }
  };

  return (
    <motion.div {...cardMotion} className="list-card space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="icon-tile h-11 w-11 bg-primary/10 text-primary">
            <Flag className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold tracking-tight">{goal.name}</h3>
            <p className="text-xs text-muted-foreground">Objetivo {formatCOP(target)}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-0.5">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" aria-label="Editar meta">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle>Editar meta</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>Nombre</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Valor objetivo</Label><MoneyInput value={editTarget} onChange={(v) => setEditTarget(v)} /></div>
              </div>
              <DialogFooter>
                <Button onClick={async () => { await onUpdate(goal.id, { name: editName, target_amount: Number(editTarget) }); setEditOpen(false); }}>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <ConfirmDeleteButton onConfirm={() => onDelete(goal.id)} />
        </div>
      </div>

      <div className="space-y-2">
        <ProgressBar pct={pct} />
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-primary">{formatCOP(total)} ahorrado</span>
          <span className="font-bold tabular-nums">{pct.toFixed(0)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Ahorrado" value={formatCOP(total)} tone="text-success" />
        <Metric label="Restante" value={formatCOP(remaining)} />
        <Metric label="Este mes" value={formatCOP(monthAmount)} />
        <Metric label="Fecha estimada" value={estimated ?? "—"} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5" />
          {last ? `Último aporte ${formatCOP(Number(last.amount))} · ${formatDateTime(last.created_at)}` : "Sin aportes todavía"}
        </p>
        <div className="flex items-center gap-2">
          {contributions.length > 0 && (
            <Dialog open={histOpen} onOpenChange={setHistOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 rounded-full text-xs">
                  <History className="h-3.5 w-3.5" />
                  {contributions.length} aportes
                </Button>
              </DialogTrigger>
              <HistoryDialog title={goal.name} contributions={sorted} onDeleteContrib={onDeleteContrib} />
            </Dialog>
          )}
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1 rounded-full px-4">
                <Plus className="h-4 w-4" /> Agregar aporte
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle>Nuevo aporte — {goal.name}</DialogTitle></DialogHeader>
              <div className="space-y-1.5">
                <Label>Valor del aporte</Label>
                <MoneyInput value={amount} onChange={(v) => setAmount(v)} autoFocus />
                {monthAmount > 0 && (
                  <p className="text-xs text-muted-foreground">Aportado este mes: {formatCOP(monthAmount)}</p>
                )}
              </div>
              <DialogFooter>
                <Button onClick={save}>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------- FREE SAVING CARD ----------------
function FreeSavingCard({ saving, total, monthAmount, contributions, onUpdate, onDelete, onSetMonth, onDeleteContrib }: any) {
  const [editName, setEditName] = useState(saving.name);
  const [amount, setAmount] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const sorted = [...contributions].sort((a: any, b: any) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  const best = Math.max(1, ...contributions.map((c: any) => Number(c.amount) || 0));
  const monthPct = Math.min(100, (monthAmount / best) * 100);

  const motivation =
    total <= 0
      ? "Empieza con un primer aporte, por pequeño que sea."
      : monthAmount > 0
        ? "¡Excelente! Sumaste a tu ahorro este mes."
        : "Aún estás a tiempo de aportar este mes.";

  const save = async () => {
    if (Number(amount) > 0) {
      await onSetMonth(saving.id, Number(amount));
      setAmount("");
      setAddOpen(false);
    }
  };

  return (
    <motion.div {...cardMotion} className="list-card space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="icon-tile h-11 w-11 bg-success/10 text-success">
            <PiggyBank className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold tracking-tight">{saving.name}</h3>
            <p className="text-xs text-muted-foreground">Ahorro libre · {contributions.length} aportes</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-0.5">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" aria-label="Editar ahorro">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle>Editar ahorro</DialogTitle></DialogHeader>
              <div className="space-y-1.5"><Label>Nombre</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
              <DialogFooter>
                <Button onClick={async () => { await onUpdate(saving.id, editName); setEditOpen(false); }}>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <ConfirmDeleteButton onConfirm={() => onDelete(saving.id)} />
        </div>
      </div>

      <div>
        <p className="text-2xl font-extrabold tracking-tight tabular-nums">{formatCOP(total)}</p>
        <p className="text-xs text-muted-foreground">Valor actual acumulado</p>
      </div>

      <div className="space-y-2">
        <ProgressBar pct={monthPct} tone="success" />
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Aporte del mes {formatCOP(monthAmount)}</span>
          <span className="font-bold tabular-nums">{monthPct.toFixed(0)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Metric label="Objetivo" value="Ahorro libre" />
        <Metric label="Este mes" value={formatCOP(monthAmount)} tone="text-success" />
      </div>

      <p className="flex items-center gap-2 rounded-2xl bg-success/10 px-3 py-2 text-xs font-medium text-success">
        <Sparkles className="h-3.5 w-3.5 shrink-0" />
        {motivation}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5" />
          {sorted[0] ? `Último aporte ${formatDateTime(sorted[0].created_at)}` : "Sin aportes todavía"}
        </p>
        <div className="flex items-center gap-2">
          {contributions.length > 0 && (
            <Dialog open={histOpen} onOpenChange={setHistOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 rounded-full text-xs">
                  <History className="h-3.5 w-3.5" />
                  {contributions.length} aportes
                </Button>
              </DialogTrigger>
              <HistoryDialog title={saving.name} contributions={sorted} onDeleteContrib={onDeleteContrib} />
            </Dialog>
          )}
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1 rounded-full px-4">
                <Plus className="h-4 w-4" /> Agregar aporte
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle>Nuevo aporte — {saving.name}</DialogTitle></DialogHeader>
              <div className="space-y-1.5">
                <Label>Valor del aporte</Label>
                <MoneyInput value={amount} onChange={(v) => setAmount(v)} autoFocus />
                {monthAmount > 0 && (
                  <p className="text-xs text-muted-foreground">Aportado este mes: {formatCOP(monthAmount)}</p>
                )}
              </div>
              <DialogFooter>
                <Button onClick={save}>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </motion.div>
  );
}

function HistoryDialog({ title, contributions, onDeleteContrib }: { title: string; contributions: any[]; onDeleteContrib: (id: string) => void }) {
  return (
    <DialogContent className="rounded-3xl">
      <DialogHeader><DialogTitle>Historial — {title}</DialogTitle></DialogHeader>
      <div className="max-h-[60vh] space-y-1.5 overflow-y-auto">
        {contributions.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-2xl border p-3 transition-colors hover:bg-muted/50">
            <span className="text-sm text-muted-foreground">{formatDateTime(c.created_at)}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tabular-nums text-success">{formatCOP(Number(c.amount))}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full text-destructive" aria-label="Eliminar aporte" onClick={() => onDeleteContrib(c.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </DialogContent>
  );
}

function ConfirmDeleteButton({ onConfirm, className = "h-8 w-8" }: { onConfirm: () => void; className?: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Eliminar" className={`rounded-full text-destructive hover:bg-destructive/10 ${className}`}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar meta</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas eliminar esta meta? Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
