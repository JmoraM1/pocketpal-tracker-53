export interface CurrencyInfo {
  code: string;
  label: string;
  labelEn: string;
  locale: string;
  decimals: number;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "COP", label: "COP — Peso colombiano", labelEn: "COP — Colombian peso", locale: "es-CO", decimals: 0 },
  { code: "USD", label: "USD — Dólar estadounidense", labelEn: "USD — US dollar", locale: "en-US", decimals: 2 },
  { code: "EUR", label: "EUR — Euro", labelEn: "EUR — Euro", locale: "es-ES", decimals: 2 },
  { code: "MXN", label: "MXN — Peso mexicano", labelEn: "MXN — Mexican peso", locale: "es-MX", decimals: 2 },
];

export function getCurrencyInfo(code?: string | null): CurrencyInfo {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

/** Currency used for NEW records — mirrors the user's profile setting. */
let activeCurrency = "COP";

export function setActiveCurrency(code?: string | null) {
  activeCurrency = getCurrencyInfo(code).code;
}

export function getActiveCurrency(): string {
  return activeCurrency;
}

/**
 * Formats a monetary value. When `currency` is omitted the active (profile)
 * currency is used — historical records should always pass their own currency.
 */
export function formatMoney(value: number, currency?: string | null): string {
  const info = getCurrencyInfo(currency ?? activeCurrency);
  return new Intl.NumberFormat(info.locale, {
    style: "currency",
    currency: info.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: info.decimals,
  }).format(Number.isFinite(value) ? value : 0);
}

/** Compact form for chart axes: 1,2M / 850K … keeps the currency symbol out. */
export function formatCompactNumber(value: number, currency?: string | null): string {
  const info = getCurrencyInfo(currency ?? activeCurrency);
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${trim(value / 1_000_000_000, info.locale)}B`;
  if (abs >= 1_000_000) return `${trim(value / 1_000_000, info.locale)}M`;
  if (abs >= 1_000) return `${trim(value / 1_000, info.locale)}K`;
  return new Intl.NumberFormat(info.locale, { maximumFractionDigits: 0 }).format(value);
}

function trim(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: value < 10 ? 1 : 0 }).format(value);
}

export function currencySymbol(currency?: string | null): string {
  const info = getCurrencyInfo(currency ?? activeCurrency);
  const parts = new Intl.NumberFormat(info.locale, { style: "currency", currency: info.code }).formatToParts(1);
  return parts.find((p) => p.type === "currency")?.value ?? "$";
}
