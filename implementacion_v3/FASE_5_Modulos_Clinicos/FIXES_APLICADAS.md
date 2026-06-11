# FASE 5: Fixes Aplicadas para Desajustes Schema/Código

## Estado Actual
- **25/25 tablas de Fase 5 existen en BD**
- **8 módulos requieren correcciones de código**
- Problemas identificados: nombres de tablas inconsistentes, columnas faltantes, references incorrectas

## Módulos y Fixes Aplicadas

### 1. Módulo: Médicos / Órdenes Médicas
**Archivo:** `src/hooks/useHosixMedicos.ts`

**Problema:** 
- Código usaba `profesionales_sanitarios.user_id` pero esa columna no existe
- La vinculación user→professional se hace a través de `hosix_usuarios.auth_user_id` y `hosix_usuarios.profesional_id`

**Fix Aplicado:**
```typescript
// ANTES (INCORRECTO):
const { data: medico } = await supabase
  .from('profesionales_sanitarios')
  .select('id')
  .eq('user_id', user.id)
  .single()

// DESPUÉS (CORRECTO):
const { data: usuario } = await supabase
  .from('hosix_usuarios')
  .select('id, profesional_id')
  .eq('auth_user_id', user.id)
  .single()

// Usar usuario.profesional_id en lugar de medico.id
```

**Líneas modificadas:**
- useOrdenesMedicas (línea 101-178): Cambio de query a través de hosix_usuarios
- registrarDiagnosticoMutation (línea 314-336): Cambio de query a través de hosix_usuarios

**Estado:** ✅ APLICADO

### 2. Módulo: Compras
**Archivo:** `src/hooks/useHosixCompras.ts`

**Problema:** 
- Código estructuralmente correcto
- Usa tablas:  `hosix_presupuestos`, `hosix_licitaciones`, `hosix_licitaciones_ofertas`, `hosix_adjudicaciones`
- Pero página `src/pages/Hosix/Compras.tsx` tenía bad hook destructuring

**Status:** ✅ YA CORREGIDO EN SESIÓN ANTERIOR

### 3. Módulo: Quirófanos
**Archivo:** `src/hooks/useHosixQuirofanos.ts`

**Problema:**
- Usa tablas: `hosix_quirofanos_bloques`, `hosix_quirofanos_salas`, `hosix_quirofanos_programaciones`, `hosix_quirofanos_diario`
- Join a `profesionales_sanitarios` sin problemas aparentes
- Necesita verificación de nombres de columnas en foreign keys

**Status:** 🔄 PENDIENTE VERIFICACIÓN

### 4. Módulo: Obstetricia
**Archivo:** `src/hooks/useHosixObstetricia.ts`

**Problema:**
- Usa tablas: `hosix_obstetricia`, `hosix_obstetricia_controles`, `hosix_obstetricia_partos`
- Necesita verificación de relaciones y columnas

**Status:** 🔄 PENDIENTE VERIFICACIÓN

### 5. Módulo: CRED
**Archivo:** `src/hooks/useHosixCRED.ts`

**Problema:**
- Usa tablas: `hosix_cred_programa`, `hosix_cred_seguimiento`, `hosix_cred_reportes`
- Necesita verificación de relaciones

**Status:** 🔄 PENDIENTE VERIFICACIÓN

### 6. Módulo: Recobros
**Archivo:** `src/hooks/useHosixRecobros.ts`

**Problema:**
- Usa tablas: `hosix_recobros`, `hosix_recobros_solicitudes`, `hosix_recobros_detalles`
- Necesita verificación de relaciones

**Status:** 🔄 PENDIENTE VERIFICACIÓN

### 7. Módulo: Cajas
**Archivo:** `src/hooks/useHosixCajas.ts`

**Problema:**
- Usa tablas: `hosix_cajas`, `hosix_cajas_movimientos`, `hosix_cajas_cuadres`
- Necesita verificación de relaciones

**Status:** 🔄 PENDIENTE VERIFICACIÓN

### 8. Módulo: Admisión Central
**Archivo:** `src/hooks/useHosixAdmision.ts` (si existe) o integrado en otra parte

**Problema:**
- Usa tablas: `hosix_admision_central`, `hosix_admision_historia_clinica`, `hosix_admision_vital_signs`
- Necesita verificación de relaciones

**Status:** 🔄 PENDIENTE VERIFICACIÓN

## Problemas Secundarios Identificados

### Componentes con Issues de Turno
**Archivo:** `src/components/hosix/turnos/TurnoActivationButton.tsx`

**Problema:** 
- Intenta leer columna `esta_en_turno` de `profesionales_sanitarios` que no existe
- Mismo problema con `profesionales_disponibles`

**Fix Recomendado:**
- Hacer el componente tolerante a columnas faltantes
- Fallback a estado seguro si no existen datos

**Status:** ✅ YA CORREGIDO EN SESIÓN ANTERIOR (se hizo tolerante)

### Prescripciones
**Archivo:** `src/components/hosix/prescripcion/PrescripcionesListado.tsx`

**Problema:**
- Usa `hosix_cpoe_prescripciones` cuando debería ser `hosix_prescripciones`
- Joins a `profesionales_sanitarios` sin claridad sobre foreign keys

**Status:** 🔄 PENDIENTE CORRECIÓN

## Fixes Completadas en esta Sesión

### ✅ Correcciones Aplicadas

#### 1. useHosixMedicos.ts - Referencias de profesionales
- Líneas 101-178: Cambio de query `profesionales_sanitarios` a través de `hosix_usuarios`
- Líneas 314-336: Cambio de query para `registrarDiagnosticoMutation` a través de `hosix_usuarios`
- **Resultado:** Los médicos ahora se buscan correctamente a través de la tabla intermedia

#### 2. Prescripciones - Nombre de tabla incorrecto
- `PrescripcionesListado.tsx` línea 24: `hosix_cpoe_prescripciones` → `hosix_prescripciones`
- `HistoricoPrescripciones.tsx` línea 28: `hosix_cpoe_prescripciones` → `hosix_prescripciones`
- `CPOEPrescripcionForm.tsx` línea 234: `hosix_cpoe_prescripciones` → `hosix_prescripciones`
- `useCDSEngine.ts` línea 184: `hosix_cpoe_prescripciones` → `hosix_prescripciones`
- **Resultado:** Todas las referencias a prescripciones ahora apuntan a la tabla correcta

### ✅ Módulos Revisados y Validados

Los siguientes módulos/hooks fueron revisados y validados como correctos:
- ✅ Compras (`useHosixCompras.ts`)
- ✅ Quirófanos (`useHosixQuirofanos.ts`)
- ✅ Recobros (`useHosixRecobros.ts`)
- ✅ Laboratorio (`useHosixLaboratorio.ts`)
- ✅ Imagenología (`useHosixImagenologia.ts`)
- ✅ Farmacia (`useHosixFarmacia.ts`)
- ✅ Interconsultas (`useHosixInterconsultas.ts`)
- ✅ Enfermería (`useHosixEnfermeria.ts`)
- ✅ Urgencias (`useHosixUrgencias.ts`)
- ✅ Citas (`useHosixCitas.ts`)
- ✅ Hospitalizacion (`useHosixHospitalizacion.ts`)

## Próximos Pasos

1. Verificar compilación sin errores TypeScript
2. Revisar si hay más references problemáticas mediante búsqueda de patrones
3. Probar los módulos uno por uno en el dev server
4. Ejecutar tests de integración para Fase 5

## Nota Importante

La vinculación entre usuarios de Supabase Auth y profesionales sanitarios es:
```
auth.users (id) → hosix_usuarios (auth_user_id) → hosix_usuarios (profesional_id) → profesionales_sanitarios (id)
```

NO ES DIRECTO como:
```
auth.users (id) → profesionales_sanitarios (user_id)  ❌ INCORRECTO
```
