# PRÓXIMOS PASOS - FASE 6 HOSIX
**Fecha:** 11 de Junio 2026
**Estado:** 55% Completado
**Responsable:** Equipo de Desarrollo

---

## 📊 PROGRESO ACTUAL

| Componente | Status | Completado | Próximo Paso |
|---|---|---|---|
| **Lab-HIS** | ✅ | 100% | Verificación en vivo |
| **Imagen-HIS** | ✅ | 100% | Verificación en vivo |
| **Integración Lab-Imagen-Caja** | ✅ | 100% | Testing completo |
| **Sistema QR Automático** | ✅ | 100% | Aplicar migraciones |
| **Sistema de Pago** | ✅ | 100% | Integración final |
| **Kiosko Autofacturación** | 🟡 | 0% | Próxima semana |
| **Nodo Central + HCU** | 🟡 | 0% | Fase 7 (posterior) |

---

## 🎯 TAREAS INMEDIATAS (HOY)

### 1. Aplicar Migraciones SQL en Supabase
**Descripción:** Aplicar las 3 migraciones SQL creadas para completar BD

**Archivos:**
```
supabase/migrations/20260611_fase6_integracion_lab_imagen_facturacion.sql ✅ (ya aplicada)
supabase/migrations/20260611_fase6_triggers_qr_automatico.sql 🔴 NECESARIA
supabase/migrations/20260611_fase6_recibos_pagos.sql 🔴 NECESARIA
```

**Métodos disponibles:**
- SQL Editor de Supabase (manual)
- Supabase CLI: `supabase db execute --file <archivo.sql>`
- MCP Server: `execute_sql` (si está disponible)

**Tiempo estimado:** 5 minutos

**Validación:**
```sql
-- Verificar triggers existen
SELECT * FROM pg_trigger WHERE tgname LIKE '%qr%';

-- Verificar tabla recibos
SELECT * FROM information_schema.tables 
WHERE table_name = 'hosix_recibos_pagos';

-- Verificar funciones
SELECT proname FROM pg_proc WHERE proname LIKE '%generar_qr%';
```

---

### 2. Testing Completo del Flujo Lab-Imagen-Caja
**Descripción:** Validar que el flujo completo funciona de punta a punta

**Pasos del Test:**

**2.1 En ConsultaMedicaForm:**
```
1. Crear nueva consulta médica
2. Haz clic "Agregar Solicitud"
3. Tab "Laboratorio":
   - Selecciona prueba cualquiera
   - Ingresa diagnóstico
   - Selecciona prioridad
   - Haz clic "Agregar Prueba"
4. Tab "Imagenología":
   - Selecciona modalidad cualquiera
   - Ingresa zona de interés
   - Ingresa diagnóstico
   - Haz clic "Agregar Estudio"
5. Haz clic "Guardar Solicitudes"
   - Verifica que se agrega al card
6. Haz clic "Guardar Consulta"
   - Espera éxito
```

**2.2 En Base de Datos (verificación):**
```sql
-- Verifica que se creó solicitud lab
SELECT id, numero_documento, codigo_qr, estado_pago 
FROM hosix_laboratorio_solicitudes 
WHERE estado = 'pendiente' 
ORDER BY fecha_solicitud DESC LIMIT 1;

-- Verifica que se creó código QR
SELECT numero_documento, codigo_qr, tipo_documento 
FROM hosix_codigos_documentos 
ORDER BY generado_en DESC LIMIT 1;
```

**2.3 En Cajas Tab Scanner:**
```
1. Ir a Cajas.tsx → Tab "Scanner"
2. Escanear (o copiar) el código QR: QR12345ABC...
3. Click "Escanear"
   - Debe cargar los datos correctamente
   - Mostrar paciente, servicios, monto
4. Click Tab "Procesar Pago"
5. Método de Pago: "Efectivo"
6. Monto Recibido: ingresa el monto mostrado
7. Click "Procesar Pago"
   - Espera éxito
   - Debe mostrar recibo
   - Vuelto debe ser $0.00
```

**2.4 Verificar Registros en BD:**
```sql
-- Verifica movimiento caja
SELECT * FROM hosix_cajas_movimientos 
ORDER BY fecha_movimiento DESC LIMIT 1;

-- Verifica recibo
SELECT * FROM hosix_recibos_pagos 
ORDER BY fecha_pago DESC LIMIT 1;

-- Verifica solicitud actualizada
SELECT estado_pago FROM hosix_laboratorio_solicitudes 
WHERE numero_documento = 'LAB20260000001';
```

**Tiempo estimado:** 15 minutos

---

## 🔧 TAREAS SEMANA SIGUIENTE

### 3. Crear Kiosko de Autofacturación
**Descripción:** Pantalla pública para que pacientes paguen sus servicios

**Ubicación:** `src/pages/Hosix/Kiosko.tsx`

**Requisitos:**
- [ ] Pantalla fullscreen sin barra lateral
- [ ] Escanear QR automaticamente (input oculto)
- [ ] Mostrar datos paciente en grande
- [ ] Listar servicios con precios
- [ ] Opciones de pago (efectivo, tarjeta)
- [ ] Procesar pago
- [ ] Imprimir recibo
- [ ] Pantalla de espera entre transacciones

**Mockup:**
```
┌─────────────────────────────────┐
│  KIOSKO DE AUTOFACTURACIÓN      │
├─────────────────────────────────┤
│  (Escanea tu código QR)         │
│  [INPUT INVISIBLE]              │
│                                 │
│  Paciente: JUAN PÉREZ           │
│  Cédula: 123-456-789            │
│                                 │
│  Servicios:                     │
│  ✓ Análisis Sangre    $50.00    │
│  ✓ Rayos X Pecho      $75.00    │
│                                 │
│  TOTAL: $125.00                 │
│                                 │
│  [ Pagar Efectivo ] [ Tarjeta ] │
└─────────────────────────────────┘
```

**Estimado:** 4 horas

---

### 4. Reportes de Recaudación
**Descripción:** Dashboard con métricas de pagos

**Requisitos:**
- [ ] Total recaudado (hoy, semana, mes)
- [ ] Desglose por método de pago
- [ ] Desglose por tipo de servicio (lab, imagen)
- [ ] Número de transacciones
- [ ] Promedio por transacción
- [ ] Gráficos de tendencia

**Estimado:** 3 horas

---

### 5. Mejoras de UX/UI
**Descripción:** Refinamientos visuales y de usabilidad

- [ ] Animaciones de transición entre tabs
- [ ] Sonido al escanear (opcional)
- [ ] Validación en tiempo real
- [ ] Mensajes de error más descriptivos
- [ ] Historial de escaneos en caja
- [ ] Búsqueda de recibos por número/cédula

**Estimado:** 2 horas

---

## 📅 FASE 7: FUTURO

### Nodo Central + Historia Clínica Única (HCU)
**Estado:** Documentado, no implementado
**Archivo:** `ARQUITECTURA_NODO_CENTRAL_HISTORIA_CLINICA.md`

**Cambios requeridos:**
- Crear tablas centrales en país_schema
- Sincronización bidireccional
- Cambiar identificador de cédula a HCU
- Edge functions para sincronización
- API para acceso desde otros hospitales

**Estimado:** 40+ horas

---

## 📋 CHECKLIST DE VALIDACIÓN FASE 6

### Antes de dar por completada la fase:

- [ ] Migraciones SQL aplicadas
- [ ] Triggers QR funcionando (verificar en BD)
- [ ] ConsultaMedicaForm crea solicitudes
- [ ] ScannerQRCaja carga documentos
- [ ] ProcesadorPagoCaja procesa pagos
- [ ] Movimientos caja se registran
- [ ] Recibos se crean correctamente
- [ ] Estado_pago se actualiza
- [ ] Test E2E del flujo completo pasado
- [ ] Sin errores en console del navegador
- [ ] RLS funciona correctamente

---

## 📞 SOPORTE Y REFERENCIAS

**Archivos de Referencia:**
- `PLAN_FASE6.md` - Plan original
- `ESTRATEGIA_INTEGRACION_LAB_IMAGEN_FACTURACION.md` - Arquitectura técnica
- `GUIA_CAMBIO_HCU_EN_FACTURACION.md` - Futuro (Nodo Central)

**Edge Functions Relevantes:**
- `hosix-generar-qr-solicitud` - Generar QR
- `hosix-caja-scan` - Escanear documento
- `hosix-lab-sync` - Sincronizar lab
- `hosix-imagen-sync` - Sincronizar imagen

**Hooks React Relevantes:**
- `useHosixLaboratorio.ts`
- `useHosixImagenologia.ts`
- `useHosixCajas.ts`

---

## ⚠️ RIESGOS Y CONSIDERACIONES

1. **RLS en Producción:** Asegurar que solo usuarios autorizados puedan:
   - Crear solicitudes (médicos)
   - Procesar pagos (cajeros)
   - Ver reportes (administradores)

2. **Integridad de Datos:** Validar:
   - Códigos QR únicos
   - Números de documento secuenciales
   - Estado_pago consistente

3. **Performance:** 
   - Índices creados en tablas grandes
   - Queries optimizadas
   - Caché de catálogos

4. **Seguridad:**
   - No exponer información sensible en QR
   - Validar monto antes de procesar pago
   - Registrar auditoría de anulaciones

---

**Próxima Revisión:** 12-JUN-2026
**Responsable:** Equipo HOSIX
