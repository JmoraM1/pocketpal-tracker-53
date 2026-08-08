import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatCOP, formatMonthLabel, getMonthKey } from "@/lib/constants";
import type { Tables } from "@/integrations/supabase/types";
import { useT } from "@/lib/i18n";

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
  const t = useT();
  const handleExport = () => {
    const monthLabel = formatMonthLabel(getMonthKey(selectedMonth));

    const headers = [t("Mes"), t("Tipo"), t("Categoría"), t("Descripción"), t("Valor"), t("Valor con formato"), t("Estado")];

    const rows = expenses.map((e) => [
      monthLabel,
      t("Gasto"),
      e.category,
      e.description || "",
      String(Number(e.amount)),
      formatCOP(Number(e.amount)),
      e.is_paid ? t("Pagado") : t("Pendiente"),
    ]);

    // Summary rows
    rows.push(
      [monthLabel, t("Resumen"), t("Ingreso del Mes"), "", String(income), formatCOP(income), ""],
      [monthLabel, t("Resumen"), t("Total Gastos"), "", String(totalExpenses), formatCOP(totalExpenses), ""],
      [monthLabel, t("Resumen"), t("Disponible para Ahorro"), "", String(available), formatCOP(available), ""],
      [monthLabel, t("Resumen"), t("Ahorro Acumulado"), "", String(cumulativeSavings), formatCOP(cumulativeSavings), ""],
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
      <span className="hidden sm:inline">{t("Exportar CSV")}</span>
    </Button>
  );
}
