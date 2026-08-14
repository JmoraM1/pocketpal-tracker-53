import { motion } from "framer-motion";
import { Mascot, type MascotMood } from "@/components/Mascot";
import { useT } from "@/lib/i18n";

interface SmartMessageProps {
  /** Porcentaje del ingreso comprometido */
  pct: number;
  hasIncome: boolean;
  /** Máximo 3 datos breves basados en datos reales */
  insights?: string[];
}


interface MoodConfig {
  mood: MascotMood;
  title: string;
  emoji: string;
  wrap: string;
  title_color: string;
  bar: string;
  track: string;
}

function resolve(pct: number): MoodConfig {
  if (pct < 40)
    return {
      mood: "excelente",
      title: "¡Excelente!",
      emoji: "💚",
      wrap: "border-success/25 bg-success/10",
      title_color: "text-success",
      bar: "bg-success",
      track: "bg-success/20",
    };
  if (pct < 65)
    return {
      mood: "bien",
      title: "¡Vas muy bien!",
      emoji: "💚",
      wrap: "border-success/25 bg-success/10",
      title_color: "text-success",
      bar: "bg-success",
      track: "bg-success/20",
    };
  if (pct < 85)
    return {
      mood: "atencion",
      title: "Buen ritmo",
      emoji: "🙂",
      wrap: "border-warning/25 bg-warning/10",
      title_color: "text-warning",
      bar: "bg-warning",
      track: "bg-warning/20",
    };
  if (pct <= 100)
    return {
      mood: "limite",
      title: "Atención",
      emoji: "⚠️",
      wrap: "border-warning/30 bg-warning/10",
      title_color: "text-warning",
      bar: "bg-warning",
      track: "bg-warning/20",
    };
  return {
    mood: "excedido",
    title: "Excedido",
    emoji: "🚨",
    wrap: "border-destructive/30 bg-destructive/10",
    title_color: "text-destructive",
    bar: "bg-destructive",
    track: "bg-destructive/20",
  };
}

export function SmartMessage({ pct, hasIncome, insights = [] }: SmartMessageProps) {
  const t = useT();
  const cfg = resolve(pct);
  const description = !hasIncome
    ? t("Registra tu ingreso del mes para ver tu resumen inteligente.")
    : t("Llevas el {n}% de tus ingresos comprometidos.", { n: pct });
  const list = insights.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border p-5 sm:p-6 ${cfg.wrap}`}
    >
      <div className="min-w-0 flex-1">
        <p className={`font-display text-lg font-semibold ${cfg.title_color}`}>
          {t(cfg.title)} {cfg.emoji}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        <div className={`mt-4 h-2.5 w-full max-w-md overflow-hidden rounded-full ${cfg.track}`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(pct, 100)}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className={`h-full rounded-full ${cfg.bar}`}
          />
        </div>
        {list.length > 0 && (
          <ul className="mt-3 space-y-1">
            {list.map((i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${cfg.bar}`} />
                <span className="min-w-0">{i}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Mascot mood={cfg.mood} className="h-24 w-24 shrink-0 sm:h-28 sm:w-28" />
    </motion.div>
  );
}
