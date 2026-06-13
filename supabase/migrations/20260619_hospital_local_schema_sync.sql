-- =====================================================================
-- Hospital Local Schema - Tablas locales para sincronización offline-first
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS hospital_local;

-- =====================================================================
-- 1. Copia local de distritos sanitarios
-- =====================================================================
CREATE TABLE hospital_local.distritos_sincronizado (
  nombre_distrito TEXT PRIMARY KEY,
  abreviatura_provincia VARCHAR,
  nombre_provincia VARCHAR,
  abreviatura_distrito VARCHAR,
  sincronizado_desde_renaprosa TIMESTAMP WITH TIME ZONE,
  version_renaprosa INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================================
-- 2. Copia local de centros de salud
-- =====================================================================
CREATE TABLE hospital_local.centros_salud_sincronizado (
  id UUID PRIMARY KEY,
  nombre VARCHAR NOT NULL UNIQUE,
  categoria TEXT NOT NULL,
  subcategoria TEXT,
  provincia TEXT NOT NULL,
  distrito TEXT NOT NULL,
  distrito_sanitario TEXT,
  sector TEXT NOT NULL,
  director TEXT,
  telefono TEXT,
  especialidades TEXT[],
  estado TEXT DEFAULT 'Activo',
  numero_registro TEXT,
  fecha_registro TIMESTAMP WITH TIME ZONE,
  nif TEXT,
  responsable TEXT,
  fotos_establecimiento TEXT[],
  sincronizado_desde_renaprosa TIMESTAMP WITH TIME ZONE,
  version_renaprosa INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (distrito_sanitario) REFERENCES hospital_local.distritos_sincronizado(nombre_distrito)
);

-- =====================================================================
-- 3. Copia local de profesionales sanitarios
-- =====================================================================
CREATE TABLE hospital_local.profesionales_sincronizado (
  id UUID PRIMARY KEY,
  nombre_completo VARCHAR NOT NULL,
  numero_dip VARCHAR,
  area_profesional VARCHAR,
  especialidad VARCHAR,
  provincia VARCHAR,
  distrito VARCHAR,
  distrito_sanitario VARCHAR,
  categoria_centro VARCHAR,
  tipo_sector VARCHAR,
  centro_salud_id UUID,
  nombre_centro VARCHAR,
  estado_solicitud VARCHAR,
  fecha_aprobacion TIMESTAMP WITH TIME ZONE,
  funcion_publica BOOLEAN,
  estatus_funcionario VARCHAR,
  sincronizado_desde_renaprosa TIMESTAMP WITH TIME ZONE,
  version_renaprosa INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (centro_salud_id) REFERENCES hospital_local.centros_salud_sincronizado(id)
);

-- =====================================================================
-- 4. Pacientes maestro local (copia de central)
-- =====================================================================
CREATE TABLE hospital_local.pacientes_maestro_local (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hcu VARCHAR NOT NULL UNIQUE,
  cedula VARCHAR NOT NULL UNIQUE,
  nombre VARCHAR NOT NULL,
  apellido VARCHAR NOT NULL,
  fecha_nacimiento DATE,
  genero VARCHAR,
  estado VARCHAR DEFAULT 'activo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================================
-- 5. Pacientes pendientes de sincronización
-- =====================================================================
CREATE TABLE hospital_local.pacientes_pendientes_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hcu VARCHAR,
  cedula VARCHAR NOT NULL UNIQUE,
  nombre VARCHAR NOT NULL,
  apellido VARCHAR NOT NULL,
  fecha_nacimiento DATE,
  genero VARCHAR,
  nombre_distrito VARCHAR,
  estado VARCHAR DEFAULT 'pendiente', -- pendiente, sincronizado, error
  intentos INTEGER DEFAULT 0,
  ultimo_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================================
-- 6. Cola de cambios para sincronización
-- =====================================================================
CREATE TABLE hospital_local.sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_entidad VARCHAR NOT NULL, -- paciente, cita, receta, resultado, etc
  accion VARCHAR NOT NULL, -- crear, actualizar, eliminar
  entidad_id VARCHAR,
  datos JSONB,
  estado VARCHAR DEFAULT 'pendiente', -- pendiente, procesado, error
  prioridad INTEGER DEFAULT 0,
  intentos INTEGER DEFAULT 0,
  ultimo_error TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
  fecha_envio TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================================
-- 7. Log local de sincronización
-- =====================================================================
CREATE TABLE hospital_local.sync_log_local (
  id BIGSERIAL PRIMARY KEY,
  tipo_evento VARCHAR NOT NULL,
  entidad_tipo VARCHAR,
  entidad_id UUID,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  estado VARCHAR DEFAULT 'exitoso', -- exitoso, error
  mensaje_error TEXT,
  usuario_id UUID,
  fecha_ultimo_intento TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================================
-- Índices para mejor performance
-- =====================================================================
CREATE INDEX idx_centros_salud_distrito ON hospital_local.centros_salud_sincronizado(distrito_sanitario);
CREATE INDEX idx_profesionales_centro ON hospital_local.profesionales_sincronizado(centro_salud_id);
CREATE INDEX idx_pacientes_maestro_hcu ON hospital_local.pacientes_maestro_local(hcu);
CREATE INDEX idx_pacientes_maestro_cedula ON hospital_local.pacientes_maestro_local(cedula);
CREATE INDEX idx_pacientes_pendientes_estado ON hospital_local.pacientes_pendientes_sync(estado);
CREATE INDEX idx_sync_queue_estado ON hospital_local.sync_queue(estado);
CREATE INDEX idx_sync_queue_tipo ON hospital_local.sync_queue(tipo_entidad);
CREATE INDEX idx_sync_log_tipo ON hospital_local.sync_log_local(tipo_evento);
CREATE INDEX idx_sync_log_fecha ON hospital_local.sync_log_local(fecha_ultimo_intento);

-- =====================================================================
-- RLS - Sin restricción, acceso local completo
-- =====================================================================
ALTER TABLE hospital_local.distritos_sincronizado ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_local.centros_salud_sincronizado ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_local.profesionales_sincronizado ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_local.pacientes_maestro_local ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_local.pacientes_pendientes_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_local.sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_local.sync_log_local ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hospital_local_all_access"
ON hospital_local.distritos_sincronizado FOR ALL USING (true);

CREATE POLICY "hospital_local_all_access"
ON hospital_local.centros_salud_sincronizado FOR ALL USING (true);

CREATE POLICY "hospital_local_all_access"
ON hospital_local.profesionales_sincronizado FOR ALL USING (true);

CREATE POLICY "hospital_local_all_access"
ON hospital_local.pacientes_maestro_local FOR ALL USING (true);

CREATE POLICY "hospital_local_all_access"
ON hospital_local.pacientes_pendientes_sync FOR ALL USING (true);

CREATE POLICY "hospital_local_all_access"
ON hospital_local.sync_queue FOR ALL USING (true);

CREATE POLICY "hospital_local_all_access"
ON hospital_local.sync_log_local FOR ALL USING (true);

-- =====================================================================
-- GRANTS
-- =====================================================================
GRANT USAGE ON SCHEMA hospital_local TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA hospital_local TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA hospital_local TO authenticated;

SELECT '=== Hospital Local Schema Created ===' as estado;
