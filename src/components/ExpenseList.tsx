import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatCOP } from "@/lib/constants";
import { categoryVisual } from "@/lib/category-visuals";
import { Pencil, Check, X, Plus, Trash2, Receipt, CalendarDays, RefreshCw, CircleCheck, CircleDashed } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Expense = Tables<"expenses">;

interface ExpenseListProps {
  expenses: Expense[];
  categories: string[];
  onUpdate: (id: string, updates: { amount?: number; description?: string; is_paid?: boolean; category?: string }) => void;
  onAdd: (data: { category: string; amount: number; description: string; is_paid: boolean }) => void;
  onDelete: (id: string) => void;
}

const cardMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
};

export function ExpenseList({ expenses, categories, onUpdate, onAdd, onDelete }: ExpenseListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCategory, setEditCategory] = useState("");

  // Add dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [newCategory, setNewCategory] = useState(categories[0] ?? "");
  const [newAmount, setNewAmount] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPaid, setNewPaid] = useState(false);

  const startEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setEditAmount(String(expense.amount));
    setEditDesc(expense.description ?? "");
    setEditCategory(expense.category);
  };

  const saveEdit = (id: string) => {
    onUpdate(id, {
      amount: Number(editAmount) || 0,
      description: editDesc,
      category: editCategory,
    });
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const handleAdd = () => {
    onAdd({
      category: newCategory,
      amount: Number(newAmount) || 0,
      description: newDesc,
      is_paid: newPaid,
    });
    setNewCategory(categories[0] ?? "");
    setNewAmount("");
    setNewDesc("");
    setNewPaid(false);
    setAddOpen(false);
  };

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const paid = expenses.filter((e) => e.is_paid).length;

  return (
    <Card className="rounded-3xl border shadow-soft">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="icon-tile h-11 w-11 bg-primary/10 text-primary">
            <Receipt className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-lg font-bold tracking-tight">Gastos del mes</CardTitle>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatCOP(total)} · {paid}/{expenses.length} pagados
            </p>
          </div>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="shrink-0 gap-1 rounded-full px-4 shadow-soft">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Agregar ítem</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>Agregar nuevo ítem</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Valor</Label>
                <MoneyInput value={newAmount} onChange={(v) => setNewAmount(v)} />
              </div>
              <div className="space-y-1.5">
                <Label>Descripción (opcional)</Label>
                <Input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Nota sobre el gasto"
                />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-muted/50 px-3 py-2.5">
                <Switch checked={newPaid} onCheckedChange={setNewPaid} />
                <Label>{newPaid ? "Pagado" : "Pendiente"}</Label>
              </div>
              <Button className="w-full" onClick={handleAdd}>
                Agregar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-3 p-5 pt-0 sm:p-6 sm:pt-0">
        {expenses.map((expense) => {
          const visual = categoryVisual(expense.category);
          const Icon = visual.icon;
          return (
            <motion.div
              key={expense.id}
              {...cardMotion}
              className={`list-card ${expense.is_paid ? "border-success/25" : "border-border"}`}
            >
              {editingId === expense.id ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex-1 space-y-2">
                    <Select value={editCategory} onValueChange={setEditCategory}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <MoneyInput value={editAmount} onChange={(v) => setEditAmount(v)} placeholder="Monto" className="h-10" />
                    <Input
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Descripción (opcional)"
                      className="h-10"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="rounded-full" aria-label="Guardar" onClick={() => saveEdit(expense.id)}>
                      <Check className="h-4 w-4 text-success" />
                    </Button>
                    <Button size="icon" variant="ghost" className="rounded-full" aria-label="Cancelar" onClick={cancelEdit}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className={`icon-tile h-11 w-11 ${visual.tint}`}>
                    <Icon className="h-5 w-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {expense.description || expense.category}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                      <span className="rounded-full bg-muted px-2 py-0.5 font-medium">{expense.category}</span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> Sin vencimiento
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" /> Mensual
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-sm font-extrabold tabular-nums">
                      {formatCOP(Number(expense.amount))}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        expense.is_paid ? "bg-success/10 text-success" : "bg-warning/15 text-warning"
                      }`}
                    >
                      {expense.is_paid ? <CircleCheck className="h-3 w-3" /> : <CircleDashed className="h-3 w-3" />}
                      {expense.is_paid ? "Pagado" : "Pendiente"}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className={`h-8 w-8 rounded-full ${expense.is_paid ? "text-success" : "text-muted-foreground"}`}
                      aria-label={expense.is_paid ? "Marcar pendiente" : "Marcar pagado"}
                      title={expense.is_paid ? "Marcar pendiente" : "Marcar pagado"}
                      onClick={() => onUpdate(expense.id, { is_paid: !expense.is_paid })}
                    >
                      <CircleCheck className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" aria-label="Editar" title="Editar" onClick={() => startEdit(expense)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10"
                      aria-label="Eliminar"
                      title="Eliminar"
                      onClick={() => onDelete(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}

        {expenses.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-12 text-center">
            <span className="icon-tile h-12 w-12 bg-muted text-muted-foreground">
              <Receipt className="h-6 w-6" />
            </span>
            <p className="text-sm text-muted-foreground">
              No hay ítems. Toca "Agregar ítem" para comenzar.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
