export const DEFAULT_CATEGORIES = [
  "Plan celular",
  "Recibos casa",
  "Cuota crédito Banco de Bogotá",
  "Cadena Tele 30 días",
  "Tarjeta",
  "Gasolina",
  "Bolsillo Cami y Juan",
  "Bolsillo emergencia",
  "Bolsillo moto mantenimiento",
  "Vale abono extra",
  "Crédito",
] as const;

export function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

export function formatMonthLabel(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
}

export function isSavingsCategory(name: string): boolean {
  const normalized = name.toLowerCase().replace(/[^a-záéíóúñü]/g, "");
  return normalized.includes("ahorr");
}
