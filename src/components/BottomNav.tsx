import { Home, Target, Receipt, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export type AppView =
  | "home"
  | "goals"
  | "savings"
  | "expenses"
  | "debts"
  | "reports"
  | "export"
  | "settings"
  | "more";

const ITEMS: { key: AppView; label: string; icon: typeof Home }[] = [
  { key: "home", label: "Inicio", icon: Home },
  { key: "expenses", label: "Gastos", icon: Receipt },
  { key: "goals", label: "Metas", icon: Target },
  { key: "more", label: "Más", icon: MoreHorizontal },
];

interface BottomNavProps {
  active: AppView;
  onChange: (v: AppView) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  const t = useT();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-card/95 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-stretch px-2 pb-[env(safe-area-inset-bottom)]">
        {ITEMS.map((it, idx) => {
          const Icon = it.icon;
          const isActive = active === it.key;
          const button = (
            <button
              key={it.key}
              onClick={() => onChange(it.key)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[10px] font-medium transition-colors press",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-pill-mobile"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-x-2 inset-y-1.5 -z-10 rounded-2xl bg-accent"
                />
              )}
              <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
              <span>{t(it.label)}</span>
            </button>
          );
          // hueco central para el botón flotante (+)
          if (idx === 2) {
            return [<span key="fab-slot" aria-hidden className="min-h-[58px]" />, button];
          }
          return button;
        })}
      </div>
    </nav>
  );
}
