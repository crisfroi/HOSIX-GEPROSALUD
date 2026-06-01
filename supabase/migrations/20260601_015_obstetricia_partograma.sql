-- ============================================================================
-- MIGRACIÓN: OBSTETRICIA Y PARTOGRAMA (ESTÁNDARES OMS)
-- ============================================================================
-- Descripción: Sistema completo para gestión de embarazo, parto y postparto
-- Incluye: Control prenatal, partograma dinámico, seguimiento neonatal
-- Estándares: OMS (Partograma), FHIR (Patient, Observation, Procedure)
-- ============================================================================

-- Crear tabla de gestiones/embarazos
CREATE TABLE IF NOT EXISTS obstetricia.gestaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL,
  hospital_id VARCHAR(50),
  
  -- Datos básicos de la gestación
  fecha_ultima_menstruacion DATE,
  fecha_probable_parto DATE,
  edad_gestacional_semanas INT,
  numero_gesta INT,
  numero_para INT,
  numero_abortos INT,      -- G_P_A (Gestas_Partos_Abortos)
  
  -- Estado del embarazo
  estado VARCHAR(30) DEFAULT 'en_curso',  -- 'en_curso', 'parida', 'aborto', 'terminado'
  tipo_embarazo VARCHAR(30),               -- 'simple', 'múltiple', 'ectópico'
  
  -- Información de la madre
  imc_pregestacional DECIMAL(5,2),
  peso_actual DECIMAL(5,2),
  presion_sistolica INT,
  presion_diastolica INT,
  
  -- Datos del feto (si hay)
  frecuencia_cardiaca_fetal INT,
  movimientos_fetales_por_dia INT,
  liquido_amniotico VARCHAR(30),       -- 'normal', 'bajo', 'alto', 'meconial', 'sanguinolento'
  membranas VARCHAR(30),               -- 'integras', 'rotas', 'rotas_sin_parto_vaginal'
  
  -- Riesgos
  factores_riesgo TEXT[],              -- Array de factores de riesgo identificados
  comorbilidades TEXT[],               -- Diabetes, hipertensión, etc.
  
  -- Seguimiento
  evaluado_por UUID,
  fecha_evaluacion TIMESTAMPTZ DEFAULT NOW(),
  proxima_cita TIMESTAMPTZ,
  observaciones TEXT,
  
  -- Auditoría
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gestaciones_paciente ON obstetricia.gestaciones(paciente_id);
CREATE INDEX idx_gestaciones_estado ON obstetricia.gestaciones(estado);
CREATE INDEX idx_gestaciones_fecha_parto ON obstetricia.gestaciones(fecha_probable_parto);

-- ============================================================================
-- TABLA: PARTOGRAMA (Estándares OMS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS obstetricia.partos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gestacion_id UUID NOT NULL REFERENCES obstetricia.gestaciones(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL,
  hospital_id VARCHAR(50),
  
  -- Información del parto
  fecha_inicio_parto TIMESTAMPTZ,
  fecha_fin_parto TIMESTAMPTZ,
  duracion_parto_horas DECIMAL(5,2),
  
  -- Tipo de parto
  tipo_parto VARCHAR(30),              -- 'vaginal_espontaneo', 'vaginal_instrumentado', 'cesarea'
  indicacion_cesarea VARCHAR(50),      -- 'distocia_dinamica', 'sufrimiento_fetal', 'presentacion_viciosa', etc.
  
  -- Fase del parto
  fase_actual VARCHAR(30),             -- 'latente', 'activa', 'expulsivo', 'alumbramiento'
  duracion_fase_latente DECIMAL(5,2),
  duracion_fase_activa DECIMAL(5,2),
  duracion_fase_expulsiva DECIMAL(5,2),
  
  -- Complicaciones
  complicaciones TEXT[],               -- 'distress_fetal', 'hemorragia', 'infección', etc.
  medicamentos_administrados JSONB,    -- {oxitocina_ml_h, ergotina, antibióticos, etc.}
  
  -- Resultado del parto
  resultado VARCHAR(30),               -- 'exito', 'complicado', 'fetal_fallecido', 'materno_fallecido'
  observaciones TEXT,
  
  -- Auditoría
  partero_id UUID,
  obstetra_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_partos_gestacion ON obstetricia.partos(gestacion_id);
CREATE INDEX idx_partos_paciente ON obstetricia.partos(paciente_id);
CREATE INDEX idx_partos_fecha ON obstetricia.partos(fecha_inicio_parto);
CREATE INDEX idx_partos_tipo ON obstetricia.partos(tipo_parto);

-- ============================================================================
-- TABLA: REGISTROS HORARIOS DEL PARTOGRAMA (OMS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS obstetricia.partograma_registros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parto_id UUID NOT NULL REFERENCES obstetricia.partos(id) ON DELETE CASCADE,
  
  -- Timestamp del registro
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  horas_desde_inicio INT,              -- Número de horas desde el inicio del parto
  
  -- PARÁMETROS MATERNOS
  dilatacion_cervical_cm INT,          -- 0-10 cm (variable crítica OMS)
  borramiento_cervical INT,            -- % (0-100)
  consistencia_cervical VARCHAR(30),   -- 'dura', 'semidura', 'blanda'
  posicion_cervical VARCHAR(30),       -- 'posterior', 'central', 'anterior'
  
  -- PARÁMETROS FETALES
  descenso_cefalico INT,               -- -5 a +5 estaciones (en cm)
  presentacion VARCHAR(30),            -- 'vertice', 'cara', 'frente', 'occipital'
  frecuencia_cardiaca_fetal INT,       -- lpm (120-160 normal)
  variabilidad_fcf VARCHAR(30),        -- 'buena', 'moderada', 'mala', 'ausente'
  
  -- CONTRACCIONES
  contracciones_cada_10min INT,        -- Número de contracciones cada 10 minutos
  intensidad_contraccion VARCHAR(30),  -- 'débil', 'moderada', 'fuerte'
  duracion_contraccion_seg INT,        -- Duración de la contracción en segundos
  
  -- DATOS MATERNOS
  frecuencia_cardiaca_materna INT,
  presion_sistolica INT,
  presion_diastolica INT,
  temperatura_celsius DECIMAL(4,2),
  
  -- LÍQUIDO AMNIÓTICO
  liquido_amniotico VARCHAR(30),       -- 'claro', 'meconial_ligero', 'meconial_moderado', 'meconial_espeso', 'sanguinolento'
  cantidad VARCHAR(30),                -- 'normal', 'reducido', 'ausente'
  
  -- MEDICAMENTOS
  oxitocina_ml_h DECIMAL(5,2),
  medicamentos_otros TEXT[],
  
  -- Parámetros OMS (líneas de acción/alerta)
  minutos_desde_linea_alerta INT,
  minutos_desde_linea_accion INT,
  
  -- Observaciones clínicas
  observaciones TEXT,
  registrado_por UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_partograma_parto ON obstetricia.partograma_registros(parto_id);
CREATE INDEX idx_partograma_timestamp ON obstetricia.partograma_registros(timestamp);
CREATE INDEX idx_partograma_horas ON obstetricia.partograma_registros(horas_desde_inicio);

-- ============================================================================
-- TABLA: RECIÉN NACIDO (Neonato)
-- ============================================================================

CREATE TABLE IF NOT EXISTS obstetricia.neonatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parto_id UUID NOT NULL REFERENCES obstetricia.partos(id) ON DELETE CASCADE,
  
  -- Identidad y datos básicos
  numero_neonato INT,                  -- 1, 2, 3 (en caso de múltiples)
  sexo VARCHAR(10),                    -- 'masculino', 'femenino'
  peso_gramos INT,
  talla_cm DECIMAL(5,2),
  perimetro_cefalico_cm DECIMAL(5,2),
  
  -- Apgar (Evaluación en 1 y 5 minutos)
  apgar_1_minuto INT,                  -- 0-10
  apgar_5_minutos INT,
  apgar_10_minutos INT,
  
  -- Silverman (Distrés respiratorio)
  silverman_score INT,                 -- 0-10
  
  -- Estado general
  color VARCHAR(30),                   -- 'rosado', 'rosado_extremidades_azules', 'azul', 'pálido'
  vitalidad VARCHAR(30),               -- 'vigoroso', 'deprimido_leve', 'deprimido_severo'
  
  -- Requerimientos iniciales
  requiere_reanimacion BOOLEAN DEFAULT FALSE,
  requiere_oxigeno BOOLEAN DEFAULT FALSE,
  requiere_ventilacion BOOLEAN DEFAULT FALSE,
  requiere_drogas BOOLEAN DEFAULT FALSE,
  
  -- Complicaciones
  complicaciones TEXT[],               -- 'ictericia', 'hipoglucemia', 'sepsis', 'displasia_broncopulmonar', etc.
  
  -- Destino
  destino VARCHAR(30),                 -- 'alojamiento_conjunto', 'observacion', 'cuidados_intensivos', 'traslado'
  
  -- Auditoría
  pediatra_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_neonatos_parto ON obstetricia.neonatos(parto_id);

-- ============================================================================
-- TABLA: CONTROL PRENATAL
-- ============================================================================

CREATE TABLE IF NOT EXISTS obstetricia.controles_prenatales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gestacion_id UUID NOT NULL REFERENCES obstetricia.gestaciones(id) ON DELETE CASCADE,
  
  -- Control
  numero_control INT,
  edad_gestacional_semanas INT,
  fecha_control TIMESTAMPTZ DEFAULT NOW(),
  
  -- Síntomas/Quejas
  sintomas TEXT[],                     -- 'náuseas', 'vómitos', 'edema', 'cefalea', etc.
  
  -- Examen físico
  peso_kg DECIMAL(5,2),
  presion_sistolica INT,
  presion_diastolica INT,
  altura_uterina_cm DECIMAL(5,2),
  
  -- Examen obstétrico
  contracciones_braxton_hicks BOOLEAN,
  edema INT,                           -- 0-3 (ausente a severo)
  reflejos VARCHAR(30),                -- 'normales', 'aumentados', 'disminuidos'
  
  -- Laboratorio/Imagenología
  hemoglobina_g_dl DECIMAL(5,2),
  glucosa_mmol_l DECIMAL(5,2),
  proteinas_urinarias VARCHAR(30),
  nitritos_urinarios BOOLEAN,
  resultado_ultrasonido TEXT,
  
  -- Factores de riesgo identificados
  nuevos_factores_riesgo TEXT[],
  
  -- Plan
  recomendaciones TEXT,
  proximoxamen_semanas INT,
  
  -- Auditoría
  evaluado_por UUID,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_controles_gestacion ON obstetricia.controles_prenatales(gestacion_id);
CREATE INDEX idx_controles_edad_gest ON obstetricia.controles_prenatales(edad_gestacional_semanas);

-- ============================================================================
-- TABLA: POSTPARTO Y MONITOREO MATERNO
-- ============================================================================

CREATE TABLE IF NOT EXISTS obstetricia.postparto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parto_id UUID NOT NULL REFERENCES obstetricia.partos(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL,
  
  -- Alumbramiento
  tipo_alumbramiento VARCHAR(30),      -- 'espontáneo', 'manual', 'quirúrgico'
  duracion_alumbramiento_min INT,
  
  -- Loquios (sangrado postparto)
  cantidad_sangre_estimada_ml INT,
  loquios_color VARCHAR(30),           -- 'rojo_brillante', 'sanguinolento', 'seroso', 'blanco'
  
  -- Complicaciones postparto inmediatas
  hemorragia BOOLEAN DEFAULT FALSE,
  infección BOOLEAN DEFAULT FALSE,
  complicaciones_adicionales TEXT[],
  
  -- Recuperación
  útero_contraido BOOLEAN,
  fondo_uterino_cm INT,                -- Distancia symphysis-fondo
  estado_perineal VARCHAR(30),         -- 'íntegro', 'laceraciones_1er_grado', '2do', '3er', '4to'
  necesita_sutura BOOLEAN,
  
  -- Monitoreo durante estancia
  registros_postparto JSONB,           -- Array de {fecha, temp, fc, pa, loquios, etc.}
  
  -- Medicamentos administrados
  medicamentos_postparto JSONB,        -- {oxitocina, ergotina, antibióticos, analgésicos, etc.}
  
  -- Alta
  fecha_alta TIMESTAMPTZ,
  indicaciones_alta TEXT,
  signos_alarma_explicados BOOLEAN,
  
  -- Auditoría
  medico_alta_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_postparto_parto ON obstetricia.postparto(parto_id);
CREATE INDEX idx_postparto_paciente ON obstetricia.postparto(paciente_id);

-- ============================================================================
-- VISTAS PARA REPORTES
-- ============================================================================

-- Vista: Gestaciones activas por hospital
CREATE OR REPLACE VIEW obstetricia.vw_gestaciones_activas AS
SELECT 
  g.id,
  g.paciente_id,
  g.numero_gesta,
  g.numero_para,
  g.edad_gestacional_semanas,
  g.fecha_probable_parto,
  g.estado,
  g.factores_riesgo,
  g.proxima_cita,
  g.hospital_id
FROM obstetricia.gestaciones g
WHERE g.estado = 'en_curso'
ORDER BY g.fecha_probable_parto ASC;

-- Vista: Partos recientes con información del neonato
CREATE OR REPLACE VIEW obstetricia.vw_partos_recientes AS
SELECT 
  p.id,
  p.paciente_id,
  p.tipo_parto,
  p.fecha_inicio_parto,
  p.duracion_parto_horas,
  p.resultado,
  n.id as neonato_id,
  n.peso_gramos,
  n.apgar_1_minuto,
  n.apgar_5_minutos,
  COUNT(*) OVER (PARTITION BY p.id) as neonatos_count
FROM obstetricia.partos p
LEFT JOIN obstetricia.neonatos n ON p.id = n.parto_id
ORDER BY p.fecha_inicio_parto DESC;

-- Vista: Complicaciones por tipo de parto
CREATE OR REPLACE VIEW obstetricia.vw_complicaciones_partos AS
SELECT 
  tipo_parto,
  COUNT(*) as total_partos,
  COUNT(*) FILTER (WHERE complicaciones IS NOT NULL AND array_length(complicaciones, 1) > 0) as partos_complicados,
  ROUND(100.0 * COUNT(*) FILTER (WHERE complicaciones IS NOT NULL AND array_length(complicaciones, 1) > 0) / COUNT(*), 2) as porcentaje_complicaciones
FROM obstetricia.partos
GROUP BY tipo_parto;

-- ============================================================================
-- FUNCIONES AUXILIARES
-- ============================================================================

-- Función: Calcular edad gestacional en semanas desde FUM
CREATE OR REPLACE FUNCTION obstetricia.calcular_edad_gestacional(fecha_dum DATE)
RETURNS INT AS $$
DECLARE
  semanas INT;
BEGIN
  semanas := EXTRACT(DAY FROM (CURRENT_DATE - fecha_dum)) / 7;
  RETURN GREATEST(0, semanas);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función: Calcular línea de alerta OMS (Partograma)
-- Según OMS: Línea alerta = Dilatación a las 1 cm/hora desde punto de referencia
CREATE OR REPLACE FUNCTION obstetricia.calcular_linea_alerta(horas_desde_inicio INT, punto_inicio_dilatacion INT)
RETURNS INT AS $$
BEGIN
  -- Línea de alerta: inicio + 1 cm/hora
  RETURN LEAST(10, punto_inicio_dilatacion + horas_desde_inicio);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función: Calcular línea de acción OMS
-- Según OMS: Línea acción = Línea alerta + 2 cm
CREATE OR REPLACE FUNCTION obstetricia.calcular_linea_accion(horas_desde_inicio INT, punto_inicio_dilatacion INT)
RETURNS INT AS $$
BEGIN
  -- Línea de acción: inicio + 1 cm/hora + 2 cm
  RETURN LEAST(10, punto_inicio_dilatacion + horas_desde_inicio + 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Actualizar updated_at automáticamente en gestaciones
CREATE OR REPLACE FUNCTION actualizar_updated_at_gestaciones()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gestaciones_updated_at
  BEFORE UPDATE ON obstetricia.gestaciones
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at_gestaciones();

-- ============================================================================
-- ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX idx_partos_complicaciones ON obstetricia.partos USING GIN (complicaciones);
CREATE INDEX idx_postparto_hemorragia ON obstetricia.postparto(hemorragia);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE obstetricia.gestaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE obstetricia.partos ENABLE ROW LEVEL SECURITY;
ALTER TABLE obstetricia.neonatos ENABLE ROW LEVEL SECURITY;

-- Policy: Solo usuarios del mismo hospital pueden ver gestaciones/partos
CREATE POLICY gestaciones_hospital_isolation ON obstetricia.gestaciones
  USING (
    hospital_id = (
      SELECT hospital_id FROM configuracion.usuarios 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY partos_hospital_isolation ON obstetricia.partos
  USING (
    hospital_id = (
      SELECT hospital_id FROM configuracion.usuarios 
      WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
