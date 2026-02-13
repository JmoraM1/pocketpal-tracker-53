import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatCOP } from "@/lib/constants";
import { Pencil, Check, X, Plus, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Expense = Tables<"expenses">;

interface ExpenseListProps {
  expenses: Expense[];
  categories: string[];
  onUpdate: (id: string, updates: { amount?: number; description?: string; is_paid?: boolean; category?: string }) => void;
  onAdd: (data: { category: string; amount: number; description: string; is_paid: boolean }) => void;
  onDelete: (id: string) => void;
}

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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Gastos del Mes</CardTitle>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Agregar ítem
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Ítem</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
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
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción (opcional)</Label>
                <Input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Nota sobre el gasto"
                />
              </div>
              <div className="flex items-center gap-2">
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
      <CardContent className="space-y-2 p-4 pt-0">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className={`flex flex-col gap-2 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center ${
              expense.is_paid ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"
            }`}
          >
            {editingId === expense.id ? (
              <>
                <div className="flex-1 space-y-2">
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="Monto"
                    className="h-9"
                  />
                  <Input
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Descripción (opcional)"
                    className="h-9"
                  />
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => saveEdit(expense.id)}>
                    <Check className="h-4 w-4 text-success" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={cancelEdit}>
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{expense.category}</p>
                  {expense.description && (
                    <p className="text-xs text-muted-foreground">{expense.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold tabular-nums">
                    {formatCOP(Number(expense.amount))}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={expense.is_paid}
                      onCheckedChange={(checked) => onUpdate(expense.id, { is_paid: checked })}
                    />
                    <span className={`text-xs font-medium ${expense.is_paid ? "text-success" : "text-warning"}`}>
                      {expense.is_paid ? "Pagado" : "Pendiente"}
                    </span>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => startEdit(expense)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => onDelete(expense.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
        {expenses.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay ítems. Haz clic en "Agregar ítem" para comenzar.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
