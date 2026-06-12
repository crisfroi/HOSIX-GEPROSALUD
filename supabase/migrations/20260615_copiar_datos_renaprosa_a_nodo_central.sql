-- =====================================================================
-- COPIAR DATOS EXISTENTES: RENAPROSA → NODO_CENTRAL
-- (Los triggers ya están configurados para cambios futuros)
-- =====================================================================

-- =====================================================================
-- 1A. SINCRONIZAR DISTRITOS SANITARIOS DE public.distrito_sanitario
-- =====================================================================
INSERT INTO nodo_central.distritos_sanitarios_copia (
  nombre_distrito, abreviatura_provincia, nombre_provincia, abreviatura_distrito,
  sincronizado_desde_renaprosa, version_renaprosa
)
SELECT DISTINCT
  d.nombre_distrito,
  d.abreviatura_provincia,
  d.nombre_provincia,
  d.abreviatura_distrito,
  now() AS sincronizado_desde_renaprosa,
  1 AS version_renaprosa
FROM public.distrito_sanitario d
WHERE d.nombre_distrito IS NOT NULL
ON CONFLICT (nombre_distrito) DO NOTHING;

-- =====================================================================
-- 1B. SINCRONIZAR DISTRITOS FALTANTES DE centros_salud
-- =====================================================================
INSERT INTO nodo_central.distritos_sanitarios_copia (
  nombre_distrito, abreviatura_provincia, nombre_provincia, abreviatura_distrito,
  sincronizado_desde_renaprosa, version_renaprosa
)
SELECT DISTINCT
  c.distrito_sanitario,
  NULL::text,
  NULL::text,
  NULL::text,
  now() AS sincronizado_desde_renaprosa,
  1 AS version_renaprosa
FROM public.centros_salud c
WHERE c.distrito_sanitario IS NOT NULL
  AND c.distrito_sanitario NOT IN (SELECT nombre_distrito FROM nodo_central.distritos_sanitarios_copia)
ON CONFLICT (nombre_distrito) DO NOTHING;

-- =====================================================================
-- 2. SINCRONIZAR CENTROS DE SALUD EXISTENTES
-- =====================================================================
INSERT INTO nodo_central.centros_salud_copia (
  id, nombre, categoria, provincia, distrito, distrito_sanitario,
  sector, director, telefono, especialidades, estado, numero_registro,
  fecha_registro, subcategoria, nif, responsable, fotos_establecimiento,
  sincronizado_desde_renaprosa, version_renaprosa
)
SELECT
  c.id,
  c.nombre,
  c.categoria,
  c.provincia,
  c.distrito,
  c.distrito_sanitario,
  c.sector,
  c.director,
  c.telefono,
  c.especialidades,
  c.estado,
  c.numero_registro,
  c.fecha_registro,
  c.subcategoria,
  c.nif,
  c.responsable,
  c.fotos_establecimiento,
  now() AS sincronizado_desde_renaprosa,
  1 AS version_renaprosa
FROM public.centros_salud c
WHERE c.id IS NOT NULL AND c.nombre IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  provincia = EXCLUDED.provincia,
  distrito = EXCLUDED.distrito,
  distrito_sanitario = EXCLUDED.distrito_sanitario,
  sector = EXCLUDED.sector,
  director = EXCLUDED.director,
  telefono = EXCLUDED.telefono,
  especialidades = EXCLUDED.especialidades,
  estado = EXCLUDED.estado,
  numero_registro = EXCLUDED.numero_registro,
  fecha_registro = EXCLUDED.fecha_registro,
  subcategoria = EXCLUDED.subcategoria,
  nif = EXCLUDED.nif,
  responsable = EXCLUDED.responsable,
  fotos_establecimiento = EXCLUDED.fotos_establecimiento,
  sincronizado_desde_renaprosa = now(),
  version_renaprosa = nodo_central.centros_salud_copia.version_renaprosa + 1;

-- =====================================================================
-- 3. SINCRONIZAR PROFESIONALES SANITARIOS (SOLO APROBADOS)
-- =====================================================================
INSERT INTO nodo_central.profesionales_copia (
  id, nombre_completo, numero_dip, area_profesional,
  especialidad, provincia, distrito, distrito_sanitario,
  categoria_centro, tipo_sector, centro_salud_id, nombre_centro,
  estado_solicitud, fecha_aprobacion, funcion_publica, estatus_funcionario,
  sincronizado_desde_renaprosa, version_renaprosa
)
SELECT
  p.id,
  p.nombre_completo,
  p.numero_dip,
  p.area_profesional,
  p.especialidad,
  p.provincia,
  p.distrito,
  p.distrito_sanitario,
  p.categoria_centro,
  p.tipo_sector,
  p.centro_salud_id,
  p.nombre_centro,
  p.estado_solicitud,
  p.fecha_aprobacion::timestamptz,
  p.funcion_publica,
  p.estatus_funcionario,
  now() AS sincronizado_desde_renaprosa,
  1 AS version_renaprosa
FROM public.profesionales_sanitarios p
WHERE p.estado_solicitud = 'Aprobado'
  AND p.id IS NOT NULL
  AND p.nombre_completo IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  numero_dip = EXCLUDED.numero_dip,
  area_profesional = EXCLUDED.area_profesional,
  especialidad = EXCLUDED.especialidad,
  provincia = EXCLUDED.provincia,
  distrito = EXCLUDED.distrito,
  distrito_sanitario = EXCLUDED.distrito_sanitario,
  categoria_centro = EXCLUDED.categoria_centro,
  tipo_sector = EXCLUDED.tipo_sector,
  centro_salud_id = EXCLUDED.centro_salud_id,
  nombre_centro = EXCLUDED.nombre_centro,
  estado_solicitud = EXCLUDED.estado_solicitud,
  fecha_aprobacion = EXCLUDED.fecha_aprobacion,
  funcion_publica = EXCLUDED.funcion_publica,
  estatus_funcionario = EXCLUDED.estatus_funcionario,
  sincronizado_desde_renaprosa = now(),
  version_renaprosa = nodo_central.profesionales_copia.version_renaprosa + 1;

-- =====================================================================
-- LOG DE SINCRONIZACIÓN
-- =====================================================================
INSERT INTO nodo_central.sincronizacion_log (tipo_evento, entidad_tipo, estado, datos_nuevos)
SELECT
  'copia_datos_renaprosa_completada',
  'sistema',
  'exitoso',
  jsonb_build_object(
    'distritos_copiados', (SELECT COUNT(*) FROM nodo_central.distritos_sanitarios_copia),
    'centros_copiados', (SELECT COUNT(*) FROM nodo_central.centros_salud_copia),
    'profesionales_copiados', (SELECT COUNT(*) FROM nodo_central.profesionales_copia),
    'timestamp', now()::text
  );

-- =====================================================================
-- VERIFICACIÓN Y RESUMEN
-- =====================================================================
SELECT '=== DATOS COPIADOS A NODO_CENTRAL ===' as estado;

SELECT 
  (SELECT COUNT(*) FROM nodo_central.distritos_sanitarios_copia) as distritos_copados,
  (SELECT COUNT(*) FROM nodo_central.centros_salud_copia) as centros_copiados,
  (SELECT COUNT(*) FROM nodo_central.profesionales_copia) as profesionales_copiados,
  now()::timestamp as timestamp_sincronizacion;

-- Verificar centros por distrito
SELECT 
  d.nombre_distrito,
  COUNT(c.id) as num_centros
FROM nodo_central.distritos_sanitarios_copia d
LEFT JOIN nodo_central.centros_salud_copia c ON c.distrito_sanitario = d.nombre_distrito
GROUP BY d.nombre_distrito
ORDER BY d.nombre_distrito;

-- Verificar profesionales aprobados por centro
SELECT 
  c.nombre,
  COUNT(p.id) as num_profesionales
FROM nodo_central.centros_salud_copia c
LEFT JOIN nodo_central.profesionales_copia p ON p.centro_salud_id = c.id
GROUP BY c.nombre
HAVING COUNT(p.id) > 0
ORDER BY COUNT(p.id) DESC;
