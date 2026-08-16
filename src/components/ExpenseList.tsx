import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { formatCOP, FREQUENCIES, frequencyLabel, formatShortDate } from "@/lib/constants";
import { getCategoryVisual } from "@/lib/categoryIcons";
import { CalendarIcon, Check, Pencil, Plus, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { useT } from "@/lib/i18n";

type Expense = Tables<"expenses">;

interface ExpenseFormValues {
  category: string;
  amount: number;
  description: string;
  is_paid: boolean;
  due_date: string | null;
  frequency: string;
}

interface ExpenseListProps {
  expenses: Expense[];
  categories: string[];
  onUpdate: (
    id: string,
    updates: {
      amount?: number;
      description?: string;
      is_paid?: boolean;
      category?: string;
      due_date?: string | null;
      frequency?: string;
    },
  ) => void;
  onAdd: (data: ExpenseFormValues) => void;
  onDelete: (id: string) => void;
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function ExpenseForm({
  categories,
  initial,
  submitLabel,
  onSubmit,
}: {
  categories: string[];
  initial?: Partial<ExpenseFormValues>;
  submitLabel: string;
  onSubmit: (values: ExpenseFormValues) => void;
}) {
  const t = useT();
  const [category, setCategory] = useState(initial?.category ?? categories[0] ?? "");
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isPaid, setIsPaid] = useState(initial?.is_paid ?? false);
  const [dueDate, setDueDate] = useState<string | null>(initial?.due_date ?? null);
  const [frequency, setFrequency] = useState(initial?.frequency ?? "unico");
  const [dateOpen, setDateOpen] = useState(false);

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label>{t("Categoría")}</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue placeholder={t("Selecciona")} /></SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("Valor")}</Label>
        <MoneyInput value={amount} onChange={setAmount} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("Fecha de vencimiento")}</Label>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2 font-normal">
                <CalendarIcon className="h-4 w-4" />
                {dueDate ? formatShortDate(dueDate) : t("Seleccionar fecha")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate ? new Date(`${dueDate}T12:00:00`) : undefined}
                onSelect={(d) => {
                  setDueDate(d ? toIsoDate(d) : null);
                  setDateOpen(false);
                }}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>{t("Frecuencia")}</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((f) => (
                <SelectItem key={f.value} value={f.value}>{t(f.label)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("Descripción (opcional)")}</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("Nota sobre el gasto")} />
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={isPaid} onCheckedChange={setIsPaid} />
        <Label>{isPaid ? t("Pagado") : t("Pendiente")}</Label>
      </div>

      <Button
        className="w-full"
        onClick={() =>
          onSubmit({
            category,
            amount: Number(amount) || 0,
            description,
            is_paid: isPaid,
            due_date: dueDate,
            frequency,
          })
        }
      >
        {submitLabel}
      </Button>
    </div>
  );
}

export function ExpenseList({ expenses, categories, onUpdate, onAdd, onDelete }: ExpenseListProps) {
  const t = useT();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [filter, setFilter] = useState<"todos" | "pendientes" | "pagados">("todos");

  const visible = expenses.filter((e) =>
    filter === "todos" ? true : filter === "pagados" ? e.is_paid : !e.is_paid,
  );

  const filterLabels: Record<typeof filter, string> = {
    todos: t("todos"),
    pendientes: t("pendientes"),
    pagados: t("pagados"),
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="control-rail rounded-full bg-muted p-1">
          {(["todos", "pendientes", "pagados"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === f ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 rounded-full">
              <Plus className="h-4 w-4" /> {t("Nuevo")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("Nuevo gasto")}</DialogTitle></DialogHeader>
            <ExpenseForm
              categories={categories}
              submitLabel={t("Agregar")}
              onSubmit={(v) => {
                onAdd(v);
                setAddOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((expense, i) => {
          const visual = getCategoryVisual(expense.category);
          const Icon = visual.icon;
          return (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
            >
              <Card className="h-full rounded-2xl border shadow-soft transition-shadow hover:shadow-card">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start gap-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${visual.tint}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {expense.description || expense.category}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{expense.category}</p>
                    </div>
                    <span className="shrink-0 font-display text-sm font-semibold tabular-nums">
                      {formatCOP(Number(expense.amount), expense.currency)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        expense.is_paid ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                      }`}
                    >
                      {expense.is_paid ? t("Pagado") : t("Pendiente")}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      {t(frequencyLabel(expense.frequency))}
                    </span>
                    {expense.due_date && (
                      <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" />
                        {formatShortDate(expense.due_date)}
                      </span>
                    )}
                  </div>

                  <div className="financial-row__actions border-t pt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-xs"
                      onClick={() => onUpdate(expense.id, { is_paid: !expense.is_paid })}
                    >
                      <Check className={`h-4 w-4 ${expense.is_paid ? "text-success" : "text-muted-foreground"}`} />
                      {expense.is_paid ? t("Pagado") : t("Marcar pagado")}
                    </Button>
                    <Button size="icon" variant="ghost" aria-label={t("Editar")} onClick={() => setEditing(expense)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" aria-label={t("Eliminar")} onClick={() => onDelete(expense.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {visible.length === 0 && (
        <Card className="rounded-2xl border border-dashed shadow-none">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {t("No hay gastos en esta vista. Usa “Nuevo” para agregar uno.")}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("Editar gasto")}</DialogTitle></DialogHeader>
          {editing && (
            <ExpenseForm
              key={editing.id}
              categories={categories}
              submitLabel={t("Guardar cambios")}
              initial={{
                category: editing.category,
                amount: Number(editing.amount),
                description: editing.description ?? "",
                is_paid: editing.is_paid,
                due_date: editing.due_date,
                frequency: editing.frequency,
              }}
              onSubmit={(v) => {
                onUpdate(editing.id, v);
                setEditing(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
