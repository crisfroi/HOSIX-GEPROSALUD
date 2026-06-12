-- HOSIX Sistema de Gestión Hospitalaria
-- Migración Fase 6: Tabla de recibos de pagos
-- Fecha: 2026-06-11
-- Descripción: Crear tabla para registrar recibos de pagos de solicitudes

-- ============================================================
-- 1. TABLA: RECIBOS DE PAGOS
-- ============================================================
CREATE TABLE IF NOT EXISTS hosix_recibos_pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación del recibo
  numero_recibo VARCHAR(50) UNIQUE NOT NULL,
  tipo_documento VARCHAR(50) NOT NULL, -- 'solicitud_lab', 'solicitud_imagen', 'consulta', etc.
  documento_referencia VARCHAR(50), -- número de la solicitud/consulta
  
  -- Paciente
  paciente_id UUID NOT NULL REFERENCES hosix_pacientes(id),
  
  -- Detalles del pago
  monto_total DECIMAL(10, 2) NOT NULL,
  metodo_pago VARCHAR(50) NOT NULL, -- 'efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia', 'cheque', 'bonificacion'
  estado_pago VARCHAR(20) DEFAULT 'pagado', -- 'pagado', 'pendiente', 'anulado'
  
  -- Auditoría
  usuario_id UUID NOT NULL REFERENCES hosix_usuarios(id),
  caja_id UUID REFERENCES hosix_cajas(id),
  fecha_pago TIMESTAMPTZ DEFAULT now(),
  observaciones TEXT,
  
  -- Control
  anulado BOOLEAN DEFAULT false,
  motivo_anulacion TEXT,
  anulado_por_id UUID REFERENCES hosix_usuarios(id),
  fecha_anulacion TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_recibos_pagos_numero ON hosix_recibos_pagos(numero_recibo);
CREATE INDEX IF NOT EXISTS idx_recibos_pagos_paciente ON hosix_recibos_pagos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_recibos_pagos_fecha ON hosix_recibos_pagos(fecha_pago);
CREATE INDEX IF NOT EXISTS idx_recibos_pagos_caja ON hosix_recibos_pagos(caja_id);
CREATE INDEX IF NOT EXISTS idx_recibos_pagos_usuario ON hosix_recibos_pagos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_recibos_pagos_tipo_documento ON hosix_recibos_pagos(tipo_documento);
CREATE INDEX IF NOT EXISTS idx_recibos_pagos_estado ON hosix_recibos_pagos(estado_pago);
CREATE INDEX IF NOT EXISTS idx_recibos_pagos_anulado ON hosix_recibos_pagos(anulado);

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE hosix_recibos_pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recibos_pagos_read" ON hosix_recibos_pagos
  FOR SELECT USING (true);

CREATE POLICY "recibos_pagos_insert" ON hosix_recibos_pagos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "recibos_pagos_update" ON hosix_recibos_pagos
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 4. TRIGGER: Actualizar updated_at
-- ============================================================
DROP TRIGGER IF EXISTS actualizar_recibos_pagos_updated_at ON hosix_recibos_pagos;
CREATE TRIGGER actualizar_recibos_pagos_updated_at
BEFORE UPDATE ON hosix_recibos_pagos
FOR EACH ROW
EXECUTE FUNCTION actualizar_updated_at();

-- ============================================================
-- 5. FUNCIÓN: Anular recibo de pago
-- ============================================================
CREATE OR REPLACE FUNCTION anular_recibo_pago(
  p_recibo_id UUID,
  p_motivo TEXT,
  p_usuario_id UUID
)
RETURNS TABLE (
  id UUID,
  numero_recibo VARCHAR,
  anulado BOOLEAN,
  estado_pago VARCHAR
) AS $$
BEGIN
  UPDATE hosix_recibos_pagos
  SET
    anulado = true,
    motivo_anulacion = p_motivo,
    anulado_por_id = p_usuario_id,
    fecha_anulacion = now(),
    estado_pago = 'anulado'
  WHERE id = p_recibo_id
  RETURNING 
    hosix_recibos_pagos.id,
    hosix_recibos_pagos.numero_recibo,
    hosix_recibos_pagos.anulado,
    hosix_recibos_pagos.estado_pago
  INTO id, numero_recibo, anulado, estado_pago;

  RETURN QUERY SELECT id, numero_recibo, anulado, estado_pago;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION anular_recibo_pago(UUID, TEXT, UUID) TO authenticated, anon;
