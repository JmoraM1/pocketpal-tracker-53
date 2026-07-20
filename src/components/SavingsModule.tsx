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

interface Props {
  userId: string | undefined;
  selectedMonth: Date;
  mode: "goals" | "savings";
}

export function SavingsModule({ userId, selectedMonth, debtsContent }: Props) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-primary" />
          Gestión Financiera
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Administra tus ahorros, metas y deudas desde un solo lugar.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="goals" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="goals">Metas</TabsTrigger>
            <TabsTrigger value="savings">Ahorros</TabsTrigger>
            <TabsTrigger value="debts">Deudas</TabsTrigger>
          </TabsList>

          {/* METAS */}
          <TabsContent value="goals" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={openGoal} onOpenChange={setOpenGoal}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="mr-1 h-4 w-4" />Nueva meta</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nueva meta de ahorro</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Nombre</Label>
                      <Input value={newGoalName} onChange={(e) => setNewGoalName(e.target.value)} placeholder="Ej: Viaje a la costa" />
                    </div>
                    <div>
                      <Label>Valor objetivo</Label>
                      <MoneyInput value={newGoalTarget} onChange={(v) => setNewGoalTarget(v)} />
                    </div>
                    <div>
                      <Label>Monto inicial (opcional)</Label>
                      <MoneyInput value={newGoalInitial} onChange={(v) => setNewGoalInitial(v)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateGoal}>Crear</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {s.activeGoals.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">Aún no tienes metas activas.</p>
            )}

            <div className="space-y-3">
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
            </div>

            {s.completedGoals.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="mb-2 text-sm font-semibold text-muted-foreground flex items-center gap-1">
                  <Trophy className="h-4 w-4" /> Metas completadas
                </h4>
                <div className="space-y-2">
                  {s.completedGoals.map((g) => (
                    <div key={g.id} className="flex items-center justify-between rounded-md bg-muted/50 p-2 text-sm">
                      <div>
                        <p className="font-medium">{g.name}</p>
                        <p className="text-xs text-muted-foreground">Meta completada</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-semibold">{formatCOP(s.goalTotal(g.id))} / {formatCOP(Number(g.target_amount))}</span>
                        <ConfirmDeleteButton onConfirm={() => s.deleteGoal(g.id)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* AHORROS */}
          <TabsContent value="savings" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={openSaving} onOpenChange={setOpenSaving}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="mr-1 h-4 w-4" />Nuevo ahorro</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nuevo ahorro</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Nombre</Label>
                      <Input value={newSavingName} onChange={(e) => setNewSavingName(e.target.value)} placeholder="Ej: Ahorro libre" />
                    </div>
                    <div>
                      <Label>Monto inicial (opcional)</Label>
                      <MoneyInput value={newSavingInitial} onChange={(v) => setNewSavingInitial(v)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateSaving}>Crear</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {s.freeSavings.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">Aún no tienes ahorros registrados.</p>
            )}

            <div className="space-y-3">
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
            </div>
          </TabsContent>

          {/* DEUDAS */}
          <TabsContent value="debts" className="space-y-4">
            {debtsContent ?? (
              <p className="text-center text-sm text-muted-foreground py-4">No hay deudas para mostrar.</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ---------------- GOAL CARD ----------------
function GoalCard({ goal, total, monthAmount, contributions, onUpdate, onDelete, onSetMonth, onDeleteContrib }: any) {
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
          <p className="text-xs text-muted-foreground">Objetivo: {formatCOP(target)}</p>
        </div>
        <div className="flex gap-1">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Editar meta</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nombre</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
                <div><Label>Valor objetivo</Label><MoneyInput value={editTarget} onChange={(v) => setEditTarget(v)} /></div>
              </div>
              <DialogFooter>
                <Button onClick={async () => { await onUpdate(goal.id, { name: editName, target_amount: Number(editTarget) }); setEditOpen(false); }}>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <ConfirmDeleteButton onConfirm={() => onDelete(goal.id)} className="h-7 w-7" />
        </div>
      </div>

      <Progress value={pct} className="h-2.5" />
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-primary">{formatCOP(total)} ahorrado</span>
        <span className="text-muted-foreground">{pct.toFixed(0)}%</span>
        <span className="text-muted-foreground">Faltan {formatCOP(Math.max(0, target - total))}</span>
      </div>

      <div className="flex items-end gap-2 pt-2 border-t">
        <div className="flex-1">
          <Label className="text-xs">Nuevo aporte</Label>
          <MoneyInput value={amount} onChange={(v) => setAmount(v)} />
          {monthAmount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">Aportado este mes: {formatCOP(monthAmount)}</p>
          )}
        </div>
        <Button size="sm" onClick={async () => { if (Number(amount) > 0) { await onSetMonth(goal.id, Number(amount)); setAmount(""); } }}>
          <Check className="mr-1 h-4 w-4" />Guardar
        </Button>
      </div>

      {contributions.length > 0 && (
        <Dialog open={histOpen} onOpenChange={setHistOpen}>
          <DialogTrigger asChild>
            <Button variant="link" size="sm" className="px-0 h-auto">Ver historial ({contributions.length} aportes)</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Historial — {goal.name}</DialogTitle></DialogHeader>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {[...contributions].sort((a: any, b: any) => b.month.localeCompare(a.month)).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between rounded p-2 hover:bg-muted/50">
                  <span className="text-sm">{c.month}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">{formatCOP(Number(c.amount))}</span>
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
  const [editName, setEditName] = useState(saving.name);
  const [amount, setAmount] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [histOpen, setHistOpen] = useState(false);

  return (
    <div className="rounded-lg border bg-card/50 backdrop-blur-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{saving.name}</h3>
          <p className="text-xs text-muted-foreground">Acumulado: <span className="font-semibold text-primary">{formatCOP(total)}</span></p>
        </div>
        <div className="flex gap-1">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Editar ahorro</DialogTitle></DialogHeader>
              <div><Label>Nombre</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
              <DialogFooter>
                <Button onClick={async () => { await onUpdate(saving.id, editName); setEditOpen(false); }}>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <ConfirmDeleteButton onConfirm={() => onDelete(saving.id)} className="h-7 w-7" />
        </div>
      </div>

      <div className="flex items-end gap-2 pt-2 border-t">
        <div className="flex-1">
          <Label className="text-xs">Nuevo aporte</Label>
          <MoneyInput value={amount} onChange={(v) => setAmount(v)} />
          {monthAmount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">Aportado este mes: {formatCOP(monthAmount)}</p>
          )}
        </div>
        <Button size="sm" onClick={async () => { if (Number(amount) > 0) { await onSetMonth(saving.id, Number(amount)); setAmount(""); } }}>
          <Check className="mr-1 h-4 w-4" />Guardar
        </Button>
      </div>

      {contributions.length > 0 && (
        <Dialog open={histOpen} onOpenChange={setHistOpen}>
          <DialogTrigger asChild>
            <Button variant="link" size="sm" className="px-0 h-auto">Ver historial ({contributions.length} aportes)</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Historial — {saving.name}</DialogTitle></DialogHeader>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {[...contributions].sort((a: any, b: any) => b.month.localeCompare(a.month)).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between rounded p-2 hover:bg-muted/50">
                  <span className="text-sm">{c.month}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">{formatCOP(Number(c.amount))}</span>
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

function ConfirmDeleteButton({ onConfirm, className = "h-8 w-8" }: { onConfirm: () => void; className?: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="ghost" className={`text-destructive ${className}`}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
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
