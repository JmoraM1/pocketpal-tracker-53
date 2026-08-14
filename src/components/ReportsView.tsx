import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Mascot } from "@/components/Mascot";
import { formatCOP, formatMonthLabel } from "@/lib/constants";
import { formatCompactNumber } from "@/lib/currency";
import { useT } from "@/lib/i18n";
import { useReports, type ReportPeriodId, type CategoryTotal } from "@/hooks/useReports";
import { cn } from "@/lib/utils";

const COLORS = [
  "hsl(var(--primary))", "hsl(160 60% 45%)", "hsl(38 92% 55%)", "hsl(220 80% 58%)",
  "hsl(340 70% 58%)", "hsl(280 60% 60%)", "hsl(15 85% 58%)", "hsl(190 70% 45%)",
  "hsl(100 45% 48%)", "hsl(60 60% 45%)",
];

const PERIODS: { id: ReportPeriodId; label: string }[] = [
  { id: "current", label: "Este mes" },
  { id: "previous", label: "Mes anterior" },
  { id: "last3", label: "Últimos 3 meses" },
  { id: "custom", label: "Personalizado" },
];

function variation(current: number, prev: number): number | null {
  if (!prev) return current > 0 ? null : 0;
  return ((current - prev) / prev) * 100;
}

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
    else if (available > 0 && out.length < 4) out.push(t("Te quedaron {value} disponibles: destina una parte al ahorro.", { value: formatCOP(available) }));
    return out.slice(0, 4);
  }, [income, committed, biggest, totalOut, prevTotalOut, available, t]);

  const mood = committed > 100 ? "excedido" : committed > 85 ? "limite" : committed > 65 ? "atencion" : "bien";

  /* ---------------- Export ---------------- */
  const exportCsv = () => {
    const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const rows = [
      [t("Período"), t("Concepto"), t("Tipo"), t("Valor"), "%"],
      ...totals.map((c) => [periodLabel, c.name, c.type === "deuda" ? t("Deuda") : t("Gasto"), String(c.amount), `${pct(c.amount)}%`]),
      [periodLabel, t("Gastos totales"), "", String(totalOut), ""],
      [periodLabel, t("Disponible del mes"), "", String(available), ""],
    ];
    const blob = new Blob(["\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Reporte_${months[0] ?? ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const rows = totals
      .map(
        (c) => `<tr><td>${c.name}</td><td>${c.type === "deuda" ? t("Deuda") : t("Gasto")}</td>
        <td class="r">${formatCOP(c.amount)}</td><td class="r">${pct(c.amount)}%</td></tr>`,
      )
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${t("Reportes")} — ${periodLabel}</title>
      <style>
        body{font-family:system-ui,-apple-system,sans-serif;color:#0f172a;padding:28px;}
        h1{font-size:20px;margin:0} p.sub{color:#64748b;margin:4px 0 18px;font-size:12px}
        .cards{display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap}
        .card{border:1px solid #e2e8f0;border-radius:10px;padding:10px 14px;min-width:150px}
        .card span{display:block;font-size:11px;color:#64748b} .card b{font-size:15px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{border-bottom:1px solid #e2e8f0;padding:6px 8px;text-align:left}
        th{background:#f8fafc} .r{text-align:right}
      </style></head><body>
      <h1>${t("Reportes")}</h1><p class="sub">${periodLabel}</p>
      <div class="cards">
        <div class="card"><span>${t("Gastos totales")}</span><b>${formatCOP(totalOut)}</b></div>
        <div class="card"><span>${t("Categorías usadas")}</span><b>${categoriesUsed}</b></div>
        <div class="card"><span>${t("Mayor salida de dinero")}</span><b>${biggest ? `${biggest.name} · ${formatCOP(biggest.amount)}` : "—"}</b></div>
        <div class="card"><span>${t("Disponible del mes")}</span><b>${formatCOP(available)}</b></div>
      </div>
      <table><thead><tr><th>${t("Concepto")}</th><th>${t("Tipo")}</th><th class="r">${t("Valor")}</th><th class="r">%</th></tr></thead>
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
      }, 250);
    }
  };

  /* ---------------- UI ---------------- */
  const cards = [
    {
      icon: Receipt,
      tone: "bg-primary/10 text-primary",
      label: t("Gastos totales"),
      hint: t("Gastos + deudas"),
      value: formatCOP(totalOut),
      delta: <Delta value={variation(totalOut, prevTotalOut)} />,
    },
    {
      icon: Layers,
      tone: "bg-secondary/60 text-foreground",
      label: t("Categorías usadas"),
      hint: t("Conceptos con movimiento"),
      value: String(categoriesUsed),
      delta: <Delta value={variation(categoriesUsed, prevCategoriesUsed)} invert />,
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
    <div className="w-full min-w-0 space-y-4">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold tracking-tight">{t("Reportes")}</h2>
          <p className="text-sm text-muted-foreground">{t("Analiza tus finanzas con claridad")}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Download className="h-4 w-4" /> {t("Exportar")} <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportPdf}>{t("Exportar PDF")}</DropdownMenuItem>
            <DropdownMenuItem onClick={exportCsv}>{t("Exportar CSV")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filtros */}
      <Card className="rounded-2xl border shadow-soft">
        <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarRange className="h-4 w-4 text-primary" />
            <span className="truncate capitalize">{periodLabel}</span>
          </div>
          <div className="-mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 pb-0.5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {PERIODS.map((p) =>
              p.id === "custom" ? (
                <Popover key={p.id}>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "shrink-0 snap-start rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        period === "custom" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
                      )}
                    >
                      {t(p.label)}
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
              ) : (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={cn(
                    "shrink-0 snap-start rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    period === p.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
                  )}
                >
                  {t(p.label)}
                </button>
              ),
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
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
                <p className="truncate text-lg font-semibold tracking-tight">{c.value}</p>
                <div className="text-[11px]">{c.delta}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {loading && <p className="text-sm text-muted-foreground">{t("Cargando...")}</p>}

      {!loading && totals.length === 0 && (
        <Card className="rounded-2xl border shadow-soft">
          <CardContent className="flex h-40 items-center justify-center px-6 text-center text-sm text-muted-foreground">
            {t("No hay movimientos en el período seleccionado")}
          </CardContent>
        </Card>
      )}

      {!loading && totals.length > 0 && (
        <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Distribución */}
          <Card className="min-w-0 rounded-2xl border shadow-soft">
            <CardContent className="space-y-3 p-4">
              <h3 className="font-display text-base font-semibold">{t("Distribución de gastos")}</h3>
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
            </CardContent>
          </Card>

          {/* Comparación */}
          <Card className="min-w-0 rounded-2xl border shadow-soft">
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
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
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights IA */}
      {!loading && (
        <Card className="rounded-2xl border border-primary/20 bg-primary/5 shadow-soft">
          <CardContent className="flex min-w-0 items-start gap-3 p-4">
            <Mascot mood={mood as any} className="hidden h-16 w-16 shrink-0 sm:block" />
            <div className="min-w-0 flex-1 space-y-2">
              <h3 className="font-display text-base font-semibold">{t("Insights IA")}</h3>
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
            </div>
          </CardContent>
        </Card>
      )}
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
          <p className="font-medium">
            {mode === "monto" ? formatCOP(item.amount) : `${share}%`}
          </p>
          <p className="text-muted-foreground">
            {mode === "monto"
              ? item.prev > 0 ? formatCOP(item.prev) : t("Sin dato")
              : `${total > 0 ? formatCompactNumber(item.amount) : 0}`}
          </p>
        </div>
      </div>
    </li>
  );
}
