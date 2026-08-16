import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { Target, PiggyBank, Plus, Pencil, Trash2, Check, Trophy } from "lucide-react";
import { formatCOP } from "@/lib/constants";
import { useSavings } from "@/hooks/useSavings";
import { useT } from "@/lib/i18n";

function formatDateTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("es-CO", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

interface Props {
  userId: string | undefined;
  selectedMonth: Date;
  mode: "goals" | "savings";
}

export function SavingsModule({ userId, selectedMonth, mode }: Props) {
  const t = useT();
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
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {t("Metas")}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t("Define objetivos y registra aportes múltiples cada mes.")}
            </p>
          </div>
          <Dialog open={openGoal} onOpenChange={setOpenGoal}>
            <DialogTrigger asChild>
              <Button size="sm" className="shrink-0 whitespace-nowrap"><Plus className="mr-1 h-4 w-4" />{t("Nueva meta")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t("Nueva meta de ahorro")}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>{t("Nombre")}</Label>
                  <Input value={newGoalName} onChange={(e) => setNewGoalName(e.target.value)} placeholder={t("Ej: Viaje a la costa")} />
                </div>
                <div>
                  <Label>{t("Valor objetivo")}</Label>
                  <MoneyInput value={newGoalTarget} onChange={(v) => setNewGoalTarget(v)} />
                </div>
                <div>
                  <Label>{t("Monto inicial (opcional)")}</Label>
                  <MoneyInput value={newGoalInitial} onChange={(v) => setNewGoalInitial(v)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateGoal}>{t("Crear")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">{t("Activas")} ({s.activeGoals.length})</TabsTrigger>
              <TabsTrigger value="completed">{t("Completadas")} ({s.completedGoals.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-3 pt-4">
              {s.activeGoals.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">{t("Aún no tienes metas activas.")}</p>
              )}
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

            <TabsContent value="completed" className="space-y-2 pt-4">
              {s.completedGoals.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">{t("Aún no tienes metas completadas.")}</p>
              )}
              {s.completedGoals.map((g) => (
                <div key={g.id} className="flex items-center justify-between rounded-xl border bg-muted/40 p-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{t("Meta completada")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-semibold text-sm">{formatCOP(s.goalTotal(g.id), g.currency)} / {formatCOP(Number(g.target_amount), g.currency)}</span>
                    <ConfirmDeleteButton onConfirm={() => s.deleteGoal(g.id)} />
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  // mode === "savings"
  return (
    <Card className="rounded-2xl border shadow-sm">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-primary" />
            {t("Ahorros")}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t("Registra aportes libres y consulta el total acumulado.")}
          </p>
        </div>
        <Dialog open={openSaving} onOpenChange={setOpenSaving}>
          <DialogTrigger asChild>
            <Button size="sm" className="shrink-0 whitespace-nowrap"><Plus className="mr-1 h-4 w-4" />{t("Nuevo ahorro")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("Nuevo ahorro")}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>{t("Nombre")}</Label>
                <Input value={newSavingName} onChange={(e) => setNewSavingName(e.target.value)} placeholder={t("Ej: Ahorro libre")} />
              </div>
              <div>
                <Label>{t("Monto inicial (opcional)")}</Label>
                <MoneyInput value={newSavingInitial} onChange={(v) => setNewSavingInitial(v)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateSaving}>{t("Crear")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        {s.freeSavings.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-6">{t("Aún no tienes ahorros registrados.")}</p>
        )}
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


// ---------------- GOAL CARD ----------------
function GoalCard({ goal, total, monthAmount, contributions, onUpdate, onDelete, onSetMonth, onDeleteContrib }: any) {
  const t = useT();
  const [editName, setEditName] = useState(goal.name);
  const [editTarget, setEditTarget] = useState(String(goal.target_amount));
  const [amount, setAmount] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [histOpen, setHistOpen] = useState(false);

  const target = Number(goal.target_amount);
  const pct = target > 0 ? Math.min(100, (total / target) * 100) : 0;

  return (
    <div className="rounded-lg border bg-card/50 backdrop-blur-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{goal.name}</h3>
          <p className="text-xs text-muted-foreground">{t("Objetivo:")} {formatCOP(target, goal.currency)}</p>
        </div>
        <div className="flex gap-1">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t("Editar meta")}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>{t("Nombre")}</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
                <div><Label>{t("Valor objetivo")}</Label><MoneyInput value={editTarget} onChange={(v) => setEditTarget(v)} /></div>
              </div>
              <DialogFooter>
                <Button onClick={async () => { await onUpdate(goal.id, { name: editName, target_amount: Number(editTarget) }); setEditOpen(false); }}>{t("Guardar")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <ConfirmDeleteButton onConfirm={() => onDelete(goal.id)} className="h-7 w-7" title={t("Eliminar meta")} description={t("¿Estás seguro de que deseas eliminar esta meta? Esta acción no se puede deshacer.")} />
        </div>
      </div>

      <Progress value={pct} className="h-2.5" />
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-primary">{formatCOP(total, goal.currency)} {t("ahorrado")}</span>
        <span className="text-muted-foreground">{pct.toFixed(0)}%</span>
        <span className="text-muted-foreground">{t("Faltan")} {formatCOP(Math.max(0, target - total), goal.currency)}</span>
      </div>

      <div className="flex items-end gap-2 pt-2 border-t">
        <div className="flex-1">
          <Label className="text-xs">{t("Nuevo aporte")}</Label>
          <MoneyInput value={amount} onChange={(v) => setAmount(v)} />
          {monthAmount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{t("Aportado este mes:")} {formatCOP(monthAmount, goal.currency)}</p>
          )}
        </div>
        <Button size="sm" onClick={async () => { if (Number(amount) > 0) { await onSetMonth(goal.id, Number(amount)); setAmount(""); } }}>
          <Check className="mr-1 h-4 w-4" />{t("Guardar")}
        </Button>
      </div>

      {contributions.length > 0 && (
        <Dialog open={histOpen} onOpenChange={setHistOpen}>
          <DialogTrigger asChild>
            <Button variant="link" size="sm" className="px-0 h-auto">{t("Ver historial ({count} aportes)", { count: contributions.length })}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("Historial —")} {goal.name}</DialogTitle></DialogHeader>
            <div className="space-y-1 max-h-[45vh] overflow-y-auto">
              {[...contributions].sort((a: any, b: any) => (b.created_at ?? "").localeCompare(a.created_at ?? "")).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between rounded p-2 hover:bg-muted/50">
                  <span className="text-sm">{formatDateTime(c.created_at)}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">{formatCOP(Number(c.amount), goal.currency)}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => onDeleteContrib(c.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ---------------- FREE SAVING CARD ----------------
function FreeSavingCard({ saving, total, monthAmount, contributions, onUpdate, onDelete, onSetMonth, onDeleteContrib }: any) {
  const t = useT();
  const [editName, setEditName] = useState(saving.name);
  const [amount, setAmount] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [histOpen, setHistOpen] = useState(false);

  return (
    <div className="rounded-lg border bg-card/50 backdrop-blur-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{saving.name}</h3>
          <p className="text-xs text-muted-foreground">{t("Acumulado:")} <span className="font-semibold text-primary">{formatCOP(total, saving.currency)}</span></p>
        </div>
        <div className="flex gap-1">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t("Editar ahorro")}</DialogTitle></DialogHeader>
              <div><Label>{t("Nombre")}</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
              <DialogFooter>
                <Button onClick={async () => { await onUpdate(saving.id, editName); setEditOpen(false); }}>{t("Guardar")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <ConfirmDeleteButton onConfirm={() => onDelete(saving.id)} className="h-7 w-7" title={t("Eliminar ahorro")} description={t("¿Estás seguro de que deseas eliminar este ahorro? Esta acción no se puede deshacer.")} />
        </div>
      </div>

      <div className="flex items-end gap-2 pt-2 border-t">
        <div className="flex-1">
          <Label className="text-xs">{t("Nuevo aporte")}</Label>
          <MoneyInput value={amount} onChange={(v) => setAmount(v)} />
          {monthAmount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{t("Aportado este mes:")} {formatCOP(monthAmount, saving.currency)}</p>
          )}
        </div>
        <Button size="sm" onClick={async () => { if (Number(amount) > 0) { await onSetMonth(saving.id, Number(amount)); setAmount(""); } }}>
          <Check className="mr-1 h-4 w-4" />{t("Guardar")}
        </Button>
      </div>

      {contributions.length > 0 && (
        <Dialog open={histOpen} onOpenChange={setHistOpen}>
          <DialogTrigger asChild>
            <Button variant="link" size="sm" className="px-0 h-auto">{t("Ver historial ({count} aportes)", { count: contributions.length })}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("Historial —")} {saving.name}</DialogTitle></DialogHeader>
            <div className="space-y-1 max-h-[45vh] overflow-y-auto">
              {[...contributions].sort((a: any, b: any) => (b.created_at ?? "").localeCompare(a.created_at ?? "")).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between rounded p-2 hover:bg-muted/50">
                  <span className="text-sm">{formatDateTime(c.created_at)}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">{formatCOP(Number(c.amount), saving.currency)}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => onDeleteContrib(c.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ConfirmDeleteButton({ onConfirm, className = "h-8 w-8", title, description }: { onConfirm: () => void; className?: string; title?: string; description?: string }) {
  const t = useT();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="ghost" className={`text-destructive ${className}`}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title ?? t("Eliminar meta")}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? t("¿Estás seguro de que deseas eliminar esta meta? Esta acción no se puede deshacer.")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("Cancelar")}</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>
            {t("Eliminar")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
