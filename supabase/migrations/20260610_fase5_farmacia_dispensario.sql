-- HOSIX Sistema de Gestión Hospitalaria
-- Migración: Módulo de Farmacia - Fase 5
-- Fecha: 2026-06-10
-- Descripción: Tablas para dispensario, dispensaciones y farmacovigilancia

-- ============================================================
-- 1. DISPENSARIOS (Puntos de distribución de medicinas)
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_farmacia_dispensario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  codigo VARCHAR(50) UNIQUE,
  
  ubicacion TEXT,
  responsable_id UUID REFERENCES hosix_usuarios(id),
  
  horario_apertura TIME,
  horario_cierre TIME,
  
  activo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_farmacia_dispensario_nombre 
  ON hosix_farmacia_dispensario(nombre);
CREATE INDEX IF NOT EXISTS idx_farmacia_dispensario_activo 
  ON hosix_farmacia_dispensario(activo);

-- ============================================================
-- 2. DISPENSACIONES (Entregas de medicamentos)
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_farmacia_dispensaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_dispensacion VARCHAR(50) UNIQUE NOT NULL,
  
  dispensario_id UUID NOT NULL REFERENCES hosix_farmacia_dispensario(id),
  prescripcion_id UUID REFERENCES hosix_prescripciones(id),
  paciente_id UUID REFERENCES hosix_pacientes(id),
  
  medicamento_id UUID REFERENCES hosix_articulos(id),
  nombre_medicamento VARCHAR(255) NOT NULL,
  cantidad_solicitada DECIMAL(10,2),
  cantidad_dispensada DECIMAL(10,2),
  
  unidad_dispensacion VARCHAR(50),
  lote VARCHAR(50),
  fecha_vencimiento DATE,
  
  dispensador_id UUID REFERENCES hosix_usuarios(id),
  
  fecha_dispensacion TIMESTAMPTZ DEFAULT now(),
  
  estado VARCHAR(50) DEFAULT 'completada', -- completada, parcial, rechazada, devuelta
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dispensaciones_dispensario 
  ON hosix_farmacia_dispensaciones(dispensario_id);
CREATE INDEX IF NOT EXISTS idx_dispensaciones_paciente 
  ON hosix_farmacia_dispensaciones(paciente_id);
CREATE INDEX IF NOT EXISTS idx_dispensaciones_fecha 
  ON hosix_farmacia_dispensaciones(fecha_dispensacion);
CREATE INDEX IF NOT EXISTS idx_dispensaciones_estado 
  ON hosix_farmacia_dispensaciones(estado);

-- ============================================================
-- 3. FARMACOVIGILANCIA (Monitoreo de efectos adversos)
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_farmacia_farmacovigilancia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_evento VARCHAR(50) UNIQUE NOT NULL,
  
  paciente_id UUID REFERENCES hosix_pacientes(id),
  medicamento_id UUID REFERENCES hosix_articulos(id),
  nombre_medicamento VARCHAR(255) NOT NULL,
  
  tipo_evento VARCHAR(100) NOT NULL, -- reaccion_adversa, interaccion, sobredosis, efecto_secundario
  severidad VARCHAR(50), -- leve, moderada, grave, mortal
  
  descripcion TEXT NOT NULL,
  sintomas TEXT,
  
  fecha_evento TIMESTAMPTZ NOT NULL,
  fecha_reporte TIMESTAMPTZ DEFAULT now(),
  
  reportado_por UUID REFERENCES hosix_usuarios(id),
  profesional_responsable_id UUID REFERENCES hosix_usuarios(id),
  
  acciones_tomadas TEXT,
  
  estado VARCHAR(50) DEFAULT 'reportado', -- reportado, investigacion, resuelto, cerrado
  
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_farmacovigilancia_medicamento 
  ON hosix_farmacia_farmacovigilancia(medicamento_id);
CREATE INDEX IF NOT EXISTS idx_farmacovigilancia_paciente 
  ON hosix_farmacia_farmacovigilancia(paciente_id);
CREATE INDEX IF NOT EXISTS idx_farmacovigilancia_fecha_evento 
  ON hosix_farmacia_farmacovigilancia(fecha_evento);
CREATE INDEX IF NOT EXISTS idx_farmacovigilancia_severidad 
  ON hosix_farmacia_farmacovigilancia(severidad);
CREATE INDEX IF NOT EXISTS idx_farmacovigilancia_estado 
  ON hosix_farmacia_farmacovigilancia(estado);

-- ============================================================
-- SEGURIDAD - ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE hosix_farmacia_dispensario ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_farmacia_dispensaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_farmacia_farmacovigilancia ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura para usuarios autenticados
CREATE POLICY "dispensario_read" ON hosix_farmacia_dispensario
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "dispensaciones_read" ON hosix_farmacia_dispensaciones
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "farmacovigilancia_read" ON hosix_farmacia_farmacovigilancia
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Políticas de escritura para usuarios farmacia
CREATE POLICY "dispensario_write" ON hosix_farmacia_dispensario
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "dispensaciones_write" ON hosix_farmacia_dispensaciones
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "farmacovigilancia_write" ON hosix_farmacia_farmacovigilancia
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas de actualización
CREATE POLICY "dispensario_update" ON hosix_farmacia_dispensario
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "dispensaciones_update" ON hosix_farmacia_dispensaciones
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "farmacovigilancia_update" ON hosix_farmacia_farmacovigilancia
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
