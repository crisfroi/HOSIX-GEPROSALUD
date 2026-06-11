-- HOSIX Sistema de Gestión Hospitalaria
-- Migración: Módulo de Compras - Fase 5
-- Fecha: 2026-06-10
-- Descripción: Tablas para gestión de presupuestos, licitaciones, ofertas y adjudicaciones

-- ============================================================
-- 1. PRESUPUESTOS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_presupuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_presupuesto VARCHAR(50) UNIQUE NOT NULL,
  centro_coste_id UUID REFERENCES hosix_centros_coste(id),
  
  anio_presupuestario INTEGER NOT NULL,
  monto_total DECIMAL(14,2) NOT NULL,
  monto_utilizado DECIMAL(14,2) DEFAULT 0,
  monto_disponible DECIMAL(14,2) NOT NULL,
  
  estado VARCHAR(50) DEFAULT 'abierto', -- abierto, parcial, cerrado, cancelado
  descripcion TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_presupuestos_centro_coste 
  ON hosix_presupuestos(centro_coste_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_anio 
  ON hosix_presupuestos(anio_presupuestario);
CREATE INDEX IF NOT EXISTS idx_presupuestos_estado 
  ON hosix_presupuestos(estado);

-- ============================================================
-- 2. LICITACIONES
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_licitaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_licitacion VARCHAR(50) UNIQUE NOT NULL,
  presupuesto_id UUID REFERENCES hosix_presupuestos(id),
  
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  
  fecha_apertura TIMESTAMPTZ NOT NULL,
  fecha_cierre TIMESTAMPTZ NOT NULL,
  
  presupuesto_estimado DECIMAL(14,2),
  
  estado VARCHAR(50) DEFAULT 'abierta', -- abierta, en_evaluacion, adjudicada, cancelada
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_licitaciones_presupuesto 
  ON hosix_licitaciones(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_licitaciones_estado 
  ON hosix_licitaciones(estado);
CREATE INDEX IF NOT EXISTS idx_licitaciones_fecha_cierre 
  ON hosix_licitaciones(fecha_cierre);

-- ============================================================
-- 3. OFERTAS DE LICITACIÓN
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_licitaciones_ofertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  licitacion_id UUID NOT NULL REFERENCES hosix_licitaciones(id) ON DELETE CASCADE,
  proveedor_id UUID REFERENCES hosix_proveedores(id),
  
  numero_oferta VARCHAR(50) NOT NULL,
  fecha_presentacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  monto_total DECIMAL(14,2) NOT NULL,
  monto_final DECIMAL(14,2),
  
  puntuacion_tecnica DECIMAL(5,2),
  puntuacion_precio DECIMAL(5,2),
  puntuacion_total DECIMAL(5,2),
  
  estado VARCHAR(50) DEFAULT 'recibida', -- recibida, evaluada, adjudicada, rechazada
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(licitacion_id, numero_oferta)
);

CREATE INDEX IF NOT EXISTS idx_ofertas_licitacion 
  ON hosix_licitaciones_ofertas(licitacion_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_proveedor 
  ON hosix_licitaciones_ofertas(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_estado 
  ON hosix_licitaciones_ofertas(estado);

-- ============================================================
-- 4. ADJUDICACIONES
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_adjudicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_adjudicacion VARCHAR(50) UNIQUE NOT NULL,
  licitacion_id UUID NOT NULL REFERENCES hosix_licitaciones(id),
  oferta_adjudicada_id UUID NOT NULL REFERENCES hosix_licitaciones_ofertas(id),
  proveedor_adjudicado_id UUID REFERENCES hosix_proveedores(id),
  
  monto_adjudicado DECIMAL(14,2) NOT NULL,
  
  estado VARCHAR(50) DEFAULT 'vigente', -- vigente, cumplida, cancelada, en_litigio
  
  fecha_adjudicacion TIMESTAMPTZ DEFAULT now(),
  fecha_vencimiento TIMESTAMPTZ,
  
  observaciones TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adjudicaciones_licitacion 
  ON hosix_adjudicaciones(licitacion_id);
CREATE INDEX IF NOT EXISTS idx_adjudicaciones_proveedor 
  ON hosix_adjudicaciones(proveedor_adjudicado_id);
CREATE INDEX IF NOT EXISTS idx_adjudicaciones_estado 
  ON hosix_adjudicaciones(estado);

-- ============================================================
-- SEGURIDAD - ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE hosix_presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_licitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_licitaciones_ofertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_adjudicaciones ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura para usuarios autenticados
CREATE POLICY "presupuestos_read" ON hosix_presupuestos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "licitaciones_read" ON hosix_licitaciones
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "ofertas_read" ON hosix_licitaciones_ofertas
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "adjudicaciones_read" ON hosix_adjudicaciones
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Políticas de escritura para usuarios con rol compras
CREATE POLICY "presupuestos_write" ON hosix_presupuestos
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM hosix_usuarios hu
      WHERE hu.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "licitaciones_write" ON hosix_licitaciones
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM hosix_usuarios hu
      WHERE hu.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "ofertas_write" ON hosix_licitaciones_ofertas
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM hosix_usuarios hu
      WHERE hu.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "adjudicaciones_write" ON hosix_adjudicaciones
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM hosix_usuarios hu
      WHERE hu.auth_user_id = auth.uid()
    )
  );

-- Políticas de actualización
CREATE POLICY "presupuestos_update" ON hosix_presupuestos
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "licitaciones_update" ON hosix_licitaciones
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "ofertas_update" ON hosix_licitaciones_ofertas
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "adjudicaciones_update" ON hosix_adjudicaciones
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
