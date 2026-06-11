-- ============================================================================
-- TEST: Verificar si las tablas de plantillas existen
-- ============================================================================

-- 1. ¿Existe el schema configuracion?
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'configuracion';

-- 2. ¿Qué tablas hay en el schema configuracion?
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'configuracion'
ORDER BY table_name;

-- 3. ¿Existe plantillas_documentos?
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'configuracion' AND table_name = 'plantillas_documentos'
) AS plantillas_documentos_existe;

-- 4. ¿Existe plantillas_campos?
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'configuracion' AND table_name = 'plantillas_campos'
) AS plantillas_campos_existe;

-- 5. ¿Existe documentos_generados?
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'configuracion' AND table_name = 'documentos_generados'
) AS documentos_generados_existe;

-- 6. Si existen, ¿cuántas plantillas hay?
SELECT COUNT(*) as total_plantillas FROM configuracion.plantillas_documentos;

-- 7. Mostrar las primeras 5 plantillas
SELECT id, codigo, nombre, grupo FROM configuracion.plantillas_documentos LIMIT 5;
