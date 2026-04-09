import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatCOP } from "@/lib/constants";
import { Plus, Trash2, CreditCard, CalendarDays, Pencil, Check, X } from "lucide-react";
import type { InstallmentPlan, InstallmentPayment } from "@/hooks/useInstallments";

interface InstallmentTrackerProps {
  plans: InstallmentPlan[];
  monthPayments: (InstallmentPayment & { plan_name: string })[];
  onCreatePlan: (data: { name: string; total_amount: number; num_installments: number; start_date: string }) => void;
  onTogglePayment: (paymentId: string, isPaid: boolean) => void;
  onDeletePlan: (planId: string) => void;
  onUpdatePaymentAmount: (paymentId: string, amount: number) => void;
}

export function InstallmentTracker({ plans, monthPayments, onCreatePlan, onTogglePayment, onDeletePlan, onUpdatePaymentAmount }: InstallmentTrackerProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [numInstallments, setNumInstallments] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  });

  // Editing payment amount
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");

  const handleCreate = () => {
    if (!name || !totalAmount || !numInstallments) return;
    onCreatePlan({
      name,
      total_amount: Number(totalAmount),
      num_installments: Number(numInstallments),
      start_date: startDate,
    });
    setName("");
    setTotalAmount("");
    setNumInstallments("");
    setAddOpen(false);
  };

  const cuotaPreview = totalAmount && numInstallments && Number(numInstallments) > 0
    ? Math.round(Number(totalAmount) / Number(numInstallments))
    : 0;

  const activePlans = plans.filter((p) => !p.is_completed);
  const completedPlans = plans.filter((p) => p.is_completed);

  const startEditAmount = (payment: InstallmentPayment) => {
    setEditingPaymentId(payment.id);
    setEditAmount(String(payment.amount));
  };

  const saveEditAmount = (paymentId: string) => {
    const val = Number(editAmount);
    if (val > 0) {
      onUpdatePaymentAmount(paymentId, val);
    }
    setEditingPaymentId(null);
  };

  return (
    <div className="space-y-4">
      {/* Month payments section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            Cuotas del Mes
          </CardTitle>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Nueva Deuda
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Deuda / Compra a Cuotas</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Celular, Electrodoméstico"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monto total</Label>
                  <Input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0"
                  />
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
                  <Label>Fecha inicio (mes primera cuota)</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                {cuotaPreview > 0 && (
                  <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                    <p className="text-muted-foreground">Valor estimado por cuota (editable después):</p>
                    <p className="text-lg font-bold text-primary">{formatCOP(cuotaPreview)}</p>
                  </div>
                )}
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
                  <p className="text-xs text-muted-foreground">
                    Cuota {payment.payment_number}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {editingPaymentId === payment.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="h-8 w-28 text-sm"
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
                      <span className="text-sm font-bold tabular-nums">
                        {formatCOP(Number(payment.amount))}
                      </span>
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

      {/* Active plans overview */}
      {activePlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5" />
              Deudas Activas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            {activePlans.map((plan) => {
              const paidAmount = Number(plan.installment_amount) * plan.paid_installments;
              const totalAmount = Number(plan.total_amount);
              const progress = totalAmount > 0 ? Math.min((paidAmount / totalAmount) * 100, 100) : 0;
              return (
                <div key={plan.id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Cuota {plan.paid_installments}/{plan.num_installments} · {formatCOP(Number(plan.installment_amount))}/mes
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => onDeletePlan(plan.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={progress} className="h-2 flex-1" />
                    <span className="text-sm font-bold tabular-nums">
                      {formatCOP(paidAmount)}
                    </span>
                  </div>
                  <p className="text-xs text-right text-muted-foreground">
                    de {formatCOP(totalAmount)}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Completed - only shown if there are completed plans passed */}
      {completedPlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-success">✅ Deudas Completadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            {completedPlans.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between rounded-lg border border-success/20 bg-success/5 p-3">
                <div>
                  <p className="text-sm font-semibold">{plan.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCOP(Number(plan.total_amount))} — {plan.num_installments} cuotas
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => onDeletePlan(plan.id)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
