# FASE 5: HABILITAR 8 MÓDULOS CLÍNICOS
**Duración Estimada:** 3-4 días
**Objetivo:** Crear tablas base e interfaces mínimas para 8 módulos clínicos

---

## 📋 MÓDULOS A IMPLEMENTAR

### 1. **Admisión Central** (/hosix/admision-central)
**Responsabilidad:** Coordinación centralizada de ingresos hospitalarios

**Tablas a crear:**
- `hosix_admisiones` (id, paciente_id, fecha_solicitud, estado, prioridad, especialidad_solicitada, etc.)
- `hosix_admisiones_camas` (admision_id, cama_id, fecha_asignacion)

**UI Mínima:**
- Vista de admisiones pendientes
- Formulario de nueva admisión
- Asignación de cama

---

### 2. **CRED** (/hosix/cred) - Control de Crecimiento y Desarrollo
**Responsabilidad:** Seguimiento de menores (0-5 años)

**Tablas a crear:**
- `hosix_cred_menores` (id, paciente_id, fecha_nac, peso_nac, talla_nac)
- `hosix_cred_vacunacion` (id, menor_id, fecha_vacunacion, vacuna, lote, dosis)
- `hosix_cred_seguimiento` (id, menor_id, fecha_control, peso, talla, imc, observaciones)

**UI Mínima:**
- Registro de menores
- Carnet de vacunación
- Gráficos de crecimiento

---

### 3. **Cajas** (/hosix/cajas)
**Responsabilidad:** Gestión de caja registradora y arqueos

**Tablas a crear:**
- `hosix_cajas_caja` (id, caja_numero, caja_estado, responsable_id, fecha_apertura)
- `hosix_cajas_transacciones` (id, caja_id, tipo_transaccion, monto, concepto, referencia)
- `hosix_cajas_arqueos` (id, caja_id, fecha_arqueo, monto_inicial, monto_final, diferencia)

**UI Mínima:**
- Apertura/cierre de caja
- Registro de transacciones
- Arqueo de caja

---

### 4. **Compras** (/hosix/compras)
**Responsabilidad:** Control de órdenes de compra y recepción

**Tablas a crear:**
- `hosix_compras_ordenes` (id, proveedor_id, fecha_orden, estado, total, responsable_id)
- `hosix_compras_detalle` (id, orden_id, articulo_id, cantidad, precio_unitario)
- `hosix_compras_recepcion` (id, orden_id, fecha_recepcion, cantidad_recibida, estado)

**UI Mínima:**
- Crear orden de compra
- Recepción de mercadería
- Seguimiento de órdenes

---

### 5. **Quirófanos** (/hosix/quirofanos)
**Responsabilidad:** Programación y gestión de salas quirúrgicas

**Tablas a crear:**
- `hosix_quirofanos_salas` (id, nombre_sala, bloque_id, capacidad, equipos)
- `hosix_quirofanos_programaciones` (id, sala_id, paciente_id, fecha_programada, tipo_procedimiento, cirujano_id, estado)
- `hosix_quirofanos_diario` (id, programacion_id, fecha_hora_inicio, fecha_hora_fin, estado, incidentes)

**UI Mínima:**
- Calendario de quirófanos
- Programación de procedimientos
- Estado en vivo de salas

---

### 6. **Obstetricia** (/hosix/obstetricia)
**Responsabilidad:** Control de embarazos, partos y puerperio

**Tablas a crear:**
- `hosix_obstetricia_gestaciones` (id, paciente_id, fecha_ult_menstruacion, edad_gestacional, estado)
- `hosix_obstetricia_controles` (id, gestacion_id, fecha_control, peso, presion, analisis)
- `hosix_obstetricia_partos` (id, gestacion_id, fecha_hora_inicio, tipo_parto, complicaciones, estado)
- `hosix_obstetricia_puerperio` (id, parto_id, fecha_inicio, estado_puerperio, observaciones)

**UI Mínima:**
- Registro de gestaciones
- Controles prenatales
- Registro de partos

---

### 7. **Recobros** (/hosix/recobros)
**Responsabilidad:** Gestión de facturación y recuperación de cartera

**Tablas a crear:**
- `hosix_recobros` (id, paciente_id, episodio_id, monto_total, saldo_pendiente, estado)
- `hosix_recobros_notas_cargo` (id, recobro_id, fecha_emision, concepto, monto)
- `hosix_recobros_notas_credito` (id, recobro_id, fecha_emision, motivo, monto)
- `hosix_recobros_morosidad` (id, recobro_id, dias_vencimiento, estado_cobranza)

**UI Mínima:**
- Cartera vencida
- Notas de cargo/crédito
- Reporte de morosidad

---

### 8. **Suministros** (/hosix/suministros)
**Responsabilidad:** Gestión de almacenes y stock (mejora de existente)

**Tablas a crear/mejorar:**
- `hosix_suministros_stock` (id, almacen_id, articulo_id, cantidad_actual, cantidad_minima, cantidad_maxima)
- `hosix_suministros_movimientos` (id, almacen_id, articulo_id, tipo_movimiento, cantidad, fecha, responsable_id)
- `hosix_suministros_solicitudes` (id, solicitante_id, fecha_solicitud, estado, articulos)

**UI Mínima:**
- Dashboard de inventario
- Solicitud de artículos
- Movimientos de stock

---

## 🛠️ PLAN DE EJECUCIÓN

### Día 1: Migración SQL
- Crear migración: `20260610_fase5_modulos_tablas.sql`
- Incluir todas las 8 tablas base
- Agregar RLS policies mínimas
- Índices en FK principales

### Día 2: Hooks React
- `useAdmisionCentral.ts`
- `useCRED.ts`
- `useCajas.ts`
- `useCompras.ts`
- `useQuirofanos.ts`
- `useObstetricia.ts`
- `useRecobros.ts`
- `useSupl mentosAvanzado.ts`

### Día 3: Componentes UI
- Crear componentes básicos por módulo
- Integrar en páginas existentes
- Testing manual

### Día 4: Validación
- Verificar todas las rutas funcionan
- Revisar errores de consola
- Documentar estados finales

---

## ✅ CRITERIOS DE ÉXITO

- [ ] 8 tablas creadas en BD
- [ ] Todos los módulos accesibles sin 404
- [ ] Ni un error rojo en consola por tabla faltante
- [ ] UI básica funcional en cada módulo
- [ ] Log actualizado con status final
