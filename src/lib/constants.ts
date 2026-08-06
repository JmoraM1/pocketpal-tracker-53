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

export const FREQUENCIES = [
  { value: "unico", label: "Único" },
  { value: "diario", label: "Diario" },
  { value: "semanal", label: "Semanal" },
  { value: "quincenal", label: "Quincenal" },
  { value: "mensual", label: "Mensual" },
  { value: "bimestral", label: "Bimestral" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
] as const;

export function frequencyLabel(value?: string | null): string {
  return FREQUENCIES.find((f) => f.value === value)?.label ?? "Único";
}

export function formatShortDate(value?: string | null): string {
  if (!value) return "";
  const d = new Date(`${value}T12:00:00`);
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}
