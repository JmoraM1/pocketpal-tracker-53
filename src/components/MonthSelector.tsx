import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Copy, CalendarDays } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatMonthLabel, getMonthKey, getShortMonthNames } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

interface MonthSelectorProps {
  selectedMonth: Date;
  onChangeMonth: (date: Date) => void;
  onCopyPrevious: () => void;
}

export function MonthSelector({ selectedMonth, onChangeMonth, onCopyPrevious }: MonthSelectorProps) {
  const { t, locale } = useI18n();
  const MONTH_NAMES = getShortMonthNames(locale);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selectedMonth.getFullYear());

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

  const selectMonth = (monthIndex: number) => {
    onChangeMonth(new Date(viewYear, monthIndex, 1));
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) setViewYear(selectedMonth.getFullYear());
    setOpen(isOpen);
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={goBack}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[160px] gap-2 capitalize">
            <CalendarDays className="h-4 w-4" />
            {formatMonthLabel(getMonthKey(selectedMonth), locale)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-3" align="start">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="icon" onClick={() => setViewYear((y) => y - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold">{viewYear}</span>
            <Button variant="ghost" size="icon" onClick={() => setViewYear((y) => y + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MONTH_NAMES.map((name, i) => {
              const isSelected =
                selectedMonth.getFullYear() === viewYear && selectedMonth.getMonth() === i;
              return (
                <Button
                  key={name}
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  className="h-9"
                  onClick={() => selectMonth(i)}
                >
                  {name}
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      <Button variant="outline" size="icon" onClick={goForward}>
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button variant="outline" size="sm" onClick={onCopyPrevious} className="ml-2 gap-1">
        <Copy className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t("Copiar mes anterior")}</span>
      </Button>
    </div>
  );
}
