-- =====================================================================
-- Vista unificada de pacientes
-- Combina hosix_pacientes con hospital_local.pacientes_maestro_local
-- =====================================================================

-- Primero, agregamos columnas a hosix_pacientes si no existen
ALTER TABLE public.hosix_pacientes ADD COLUMN IF NOT EXISTS hcu VARCHAR;
ALTER TABLE public.hosix_pacientes ADD COLUMN IF NOT EXISTS cedula VARCHAR UNIQUE;
ALTER TABLE public.hosix_pacientes ADD COLUMN IF NOT EXISTS sincronizado_desde_central TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.hosix_pacientes ADD COLUMN IF NOT EXISTS origen VARCHAR DEFAULT 'local'; -- 'local', 'central', 'pendiente'
ALTER TABLE public.hosix_pacientes ADD COLUMN IF NOT EXISTS estado_sincronizacion VARCHAR DEFAULT 'pendiente'; -- 'pendiente', 'sincronizado', 'error'

-- Crear vista unificada que combina ambas fuentes
CREATE OR REPLACE VIEW public.vw_pacientes_unificados AS
SELECT
  COALESCE(h.id, 'sys_' || l.cedula) AS id,
  h.ppi,
  h.primer_nombre AS nombre,
  h.primer_apellido AS apellido,
  COALESCE(h.cedula, l.cedula) AS cedula,
  COALESCE(h.hcu, l.hcu) AS hcu,
  h.numero_documento,
  h.tipo_documento,
  h.fecha_nacimiento,
  h.telefono_movil,
  h.email,
  h.activo,
  h.fallecido,
  COALESCE(h.origen, CASE 
    WHEN l.cedula IS NOT NULL THEN 'central'
    ELSE 'local'
  END) AS origen,
  COALESCE(h.estado_sincronizacion, 
    CASE 
      WHEN l.cedula IS NOT NULL THEN 'sincronizado'
      ELSE 'pendiente'
    END
  ) AS estado_sincronizacion,
  h.sincronizado_desde_central,
  h.created_at,
  h.updated_at,
  CASE 
    WHEN h.id IS NOT NULL AND l.cedula IS NOT NULL THEN 'ambas'
    WHEN h.id IS NOT NULL THEN 'hosix'
    WHEN l.cedula IS NOT NULL THEN 'hospital_local'
  END AS fuente
FROM 
  public.hosix_pacientes h
FULL OUTER JOIN 
  hospital_local.pacientes_maestro_local l ON h.cedula = l.cedula
ORDER BY 
  COALESCE(h.primer_apellido, l.apellido),
  COALESCE(h.primer_nombre, l.nombre);

-- Trigger para sincronizar inserciones de hospital_local a hosix_pacientes
CREATE OR REPLACE FUNCTION public.fn_sincronizar_paciente_central()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando se inserta un paciente en hospital_local (viene de sync-pull)
  -- Intentamos crear/actualizar la fila en hosix_pacientes
  
  INSERT INTO public.hosix_pacientes (
    cedula,
    primer_nombre,
    primer_apellido,
    hcu,
    origen,
    estado_sincronizacion,
    sincronizado_desde_central
  ) VALUES (
    NEW.cedula,
    NEW.nombre,
    NEW.apellido,
    NEW.hcu,
    'central',
    'sincronizado',
    NEW.sincronizado_desde_central
  )
  ON CONFLICT (cedula) DO UPDATE SET
    hcu = EXCLUDED.hcu,
    origen = 'central',
    estado_sincronizacion = 'sincronizado',
    sincronizado_desde_central = EXCLUDED.sincronizado_desde_central,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a inserciones/actualizaciones en hospital_local.pacientes_maestro_local
DROP TRIGGER IF EXISTS trg_sincronizar_paciente_central 
ON hospital_local.pacientes_maestro_local;

CREATE TRIGGER trg_sincronizar_paciente_central
AFTER INSERT OR UPDATE ON hospital_local.pacientes_maestro_local
FOR EACH ROW
EXECUTE FUNCTION public.fn_sincronizar_paciente_central();

-- Trigger para cuando se crea paciente pendiente localmente
CREATE OR REPLACE FUNCTION public.fn_paciente_pendiente_local()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando se inserta un paciente en pacientes_pendientes_sync
  -- Creamos un registro provisional en hosix_pacientes
  
  INSERT INTO public.hosix_pacientes (
    cedula,
    primer_nombre,
    primer_apellido,
    hcu,
    origen,
    estado_sincronizacion
  ) VALUES (
    NEW.cedula,
    NEW.nombre,
    NEW.apellido,
    NEW.hcu_temporal,
    'local',
    'pendiente'
  )
  ON CONFLICT (cedula) DO UPDATE SET
    hcu = COALESCE(EXCLUDED.hcu, hosix_pacientes.hcu),
    estado_sincronizacion = 'pendiente',
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a inserciones en hospital_local.pacientes_pendientes_sync
DROP TRIGGER IF EXISTS trg_paciente_pendiente_local 
ON hospital_local.pacientes_pendientes_sync;

CREATE TRIGGER trg_paciente_pendiente_local
AFTER INSERT ON hospital_local.pacientes_pendientes_sync
FOR EACH ROW
EXECUTE FUNCTION public.fn_paciente_pendiente_local();

-- Trigger para cuando se sincroniza un paciente pendiente
CREATE OR REPLACE FUNCTION public.fn_paciente_sincronizado()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando un paciente pendiente se marca como sincronizado
  -- Actualizamos su estado en hosix_pacientes
  
  UPDATE public.hosix_pacientes
  SET
    hcu = NEW.hcu_final,
    origen = 'central',
    estado_sincronizacion = 'sincronizado',
    sincronizado_desde_central = now(),
    updated_at = now()
  WHERE cedula = NEW.cedula;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a actualizaciones en hospital_local.pacientes_pendientes_sync
DROP TRIGGER IF EXISTS trg_paciente_sincronizado 
ON hospital_local.pacientes_pendientes_sync;

CREATE TRIGGER trg_paciente_sincronizado
AFTER UPDATE ON hospital_local.pacientes_pendientes_sync
FOR EACH ROW
WHEN (NEW.estado = 'sincronizado' AND OLD.estado != 'sincronizado')
EXECUTE FUNCTION public.fn_paciente_sincronizado();

-- RLS para la vista
ALTER TABLE public.vw_pacientes_unificados OWNER TO postgres;

SELECT '=== Vista Unificada de Pacientes Creada ===' as estado;
