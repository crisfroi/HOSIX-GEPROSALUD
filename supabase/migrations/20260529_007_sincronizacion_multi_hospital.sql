-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 007: Sincronización Multi-Hospital
-- Fecha: 2026-05-29

-- ============================================================
-- 1. TABLA MAESTRA DE HOSPITALES (CENTRAL Y LOCALES)
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_hospitales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('central', 'provincial', 'rural')),

  provincia VARCHAR(100),
  ciudad VARCHAR(100),
  direccion TEXT,

  telefono VARCHAR(50),
  email VARCHAR(255),

  es_central BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. CONFIGURACIÓN DE SINCRONIZACIÓN POR HOSPITAL
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_sync_config_hospital (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hosix_hospitales(id) UNIQUE,

  tipo_sincronizacion VARCHAR(50) NOT NULL CHECK (tipo_sincronizacion IN ('realtime', 'cron', 'manual_usb')),

  frecuencia_cron VARCHAR(50),
  proxima_sincronizacion TIMESTAMPTZ,

  url_central VARCHAR(500),
  api_key_central VARCHAR(255),

  ultimas_24h BOOLEAN DEFAULT true,

  activa BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. REGISTRO DE CAMBIOS PENDIENTES
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_sync_cambios_pendientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hosix_hospitales(id),

  tabla_nombre VARCHAR(100) NOT NULL,
  registro_id UUID NOT NULL,

  tipo_operacion VARCHAR(50) NOT NULL CHECK (tipo_operacion IN ('INSERT', 'UPDATE', 'DELETE')),

  datos_completos JSONB,
  datos_cambio JSONB,

  fecha_cambio TIMESTAMPTZ DEFAULT now(),
  sincronizado BOOLEAN DEFAULT false,
  fecha_sincronizacion TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. LOG DE SINCRONIZACIONES
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_sync_log_sincronizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hosix_hospitales(id),

  inicio_sincronizacion TIMESTAMPTZ DEFAULT now(),
  fin_sincronizacion TIMESTAMPTZ,

  total_cambios INT DEFAULT 0,
  cambios_procesados INT DEFAULT 0,
  cambios_rechazados INT DEFAULT 0,

  estado VARCHAR(50) NOT NULL DEFAULT 'iniciada' CHECK (estado IN ('iniciada', 'en_progreso', 'completada', 'fallida')),

  mensaje_error TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. TABLA DE RESOLUCIÓN DE CONFLICTOS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_sync_conflictos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hosix_hospitales(id),

  tabla_nombre VARCHAR(100) NOT NULL,
  registro_id UUID NOT NULL,

  timestamp_local TIMESTAMPTZ NOT NULL,
  timestamp_central TIMESTAMPTZ NOT NULL,

  datos_local JSONB,
  datos_central JSONB,

  estrategia_resolucion VARCHAR(50) NOT NULL CHECK (estrategia_resolucion IN ('local_wins', 'central_wins', 'merge')),

  resuelto BOOLEAN DEFAULT false,
  fecha_resolucion TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_hospitales_codigo ON hosix_hospitales(codigo);
CREATE INDEX IF NOT EXISTS idx_hospitales_tipo ON hosix_hospitales(tipo);
CREATE INDEX IF NOT EXISTS idx_hospitales_es_central ON hosix_hospitales(es_central);

CREATE INDEX IF NOT EXISTS idx_sync_config_hospital ON hosix_sync_config_hospital(hospital_id);
CREATE INDEX IF NOT EXISTS idx_sync_config_tipo ON hosix_sync_config_hospital(tipo_sincronizacion);

CREATE INDEX IF NOT EXISTS idx_cambios_pendientes_hospital ON hosix_sync_cambios_pendientes(hospital_id);
CREATE INDEX IF NOT EXISTS idx_cambios_pendientes_tabla ON hosix_sync_cambios_pendientes(tabla_nombre);
CREATE INDEX IF NOT EXISTS idx_cambios_pendientes_sincronizado ON hosix_sync_cambios_pendientes(sincronizado);
CREATE INDEX IF NOT EXISTS idx_cambios_pendientes_fecha ON hosix_sync_cambios_pendientes(fecha_cambio);

CREATE INDEX IF NOT EXISTS idx_sync_log_hospital ON hosix_sync_log_sincronizaciones(hospital_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_fecha ON hosix_sync_log_sincronizaciones(inicio_sincronizacion);
CREATE INDEX IF NOT EXISTS idx_sync_log_estado ON hosix_sync_log_sincronizaciones(estado);

CREATE INDEX IF NOT EXISTS idx_conflictos_hospital ON hosix_sync_conflictos(hospital_id);
CREATE INDEX IF NOT EXISTS idx_conflictos_tabla ON hosix_sync_conflictos(tabla_nombre);
CREATE INDEX IF NOT EXISTS idx_conflictos_resuelto ON hosix_sync_conflictos(resuelto);

-- ============================================================
-- 7. RLS POLICIES
-- ============================================================

ALTER TABLE hosix_hospitales ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_sync_config_hospital ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_sync_cambios_pendientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_sync_log_sincronizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_sync_conflictos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hospitales_read" ON hosix_hospitales FOR SELECT USING (true);
CREATE POLICY "hospitales_insert" ON hosix_hospitales FOR INSERT WITH CHECK (true);
CREATE POLICY "hospitales_update" ON hosix_hospitales FOR UPDATE USING (true);

CREATE POLICY "sync_config_read" ON hosix_sync_config_hospital FOR SELECT USING (true);
CREATE POLICY "sync_config_insert" ON hosix_sync_config_hospital FOR INSERT WITH CHECK (true);
CREATE POLICY "sync_config_update" ON hosix_sync_config_hospital FOR UPDATE USING (true);

CREATE POLICY "cambios_read" ON hosix_sync_cambios_pendientes FOR SELECT USING (true);
CREATE POLICY "cambios_insert" ON hosix_sync_cambios_pendientes FOR INSERT WITH CHECK (true);
CREATE POLICY "cambios_update" ON hosix_sync_cambios_pendientes FOR UPDATE USING (true);

CREATE POLICY "sync_log_read" ON hosix_sync_log_sincronizaciones FOR SELECT USING (true);
CREATE POLICY "sync_log_insert" ON hosix_sync_log_sincronizaciones FOR INSERT WITH CHECK (true);

CREATE POLICY "conflictos_read" ON hosix_sync_conflictos FOR SELECT USING (true);
CREATE POLICY "conflictos_insert" ON hosix_sync_conflictos FOR INSERT WITH CHECK (true);
CREATE POLICY "conflictos_update" ON hosix_sync_conflictos FOR UPDATE USING (true);

-- ============================================================
-- 8. TRIGGERS AUTOMÁTICOS PARA RASTREO DE CAMBIOS
-- ============================================================

-- Trigger para pacientes
CREATE OR REPLACE FUNCTION trigger_sync_pacientes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO hosix_sync_cambios_pendientes (hospital_id, tabla_nombre, registro_id, tipo_operacion, datos_completos)
    VALUES (OLD.hospital_id, 'hosix_pacientes', OLD.id, 'DELETE', row_to_json(OLD));
  ELSE
    INSERT INTO hosix_sync_cambios_pendientes (hospital_id, tabla_nombre, registro_id, tipo_operacion, datos_completos)
    VALUES (COALESCE(NEW.hospital_id, OLD.hospital_id), 'hosix_pacientes', NEW.id, TG_OP, row_to_json(NEW))
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_pacientes AFTER INSERT OR UPDATE OR DELETE ON hosix_pacientes
FOR EACH ROW EXECUTE FUNCTION trigger_sync_pacientes();

-- Trigger para urgencias
CREATE OR REPLACE FUNCTION trigger_sync_urgencias()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO hosix_sync_cambios_pendientes (hospital_id, tabla_nombre, registro_id, tipo_operacion, datos_completos)
    SELECT p.hospital_id, 'hosix_urgencias_episodios', OLD.id, 'DELETE', row_to_json(OLD)
    FROM hosix_pacientes p WHERE p.id = OLD.paciente_id;
  ELSE
    INSERT INTO hosix_sync_cambios_pendientes (hospital_id, tabla_nombre, registro_id, tipo_operacion, datos_completos)
    SELECT p.hospital_id, 'hosix_urgencias_episodios', NEW.id, TG_OP, row_to_json(NEW)
    FROM hosix_pacientes p WHERE p.id = NEW.paciente_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_urgencias AFTER INSERT OR UPDATE OR DELETE ON hosix_urgencias_episodios
FOR EACH ROW EXECUTE FUNCTION trigger_sync_urgencias();

-- Trigger para movimientos contables
CREATE OR REPLACE FUNCTION trigger_sync_movimientos_contables()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO hosix_sync_cambios_pendientes (hospital_id, tabla_nombre, registro_id, tipo_operacion, datos_completos)
    SELECT c.hospital_id, 'hosix_movimientos_contables', OLD.id, 'DELETE', row_to_json(OLD)
    FROM hosix_cuentas_bancarias c WHERE c.id = OLD.cuenta_id;
  ELSE
    INSERT INTO hosix_sync_cambios_pendientes (hospital_id, tabla_nombre, registro_id, tipo_operacion, datos_completos)
    SELECT c.hospital_id, 'hosix_movimientos_contables', NEW.id, TG_OP, row_to_json(NEW)
    FROM hosix_cuentas_bancarias c WHERE c.id = NEW.cuenta_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_movimientos_contables AFTER INSERT OR UPDATE OR DELETE ON hosix_movimientos_contables
FOR EACH ROW EXECUTE FUNCTION trigger_sync_movimientos_contables();
