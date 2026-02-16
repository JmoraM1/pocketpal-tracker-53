import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatCOP, formatMonthLabel, getMonthKey } from "@/lib/constants";
import type { Tables } from "@/integrations/supabase/types";

type Expense = Tables<"expenses">;

interface ExportButtonProps {
  expenses: Expense[];
  income: number;
  selectedMonth: Date;
  totalExpenses: number;
  available: number;
  cumulativeSavings: number;
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function ExportButton({ expenses, income, selectedMonth, totalExpenses, available, cumulativeSavings }: ExportButtonProps) {
  const handleExport = () => {
    const monthLabel = formatMonthLabel(getMonthKey(selectedMonth));

    const headers = ["Mes", "Tipo", "Categoría", "Descripción", "Valor", "Valor (COP)", "Estado"];

    const rows = expenses.map((e) => [
      monthLabel,
      "Gasto",
      e.category,
      e.description || "",
      String(Number(e.amount)),
      formatCOP(Number(e.amount)),
      e.is_paid ? "Pagado" : "Pendiente",
    ]);

    // Summary rows
    rows.push(
      [monthLabel, "Resumen", "Ingreso del Mes", "", String(income), formatCOP(income), ""],
      [monthLabel, "Resumen", "Total Gastos", "", String(totalExpenses), formatCOP(totalExpenses), ""],
      [monthLabel, "Resumen", "Disponible para Ahorro", "", String(available), formatCOP(available), ""],
      [monthLabel, "Resumen", "Ahorro Acumulado", "", String(cumulativeSavings), formatCOP(cumulativeSavings), ""],
    );

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Finanzas_${getMonthKey(selectedMonth)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" className="gap-1" onClick={handleExport}>
      <Download className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Exportar CSV</span>
    </Button>
  );
}
