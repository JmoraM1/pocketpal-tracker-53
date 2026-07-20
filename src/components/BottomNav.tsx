import { Home, Target, PiggyBank, Receipt, CreditCard, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export type AppView = "home" | "goals" | "savings" | "expenses" | "debts" | "more";

const ITEMS: { key: AppView; label: string; icon: typeof Home }[] = [
  { key: "home", label: "Inicio", icon: Home },
  { key: "goals", label: "Metas", icon: Target },
  { key: "savings", label: "Ahorros", icon: PiggyBank },
  { key: "expenses", label: "Gastos", icon: Receipt },
  { key: "debts", label: "Deudas", icon: CreditCard },
  { key: "more", label: "Más", icon: Menu },
];

interface BottomNavProps {
  active: AppView;
  onChange: (v: AppView) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-20 border-t bg-card/95 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-6xl items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
          {ITEMS.map((it) => {
            const Icon = it.icon;
            const isActive = active === it.key;
            return (
              <button
                key={it.key}
                onClick={() => onChange(it.key)}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                <span>{it.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop top tabs */}
      <nav className="hidden md:flex items-center gap-1 rounded-full border bg-card/60 p-1 backdrop-blur-md">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.key;
          return (
            <button
              key={it.key}
              onClick={() => onChange(it.key)}
              className={cn(
                "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
