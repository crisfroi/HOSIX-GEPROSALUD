-- HOSIX Sistema de Gestión Hospitalaria
-- Migración Fase 5: CRED (Control de Crecimiento y Desarrollo) y Lista de Espera
-- Fecha: 2026-06-10
-- Descripción: Implementación de CRED y gestión de lista de espera

-- ============================================================
-- 1. CRED - SEGUIMIENTO
-- ============================================================
CREATE TABLE IF NOT EXISTS hosix_cred_seguimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  centro_salud_id UUID REFERENCES centros_salud(id),
  
  -- Información del control
  fecha_control DATE NOT NULL,
  tipo_control VARCHAR(100), -- 'control_nino', 'control_desarrollo', 'evaluacion_nutricional'
  
  -- Datos del desarrollo
  edad_meses INT,
  peso_kg DECIMAL(5, 2),
  talla_cm DECIMAL(6, 2),
  perimetro_cefalico_cm DECIMAL(5, 2),
  imc DECIMAL(5, 2),
  
  -- Hitos del desarrollo
  hitos_motores TEXT, -- JSON con hitos alcanzados
  hitos_cognitivos TEXT,
  hitos_lenguaje TEXT,
  hitos_sociales TEXT,
  
  -- Evaluación nutricional
  estado_nutricional VARCHAR(50), -- 'normal', 'desnutricion_leve', 'desnutricion_moderada', 'desnutricion_severa'
  anemia BOOLEAN,
  avitaminosis BOOLEAN,
  
  -- Observaciones
  observaciones TEXT,
  recomendaciones TEXT,
  
  -- Registrado por
  registrado_por_id UUID REFERENCES hosix_usuarios(id),
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cred_seguimiento_paciente ON hosix_cred_seguimiento(paciente_id);
CREATE INDEX idx_cred_seguimiento_fecha ON hosix_cred_seguimiento(fecha_control);
CREATE INDEX idx_cred_seguimiento_centro ON hosix_cred_seguimiento(centro_salud_id);

-- ============================================================
-- 2. CRED - VACUNACIÓN
-- ============================================================
CREATE TABLE IF NOT EXISTS hosix_cred_vacunacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  centro_salud_id UUID REFERENCES centros_salud(id),
  
  -- Información de la vacuna
  fecha_vacunacion DATE NOT NULL,
  nombre_vacuna VARCHAR(255) NOT NULL, -- 'BCG', 'Polio', 'Pentavalente', etc.
  dosis VARCHAR(50), -- '1/3', '2/3', 'Refuerzo', etc.
  via_administracion VARCHAR(50), -- 'IM', 'SC', 'VO'
  lote VARCHAR(100),
  fecha_vencimiento DATE,
  
  -- Información del profesional
  administrado_por_id UUID REFERENCES hosix_usuarios(id),
  
  -- Reacción
  reaccion_adversa BOOLEAN DEFAULT false,
  tipo_reaccion TEXT,
  observaciones TEXT,
  
  -- Próximas dosis
  proxima_dosis_programada DATE,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cred_vacunacion_paciente ON hosix_cred_vacunacion(paciente_id);
CREATE INDEX idx_cred_vacunacion_fecha ON hosix_cred_vacunacion(fecha_vacunacion);
CREATE INDEX idx_cred_vacunacion_centro ON hosix_cred_vacunacion(centro_salud_id);
CREATE INDEX idx_cred_vacunacion_nombre ON hosix_cred_vacunacion(nombre_vacuna);

-- ============================================================
-- 3. LISTA DE ESPERA
-- ============================================================
CREATE TABLE IF NOT EXISTS hosix_lista_espera (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información del paciente
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  
  -- Tipo de solicitud
  tipo_solicitud VARCHAR(100) NOT NULL, -- 'hospitalizacion', 'consulta_ambulatoria', 'examen_diagnostico', 'cirugia'
  
  -- Servicios involucrados
  servicio_solicitante_id UUID,
  servicio_destino_id UUID,
  
  -- Información de la solicitud
  prioridad VARCHAR(20) DEFAULT 'media', -- 'baja', 'media', 'alta', 'urgente'
  fecha_solicitud TIMESTAMPTZ DEFAULT now(),
  motivo TEXT,
  
  -- Estado del trámite
  estado VARCHAR(50) DEFAULT 'activa', -- 'activa', 'asignada', 'completada', 'cancelada'
  fecha_asignacion TIMESTAMPTZ,
  
  -- Observaciones
  observaciones TEXT,
  motivo_cancelacion TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lista_espera_paciente ON hosix_lista_espera(paciente_id);
CREATE INDEX idx_lista_espera_estado ON hosix_lista_espera(estado);
CREATE INDEX idx_lista_espera_fecha ON hosix_lista_espera(fecha_solicitud);
CREATE INDEX idx_lista_espera_prioridad ON hosix_lista_espera(prioridad);
CREATE INDEX idx_lista_espera_tipo ON hosix_lista_espera(tipo_solicitud);

-- ============================================================
-- 4. HABILITAR ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE hosix_cred_seguimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_cred_vacunacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_lista_espera ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. POLÍTICAS DE ROW LEVEL SECURITY
-- ============================================================

-- CRED Seguimiento
DROP POLICY IF EXISTS "cred_seguimiento_read" ON hosix_cred_seguimiento;
CREATE POLICY "cred_seguimiento_read"
  ON hosix_cred_seguimiento FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "cred_seguimiento_create" ON hosix_cred_seguimiento;
CREATE POLICY "cred_seguimiento_create"
  ON hosix_cred_seguimiento FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "cred_seguimiento_update" ON hosix_cred_seguimiento;
CREATE POLICY "cred_seguimiento_update"
  ON hosix_cred_seguimiento FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- CRED Vacunación
DROP POLICY IF EXISTS "cred_vacunacion_read" ON hosix_cred_vacunacion;
CREATE POLICY "cred_vacunacion_read"
  ON hosix_cred_vacunacion FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "cred_vacunacion_create" ON hosix_cred_vacunacion;
CREATE POLICY "cred_vacunacion_create"
  ON hosix_cred_vacunacion FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "cred_vacunacion_update" ON hosix_cred_vacunacion;
CREATE POLICY "cred_vacunacion_update"
  ON hosix_cred_vacunacion FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Lista de Espera
DROP POLICY IF EXISTS "lista_espera_read" ON hosix_lista_espera;
CREATE POLICY "lista_espera_read"
  ON hosix_lista_espera FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "lista_espera_create" ON hosix_lista_espera;
CREATE POLICY "lista_espera_create"
  ON hosix_lista_espera FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "lista_espera_update" ON hosix_lista_espera;
CREATE POLICY "lista_espera_update"
  ON hosix_lista_espera FOR UPDATE
  USING (auth.uid() IS NOT NULL);
