import {
  Smartphone,
  Home,
  Landmark,
  Tv,
  CreditCard,
  Fuel,
  Wallet,
  ShieldAlert,
  Bike,
  PiggyBank,
  ShoppingCart,
  Utensils,
  Bus,
  Zap,
  HeartPulse,
  GraduationCap,
  Gift,
  Receipt,
} from "lucide-react";

export interface CategoryVisual {
  icon: typeof Receipt;
  /** Clases tailwind de fondo + texto con tokens semánticos */
  tint: string;
  /** Color HSL para barras de progreso */
  color: string;
}

const PALETTE = [
  { tint: "bg-primary/10 text-primary", color: "hsl(var(--primary))" },
  { tint: "bg-[hsl(var(--accent-cool)/0.12)] text-[hsl(var(--accent-cool))]", color: "hsl(var(--accent-cool))" },
  { tint: "bg-[hsl(var(--accent-warm)/0.12)] text-[hsl(var(--accent-warm))]", color: "hsl(var(--accent-warm))" },
  { tint: "bg-success/10 text-success", color: "hsl(var(--success))" },
  { tint: "bg-warning/15 text-warning", color: "hsl(var(--warning))" },
  { tint: "bg-destructive/10 text-destructive", color: "hsl(var(--destructive))" },
];

const RULES: { match: RegExp; icon: typeof Receipt; paletteIndex: number }[] = [
  { match: /celular|movil|telefon|plan/, icon: Smartphone, paletteIndex: 1 },
  { match: /recibo|casa|hogar|arriend|alquil/, icon: Home, paletteIndex: 0 },
  { match: /banco|credito|prestamo|cuota/, icon: Landmark, paletteIndex: 5 },
  { match: /tele|cadena|streaming|netflix|tv/, icon: Tv, paletteIndex: 2 },
  { match: /tarjeta/, icon: CreditCard, paletteIndex: 5 },
  { match: /gasolina|combustible|moto|carro|veh/, icon: Fuel, paletteIndex: 2 },
  { match: /mantenimiento|taller/, icon: Bike, paletteIndex: 2 },
  { match: /emergencia/, icon: ShieldAlert, paletteIndex: 4 },
  { match: /bolsillo|vale|abono/, icon: Wallet, paletteIndex: 0 },
  { match: /ahorr/, icon: PiggyBank, paletteIndex: 3 },
  { match: /mercado|compra|super/, icon: ShoppingCart, paletteIndex: 3 },
  { match: /comida|restaurante|almuerzo/, icon: Utensils, paletteIndex: 2 },
  { match: /transporte|bus|taxi|uber/, icon: Bus, paletteIndex: 1 },
  { match: /servicio|luz|agua|energ|gas|internet/, icon: Zap, paletteIndex: 4 },
  { match: /salud|medic|eps|farmacia/, icon: HeartPulse, paletteIndex: 5 },
  { match: /educa|colegio|universidad|curso/, icon: GraduationCap, paletteIndex: 1 },
  { match: /regalo|gift|detalle/, icon: Gift, paletteIndex: 2 },
];

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hashIndex(name: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 100000;
  return h % mod;
}

/** Devuelve icono y color consistentes para una categoría. */
export function categoryVisual(name: string): CategoryVisual {
  const n = normalize(name ?? "");
  const rule = RULES.find((r) => r.match.test(n));
  if (rule) {
    const p = PALETTE[rule.paletteIndex];
    return { icon: rule.icon, tint: p.tint, color: p.color };
  }
  const p = PALETTE[hashIndex(n, PALETTE.length)];
  return { icon: Receipt, tint: p.tint, color: p.color };
}
