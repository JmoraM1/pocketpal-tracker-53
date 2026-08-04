import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { formatCOP } from "@/lib/constants";
import { Plus, Trash2, CreditCard, CalendarDays, Pencil, Check, X, Trophy, ListChecks } from "lucide-react";
import type { InstallmentPlan, InstallmentPayment } from "@/hooks/useInstallments";

interface InstallmentTrackerProps {
  plans: InstallmentPlan[];
  monthPayments: (InstallmentPayment & { plan_name: string })[];
  allPayments: InstallmentPayment[];
  onCreatePlan: (data: { name: string; total_amount: number; num_installments: number; start_date: string; installment_amount?: number }) => void;
  onTogglePayment: (paymentId: string, isPaid: boolean) => void;
  onDeletePlan: (planId: string) => void;
  onUpdatePaymentAmount: (paymentId: string, amount: number) => void;
}

function formatDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function InstallmentTracker({
  plans,
  monthPayments,
  allPayments,
  onCreatePlan,
  onTogglePayment,
  onDeletePlan,
  onUpdatePaymentAmount,
}: InstallmentTrackerProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [numInstallments, setNumInstallments] = useState("");
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [installmentTouched, setInstallmentTouched] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  });

  // Auto-calc installment when total/num change, unless the user overrode it
  useEffect(() => {
    if (installmentTouched) return;
    const total = Number(totalAmount);
    const num = Number(numInstallments);
    if (total > 0 && num > 0) {
      setInstallmentAmount(String(Math.round(total / num)));
    } else {
      setInstallmentAmount("");
    }
  }, [totalAmount, numInstallments, installmentTouched]);

  const resetForm = () => {
    setName("");
    setTotalAmount("");
    setNumInstallments("");
    setInstallmentAmount("");
    setInstallmentTouched(false);
  };

  const handleCreate = () => {
    if (!name || !totalAmount || !numInstallments) return;
    onCreatePlan({
      name,
      total_amount: Number(totalAmount),
      num_installments: Number(numInstallments),
      start_date: startDate,
      installment_amount: installmentAmount ? Number(installmentAmount) : undefined,
    });
    resetForm();
    setAddOpen(false);
  };

  // Editing payment amount (in "Cuotas del mes")
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const startEditAmount = (payment: InstallmentPayment) => {
    setEditingPaymentId(payment.id);
    setEditAmount(String(payment.amount));
  };
  const saveEditAmount = (paymentId: string) => {
    const val = Number(editAmount);
    if (val > 0) onUpdatePaymentAmount(paymentId, val);
    setEditingPaymentId(null);
  };

  const activePlans = plans.filter((p) => !p.is_completed);
  const completedPlans = plans.filter((p) => p.is_completed);

  return (
    <div className="space-y-5">
      {/* Month payments section */}
      <Card className="rounded-3xl border shadow-soft">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="icon-tile h-11 w-11 bg-primary/10 text-primary">
              <CreditCard className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-lg font-bold tracking-tight">Cuotas del mes</CardTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {monthPayments.length} cuota{monthPayments.length === 1 ? "" : "s"} programada{monthPayments.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="shrink-0 gap-1 rounded-full px-4 shadow-soft">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nueva deuda</span>
              </Button>

            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Deuda / Compra a Cuotas</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Celular, Electrodoméstico" />
                </div>
                <div className="space-y-2">
                  <Label>Monto total</Label>
                  <MoneyInput value={totalAmount} onChange={(v) => setTotalAmount(v)} />
                </div>
                <div className="space-y-2">
                  <Label>Número de cuotas</Label>
                  <Input
                    type="number"
                    value={numInstallments}
                    onChange={(e) => setNumInstallments(e.target.value)}
                    placeholder="Ej: 4, 12, 24"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor de la cuota (editable)</Label>
                  <MoneyInput
                    value={installmentAmount}
                    onChange={(v) => { setInstallmentAmount(v); setInstallmentTouched(true); }}
                  />
                  <p className="text-xs text-muted-foreground">Se calcula automáticamente. Puedes ajustarlo si tu cuota real es distinta.</p>
                </div>
                <div className="space-y-2">
                  <Label>Fecha de la primera cuota</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleCreate}>
                  Crear Plan de Cuotas
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-2 p-4 pt-0">
          {monthPayments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay cuotas programadas para este mes.
            </p>
          ) : (
            monthPayments.map((payment) => (
              <div
                key={payment.id}
                className={`flex flex-col gap-2 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center ${
                  payment.is_paid ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"
                }`}
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold">{payment.plan_name}</p>
                  <p className="text-xs text-muted-foreground">Cuota {payment.payment_number}</p>
                </div>
                <div className="flex items-center gap-3">
                  {editingPaymentId === payment.id ? (
                    <div className="flex items-center gap-1">
                      <MoneyInput
                        value={editAmount}
                        onChange={(v) => setEditAmount(v)}
                        className="h-8 w-32 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditAmount(payment.id);
                          if (e.key === "Escape") setEditingPaymentId(null);
                        }}
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEditAmount(payment.id)}>
                        <Check className="h-3.5 w-3.5 text-success" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingPaymentId(null)}>
                        <X className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold tabular-nums">{formatCOP(Number(payment.amount))}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditAmount(payment)}>
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={payment.is_paid}
                      onCheckedChange={(checked) => onTogglePayment(payment.id, checked)}
                    />
                    <span className={`text-xs font-medium ${payment.is_paid ? "text-success" : "text-warning"}`}>
                      {payment.is_paid ? "Pagada" : "Pendiente"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Tabs: Activas / Completadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5" />
            Deudas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">Activas ({activePlans.length})</TabsTrigger>
              <TabsTrigger value="completed">Completadas ({completedPlans.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-3 pt-4">
              {activePlans.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">Aún no tienes deudas activas.</p>
              )}
              {activePlans.map((plan) => {
                const planPayments = allPayments
                  .filter((p) => p.plan_id === plan.id)
                  .sort((a, b) => a.payment_number - b.payment_number);
                const paidAmount = planPayments.filter((p) => p.is_paid).reduce((s, p) => s + Number(p.amount), 0);
                const totalAmount = Number(plan.total_amount);
                const progress = totalAmount > 0 ? Math.min((paidAmount / totalAmount) * 100, 100) : 0;
                const remaining = Math.max(0, totalAmount - paidAmount);
                const next = planPayments.find((p) => !p.is_paid);
                return (
                  <div key={plan.id} className="list-card space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="icon-tile h-11 w-11 bg-primary/10 text-primary">
                          <CreditCard className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-base font-bold tracking-tight">{plan.name}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                              Cuota {plan.paid_installments} de {plan.num_installments}
                            </span>
                            <span className="text-xs text-muted-foreground">· {formatCOP(Number(plan.installment_amount))}/mes</span>
                          </div>
                        </div>
                      </div>
                      <ConfirmDeleteButton onConfirm={() => onDeletePlan(plan.id)} />
                    </div>

                    {next && (
                      <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2.5">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Próxima cuota #{next.payment_number} · {next.due_month}
                        </span>
                        <span className="text-sm font-bold tabular-nums">{formatCOP(Number(next.amount))}</span>
                      </div>
                    )}


                    <div className="space-y-2">
                      <Progress value={progress} className="h-3" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-primary">
                          {formatCOP(paidAmount)} <span className="font-normal text-muted-foreground">pagado</span>
                        </span>
                        <span className="text-muted-foreground text-xs">{progress.toFixed(0)}%</span>
                        <span className="font-semibold text-destructive">
                          {formatCOP(remaining)} <span className="font-normal text-muted-foreground">saldo</span>
                        </span>
                      </div>
                    </div>

                    <ScheduleDialog
                      plan={plan}
                      payments={planPayments}
                      onTogglePayment={onTogglePayment}
                      onUpdatePaymentAmount={onUpdatePaymentAmount}
                    />
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="completed" className="space-y-2 pt-4">
              {completedPlans.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">Aún no tienes deudas completadas.</p>
              )}
              {completedPlans.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between rounded-xl border border-success/20 bg-success/5 p-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-success" />
                    <div>
                      <p className="text-sm font-semibold">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCOP(Number(plan.total_amount))} — {plan.num_installments} cuotas
                        {plan.completed_at ? ` · Completada el ${formatDate(plan.completed_at)}` : ""}
                      </p>
                    </div>
                  </div>
                  <ConfirmDeleteButton onConfirm={() => onDeletePlan(plan.id)} />
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function ScheduleDialog({
  plan,
  payments,
  onTogglePayment,
  onUpdatePaymentAmount,
}: {
  plan: InstallmentPlan;
  payments: InstallmentPayment[];
  onTogglePayment: (paymentId: string, isPaid: boolean) => void;
  onUpdatePaymentAmount: (paymentId: string, amount: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  const save = (id: string) => {
    const v = Number(editVal);
    if (v > 0) onUpdatePaymentAmount(id, v);
    setEditingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full gap-2">
          <ListChecks className="h-4 w-4" />
          Ver cronograma
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cronograma — {plan.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {payments.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">Sin cuotas registradas.</p>
          )}
          {payments.map((p) => (
            <div
              key={p.id}
              className={`flex items-center justify-between gap-2 rounded-lg border p-2.5 ${
                p.is_paid ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Cuota {p.payment_number}</p>
                <p className="text-xs text-muted-foreground">{p.due_month}</p>
              </div>
              {editingId === p.id ? (
                <div className="flex items-center gap-1">
                  <MoneyInput
                    value={editVal}
                    onChange={(v) => setEditVal(v)}
                    className="h-8 w-28 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") save(p.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => save(p.id)}>
                    <Check className="h-3.5 w-3.5 text-success" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                    <X className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold tabular-nums">{formatCOP(Number(p.amount))}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => { setEditingId(p.id); setEditVal(String(p.amount)); }}
                  >
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Switch checked={p.is_paid} onCheckedChange={(c) => onTogglePayment(p.id, c)} />
                <span className={`text-xs font-medium ${p.is_paid ? "text-success" : "text-warning"}`}>
                  {p.is_paid ? "Pagada" : "Pendiente"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDeleteButton({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar deuda</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas eliminar esta deuda? Esta acción no se puede deshacer.
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
