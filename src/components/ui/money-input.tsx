import * as React from "react";
import { Input } from "@/components/ui/input";
import { getActiveCurrency, getCurrencyInfo } from "@/lib/currency";

interface MoneyInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value" | "type"> {
  value: string | number | undefined;
  onChange: (rawValue: string) => void;
}

function formatDisplay(raw: string): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const info = getCurrencyInfo(getActiveCurrency());
  const symbolParts = new Intl.NumberFormat(info.locale, { style: "currency", currency: info.code }).formatToParts(1);
  const symbol = symbolParts.find((p) => p.type === "currency")?.value ?? "$";
  const grouped = new Intl.NumberFormat(info.locale, { maximumFractionDigits: 0 }).format(Number(digits));
  return `${symbol}${grouped}`;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onChange, placeholder = "$0", inputMode = "numeric", ...props }, ref) => {
    const raw = value === undefined || value === null || value === "" ? "" : String(value).replace(/\D/g, "");
    const display = formatDisplay(raw);

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode={inputMode}
        placeholder={placeholder}
        value={display}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          onChange(digits);
        }}
      />
    );
  },
);
MoneyInput.displayName = "MoneyInput";
