# Responsive canónico global (una sola app en todos los celulares)

Objetivo: que entre 320 y 430 px la app se vea exactamente igual en composición — solo escalada — tomando la versión oscura actual como referencia canónica. Sin cambios de lógica, textos, colores ni diseño.

## Causa raíz

Hoy el layout móvil es "elástico": el ancho sobrante se reparte con `flex-wrap`, `justify-between`, `flex-1` y anchos fijos en píxeles. Con eso, unos pocos píxeles de diferencia cambian dónde salta una línea, si un botón queda compacto o a ancho completo, y cuánto se comprime un texto. Por eso "Categorías", "+ Nuevo", los filtros de Reportes y los títulos se ven distintos en cada celular.

Solución de sistema (no pantalla por pantalla): fijar un **ancho canónico móvil de 390 px** y escalar proporcionalmente todo lo demás, en lugar de re-repartir el espacio.

## Cambios

**1. Escalado proporcional global (la corrección de raíz)**

- En `index.css`, escalar el tamaño de fuente raíz con el ancho del viewport dentro del rango móvil: `font-size: clamp(14.2px, 4.1vw, 17.6px)` hasta 640 px, valor fijo desde ahí.
- Como Tailwind expresa espaciados, radios y tipografías en `rem`, todos los márgenes, gaps, paddings, alturas de botón y tamaños de texto pasan a escalar juntos. Resultado: 320, 360, 375, 390, 412 y 430 px muestran la misma composición, con la misma proporción, solo más grande o más pequeña.
- Utilidad `.app-shell` para el contenedor principal: padding lateral en `rem` (no en `%`), `min-w-0` y `overflow-x: hidden`.

**2. Reglas globales de composición**

- Eliminar `flex-wrap` en barras de acciones y filtros (Reportes, Gastos, Deudas, tarjetas de aportes). Se sustituye por filas de estructura fija.
- Prohibir en el rango móvil el patrón "compacto ↔ ancho completo": los botones de acción (`Categorías`, `+ Nuevo`, `Exportar`, `Nueva meta/ahorro/deuda`) mantienen la misma altura, padding relativo y `whitespace-nowrap` en todos los anchos.
- Cuando algo no cabe: scroll horizontal contenido (`overflow-x-auto` + `scrollbar-none` + `shrink-0` en los hijos), nunca salto de línea ni cambio de estructura.
- `min-w-0` + `truncate` en todo título/etiqueta dentro de una fila flexible, para que el texto se recorte en vez de empujar el layout.

**3. Aplicación por componente (misma regla, sin excepciones)**

- `Dashboard.tsx`: selector de mes y `Categorías` en una estructura fija; `Categorías` conserva tamaño compacto en todos los anchos.
- `ExpenseList.tsx`: fila única `filtros + Nuevo`, filtros con scroll contenido, botón con ancho intrínseco fijo.
- `ReportsView.tsx`: cabecera título/Exportar en fila fija; filtros de período en grilla 3 + "Personalizado" centrado debajo (composición idéntica en todos los anchos, sin recalcularse por wrap); tarjetas resumen en `grid-cols-2` con altura y truncado consistentes; gráficas con alto en `rem`.
- `SavingsModule.tsx` e `InstallmentTracker.tsx`: cabeceras de tarjeta con estructura fija, filas de aportes/cuotas con `min-w-0`/`shrink-0`, diálogos con ancho `calc(100vw - 2rem)`.
- `CategoryManager.tsx`: chips de categoría con scroll contenido en lugar de `flex-wrap`.

## Detalles técnicos

- Ningún cambio nuevo de breakpoint por dispositivo: se usa solo el umbral existente `sm` (640 px) para separar móvil de escritorio.
- Se retiran los anchos fijos en `px` dentro de filas móviles (`w-20`, `w-32`, `min-w-[160px]`) y se pasan a unidades `rem` o `ch`.
- El escalado con `clamp` no afecta al modo claro/oscuro: los temas solo cambian color.

## Validación

Capturas con Playwright a 320, 360, 375, 390, 412 y 430 px en Inicio, Gastos, Reportes, Metas, Ahorros y Deudas, comparando posición relativa de cada elemento y verificando ausencia de scroll horizontal.

## Fuera de alcance

Lógica, backend, navegación, textos, colores y jerarquía visual actual.
