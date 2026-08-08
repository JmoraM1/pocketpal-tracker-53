import { formatMoney } from "@/lib/currency";
import { getUiLocale } from "@/lib/locale";

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

/**
 * Formats a value as money. Pass the record's own currency to keep historical
 * records in the currency they were created with; omit it to use the currency
 * currently configured by the user.
 */
export function formatCOP(value: number, currency?: string | null): string {
  return formatMoney(value, currency);
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

export function formatMonthLabel(dateStr: string, locale = getUiLocale()): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
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
  return d.toLocaleDateString(getUiLocale(), { day: "numeric", month: "short" });
}

export function getShortMonthNames(locale = getUiLocale()): string[] {
  return Array.from({ length: 12 }, (_, i) =>
    new Date(2024, i, 1).toLocaleDateString(locale, { month: "short" }).replace(".", ""),
  );
}
