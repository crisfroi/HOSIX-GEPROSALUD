-- HOSIX Sistema de Gestión Hospitalaria
-- Migración Combinada Fase 5: Laboratorio, Imagenología, Enfermería
-- Fecha: 2026-06-10
-- Descripción: Aplicación de todas las tablas y políticas para Laboratorio, Imagenología y Enfermería

-- ============================================================
-- LABORATORIO CLÍNICO
-- ============================================================

-- 1. CATÁLOGO DE PRUEBAS
CREATE TABLE IF NOT EXISTS hosix_laboratorio_pruebas_catalogo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  categoria VARCHAR(100),
  subcategoria VARCHAR(100),
  tipo_muestra VARCHAR(100),
  volumen_muestra_ml DECIMAL(10, 2),
  instrucciones_recoleccion TEXT,
  valor_referencia_minimo DECIMAL(15, 4),
  valor_referencia_maximo DECIMAL(15, 4),
  unidad_medida VARCHAR(50),
  tiempo_procesamiento_horas INT,
  requiere_ayuno BOOLEAN DEFAULT false,
  requiere_preparacion_previa BOOLEAN DEFAULT false,
  activa BOOLEAN DEFAULT true,
  laboratorio_interno BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_laboratorio_pruebas_codigo ON hosix_laboratorio_pruebas_catalogo(codigo);
CREATE INDEX IF NOT EXISTS idx_laboratorio_pruebas_nombre ON hosix_laboratorio_pruebas_catalogo(nombre);
CREATE INDEX IF NOT EXISTS idx_laboratorio_pruebas_categoria ON hosix_laboratorio_pruebas_catalogo(categoria);
CREATE INDEX IF NOT EXISTS idx_laboratorio_pruebas_activa ON hosix_laboratorio_pruebas_catalogo(activa);

-- 2. SOLICITUDES DE LABORATORIO
CREATE TABLE IF NOT EXISTS hosix_laboratorio_solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50),
  solicitado_por_id UUID REFERENCES hosix_usuarios(id),
  fecha_solicitud TIMESTAMPTZ DEFAULT now(),
  fecha_requerida DATE,
  prioridad VARCHAR(20) DEFAULT 'normal',
  estado VARCHAR(50) DEFAULT 'pendiente',
  numero_muestra VARCHAR(50),
  fecha_recoleccion TIMESTAMPTZ,
  recolectado_por_id UUID,
  diagnostico_clinico TEXT,
  medicamentos_relevantes JSONB,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_laboratorio_solicitudes_paciente ON hosix_laboratorio_solicitudes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_laboratorio_solicitudes_estado ON hosix_laboratorio_solicitudes(estado);
CREATE INDEX IF NOT EXISTS idx_laboratorio_solicitudes_fecha ON hosix_laboratorio_solicitudes(fecha_solicitud);
CREATE INDEX IF NOT EXISTS idx_laboratorio_solicitudes_episodio ON hosix_laboratorio_solicitudes(episodio_id, tipo_episodio);

-- 3. DETALLES DE SOLICITUDES
CREATE TABLE IF NOT EXISTS hosix_laboratorio_solicitudes_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID REFERENCES hosix_laboratorio_solicitudes(id) ON DELETE CASCADE NOT NULL,
  prueba_id UUID REFERENCES hosix_laboratorio_pruebas_catalogo(id) NOT NULL,
  estado VARCHAR(50) DEFAULT 'pendiente',
  motivo_no_procesable TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_laboratorio_items_solicitud ON hosix_laboratorio_solicitudes_items(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_laboratorio_items_prueba ON hosix_laboratorio_solicitudes_items(prueba_id);

-- 4. RESULTADOS DE LABORATORIO
CREATE TABLE IF NOT EXISTS hosix_laboratorio_resultados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  solicitud_id UUID REFERENCES hosix_laboratorio_solicitudes(id),
  item_solicitud_id UUID REFERENCES hosix_laboratorio_solicitudes_items(id),
  prueba_id UUID REFERENCES hosix_laboratorio_pruebas_catalogo(id) NOT NULL,
  procesado_por_id UUID REFERENCES hosix_usuarios(id),
  fecha_resultado TIMESTAMPTZ DEFAULT now(),
  valor_resultado VARCHAR(100),
  valor_numerico DECIMAL(15, 4),
  unidad_medida VARCHAR(50),
  valor_referencia_minimo DECIMAL(15, 4),
  valor_referencia_maximo DECIMAL(15, 4),
  estado_resultado VARCHAR(50),
  validado BOOLEAN DEFAULT false,
  validado_por_id UUID REFERENCES hosix_usuarios(id),
  fecha_validacion TIMESTAMPTZ,
  observaciones TEXT,
  interpretacion_clinica TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_laboratorio_resultados_paciente ON hosix_laboratorio_resultados(paciente_id);
CREATE INDEX IF NOT EXISTS idx_laboratorio_resultados_solicitud ON hosix_laboratorio_resultados(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_laboratorio_resultados_prueba ON hosix_laboratorio_resultados(prueba_id);
CREATE INDEX IF NOT EXISTS idx_laboratorio_resultados_fecha ON hosix_laboratorio_resultados(fecha_resultado);
CREATE INDEX IF NOT EXISTS idx_laboratorio_resultados_estado ON hosix_laboratorio_resultados(estado_resultado, validado);

-- 5. CONTROL DE CALIDAD
CREATE TABLE IF NOT EXISTS hosix_laboratorio_control_calidad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prueba_id UUID REFERENCES hosix_laboratorio_pruebas_catalogo(id) NOT NULL,
  fecha_control TIMESTAMPTZ DEFAULT now(),
  realizado_por_id UUID REFERENCES hosix_usuarios(id),
  valor_control_minimo DECIMAL(15, 4),
  valor_control_maximo DECIMAL(15, 4),
  resultado_control DECIMAL(15, 4),
  estado VARCHAR(50),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_laboratorio_cc_prueba ON hosix_laboratorio_control_calidad(prueba_id);
CREATE INDEX IF NOT EXISTS idx_laboratorio_cc_fecha ON hosix_laboratorio_control_calidad(fecha_control);

-- ============================================================
-- IMAGENOLOGÍA
-- ============================================================

-- 1. MODALIDADES DE IMAGENOLOGÍA
CREATE TABLE IF NOT EXISTS hosix_imagenologia_modalidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  categoria VARCHAR(100),
  requiere_preparacion BOOLEAN DEFAULT false,
  instrucciones_preparacion TEXT,
  duracion_aproximada_minutos INT,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_imagenologia_modalidades_codigo ON hosix_imagenologia_modalidades(codigo);
CREATE INDEX IF NOT EXISTS idx_imagenologia_modalidades_nombre ON hosix_imagenologia_modalidades(nombre);
CREATE INDEX IF NOT EXISTS idx_imagenologia_modalidades_activa ON hosix_imagenologia_modalidades(activa);

-- 2. SOLICITUDES DE IMAGENOLOGÍA
CREATE TABLE IF NOT EXISTS hosix_imagenologia_solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50),
  solicitado_por_id UUID REFERENCES hosix_usuarios(id),
  modalidad_id UUID REFERENCES hosix_imagenologia_modalidades(id) NOT NULL,
  fecha_solicitud TIMESTAMPTZ DEFAULT now(),
  fecha_programada TIMESTAMPTZ,
  prioridad VARCHAR(20) DEFAULT 'normal',
  estado VARCHAR(50) DEFAULT 'pendiente',
  diagnostico_clinico TEXT,
  hallazgos_relevantes TEXT,
  zona_interes VARCHAR(255),
  requiere_contraste BOOLEAN DEFAULT false,
  tipo_contraste VARCHAR(100),
  alergia_a_contraste BOOLEAN DEFAULT false,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_imagenologia_solicitudes_paciente ON hosix_imagenologia_solicitudes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_imagenologia_solicitudes_estado ON hosix_imagenologia_solicitudes(estado);
CREATE INDEX IF NOT EXISTS idx_imagenologia_solicitudes_fecha ON hosix_imagenologia_solicitudes(fecha_solicitud);
CREATE INDEX IF NOT EXISTS idx_imagenologia_solicitudes_modalidad ON hosix_imagenologia_solicitudes(modalidad_id);
CREATE INDEX IF NOT EXISTS idx_imagenologia_solicitudes_episodio ON hosix_imagenologia_solicitudes(episodio_id, tipo_episodio);

-- 3. ESTUDIOS IMAGENOLÓGICOS
CREATE TABLE IF NOT EXISTS hosix_imagenologia_estudios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID REFERENCES hosix_imagenologia_solicitudes(id),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  modalidad_id UUID REFERENCES hosix_imagenologia_modalidades(id) NOT NULL,
  realizado_por_id UUID REFERENCES hosix_usuarios(id),
  fecha_hora_estudio TIMESTAMPTZ DEFAULT now(),
  duracion_minutos INT,
  estado_tecnico VARCHAR(50),
  razon_rechazo TEXT,
  numero_imagenes INT,
  tamaño_imagenes_mb DECIMAL(10, 2),
  path_archivos_dicom TEXT,
  url_visualizacion TEXT,
  observaciones_tecnicas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_imagenologia_estudios_solicitud ON hosix_imagenologia_estudios(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_imagenologia_estudios_paciente ON hosix_imagenologia_estudios(paciente_id);
CREATE INDEX IF NOT EXISTS idx_imagenologia_estudios_fecha ON hosix_imagenologia_estudios(fecha_hora_estudio);
CREATE INDEX IF NOT EXISTS idx_imagenologia_estudios_modalidad ON hosix_imagenologia_estudios(modalidad_id);

-- 4. REPORTES DE IMAGENOLOGÍA
CREATE TABLE IF NOT EXISTS hosix_imagenologia_reportes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID REFERENCES hosix_imagenologia_solicitudes(id),
  estudio_id UUID REFERENCES hosix_imagenologia_estudios(id),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  radiolog_id UUID REFERENCES hosix_usuarios(id) NOT NULL,
  fecha_reporte TIMESTAMPTZ DEFAULT now(),
  tecnica_utilizada TEXT,
  hallazgos TEXT NOT NULL,
  diagnostico TEXT,
  conclusiones TEXT,
  recomendaciones TEXT,
  validado BOOLEAN DEFAULT false,
  validado_por_id UUID REFERENCES hosix_usuarios(id),
  fecha_validacion TIMESTAMPTZ,
  hallazgos_urgentes BOOLEAN DEFAULT false,
  notificado_a_id UUID,
  fecha_notificacion TIMESTAMPTZ,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_imagenologia_reportes_solicitud ON hosix_imagenologia_reportes(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_imagenologia_reportes_estudio ON hosix_imagenologia_reportes(estudio_id);
CREATE INDEX IF NOT EXISTS idx_imagenologia_reportes_paciente ON hosix_imagenologia_reportes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_imagenologia_reportes_radiolog ON hosix_imagenologia_reportes(radiolog_id);
CREATE INDEX IF NOT EXISTS idx_imagenologia_reportes_fecha ON hosix_imagenologia_reportes(fecha_reporte);
CREATE INDEX IF NOT EXISTS idx_imagenologia_reportes_validado ON hosix_imagenologia_reportes(validado, hallazgos_urgentes);

-- ============================================================
-- ENFERMERÍA (Application)
-- ============================================================

-- Note: Enfermería migration 20250205_010_hosix_enfermeria.sql already exists
-- This is included here for completeness in case it needs to be reapplied

CREATE TABLE IF NOT EXISTS hosix_enfermeria_worklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID,
  tipo_episodio VARCHAR(50) NOT NULL,
  servicio_id UUID REFERENCES hosix_servicios(id),
  enfermera_asignada_id UUID REFERENCES hosix_usuarios(id),
  fecha_asignacion TIMESTAMPTZ DEFAULT now(),
  estado VARCHAR(50) DEFAULT 'pendiente',
  prioridad VARCHAR(20) DEFAULT 'normal',
  observaciones TEXT,
  requiere_atencion_continua BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enfermeria_worklist_paciente ON hosix_enfermeria_worklist(paciente_id);
CREATE INDEX IF NOT EXISTS idx_enfermeria_worklist_episodio ON hosix_enfermeria_worklist(episodio_id, tipo_episodio);
CREATE INDEX IF NOT EXISTS idx_enfermeria_worklist_enfermera ON hosix_enfermeria_worklist(enfermera_asignada_id);
CREATE INDEX IF NOT EXISTS idx_enfermeria_worklist_estado ON hosix_enfermeria_worklist(estado, prioridad);
CREATE INDEX IF NOT EXISTS idx_enfermeria_worklist_servicio ON hosix_enfermeria_worklist(servicio_id);

-- ============================================================
-- ROW LEVEL SECURITY - LABORATORIO
-- ============================================================

ALTER TABLE hosix_laboratorio_pruebas_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_laboratorio_solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_laboratorio_solicitudes_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_laboratorio_resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_laboratorio_control_calidad ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "laboratorio_pruebas_read" ON hosix_laboratorio_pruebas_catalogo;
CREATE POLICY "laboratorio_pruebas_read"
  ON hosix_laboratorio_pruebas_catalogo FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "laboratorio_solicitudes_read" ON hosix_laboratorio_solicitudes;
CREATE POLICY "laboratorio_solicitudes_read"
  ON hosix_laboratorio_solicitudes FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "laboratorio_solicitudes_create" ON hosix_laboratorio_solicitudes;
CREATE POLICY "laboratorio_solicitudes_create"
  ON hosix_laboratorio_solicitudes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "laboratorio_items_read" ON hosix_laboratorio_solicitudes_items;
CREATE POLICY "laboratorio_items_read"
  ON hosix_laboratorio_solicitudes_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "laboratorio_items_create" ON hosix_laboratorio_solicitudes_items;
CREATE POLICY "laboratorio_items_create"
  ON hosix_laboratorio_solicitudes_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "laboratorio_resultados_read" ON hosix_laboratorio_resultados;
CREATE POLICY "laboratorio_resultados_read"
  ON hosix_laboratorio_resultados FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "laboratorio_resultados_create" ON hosix_laboratorio_resultados;
CREATE POLICY "laboratorio_resultados_create"
  ON hosix_laboratorio_resultados FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "laboratorio_cc_read" ON hosix_laboratorio_control_calidad;
CREATE POLICY "laboratorio_cc_read"
  ON hosix_laboratorio_control_calidad FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "laboratorio_cc_create" ON hosix_laboratorio_control_calidad;
CREATE POLICY "laboratorio_cc_create"
  ON hosix_laboratorio_control_calidad FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- ROW LEVEL SECURITY - IMAGENOLOGÍA
-- ============================================================

ALTER TABLE hosix_imagenologia_modalidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_imagenologia_solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_imagenologia_estudios ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_imagenologia_reportes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "imagenologia_modalidades_read" ON hosix_imagenologia_modalidades;
CREATE POLICY "imagenologia_modalidades_read"
  ON hosix_imagenologia_modalidades FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "imagenologia_solicitudes_read" ON hosix_imagenologia_solicitudes;
CREATE POLICY "imagenologia_solicitudes_read"
  ON hosix_imagenologia_solicitudes FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "imagenologia_solicitudes_create" ON hosix_imagenologia_solicitudes;
CREATE POLICY "imagenologia_solicitudes_create"
  ON hosix_imagenologia_solicitudes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "imagenologia_estudios_read" ON hosix_imagenologia_estudios;
CREATE POLICY "imagenologia_estudios_read"
  ON hosix_imagenologia_estudios FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "imagenologia_estudios_create" ON hosix_imagenologia_estudios;
CREATE POLICY "imagenologia_estudios_create"
  ON hosix_imagenologia_estudios FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "imagenologia_reportes_read" ON hosix_imagenologia_reportes;
CREATE POLICY "imagenologia_reportes_read"
  ON hosix_imagenologia_reportes FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "imagenologia_reportes_create" ON hosix_imagenologia_reportes;
CREATE POLICY "imagenologia_reportes_create"
  ON hosix_imagenologia_reportes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- DONE
-- ============================================================
