# Responsive canónico global — una sola aplicación en todos los celulares

## Objetivo

Lograr que entre 320 y 430 px la aplicación mantenga la misma composición visual de la versión oscura actual, que será la referencia canónica.

El viewport puede variar, pero NO debe cambiar arbitrariamente la estructura, proporciones, márgenes, tamaños relativos, alineaciones o flujo visual de los componentes.

NO modificar lógica, backend, navegación, textos, colores ni diseño visual.

## Causa raíz

El layout móvil actualmente depende demasiado de comportamientos elásticos como `flex-wrap`, `justify-between`, `flex-1`, anchos mínimos/fijos y grids que permiten que pocos píxeles adicionales o menos cambien la composición.

Esto provoca diferencias entre dispositivos:

- `Categorías` cambia de tamaño.
- `+ Nuevo` cambia de posición.
- Los filtros pueden quedar cortados o comprimidos.
- Los botones de Reportes cambian de tamaño.
- Los títulos se distribuyen diferente.
- Las tarjetas comprimen su contenido.
- Las gráficas pueden cambiar su posición.
- Los componentes de Nueva meta, Nuevo ahorro y Nueva deuda pueden quedar demasiado estrechos.

## Solución global

NO corregir pantalla por pantalla.

Auditar y corregir el SISTEMA RESPONSIVE GLOBAL y los componentes reutilizables para que toda la aplicación utilice las mismas reglas de layout.

La versión oscura actual debe considerarse el DISEÑO CANÓNICO.

El modo claro debe conservar exactamente la misma estructura y comportamiento; únicamente cambian los colores del tema.

## Regla principal

NO utilizar un ancho virtual fijo de 390 px.

NO modificar globalmente el `font-size` raíz mediante `vw` o `clamp()` para simular escalado.

NO hacer que toda la aplicación se comporte como un canvas de 390 px.

El objetivo es que cada viewport utilice su espacio real, pero mantenga la MISMA COMPOSICIÓN y SISTEMA DE DISEÑO.

El tamaño del viewport puede cambiar ligeramente el espacio disponible, pero NO debe provocar cambios arbitrarios de estructura.

## Reglas globales de layout

Revisar y corregir globalmente:

- `flex-wrap`
- `justify-between`
- `flex-1`
- `min-width`
- `max-width`
- `width`
- `grid`
- `gap`
- `padding`
- `margin`
- `overflow`
- `shrink`
- `truncate`
- `whitespace`
- posiciones absolutas
- breakpoints

Eliminar comportamientos donde el navegador decida accidentalmente la composición debido al espacio disponible.

Los componentes equivalentes deben conservar dimensiones, proporciones y alineación consistentes en toda la aplicación.

## Botones

Botones equivalentes deben mantener:

- misma altura;
- mismo padding;
- misma proporción;
- mismo tamaño de texto;
- misma alineación;
- mismo comportamiento.

Evitar que un botón pase automáticamente de compacto a `w-full` solamente porque cambió el ancho del dispositivo.

Especial atención a:

- `Categorías`
- `+ Nuevo`
- `Exportar`
- `Nueva meta`
- `Nuevo ahorro`
- `Nueva deuda`

Si un grupo de elementos no cabe, utilizar una estrategia controlada para ese componente, como scroll horizontal contenido cuando tenga sentido, en lugar de permitir wrapping impredecible.

## Filtros

Mantener la misma composición visual de:

- Todos
- Pendientes
- Pagados
- Este mes
- Últimos 3 meses
- Mes anterior
- Personalizado

No permitir que el tamaño de estos botones cambie arbitrariamente entre dispositivos.

No permitir que bordes, fondos o estados activos queden cortados.

## Tarjetas

Las tarjetas deben mantener:

- misma estructura;
- misma proporción;
- misma altura visual;
- mismos márgenes;
- mismos gaps;
- misma alineación interna.

Usar `min-w-0`, `shrink-0` y `truncate` donde corresponda para evitar que los textos empujen o deformen el layout.

No comprimir los textos hasta alterar la composición visual.

## Reportes

Mantener la composición actual de la versión oscura:

- selector de mes;
- título;
- subtítulo;
- Exportar;
- filtros de período;
- tarjetas de resumen;
- gráficas.

Las tarjetas de resumen deben permanecer en la misma estructura de dos columnas cuando el viewport móvil lo permita, manteniendo proporciones y alturas consistentes.

Los contenedores de las gráficas deben permanecer alineados con los mismos márgenes y ancho disponible que las tarjetas.

## Gastos

Mantener la composición actual de la versión oscura:

- selector de mes;
- Categorías;
- Todos / Pendientes / Pagados;
- &nbsp;

- Nuevo;

- tarjetas de gastos;
- acciones.

`Categorías` debe conservar su tamaño compacto y NO convertirse arbitrariamente en un botón de ancho completo.

Los filtros y `+ Nuevo` deben mantener una composición estable y no depender de `flex-wrap` accidental.

## Dashboard, Metas, Ahorros y Deudas

Aplicar las mismas reglas globales al resto de la aplicación.

No solucionar únicamente los problemas visibles actuales.

Auditar los componentes reutilizables para evitar que el mismo problema aparezca posteriormente en otra pantalla.

## Componentes reutilizables

Priorizar la corrección de componentes y estilos compartidos antes que aplicar soluciones individuales.

Si varios componentes presentan el mismo problema responsive, corregir la regla compartida una sola vez.

NO crear hacks específicos para un modelo de celular.

NO crear un breakpoint diferente para cada dispositivo.

## Validación

Probar toda la aplicación en:

- 320 px
- 360 px
- 375 px
- 390 px
- 412 px
- 430 px

Validar como mínimo:

- Inicio
- Gastos
- Reportes
- Metas
- Ahorros
- Deudas

Comparar cada viewport con la versión oscura actual como referencia.

Verificar:

- mismas márgenes;
- misma alineación;
- mismas proporciones;
- botones consistentes;
- filtros consistentes;
- textos legibles;
- tarjetas consistentes;
- gráficas alineadas;
- ausencia de elementos cortados;
- ausencia de superposición;
- ausencia de overflow horizontal;
- ausencia de cambios arbitrarios de estructura.

## Criterio final

La aplicación debe sentirse como UNA SOLA APLICACIÓN en todos los celulares.

Un dispositivo más pequeño puede tener menos espacio disponible, pero debe mostrar la MISMA INTERFAZ, con la misma composición, jerarquía y proporciones.

La versión oscura actual es la referencia visual que debe conservarse.

NO rediseñar.

NO crear layouts diferentes por dispositivo.

NO solucionar pantalla por pantalla.

CORREGIR LA CAUSA RAÍZ DEL SISTEMA RESPONSIVE GLOBAL.