# FASE 5 - ESTADO DE EXISTENCIA DE TABLAS

## Problema Identificado

La auditoría previa indicaba que "25/25 tablas existen", pero los errores 404 del dev server indican que **muchas tablas NO existen realmente** en la BD.

## Errores Confirmados (404 Not Found)

### Módulo: Compras ❌
- ❌ `hosix_presupuestos` - 404
- ❌ `hosix_licitaciones` - 404
- ❌ `hosix_licitaciones_ofertas` - 404
- ❌ `hosix_adjudicaciones` - 404

### Módulo: Recobros ❌
- ❌ `hosix_recobros` - 404
- ❌ `hosix_recobros_notas_cargo` - 404
- ❌ `hosix_recobros_notas_credito` - 404
- ❌ `hosix_recobros_solicitudes` - 404
- ❌ `hosix_recobros_morosidad` - 404

### Módulo: Farmacia ❌
- ❌ `hosix_farmacia_dispensario` - 404
- ❌ `hosix_farmacia_dispensaciones` - 404
- ❌ `hosix_farmacia_farmacovigilancia` - 404

### Módulo: Interconsultas ❌
- ❌ `hosix_interconsultas_solicitudes` - 404
- ❌ `hosix_interconsultas_respuestas` - probablemente 404

### Módulo: Prescripciones ⚠️
- ✅ `hosix_prescripciones` - EXISTE
- ❌ FK a `profesionales_sanitarios` NO EXISTE (error PGRST200)

### Módulo: Stock/Almacenes ⚠️
- ❌ `hosix_stock_movimientos` - ERR_CONNECTION_CLOSED
- ❌ `hosix_ordenes_compra` - ERR_CONNECTION_CLOSED
- ❌ `hosix_inventarios` - ERR_CONNECTION_CLOSED
- ❌ `hosix_centros_coste` - ERR_CONNECTION_CLOSED
- ❌ `hosix_almacenes` - ERR_CONNECTION_CLOSED
- ❌ `hosix_almacenes_depositos` - ERR_CONNECTION_CLOSED
- ❌ `hosix_stock` - ERR_CONNECTION_CLOSED
- ❌ `hosix_stock_lotes` - ERR_CONNECTION_CLOSED

## Fixes Aplicadas en Esta Sesión

### 1. Prescripciones - Remover FK sin soporte
- **Problema:** `hosix_prescripciones` no tiene FK a `profesionales_sanitarios`
- **Fix:** Remover JOIN a `medico:profesionales_sanitarios` en:
  - PrescripcionesListado.tsx
  - HistoricoPrescripciones.tsx
- **Status:** ✅ APLICADO

## Próximas Acciones

### Opción A: Crear las tablas faltantes
1. Crear migraciones para todas las tablas faltantes
2. Asegurar que FKs estén correctamente definidas
3. Aplicar migraciones a la BD

### Opción B: Desactivar módulos sin tablas
1. Comentar los hooks que no tienen soporte en BD
2. Ocultar los tabs/componentes en UI
3. Priorizar solo módulos con tablas existentes

### Opción C: Híbrida (Recomendada)
1. Verificar exactamente qué tablas existen con script MCP
2. Crear migraciones SOLO para las tablas críticas
3. Desactivar módulos secundarios por ahora

## Recomendación

**Ejecutar primero:** Script `check-existing-tables.mjs` para saber exactamente qué tablas existen
**Luego:** Decidir si crear migraciones o desactivar módulos

## Tablas que Probablemente EXISTEN (basado en tests pasados)
- ✅ `hosix_pacientes` (reportado en selects exitosos)
- ✅ `hosix_historia_clinica` (usado en urgencias)
- ✅ `hosix_urgencias_episodios` (usado en tests)
- ✅ `hosix_quirofanos_bloques` (posible, necesita verificación)
- ✅ Otras tablas maestras básicas
