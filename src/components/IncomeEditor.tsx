import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/ui/money-input";
import { Pencil, Check } from "lucide-react";
import { useT } from "@/lib/i18n";

interface IncomeEditorProps {
  income: number;
  onSave: (val: number) => void;
}

export function IncomeEditor({ income, onSave }: IncomeEditorProps) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(income));

  const handleSave = () => {
    onSave(Number(value) || 0);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <MoneyInput
          value={value}
          onChange={(v) => setValue(v)}
          className="h-9 w-48"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
        <Button size="icon" variant="ghost" onClick={handleSave}>
          <Check className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1 text-muted-foreground"
      onClick={() => {
        setValue(String(income));
        setEditing(true);
      }}
    >
      <Pencil className="h-3.5 w-3.5" />
      {t("Editar ingreso")}
    </Button>
  );
}
