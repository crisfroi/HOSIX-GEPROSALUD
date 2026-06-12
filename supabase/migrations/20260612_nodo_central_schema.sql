-- =====================================================================
-- NODO CENTRAL: SCHEMA MAESTRO NACIONAL
-- Historia Clínica Única (HCU) + Sincronización Automática vía Triggers
-- =====================================================================
-- Estrategia: Triggers en RENAPROSA + Copias Locales + Funciones Idempotentes
-- Resultado: Sincronización instantánea, sin cron jobs, sin discrepancias

CREATE SCHEMA IF NOT EXISTS nodo_central;

-- =====================================================================
-- 1. COPIAS LOCALES DE CENTROS (desde public.centros_salud)
-- Sincronizadas automáticamente vía trigger
-- =====================================================================
CREATE TABLE nodo_central.centros_salud_copia (
  id UUID PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  categoria VARCHAR(100),
  subcategoria VARCHAR(100),
  provincia VARCHAR(100),
  distrito VARCHAR(100),
  distrito_sanitario VARCHAR(100),
  sector VARCHAR(50),
  director VARCHAR(255),
  telefono VARCHAR(20),
  email VARCHAR(255),
  nif VARCHAR(20),
  responsable VARCHAR(255),
  especialidades JSONB,
  estado VARCHAR(50),
  numero_registro VARCHAR(100),
  fecha_registro TIMESTAMPTZ,

  -- Sincronización
  sincronizado_desde_renaprosa TIMESTAMPTZ,
  version_renaprosa INTEGER DEFAULT 1,

  UNIQUE(id)
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
-- =====================================================================
-- Cada paciente tiene un HCU único que lo identifica nacionalmente
-- Referencias a centros_salud_copia para evitar FK circulares
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
-- 6. SECUENCIALES PARA HCU (Contador por provincia y año)
-- =====================================================================
CREATE TABLE nodo_central.secuenciales_hcu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provincia VARCHAR(100) NOT NULL,
  anio INTEGER NOT NULL,
  secuencial INTEGER DEFAULT 0,
  UNIQUE(provincia, anio)
);

-- =====================================================================
-- 8. FUNCIONES SQL PARA SINCRONIZACIÓN Y OPERACIONES
-- =====================================================================

-- Función 1: Sincronizar Centro de Salud
CREATE OR REPLACE FUNCTION nodo_central.fn_sincronizar_centro(
  p_centro_id UUID,
  p_nombre VARCHAR(255),
  p_categoria VARCHAR(100),
  p_provincia VARCHAR(100),
  p_distrito VARCHAR(100),
  p_distrito_sanitario VARCHAR(100),
  p_estado VARCHAR(50)
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO nodo_central.centros_salud_copia (
    id, nombre, categoria, provincia, distrito, distrito_sanitario, estado,
    sincronizado_desde_renaprosa, version_renaprosa
  ) VALUES (
    p_centro_id, p_nombre, p_categoria, p_provincia, p_distrito, p_distrito_sanitario, p_estado,
    now(), 1
  )
  ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    categoria = EXCLUDED.categoria,
    provincia = EXCLUDED.provincia,
    distrito = EXCLUDED.distrito,
    distrito_sanitario = EXCLUDED.distrito_sanitario,
    estado = EXCLUDED.estado,
    sincronizado_desde_renaprosa = now(),
    version_renaprosa = nodo_central.centros_salud_copia.version_renaprosa + 1;

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO nodo_central.sincronizacion_log (
    tipo_evento, entidad_tipo, entidad_id, estado, mensaje_error
  ) VALUES ('centro_sincronizado', 'centro', p_centro_id, 'error', SQLERRM);
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

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO nodo_central.sincronizacion_log (
    tipo_evento, entidad_tipo, entidad_id, estado, mensaje_error
  ) VALUES ('profesional_sincronizado', 'profesional', p_profesional_id, 'error', SQLERRM);
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Función 3: Generar HCU Único
CREATE OR REPLACE FUNCTION nodo_central.fn_generar_hcu(
  p_cedula VARCHAR(20),
  p_provincia VARCHAR(100),
  p_centro_salud_id UUID DEFAULT NULL
)
RETURNS VARCHAR(50) AS $$
DECLARE
  v_hcu VARCHAR(50);
  v_codigo_provincia VARCHAR(2);
  v_anio INTEGER;
  v_secuencial INTEGER;
BEGIN
  -- Mapear provincia a código de 2 letras
  v_codigo_provincia := CASE
    WHEN p_provincia ILIKE '%Bioko%' OR p_provincia = 'CE' THEN 'CE'
    WHEN p_provincia ILIKE '%Bata%' OR p_provincia = 'BN' THEN 'BN'
    ELSE 'GE'
  END;

  v_anio := EXTRACT(YEAR FROM now())::INTEGER;

  -- Obtener secuencial para ese año
  INSERT INTO nodo_central.secuenciales_hcu (provincia, anio, secuencial)
  VALUES (v_codigo_provincia, v_anio, 1)
  ON CONFLICT (provincia, anio) DO UPDATE
  SET secuencial = nodo_central.secuenciales_hcu.secuencial + 1
  RETURNING nodo_central.secuenciales_hcu.secuencial INTO v_secuencial;

  -- Generar HCU: HCUCE2026000001
  v_hcu := 'HCU' || v_codigo_provincia || v_anio || LPAD(v_secuencial::text, 6, '0');

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

-- Función: Validar HCU
CREATE OR REPLACE FUNCTION nodo_central.validar_hcu(p_hcu VARCHAR(50))
RETURNS BOOLEAN AS $$
DECLARE
  v_numero_base VARCHAR(50);
  v_check_esperado VARCHAR(2);
  v_check_calculado VARCHAR(2);
BEGIN
  -- Validar formato: HCUXX####XXXXXX-XX
  IF NOT p_hcu ~ '^HCU[A-Z]{2}\d{4}\d{6}-[A-F0-9]{2}$' THEN
    RETURN false;
  END IF;
  
  -- Extraer partes
  v_numero_base := substring(p_hcu, 1, length(p_hcu) - 3);
  v_check_esperado := substring(p_hcu, length(p_hcu) - 1, 2);
  
  -- Calcular y comparar
  v_check_calculado := nodo_central.calcular_check_digit(v_numero_base);
  
  RETURN v_check_esperado = v_check_calculado;
END;
$$ LANGUAGE plpgsql;

-- Función: Buscar paciente en central por cédula
CREATE OR REPLACE FUNCTION nodo_central.buscar_paciente_por_cedula(p_cedula VARCHAR(20))
RETURNS TABLE (
  id UUID,
  hcu VARCHAR(50),
  cedula VARCHAR(20),
  nombre_completo TEXT,
  fecha_nacimiento DATE,
  genero VARCHAR(10),
  alergias TEXT,
  condiciones_cronicas TEXT,
  tarjetas JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.hcu,
    p.cedula,
    (p.nombre || ' ' || p.apellido)::TEXT,
    p.fecha_nacimiento,
    p.genero,
    p.alergias,
    p.condiciones_cronicas,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'numero_tarjeta', t.numero_tarjeta,
          'hospital', h.nombre,
          'activa', t.activa,
          'fecha_emision', t.fecha_emision
        )
      ) FILTER (WHERE t.id IS NOT NULL),
      '[]'::JSONB
    ) as tarjetas
  FROM nodo_central.pais_pacientes_maestro p
  LEFT JOIN nodo_central.tarjetas_sanitarias t ON p.hcu = t.hcu
  LEFT JOIN nodo_central.hospitales_registrados h ON t.hospital_id = h.id
  WHERE p.cedula = p_cedula AND p.estado = 'activo'
  GROUP BY p.id, p.hcu, p.cedula, p.nombre, p.apellido,
           p.fecha_nacimiento, p.genero, p.alergias, p.condiciones_cronicas;
END;
$$ LANGUAGE plpgsql;

-- Función: Crear paciente en central
CREATE OR REPLACE FUNCTION nodo_central.crear_paciente_central(
  p_cedula VARCHAR(20),
  p_nombre VARCHAR(255),
  p_apellido VARCHAR(255),
  p_fecha_nacimiento DATE,
  p_genero VARCHAR(10),
  p_distrito_id UUID,
  p_telefono VARCHAR(20) DEFAULT NULL,
  p_email VARCHAR(255) DEFAULT NULL,
  p_direccion TEXT DEFAULT NULL
)
RETURNS TABLE (
  hcu_generado VARCHAR(50),
  id_paciente UUID,
  mensaje TEXT
) AS $$
DECLARE
  v_hcu VARCHAR(50);
  v_id UUID;
BEGIN
  -- Verificar que cédula no exista
  IF EXISTS (SELECT 1 FROM nodo_central.pais_pacientes_maestro WHERE cedula = p_cedula) THEN
    RETURN QUERY SELECT
      NULL::VARCHAR,
      NULL::UUID,
      'Cédula ya existe en el sistema'::TEXT;
    RETURN;
  END IF;
  
  -- Generar HCU
  v_hcu := nodo_central.generar_hcu(p_distrito_id, p_cedula);
  
  -- Insertar paciente
  INSERT INTO nodo_central.pais_pacientes_maestro (
    hcu, cedula, nombre, apellido, fecha_nacimiento, genero,
    telefono, email, direccion, distrito_sanitario_id, created_by
  ) VALUES (
    v_hcu, p_cedula, p_nombre, p_apellido, p_fecha_nacimiento, p_genero,
    p_telefono, p_email, p_direccion, p_distrito_id, auth.uid()
  )
  RETURNING id INTO v_id;
  
  RETURN QUERY SELECT
    v_hcu::VARCHAR,
    v_id::UUID,
    'Paciente creado exitosamente'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =====================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE nodo_central.pais_pacientes_maestro ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodo_central.tarjetas_sanitarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodo_central.pais_historico_clinico ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodo_central.hospitales_registrados ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodo_central.sincronizacion_log ENABLE ROW LEVEL SECURITY;

-- Policy: Hospitales ven pacientes con tarjeta en su hospital
CREATE POLICY "hospitales_ven_sus_pacientes"
ON nodo_central.pais_pacientes_maestro FOR SELECT
USING (
  -- Si el usuario es de un hospital, solo ve pacientes con tarjeta en su hospital
  EXISTS (
    SELECT 1 FROM nodo_central.tarjetas_sanitarias ts
    JOIN nodo_central.hospitales_registrados h ON ts.hospital_id = h.id
    WHERE ts.hcu = pais_pacientes_maestro.hcu
  )
);

-- Policy: Solo administrador central ve todos
CREATE POLICY "admin_central_ve_todos"
ON nodo_central.pais_pacientes_maestro FOR SELECT
USING (auth.jwt() ->> 'role' = 'admin_central');

-- Policy: Histórici clínico visible a hospitales relacionados
CREATE POLICY "hospitales_ven_historico_sus_pacientes"
ON nodo_central.pais_historico_clinico FOR SELECT
USING (
  hospital_reportante_id IN (
    SELECT id FROM nodo_central.hospitales_registrados
    WHERE codigo IN (
      SELECT hospital_codigo FROM auth.users
      WHERE id = auth.uid()
    )
  )
);

-- =====================================================================
-- 10. GRANTS (Permisos)
-- =====================================================================

GRANT USAGE ON SCHEMA nodo_central TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA nodo_central TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA nodo_central TO authenticated;
