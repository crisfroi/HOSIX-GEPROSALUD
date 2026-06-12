-- =====================================================================
-- NODO CENTRAL: SCHEMA MAESTRO NACIONAL (OPTIMIZADO)
-- Historia Clínica Única (HCU) + Sincronización Automática vía Triggers
-- =====================================================================
-- Estrategia: Triggers en RENAPROSA + Copias Locales + Funciones Idempotentes
-- Resultado: Sincronización instantánea, sin cron jobs, sin discrepancias

CREATE SCHEMA IF NOT EXISTS nodo_central;

-- =====================================================================
-- 1. COPIAS LOCALES DE DISTRITOS SANITARIOS (desde public.distrito_sanitario)
-- Sincronizadas automáticamente vía trigger desde RENAPROSA
-- =====================================================================
CREATE TABLE nodo_central.distritos_sanitarios_copia (
  nombre_distrito TEXT PRIMARY KEY,
  abreviatura_provincia VARCHAR(10),
  nombre_provincia VARCHAR(255),
  abreviatura_distrito VARCHAR(10),

  -- Sincronización
  sincronizado_desde_renaprosa TIMESTAMPTZ,
  version_renaprosa INTEGER DEFAULT 1,

  UNIQUE(nombre_distrito)
);

CREATE INDEX idx_distritos_copia_abreviatura_provincia ON nodo_central.distritos_sanitarios_copia(abreviatura_provincia);
CREATE INDEX idx_distritos_copia_nombre_distrito ON nodo_central.distritos_sanitarios_copia(nombre_distrito);

-- =====================================================================
-- 2. COPIAS LOCALES DE CENTROS (desde public.centros_salud o hosix_centros_salud)
-- Sincronizadas automáticamente vía trigger
-- =====================================================================
CREATE TABLE nodo_central.centros_salud_copia (
  id UUID PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  categoria TEXT NOT NULL,
  subcategoria TEXT,
  provincia TEXT NOT NULL,
  distrito TEXT NOT NULL,

  -- Relación a distrito sanitario
  distrito_sanitario TEXT REFERENCES nodo_central.distritos_sanitarios_copia(nombre_distrito),

  sector TEXT NOT NULL,
  director TEXT,
  telefono TEXT,
  especialidades TEXT[],
  estado TEXT DEFAULT 'Activo',
  numero_registro TEXT,
  fecha_registro TIMESTAMPTZ,
  nif TEXT,
  responsable TEXT,
  fotos_establecimiento TEXT[],

  -- Sincronización
  sincronizado_desde_renaprosa TIMESTAMPTZ,
  version_renaprosa INTEGER DEFAULT 1,

  UNIQUE(id),
  UNIQUE(nombre)
);

CREATE INDEX idx_centros_copia_nombre ON nodo_central.centros_salud_copia(nombre);
CREATE INDEX idx_centros_copia_estado ON nodo_central.centros_salud_copia(estado);
CREATE INDEX idx_centros_copia_distrito ON nodo_central.centros_salud_copia(distrito_sanitario);

-- =====================================================================
-- 2. COPIAS LOCALES DE PROFESIONALES (desde public.profesionales_sanitarios)
-- Sincronizadas automáticamente vía trigger
-- =====================================================================
CREATE TABLE nodo_central.profesionales_copia (
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
  
  -- Relación a centro (FK a copia local)
  centro_salud_id UUID REFERENCES nodo_central.centros_salud_copia(id),
  nombre_centro VARCHAR(255),
  
  -- Estado
  estado_solicitud VARCHAR(50),
  fecha_aprobacion TIMESTAMPTZ,
  funcion_publica BOOLEAN,
  estatus_funcionario VARCHAR(50),
  
  -- Sincronización
  sincronizado_desde_renaprosa TIMESTAMPTZ,
  version_renaprosa INTEGER DEFAULT 1,
  
  UNIQUE(id)
);

CREATE INDEX idx_profesionales_copia_nombre ON nodo_central.profesionales_copia(nombre_completo);
CREATE INDEX idx_profesionales_copia_estado ON nodo_central.profesionales_copia(estado_solicitud);
CREATE INDEX idx_profesionales_copia_centro ON nodo_central.profesionales_copia(centro_salud_id);
CREATE INDEX idx_profesionales_copia_distrito ON nodo_central.profesionales_copia(distrito_sanitario);

-- =====================================================================
-- 3. PACIENTES MAESTRO (Historia Clínica Única Nacional)
-- Cada paciente tiene un HCU único que lo identifica nacionalmente
-- =====================================================================
CREATE TABLE nodo_central.pais_pacientes_maestro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hcu VARCHAR(50) UNIQUE NOT NULL,
  cedula VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255) NOT NULL,
  fecha_nacimiento DATE,
  genero VARCHAR(10),
  
  -- Centro de origen
  centro_salud_origen_id UUID REFERENCES nodo_central.centros_salud_copia(id),
  profesional_registrador_id UUID REFERENCES nodo_central.profesionales_copia(id),
  
  -- Datos clínicos
  alergias JSONB,
  condiciones_cronicas JSONB,
  tipo_sangre VARCHAR(5),
  
  -- Metadata
  estado VARCHAR(50) DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_pais_pacientes_hcu ON nodo_central.pais_pacientes_maestro(hcu);
CREATE INDEX idx_pais_pacientes_cedula ON nodo_central.pais_pacientes_maestro(cedula);
CREATE INDEX idx_pais_pacientes_estado ON nodo_central.pais_pacientes_maestro(estado);
CREATE INDEX idx_pais_pacientes_centro ON nodo_central.pais_pacientes_maestro(centro_salud_origen_id);

-- =====================================================================
-- 4. TARJETAS SANITARIAS (Una local por hospital)
-- =====================================================================
CREATE TABLE nodo_central.tarjetas_sanitarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hcu VARCHAR(50) NOT NULL REFERENCES nodo_central.pais_pacientes_maestro(hcu) ON DELETE CASCADE,
  hospital_codigo VARCHAR(10) NOT NULL,
  numero_tarjeta VARCHAR(50) UNIQUE NOT NULL,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tarjetas_hcu ON nodo_central.tarjetas_sanitarias(hcu);
CREATE INDEX idx_tarjetas_hospital ON nodo_central.tarjetas_sanitarias(hospital_codigo);
CREATE INDEX idx_tarjetas_numero ON nodo_central.tarjetas_sanitarias(numero_tarjeta);

-- =====================================================================
-- 5. LOG DE SINCRONIZACIÓN Y AUDITORÍA
-- =====================================================================
CREATE TABLE nodo_central.sincronizacion_log (
  id BIGSERIAL PRIMARY KEY,
  tipo_evento VARCHAR(50) NOT NULL,
  entidad_tipo VARCHAR(50),
  entidad_id UUID,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  estado VARCHAR(50) DEFAULT 'exitoso',
  mensaje_error TEXT,
  usuario_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sync_log_tipo ON nodo_central.sincronizacion_log(tipo_evento);
CREATE INDEX idx_sync_log_entidad ON nodo_central.sincronizacion_log(entidad_id);
CREATE INDEX idx_sync_log_timestamp ON nodo_central.sincronizacion_log(timestamp);
CREATE INDEX idx_sync_log_estado ON nodo_central.sincronizacion_log(estado);

-- =====================================================================
-- 6. SECUENCIALES PARA HCU (Contador por distrito sanitario y año)
-- =====================================================================
CREATE TABLE nodo_central.secuenciales_hcu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_distrito TEXT NOT NULL REFERENCES nodo_central.distritos_sanitarios_copia(nombre_distrito),
  anio INTEGER NOT NULL,
  secuencial INTEGER DEFAULT 0,
  UNIQUE(nombre_distrito, anio)
);

-- =====================================================================
-- 7. FUNCIONES SQL PARA SINCRONIZACIÓN
-- =====================================================================

-- Función 0: Sincronizar Distrito Sanitario
CREATE OR REPLACE FUNCTION nodo_central.fn_sincronizar_distrito(
  p_nombre_distrito TEXT,
  p_abreviatura_provincia VARCHAR(10),
  p_nombre_provincia VARCHAR(255),
  p_abreviatura_distrito VARCHAR(10)
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO nodo_central.distritos_sanitarios_copia (
    nombre_distrito, abreviatura_provincia, nombre_provincia, abreviatura_distrito,
    sincronizado_desde_renaprosa, version_renaprosa
  ) VALUES (
    p_nombre_distrito, p_abreviatura_provincia, p_nombre_provincia, p_abreviatura_distrito,
    now(), 1
  )
  ON CONFLICT (nombre_distrito) DO UPDATE SET
    abreviatura_provincia = EXCLUDED.abreviatura_provincia,
    nombre_provincia = EXCLUDED.nombre_provincia,
    abreviatura_distrito = EXCLUDED.abreviatura_distrito,
    sincronizado_desde_renaprosa = now(),
    version_renaprosa = nodo_central.distritos_sanitarios_copia.version_renaprosa + 1;

  INSERT INTO nodo_central.sincronizacion_log (tipo_evento, entidad_tipo, entidad_id, estado)
  VALUES ('distrito_sincronizado', 'distrito', p_nombre_distrito::uuid, 'exitoso');

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO nodo_central.sincronizacion_log (
    tipo_evento, entidad_tipo, estado, mensaje_error
  ) VALUES ('distrito_sincronizado', 'distrito', 'error', SQLERRM);
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Función 1: Sincronizar Centro de Salud
CREATE OR REPLACE FUNCTION nodo_central.fn_sincronizar_centro(
  p_id UUID,
  p_nombre TEXT,
  p_categoria TEXT,
  p_provincia TEXT,
  p_distrito TEXT,
  p_distrito_sanitario TEXT,
  p_sector TEXT,
  p_director TEXT,
  p_telefono TEXT,
  p_especialidades TEXT[],
  p_estado TEXT,
  p_numero_registro TEXT,
  p_fecha_registro TIMESTAMPTZ,
  p_subcategoria TEXT,
  p_nif TEXT,
  p_responsable TEXT,
  p_fotos_establecimiento TEXT[]
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO nodo_central.centros_salud_copia (
    id, nombre, categoria, provincia, distrito, distrito_sanitario, sector,
    director, telefono, especialidades, estado, numero_registro, fecha_registro,
    subcategoria, nif, responsable, fotos_establecimiento,
    sincronizado_desde_renaprosa, version_renaprosa
  ) VALUES (
    p_id, p_nombre, p_categoria, p_provincia, p_distrito, p_distrito_sanitario, p_sector,
    p_director, p_telefono, p_especialidades, p_estado, p_numero_registro, p_fecha_registro,
    p_subcategoria, p_nif, p_responsable, p_fotos_establecimiento,
    now(), 1
  )
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

  INSERT INTO nodo_central.sincronizacion_log (tipo_evento, entidad_tipo, entidad_id, estado)
  VALUES ('centro_sincronizado', 'centro', p_id, 'exitoso');

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO nodo_central.sincronizacion_log (
    tipo_evento, entidad_tipo, entidad_id, estado, mensaje_error
  ) VALUES ('centro_sincronizado', 'centro', p_id, 'error', SQLERRM);
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Función 2: Sincronizar Profesional
CREATE OR REPLACE FUNCTION nodo_central.fn_sincronizar_profesional(
  p_profesional_id UUID,
  p_nombre_completo VARCHAR(255),
  p_numero_dip VARCHAR(50),
  p_area_profesional VARCHAR(255),
  p_centro_salud_id UUID,
  p_nombre_centro VARCHAR(255),
  p_distrito_sanitario VARCHAR(100),
  p_estado_solicitud VARCHAR(50)
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Solo sincronizar si está aprobado
  IF p_estado_solicitud != 'Aprobado' THEN
    RETURN true;
  END IF;
  
  INSERT INTO nodo_central.profesionales_copia (
    id, nombre_completo, numero_dip, area_profesional, centro_salud_id,
    nombre_centro, distrito_sanitario, estado_solicitud, sincronizado_desde_renaprosa, version_renaprosa
  ) VALUES (
    p_profesional_id, p_nombre_completo, p_numero_dip, p_area_profesional, p_centro_salud_id,
    p_nombre_centro, p_distrito_sanitario, p_estado_solicitud, now(), 1
  )
  ON CONFLICT (id) DO UPDATE SET
    nombre_completo = EXCLUDED.nombre_completo,
    numero_dip = EXCLUDED.numero_dip,
    area_profesional = EXCLUDED.area_profesional,
    centro_salud_id = EXCLUDED.centro_salud_id,
    nombre_centro = EXCLUDED.nombre_centro,
    estado_solicitud = EXCLUDED.estado_solicitud,
    sincronizado_desde_renaprosa = now(),
    version_renaprosa = nodo_central.profesionales_copia.version_renaprosa + 1;
  
  INSERT INTO nodo_central.sincronizacion_log (tipo_evento, entidad_tipo, entidad_id, estado)
  VALUES ('profesional_sincronizado', 'profesional', p_profesional_id, 'exitoso');
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO nodo_central.sincronizacion_log (
    tipo_evento, entidad_tipo, entidad_id, estado, mensaje_error
  ) VALUES ('profesional_sincronizado', 'profesional', p_profesional_id, 'error', SQLERRM);
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Función 3: Generar HCU Único (basado en nombre de distrito sanitario)
CREATE OR REPLACE FUNCTION nodo_central.fn_generar_hcu(
  p_cedula VARCHAR(20),
  p_nombre_distrito TEXT,
  p_centro_salud_id UUID DEFAULT NULL
)
RETURNS VARCHAR(50) AS $$
DECLARE
  v_hcu VARCHAR(50);
  v_nombre_distrito TEXT;
  v_abreviatura_distrito VARCHAR(10);
  v_anio INTEGER;
  v_secuencial INTEGER;
BEGIN
  -- Usar el nombre del distrito proporcionado o extraerlo de centros
  v_nombre_distrito := COALESCE(
    p_nombre_distrito,
    (SELECT distrito_sanitario FROM nodo_central.centros_salud_copia
     WHERE id = p_centro_salud_id LIMIT 1),
    'Desconocido'
  );

  -- Obtener abreviatura del distrito
  SELECT abreviatura_distrito INTO v_abreviatura_distrito
  FROM nodo_central.distritos_sanitarios_copia
  WHERE nombre_distrito = v_nombre_distrito;

  IF v_abreviatura_distrito IS NULL THEN
    v_abreviatura_distrito := 'GE';
  END IF;

  v_anio := EXTRACT(YEAR FROM now())::INTEGER;

  -- Obtener secuencial para ese distrito y año
  INSERT INTO nodo_central.secuenciales_hcu (nombre_distrito, anio, secuencial)
  VALUES (v_nombre_distrito, v_anio, 1)
  ON CONFLICT (nombre_distrito, anio) DO UPDATE
  SET secuencial = nodo_central.secuenciales_hcu.secuencial + 1
  RETURNING nodo_central.secuenciales_hcu.secuencial INTO v_secuencial;

  -- Generar HCU: HCU[ABREVIATURA][AÑO][SECUENCIAL_6DÍGITOS]
  -- Ejemplo: HCUDSR2026000001 (Distrito Riaba, 2026, secuencial 1)
  v_hcu := 'HCU' || v_abreviatura_distrito || v_anio || LPAD(v_secuencial::text, 6, '0');

  RETURN v_hcu;
END;
$$ LANGUAGE plpgsql;

-- Función 4: Buscar Paciente por Cédula
CREATE OR REPLACE FUNCTION nodo_central.fn_buscar_paciente(
  p_cedula VARCHAR(20)
)
RETURNS TABLE (
  id UUID,
  hcu VARCHAR(50),
  nombre TEXT,
  apellido VARCHAR(255),
  fecha_nacimiento DATE,
  genero VARCHAR(10),
  alergias JSONB,
  condiciones_cronicas JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.hcu,
    p.nombre,
    p.apellido,
    p.fecha_nacimiento,
    p.genero,
    p.alergias,
    p.condiciones_cronicas
  FROM nodo_central.pais_pacientes_maestro p
  WHERE p.cedula = p_cedula AND p.estado = 'activo';
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 8. TRIGGERS PARA SINCRONIZACIÓN AUTOMÁTICA (en RENAPROSA)
-- =====================================================================

-- Trigger 0: Sincronizar distritos desde public.distrito_sanitario
CREATE OR REPLACE FUNCTION nodo_central.tg_sync_distritos()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM nodo_central.fn_sincronizar_distrito(
    NEW.nombre_distrito,
    NEW.abreviatura_provincia,
    NEW.nombre_provincia,
    NEW.abreviatura_distrito
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_sync_distritos ON public.distrito_sanitario;
CREATE TRIGGER trig_sync_distritos
AFTER INSERT OR UPDATE ON public.distrito_sanitario
FOR EACH ROW
EXECUTE FUNCTION nodo_central.tg_sync_distritos();

-- Trigger 1: Sincronizar centros cuando se crean/actualizan en RENAPROSA
CREATE OR REPLACE FUNCTION nodo_central.tg_sync_centros()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM nodo_central.fn_sincronizar_centro(
    NEW.id,
    NEW.nombre,
    NEW.categoria,
    NEW.provincia,
    NEW.distrito,
    NEW.distrito_sanitario,
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_sync_centros ON public.centros_salud;
CREATE TRIGGER trig_sync_centros
AFTER INSERT OR UPDATE ON public.centros_salud
FOR EACH ROW
EXECUTE FUNCTION nodo_central.tg_sync_centros();

-- Trigger 2: Sincronizar profesionales cuando se aprueban en RENAPROSA
CREATE OR REPLACE FUNCTION nodo_central.tg_sync_profesionales()
RETURNS TRIGGER AS $$
BEGIN
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_sync_profesionales ON public.profesionales_sanitarios;
CREATE TRIGGER trig_sync_profesionales
AFTER INSERT OR UPDATE ON public.profesionales_sanitarios
FOR EACH ROW
EXECUTE FUNCTION nodo_central.tg_sync_profesionales();

-- =====================================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =====================================================================

ALTER TABLE nodo_central.pais_pacientes_maestro ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodo_central.tarjetas_sanitarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodo_central.centros_salud_copia ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodo_central.profesionales_copia ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodo_central.sincronizacion_log ENABLE ROW LEVEL SECURITY;

-- Policy: Pacientes visibles a admin y personal de hospital
CREATE POLICY "pais_pacientes_visible"
ON nodo_central.pais_pacientes_maestro FOR SELECT
USING (auth.jwt() ->> 'role' IN ('admin', 'hospital_admin', 'health_worker'));

-- Policy: Centros visibles a todos (datos públicos)
CREATE POLICY "centros_copia_visible"
ON nodo_central.centros_salud_copia FOR SELECT
USING (true);

-- Policy: Profesionales visibles a todos (datos públicos)
CREATE POLICY "profesionales_copia_visible"
ON nodo_central.profesionales_copia FOR SELECT
USING (true);

-- Policy: Logs visibles a admin
CREATE POLICY "sync_log_admin_only"
ON nodo_central.sincronizacion_log FOR SELECT
USING (auth.jwt() ->> 'role' IN ('admin', 'admin_central'));

-- =====================================================================
-- 10. GRANTS (Permisos)
-- =====================================================================

GRANT USAGE ON SCHEMA nodo_central TO anon, authenticated;
GRANT SELECT ON nodo_central.centros_salud_copia TO anon, authenticated;
GRANT SELECT ON nodo_central.profesionales_copia TO anon, authenticated;
GRANT SELECT ON nodo_central.pais_pacientes_maestro TO authenticated;
GRANT SELECT, INSERT ON nodo_central.tarjetas_sanitarias TO authenticated;
GRANT EXECUTE ON FUNCTION nodo_central.fn_generar_hcu TO authenticated;
GRANT EXECUTE ON FUNCTION nodo_central.fn_buscar_paciente TO authenticated;
GRANT SELECT ON nodo_central.sincronizacion_log TO authenticated;
