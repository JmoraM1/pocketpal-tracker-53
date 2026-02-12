import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check } from "lucide-react";

interface IncomeEditorProps {
  income: number;
  onSave: (val: number) => void;
}

export function IncomeEditor({ income, onSave }: IncomeEditorProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(income));

  const handleSave = () => {
    onSave(Number(value) || 0);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
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
      Editar ingreso
    </Button>
  );
}
