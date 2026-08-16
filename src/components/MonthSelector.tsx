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
    <div className="row-item gap-2">
      <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={goBack}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="btn-compact btn-grow min-w-0 capitalize">
            <CalendarDays className="h-4 w-4" />
            <span className="min-w-0 truncate">{formatMonthLabel(getMonthKey(selectedMonth), locale)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-3" align="start">
          <div className="row-item mb-3 justify-between">
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

      <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={goForward}>
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button variant="outline" size="sm" onClick={onCopyPrevious} className="btn-compact">
        <Copy className="h-3.5 w-3.5" />
        <span className="hidden md:inline">{t("Copiar mes anterior")}</span>
      </Button>
    </div>
  );
}
