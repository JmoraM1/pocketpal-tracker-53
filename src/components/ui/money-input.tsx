import * as React from "react";
import { Input } from "@/components/ui/input";

interface MoneyInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value" | "type"> {
  value: string | number | undefined;
  onChange: (rawValue: string) => void;
}

function formatDisplay(raw: string): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const withSep = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `$${withSep}`;
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
