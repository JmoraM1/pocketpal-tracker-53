import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { formatCOP } from "@/lib/constants";
import { Pencil, Check, X } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Expense = Tables<"expenses">;

interface ExpenseListProps {
  expenses: Expense[];
  onUpdate: (id: string, updates: { amount?: number; description?: string; is_paid?: boolean }) => void;
}

export function ExpenseList({ expenses, onUpdate }: ExpenseListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const startEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setEditAmount(String(expense.amount));
    setEditDesc(expense.description ?? "");
  };

  const saveEdit = (id: string) => {
    onUpdate(id, {
      amount: Number(editAmount) || 0,
      description: editDesc,
    });
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Gastos del Mes</CardTitle>
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
                  <p className="text-sm font-semibold">{expense.category}</p>
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
                </div>
              </>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
