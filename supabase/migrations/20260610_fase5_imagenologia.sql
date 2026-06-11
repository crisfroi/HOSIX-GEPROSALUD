-- HOSIX Sistema de Gestión Hospitalaria
-- Migración Fase 5: Módulo de Imagenología
-- Fecha: 2026-06-10
-- Descripción: Implementación del módulo de imagenología con modalidades, solicitudes, estudios y reportes

-- ============================================================
-- 1. MODALIDADES DE IMAGENOLOGÍA
-- ============================================================
CREATE TABLE IF NOT EXISTS hosix_imagenologia_modalidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información básica
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  
  -- Clasificación
  categoria VARCHAR(100), -- 'radiologia', 'ultrasound', 'tomografia', 'resonancia', 'medicina_nuclear', etc.
  
  -- Especificaciones
  requiere_preparacion BOOLEAN DEFAULT false,
  instrucciones_preparacion TEXT,
  duracion_aproximada_minutos INT,
  
  -- Disponibilidad
  activa BOOLEAN DEFAULT true,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_imagenologia_modalidades_codigo ON hosix_imagenologia_modalidades(codigo);
CREATE INDEX idx_imagenologia_modalidades_nombre ON hosix_imagenologia_modalidades(nombre);
CREATE INDEX idx_imagenologia_modalidades_activa ON hosix_imagenologia_modalidades(activa);

-- ============================================================
-- 2. SOLICITUDES DE IMAGENOLOGÍA
-- ============================================================
CREATE TABLE IF NOT EXISTS hosix_imagenologia_solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID, -- Urgencia, hospitalización, consulta, etc.
  tipo_episodio VARCHAR(50), -- 'urgencia', 'hospitalizacion', 'consulta'
  solicitado_por_id UUID REFERENCES hosix_usuarios(id),
  
  -- Modalidad
  modalidad_id UUID REFERENCES hosix_imagenologia_modalidades(id) NOT NULL,
  
  -- Información de la solicitud
  fecha_solicitud TIMESTAMPTZ DEFAULT now(),
  fecha_programada TIMESTAMPTZ,
  
  -- Prioridad y estado
  prioridad VARCHAR(20) DEFAULT 'normal', -- 'urgente', 'normal', 'diferida'
  estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'programada', 'realizada', 'cancelada'
  
  -- Información clínica
  diagnostico_clinico TEXT,
  hallazgos_relevantes TEXT,
  zona_interes VARCHAR(255), -- Ej: 'pulmón derecho', 'abdomen', etc.
  
  -- Contraste
  requiere_contraste BOOLEAN DEFAULT false,
  tipo_contraste VARCHAR(100),
  alergia_a_contraste BOOLEAN DEFAULT false,
  
  -- Observaciones
  observaciones TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_imagenologia_solicitudes_paciente ON hosix_imagenologia_solicitudes(paciente_id);
CREATE INDEX idx_imagenologia_solicitudes_estado ON hosix_imagenologia_solicitudes(estado);
CREATE INDEX idx_imagenologia_solicitudes_fecha ON hosix_imagenologia_solicitudes(fecha_solicitud);
CREATE INDEX idx_imagenologia_solicitudes_modalidad ON hosix_imagenologia_solicitudes(modalidad_id);
CREATE INDEX idx_imagenologia_solicitudes_episodio ON hosix_imagenologia_solicitudes(episodio_id, tipo_episodio);

-- ============================================================
-- 3. ESTUDIOS IMAGENOLÓGICOS
-- ============================================================
CREATE TABLE IF NOT EXISTS hosix_imagenologia_estudios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  solicitud_id UUID REFERENCES hosix_imagenologia_solicitudes(id),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  modalidad_id UUID REFERENCES hosix_imagenologia_modalidades(id) NOT NULL,
  realizado_por_id UUID REFERENCES hosix_usuarios(id),
  
  -- Información del estudio
  fecha_hora_estudio TIMESTAMPTZ DEFAULT now(),
  duracion_minutos INT,
  
  -- Calidad del estudio
  estado_tecnico VARCHAR(50), -- 'aceptable', 'pobre', 'no_diagnostico'
  razon_rechazo TEXT,
  
  -- Información del estudio
  numero_imagenes INT,
  tamaño_imagenes_mb DECIMAL(10, 2),
  
  -- Ubicación de archivos DICOM
  path_archivos_dicom TEXT,
  url_visualizacion TEXT,
  
  -- Observaciones
  observaciones_tecnicas TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_imagenologia_estudios_solicitud ON hosix_imagenologia_estudios(solicitud_id);
CREATE INDEX idx_imagenologia_estudios_paciente ON hosix_imagenologia_estudios(paciente_id);
CREATE INDEX idx_imagenologia_estudios_fecha ON hosix_imagenologia_estudios(fecha_hora_estudio);
CREATE INDEX idx_imagenologia_estudios_modalidad ON hosix_imagenologia_estudios(modalidad_id);

-- ============================================================
-- 4. REPORTES DE IMAGENOLOGÍA
-- ============================================================
CREATE TABLE IF NOT EXISTS hosix_imagenologia_reportes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  solicitud_id UUID REFERENCES hosix_imagenologia_solicitudes(id),
  estudio_id UUID REFERENCES hosix_imagenologia_estudios(id),
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  radiolog_id UUID REFERENCES hosix_usuarios(id) NOT NULL,
  
  -- Información del reporte
  fecha_reporte TIMESTAMPTZ DEFAULT now(),
  
  -- Contenido clínico
  tecnica_utilizada TEXT,
  hallazgos TEXT NOT NULL,
  diagnostico TEXT,
  conclusiones TEXT,
  recomendaciones TEXT,
  
  -- Validación y firma
  validado BOOLEAN DEFAULT false,
  validado_por_id UUID REFERENCES hosix_usuarios(id),
  fecha_validacion TIMESTAMPTZ,
  
  -- Urgencia de hallazgos
  hallazgos_urgentes BOOLEAN DEFAULT false,
  notificado_a_id UUID,
  fecha_notificacion TIMESTAMPTZ,
  
  -- Observaciones
  observaciones TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_imagenologia_reportes_solicitud ON hosix_imagenologia_reportes(solicitud_id);
CREATE INDEX idx_imagenologia_reportes_estudio ON hosix_imagenologia_reportes(estudio_id);
CREATE INDEX idx_imagenologia_reportes_paciente ON hosix_imagenologia_reportes(paciente_id);
CREATE INDEX idx_imagenologia_reportes_radiolog ON hosix_imagenologia_reportes(radiolog_id);
CREATE INDEX idx_imagenologia_reportes_fecha ON hosix_imagenologia_reportes(fecha_reporte);
CREATE INDEX idx_imagenologia_reportes_validado ON hosix_imagenologia_reportes(validado, hallazgos_urgentes);

-- ============================================================
-- 5. HABILITAR ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE hosix_imagenologia_modalidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_imagenologia_solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_imagenologia_estudios ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_imagenologia_reportes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. POLÍTICAS DE ROW LEVEL SECURITY
-- ============================================================

-- Modalidades (lectura pública para usuarios autenticados)
DROP POLICY IF EXISTS "imagenologia_modalidades_read" ON hosix_imagenologia_modalidades;
CREATE POLICY "imagenologia_modalidades_read"
  ON hosix_imagenologia_modalidades FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Solicitudes (acceso a propias y del servicio)
DROP POLICY IF EXISTS "imagenologia_solicitudes_read" ON hosix_imagenologia_solicitudes;
CREATE POLICY "imagenologia_solicitudes_read"
  ON hosix_imagenologia_solicitudes FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      solicitado_por_id = auth.uid()::uuid OR
      EXISTS (
        SELECT 1 FROM hosix_usuarios u
        WHERE u.id = auth.uid()::uuid
      )
    )
  );

DROP POLICY IF EXISTS "imagenologia_solicitudes_create" ON hosix_imagenologia_solicitudes;
CREATE POLICY "imagenologia_solicitudes_create"
  ON hosix_imagenologia_solicitudes FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    solicitado_por_id = auth.uid()::uuid
  );

-- Estudios (acceso para personal de imagenología)
DROP POLICY IF EXISTS "imagenologia_estudios_read" ON hosix_imagenologia_estudios;
CREATE POLICY "imagenologia_estudios_read"
  ON hosix_imagenologia_estudios FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM hosix_usuarios u
      WHERE u.id = auth.uid()::uuid
    )
  );

DROP POLICY IF EXISTS "imagenologia_estudios_create" ON hosix_imagenologia_estudios;
CREATE POLICY "imagenologia_estudios_create"
  ON hosix_imagenologia_estudios FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    realizado_por_id = auth.uid()::uuid
  );

-- Reportes (acceso para radiólogos)
DROP POLICY IF EXISTS "imagenologia_reportes_read" ON hosix_imagenologia_reportes;
CREATE POLICY "imagenologia_reportes_read"
  ON hosix_imagenologia_reportes FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      radiolog_id = auth.uid()::uuid OR
      validado_por_id = auth.uid()::uuid OR
      EXISTS (
        SELECT 1 FROM hosix_usuarios u
        WHERE u.id = auth.uid()::uuid
      )
    )
  );

DROP POLICY IF EXISTS "imagenologia_reportes_create" ON hosix_imagenologia_reportes;
CREATE POLICY "imagenologia_reportes_create"
  ON hosix_imagenologia_reportes FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    radiolog_id = auth.uid()::uuid
  );
