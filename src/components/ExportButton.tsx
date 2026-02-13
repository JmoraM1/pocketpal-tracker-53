import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatCOP, formatMonthLabel, getMonthKey } from "@/lib/constants";
import type { Tables } from "@/integrations/supabase/types";
import * as XLSX from "xlsx";

type Expense = Tables<"expenses">;

interface ExportButtonProps {
  expenses: Expense[];
  income: number;
  selectedMonth: Date;
  totalExpenses: number;
  available: number;
  cumulativeSavings: number;
}

export function ExportButton({ expenses, income, selectedMonth, totalExpenses, available, cumulativeSavings }: ExportButtonProps) {
  const handleExport = () => {
    const monthLabel = formatMonthLabel(getMonthKey(selectedMonth));

    const rows = expenses.map((e) => ({
      Mes: monthLabel,
      Tipo: "Gasto",
      Categoría: e.category,
      Descripción: e.description || "",
      Valor: Number(e.amount),
      "Valor (COP)": formatCOP(Number(e.amount)),
      Estado: e.is_paid ? "Pagado" : "Pendiente",
    }));

    // Add summary rows
    rows.push(
      { Mes: monthLabel, Tipo: "Resumen", Categoría: "Ingreso del Mes", Descripción: "", Valor: income, "Valor (COP)": formatCOP(income), Estado: "" },
      { Mes: monthLabel, Tipo: "Resumen", Categoría: "Total Gastos", Descripción: "", Valor: totalExpenses, "Valor (COP)": formatCOP(totalExpenses), Estado: "" },
      { Mes: monthLabel, Tipo: "Resumen", Categoría: "Disponible para Ahorro", Descripción: "", Valor: available, "Valor (COP)": formatCOP(available), Estado: "" },
      { Mes: monthLabel, Tipo: "Resumen", Categoría: "Ahorro Acumulado", Descripción: "", Valor: cumulativeSavings, "Valor (COP)": formatCOP(cumulativeSavings), Estado: "" },
    );

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Finanzas");

    // Auto-width columns
    const colWidths = Object.keys(rows[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...rows.map((r) => String((r as any)[key] || "").length)) + 2,
    }));
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, `Finanzas_${getMonthKey(selectedMonth)}.xlsx`);
  };

  return (
    <Button variant="outline" size="sm" className="gap-1" onClick={handleExport}>
      <Download className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Exportar Excel</span>
    </Button>
  );
}
