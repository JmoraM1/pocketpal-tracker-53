

## 💰 Control de Flujo de Gastos y Finanzas Personales

### Resumen
App de finanzas personales para gestionar tu presupuesto mensual, controlar gastos por categoría, marcar pagos como realizados y visualizar tu situación financiera con gráficas.

---

### 1. Autenticación y Base de Datos (Lovable Cloud + Supabase)
- **Login/Registro** con email para acceder desde cualquier dispositivo
- **Base de datos** para guardar ingresos, gastos y estados de pago de forma permanente

### 2. Pantalla Principal — Dashboard de Resumen
- **Ingreso del mes**: campo editable para ingresar tu sueldo variable cada mes
- **Total de gastos**: suma automática de todos los conceptos
- **Disponible para ahorro**: sueldo menos gastos totales, destacado visualmente (verde si positivo, rojo si negativo)
- **Indicador visual** de salud financiera: barra de progreso o semáforo que muestra si tienes muchos gastos vs tu ingreso

### 3. Lista de Gastos con Categorías Predefinidas
Cada concepto tendrá:
- **Nombre** (preconfigurado): Sueldo, Plan celular, Recibos casa, Cuota crédito Banco de Bogotá, Cadena Tele 30 días, Tarjeta, Gasolina, Bolsillo Cami y Juan, Bolsillo emergencia, Bolsillo moto mantenimiento, Vale abono extra, Crédito
- **Monto**: editable con un clic
- **Descripción**: nota opcional
- **Estado de pago**: botón toggle Pagado/Pendiente con color visual
- **Botón editar**: para modificar monto y descripción rápidamente

### 4. Panel de Visualización con Gráficas
- **Gráfica de torta/dona**: proporción de cada gasto respecto al total
- **Gráfica de barras**: comparación de montos por categoría
- Ambas gráficas se actualizan en tiempo real al modificar montos

### 5. Gestión Mensual
- Selector de mes para ver y editar gastos de cada periodo
- Posibilidad de copiar la estructura del mes anterior como plantilla
- Historial de meses anteriores

### 6. Diseño y Experiencia
- Interfaz en español
- Botones grandes y accesibles para editar rápidamente
- Colores claros para indicar estado: verde (pagado), rojo/naranja (pendiente)
- Diseño responsive para usar desde celular o computador
- Formato de moneda colombiana (COP con separador de miles)

