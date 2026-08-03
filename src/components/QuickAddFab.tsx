import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Receipt, CreditCard, Target, PiggyBank } from "lucide-react";
import type { AppView } from "@/components/BottomNav";

interface QuickAddFabProps {
  onNavigate: (v: AppView) => void;
}

const ACTIONS: { label: string; icon: typeof Plus; view: AppView; tint: string }[] = [
  { label: "Nuevo gasto", icon: Receipt, view: "expenses", tint: "bg-destructive/10 text-destructive" },
  { label: "Nueva deuda", icon: CreditCard, view: "debts", tint: "bg-warning/10 text-warning" },
  { label: "Nueva meta", icon: Target, view: "goals", tint: "bg-primary/10 text-primary" },
  { label: "Nuevo ahorro", icon: PiggyBank, view: "savings", tint: "bg-success/10 text-success" },
];

export function QuickAddFab({ onNavigate }: QuickAddFabProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.button
            key="scrim"
            aria-label="Cerrar acciones rápidas"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 bg-foreground/30 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-3 md:bottom-8 md:right-8">
        <AnimatePresence>
          {open &&
            ACTIONS.map((a, i) => {
              const Icon = a.icon;
              return (
                <motion.button
                  key={a.label}
                  initial={{ opacity: 0, y: 12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: i * 0.04 } }}
                  exit={{ opacity: 0, y: 8, scale: 0.9, transition: { delay: (ACTIONS.length - i) * 0.02 } }}
                  onClick={() => {
                    onNavigate(a.view);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-full border bg-card py-2 pl-3 pr-4 text-sm font-semibold shadow-card transition-colors hover:bg-accent"
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full ${a.tint}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {a.label}
                </motion.button>
              );
            })}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Acciones rápidas"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-float"
        >
          <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ type: "spring", stiffness: 380, damping: 22 }}>
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </motion.span>
        </motion.button>
      </div>
    </>
  );
}
