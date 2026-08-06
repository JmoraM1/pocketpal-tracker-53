import { motion } from "framer-motion";
import {
  Home,
  Target,
  PiggyBank,
  Receipt,
  CreditCard,
  LayoutGrid,
  BarChart3,
  Download,
  Settings,
  Moon,
  Sun,
  Wallet,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import type { AppView } from "@/components/BottomNav";

const ITEMS: { key: AppView; label: string; icon: typeof Home }[] = [
  { key: "home", label: "Inicio", icon: Home },
  { key: "goals", label: "Metas", icon: Target },
  { key: "savings", label: "Ahorros", icon: PiggyBank },
  { key: "expenses", label: "Gastos", icon: Receipt },
  { key: "debts", label: "Deudas", icon: CreditCard },
  { key: "categories", label: "Categorías", icon: LayoutGrid },
  { key: "reports", label: "Reportes", icon: BarChart3 },
  { key: "export", label: "Exportar", icon: Download },
  { key: "settings", label: "Configuración", icon: Settings },
];

interface AppSidebarProps {
  active: AppView;
  onChange: (v: AppView) => void;
  alias?: string;
  email?: string;
}

export function AppSidebar({ active, onChange, alias, email }: AppSidebarProps) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const initials = (alias || email || "?").trim().slice(0, 1).toUpperCase();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 md:flex">
      <div className="flex items-center gap-2.5 px-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary shadow-soft">
          <Wallet className="h-5 w-5 text-primary-foreground" />
        </span>
        <span className="leading-tight">
          <span className="block font-display text-[15px] font-semibold text-foreground">PocketPal</span>
          <span className="block text-xs text-muted-foreground">Tracker</span>
        </span>
      </div>

      <nav className="mt-7 flex flex-1 flex-col gap-1 overflow-y-auto">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.key;
          return (
            <button
              key={it.key}
              onClick={() => onChange(it.key)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  className="absolute inset-0 -z-10 rounded-xl bg-sidebar-accent"
                />
              )}
              <Icon className="h-[18px] w-[18px]" />
              {it.label}
            </button>
          );
        })}
      </nav>

      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="mt-4 flex items-center gap-3 rounded-xl bg-muted px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        {isDark ? "Modo claro" : "Modo oscuro"}
      </button>

      <button
        onClick={() => onChange("settings")}
        className="mt-3 flex items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-sidebar-accent/60"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground">
          {initials}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm font-medium">{alias || email?.split("@")[0] || "Mi perfil"}</span>
          <span className="block text-xs text-muted-foreground">Ver perfil</span>
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    </aside>
  );
}
