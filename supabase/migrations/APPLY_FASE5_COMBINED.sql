-- ============================================================
-- FASE 5 - MIGRACIONES COMBINADAS
-- Copiar y pegar en Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- MIGRACIÓN 1: COMPRAS (Presupuestos, Licitaciones, Ofertas, Adjudicaciones)
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_presupuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_presupuesto VARCHAR(50) UNIQUE NOT NULL,
  centro_coste_id UUID REFERENCES hosix_centros_coste(id),
  anio_presupuestario INTEGER NOT NULL,
  monto_total DECIMAL(14,2) NOT NULL,
  monto_utilizado DECIMAL(14,2) DEFAULT 0,
  monto_disponible DECIMAL(14,2) NOT NULL,
  estado VARCHAR(50) DEFAULT 'abierto',
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_presupuestos_centro_coste ON hosix_presupuestos(centro_coste_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_anio ON hosix_presupuestos(anio_presupuestario);
CREATE INDEX IF NOT EXISTS idx_presupuestos_estado ON hosix_presupuestos(estado);

CREATE TABLE IF NOT EXISTS hosix_licitaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_licitacion VARCHAR(50) UNIQUE NOT NULL,
  presupuesto_id UUID REFERENCES hosix_presupuestos(id),
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  fecha_apertura TIMESTAMPTZ NOT NULL,
  fecha_cierre TIMESTAMPTZ NOT NULL,
  presupuesto_estimado DECIMAL(14,2),
  estado VARCHAR(50) DEFAULT 'abierta',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_licitaciones_presupuesto ON hosix_licitaciones(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_licitaciones_estado ON hosix_licitaciones(estado);
CREATE INDEX IF NOT EXISTS idx_licitaciones_fecha_cierre ON hosix_licitaciones(fecha_cierre);

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
  estado VARCHAR(50) DEFAULT 'recibida',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(licitacion_id, numero_oferta)
);

CREATE INDEX IF NOT EXISTS idx_ofertas_licitacion ON hosix_licitaciones_ofertas(licitacion_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_proveedor ON hosix_licitaciones_ofertas(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_estado ON hosix_licitaciones_ofertas(estado);

CREATE TABLE IF NOT EXISTS hosix_adjudicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_adjudicacion VARCHAR(50) UNIQUE NOT NULL,
  licitacion_id UUID NOT NULL REFERENCES hosix_licitaciones(id),
  oferta_adjudicada_id UUID NOT NULL REFERENCES hosix_licitaciones_ofertas(id),
  proveedor_adjudicado_id UUID REFERENCES hosix_proveedores(id),
  monto_adjudicado DECIMAL(14,2) NOT NULL,
  estado VARCHAR(50) DEFAULT 'vigente',
  fecha_adjudicacion TIMESTAMPTZ DEFAULT now(),
  fecha_vencimiento TIMESTAMPTZ,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adjudicaciones_licitacion ON hosix_adjudicaciones(licitacion_id);
CREATE INDEX IF NOT EXISTS idx_adjudicaciones_proveedor ON hosix_adjudicaciones(proveedor_adjudicado_id);
CREATE INDEX IF NOT EXISTS idx_adjudicaciones_estado ON hosix_adjudicaciones(estado);

ALTER TABLE hosix_presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_licitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_licitaciones_ofertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_adjudicaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "presupuestos_read" ON hosix_presupuestos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "licitaciones_read" ON hosix_licitaciones FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ofertas_read" ON hosix_licitaciones_ofertas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "adjudicaciones_read" ON hosix_adjudicaciones FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "presupuestos_write" ON hosix_presupuestos FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM hosix_usuarios hu WHERE hu.auth_user_id = auth.uid())
);
CREATE POLICY "licitaciones_write" ON hosix_licitaciones FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM hosix_usuarios hu WHERE hu.auth_user_id = auth.uid())
);
CREATE POLICY "ofertas_write" ON hosix_licitaciones_ofertas FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM hosix_usuarios hu WHERE hu.auth_user_id = auth.uid())
);
CREATE POLICY "adjudicaciones_write" ON hosix_adjudicaciones FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM hosix_usuarios hu WHERE hu.auth_user_id = auth.uid())
);

CREATE POLICY "presupuestos_update" ON hosix_presupuestos FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "licitaciones_update" ON hosix_licitaciones FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ofertas_update" ON hosix_licitaciones_ofertas FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "adjudicaciones_update" ON hosix_adjudicaciones FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- MIGRACIÓN 2: FARMACIA (Dispensarios, Dispensaciones, Farmacovigilancia)
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

CREATE INDEX IF NOT EXISTS idx_farmacia_dispensario_nombre ON hosix_farmacia_dispensario(nombre);
CREATE INDEX IF NOT EXISTS idx_farmacia_dispensario_activo ON hosix_farmacia_dispensario(activo);

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
  estado VARCHAR(50) DEFAULT 'completada',
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dispensaciones_dispensario ON hosix_farmacia_dispensaciones(dispensario_id);
CREATE INDEX IF NOT EXISTS idx_dispensaciones_paciente ON hosix_farmacia_dispensaciones(paciente_id);
CREATE INDEX IF NOT EXISTS idx_dispensaciones_fecha ON hosix_farmacia_dispensaciones(fecha_dispensacion);
CREATE INDEX IF NOT EXISTS idx_dispensaciones_estado ON hosix_farmacia_dispensaciones(estado);

CREATE TABLE IF NOT EXISTS hosix_farmacia_farmacovigilancia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_evento VARCHAR(50) UNIQUE NOT NULL,
  paciente_id UUID REFERENCES hosix_pacientes(id),
  medicamento_id UUID REFERENCES hosix_articulos(id),
  nombre_medicamento VARCHAR(255) NOT NULL,
  tipo_evento VARCHAR(100) NOT NULL,
  severidad VARCHAR(50),
  descripcion TEXT NOT NULL,
  sintomas TEXT,
  fecha_evento TIMESTAMPTZ NOT NULL,
  fecha_reporte TIMESTAMPTZ DEFAULT now(),
  reportado_por UUID REFERENCES hosix_usuarios(id),
  profesional_responsable_id UUID REFERENCES hosix_usuarios(id),
  acciones_tomadas TEXT,
  estado VARCHAR(50) DEFAULT 'reportado',
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_farmacovigilancia_medicamento ON hosix_farmacia_farmacovigilancia(medicamento_id);
CREATE INDEX IF NOT EXISTS idx_farmacovigilancia_paciente ON hosix_farmacia_farmacovigilancia(paciente_id);
CREATE INDEX IF NOT EXISTS idx_farmacovigilancia_fecha_evento ON hosix_farmacia_farmacovigilancia(fecha_evento);
CREATE INDEX IF NOT EXISTS idx_farmacovigilancia_severidad ON hosix_farmacia_farmacovigilancia(severidad);
CREATE INDEX IF NOT EXISTS idx_farmacovigilancia_estado ON hosix_farmacia_farmacovigilancia(estado);

ALTER TABLE hosix_farmacia_dispensario ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_farmacia_dispensaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_farmacia_farmacovigilancia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dispensario_read" ON hosix_farmacia_dispensario FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "dispensaciones_read" ON hosix_farmacia_dispensaciones FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "farmacovigilancia_read" ON hosix_farmacia_farmacovigilancia FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "dispensario_write" ON hosix_farmacia_dispensario FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "dispensaciones_write" ON hosix_farmacia_dispensaciones FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "farmacovigilancia_write" ON hosix_farmacia_farmacovigilancia FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "dispensario_update" ON hosix_farmacia_dispensario FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "dispensaciones_update" ON hosix_farmacia_dispensaciones FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "farmacovigilancia_update" ON hosix_farmacia_farmacovigilancia FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- FIN DE MIGRACIONES
-- Si todo se ejecutó correctamente, verás los mensajes de éxito
-- ============================================================
