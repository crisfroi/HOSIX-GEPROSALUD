-- ============================================================================
-- SCRIPT DE VALIDACIÓN DE TABLAS Y SEED DATA - FASE 1 MAESTROS
-- ============================================================================
-- Ejecutar en: Supabase SQL Editor
-- Propósito: Verificar que todas las migraciones se aplicaron correctamente

-- ============================================================================
-- 1. VERIFICACIÓN DE MIGRACIONES APLICADAS
-- ============================================================================

-- Contar todas las tablas hosix
SELECT 
  COUNT(*) as total_tablas_hosix,
  COUNT(*) FILTER (WHERE table_name LIKE '%maestros%') as tablas_maestros
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'hosix_%';

-- Listar todas las tablas en orden alfabético
SELECT table_name, 
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'public' AND table_name = t.table_name) as columnas
FROM information_schema.tables t
WHERE table_schema = 'public' AND table_name LIKE 'hosix_%'
ORDER BY table_name;

-- ============================================================================
-- 2. VERIFICACIÓN DE ESTRUCTURAS ESPECÍFICAS
-- ============================================================================

-- Verificar tablas críticas existen
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hosix_especialidades_medicas') THEN '✅' ELSE '❌' END || ' hosix_especialidades_medicas' as estado,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hosix_unidades_funcionales') THEN '✅' ELSE '❌' END || ' hosix_unidades_funcionales' as estado,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hosix_roles_organizacionales') THEN '✅' ELSE '❌' END || ' hosix_roles_organizacionales' as estado,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hosix_cualificaciones_profesionales') THEN '✅' ELSE '❌' END || ' hosix_cualificaciones_profesionales' as estado,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hosix_zonas_cobertura') THEN '✅' ELSE '❌' END || ' hosix_zonas_cobertura' as estado,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hosix_proveedores') THEN '✅' ELSE '❌' END || ' hosix_proveedores' as estado,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hosix_material_medico') THEN '✅' ELSE '❌' END || ' hosix_material_medico' as estado,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hosix_servicios_terceros') THEN '✅' ELSE '❌' END || ' hosix_servicios_terceros' as estado,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hosix_parametros_sistema') THEN '✅' ELSE '❌' END || ' hosix_parametros_sistema' as estado,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hosix_politicas_seguridad') THEN '✅' ELSE '❌' END || ' hosix_politicas_seguridad' as estado;

-- ============================================================================
-- 3. VERIFICACIÓN DE SEED DATA
-- ============================================================================

-- Contar registros en cada tabla maestra
SELECT 
  'hosix_especialidades_medicas' as tabla,
  COUNT(*) as registros,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM hosix_especialidades_medicas

UNION ALL

SELECT 'hosix_unidades_funcionales', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END
FROM hosix_unidades_funcionales

UNION ALL

SELECT 'hosix_roles_organizacionales', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END
FROM hosix_roles_organizacionales

UNION ALL

SELECT 'hosix_cualificaciones_profesionales', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END
FROM hosix_cualificaciones_profesionales

UNION ALL

SELECT 'hosix_zonas_cobertura', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END
FROM hosix_zonas_cobertura

UNION ALL

SELECT 'hosix_proveedores', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END
FROM hosix_proveedores

UNION ALL

SELECT 'hosix_material_medico', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END
FROM hosix_material_medico

UNION ALL

SELECT 'hosix_servicios_terceros', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END
FROM hosix_servicios_terceros

UNION ALL

SELECT 'hosix_parametros_sistema', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END
FROM hosix_parametros_sistema

UNION ALL

SELECT 'hosix_politicas_seguridad', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END
FROM hosix_politicas_seguridad

UNION ALL

SELECT 'hosix_provincias', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END
FROM hosix_provincias

UNION ALL

SELECT 'hosix_distritos_sanitarios', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END
FROM hosix_distritos_sanitarios

ORDER BY tabla;

-- ============================================================================
-- 4. VERIFICACIÓN DE CAMPOS REQUERIDOS
-- ============================================================================

-- Validar que campos críticos existen con tipos correctos
SELECT 
  'hosix_especialidades_medicas' as tabla,
  column_name,
  data_type,
  is_nullable,
  CASE WHEN column_name IN ('id', 'codigo', 'nombre', 'activo') THEN '✅ CRÍTICO' ELSE '⚪' END as criticidad
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'hosix_especialidades_medicas'
ORDER BY ordinal_position

UNION ALL

SELECT 
  'hosix_roles_organizacionales',
  column_name,
  data_type,
  is_nullable,
  CASE WHEN column_name IN ('id', 'codigo', 'nombre', 'nivel_jerarquico', 'activo') THEN '✅ CRÍTICO' ELSE '⚪' END
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'hosix_roles_organizacionales'
ORDER BY ordinal_position;

-- ============================================================================
-- 5. VERIFICACIÓN DE RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- Verificar que RLS está habilitada en todas las tablas
SELECT 
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN '✅ RLS ACTIVO' ELSE '❌ RLS INACTIVO' END as estado
FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'hosix_%'
ORDER BY tablename;

-- Contar políticas RLS por tabla
SELECT 
  schemaname,
  tablename,
  COUNT(*) as num_policies,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM pg_policies
WHERE schemaname = 'public' AND tablename LIKE 'hosix_%'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- ============================================================================
-- 6. VERIFICACIÓN DE ÍNDICES
-- ============================================================================

-- Verificar que índices fueron creados
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename LIKE 'hosix_especialidades%' OR tablename LIKE 'hosix_roles_%' OR tablename LIKE 'hosix_proveedores'
ORDER BY tablename, indexname;

-- ============================================================================
-- 7. VERIFICACIÓN DE INTEGRIDAD REFERENCIAL
-- ============================================================================

-- Verificar foreign keys principales
SELECT 
  constraint_name,
  table_name,
  column_name,
  CASE WHEN constraint_name LIKE '%fk%' OR constraint_name LIKE '%fkey%' THEN '✅ FK' ELSE '⚪' END as tipo
FROM information_schema.key_column_usage
WHERE table_schema = 'public' 
  AND table_name IN ('hosix_zonas_cobertura', 'hosix_material_medico', 'hosix_servicios_terceros')
  AND column_name NOT LIKE 'id'
ORDER BY table_name, column_name;

-- ============================================================================
-- 8. VERIFICACIÓN DE SAMPLE DATA
-- ============================================================================

-- Ver primeros registros de tablas con seed data
SELECT 'ESPECIALIDADES' as seccion, codigo, nombre FROM hosix_especialidades_medicas LIMIT 3
UNION ALL
SELECT 'PARAMETROS', codigo, nombre FROM hosix_parametros_sistema LIMIT 3
UNION ALL
SELECT 'PROVINCIAS', codigo, nombre FROM hosix_provincias LIMIT 3;

-- ============================================================================
-- 9. VERIFICACIÓN DE UNICIDAD
-- ============================================================================

-- Verificar UNIQUE constraints en campos código
SELECT 
  constraint_name,
  table_name,
  column_name
FROM information_schema.constraint_column_usage
WHERE table_schema = 'public' 
  AND constraint_name LIKE '%codigo%' OR constraint_name LIKE '%unique%'
ORDER BY table_name;

-- ============================================================================
-- 10. RESUMEN EJECUTIVO
-- ============================================================================

-- Resumen final
SELECT 
  'TABLAS MAESTROS' as categoria,
  COUNT(*) as cantidad,
  'Creadas' as estado
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'hosix_%'

UNION ALL

SELECT 
  'REGISTROS SEED DATA',
  (SELECT COUNT(*) FROM hosix_especialidades_medicas) + 
  (SELECT COUNT(*) FROM hosix_parametros_sistema) +
  (SELECT COUNT(*) FROM hosix_provincias) +
  (SELECT COUNT(*) FROM hosix_distritos_sanitarios),
  'Cargados'

UNION ALL

SELECT 
  'RLS POLICIES',
  COUNT(*),
  'Configuradas'
FROM pg_policies
WHERE schemaname = 'public' AND tablename LIKE 'hosix_%';

-- ============================================================================
-- NOTAS DE EJECUCIÓN
-- ============================================================================

/*
PASOS:
1. Copiar todo el contenido de este archivo
2. Ir a Supabase Dashboard > SQL Editor
3. Crear "Nueva Query"
4. Pegar contenido
5. Ejecutar secciones una a una o todo junto
6. Revisar resultados

INTERPRETACIÓN:
- ✅ = OK / Correcto
- ❌ = ERROR / No existe o no configurado
- ⚪ = Información / No crítico
- ⚠️ = Advertencia / Revisar

ERRORES COMUNES:
- "Table does not exist": Migración no aplicada. Ver Supabase > Migrations
- "No rows affected": No hay seed data. Ejecutar seed queries
- "RLS INACTIVO": Falta ALTER TABLE ... ENABLE ROW LEVEL SECURITY
*/
