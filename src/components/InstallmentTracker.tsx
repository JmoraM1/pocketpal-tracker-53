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
import { formatCOP, formatShortDate } from "@/lib/constants";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Trash2, CreditCard, CalendarDays, Pencil, Check, X, Trophy, ListChecks } from "lucide-react";
import type { InstallmentPlan, InstallmentPayment } from "@/hooks/useInstallments";
import { useT } from "@/lib/i18n";

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
  const t = useT();
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
  const [startDateOpen, setStartDateOpen] = useState(false);

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
    <div className="space-y-4">
      {/* Month payments section */}
      <Card>
        <CardHeader className="flex flex-col items-stretch gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex min-w-0 items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 shrink-0" />
            <span className="truncate">{t("Cuotas del Mes")}</span>
          </CardTitle>
          <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full shrink-0 gap-1 whitespace-nowrap sm:w-auto">
                <Plus className="h-4 w-4" />
                {t("Nueva Deuda")}
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("Registrar Deuda / Compra a Cuotas")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>{t("Nombre")}</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Ej: Celular, Electrodoméstico")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Monto total")}</Label>
                  <MoneyInput value={totalAmount} onChange={(v) => setTotalAmount(v)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Número de cuotas")}</Label>
                  <Input
                    type="number"
                    value={numInstallments}
                    onChange={(e) => setNumInstallments(e.target.value)}
                    placeholder={t("Ej: 4, 12, 24")}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("Valor de la cuota (editable)")}</Label>
                  <MoneyInput
                    value={installmentAmount}
                    onChange={(v) => { setInstallmentAmount(v); setInstallmentTouched(true); }}
                  />
                  <p className="text-xs text-muted-foreground">{t("Se calcula automáticamente. Puedes ajustarlo si tu cuota real es distinta.")}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t("Fecha de la primera cuota")}</Label>
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start gap-2 font-normal">
                        <CalendarDays className="h-4 w-4" />
                        {startDate ? formatShortDate(startDate) : t("Seleccionar fecha")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate ? new Date(`${startDate}T12:00:00`) : undefined}
                        onSelect={(d) => {
                          if (d) {
                            setStartDate(
                              `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
                            );
                          }
                          setStartDateOpen(false);
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button className="w-full" onClick={handleCreate}>
                  {t("Crear Plan de Cuotas")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-2 p-4 pt-0">
          {monthPayments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("No hay cuotas programadas para este mes.")}
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
                  <p className="text-xs text-muted-foreground">{t("Cuota {n}", { n: payment.payment_number })}</p>
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
                      {payment.is_paid ? t("Pagada") : t("Pendiente")}
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
            {t("Deudas")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">{t("Activas")} ({activePlans.length})</TabsTrigger>
              <TabsTrigger value="completed">{t("Completadas")} ({completedPlans.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-3 pt-4">
              {activePlans.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">{t("Aún no tienes deudas activas.")}</p>
              )}
              {activePlans.map((plan) => {
                const planPayments = allPayments
                  .filter((p) => p.plan_id === plan.id)
                  .sort((a, b) => a.payment_number - b.payment_number);
                const paidAmount = planPayments.filter((p) => p.is_paid).reduce((s, p) => s + Number(p.amount), 0);
                const totalAmount = Number(plan.total_amount);
                const progress = totalAmount > 0 ? Math.min((paidAmount / totalAmount) * 100, 100) : 0;
                const remaining = Math.max(0, totalAmount - paidAmount);
                return (
                  <div key={plan.id} className="rounded-xl border bg-card/50 backdrop-blur-sm p-5 space-y-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-base font-bold">{plan.name}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                            {t("Cuota {a} de {b}", { a: plan.paid_installments, b: plan.num_installments })}
                          </span>
                          <span className="text-xs text-muted-foreground">· {t("{amount}/mes", { amount: formatCOP(Number(plan.installment_amount), plan.currency) })}</span>
                        </div>
                      </div>
                      <ConfirmDeleteButton onConfirm={() => onDeletePlan(plan.id)} />
                    </div>

                    <div className="space-y-2">
                      <Progress value={progress} className="h-3" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-primary">
                          {formatCOP(paidAmount, plan.currency)} <span className="font-normal text-muted-foreground">{t("pagado")}</span>
                        </span>
                        <span className="text-muted-foreground text-xs">{progress.toFixed(0)}%</span>
                        <span className="font-semibold text-destructive">
                          {formatCOP(remaining, plan.currency)} <span className="font-normal text-muted-foreground">{t("saldo")}</span>
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
                <p className="text-center text-sm text-muted-foreground py-6">{t("Aún no tienes deudas completadas.")}</p>
              )}
              {completedPlans.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between rounded-xl border border-success/20 bg-success/5 p-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-success" />
                    <div>
                      <p className="text-sm font-semibold">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCOP(Number(plan.total_amount), plan.currency)} — {t("{n} cuotas", { n: plan.num_installments })}
                        {plan.completed_at ? ` · ${t("Completada el {date}", { date: formatDate(plan.completed_at) })}` : ""}
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
  const t = useT();
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
          {t("Ver cronograma")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("Cronograma —")} {plan.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[45vh] overflow-y-auto">
          {payments.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">{t("Sin cuotas registradas.")}</p>
          )}
          {payments.map((p) => (
            <div
              key={p.id}
              className={`flex items-center justify-between gap-2 rounded-lg border p-2.5 ${
                p.is_paid ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t("Cuota {n}", { n: p.payment_number })}</p>
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
                  <span className="text-sm font-bold tabular-nums">{formatCOP(Number(p.amount), plan.currency)}</span>
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
                  {p.is_paid ? t("Pagada") : t("Pendiente")}
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
  const t = useT();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Eliminar deuda")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("¿Estás seguro de que deseas eliminar esta deuda? Esta acción no se puede deshacer.")}
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
