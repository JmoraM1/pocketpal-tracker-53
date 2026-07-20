# Rediseño Frontend — Estructura por pantallas

Solo cambios de UI/UX. La lógica, hooks (`useBudget`, `useSavings`, `useInstallments`, `useCategories`), Supabase y nombres de variables se mantienen intactos.

## Nueva navegación

Bottom navigation fija (móvil) + sidebar/tabs en desktop, con 5 secciones:

| Sección | Contenido |
|---|---|
| **Inicio** | Selector de mes, `SummaryCards` (compactadas 2×2 en móvil), resumen visual (donut ingreso vs gasto vs ahorro), accesos rápidos (Nueva meta, Nuevo gasto, Ver deudas, Categorías) |
| **Metas** | `SavingsModule` completo (pestañas Metas / Ahorros / Deudas ya existente) — se mantiene tal cual |
| **Gastos** | Solo `ExpenseList` + `IncomeEditor` del mes seleccionado |
| **Deudas** | Solo `InstallmentTracker` (préstamos + cuotas del mes) |
| **Más** | Categorías (`CategoryManager`), Exportar (`ExportButton`), Registrar biometría, Cerrar sesión, info del usuario |

Se omite Soporte, Reportes y Presupuestos (no existen en la lógica actual — no inventar).

## Estructura de archivos

Nuevos:
- `src/components/BottomNav.tsx` — navegación inferior con 5 tabs e íconos lucide (Home, Target, Receipt, CreditCard, Menu)
- `src/components/AppShell.tsx` — layout con header sticky + `<Outlet/>` + `<BottomNav/>`, padding-bottom para no tapar contenido
- `src/pages/app/Home.tsx` — dashboard resumen + donut (recharts ya instalado)
- `src/pages/app/Goals.tsx` — envuelve `SavingsModule`
- `src/pages/app/Expenses.tsx` — envuelve `ExpenseList` + `IncomeEditor`
- `src/pages/app/Debts.tsx` — envuelve `InstallmentTracker`
- `src/pages/app/More.tsx` — acciones secundarias

Modificados:
- `src/App.tsx` — añadir rutas hijas bajo `/` protegidas por auth: `/`, `/metas`, `/gastos`, `/deudas`, `/mas`
- `src/pages/Index.tsx` — si no hay user → `<Auth/>`; si hay user → `<AppShell/>` con outlet
- `src/pages/Dashboard.tsx` — se convierte en el shell (o se retira; su contenido se reparte en las nuevas pantallas)
- `src/components/SummaryCards.tsx` — ajustar a grid `grid-cols-2 lg:grid-cols-4`, tarjetas más compactas para móvil

Contexto compartido: para evitar re-fetch por pantalla, elevar `selectedMonth` + hooks (`useBudget`, `useInstallments`, `useCategories`) al `AppShell` y pasarlos vía React Context (`FinanceContext`). Las pantallas consumen del contexto — sin tocar la lógica interna de los hooks.

## Estilo visual

- Fondo `bg-muted/30`, tarjetas `bg-card` con `rounded-2xl shadow-sm border`
- Íconos en cajas suaves de color (`bg-primary/10`, `bg-success/10`, etc.), consistentes
- Tipografía: números grandes `text-2xl font-bold tracking-tight`, labels `text-xs text-muted-foreground`
- Espaciado generoso `p-5 gap-4`, headers de pantalla con título + acción principal (botón `+` circular)
- Donut en Home con recharts (`PieChart` — ya usado en el proyecto)
- Bottom nav: `fixed bottom-0 inset-x-0 border-t bg-card/95 backdrop-blur h-16`, ítem activo con color primary + indicador
- Desktop (`md+`): bottom nav se oculta, aparece top-nav horizontal con las mismas 5 secciones

## Fuera de alcance

- No se modifica lógica de negocio, queries, migraciones ni tipos
- No se cambia el diseño del login (`Auth.tsx`)
- No se añaden secciones sin backend (Reportes, Presupuestos, Soporte, Configuración avanzada)
