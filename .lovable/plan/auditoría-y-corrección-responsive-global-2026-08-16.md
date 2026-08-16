# Auditoría y corrección responsive global

## 1. Causas raíz encontradas

1. **No existe un sistema de layout compartido.** Cada módulo define su propia cabecera, chips de filtro, botones y tarjetas con valores distintos (`p-3` vs `p-5 sm:p-6`, `text-[11px]` vs `text-xs`, `gap-2` vs `gap-3`). 133 apariciones de tamaños ad-hoc en `src/components`.
2. **La composición depende del contenido, no de una regla.** Filas con `justify-between` + `flex-1` reparten el espacio sobrante de forma distinta en 360 y 390 px, por lo que "Categorías", "+ Nuevo", "Exportar" y "+ Nueva Deuda" cambian de ancho y posición.
3. **Breakpoint mal elegido.** Se usa `sm:` (640 px) para diferenciar "móvil vs no móvil", pero TODOS los teléfonos objetivo (320–430) caen por debajo. El rango crítico queda sin reglas, gobernado por el navegador.
4. **Anchos intrínsecos sueltos:** `sm:min-w-[160px]`, `w-20`, `w-16`, `grid-cols-[200px_1fr]` mezclados con contenido elástico → alturas y alineaciones incoherentes entre tarjetas equivalentes.
5. **Wrapping accidental:** todavía hay `flex-wrap` y grids (`grid-cols-3`) que comprimen texto hasta romper la composición en 320 px.
6. **Tipografía sin escala fija:** títulos con `text-2xl sm:text-3xl` y subtítulos sin `truncate`/`line-clamp` consistente, por lo que el corte de texto varía por dispositivo.

## 2. Componentes afectados

`Dashboard.tsx`, `HomeView.tsx`, `ExpenseList.tsx`, `CategoryManager.tsx`, `ReportsView.tsx`, `SavingsModule.tsx`, `InstallmentTracker.tsx`, `MonthSelector.tsx`, `SummaryCards.tsx`, `ExpenseCharts.tsx`, `ExportButton.tsx`, `IncomeDialog.tsx`, `SettingsView.tsx`, `BottomNav.tsx`, `QuickAddFab.tsx`, y los primitivos `ui/dialog`, `ui/alert-dialog`, `ui/button`, `ui/input`, `ui/card`.

## 3. Estrategia global (una sola capa de reglas)

Se añade en `src/index.css` una capa canónica basada en el modo oscuro actual, y todos los módulos pasan a consumirla. Nada de arreglos por pantalla.

Clases nuevas:

```text
.app-section      contenedor de bloque: ancho 100%, min-w-0, gap vertical fijo
.section-head     cabecera: título + acción, fila fija, sin wrap, título truncado
.section-title    tipografía fija de título de módulo (no escala con el ancho)
.section-sub      subtítulo: tamaño fijo + line-clamp-2
.chip-row         fila de filtros: hscroll contenido, sin wrap, sin barra
.chip             filtro/badge: altura, padding, radio y texto fijos
.btn-compact      botón de acción: misma altura, padding y texto en todo el app
.card-std         tarjeta: padding, radio, borde y gap idénticos
.row-item         fila de lista: icono fijo + contenido min-w-0 truncado + valor shrink-0
.field-row        inputs de formulario/modal con altura y gap uniformes
```

Reglas de aplicación:

- Prohibido en móvil: `flex-wrap`, `w-full` en botones de acción, anchos en px sueltos.
- Cuando algo no cabe: truncamiento controlado (texto) o scroll horizontal contenido (grupos de chips). Nunca wrapping.
- Un único breakpoint estructural: `md` (escritorio). Entre 320 y 430 px no hay cambios de estructura.
- Tipografía y espaciados desde la escala canónica; sin `text-[11px]` sueltos.
- Tema claro y oscuro comparten exactamente las mismas reglas; solo cambian tokens de color.

## 4. Alcance de la corrección

Se reescribe únicamente el marcado de layout (clases) de los componentes listados para consumir la capa canónica. No se toca lógica, estado, hooks, backend, navegación, textos ni colores.

Resultado esperado, igual en 320–430 px: filtros y "+ Nuevo" con la misma proporción; "Categorías" compacto y fijo; los cuatro períodos de Reportes con la misma métrica; "Exportar" con tamaño relativo constante; Deudas con la misma estructura "Cuotas del mes" / "+ Nueva Deuda"; subtítulo de Ahorros siempre en dos líneas máximo; navegación inferior inmutable.

## 5. Validación

Script Playwright que recorre Inicio, Gastos, Reportes, Metas, Ahorros, Deudas, Configuración y un modal, en 320 / 360 / 375 / 390 / 412 / 430 px y en escritorio, en tema claro y oscuro. Se comprueba automáticamente:

- `scrollWidth === clientWidth` (cero overflow horizontal) en cada vista y ancho;
- alturas y paddings de botones/chips equivalentes idénticos entre anchos;
- ausencia de wrapping en filas marcadas como fijas;
- capturas comparativas por ancho para revisión visual.

## 6. Criterio de aceptación (no basta con las pantallas de ejemplo)

La implementación no se da por buena solo porque las pantallas revisadas se vean bien. Tras aplicar la capa global se hace un barrido completo del proyecto buscando:

`flex-wrap`, `justify-between`, `flex-1`, `w-full`, `min-w-*`, `max-w-*`, tamaños arbitrarios (`text-[..]`, `w-[..]`, `h-[..]`), `grid-cols-*` y reglas responsive duplicadas (`sm:`/`md:` repetidos por módulo).

- Todo caso encontrado que no use el sistema global se migra al sistema global.
- No se crean excepciones para una pantalla o un ancho concreto.
- Si aparece un problema en un módulo, se corrige la regla compartida responsable, nunca con un parche local.

IMPORTANTE: no interpretar "misma composición" como que todos los elementos deben tener exactamente los mismos píxeles en todos los dispositivos. La prioridad es mantener la misma estructura, proporciones, jerarquía, alineación y comportamiento. El contenido puede escalar o truncarse de forma controlada según el ancho disponible, pero nunca debe cambiar la composición por unos pocos píxeles de diferencia.