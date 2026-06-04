# INSTRUCCIONES - APLICAR MIGRACIONES CORREGIDAS

**Fecha:** 4 JUN 2026
**Estado:** ✅ Errores corregidos - Listo para aplicar

---

## 🔧 ERRORES CORREGIDOS

### Error 1: Migración 023 demasiado compleja
**Problema:** Intentaba crear vistas complejas cuando la tabla `centros_salud` es simple (sin provincia/distrito columns)

**Solución:** Simplificada. Ahora solo:
- Crea maestros de provincias (8) y distritos (19)
- Agrega 2 columnas FK a `centros_salud`: `provincia_id` y `distrito_sanitario_id`
- Limpio y eficiente, sin vistas innecesarias

### Error 2: ON CONFLICT sin UNIQUE constraint
**Problema:** `20260604_024` y `20260604_025` hacían `ON CONFLICT (nombre)` pero `nombre` no es UNIQUE

**Solución:** Cambiados todos los `ON CONFLICT` a usar `codigo` (que SÍ es UNIQUE) en lugar de `nombre`

---

## 📋 PASOS PARA APLICAR

### 1. Abre SQL Editor en Supabase Dashboard

https://supabase.com → Tu proyecto → SQL Editor

### 2. Aplica Migración 023 (Ubicación - SIMPLE Y EFICIENTE)

Copia Y pega todo el contenido de:
```
supabase/migrations/20260604_023_maestros_ubicacion.sql
```

Ejecuta (Ctrl+Enter). Debería mostrar: **"Queries executed successfully"**

**Qué hace esta migración:**
- ✅ Crea tabla `hosix_provincias` (8 provincias de GE)
- ✅ Crea tabla `hosix_distritos_sanitarios` (19 distritos de GE)
- ✅ Agrega 2 columnas FK a `centros_salud`: `provincia_id` y `distrito_sanitario_id`
- ✅ Crea índices para performance
- ✅ Aplicable múltiples veces sin error (IF NOT EXISTS, ON CONFLICT)

✅ Verificación:
```sql
-- Verificar maestros
SELECT COUNT(*) FROM hosix_provincias; -- Debe mostrar: 8
SELECT COUNT(*) FROM hosix_distritos_sanitarios; -- Debe mostrar: 19

-- Verificar FKs agregadas
SELECT column_name FROM information_schema.columns
WHERE table_name = 'centros_salud' AND column_name IN ('provincia_id', 'distrito_sanitario_id');
-- Debe mostrar: provincia_id, distrito_sanitario_id
```

### 3. Aplica Migración 024 (Org + RRHH)

Copia Y pega:
```
supabase/migrations/20260604_024_maestros_fase1_completo.sql
```

Ejecuta. Debería completarse sin errores.

✅ Verificación:
```sql
SELECT COUNT(*) FROM hosix_unidades_funcionales;
-- Puede ser 0 (sin seed)

SELECT COUNT(*) FROM hosix_especialidades_medicas;
-- Debe mostrar: >= 15

SELECT COUNT(*) FROM hosix_roles_organizacionales;
-- Debe mostrar: 16

SELECT COUNT(*) FROM hosix_cualificaciones_profesionales;
-- Debe mostrar: 10
```

### 4. Aplica Migración 025 (Operativos + Config)

Copia Y pega:
```
supabase/migrations/20260604_025_maestros_fase1_operativos.sql
```

Ejecuta. Debería completarse sin errores.

✅ Verificación:
```sql
SELECT COUNT(*) FROM hosix_zonas_cobertura;
-- Puede ser 0 (sin seed)

SELECT COUNT(*) FROM hosix_proveedores;
-- Puede ser 0 (sin seed)

SELECT COUNT(*) FROM hosix_parametros_sistema;
-- Debe mostrar: >= 6

SELECT COUNT(*) FROM hosix_politicas_seguridad;
-- Debe mostrar: >= 4
```

### 5. Verificación Final

Ejecuta esta query para confirmar que todas las tablas existen:

```sql
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' AND tablename LIKE 'hosix_%'
ORDER BY tablename;
```

Debería mostrar ~50+ tablas hosix_*

---

## ✅ CHECKLIST

- [ ] Migración 023 aplicada exitosamente
- [ ] Verificación 023: provincias = 8, distritos = 19
- [ ] Migración 024 aplicada exitosamente
- [ ] Verificación 024: especialidades >= 15, roles = 16, cualificaciones = 10
- [ ] Migración 025 aplicada exitosamente
- [ ] Verificación 025: parámetros >= 6, políticas >= 4
- [ ] Verificación final: ~50+ tablas hosix_*

---

## 🚨 SI AUN ASÍ OBTIENES ERRORES

Cópiame el error exacto completo para diagnosticar. Incluyendo:
1. El número de línea del error
2. El código SQL que falla
3. El mensaje de error completo

---

**Una vez completado:** Procederemos a crear los 12 UI Managers para completar Fase 1.

