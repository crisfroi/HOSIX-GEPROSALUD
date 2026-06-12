-- =====================================================================
-- HOSPITAL LOCAL: SCHEMA PARA OPERACIÓN OFFLINE-FIRST
-- Replicación Local + Queue de Sincronización
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS hospital_local;

-- =====================================================================
-- 1. TABLAS DE RÉPLICA (Read-Only, Sincronizadas desde Central)
-- =====================================================================

CREATE TABLE hospital_local.distritos_sincronizado (
  nombre_distrito TEXT PRIMARY KEY,
  abreviatura_provincia VARCHAR(10),
  nombre_provincia VARCHAR(255),
  abreviatura_distrito VARCHAR(10),
  sincronizado_desde_central TIMESTAMPTZ,
  version_central INTEGER DEFAULT 1,
  hash_contenido VARCHAR(64),
  fecha_ultima_verificacion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_distritos_sync_prov ON hospital_local.distritos_sincronizado(abreviatura_provincia);
CREATE INDEX idx_distritos_sync_actualiz ON hospital_local.distritos_sincronizado(sincronizado_desde_central);

CREATE TABLE hospital_local.centros_salud_sincronizado (
  id UUID PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  categoria TEXT,
  subcategoria TEXT,
  provincia TEXT,
  distrito TEXT,
  distrito_sanitario TEXT,
  sector TEXT,
  director TEXT,
  telefono TEXT,
  email TEXT,
  especialidades TEXT[],
  estado TEXT DEFAULT 'Activo',
  numero_registro TEXT,
  fecha_registro TIMESTAMPTZ,
  nif TEXT,
  responsable TEXT,
  fotos_establecimiento TEXT[],
  
  sincronizado_desde_central TIMESTAMPTZ,
  version_central INTEGER DEFAULT 1,
  hash_contenido VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(nombre)
);

CREATE INDEX idx_centros_sync_nombre ON hospital_local.centros_salud_sincronizado(nombre);
CREATE INDEX idx_centros_sync_estado ON hospital_local.centros_salud_sincronizado(estado);
CREATE INDEX idx_centros_sync_distrito ON hospital_local.centros_salud_sincronizado(distrito_sanitario);

CREATE TABLE hospital_local.profesionales_sincronizado (
  id UUID PRIMARY KEY,
  nombre_completo VARCHAR(255) NOT NULL,
  numero_dip VARCHAR(50),
  area_profesional VARCHAR(255),
  especialidad VARCHAR(255),
  provincia VARCHAR(100),
  distrito VARCHAR(100),
  distrito_sanitario VARCHAR(100),
  categoria_centro VARCHAR(100),
  tipo_sector VARCHAR(50),
  centro_salud_id UUID,
  nombre_centro VARCHAR(255),
  estado_solicitud VARCHAR(50),
  fecha_aprobacion TIMESTAMPTZ,
  funcion_publica BOOLEAN,
  estatus_funcionario VARCHAR(50),
  
  sincronizado_desde_central TIMESTAMPTZ,
  version_central INTEGER DEFAULT 1,
  hash_contenido VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_prof_sync_nombre ON hospital_local.profesionales_sincronizado(nombre_completo);
CREATE INDEX idx_prof_sync_estado ON hospital_local.profesionales_sincronizado(estado_solicitud);
CREATE INDEX idx_prof_sync_centro ON hospital_local.profesionales_sincronizado(centro_salud_id);
CREATE INDEX idx_prof_sync_distrito ON hospital_local.profesionales_sincronizado(distrito_sanitario);

-- CRÍTICA: Pacientes con HCU para búsqueda rápida
CREATE TABLE hospital_local.pacientes_maestro_local (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hcu VARCHAR(50) UNIQUE NOT NULL,
  cedula VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(255),
  apellido VARCHAR(255),
  fecha_nacimiento DATE,
  genero VARCHAR(10),
  estado VARCHAR(50) DEFAULT 'activo',
  
  origen_hospital VARCHAR(50),
  sincronizado_desde_central TIMESTAMPTZ,
  version_central INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(cedula)
);

CREATE INDEX idx_pacientes_local_cedula ON hospital_local.pacientes_maestro_local(cedula);
CREATE INDEX idx_pacientes_local_hcu ON hospital_local.pacientes_maestro_local(hcu);
CREATE INDEX idx_pacientes_local_nombre ON hospital_local.pacientes_maestro_local(nombre, apellido);

-- =====================================================================
-- 2. TABLAS OPERACIONALES (Write, Local)
-- =====================================================================

CREATE TABLE hospital_local.pacientes_pendientes_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedula VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255) NOT NULL,
  fecha_nacimiento DATE,
  genero VARCHAR(10),
  nombre_distrito TEXT NOT NULL,
  centro_salud_id UUID,
  
  estado VARCHAR(50) DEFAULT 'pendiente',
  hcu_temporal VARCHAR(50) UNIQUE,
  hcu_final VARCHAR(50),
  
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  fecha_ultimo_sync_intento TIMESTAMPTZ,
  intentos_sync INTEGER DEFAULT 0,
  error_mensaje TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pendientes_cedula ON hospital_local.pacientes_pendientes_sync(cedula);
CREATE INDEX idx_pendientes_estado ON hospital_local.pacientes_pendientes_sync(estado);
CREATE INDEX idx_pendientes_hcu_temporal ON hospital_local.pacientes_pendientes_sync(hcu_temporal);

-- Cola de sincronización
CREATE TABLE hospital_local.sync_queue (
  id BIGSERIAL PRIMARY KEY,
  accion VARCHAR(50) NOT NULL,
  entidad_tipo VARCHAR(50) NOT NULL,
  entidad_id UUID NOT NULL,
  datos_anteriores JSONB,
  datos_nuevos JSONB,

  estado VARCHAR(50) DEFAULT 'pendiente',
  numero_intento INTEGER DEFAULT 0,
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  fecha_ultimo_intento TIMESTAMPTZ,
  error_mensaje TEXT,

  prioridad INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sync_queue_estado ON hospital_local.sync_queue(estado);
CREATE INDEX idx_sync_queue_prioridad ON hospital_local.sync_queue(prioridad);
CREATE INDEX idx_sync_queue_fecha ON hospital_local.sync_queue(fecha_creacion);

-- Log local de sincronización
CREATE TABLE hospital_local.sync_log_local (
  id BIGSERIAL PRIMARY KEY,
  tipo_evento VARCHAR(50),
  entidad_tipo VARCHAR(50),
  entidad_id UUID,
  detalles JSONB,
  estado VARCHAR(50),
  timestamp TIMESTAMPTZ DEFAULT now(),

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sync_log_tipo ON hospital_local.sync_log_local(tipo_evento);
CREATE INDEX idx_sync_log_timestamp ON hospital_local.sync_log_local(timestamp);

-- Mapeo de HCU temporales a reales
CREATE TABLE hospital_local.hcu_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hcu_temporal VARCHAR(50) UNIQUE NOT NULL,
  hcu_real VARCHAR(50) UNIQUE NOT NULL,
  cedula VARCHAR(20) NOT NULL,
  paciente_pendientes_id UUID REFERENCES hospital_local.pacientes_pendientes_sync(id),

  estado VARCHAR(50) DEFAULT 'completado',
  fecha_mapping TIMESTAMPTZ DEFAULT now(),

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hcu_temporal ON hospital_local.hcu_mapping(hcu_temporal);
CREATE INDEX idx_hcu_real ON hospital_local.hcu_mapping(hcu_real);
CREATE INDEX idx_cedula ON hospital_local.hcu_mapping(cedula);

-- =====================================================================
-- 3. FUNCIONES PARA OPERACIÓN LOCAL
-- =====================================================================

CREATE OR REPLACE FUNCTION hospital_local.fn_generar_hcu_temporal(
  p_nombre_distrito TEXT
)
RETURNS VARCHAR(50) AS $$
DECLARE
  v_hcu_temporal VARCHAR(50);
  v_abreviatura VARCHAR(10);
  v_timestamp VARCHAR(14);
  v_contador INTEGER;
BEGIN
  -- Obtener abreviatura del distrito
  SELECT abreviatura_distrito INTO v_abreviatura
  FROM hospital_local.distritos_sincronizado
  WHERE nombre_distrito = p_nombre_distrito;
  
  IF v_abreviatura IS NULL THEN
    v_abreviatura := 'GE';
  END IF;
  
  -- Timestamp: YYYYMMDDHHMMSS
  v_timestamp := TO_CHAR(now(), 'YYYYMMDDHHMMSS');
  
  -- Contador para ese día/hora
  v_contador := COALESCE(
    (SELECT MAX(CAST(SUBSTRING(hcu_temporal FROM 21 FOR 4) AS INTEGER))
     FROM hospital_local.pacientes_pendientes_sync
     WHERE hcu_temporal LIKE 'HCU-LOCAL-' || v_abreviatura || '-' || v_timestamp || '%'),
    0
  ) + 1;
  
  -- HCU temporal: HCU-LOCAL-[DIST]-[TIMESTAMP]-[CONTADOR]
  -- Ejemplo: HCU-LOCAL-DSR-20260614150000-0001
  v_hcu_temporal := 'HCU-LOCAL-' || v_abreviatura || '-' || v_timestamp || '-' || LPAD(v_contador::text, 4, '0');
  
  RETURN v_hcu_temporal;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estado de sincronización
CREATE OR REPLACE FUNCTION hospital_local.fn_obtener_estado_sync()
RETURNS TABLE (
  centros_locales INTEGER,
  profesionales_locales INTEGER,
  pacientes_con_hcu INTEGER,
  pacientes_pendientes INTEGER,
  cambios_en_cola INTEGER,
  ultima_sincronizacion TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM hospital_local.centros_salud_sincronizado)::INTEGER,
    (SELECT COUNT(*) FROM hospital_local.profesionales_sincronizado)::INTEGER,
    (SELECT COUNT(*) FROM hospital_local.pacientes_maestro_local)::INTEGER,
    (SELECT COUNT(*) FROM hospital_local.pacientes_pendientes_sync WHERE estado = 'pendiente')::INTEGER,
    (SELECT COUNT(*) FROM hospital_local.sync_queue WHERE estado = 'pendiente')::INTEGER,
    (SELECT MAX(sincronizado_desde_central) FROM hospital_local.distritos_sincronizado)::TIMESTAMPTZ;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 4. ROW LEVEL SECURITY
-- =====================================================================

ALTER TABLE hospital_local.distritos_sincronizado ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_local.centros_salud_sincronizado ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_local.profesionales_sincronizado ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_local.pacientes_maestro_local ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_local.pacientes_pendientes_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_local.sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_local.sync_log_local ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_local.hcu_mapping ENABLE ROW LEVEL SECURITY;

-- Políticas básicas: usuarios autenticados pueden acceder
CREATE POLICY "hospital_local_read_authenticated"
ON hospital_local.distritos_sincronizado FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "hospital_local_read_authenticated"
ON hospital_local.centros_salud_sincronizado FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "hospital_local_read_authenticated"
ON hospital_local.profesionales_sincronizado FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "hospital_local_read_authenticated"
ON hospital_local.pacientes_maestro_local FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "hospital_local_write_authenticated"
ON hospital_local.pacientes_pendientes_sync FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "hospital_local_write_authenticated"
ON hospital_local.sync_queue FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "hospital_local_write_authenticated"
ON hospital_local.sync_log_local FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "hospital_local_write_authenticated"
ON hospital_local.hcu_mapping FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- =====================================================================
-- 5. GRANTS
-- =====================================================================

GRANT USAGE ON SCHEMA hospital_local TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA hospital_local TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA hospital_local TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA hospital_local TO authenticated;
