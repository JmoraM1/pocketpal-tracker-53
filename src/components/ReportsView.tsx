import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  ArrowDown, ArrowUp, CalendarRange, ChevronDown, Download, Layers, Minus,
  Receipt, TrendingUp, Wallet,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Mascot } from "@/components/Mascot";
import { formatCOP, formatMonthLabel } from "@/lib/constants";
import { useT } from "@/lib/i18n";
import { useReports, type ReportPeriodId, type CategoryTotal } from "@/hooks/useReports";
import { cn } from "@/lib/utils";

const COLORS = [
  "hsl(var(--primary))", "hsl(160 60% 45%)", "hsl(38 92% 55%)", "hsl(220 80% 58%)",
  "hsl(340 70% 58%)", "hsl(280 60% 60%)", "hsl(15 85% 58%)", "hsl(190 70% 45%)",
  "hsl(100 45% 48%)", "hsl(60 60% 45%)",
];

/** Colores planos equivalentes para el PDF (no admite variables CSS) */
const PRINT_COLORS = [
  "#16a34a", "#2dd4a7", "#f59e0b", "#3b82f6",
  "#ec4899", "#a855f7", "#f97316", "#06b6d4",
  "#84cc16", "#ca8a04",
];

const PERIODS: { id: ReportPeriodId; label: string }[] = [
  { id: "current", label: "Este mes" },
  { id: "last3", label: "Últimos 3 meses" },
  { id: "previous", label: "Mes anterior" },
];
// Personalizado se renderiza aparte, centrado debajo de la fila principal.

function variation(current: number, prev: number): number | null {
  if (!prev) return current > 0 ? null : 0;
  return ((current - prev) / prev) * 100;
}

/**
 * invert=false → subir es malo (gastos). invert=true → subir es bueno (disponible).
 */
function Delta({ value, invert = false }: { value: number | null; invert?: boolean }) {
  const t = useT();
  if (value === null) return <span className="text-muted-foreground">{t("Sin dato previo")}</span>;
  const rounded = Math.round(value);
  if (rounded === 0)
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Minus className="h-3 w-3" /> {t("Igual")}
      </span>
    );
  const up = rounded > 0;
  const good = invert ? up : !up;
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-medium", good ? "text-success" : "text-destructive")}>
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(rounded)}%
    </span>
  );
}

function TypeBadge({ type }: { type: "gasto" | "deuda" }) {
  const t = useT();
  return (
    <Badge
      variant="secondary"
      className={cn(
        "shrink-0 rounded-full px-2 py-0 text-[10px] font-medium",
        type === "deuda" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
      )}
    >
      {type === "deuda" ? t("Deuda") : t("Gasto")}
    </Badge>
  );
}

/** Donut en SVG puro para incrustar en el PDF */
function donutSvg(data: { name: string; amount: number }[], total: number): string {
  const size = 220;
  const r = 88;
  const inner = 56;
  const cx = size / 2;
  const cy = size / 2;
  if (total <= 0) return "";
  let angle = -Math.PI / 2;
  const paths = data
    .map((d, i) => {
      const slice = (d.amount / total) * Math.PI * 2;
      const end = angle + slice;
      const large = slice > Math.PI ? 1 : 0;
      const p = (radius: number, a: number) =>
        `${(cx + radius * Math.cos(a)).toFixed(2)} ${(cy + radius * Math.sin(a)).toFixed(2)}`;
      const path = `M ${p(r, angle)} A ${r} ${r} 0 ${large} 1 ${p(r, end)} L ${p(inner, end)} A ${inner} ${inner} 0 ${large} 0 ${p(inner, angle)} Z`;
      angle = end;
      return `<path d="${path}" fill="${PRINT_COLORS[i % PRINT_COLORS.length]}" />`;
    })
    .join("");
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;
}

interface ReportsViewProps {
  userId: string | undefined;
  selectedMonth: Date;
}

export function ReportsView({ userId, selectedMonth }: ReportsViewProps) {
  const t = useT();
  const [period, setPeriod] = useState<ReportPeriodId>("current");
  const [range, setRange] = useState<{ from?: Date; to?: Date }>({});
  const [compareBy, setCompareBy] = useState<"monto" | "porcentaje">("monto");
  const [showAll, setShowAll] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const report = useReports(userId, period, selectedMonth, range);
  const {
    totals, totalOut, prevTotalOut, income, available, prevAvailable,
    categoriesUsed, prevCategoriesUsed, biggest, months, prevMonths, items, loading,
  } = report;

  const periodLabel = useMemo(() => {
    if (months.length === 0) return "";
    const first = formatMonthLabel(months[0]);
    const last = formatMonthLabel(months[months.length - 1]);
    return months.length === 1 ? first : `${first} – ${last}`;
  }, [months]);

  const prevLabel = useMemo(
    () => (prevMonths.length ? formatMonthLabel(prevMonths[prevMonths.length - 1]) : ""),
    [prevMonths],
  );

  const chartData = useMemo(() => {
    const top = totals.slice(0, 8);
    const rest = totals.slice(8).reduce((s, c) => s + c.amount, 0);
    return rest > 0 ? [...top, { name: t("Otros"), type: "gasto" as const, amount: rest, prev: 0 }] : top;
  }, [totals, t]);

  const pct = (v: number) => (totalOut > 0 ? Math.round((v / totalOut) * 100) : 0);
  const committed = income > 0 ? Math.round((totalOut / income) * 100) : 0;

  /** Máximo 3 recomendaciones, siempre con datos reales del período */
  const insights = useMemo(() => {
    const out: string[] = [];
    if (income > 0) out.push(t("Comprometiste el {pct}% de tus ingresos.", { pct: committed }));
    if (biggest)
      out.push(
        t("Mayor salida: {name} con {value} ({pct}% del total).", {
          name: biggest.name, value: formatCOP(biggest.amount), pct: pct(biggest.amount),
        }),
      );
    const v = variation(totalOut, prevTotalOut);
    if (v !== null && Math.abs(Math.round(v)) > 0)
      out.push(
        v > 0
          ? t("Tus salidas subieron {pct}% frente al período anterior.", { pct: Math.abs(Math.round(v)) })
          : t("Tus salidas bajaron {pct}% frente al período anterior. Buen trabajo.", { pct: Math.abs(Math.round(v)) }),
      );
    if (committed > 85) out.push(t("Reduce la categoría más alta para recuperar margen."));
    else if (available > 0)
      out.push(t("Te quedaron {value} disponibles: destina una parte al ahorro.", { value: formatCOP(available) }));
    return out.slice(0, 3);
  }, [income, committed, biggest, totalOut, prevTotalOut, available, t]);

  const mood = committed > 100 ? "excedido" : committed > 85 ? "limite" : committed > 65 ? "atencion" : "bien";

  /* ---------------- Export ---------------- */
  const fileBase = `Reporte_${months[0] ?? ""}${months.length > 1 ? `_${months[months.length - 1]}` : ""}`;

  const exportExcel = () => {
    const detail = items
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((i) => ({
        [t("Fecha")]: i.date,
        [t("Concepto")]: i.description || i.name,
        [t("Tipo")]: i.type === "deuda" ? t("Deuda") : t("Gasto"),
        [t("Categoría")]: i.category,
        [t("Valor")]: i.amount,
        [t("Período")]: periodLabel,
      }));

    const byCategory = totals.map((c) => ({
      [t("Concepto")]: c.name,
      [t("Tipo")]: c.type === "deuda" ? t("Deuda") : t("Gasto"),
      [t("Valor")]: c.amount,
      ["%"]: pct(c.amount),
      [t("Comparado con")]: c.prev,
    }));

    const summary = [
      { [t("Resumen")]: t("Período"), [t("Valor")]: periodLabel },
      { [t("Resumen")]: t("Gastos totales"), [t("Valor")]: totalOut },
      { [t("Resumen")]: t("Conceptos registrados"), [t("Valor")]: categoriesUsed },
      { [t("Resumen")]: t("Mayor salida de dinero"), [t("Valor")]: biggest ? `${biggest.name} — ${biggest.amount}` : "—" },
      { [t("Resumen")]: t("Disponible del mes"), [t("Valor")]: available },
      { [t("Resumen")]: t("Ingresos"), [t("Valor")]: income },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), t("Resumen").slice(0, 28));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detail), t("Detalle").slice(0, 28));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(byCategory), t("Conceptos").slice(0, 28));
    XLSX.writeFile(wb, `${fileBase}.xlsx`);
  };

  const exportPdf = () => {
    const legend = chartData
      .map(
        (c, i) =>
          `<li><span class="dot" style="background:${PRINT_COLORS[i % PRINT_COLORS.length]}"></span>
           <span class="nm">${c.name}</span>
           <span class="tag ${c.type}">${c.type === "deuda" ? t("Deuda") : t("Gasto")}</span>
           <b>${formatCOP(c.amount)}</b><i>${pct(c.amount)}%</i></li>`,
      )
      .join("");

    const maxAmount = totals[0]?.amount ?? 0;
    const bars = totals
      .map((c) => {
        const w = maxAmount > 0 ? (c.amount / maxAmount) * 100 : 0;
        const pw = maxAmount > 0 ? (c.prev / maxAmount) * 100 : 0;
        const v = variation(c.amount, c.prev);
        const vTxt = v === null ? "—" : `${v > 0 ? "▲" : v < 0 ? "▼" : "="} ${Math.abs(Math.round(v))}%`;
        const vColor = v === null || Math.round(v) === 0 ? "#64748b" : v > 0 ? "#dc2626" : "#16a34a";
        return `<div class="bar">
          <div class="barhead"><span>${c.name}</span><span style="color:${vColor}">${vTxt}</span></div>
          <div class="track"><div class="fill" style="width:${Math.max(w, 2)}%"></div></div>
          <div class="track prevtrack"><div class="prevfill" style="width:${Math.max(pw, 1)}%"></div></div>
          <div class="barfoot"><span>${formatCOP(c.amount)}</span><span>${pct(c.amount)}%</span></div>
        </div>`;
      })
      .join("");

    const rows = items
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(
        (i) => `<tr><td>${i.date}</td><td>${i.description || i.name}</td>
        <td>${i.type === "deuda" ? t("Deuda") : t("Gasto")}</td><td>${i.category}</td>
        <td class="r">${formatCOP(i.amount)}</td></tr>`,
      )
      .join("");

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${t("Reportes")} — ${periodLabel}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:system-ui,-apple-system,sans-serif;color:#0f172a;padding:26px;}
        h1{font-size:20px;margin:0} h2{font-size:14px;margin:22px 0 8px}
        p.sub{color:#64748b;margin:4px 0 16px;font-size:12px;text-transform:capitalize}
        .cards{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}
        .card{border:1px solid #e2e8f0;border-radius:10px;padding:10px 14px;min-width:150px}
        .card span{display:block;font-size:11px;color:#64748b} .card b{font-size:15px}
        .chart{display:flex;gap:20px;align-items:center;border:1px solid #e2e8f0;border-radius:10px;padding:14px}
        ul.legend{list-style:none;margin:0;padding:0;flex:1;font-size:11px}
        ul.legend li{display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid #f1f5f9}
        .dot{width:9px;height:9px;border-radius:50%;display:inline-block}
        .nm{flex:1} .legend b{width:90px;text-align:right} .legend i{width:34px;text-align:right;color:#64748b;font-style:normal}
        .tag{font-size:9px;border-radius:9px;padding:1px 6px}
        .tag.gasto{background:#dcfce7;color:#15803d} .tag.deuda{background:#fee2e2;color:#b91c1c}
        .bars{display:grid;grid-template-columns:1fr 1fr;gap:10px 18px}
        .bar{font-size:11px} .barhead,.barfoot{display:flex;justify-content:space-between}
        .barfoot{color:#64748b;font-size:10px;margin-top:2px}
        .track{height:7px;background:#f1f5f9;border-radius:5px;margin-top:3px;overflow:hidden}
        .prevtrack{height:5px;opacity:.8}
        .fill{height:100%;background:#16a34a;border-radius:5px}
        .prevfill{height:100%;background:#cbd5e1;border-radius:5px}
        table{width:100%;border-collapse:collapse;font-size:11px;margin-top:6px}
        th,td{border-bottom:1px solid #e2e8f0;padding:5px 8px;text-align:left}
        th{background:#f8fafc} .r{text-align:right}
        ul.ins{font-size:11px;color:#334155;margin:0;padding-left:16px}
        @media print{ .chart,.bar,tr{break-inside:avoid} }
      </style></head><body>
      <h1>${t("Reportes")}</h1><p class="sub">${periodLabel}</p>
      <div class="cards">
        <div class="card"><span>${t("Gastos totales")}</span><b>${formatCOP(totalOut)}</b></div>
        <div class="card"><span>${t("Conceptos registrados")}</span><b>${categoriesUsed}</b></div>
        <div class="card"><span>${t("Mayor salida de dinero")}</span><b>${biggest ? `${biggest.name} · ${formatCOP(biggest.amount)}` : "—"}</b></div>
        <div class="card"><span>${t("Disponible del mes")}</span><b>${formatCOP(available)}</b></div>
      </div>
      <h2>${t("Distribución de gastos")}</h2>
      <div class="chart">${donutSvg(chartData, totalOut)}<ul class="legend">${legend}</ul></div>
      <h2>${t("Comparación por categoría")}${prevLabel ? ` — ${t("Comparado con")} ${prevLabel}` : ""}</h2>
      <div class="bars">${bars}</div>
      <h2>${t("Insights IA")}</h2>
      <ul class="ins">${insights.map((i) => `<li>${i}</li>`).join("")}</ul>
      <h2>${t("Detalle por categoría")}</h2>
      <table><thead><tr><th>${t("Fecha")}</th><th>${t("Concepto")}</th><th>${t("Tipo")}</th><th>${t("Categoría")}</th><th class="r">${t("Valor")}</th></tr></thead>
      <tbody>${rows}</tbody></table></body></html>`;

    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    document.body.appendChild(frame);
    const doc = frame.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      frame.contentWindow?.focus();
      setTimeout(() => {
        frame.contentWindow?.print();
        setTimeout(() => frame.remove(), 1000);
      }, 350);
    }
  };

  /* ---------------- UI ---------------- */
  const cards = [
    {
      icon: Receipt,
      tone: "bg-primary/10 text-primary",
      label: t("Gastos totales"),
      hint: t("Gastos + cuotas de deudas"),
      value: formatCOP(totalOut),
      delta: <Delta value={variation(totalOut, prevTotalOut)} />,
    },
    {
      icon: Layers,
      tone: "bg-secondary/60 text-foreground",
      label: t("Conceptos registrados"),
      hint: t("Gastos y deudas"),
      value: String(categoriesUsed),
      delta: <Delta value={variation(categoriesUsed, prevCategoriesUsed)} />,
    },
    {
      icon: TrendingUp,
      tone: "bg-destructive/10 text-destructive",
      label: t("Mayor salida de dinero"),
      hint: biggest ? biggest.name : "—",
      value: biggest ? formatCOP(biggest.amount) : formatCOP(0),
      delta: biggest ? (
        <span className="text-muted-foreground">{t("{pct}% del total", { pct: pct(biggest.amount) })}</span>
      ) : null,
    },
    {
      icon: Wallet,
      tone: "bg-success/10 text-success",
      label: t("Disponible del mes"),
      hint: t("Ingresos − salidas"),
      value: formatCOP(available),
      delta: <Delta value={variation(available, prevAvailable)} invert />,
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden">
      {/* Encabezado */}
      <div className="flex flex-nowrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold tracking-tight">{t("Reportes")}</h2>
          <p className="text-sm text-muted-foreground">{t("Analiza tus finanzas con claridad")}</p>
        </div>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="shrink-0 gap-1.5 whitespace-nowrap">
              <Download className="h-4 w-4" /> {t("Exportar")} <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" sideOffset={6} className="z-50">
            <DropdownMenuItem onClick={exportPdf}>{t("Exportar PDF")}</DropdownMenuItem>
            <DropdownMenuItem onClick={exportExcel}>{t("Exportar Excel")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filtros: slider táctil/arrastrable en celular, fila fija en desktop */}
      <Card className="rounded-2xl border shadow-soft">
        <CardContent className="flex flex-col gap-3 overflow-hidden p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex h-6 items-center gap-2 text-sm font-medium">
            <CalendarRange className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate capitalize">{periodLabel}</span>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:items-end">
            <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:justify-end">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={cn(
                    "min-w-0 rounded-full px-2.5 py-2 text-center text-[11px] font-medium leading-tight transition-colors sm:whitespace-nowrap sm:px-3.5 sm:text-xs",

                    period === p.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
                  )}
                >
                  {t(p.label)}
                </button>
              ))}
            </div>
            <div className="flex w-full justify-center sm:justify-end">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setPeriod("custom");
                      window.setTimeout(() => setCalendarOpen(true), 350);
                    }}
                    className={cn(
                      "whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-medium transition-colors",
                      period === "custom" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
                    )}
                  >
                    {t("Personalizado")}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto p-0">
                  <Calendar
                    mode="range"
                    selected={{ from: range.from, to: range.to }}
                    onSelect={(r: any) => {
                      setRange({ from: r?.from, to: r?.to });
                      if (r?.from) setPeriod("custom");
                    }}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Resumen: mismo espacio siempre, skeleton interno al cargar */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="min-w-0 rounded-2xl border shadow-soft">
              <CardContent className="space-y-1.5 p-3.5">
                <div className="flex items-start gap-2">
                  <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", c.tone)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium leading-tight">{c.label}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{c.hint}</p>
                  </div>
                </div>
                {loading ? (
                  <>
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </>
                ) : (
                  <>
                    <p className="truncate text-lg font-semibold tracking-tight">{c.value}</p>
                    <div className="text-[11px]">{c.delta}</div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Distribución + comparación (estructura estable) */}
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="min-w-0 rounded-2xl border shadow-soft">
          <CardContent className="space-y-3 p-4">
            <h3 className="font-display text-base font-semibold">{t("Distribución de gastos")}</h3>
            {loading ? (
              <div className="grid min-w-0 grid-cols-1 items-center gap-3 sm:grid-cols-[200px_1fr]">
                <Skeleton className="mx-auto h-[190px] w-[190px] rounded-full" />
                <div className="space-y-2">
                  {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-4 w-full" />)}
                </div>
              </div>
            ) : totals.length === 0 ? (
              <div className="flex h-[190px] items-center justify-center text-center text-sm text-muted-foreground">
                {t("No hay movimientos en el período seleccionado")}
              </div>
            ) : (
              <>
                <div className="grid min-w-0 grid-cols-1 items-center gap-3 sm:grid-cols-[200px_1fr]">
                  <div className="relative mx-auto h-[190px] w-full max-w-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="amount"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={58}
                          outerRadius={88}
                          paddingAngle={2}
                          stroke="none"
                          isAnimationActive={false}
                        >
                          {chartData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }: any) =>
                            active && payload?.[0] ? (
                              <div className="rounded-lg border bg-card p-2 text-xs shadow-lg">
                                <p className="font-semibold">{payload[0].payload.name}</p>
                                <p>{formatCOP(payload[0].value)}</p>
                              </div>
                            ) : null
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[11px] text-muted-foreground">{t("Total")}</span>
                      <span className="text-sm font-semibold">{formatCOP(totalOut)}</span>
                    </div>
                  </div>

                  <ul className="min-w-0 space-y-1.5">
                    {chartData.map((c, i) => (
                      <li key={`${c.type}-${c.name}`} className="flex min-w-0 items-center gap-2 text-xs">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="min-w-0 flex-1 truncate">{c.name}</span>
                        <TypeBadge type={c.type} />
                        <span className="shrink-0 font-medium tabular-nums">{formatCOP(c.amount)}</span>
                        <span className="w-8 shrink-0 text-right text-muted-foreground tabular-nums">{pct(c.amount)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full text-primary">
                      {t("Ver detalle por categoría")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="responsive-dialog max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{t("Detalle por categoría")}</DialogTitle>
                    </DialogHeader>
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-card text-xs text-muted-foreground">
                          <tr>
                            <th className="py-2 text-left font-medium">{t("Concepto")}</th>
                            <th className="py-2 text-left font-medium">{t("Tipo")}</th>
                            <th className="py-2 text-right font-medium">{t("Valor")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {totals.map((c) => (
                            <tr key={`${c.type}-${c.name}`} className="border-t border-border/60">
                              <td className="max-w-[45vw] truncate py-2 pr-2">{c.name}</td>
                              <td className="py-2 pr-2"><TypeBadge type={c.type} /></td>
                              <td className="py-2 text-right tabular-nums">{formatCOP(c.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </CardContent>
        </Card>

        {/* Comparación */}
        <Card className="min-w-0 rounded-2xl border shadow-soft">
          <CardContent className="space-y-3 p-4">
            <div className="flex min-w-0 flex-nowrap items-center justify-between gap-2">
              <h3 className="font-display text-base font-semibold">{t("Comparación por categoría")}</h3>
              <div className="flex items-center gap-1 rounded-full bg-muted p-0.5 text-xs">
                {(["monto", "porcentaje"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setCompareBy(m)}
                    className={cn(
                      "rounded-full px-2.5 py-1 font-medium transition-colors",
                      compareBy === m ? "bg-card text-foreground shadow-soft" : "text-muted-foreground",
                    )}
                  >
                    {m === "monto" ? t("Monto") : t("Porcentaje")}
                  </button>
                ))}
              </div>
            </div>
            {prevLabel && (
              <p className="text-[11px] text-muted-foreground">
                {t("Comparado con")} <span className="capitalize">{prevLabel}</span>
              </p>
            )}

            {loading ? (
              <div className="space-y-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-2 w-4/5" />
                  </div>
                ))}
              </div>
            ) : totals.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-center text-sm text-muted-foreground">
                {t("No hay movimientos en el período seleccionado")}
              </div>
            ) : (
              <>
                <ul className="space-y-3">
                  {(showAll ? totals : totals.slice(0, 5)).map((c) => (
                    <CompareRow key={`${c.type}-${c.name}`} item={c} max={totals[0].amount} total={totalOut} mode={compareBy} />
                  ))}
                </ul>
                {totals.length > 5 && (
                  <Button variant="ghost" size="sm" className="w-full text-primary" onClick={() => setShowAll((v) => !v)}>
                    {showAll ? t("Ver menos") : t("Ver todas las categorías")}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights IA */}
      <Card className="rounded-2xl border border-primary/20 bg-primary/5 shadow-soft">
        <CardContent className="flex min-w-0 items-start gap-3 p-4">
          <Mascot mood={mood as any} className="hidden h-16 w-16 shrink-0 sm:block" />
          <div className="min-w-0 flex-1 space-y-2">
            <h3 className="font-display text-base font-semibold">{t("Insights IA")}</h3>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ) : (
              <ul className="space-y-1.5">
                {insights.map((i) => (
                  <li key={i} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="min-w-0">{i}</span>
                  </li>
                ))}
                {insights.length === 0 && (
                  <li className="text-xs text-muted-foreground">{t("Registra movimientos para ver recomendaciones")}</li>
                )}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CompareRow({
  item, max, total, mode,
}: { item: CategoryTotal; max: number; total: number; mode: "monto" | "porcentaje" }) {
  const t = useT();
  const width = max > 0 ? (item.amount / max) * 100 : 0;
  const prevWidth = max > 0 ? (item.prev / max) * 100 : 0;
  const share = total > 0 ? Math.round((item.amount / total) * 100) : 0;
  const prevShare = item.prev > 0 && max > 0 ? Math.round((item.prev / max) * 100) : 0;

  return (
    <li className="min-w-0 space-y-1.5">
      <div className="flex min-w-0 items-center gap-2 text-xs">
        <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
        <TypeBadge type={item.type} />
        <Delta value={variation(item.amount, item.prev)} />
      </div>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="h-2 rounded-full bg-muted">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(width, 2)}%` }} />
          </div>
          <div className="h-2 rounded-full bg-muted/60">
            <div className="h-2 rounded-full bg-muted-foreground/30" style={{ width: `${Math.max(prevWidth, 1)}%` }} />
          </div>
        </div>
        <div className="w-20 shrink-0 text-right text-[11px] tabular-nums sm:w-24">
          <p className="font-medium">{mode === "monto" ? formatCOP(item.amount) : `${share}%`}</p>
          <p className="text-muted-foreground">
            {mode === "monto"
              ? item.prev > 0 ? formatCOP(item.prev) : t("Sin dato")
              : item.prev > 0 ? `${prevShare}%` : t("Sin dato")}
          </p>
        </div>
      </div>
    </li>
  );
}
