# INSTRUCCIONES - APLICAR ALMACENES + MAESTROS OPERATIVOS

**Estado:** ✅ Migraciones listas para aplicar  
**Orden:** CRÍTICO aplicar en este orden exacto

---

## 📋 ORDEN DE APLICACIÓN

### PASO 1: Fix de hosix_almacenes
**Migración:** `20260604_026_fix_hosix_almacenes.sql`

```
supabase/migrations/20260604_026_fix_hosix_almacenes.sql
```

**Qué hace:**
- ✅ Crea `hosix_almacenes` con referencia CORRECTA a `hosix_usuarios` (no `profesionales_sanitarios`)
- ✅ Crea `hosix_almacenes_depositos` (sub-depósitos dentro de almacenes)
- ✅ Crea `hosix_almacenes_stock` (inventario)
- ✅ Crea `hosix_almacenes_movimientos` (trazabilidad)
- ✅ Crea vista `vista_almacenes_responsables`
- ✅ Crea trigger automático para actualizar stock

**Aplicar en Supabase SQL Editor:**
1. Copia todo el contenido
2. Ejecuta (Ctrl+Enter)
3. Espera "Queries executed successfully"

✅ **Verificación rápida:**
```sql
SELECT COUNT(*) FROM hosix_almacenes;
-- Debe mostrar: 0 (tabla creada vacía, esperando seed data)
```

---

### PASO 2: Maestros Operativos + Configuración
**Migración:** `20260604_025_maestros_fase1_operativos.sql`

```
supabase/migrations/20260604_025_maestros_fase1_operativos.sql
```

**Qué hace:**
- ✅ Crea `hosix_zonas_cobertura`
- ✅ Crea `hosix_proveedores` (distribuidores)
- ✅ Crea `hosix_material_medico` (con FK a `hosix_almacenes` ✅)
- ✅ Crea `hosix_servicios_terceros`
- ✅ Crea `hosix_parametros_sistema` (6 parámetros seed)
- ✅ Crea `hosix_politicas_seguridad` (4 políticas seed)
- ✅ Crea vista `vista_proveedores_servicios`
- ✅ Crea función `fn_servicio_vigente()`

**Aplicar:**
1. Copia todo el contenido
2. Ejecuta
3. Espera confirmación

✅ **Verificación:**
```sql
-- Maestros creados
SELECT COUNT(*) FROM hosix_material_medico; -- 0 (vacío)
SELECT COUNT(*) FROM hosix_parametros_sistema; -- >= 6
SELECT COUNT(*) FROM hosix_politicas_seguridad; -- >= 4

-- FK funcionando
SELECT * FROM information_schema.table_constraints
WHERE table_name = 'hosix_material_medico' AND constraint_type = 'FOREIGN KEY';
-- Debe mostrar FK a hosix_almacenes
```

---

## 🔗 DEPENDENCIAS CORRECTAS

```
hosix_almacenes (20260604_026)
    ↓
    DEPENDE DE: hosix_usuarios ✅
    
hosix_material_medico (20260604_025)
    ↓
    DEPENDE DE: hosix_almacenes ✅ + hosix_proveedores ✅
    
hosix_servicios_terceros (20260604_025)
    ↓
    DEPENDE DE: hosix_proveedores ✅ + hosix_usuarios ✅
```

**Todas las referencias apuntan a tablas que EXISTEN ✅**

---

## 📊 VERIFICACIÓN FINAL

Una vez aplicadas ambas migraciones, ejecuta:

```sql
-- 1. Contar todas las nuevas tablas
SELECT count(*) as nuevas_tablas FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN (
    'hosix_almacenes',
    'hosix_almacenes_depositos',
    'hosix_almacenes_stock',
    'hosix_almacenes_movimientos',
    'hosix_zonas_cobertura',
    'hosix_proveedores',
    'hosix_material_medico',
    'hosix_servicios_terceros',
    'hosix_parametros_sistema',
    'hosix_politicas_seguridad'
  );
-- Debe mostrar: 10

-- 2. Verificar seed data
SELECT COUNT(*) FROM hosix_parametros_sistema;
-- Debe mostrar: >= 6

SELECT COUNT(*) FROM hosix_politicas_seguridad;
-- Debe mostrar: >= 4

-- 3. Verificar FK integridad
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_name LIKE 'hosix_material_medico%'
  OR table_name LIKE 'hosix_almacenes%'
ORDER BY table_name;
-- Debe mostrar todas las FK sin error
```

---

## ✅ CHECKLIST

- [ ] Migración 026 (hosix_almacenes) aplicada ✅
- [ ] Verificación: `SELECT COUNT(*) FROM hosix_almacenes;` → 0
- [ ] Migración 025 (maestros operativos) aplicada ✅
- [ ] Verificación: 10 nuevas tablas creadas
- [ ] Verificación: Parámetros sistema >= 6
- [ ] Verificación: Políticas seguridad >= 4
- [ ] Verificación: FK integridad OK

---

## 🎯 SIGUIENTE PASO

Una vez aplicadas ambas migraciones:
1. Proceder con implementación de UI Managers (si es necesario)
2. Hacer seed data de almacenes (opcional, según negocio)
3. Completar Fase 1.4 al 100%

**Tiempo estimado:** 10 minutos

---

**Estado:** 🔴 PENDIENTE APLICAR  
**Prioridad:** ALTA  
**Bloqueador:** Ninguno

