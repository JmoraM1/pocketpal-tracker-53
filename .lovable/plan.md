# Corrección responsive global (320–430 px)

Objetivo: misma composición visual en todos los anchos de móvil. Sin cambios de lógica, textos, colores ni diseño; solo reglas de layout.

## Causa raíz

Las barras de acciones y filtros usan `flex flex-wrap ... justify-between`. Con `flex-wrap`, el punto exacto de salto depende del ancho del dispositivo y del largo del texto: en 430 px todo entra en una línea (y `justify-between` empuja el botón al extremo derecho), en 360 px salta a la segunda línea y cambia de posición. Eso es lo que hace que "+ Nuevo" y los filtros de Reportes se vean distintos en cada celular. A esto se suman botones con `min-w-[160px]` y grids de 2 columnas que comprimen texto en pantallas angostas.

## Cambios por pantalla

**Regla general (mobile-first determinista)**
- Sustituir `flex-wrap + justify-between` por apilado explícito: columna en móvil, fila con `justify-between` desde `sm:`. Así la posición no depende del texto ni del modelo.
- Botones de acción a ancho completo en móvil (`w-full sm:w-auto`), altura táctil consistente.
- Quitar/relajar anchos mínimos fijos (`min-w-[160px]` en el selector de mes) por `w-full sm:min-w-[160px]`.
- Añadir `min-w-0` + `truncate` donde falte, para evitar overflow horizontal.

**Gastos (`ExpenseList.tsx`)**
- Barra superior: filtros (Todos/Pendientes/Pagados) en una fila propia con scroll horizontal contenido; "+ Nuevo" siempre debajo, a ancho completo en móvil y a la derecha desde `sm:`. Posición fija en 320–430 px.
- Tarjeta de gasto: fila de importe con `shrink-0` y título con `min-w-0 truncate`; fila de acciones con separación estable.
- Formulario: el grid `sm:grid-cols-2` (fecha/frecuencia) ya apila en móvil; se fija ancho completo de los controles.

**Reportes (`ReportsView.tsx`)**
- Cabecera (título + Exportar): columna en móvil, fila desde `sm:`.
- Filtros de período: fila superior de 3 en grid uniforme y "Personalizado" centrado debajo, sin depender del wrap (se conserva el comportamiento actual verde + calendario diferido).
- Tarjetas de resumen: `grid-cols-2` con `min-w-0`, altura consistente y truncado de subtítulos para que no se compriman ni desalineen.
- Gráficas: contenedores con alto fijo y `w-full min-w-0`; leyendas con truncado.

**Nueva meta / Nuevo ahorro / Nueva deuda (`SavingsModule.tsx`, `InstallmentTracker.tsx`)**
- Diálogos: usar la clase responsive de diálogo ya existente en el proyecto con ancho `w-[calc(100vw-2rem)] sm:max-w-lg`, para que no queden estrechos.
- Cabeceras de tarjeta (`flex-row justify-between`): apilar en móvil y alinear desde `sm:`.
- Campos y botones del formulario a ancho completo; filas de aportes con `min-w-0` + `truncate` en el nombre y `shrink-0` en el importe.
- Cronograma de cuotas: filas con misma estructura, sin desbordes.

**Global**
- Verificar que ningún contenedor genere scroll horizontal en 320 px (contenedor principal y sliders con `overflow-x-hidden` donde aplique).

## Verificación

Capturas con Playwright a 320, 360, 390 y 430 px de: Gastos, Reportes, Nueva meta, Nuevo ahorro y Nueva deuda, comprobando misma posición relativa de cada elemento y ausencia de scroll horizontal.

## Fuera de alcance

Lógica, backend, navegación, textos, colores y jerarquía visual actual se mantienen intactos.
