# Guía de Aplicación - Migraciones Fase 2

## Orden Correcto de Migraciones

Para completar la Fase 2 (Codificación CIE-11), aplica las migraciones en este orden:

### 1. **Maestros de Ubicación (DEBE ser primero)**
```
supabase/migrations/20260604_023_maestros_ubicacion.sql
```
**Qué hace:**
- Crea tabla `hosix_provincias` (8 provincias)
- Crea tabla `hosix_distritos_sanitarios` (19 distritos)
- Agrega FKs a `centros_salud`
- Crea vista `vista_centros_ubicacion` para compatibilidad
- Ejecuta migración de datos legacy

**Errores esperados:** NINGUNO (tiene `IF NOT EXISTS` y `ON CONFLICT`)

---

### 2. **Integración CIE-11 (depende de maestros)**
```
supabase/migrations/20260603_022_cie11_integracion.sql
```
**Qué hace:**
- Crea tabla `hosix_cie11_cache`
- Agrega columnas CIE-11 a tablas clínicas
- Crea índices y RLS policies
- **AHORA CORREGIDA:** Vista BI usa `COALESCE(p.provincia, cs.provincia)` en lugar de `cs.provincia`

**Errores esperados:** NINGUNO (ahora está corregida)

---

## Pasos en Supabase Dashboard

### Opción A: Aplicar mediante SQL Editor

1. Abre **SQL Editor** en Supabase Dashboard
2. Copia y pega el contenido completo de `20260604_023_maestros_ubicacion.sql`
3. Ejecuta (Ctrl+Enter o botón RUN)
4. Espera confirmación: `Query successful - X rows affected`
5. Repite pasos 2-4 con `20260603_022_cie11_integracion.sql`

### Opción B: Aplicar mediante CLI (si tienes acceso)

```bash
# Desde directorio del proyecto
supabase db push

# Esto aplicará automáticamente todas las migraciones pendientes en orden
```

---

## Verificación Post-Migración

### 1. Verificar maestros cargados
```sql
-- Debería mostrar 8 provincias
SELECT COUNT(*) FROM hosix_provincias;

-- Debería mostrar 19 distritos
SELECT COUNT(*) FROM hosix_distritos_sanitarios;

-- Debería mostrar distritos con referencias a provincias
SELECT ds.nombre_sanitario, p.nombre 
FROM hosix_distritos_sanitarios ds
JOIN hosix_provincias p ON ds.provincia_id = p.id
LIMIT 5;
```

### 2. Verificar migración de datos legacy
```sql
-- Debería mostrar ALGUNOS centros con provincia_id completado
SELECT COUNT(*) FROM centros_salud WHERE provincia_id IS NOT NULL;

-- Debería mostrar centros aún sin provincia_id (si los datos son inconsistentes)
SELECT COUNT(*) FROM centros_salud WHERE provincia_id IS NULL;
```

### 3. Verificar vista CIE-11
```sql
-- Debería funcionar sin errores
SELECT COUNT(*) FROM hosix_bi_morbilidad_cie11;

-- Debería mostrar diagnósticos con provincia
SELECT DISTINCT provincia FROM hosix_bi_morbilidad_cie11 LIMIT 5;
```

### 4. Verificar vista de consolidación
```sql
-- Debería mostrar centros con ubicación consolidada
SELECT * FROM vista_centros_ubicacion LIMIT 5;
```

---

## Problemas Comunes y Soluciones

### ❌ Error: "42703: column cs.provincia does not exist"
**Causa:** Aplicaste `20260603_022_cie11_integracion.sql` sin aplicar antes `20260604_023_maestros_ubicacion.sql`
**Solución:** Aplica primero `20260604_023_maestros_ubicacion.sql`, luego la otra

### ❌ Error: "23505: duplicate key value violates unique constraint"
**Causa:** Ya existen registros en las tablas maestras
**Solución:** Las inserciones tienen `ON CONFLICT ... DO NOTHING`, así que es seguro ejecutar de nuevo

### ❌ Error: "23502: NOT NULL constraint violation"
**Causa:** Datos inconsistentes en `centros_salud`
**Solución:** 
```sql
-- Verifica cuáles centros faltan provincia
SELECT id, nombre, provincia FROM centros_salud WHERE provincia IS NULL;

-- Completa manualmente o importa desde vista legacy
```

---

## Próximo Paso: Cargar Catálogo CIE-11

Una vez verificadas las migraciones, necesitarás cargar los códigos CIE-11 en `hosix_cie11_cache`:

```sql
-- Esto se hará con una migración separada o mediante Edge Function
-- que consulte el ICD API del contenedor Docker en puerto 8090

-- Por ahora, la tabla está vacía pero lista para recibir datos
SELECT COUNT(*) FROM hosix_cie11_cache; -- Debería mostrar 0
```

---

## Resumen de Cambios de BD

| Tabla Creada | Descripción | Registros Seed |
|---|---|---|
| `hosix_provincias` | Maestro de provincias | 8 |
| `hosix_distritos_sanitarios` | Maestro de distritos | 19 |
| `hosix_cie11_cache` | Caché de códigos CIE-11 | 0 (a cargar) |

| Tabla Modificada | Cambios | Notas |
|---|---|---|
| `centros_salud` | +provincia_id FK, +distrito_sanitario_id_fk | No destructivo |
| (Nueva vista) | `vista_centros_ubicacion` | Compatibilidad con datos legacy |

| Vista Creada | Descripción |
|---|---|
| `hosix_bi_morbilidad_cie11` | BI consolidada (diagnósticos + urgencias + hospitalizaciones) |
| `vista_centros_ubicacion` | Consolidación de ubicación |

---

**Estado:** ✅ Listo para aplicar  
**Dependencias:** Ninguna (auto-contencidas)  
**Riesgo:** BAJO (todas las operaciones son aditivas o protegidas con `IF NOT EXISTS`)
