# Mejoras de Inicio, ingresos adicionales y UX móvil

## 1. Ingresos adicionales

Nueva tabla `additional_incomes` (nombre, valor, mes, indicador de "fijo/recurrente", moneda), protegida para que cada usuario solo vea y edite los suyos.

- Cada ingreso adicional se crea con una opción **"Repetir todos los meses"** (el usuario decide): si está activa aparece en todos los meses desde su creación; si no, solo en el mes en que se registró.
- Se elimina el botón "Editar ingreso" de la cabecera de Inicio.
- La tarjeta **Ingresos** abre un modal compacto con:
  - Salario (ingreso principal) con su valor actual y edición inline — misma lógica actual de guardado del salario, sin cambios.
  - Lista de ingresos adicionales del mes con editar (nombre/valor), marcar recurrente y eliminar con confirmación.
  - Botón "+ Agregar ingreso" (nombre + valor, con formato COP en vivo).
- La tarjeta Ingresos muestra el **total** (salario + adicionales) y se actualiza al instante al crear/editar/eliminar.
- Ese total pasa a ser el ingreso usado en Disponible, porcentajes, gráfica y actividad reciente, sin tocar la lógica del salario ni el resto de cálculos.

## 2. Slider de resumen en móvil

- En móvil las 4 tarjetas (Ingresos, Disponible, Gastos, Deudas) pasan a un carrusel horizontal con scroll táctil, scroll-snap por tarjeta, e indicadores de puntos. Se puede avanzar y retroceder libremente.
- Cada tarjeta ocupa ~85% del ancho, sin texto cortado; el subtexto se resume a frases concretas: "70% del ingreso", "30% disponible", "2 cuotas".
- En desktop (md+) se mantiene exactamente la rejilla de 4 tarjetas actual.

## 3. Inicio

- "Acciones rápidas" se oculta solo en móvil; en desktop queda igual.
- Evolución, Gastos por categoría, Actividad reciente, calendario y "Copiar mes anterior" quedan sin cambios.

## 4. Botón "+" móvil

- El FAB muestra únicamente **Nueva deuda** y **Nuevo ahorro**.

## 5. Desktop

- El FAB se oculta por completo en desktop (queda solo en móvil). Sidebar, tarjetas y estructura sin cambios.

## 6. Formularios responsive

- Revisión de los modales de Gastos, Deudas, Metas y Ahorros: altura máxima según viewport visible, scroll interno estable, sin saltos al abrir el teclado (posición fija anclada, sin reflow brusco), y campos inferiores siempre alcanzables. Validación con teclado abierto y cerrado en varios tamaños.

## 7. Campos de fecha

- Al elegir un día en el calendario, el valor se aplica y el popover se cierra de inmediato; volver a abrir el campo permite cambiar la fecha. Aplica a Gastos (fecha de vencimiento) y a la fecha de primera cuota en Deudas (se cambia el input nativo por el mismo selector de calendario, consistente).

## 8. Insights IA

- Se mantiene el personaje y la sección. El mensaje principal sigue mostrando el % de ingresos comprometidos, y debajo se añaden **máximo 3 datos cortos** calculados con datos reales del mes:
  - Variación de gastos frente al mes anterior (+/- %).
  - Categoría con mayor aumento o mayor peso del mes.
  - Una recomendación puntual (por ejemplo, cuotas que consumen X% del ingreso o categoría optimizable).
- Sin llamadas externas ni relleno de mensajes genéricos: si no hay datos suficientes, esos insights simplemente no aparecen.

## Detalles técnicos

- Migración: tabla `additional_incomes` (`user_id`, `name`, `amount`, `month` date, `is_recurring` boolean, `currency`, timestamps) con RLS por `auth.uid()`, GRANTs a `authenticated`/`service_role` y trigger de `updated_at`.
- Nuevo hook `useAdditionalIncomes(userId, selectedMonth)` (carga por mes o recurrentes, CRUD optimista).
- Nuevo componente `IncomeDialog` reutilizando `MoneyInput` y `AlertDialog` de confirmación.
- `Dashboard.tsx`: quita `IncomeEditor` de la cabecera, calcula `totalIncome = salario + adicionales` y lo pasa a `HomeView`, export y cálculos existentes.
- `HomeView.tsx`: extrae las 4 tarjetas a un componente con variante carrusel (`overflow-x-auto snap-x`) en móvil y grid en desktop; "Acciones rápidas" con `hidden md:block`.
- `QuickAddFab.tsx`: acciones reducidas a debts/savings y contenedor con `md:hidden`.
- Fechas: `Popover` controlado con cierre en `onSelect`; en `InstallmentTracker` se sustituye `input type="date"` por el `Calendar`.
- `SmartMessage.tsx` recibe métricas derivadas (mes anterior, categorías) y renderiza hasta 3 chips de insight.
