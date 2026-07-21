## Objetivo

1. Rediseñar la pantalla **Deudas** para que siga la misma UX de Metas (pestañas Activas/Completadas, progreso, cronograma, auto-completado con fecha).
2. Corregir el historial de **Metas** y **Ahorros** para que cada aporte muestre su fecha y hora reales (no el mes).

---

## 1. Deudas

### Base de datos
- Agregar columna `completed_at timestamptz null` a `installment_plans`.
- Trigger `sync_installment_plan_completion` (ya existe): ampliarlo para que además fije `completed_at = now()` la primera vez que `is_completed` pasa a `true`, y lo limpie si se revierte.

### Hook `useInstallments`
- `createPlan` acepta un `installment_amount` opcional; si se envía, se usa tal cual y se ajusta el reparto (la última cuota absorbe el redondeo). Si no, sigue el cálculo automático actual.
- Cargar **todas** las cuotas del plan (no sólo las del mes) para poder mostrar el cronograma. Exponer `paymentsByPlan` (map planId → payments[]).
- Mantener el filtro actual: los planes completados no vuelven a aparecer en meses posteriores a su última cuota, y sus cuotas dejan de listarse en "Cuotas del mes".

### UI (`InstallmentTracker.tsx`)
- Formulario de creación: agregar campo **Valor de la cuota** con auto-cálculo en vivo desde monto/número de cuotas pero editable. Etiqueta "Fecha de la primera cuota".
- Reemplazar la lista actual por dos pestañas (`Tabs`, mismo patrón que Metas):
  - **Activas**: tarjeta por deuda con
    - Nombre y chip "Cuota X de N"
    - `Progress` en %
    - `pagadas / total`, **saldo pendiente** (`total - pagado`)
    - Botón "Ver cronograma" que abre un `Dialog` listando todas las cuotas (número, mes, monto, estado pagada/pendiente, editar monto, toggle pagar) — reusa la lógica existente de `onTogglePayment` y `onUpdatePaymentAmount`.
    - Eliminar con confirmación (ya existe).
  - **Completadas**: tarjeta con nombre, total, número de cuotas y **fecha de completado** (`completed_at`), botón eliminar con confirmación.
- Mantener la tarjeta "Cuotas del Mes" arriba (o integrada dentro de "Activas" — ver Nota).
- Corregir el título del `AlertDialog` de borrado ("Eliminar deuda" en lugar de "Eliminar meta").

**Nota UX**: conservo "Cuotas del Mes" como sección superior para no cambiar el flujo mensual de marcado; el cronograma completo vive dentro de cada tarjeta de deuda activa.

---

## 2. Historial de Metas y Ahorros — fecha real

- Los aportes ya se guardan con `created_at = now()` (timestamp real en la BD); el problema es únicamente de visualización: hoy se muestra `c.month` (clave mensual, igual para todos los aportes del mes).
- En `SavingsModule.tsx`:
  - Ordenar los aportes por `created_at` descendente.
  - Mostrar `created_at` formateado con fecha y hora locales (`dd/mm/yyyy HH:mm`) en lugar de `c.month`.
- No se modifica la lógica de inserción (ya usa `now()` en el servidor, que es la fuente correcta y consistente entre dispositivos).

---

## Detalles técnicos

- Migración SQL:
  ```sql
  ALTER TABLE public.installment_plans
    ADD COLUMN completed_at timestamptz;
  ```
  Reescritura de `sync_installment_plan_completion` para setear/limpiar `completed_at` según transiciones de `is_completed`.
- Tipos: `InstallmentPlan` gana `completed_at: string | null`.
- Sin cambios en `useSavings` ni en el esquema de contribuciones.
- Sin cambios en navegación, backend de auth, ni otras pantallas.

## Archivos afectados

- `supabase` migración (nueva).
- `src/hooks/useInstallments.tsx`
- `src/components/InstallmentTracker.tsx`
- `src/components/SavingsModule.tsx`
- `src/pages/Dashboard.tsx` (sólo si cambia la firma de `createPlan`).