-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 010: Control Epidemiológico Avanzado
-- Fecha: 2026-05-30

-- ============================================================
-- 1. ENFERMEDADES Y CONDICIONES NOTIFICABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_enfermedades_notificables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_cie10 VARCHAR(10) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,

  es_brote_potencial BOOLEAN DEFAULT false,
  dias_incubacion_min INT,
  dias_incubacion_max INT,

  mortandad_estimada DECIMAL(5, 2),
  transmisibilidad VARCHAR(50) CHECK (transmisibilidad IN ('baja', 'media', 'alta', 'muy_alta')),

  nivel_notificacion VARCHAR(50) NOT NULL CHECK (nivel_notificacion IN ('local', 'provincial', 'nacional', 'internacional')),

  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. CASOS EPIDEMIOLÓGICOS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_casos_epidemiologicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  enfermedad_id UUID NOT NULL REFERENCES hosix_enfermedades_notificables(id),

  numero_caso VARCHAR(50) UNIQUE NOT NULL,
  estado VARCHAR(50) NOT NULL DEFAULT 'sospechoso' CHECK (estado IN ('sospechoso', 'probable', 'confirmado', 'descartado', 'recuperado', 'fallecido')),

  fecha_sintomas TIMESTAMPTZ NOT NULL,
  fecha_confirmacion TIMESTAMPTZ,
  fecha_cierre TIMESTAMPTZ,

  -- Clasificación
  tipo_caso VARCHAR(50) CHECK (tipo_caso IN ('autoctono', 'importado', 'asociado_viaje')),
  lugar_contagio VARCHAR(255),

  -- Clínica
  sintomas TEXT[],
  severidad VARCHAR(50) CHECK (severidad IN ('leve', 'moderada', 'severa', 'critica')),
  requiere_hospitalizacion BOOLEAN DEFAULT false,

  -- Resultado
  resultado_final VARCHAR(50) CHECK (resultado_final IN ('recuperado', 'fallecido', 'secuelas')),
  fecha_resultado TIMESTAMPTZ,

  medico_responsable_id UUID REFERENCES hosix_usuarios(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. RASTREO DE CONTACTOS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_contactos_epidemiologicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  caso_indice_id UUID NOT NULL REFERENCES hosix_casos_epidemiologicos(id),
  contacto_paciente_id UUID REFERENCES hosix_pacientes(id),

  tipo_contacto VARCHAR(50) NOT NULL CHECK (tipo_contacto IN ('domiciliario', 'ocupacional', 'sanitario', 'comunitario')),
  nivel_riesgo VARCHAR(50) NOT NULL CHECK (nivel_riesgo IN ('bajo', 'medio', 'alto', 'muy_alto')),

  fecha_ultimo_contacto TIMESTAMPTZ NOT NULL,
  fecha_inicio_vigilancia TIMESTAMPTZ DEFAULT now(),
  fecha_fin_vigilancia TIMESTAMPTZ,

  -- Seguimiento
  dias_vigilancia INT DEFAULT 14,
  estado_vigilancia VARCHAR(50) DEFAULT 'activa' CHECK (estado_vigilancia IN ('activa', 'completada', 'perdida')),

  sintomas_desarrollados BOOLEAN DEFAULT false,
  fecha_sintomas TIMESTAMPTZ,

  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. ALERTAS Y BROTES
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_alertas_epidemiologicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  tipo_alerta VARCHAR(50) NOT NULL CHECK (tipo_alerta IN ('caso_nuevo', 'brote', 'evento_inusual', 'umbral_excedido')),
  enfermedad_id UUID NOT NULL REFERENCES hosix_enfermedades_notificables(id),

  descripcion TEXT NOT NULL,
  severidad VARCHAR(50) NOT NULL CHECK (severidad IN ('baja', 'media', 'alta', 'crítica')),

  fecha_alerta TIMESTAMPTZ DEFAULT now(),
  fecha_confirmacion TIMESTAMPTZ,
  fecha_cierre TIMESTAMPTZ,

  estado VARCHAR(50) DEFAULT 'abierta' CHECK (estado IN ('abierta', 'investigando', 'confirmada', 'cerrada')),

  casos_asociados INT DEFAULT 0,
  ubicaciones_afectadas TEXT[],

  acciones_tomadas TEXT,
  responsable_id UUID REFERENCES hosix_usuarios(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. BROTES EPIDEMIOLÓGICOS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_brotes_epidemiologicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  numero_brote VARCHAR(50) UNIQUE NOT NULL,
  alerta_id UUID REFERENCES hosix_alertas_epidemiologicas(id),

  enfermedad_id UUID NOT NULL REFERENCES hosix_enfermedades_notificables(id),

  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin TIMESTAMPTZ,

  ubicacion_geografica VARCHAR(255) NOT NULL,
  hospital_id UUID REFERENCES hosix_hospitales(id),

  -- Estadísticas
  total_casos INT DEFAULT 0,
  casos_confirmados INT DEFAULT 0,
  casos_recuperados INT DEFAULT 0,
  casos_fallecidos INT DEFAULT 0,

  tasa_ataque DECIMAL(5, 2),
  tasa_mortalidad DECIMAL(5, 2),

  -- Gestión
  estado VARCHAR(50) DEFAULT 'activo' CHECK (estado IN ('activo', 'controlado', 'cerrado')),
  medidas_control TEXT[],

  coordinador_id UUID REFERENCES hosix_usuarios(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. REPORTES EPIDEMIOLÓGICOS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_reportes_epidemiologicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  periodo_inicio DATE NOT NULL,
  periodo_fin DATE NOT NULL,

  tipo_reporte VARCHAR(50) NOT NULL CHECK (tipo_reporte IN ('semanal', 'mensual', 'trimestral', 'anual', 'brote')),

  -- Incidencia
  total_casos_notificados INT DEFAULT 0,
  total_casos_confirmados INT DEFAULT 0,
  total_muertes INT DEFAULT 0,

  enfermedades_notificables JSONB,  -- Array con stats por enfermedad

  -- Brotes
  brotes_activos INT DEFAULT 0,
  brotes_nuevos INT DEFAULT 0,

  -- Análisis
  tendencias TEXT,
  factores_riesgo TEXT,
  recomendaciones TEXT,

  -- Auditoría
  responsable_id UUID NOT NULL REFERENCES hosix_usuarios(id),
  fecha_generacion TIMESTAMPTZ DEFAULT now(),

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 7. PARÁMETROS DE ALERTA (CONFIGURABLES)
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_parametros_alerta_epidemiologica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  enfermedad_id UUID NOT NULL REFERENCES hosix_enfermedades_notificables(id),

  umbral_casos_semana INT DEFAULT 5,
  umbral_muertes_mes INT DEFAULT 2,

  porcentaje_aumento_alerta DECIMAL(5, 2) DEFAULT 50,  -- Alerta si hay aumento del 50%

  dias_vigilancia_contactos INT DEFAULT 14,

  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(enfermedad_id)
);

-- ============================================================
-- 8. ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_enfermedades_notificables_cie10 ON hosix_enfermedades_notificables(codigo_cie10);
CREATE INDEX IF NOT EXISTS idx_enfermedades_notificables_nivel ON hosix_enfermedades_notificables(nivel_notificacion);

CREATE INDEX IF NOT EXISTS idx_casos_paciente ON hosix_casos_epidemiologicos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_casos_enfermedad ON hosix_casos_epidemiologicos(enfermedad_id);
CREATE INDEX IF NOT EXISTS idx_casos_estado ON hosix_casos_epidemiologicos(estado);
CREATE INDEX IF NOT EXISTS idx_casos_fecha ON hosix_casos_epidemiologicos(fecha_sintomas);

CREATE INDEX IF NOT EXISTS idx_contactos_caso ON hosix_contactos_epidemiologicos(caso_indice_id);
CREATE INDEX IF NOT EXISTS idx_contactos_paciente ON hosix_contactos_epidemiologicos(contacto_paciente_id);
CREATE INDEX IF NOT EXISTS idx_contactos_riesgo ON hosix_contactos_epidemiologicos(nivel_riesgo);

CREATE INDEX IF NOT EXISTS idx_alertas_enfermedad ON hosix_alertas_epidemiologicas(enfermedad_id);
CREATE INDEX IF NOT EXISTS idx_alertas_tipo ON hosix_alertas_epidemiologicas(tipo_alerta);
CREATE INDEX IF NOT EXISTS idx_alertas_estado ON hosix_alertas_epidemiologicas(estado);
CREATE INDEX IF NOT EXISTS idx_alertas_fecha ON hosix_alertas_epidemiologicas(fecha_alerta);

CREATE INDEX IF NOT EXISTS idx_brotes_enfermedad ON hosix_brotes_epidemiologicos(enfermedad_id);
CREATE INDEX IF NOT EXISTS idx_brotes_estado ON hosix_brotes_epidemiologicos(estado);
CREATE INDEX IF NOT EXISTS idx_brotes_fecha ON hosix_brotes_epidemiologicos(fecha_inicio);

CREATE INDEX IF NOT EXISTS idx_reportes_periodo ON hosix_reportes_epidemiologicos(periodo_inicio, periodo_fin);
CREATE INDEX IF NOT EXISTS idx_reportes_tipo ON hosix_reportes_epidemiologicos(tipo_reporte);

-- ============================================================
-- 9. RLS POLICIES
-- ============================================================

ALTER TABLE hosix_enfermedades_notificables ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_casos_epidemiologicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_contactos_epidemiologicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_alertas_epidemiologicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_brotes_epidemiologicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_reportes_epidemiologicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_parametros_alerta_epidemiologica ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enfermedades_read" ON hosix_enfermedades_notificables FOR SELECT USING (true);
CREATE POLICY "enfermedades_insert" ON hosix_enfermedades_notificables FOR INSERT WITH CHECK (true);

CREATE POLICY "casos_read" ON hosix_casos_epidemiologicos FOR SELECT USING (true);
CREATE POLICY "casos_insert" ON hosix_casos_epidemiologicos FOR INSERT WITH CHECK (true);
CREATE POLICY "casos_update" ON hosix_casos_epidemiologicos FOR UPDATE USING (true);

CREATE POLICY "contactos_read" ON hosix_contactos_epidemiologicos FOR SELECT USING (true);
CREATE POLICY "contactos_insert" ON hosix_contactos_epidemiologicos FOR INSERT WITH CHECK (true);
CREATE POLICY "contactos_update" ON hosix_contactos_epidemiologicos FOR UPDATE USING (true);

CREATE POLICY "alertas_read" ON hosix_alertas_epidemiologicas FOR SELECT USING (true);
CREATE POLICY "alertas_insert" ON hosix_alertas_epidemiologicas FOR INSERT WITH CHECK (true);
CREATE POLICY "alertas_update" ON hosix_alertas_epidemiologicas FOR UPDATE USING (true);

CREATE POLICY "brotes_read" ON hosix_brotes_epidemiologicos FOR SELECT USING (true);
CREATE POLICY "brotes_insert" ON hosix_brotes_epidemiologicos FOR INSERT WITH CHECK (true);
CREATE POLICY "brotes_update" ON hosix_brotes_epidemiologicos FOR UPDATE USING (true);

CREATE POLICY "reportes_read" ON hosix_reportes_epidemiologicos FOR SELECT USING (true);
CREATE POLICY "reportes_insert" ON hosix_reportes_epidemiologicos FOR INSERT WITH CHECK (true);

CREATE POLICY "parametros_read" ON hosix_parametros_alerta_epidemiologica FOR SELECT USING (true);
CREATE POLICY "parametros_insert" ON hosix_parametros_alerta_epidemiologica FOR INSERT WITH CHECK (true);
CREATE POLICY "parametros_update" ON hosix_parametros_alerta_epidemiologica FOR UPDATE USING (true);

-- ============================================================
-- 10. DATOS DE PRUEBA
-- ============================================================

INSERT INTO hosix_enfermedades_notificables (codigo_cie10, nombre, es_brote_potencial, nivel_notificacion, transmisibilidad) VALUES
('A00', 'Cólera', true, 'nacional', 'muy_alta'),
('B01', 'Varicela', true, 'nacional', 'alta'),
('J18', 'Neumonía', false, 'local', 'media'),
('A80', 'Poliomielitis', true, 'internacional', 'alta'),
('B16', 'Hepatitis B', true, 'nacional', 'media')
ON CONFLICT (codigo_cie10) DO NOTHING;
