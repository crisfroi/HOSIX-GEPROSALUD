# Fase 5: Resumen Completo de Migraciones - ACTUALIZADO

## Módulos Completados ✅

### 1. Recobros ✅
- **Archivo**: `supabase/migrations/20250121_007_hosix_recobros.sql`
- **Estado**: APLICADO A LA BD
- **Tablas**:
  - `hosix_recobros`
  - `hosix_recobros_notas_cargo`
  - `hosix_recobros_notas_credito`
  - `hosix_recobros_solicitudes`
  - `hosix_recobros_morosidad`

### 2. Compras ✅
- **Archivo**: `supabase/migrations/20260610_fase5_compras_presupuestos.sql`
- **Estado**: APLICADO A LA BD (en APPLY_FASE5_TODAS_MIGRACIONES.sql)
- **Tablas**:
  - `hosix_presupuestos`
  - `hosix_licitaciones`
  - `hosix_licitaciones_ofertas`
  - `hosix_adjudicaciones`

### 3. Farmacia ✅
- **Archivo**: `supabase/migrations/20260610_fase5_farmacia_dispensario.sql`
- **Estado**: APLICADO A LA BD (en APPLY_FASE5_TODAS_MIGRACIONES.sql)
- **Tablas**:
  - `hosix_farmacia_dispensario`
  - `hosix_farmacia_dispensaciones`
  - `hosix_farmacia_farmacovigilancia`

### 4. Interconsultas ✅
- **Archivo**: `supabase/migrations/20250206_014_hosix_interconsultas_asis_11.sql`
- **Estado**: APLICADO A LA BD (se comprobó en auditoría anterior)
- **Tablas**:
  - `hosix_interconsultas`
  - `hosix_interconsultas_respuestas`

### 5. Urgencias ✅
- **Estado**: Existente (tablas base del sistema)
- **Tablas**:
  - `hosix_urgencias_episodios`
  - `hosix_urgencias_triaje`

### 6. Prescripciones ✅
- **Estado**: Existente (reparado en sesión anterior)
- **Tablas**:
  - `hosix_prescripciones` (antes era `hosix_cpoe_prescripciones`)

## Módulos en Fase de Aplicación 🔄

### 7. Laboratorio Clínico 🔄
- **Archivo**: `supabase/migrations/20260610_fase5_laboratorio_diagnostico.sql`
- **Estado**: CREADO, PENDIENTE DE APLICACIÓN
- **Tablas**:
  - `hosix_laboratorio_pruebas_catalogo`
  - `hosix_laboratorio_solicitudes`
  - `hosix_laboratorio_solicitudes_items`
  - `hosix_laboratorio_resultados`
  - `hosix_laboratorio_control_calidad`

### 8. Imagenología 🔄
- **Archivo**: `supabase/migrations/20260610_fase5_imagenologia.sql`
- **Estado**: CREADO, PENDIENTE DE APLICACIÓN
- **Tablas**:
  - `hosix_imagenologia_modalidades`
  - `hosix_imagenologia_solicitudes`
  - `hosix_imagenologia_estudios`
  - `hosix_imagenologia_reportes`

### 9. Enfermería 🔄
- **Archivo**: `supabase/migrations/20250205_010_hosix_enfermeria.sql`
- **Estado**: CREADO, VERIFICAR APLICACIÓN
- **Tablas**:
  - `hosix_enfermeria_worklist`
  - `hosix_enfermeria_constantes`
  - `hosix_enfermeria_evaluaciones`
  - `hosix_enfermeria_planes`
  - `hosix_enfermeria_kardex`
  - `hosix_enfermeria_balance_hidrico`
  - `hosix_enfermeria_diario`

## Archivo de Aplicación Combinada

**Archivo**: `supabase/migrations/APPLY_FASE5_LABORATORIO_IMAGENOLOGIA_ENFERMERIA.sql`

Este archivo contiene:
- Todas las tablas de Laboratorio (5 tablas)
- Todas las tablas de Imagenología (4 tablas)
- Enfermería (7 tablas)
- Todas las políticas RLS y DROP POLICY IF EXISTS

**Uso**: Copiar y pegar TODO en Supabase SQL Editor y ejecutar.

## Errores Pendientes a Resolver

### Errores 400 Bad Request
1. `profesionales_sanitarios?select=...especialidad,servicio_id,activo&activo=eq.true 400`
   - **Causa**: Columna `esta_en_turno` no existe en `profesionales_sanitarios`
   - **Ubicación**: `AdmisionCentralForm.tsx:331`
   - **Solución**: Cambiar consulta para buscar en `profesionales_disponibles` o agregar la columna

2. `hosix_usuarios?select=id,profesional_id&auth_user_id=eq.150d... 400`
   - **Causa**: Posible problema de RLS o selección inválida
   - **Ubicación**: `useHosixMedicos.ts:114-117`
   - **Solución**: Revisar RLS policies de `hosix_usuarios`

## Próximos Pasos

1. ✅ **Crear migraciones faltantes** - HECHO
2. ⏳ **Aplicar migraciones en Supabase** - EN PROCESO
   - Usar: `APPLY_FASE5_LABORATORIO_IMAGENOLOGIA_ENFERMERIA.sql`
3. ⏳ **Resolver errores 400** - PENDIENTE
   - Revisar `AdmisionCentralForm.tsx` y `useHosixMedicos.ts`
4. ⏳ **Verificar todos los hooks re-activados** - PENDIENTE
   - `useHosixImagenologia`
   - `useHosixLaboratorio`
   - `useHosixEnfermeria`

## Totales

- **Módulos Completos**: 6 (Recobros, Compras, Farmacia, Interconsultas, Urgencias, Prescripciones)
- **Módulos en Aplicación**: 3 (Laboratorio, Imagenología, Enfermería)
- **Tablas Totales**: 36+
- **Archivos Migración**: 9
