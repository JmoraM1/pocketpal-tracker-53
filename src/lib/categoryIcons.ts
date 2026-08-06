import {
  Smartphone,
  Home,
  ShoppingCart,
  Car,
  UtensilsCrossed,
  HeartPulse,
  GraduationCap,
  Gamepad2,
  Plane,
  PiggyBank,
  Landmark,
  Zap,
  Wifi,
  CreditCard,
  Shirt,
  Dog,
  Baby,
  Dumbbell,
  Fuel,
  Receipt,
  type LucideIcon,
} from "lucide-react";

export interface CategoryVisual {
  icon: LucideIcon;
  tint: string; // bg + text tokens
}

const RULES: { match: RegExp; visual: CategoryVisual }[] = [
  { match: /celular|movil|móvil|telefon|teléfon|plan/, visual: { icon: Smartphone, tint: "bg-accent-violet/10 text-accent-violet" } },
  { match: /vivienda|casa|hogar|arriendo|alquiler|renta|admin/, visual: { icon: Home, tint: "bg-warning/10 text-warning" } },
  { match: /mercado|super|compras|aliment/, visual: { icon: ShoppingCart, tint: "bg-success/10 text-success" } },
  { match: /gasolina|combustible/, visual: { icon: Fuel, tint: "bg-destructive/10 text-destructive" } },
  { match: /transporte|moto|carro|bus|taxi|uber/, visual: { icon: Car, tint: "bg-info/10 text-info" } },
  { match: /restaurant|comida|almuerzo|cena/, visual: { icon: UtensilsCrossed, tint: "bg-accent-warm/10 text-accent-warm" } },
  { match: /salud|medic|eps|farmac|droguer/, visual: { icon: HeartPulse, tint: "bg-destructive/10 text-destructive" } },
  { match: /educa|colegio|universidad|curso|estudio/, visual: { icon: GraduationCap, tint: "bg-info/10 text-info" } },
  { match: /entreten|netflix|cine|juego|tele|streaming|cadena/, visual: { icon: Gamepad2, tint: "bg-accent-violet/10 text-accent-violet" } },
  { match: /viaje|vuelo|vacacion/, visual: { icon: Plane, tint: "bg-accent-cool/10 text-accent-cool" } },
  { match: /ahorr|bolsillo|meta/, visual: { icon: PiggyBank, tint: "bg-success/10 text-success" } },
  { match: /deuda|credito|crédito|prestamo|préstamo|cuota|banco/, visual: { icon: Landmark, tint: "bg-warning/10 text-warning" } },
  { match: /tarjeta/, visual: { icon: CreditCard, tint: "bg-warning/10 text-warning" } },
  { match: /servicio|recibo|luz|energ|agua|gas/, visual: { icon: Zap, tint: "bg-accent-warm/10 text-accent-warm" } },
  { match: /internet|wifi|fibra/, visual: { icon: Wifi, tint: "bg-info/10 text-info" } },
  { match: /ropa|vestuario/, visual: { icon: Shirt, tint: "bg-accent-violet/10 text-accent-violet" } },
  { match: /mascota|perro|gato/, visual: { icon: Dog, tint: "bg-accent-warm/10 text-accent-warm" } },
  { match: /hijo|bebe|bebé|niñ/, visual: { icon: Baby, tint: "bg-accent-cool/10 text-accent-cool" } },
  { match: /gimnasio|gym|deporte/, visual: { icon: Dumbbell, tint: "bg-success/10 text-success" } },
];

const FALLBACK: CategoryVisual = { icon: Receipt, tint: "bg-muted text-muted-foreground" };

export function getCategoryVisual(name?: string | null): CategoryVisual {
  if (!name) return FALLBACK;
  const n = name.toLowerCase();
  for (const rule of RULES) {
    if (rule.match.test(n)) return rule.visual;
  }
  return FALLBACK;
}
