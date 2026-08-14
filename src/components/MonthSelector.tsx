import { useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Copy, ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthKey } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface MonthSelectorProps {
  selectedMonth: Date;
  onChangeMonth: (date: Date) => void;
  onCopyPrevious: () => void;
}

export function MonthSelector({ selectedMonth, onChangeMonth, onCopyPrevious }: MonthSelectorProps) {
  const { t, locale } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const months = useMemo(() => {
    const out: { key: string; date: Date; label: string; year: number }[] = [];
    const center = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    // 12 meses antes y 12 después para dar margen de desplazamiento
    const start = new Date(center.getFullYear(), center.getMonth() - 12, 1);
    const end = new Date(center.getFullYear(), center.getMonth() + 12, 1);
    const cur = new Date(start);
    while (cur <= end) {
      out.push({
        key: getMonthKey(cur),
        date: new Date(cur),
        label: cur.toLocaleDateString(locale, { month: "short" }).replace(".", ""),
        year: cur.getFullYear(),
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    return out;
  }, [selectedMonth.getTime(), locale]);

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

  useEffect(() => {
    if (selectedRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = selectedRef.current;
      const containerWidth = container.clientWidth;
      const elLeft = el.offsetLeft;
      const elWidth = el.offsetWidth;
      container.scrollTo({
        left: elLeft - containerWidth / 2 + elWidth / 2,
        behavior: "smooth",
      });
    }
  }, [selectedMonth.getTime()]);

  return (
    <div className="flex w-full items-center gap-2">
      <Button variant="outline" size="icon" onClick={goBack} aria-label={t("Mes anterior")}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div
        ref={scrollRef}
        className="relative flex flex-1 snap-x snap-mandatory gap-1 overflow-x-auto scroll-smooth [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {months.map((m) => {
          const isSelected =
            selectedMonth.getFullYear() === m.date.getFullYear() &&
            selectedMonth.getMonth() === m.date.getMonth();
          return (
            <button
              key={m.key}
              ref={isSelected ? selectedRef : undefined}
              onClick={() => onChangeMonth(m.date)}
              className={cn(
                "shrink-0 snap-center rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <span className="block capitalize leading-none">{m.label}</span>
              <span className="mt-0.5 block text-[10px] opacity-80 leading-none">{m.year}</span>
            </button>
          );
        })}
      </div>

      <Button variant="outline" size="icon" onClick={goForward} aria-label={t("Mes siguiente")}>
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button variant="outline" size="sm" onClick={onCopyPrevious} className="hidden gap-1 sm:flex">
        <Copy className="h-3.5 w-3.5" />
        <span>{t("Copiar mes anterior")}</span>
      </Button>
    </div>
  );
}
