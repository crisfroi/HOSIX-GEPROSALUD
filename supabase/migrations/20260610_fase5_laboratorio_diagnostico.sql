-- HOSIX Sistema de Gestión Hospitalaria
-- Migración Fase 5: Módulo de Laboratorio Clínico
-- Fecha: 2026-06-10
-- Descripción: Implementación del módulo de laboratorio con catálogos, solicitudes y resultados

-- ============================================================
-- 1. CATÁLOGO DE PRUEBAS
-- ============================================================
CREATE TABLE IF NOT EXISTS hosix_laboratorio_pruebas_catalogo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información básica
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  
  -- Clasificación
  categoria VARCHAR(100), -- 'hematología', 'química', 'inmunología', 'microbiología', etc.
  subcategoria VARCHAR(100),
  
  -- Especificaciones técnicas
  tipo_muestra VARCHAR(100), -- 'sangre', 'orina', 'heces', 'saliva', etc.
  volumen_muestra_ml DECIMAL(10, 2),
  instrucciones_recoleccion TEXT,
  
  -- Valores de referencia
  valor_referencia_minimo DECIMAL(15, 4),
  valor_referencia_maximo DECIMAL(15, 4),
  unidad_medida VARCHAR(50),
  
  -- Datos de procesamiento
  tiempo_procesamiento_horas INT, -- Horas promedio para resultado
  requiere_ayuno BOOLEAN DEFAULT false,
  requiere_preparacion_previa BOOLEAN DEFAULT false,
  
  -- Disponibilidad
  activa BOOLEAN DEFAULT true,
  laboratorio_interno BOOLEAN DEFAULT true, -- true = interno, false = referenciado
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_laboratorio_pruebas_codigo ON hosix_laboratorio_pruebas_catalogo(codigo);
CREATE INDEX idx_laboratorio_pruebas_nombre ON hosix_laboratorio_pruebas_catalogo(nombre);
CREATE INDEX idx_laboratorio_pruebas_categoria ON hosix_laboratorio_pruebas_catalogo(categoria);
CREATE INDEX idx_laboratorio_pruebas_activa ON hosix_laboratorio_pruebas_catalogo(activa);

-- ============================================================
-- 2. SOLICITUDES DE LABORATORIO
-- ============================================================
CREATE TABLE IF NOT EXISTS hosix_laboratorio_solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  episodio_id UUID, -- Urgencia, hospitalización, etc.
  tipo_episodio VARCHAR(50), -- 'urgencia', 'hospitalizacion', 'consulta'
  solicitado_por_id UUID REFERENCES hosix_usuarios(id),
  
  -- Información de la solicitud
  fecha_solicitud TIMESTAMPTZ DEFAULT now(),
  fecha_requerida DATE,
  
  -- Prioridad y estado
  prioridad VARCHAR(20) DEFAULT 'normal', -- 'urgente', 'normal', 'rutina'
  estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'recibida', 'procesando', 'completada', 'cancelada'
  
  -- Muestras
  numero_muestra VARCHAR(50),
  fecha_recoleccion TIMESTAMPTZ,
  recolectado_por_id UUID,
  
  -- Información clínica
  diagnostico_clinico TEXT,
  medicamentos_relevantes JSONB, -- Array de medicamentos que pueden afectar resultados
  observaciones TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_laboratorio_solicitudes_paciente ON hosix_laboratorio_solicitudes(paciente_id);
CREATE INDEX idx_laboratorio_solicitudes_estado ON hosix_laboratorio_solicitudes(estado);
CREATE INDEX idx_laboratorio_solicitudes_fecha ON hosix_laboratorio_solicitudes(fecha_solicitud);
CREATE INDEX idx_laboratorio_solicitudes_episodio ON hosix_laboratorio_solicitudes(episodio_id, tipo_episodio);

-- ============================================================
-- 3. DETALLES DE SOLICITUDES (Qué pruebas se solicitan)
-- ============================================================
CREATE TABLE IF NOT EXISTS hosix_laboratorio_solicitudes_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  solicitud_id UUID REFERENCES hosix_laboratorio_solicitudes(id) ON DELETE CASCADE NOT NULL,
  prueba_id UUID REFERENCES hosix_laboratorio_pruebas_catalogo(id) NOT NULL,
  
  -- Información
  estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'procesando', 'completada', 'no_procesable'
  motivo_no_procesable TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_laboratorio_items_solicitud ON hosix_laboratorio_solicitudes_items(solicitud_id);
CREATE INDEX idx_laboratorio_items_prueba ON hosix_laboratorio_solicitudes_items(prueba_id);

-- ============================================================
-- 4. RESULTADOS DE LABORATORIO
-- ============================================================
CREATE TABLE IF NOT EXISTS hosix_laboratorio_resultados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  paciente_id UUID REFERENCES hosix_pacientes(id) NOT NULL,
  solicitud_id UUID REFERENCES hosix_laboratorio_solicitudes(id),
  item_solicitud_id UUID REFERENCES hosix_laboratorio_solicitudes_items(id),
  prueba_id UUID REFERENCES hosix_laboratorio_pruebas_catalogo(id) NOT NULL,
  procesado_por_id UUID REFERENCES hosix_usuarios(id),
  
  -- Información del resultado
  fecha_resultado TIMESTAMPTZ DEFAULT now(),
  
  -- Valores
  valor_resultado VARCHAR(100),
  valor_numerico DECIMAL(15, 4),
  unidad_medida VARCHAR(50),
  
  -- Interpretación
  valor_referencia_minimo DECIMAL(15, 4),
  valor_referencia_maximo DECIMAL(15, 4),
  estado_resultado VARCHAR(50), -- 'normal', 'anormal', 'critico', 'pendiente_confirmacion'
  
  -- Validación
  validado BOOLEAN DEFAULT false,
  validado_por_id UUID REFERENCES hosix_usuarios(id),
  fecha_validacion TIMESTAMPTZ,
  
  -- Observaciones
  observaciones TEXT,
  interpretacion_clinica TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_laboratorio_resultados_paciente ON hosix_laboratorio_resultados(paciente_id);
CREATE INDEX idx_laboratorio_resultados_solicitud ON hosix_laboratorio_resultados(solicitud_id);
CREATE INDEX idx_laboratorio_resultados_prueba ON hosix_laboratorio_resultados(prueba_id);
CREATE INDEX idx_laboratorio_resultados_fecha ON hosix_laboratorio_resultados(fecha_resultado);
CREATE INDEX idx_laboratorio_resultados_estado ON hosix_laboratorio_resultados(estado_resultado, validado);

-- ============================================================
-- 5. CONTROL DE CALIDAD
-- ============================================================
CREATE TABLE IF NOT EXISTS hosix_laboratorio_control_calidad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  prueba_id UUID REFERENCES hosix_laboratorio_pruebas_catalogo(id) NOT NULL,
  
  -- Control
  fecha_control TIMESTAMPTZ DEFAULT now(),
  realizado_por_id UUID REFERENCES hosix_usuarios(id),
  
  -- Valores de control
  valor_control_minimo DECIMAL(15, 4),
  valor_control_maximo DECIMAL(15, 4),
  resultado_control DECIMAL(15, 4),
  
  estado VARCHAR(50), -- 'aceptado', 'rechazado', 'fuera_de_rango'
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_laboratorio_cc_prueba ON hosix_laboratorio_control_calidad(prueba_id);
CREATE INDEX idx_laboratorio_cc_fecha ON hosix_laboratorio_control_calidad(fecha_control);

-- ============================================================
-- 6. HABILITAR ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE hosix_laboratorio_pruebas_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_laboratorio_solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_laboratorio_solicitudes_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_laboratorio_resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_laboratorio_control_calidad ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. POLÍTICAS DE ROW LEVEL SECURITY
-- ============================================================

-- Catálogo de pruebas (lectura pública para usuarios autenticados)
DROP POLICY IF EXISTS "laboratorio_pruebas_read" ON hosix_laboratorio_pruebas_catalogo;
CREATE POLICY "laboratorio_pruebas_read"
  ON hosix_laboratorio_pruebas_catalogo FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Solicitudes (acceso a propias y del servicio)
DROP POLICY IF EXISTS "laboratorio_solicitudes_read" ON hosix_laboratorio_solicitudes;
CREATE POLICY "laboratorio_solicitudes_read"
  ON hosix_laboratorio_solicitudes FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      solicitado_por_id = auth.uid()::uuid OR
      EXISTS (
        SELECT 1 FROM hosix_usuarios u
        WHERE u.id = auth.uid()::uuid
          AND u.servicio_id = hosix_laboratorio_solicitudes.servicio_id
      )
    )
  );

DROP POLICY IF EXISTS "laboratorio_solicitudes_create" ON hosix_laboratorio_solicitudes;
CREATE POLICY "laboratorio_solicitudes_create"
  ON hosix_laboratorio_solicitudes FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    solicitado_por_id = auth.uid()::uuid
  );

-- Items de solicitud
DROP POLICY IF EXISTS "laboratorio_items_read" ON hosix_laboratorio_solicitudes_items;
CREATE POLICY "laboratorio_items_read"
  ON hosix_laboratorio_solicitudes_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hosix_laboratorio_solicitudes s
      WHERE s.id = solicitud_id
        AND (s.solicitado_por_id = auth.uid()::uuid OR auth.uid() IS NOT NULL)
    )
  );

DROP POLICY IF EXISTS "laboratorio_items_create" ON hosix_laboratorio_solicitudes_items;
CREATE POLICY "laboratorio_items_create"
  ON hosix_laboratorio_solicitudes_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hosix_laboratorio_solicitudes s
      WHERE s.id = solicitud_id
        AND s.solicitado_por_id = auth.uid()::uuid
    )
  );

-- Resultados (acceso a resultados de pacientes del servicio)
DROP POLICY IF EXISTS "laboratorio_resultados_read" ON hosix_laboratorio_resultados;
CREATE POLICY "laboratorio_resultados_read"
  ON hosix_laboratorio_resultados FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      procesado_por_id = auth.uid()::uuid OR
      validado_por_id = auth.uid()::uuid OR
      EXISTS (
        SELECT 1 FROM hosix_usuarios u
        WHERE u.id = auth.uid()::uuid
      )
    )
  );

DROP POLICY IF EXISTS "laboratorio_resultados_create" ON hosix_laboratorio_resultados;
CREATE POLICY "laboratorio_resultados_create"
  ON hosix_laboratorio_resultados FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    procesado_por_id = auth.uid()::uuid
  );

-- Control de calidad
DROP POLICY IF EXISTS "laboratorio_cc_read" ON hosix_laboratorio_control_calidad;
CREATE POLICY "laboratorio_cc_read"
  ON hosix_laboratorio_control_calidad FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "laboratorio_cc_create" ON hosix_laboratorio_control_calidad;
CREATE POLICY "laboratorio_cc_create"
  ON hosix_laboratorio_control_calidad FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
