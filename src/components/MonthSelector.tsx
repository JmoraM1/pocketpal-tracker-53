import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { formatMonthLabel, getMonthKey } from "@/lib/constants";

interface MonthSelectorProps {
  selectedMonth: Date;
  onChangeMonth: (date: Date) => void;
  onCopyPrevious: () => void;
}

export function MonthSelector({ selectedMonth, onChangeMonth, onCopyPrevious }: MonthSelectorProps) {
  const goBack = () => {
    const d = new Date(selectedMonth);
    d.setMonth(d.getMonth() - 1);
    onChangeMonth(d);
  };

  const goForward = () => {
    const d = new Date(selectedMonth);
    d.setMonth(d.getMonth() + 1);
    onChangeMonth(d);
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={goBack}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[160px] text-center text-lg font-semibold capitalize">
        {formatMonthLabel(getMonthKey(selectedMonth))}
      </span>
      <Button variant="outline" size="icon" onClick={goForward}>
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={onCopyPrevious} className="ml-2 gap-1">
        <Copy className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Copiar mes anterior</span>
      </Button>
    </div>
  );
}
