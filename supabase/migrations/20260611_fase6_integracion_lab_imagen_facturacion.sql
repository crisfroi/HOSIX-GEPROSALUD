-- HOSIX Sistema de Gestión Hospitalaria
-- Migración Fase 6: Integración Lab-Imagenología-Facturación-Stock
-- Fecha: 2026-06-11
-- Descripción: Agregar campos de facturación, código QR y disponibilidad a laboratorio e imagenología

-- ============================================================
-- 1. EXTENDER TABLA hosix_laboratorio_solicitudes
-- ============================================================
ALTER TABLE hosix_laboratorio_solicitudes ADD COLUMN IF NOT EXISTS tarifa_id UUID REFERENCES hosix_tarifas(id);
ALTER TABLE hosix_laboratorio_solicitudes ADD COLUMN IF NOT EXISTS estado_pago VARCHAR(20) DEFAULT 'pendiente'; -- pendiente, pagado, eximido
ALTER TABLE hosix_laboratorio_solicitudes ADD COLUMN IF NOT EXISTS monto_total DECIMAL(10, 2);
ALTER TABLE hosix_laboratorio_solicitudes ADD COLUMN IF NOT EXISTS codigo_qr VARCHAR(255) UNIQUE;
ALTER TABLE hosix_laboratorio_solicitudes ADD COLUMN IF NOT EXISTS numero_documento VARCHAR(50) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_laboratorio_solicitudes_codigo_qr ON hosix_laboratorio_solicitudes(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_laboratorio_solicitudes_numero_documento ON hosix_laboratorio_solicitudes(numero_documento);
CREATE INDEX IF NOT EXISTS idx_laboratorio_solicitudes_estado_pago ON hosix_laboratorio_solicitudes(estado_pago);

-- ============================================================
-- 2. EXTENDER TABLA hosix_imagenologia_solicitudes
-- ============================================================
ALTER TABLE hosix_imagenologia_solicitudes ADD COLUMN IF NOT EXISTS tarifa_id UUID REFERENCES hosix_tarifas(id);
ALTER TABLE hosix_imagenologia_solicitudes ADD COLUMN IF NOT EXISTS estado_pago VARCHAR(20) DEFAULT 'pendiente'; -- pendiente, pagado, eximido
ALTER TABLE hosix_imagenologia_solicitudes ADD COLUMN IF NOT EXISTS monto_total DECIMAL(10, 2);
ALTER TABLE hosix_imagenologia_solicitudes ADD COLUMN IF NOT EXISTS codigo_qr VARCHAR(255) UNIQUE;
ALTER TABLE hosix_imagenologia_solicitudes ADD COLUMN IF NOT EXISTS numero_documento VARCHAR(50) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_imagenologia_solicitudes_codigo_qr ON hosix_imagenologia_solicitudes(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_imagenologia_solicitudes_numero_documento ON hosix_imagenologia_solicitudes(numero_documento);
CREATE INDEX IF NOT EXISTS idx_imagenologia_solicitudes_estado_pago ON hosix_imagenologia_solicitudes(estado_pago);

-- ============================================================
-- 3. TABLA NUEVA: DISPONIBILIDAD DE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS hosix_disponibilidad_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tipo y relación
  tipo_solicitud VARCHAR(50) NOT NULL, -- 'laboratorio', 'imagenologia', 'prescripcion', 'hospitalizacion'
  solicitud_id UUID NOT NULL,
  item_id UUID NOT NULL, -- prueba_id, modalidad_id, medicamento_id, etc.
  
  -- Disponibilidad
  disponible BOOLEAN DEFAULT true,
  centro_alterno VARCHAR(255), -- si no hay, dónde se puede hacer
  fecha_disponible_desde TIMESTAMPTZ,
  nota TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_disponibilidad_items_solicitud ON hosix_disponibilidad_items(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_disponibilidad_items_tipo_solicitud ON hosix_disponibilidad_items(tipo_solicitud);
CREATE INDEX IF NOT EXISTS idx_disponibilidad_items_disponible ON hosix_disponibilidad_items(disponible);

ALTER TABLE hosix_disponibilidad_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "disponibilidad_items_read" ON hosix_disponibilidad_items
  FOR SELECT USING (true);

CREATE POLICY "disponibilidad_items_insert" ON hosix_disponibilidad_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "disponibilidad_items_update" ON hosix_disponibilidad_items
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 4. TABLA NUEVA: CÓDIGOS DE DOCUMENTOS (REGISTRO CENTRAL QR)
-- ============================================================
CREATE TABLE IF NOT EXISTS hosix_codigos_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  tipo_documento VARCHAR(50) NOT NULL, -- 'solicitud_lab', 'solicitud_imagen', 'prescripcion', 'hospitalizacion'
  documento_id UUID NOT NULL,
  numero_documento VARCHAR(50) UNIQUE NOT NULL,
  codigo_qr VARCHAR(255) UNIQUE NOT NULL,
  
  -- Datos para procesamiento
  datos_json JSONB, -- {tipo, id, paciente_id, items: [...], monto, etc}
  
  -- Control
  activo BOOLEAN DEFAULT true,
  escaneo_count INT DEFAULT 0,
  primer_escaneo TIMESTAMPTZ,
  ultimo_escaneo TIMESTAMPTZ,
  
  -- Auditoría
  generado_por_id UUID REFERENCES hosix_usuarios(id),
  generado_en TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_codigos_documentos_numero ON hosix_codigos_documentos(numero_documento);
CREATE INDEX IF NOT EXISTS idx_codigos_documentos_codigo_qr ON hosix_codigos_documentos(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_codigos_documentos_tipo_documento ON hosix_codigos_documentos(tipo_documento);
CREATE INDEX IF NOT EXISTS idx_codigos_documentos_documento_id ON hosix_codigos_documentos(documento_id);
CREATE INDEX IF NOT EXISTS idx_codigos_documentos_activo ON hosix_codigos_documentos(activo);

ALTER TABLE hosix_codigos_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "codigos_documentos_read" ON hosix_codigos_documentos
  FOR SELECT USING (true);

CREATE POLICY "codigos_documentos_insert" ON hosix_codigos_documentos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "codigos_documentos_update" ON hosix_codigos_documentos
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 5. EXTENDER TARIFAS (si es necesario)
-- ============================================================
-- Verificar que hosix_tarifas tenga los campos necesarios
-- Si no existen estas columnas, descomenta:
-- ALTER TABLE hosix_tarifas ADD COLUMN IF NOT EXISTS tipo_servicio VARCHAR(50); -- 'lab', 'imagen', 'consulta', 'procedimiento'
-- ALTER TABLE hosix_tarifas ADD COLUMN IF NOT EXISTS item_referencia_id UUID; -- prueba_id, modalidad_id, etc.

-- ============================================================
-- 6. FUNCIÓN AUXILIAR: Generar número de documento único
-- ============================================================
CREATE OR REPLACE FUNCTION generar_numero_documento(p_tipo VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  v_prefix VARCHAR;
  v_year INT;
  v_count INT;
  v_numero VARCHAR;
BEGIN
  -- Prefijo por tipo
  CASE p_tipo
    WHEN 'solicitud_lab' THEN v_prefix := 'LAB';
    WHEN 'solicitud_imagen' THEN v_prefix := 'IMG';
    WHEN 'prescripcion' THEN v_prefix := 'RX';
    WHEN 'hospitalizacion' THEN v_prefix := 'HOS';
    ELSE v_prefix := 'DOC';
  END CASE;
  
  v_year := EXTRACT(YEAR FROM now())::INT;
  
  -- Contar documentos del tipo en este año
  SELECT COUNT(*) INTO v_count 
  FROM hosix_codigos_documentos 
  WHERE tipo_documento = p_tipo 
    AND EXTRACT(YEAR FROM generado_en) = v_year;
  
  v_numero := v_prefix || v_year || LPAD((v_count + 1)::TEXT, 6, '0');
  
  RETURN v_numero;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. TRIGGER: Mantener timestamps actualizado
-- ============================================================
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF NOT EXISTS actualizar_disponibilidad_items_updated_at ON hosix_disponibilidad_items;
CREATE TRIGGER actualizar_disponibilidad_items_updated_at
BEFORE UPDATE ON hosix_disponibilidad_items
FOR EACH ROW
EXECUTE FUNCTION actualizar_updated_at();

DROP TRIGGER IF NOT EXISTS actualizar_codigos_documentos_updated_at ON hosix_codigos_documentos;
CREATE TRIGGER actualizar_codigos_documentos_updated_at
BEFORE UPDATE ON hosix_codigos_documentos
FOR EACH ROW
EXECUTE FUNCTION actualizar_updated_at();

-- ============================================================
-- 8. ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_laboratorio_solicitudes_tarifa ON hosix_laboratorio_solicitudes(tarifa_id);
CREATE INDEX IF NOT EXISTS idx_imagenologia_solicitudes_tarifa ON hosix_imagenologia_solicitudes(tarifa_id);
CREATE INDEX IF NOT EXISTS idx_laboratorio_solicitudes_paciente_estado_pago ON hosix_laboratorio_solicitudes(paciente_id, estado_pago);
CREATE INDEX IF NOT EXISTS idx_imagenologia_solicitudes_paciente_estado_pago ON hosix_imagenologia_solicitudes(paciente_id, estado_pago);
