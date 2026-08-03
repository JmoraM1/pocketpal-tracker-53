import { Home, Target, PiggyBank, Receipt, CreditCard, Menu } from "lucide-react";
import { motion } from "framer-motion";
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
      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-border/60 bg-card/90 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-6xl items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
          {ITEMS.map((it) => {
            const Icon = it.icon;
            const isActive = active === it.key;
            return (
              <button
                key={it.key}
                onClick={() => onChange(it.key)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[10px] font-semibold transition-colors press",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill-mobile"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-x-1.5 inset-y-1 -z-10 rounded-2xl bg-accent"
                  />
                )}
                <Icon className={cn("h-5 w-5 transition-transform", isActive && "stroke-[2.4] scale-110")} />
                <span>{it.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop top tabs */}
      <nav className="hidden md:flex items-center gap-1 rounded-full border border-border/60 bg-muted/60 p-1 backdrop-blur-md">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.key;
          return (
            <button
              key={it.key}
              onClick={() => onChange(it.key)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-pill-desktop"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-0 -z-10 rounded-full bg-gradient-primary shadow-soft"
                />
              )}
              <Icon className="h-4 w-4" />
              {it.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
