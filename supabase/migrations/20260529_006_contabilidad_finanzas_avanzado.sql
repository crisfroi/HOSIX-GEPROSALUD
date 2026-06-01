-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 006: Contabilidad & Finanzas Avanzado
-- Fecha: 2026-05-29

-- ============================================================
-- 1. CUENTAS BANCARIAS POR HOSPITAL
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_cuentas_bancarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hosix_hospitales(id),

  numero_cuenta VARCHAR(50) NOT NULL,
  tipo_cuenta VARCHAR(50) NOT NULL CHECK (tipo_cuenta IN ('corriente', 'ahorros', 'especial')),
  banco_nombre VARCHAR(255) NOT NULL,
  codigo_banco VARCHAR(10),

  titular VARCHAR(255) NOT NULL,
  saldo_inicial DECIMAL(15,2) DEFAULT 0,
  saldo_actual DECIMAL(15,2) DEFAULT 0,

  iban VARCHAR(50),
  swift VARCHAR(20),

  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(hospital_id, numero_cuenta)
);

-- ============================================================
-- 2. SOLICITUDES DE MOVIMIENTO (GASTO/INGRESO)
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_solicitudes_movimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hosix_hospitales(id),
  cuenta_id UUID NOT NULL REFERENCES hosix_cuentas_bancarias(id),

  numero_solicitud VARCHAR(50) UNIQUE NOT NULL,
  tipo_movimiento VARCHAR(50) NOT NULL CHECK (tipo_movimiento IN ('gasto', 'ingreso')),

  concepto VARCHAR(255) NOT NULL,
  descripcion TEXT,
  monto DECIMAL(15,2) NOT NULL,

  solicitante_id UUID NOT NULL REFERENCES hosix_usuarios(id),
  fecha_solicitud TIMESTAMPTZ DEFAULT now(),

  estado VARCHAR(50) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'procesado')),

  aprobador_1_id UUID REFERENCES hosix_usuarios(id),
  fecha_aprobacion_1 TIMESTAMPTZ,

  aprobador_2_id UUID REFERENCES hosix_usuarios(id),
  fecha_aprobacion_2 TIMESTAMPTZ,

  motivo_rechazo TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. COMPROBANTES CON FIRMA DIGITAL Y RASTREO
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_comprobantes_movimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES hosix_solicitudes_movimiento(id),

  codigo_comprobante VARCHAR(50) UNIQUE NOT NULL,
  tipo_comprobante VARCHAR(50) NOT NULL CHECK (tipo_comprobante IN ('pago', 'deposito', 'transferencia')),

  fecha_emision TIMESTAMPTZ DEFAULT now(),
  referencia_banco VARCHAR(100),

  -- Firma Digital
  hash_documento VARCHAR(512),
  firma_digital_base64 TEXT,
  certificado_digital TEXT,
  fecha_firma TIMESTAMPTZ,

  -- Rastreo
  estado VARCHAR(50) DEFAULT 'emitido' CHECK (estado IN ('emitido', 'enviado_banco', 'procesado', 'completado', 'rechazado')),

  observaciones TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. REGISTRO COMPLETO DE MOVIMIENTOS CONTABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_movimientos_contables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comprobante_id UUID NOT NULL REFERENCES hosix_comprobantes_movimiento(id),
  cuenta_id UUID NOT NULL REFERENCES hosix_cuentas_bancarias(id),

  tipo_movimiento VARCHAR(50) NOT NULL CHECK (tipo_movimiento IN ('gasto', 'ingreso')),
  monto DECIMAL(15,2) NOT NULL,
  saldo_anterior DECIMAL(15,2),
  saldo_posterior DECIMAL(15,2),

  concepto_contable VARCHAR(255),
  referencia_documento VARCHAR(100),

  fecha_movimiento TIMESTAMPTZ DEFAULT now(),

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. AUDITORÍA COMPLETA
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_auditoria_contable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla_afectada VARCHAR(100) NOT NULL,
  registro_id UUID,

  tipo_operacion VARCHAR(50) NOT NULL CHECK (tipo_operacion IN ('INSERT', 'UPDATE', 'DELETE')),

  usuario_id UUID NOT NULL REFERENCES hosix_usuarios(id),
  datos_anteriores JSONB,
  datos_nuevos JSONB,

  ip_usuario VARCHAR(45),
  user_agent TEXT,

  fecha_auditoria TIMESTAMPTZ DEFAULT now(),

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_cuentas_bancarias_hospital ON hosix_cuentas_bancarias(hospital_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_bancarias_activa ON hosix_cuentas_bancarias(activa);

CREATE INDEX IF NOT EXISTS idx_solicitudes_hospital ON hosix_solicitudes_movimiento(hospital_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_cuenta ON hosix_solicitudes_movimiento(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON hosix_solicitudes_movimiento(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_tipo ON hosix_solicitudes_movimiento(tipo_movimiento);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha ON hosix_solicitudes_movimiento(fecha_solicitud);

CREATE INDEX IF NOT EXISTS idx_comprobantes_solicitud ON hosix_comprobantes_movimiento(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_comprobantes_estado ON hosix_comprobantes_movimiento(estado);
CREATE INDEX IF NOT EXISTS idx_comprobantes_fecha ON hosix_comprobantes_movimiento(fecha_emision);

CREATE INDEX IF NOT EXISTS idx_movimientos_comprobante ON hosix_movimientos_contables(comprobante_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_cuenta ON hosix_movimientos_contables(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON hosix_movimientos_contables(fecha_movimiento);

CREATE INDEX IF NOT EXISTS idx_auditoria_tabla ON hosix_auditoria_contable(tabla_afectada);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON hosix_auditoria_contable(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON hosix_auditoria_contable(fecha_auditoria);

-- ============================================================
-- 7. RLS POLICIES
-- ============================================================

ALTER TABLE hosix_cuentas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_solicitudes_movimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_comprobantes_movimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_movimientos_contables ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_auditoria_contable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cuentas_bancarias_read" ON hosix_cuentas_bancarias FOR SELECT USING (true);
CREATE POLICY "cuentas_bancarias_insert" ON hosix_cuentas_bancarias FOR INSERT WITH CHECK (true);
CREATE POLICY "cuentas_bancarias_update" ON hosix_cuentas_bancarias FOR UPDATE USING (true);

CREATE POLICY "solicitudes_movimiento_read" ON hosix_solicitudes_movimiento FOR SELECT USING (true);
CREATE POLICY "solicitudes_movimiento_insert" ON hosix_solicitudes_movimiento FOR INSERT WITH CHECK (true);
CREATE POLICY "solicitudes_movimiento_update" ON hosix_solicitudes_movimiento FOR UPDATE USING (true);

CREATE POLICY "comprobantes_read" ON hosix_comprobantes_movimiento FOR SELECT USING (true);
CREATE POLICY "comprobantes_insert" ON hosix_comprobantes_movimiento FOR INSERT WITH CHECK (true);
CREATE POLICY "comprobantes_update" ON hosix_comprobantes_movimiento FOR UPDATE USING (true);

CREATE POLICY "movimientos_contables_read" ON hosix_movimientos_contables FOR SELECT USING (true);
CREATE POLICY "movimientos_contables_insert" ON hosix_movimientos_contables FOR INSERT WITH CHECK (true);

CREATE POLICY "auditoria_read" ON hosix_auditoria_contable FOR SELECT USING (true);
CREATE POLICY "auditoria_insert" ON hosix_auditoria_contable FOR INSERT WITH CHECK (true);
