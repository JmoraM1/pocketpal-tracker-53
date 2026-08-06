import { motion } from "framer-motion";

export type MascotMood = "excelente" | "bien" | "atencion" | "limite" | "excedido";

const MOOD_COLOR: Record<MascotMood, { body: string; shade: string }> = {
  excelente: { body: "hsl(var(--success))", shade: "hsl(var(--success) / 0.75)" },
  bien: { body: "hsl(var(--success))", shade: "hsl(var(--success) / 0.7)" },
  atencion: { body: "hsl(var(--warning))", shade: "hsl(var(--warning) / 0.75)" },
  limite: { body: "hsl(var(--warning))", shade: "hsl(var(--warning) / 0.7)" },
  excedido: { body: "hsl(var(--destructive))", shade: "hsl(var(--destructive) / 0.75)" },
};

interface MascotProps {
  mood: MascotMood;
  className?: string;
}

/** Ilustración tipo mascota (100% SVG, sin imágenes) que refleja el estado financiero */
export function Mascot({ mood, className }: MascotProps) {
  const c = MOOD_COLOR[mood];
  const happy = mood === "excelente" || mood === "bien";
  const worried = mood === "atencion" || mood === "limite";

  return (
    <motion.svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label={`Estado financiero: ${mood}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, y: [0, -4, 0] }}
      transition={{
        scale: { duration: 0.4 },
        opacity: { duration: 0.4 },
        y: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <ellipse cx="60" cy="108" rx="30" ry="6" fill="currentColor" opacity="0.08" />
      <path d="M60 20c0-8 6-13 13-13 0 8-5 13-13 13z" fill={c.body} />
      <rect x="22" y="20" width="76" height="80" rx="34" fill={c.body} />
      <rect x="22" y="20" width="76" height="80" rx="34" fill={c.shade} opacity="0.25" />
      <circle cx="38" cy="66" r="6" fill="#fff" opacity="0.25" />
      <circle cx="82" cy="66" r="6" fill="#fff" opacity="0.25" />
      {happy ? (
        <>
          <path d="M40 52c3-4 9-4 12 0" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M68 52c3-4 9-4 12 0" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <circle cx="46" cy="53" r="5" fill="#0F172A" />
          <circle cx="74" cy="53" r="5" fill="#0F172A" />
          <path d="M38 44l14 4M82 44l-14 4" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />
        </>
      )}
      {happy ? (
        <path d="M48 74c4 6 20 6 24 0" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" fill="none" />
      ) : worried ? (
        <path d="M50 78h20" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
      ) : (
        <path d="M48 80c4-7 20-7 24 0" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" fill="none" />
      )}
      {happy ? (
        <path d="M96 62c8-2 12-8 12-8" stroke={c.body} strokeWidth="7" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M96 70c8 2 12 8 12 8" stroke={c.body} strokeWidth="7" strokeLinecap="round" fill="none" />
      )}
    </motion.svg>
  );
}
