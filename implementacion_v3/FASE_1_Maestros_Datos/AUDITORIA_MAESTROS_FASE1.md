# AUDITORÍA COMPLETA DE MAESTROS - FASE 1

**Fecha:** 4 de Junio 2026  
**Versión:** 1.0  
**Estado:** 🔴 EN AUDITORÍA

---

## 📊 RESUMEN EJECUTIVO

| Categoría | Maestros Requeridos | Implementados | Falta | % Completitud |
|-----------|-------------------|----------------|-------|--------------|
| **Ubicación Geográfica** | 3 | 2* | 1 | 67% |
| **Organización Sanitaria** | 7 | 4 | 3 | 57% |
| **Recursos Humanos** | 5 | 2 | 3 | 40% |
| **Catálogos Clínicos** | 8 | 3 | 5 | 38% |
| **Gestión Operativa** | 6 | 3 | 3 | 50% |
| **Configuración Seguridad** | 4 | 2 | 2 | 50% |
| **TOTAL FASE 1** | **33** | **16** | **17** | **48%** |

*\*Provincias y Distritos Sanitarios acabados de crear en 20260604_023*

---

## 1️⃣ MAESTROS DE UBICACIÓN GEOGRÁFICA

| Maestro | Status | Tabla BD | Hook | UI Manager | Notas |
|---------|--------|----------|------|-----------|-------|
| Provincias | ✅ NUEVO | `hosix_provincias` | - | - | 8 provincias de GE |
| Distritos Sanitarios | ✅ NUEVO | `hosix_distritos_sanitarios` | - | - | 19 distritos + admin |
| **Zonas de Cobertura** | ❌ FALTA | - | - | - | Para gestión territorial |

**Acciones pendientes:**
- [ ] Crear tabla `hosix_zonas_cobertura` (áreas de responsabilidad territorial)
- [ ] Vincular con centros de salud
- [ ] Crear UI manager para zonas

---

## 2️⃣ MAESTROS DE ORGANIZACIÓN SANITARIA

| Maestro | Status | Tabla BD | Hook | UI Manager | Notas |
|---------|--------|----------|------|-----------|-------|
| Centros de Salud | ✅ EXISTS | `centros_salud` | - | Integrado en menú | Completo |
| Departamentos | ✅ IMPLEMENTADO | `hosix_departamentos` | ✅ `useHosixDepartamentos` | ✅ `DepartamentosManager` | 3-JUN |
| Servicios | ✅ EXISTS | Multiple (`servicios_*`) | ✅ useHosixServicios | Parcial en Configuración | Múltiples servicios especializados |
| **Unidades Funcionales** | ❌ FALTA | - | - | - | Grupos operativos dentro servicios |
| **Camas/Recursos** | ✅ EXISTS | `camas`, `equipamiento_medico` | Hooks disponibles | PartialUI | En módulo Hospitalización |
| **Turnos/Guardias** | ⚠️ PARCIAL | `turno_cuadrantes` | - | - | Implementado en Attendance module |
| **Bloques Quirúrgicos** | ✅ EXISTS | `quirofano_bloques_quirurgicos` | - | En Quirófanos | Completo |

**Acciones pendientes:**
- [ ] Crear tabla `hosix_unidades_funcionales` (equipos integrados dentro servicios)
- [ ] Manager para unidades funcionales con asignación de personal
- [ ] Revisar y completar UI de turnos/guardias

---

## 3️⃣ MAESTROS DE RECURSOS HUMANOS

| Maestro | Status | Tabla BD | Hook | UI Manager | Notas |
|---------|--------|----------|------|-----------|-------|
| Profesionales Sanitarios | ✅ EXISTS | `profesionales_sanitarios` | ✅ `useProfesionales` | SelectorUI | Importado desde remoto |
| Usuarios del Sistema | ✅ EXISTS | `hosix_usuarios` | ✅ useHosixAuth | En Configuración | Login integrado |
| **Especialidades Médicas** | ⚠️ PARCIAL | `especialidade_medica` (legacy) | - | - | Necesita normalización |
| **Roles Organizacionales** | ⚠️ PARCIAL | `roles` enum type | - | En PermisosManager | 16 roles predefinidos, sin CRUD |
| **Equipos Médicos** | ✅ IMPLEMENTADO | `hosix_equipos_medicos` | ✅ `useHosixEquipos` | ✅ `EquiposMedicosManager` | 3-JUN |

**Acciones pendientes:**
- [ ] Crear tabla `hosix_especialidades_medicas` (maestro normalizado)
- [ ] Manager para especialidades (CRUD completo)
- [ ] Crear tabla `hosix_roles_organizacionales` (dinamizar roles)
- [ ] Manager para roles con asignación flexible
- [ ] Crear tabla `hosix_cualificaciones_profesionales` (certificaciones)

---

## 4️⃣ MAESTROS CATÁLOGOS CLÍNICOS

| Maestro | Status | Tabla BD | Hook | UI Manager | Notas |
|---------|--------|----------|------|-----------|-------|
| CIE-10 | ✅ EXISTS | `hosix_codificacion_cie10` | - | En CodificacionManager | Legacy, búsqueda |
| **CIE-11** | ✅ NUEVO | `hosix_cie11_cache` | ✅ `useHosixCIE11` | ✅ `DiagnosticoCIE11Selector` | Caché del ICD-API |
| **Procedimientos Médicos** | ⚠️ PARCIAL | `hosix_procedimientos_medicos` | - | SelectorUI | En formularios clínicos |
| **Medicamentos/Principios Activos** | ❌ FALTA | - | - | - | OMS LME no cargado |
| **Escalas Clínicas** | ✅ EXISTS | `escalas_clinicas_evaluacion` | - | En Módulos clínicos | SOFA, NEWS, etc. |
| **Interacciones Farmacológicas** | ✅ EXISTS | `hosix_drug_interactions` | - | En Prescripción | Validación de alertas |
| **Alergias Medicamentosas** | ⚠️ PARCIAL | `hosix_alergias` (en paciente) | - | En Historia Clínica | Sin maestro separado |
| **Pruebas de Laboratorio** | ⚠️ PARCIAL | `laboratorio_*` | - | En Laboratorio | Parcialmente implementado |

**Acciones pendientes:**
- [ ] Cargar catálogo OMS de principios activos (~600 items)
- [ ] Crear tabla `hosix_medicamentos_esenciales` (LME vigente)
- [ ] Manager para medicamentos con búsqueda avanzada
- [ ] Crear maestro `hosix_alergias_medicinas` normalizado
- [ ] Completar catálogo de pruebas de laboratorio
- [ ] Manager para pruebas con parámetros y valores normales

---

## 5️⃣ MAESTROS DE GESTIÓN OPERATIVA

| Maestro | Status | Tabla BD | Hook | UI Manager | Notas |
|---------|--------|----------|------|-----------|-------|
| Almacenes/Bodegas | ✅ EXISTS | `almacen` | - | En Suministros | Básico funcional |
| **Distribuidores/Proveedores** | ❌ FALTA | - | - | - | Necesario para compras |
| **Material Médico/Insumos** | ⚠️ PARCIAL | `material_medico` | - | En Suministros | Sin catálogo maestro |
| Camas | ✅ EXISTS | `camas` | - | En Hospitalización | Completo |
| **Equipos Médicos (Activos)** | ⚠️ PARCIAL | `equipamiento_medico` | - | En Configuración | Sin mantenimiento preventivo |
| **Servicios de Terceros** | ❌ FALTA | - | - | - | Contratistas, servicios externos |

**Acciones pendientes:**
- [ ] Crear tabla `hosix_proveedores` con CRUD completo
- [ ] Manager para proveedores (contactos, precios, términos)
- [ ] Crear tabla `hosix_material_medico_maestro` (catálogo)
- [ ] Manager para material médico
- [ ] Crear tabla `hosix_servicios_terceros` (contrataciones)
- [ ] Manager para servicios terceros

---

## 6️⃣ MAESTROS DE CONFIGURACIÓN Y SEGURIDAD

| Maestro | Status | Tabla BD | Hook | UI Manager | Notas |
|---------|--------|----------|------|-----------|-------|
| Permisos | ✅ IMPLEMENTADO | `hosix_permisos_*` (3 tablas) | ✅ useHosixPermisos | ✅ `PermisosManager` (3 tabs) | Por Rol, Usuario, Equipo |
| **Parámetros de Sistema** | ⚠️ PARCIAL | `hosix_configuracion` (legacy) | - | - | Sin UI manager |
| **Políticas de Seguridad** | ❌ FALTA | - | - | - | Reglas de acceso RLS/RBA |
| **Auditoría y Trazabilidad** | ⚠️ PARCIAL | `hosix_auditoria_*` | - | En Reportes | Logging automatizado |

**Acciones pendientes:**
- [ ] Crear tabla `hosix_parametros_sistema` normalizada
- [ ] Manager para parámetros (editar valores de configuración)
- [ ] Crear tabla `hosix_politicas_seguridad` (RLS policies management)
- [ ] Dashboard de auditoría con filtros avanzados
- [ ] Crear tabla `hosix_logs_acceso` (track de logins, cambios)

---

## 7️⃣ MAESTROS FALTANTES - SÍNTESIS

### Nuevos Maestros a Crear (9 Tabla + Managers)

1. **hosix_zonas_cobertura** - Áreas territoriales
2. **hosix_unidades_funcionales** - Equipos operativos
3. **hosix_especialidades_medicas** - Normalización de especialidades
4. **hosix_roles_organizacionales** - Roles dinámicos (no enums)
5. **hosix_cualificaciones_profesionales** - Certificaciones profesionales
6. **hosix_medicamentos_maestro** - Catálogo OMS de principios activos
7. **hosix_medicamentos_esenciales** - LME vigente del país
8. **hosix_proveedores** - Distribuidores y suministradores
9. **hosix_material_medico_maestro** - Catálogo de insumos
10. **hosix_servicios_terceros** - Servicios contratados
11. **hosix_parametros_sistema** - Configuraciones globales
12. **hosix_politicas_seguridad** - Gestión de RLS

### Maestros a Normalizar/Mejorar (6 Tabla)

1. **hosix_especialidades_medicas** - Pasar de column a tabla
2. **hosix_procedimientos_medicos** - Completar catálogo
3. **hosix_pruebas_laboratorio** - Completar estándares
4. **hosix_alergias** - Separar en tabla maestro
5. **hosix_parametros_clinicos** - Rangos normales por edad/sexo
6. **hosix_equipamiento_medico** - Agregar mantenimiento

---

## 🎯 RECOMENDACIONES PRIORITARIAS

### Corto Plazo (Esta Semana - Fase 1.4)

**ALTA PRIORIDAD:**
1. ✅ Maestros de ubicación (NUEVO: provincias + distritos) - 20260604_023
2. Especialidades Médicas (normalización)
3. Roles Organizacionales (dinamización)
4. Parámetros de Sistema (UI manager)

**MEDIA PRIORIDAD:**
5. Proveedores (CRUD básico)
6. Material Médico (catálogo)
7. Procedimientos (completar + búsqueda)

### Mediano Plazo (Semana 2-3)

**Para Fase 2 (Codificación):**
- Medicamentos/Principios Activos (para prescripción)
- LME (para reportes de uso)

**Para Fase 3 (Plantillas):**
- Parámetros de Sistema (para templates dinámicos)

### Largo Plazo (Semana 4-5+)

**Para Fase 4 (Catálogos):**
- Servicios de Terceros
- Mantenimiento preventivo equipos
- Trazabilidad de recursos

---

## 📝 ESTADO ACTUAL RESUMIDO

### ✅ COMPLETADO EN FASE 1
- Departamentos (Manager + Hook + Integración)
- Equipos Médicos (Manager + Hook + Integración)
- Permisos (3 niveles: Rol, Usuario, Equipo)
- Provincias + Distritos Sanitarios (20260604_023)

### ⚠️ PARCIALMENTE COMPLETADO
- Servicios (UI incompleta)
- Especialidades (sin normalización)
- Procedimientos (catálogo incompleto)
- Roles (enum rigido, no dinámico)
- Equipamiento (sin mantenimiento)

### ❌ FALTA CREAR (12 TABLAS + 12 MANAGERS)
- Zonas de Cobertura
- Unidades Funcionales
- Cualificaciones Profesionales
- Medicamentos/LME
- Proveedores
- Material Médico
- Servicios Terceros
- Parámetros Sistema
- Políticas Seguridad
- Pruebas Laboratorio (completar)
- Alergias (normalizar)
- Logs de Auditoría

---

## 🔄 PROPUESTA DE ACCIÓN

### Opción A: Completar TODO Fase 1 antes de Fase 2 (Riguroso)
- Tiempo: +3-4 semanas
- Ventaja: Sistema completamente normalizado
- Desventaja: Retraso en Fase 2-3

### Opción B: Completar Maestros Críticos + Seguir a Fase 2 (Ágil) ⭐ RECOMENDADO
- Completa en Fase 1.4 (esta semana):
  - Especialidades (para clínica)
  - Roles dinámicos (para permisos)
  - Parámetros Sistema (para config)
  - Zonas Cobertura (para territorio)
- Resto entra en Fase 2-3 según necesidad clínica
- Ventaja: Balance entre completitud y velocidad
- Desventaja: Más cambios iterativos

### Opción C: Aprobación del Usuario
**¿Cuál prefieres?**
- Completar TODO ahora (Opción A)
- Criticals now + resto después (Opción B)
- Otro enfoque

---

**Próximo paso:** Esperar dirección del usuario para continuar con Fase 1.4 o pasar a Fase 2

