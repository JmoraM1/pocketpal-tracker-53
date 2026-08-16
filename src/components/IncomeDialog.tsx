import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MoneyInput } from "@/components/ui/money-input";
import { formatCOP } from "@/lib/constants";
import { useT } from "@/lib/i18n";
import { Check, Pencil, Plus, Trash2, Wallet, X } from "lucide-react";
import type { AdditionalIncome } from "@/hooks/useAdditionalIncomes";

interface IncomeDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  salary: number;
  onSaveSalary: (value: number) => void;
  incomes: AdditionalIncome[];
  onAdd: (name: string, amount: number, isRecurring: boolean) => void;
  onUpdate: (id: string, updates: { name?: string; amount?: number; is_recurring?: boolean }) => void;
  onDelete: (id: string) => void;
}

export function IncomeDialog({
  open,
  onOpenChange,
  salary,
  onSaveSalary,
  incomes,
  onAdd,
  onUpdate,
  onDelete,
}: IncomeDialogProps) {
  const t = useT();
  const [editingSalary, setEditingSalary] = useState(false);
  const [salaryValue, setSalaryValue] = useState(String(salary));
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newRecurring, setNewRecurring] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");

  useEffect(() => {
    if (!open) {
      setEditingSalary(false);
      setAdding(false);
      setEditingId(null);
    }
    setSalaryValue(String(salary));
  }, [open, salary]);

  const additionalTotal = incomes.reduce((s, i) => s + Number(i.amount), 0);
  const total = salary + additionalTotal;

  const saveSalary = () => {
    onSaveSalary(Number(salaryValue) || 0);
    setEditingSalary(false);
  };

  const saveNew = () => {
    const amount = Number(newAmount) || 0;
    if (!newName.trim() || amount <= 0) return;
    onAdd(newName.trim(), amount, newRecurring);
    setNewName("");
    setNewAmount("");
    setNewRecurring(false);
    setAdding(false);
  };

  const saveEdit = (id: string) => {
    onUpdate(id, { name: editName.trim() || t("Ingreso"), amount: Number(editAmount) || 0 });
    setEditingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Ingresos del mes")}</DialogTitle>
          <DialogDescription>{t("Gestiona tu salario y tus ingresos adicionales.")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Salario */}
          <div className="rounded-xl border bg-muted/40 p-4">
            <div className="row-item justify-between">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Wallet className="h-4 w-4 text-success" />
                {t("Salario")}
              </span>
              {!editingSalary && (
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-semibold tabular-nums">{formatCOP(salary)}</span>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingSalary(true)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
            {editingSalary && (
              <div className="mt-3 flex items-center gap-2">
                <MoneyInput
                  value={salaryValue}
                  onChange={setSalaryValue}
                  className="h-9 flex-1"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && saveSalary()}
                />
                <Button size="icon" variant="ghost" className="h-9 w-9" onClick={saveSalary}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setEditingSalary(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Ingresos adicionales */}
          <div className="space-y-2">
            {incomes.length === 0 && !adding && (
              <p className="text-sm text-muted-foreground">{t("Aún no hay ingresos adicionales.")}</p>
            )}

            {incomes.map((inc) =>
              editingId === inc.id ? (
                <div key={inc.id} className="space-y-2 rounded-xl border p-3">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-9" />
                  <div className="flex items-center gap-2">
                    <MoneyInput value={editAmount} onChange={setEditAmount} className="h-9 flex-1" />
                    <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => saveEdit(inc.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="row-item justify-between pt-1">
                    <Label className="text-xs text-muted-foreground">{t("Repetir todos los meses")}</Label>
                    <Switch
                      checked={inc.is_recurring}
                      onCheckedChange={(v) => onUpdate(inc.id, { is_recurring: v })}
                    />
                  </div>
                </div>
              ) : (
                <div key={inc.id} className="flex items-center gap-2 rounded-xl border p-3">
                  <div className="row-item-body">
                    <p className="truncate text-sm font-medium">{inc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {inc.is_recurring ? t("Todos los meses") : t("Solo este mes")}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-success">
                    +{formatCOP(Number(inc.amount))}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    onClick={() => {
                      setEditingId(inc.id);
                      setEditName(inc.name);
                      setEditAmount(String(inc.amount));
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("Eliminar ingreso")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("¿Estás seguro de que deseas eliminar este ingreso? Esta acción no se puede deshacer.")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("Cancelar")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(inc.id)}>{t("Eliminar")}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ),
            )}

            {adding ? (
              <div className="space-y-2 rounded-xl border p-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("Nombre del ingreso")}</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={t("Ej: Freelance")}
                    className="h-9"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("Valor")}</Label>
                  <MoneyInput value={newAmount} onChange={setNewAmount} className="h-9" />
                </div>
                <div className="row-item justify-between pt-1">
                  <Label className="text-xs text-muted-foreground">{t("Repetir todos los meses")}</Label>
                  <Switch checked={newRecurring} onCheckedChange={setNewRecurring} />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="flex-1" onClick={saveNew}>
                    {t("Guardar")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                    {t("Cancelar")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="btn-compact w-full" onClick={() => setAdding(true)}>
                <Plus className="h-4 w-4" />
                {t("Agregar ingreso")}
              </Button>
            )}
          </div>

          <div className="row-item justify-between rounded-xl bg-success/10 px-4 py-3">
            <span className="text-sm font-medium">{t("Ingresos totales")}</span>
            <span className="font-display text-lg font-semibold tabular-nums text-success">{formatCOP(total)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
