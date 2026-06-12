-- =====================================================================
-- TRIGGERS DE REPLICACIÓN AUTOMÁTICA (RENAPROSA → NODO_CENTRAL)
-- Centros de Salud y Profesionales Sanitarios
-- =====================================================================

-- =====================================================================
-- TRIGGER 1: Replicar Distritos Sanitarios (public.distrito_sanitario → nodo_central)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.fn_trigger_sincronizar_distrito()
RETURNS TRIGGER AS $$
BEGIN
  -- Sincronizar a nodo_central cuando se inserta o actualiza un distrito
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    PERFORM nodo_central.fn_sincronizar_distrito(
      NEW.nombre_distrito,
      NEW.codigo_provincia::varchar(10),
      NEW.nombre_provincia,
      NEW.codigo_distrito::varchar(10)
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block the operation
  INSERT INTO nodo_central.sincronizacion_log (tipo_evento, entidad_tipo, estado, mensaje_error)
  VALUES ('trigger_error', 'distrito', 'error', SQLERRM);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sincronizar_distrito ON public.distrito_sanitario;

CREATE TRIGGER trg_sincronizar_distrito
  AFTER INSERT OR UPDATE ON public.distrito_sanitario
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_trigger_sincronizar_distrito();

-- =====================================================================
-- TRIGGER 2: Replicar Centros de Salud (public.centros_salud → nodo_central)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.fn_trigger_sincronizar_centro()
RETURNS TRIGGER AS $$
BEGIN
  -- Sincronizar a nodo_central cuando se inserta o actualiza un centro
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    PERFORM nodo_central.fn_sincronizar_centro(
      COALESCE(NEW.id, gen_random_uuid()),
      NEW.nombre,
      NEW.categoria,
      NEW.provincia,
      NEW.distrito,
      NEW.nombre_distrito,  -- district_sanitario
      NEW.sector,
      NEW.director,
      NEW.telefono,
      NEW.especialidades,
      NEW.estado,
      NEW.numero_registro,
      NEW.fecha_registro,
      NEW.subcategoria,
      NEW.nif,
      NEW.responsable,
      NEW.fotos_establecimiento
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block the operation
  INSERT INTO nodo_central.sincronizacion_log (tipo_evento, entidad_tipo, entidad_id, estado, mensaje_error)
  VALUES ('trigger_error', 'centro', COALESCE(NEW.id, gen_random_uuid()), 'error', SQLERRM);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sincronizar_centro ON public.centros_salud;

CREATE TRIGGER trg_sincronizar_centro
  AFTER INSERT OR UPDATE ON public.centros_salud
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_trigger_sincronizar_centro();

-- =====================================================================
-- TRIGGER 3: Replicar Profesionales (public.profesionales_sanitarios → nodo_central)
-- Solo Aprobados
-- =====================================================================
CREATE OR REPLACE FUNCTION public.fn_trigger_sincronizar_profesional()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo sincronizar profesionales aprobados
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.estado_solicitud = 'Aprobado' THEN
      PERFORM nodo_central.fn_sincronizar_profesional(
        NEW.id,
        NEW.nombre_completo,
        NEW.numero_dip,
        NEW.area_profesional,
        NEW.centro_salud_id,
        NEW.nombre_centro,
        NEW.distrito_sanitario,
        NEW.estado_solicitud
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block the operation
  INSERT INTO nodo_central.sincronizacion_log (tipo_evento, entidad_tipo, entidad_id, estado, mensaje_error)
  VALUES ('trigger_error', 'profesional', NEW.id, 'error', SQLERRM);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sincronizar_profesional ON public.profesionales_sanitarios;

CREATE TRIGGER trg_sincronizar_profesional
  AFTER INSERT OR UPDATE ON public.profesionales_sanitarios
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_trigger_sincronizar_profesional();

-- =====================================================================
-- SINCRONIZACIÓN INICIAL: Cargar datos existentes de RENAPROSA
-- =====================================================================

-- 1. Sincronizar todos los distritos existentes
INSERT INTO nodo_central.distritos_sanitarios_copia (
  nombre_distrito, abreviatura_provincia, nombre_provincia, abreviatura_distrito,
  sincronizado_desde_renaprosa, version_renaprosa
)
SELECT DISTINCT
  d.nombre_distrito,
  d.codigo_provincia::varchar(10),
  d.nombre_provincia,
  d.codigo_distrito::varchar(10),
  now(),
  1
FROM public.distrito_sanitario d
ON CONFLICT (nombre_distrito) DO NOTHING;

-- 2. Sincronizar todos los centros de salud
INSERT INTO nodo_central.centros_salud_copia (
  id, nombre, categoria, provincia, distrito, distrito_sanitario,
  sector, director, telefono, especialidades, estado, numero_registro,
  fecha_registro, subcategoria, nif, responsable, fotos_establecimiento,
  sincronizado_desde_renaprosa, version_renaprosa
)
SELECT DISTINCT
  c.id,
  c.nombre,
  c.categoria,
  c.provincia,
  c.distrito,
  c.nombre_distrito,
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
  now(),
  1
FROM public.centros_salud c
ON CONFLICT (id) DO NOTHING;

-- 3. Sincronizar profesionales aprobados
INSERT INTO nodo_central.profesionales_copia (
  id, nombre_completo, numero_dip, area_profesional,
  especialidad, provincia, distrito, distrito_sanitario,
  categoria_centro, tipo_sector, centro_salud_id, nombre_centro,
  estado_solicitud, fecha_aprobacion, funcion_publica, estatus_funcionario,
  sincronizado_desde_renaprosa, version_renaprosa
)
SELECT DISTINCT
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
  p.fecha_aprobacion,
  p.funcion_publica,
  p.estatus_funcionario,
  now(),
  1
FROM public.profesionales_sanitarios p
WHERE p.estado_solicitud = 'Aprobado'
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- LOG DE SINCRONIZACIÓN INICIAL
-- =====================================================================
INSERT INTO nodo_central.sincronizacion_log (tipo_evento, entidad_tipo, estado, datos_nuevos)
VALUES (
  'sincronizacion_inicial_completada',
  'sistema',
  'exitoso',
  jsonb_build_object(
    'distritos', (SELECT COUNT(*) FROM nodo_central.distritos_sanitarios_copia),
    'centros', (SELECT COUNT(*) FROM nodo_central.centros_salud_copia),
    'profesionales', (SELECT COUNT(*) FROM nodo_central.profesionales_copia),
    'timestamp', now()::text
  )
);

-- =====================================================================
-- VERIFICACIÓN
-- =====================================================================
SELECT '=== TRIGGERS DE REPLICACIÓN ACTIVADOS ===' as estado;
SELECT COUNT(*) as distritos_sincronizados FROM nodo_central.distritos_sanitarios_copia;
SELECT COUNT(*) as centros_sincronizados FROM nodo_central.centros_salud_copia;
SELECT COUNT(*) as profesionales_sincronizados FROM nodo_central.profesionales_copia;
SELECT COUNT(*) as eventos_log FROM nodo_central.sincronizacion_log;
