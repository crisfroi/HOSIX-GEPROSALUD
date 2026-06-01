-- HOSIX Sistema de Gestión Hospitalaria
-- Migración 009: Servicios/Productos con Precios Dinámicos
-- Fecha: 2026-05-29

-- ============================================================
-- 1. CATEGORIZACIÓN DE SERVICIOS/PRODUCTOS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_categorias_servicio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('servicio', 'producto', 'procedimiento')),
  activo BOOLEAN DEFAULT true,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. MAESTRO DE SERVICIOS/PRODUCTOS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_servicios_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,

  categoria_id UUID REFERENCES hosix_categorias_servicio(id),
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('servicio', 'producto', 'procedimiento')),

  -- Características
  unidad_medida VARCHAR(50) DEFAULT 'unidad',
  requiere_cantidad BOOLEAN DEFAULT true,
  requiere_autorizacion BOOLEAN DEFAULT false,
  es_facturables BOOLEAN DEFAULT true,

  -- Control
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. GESTIÓN DE PRECIOS POR HOSPITAL
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_precios_servicio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id UUID NOT NULL REFERENCES hosix_servicios_productos(id),
  hospital_id UUID NOT NULL REFERENCES hosix_hospitales(id),

  precio_base DECIMAL(12, 2) NOT NULL,
  precio_hospital DECIMAL(12, 2) NOT NULL,

  vigente_desde DATE NOT NULL,
  vigente_hasta DATE,

  moneda VARCHAR(3) DEFAULT 'XAF',
  activo BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(servicio_id, hospital_id, vigente_desde)
);

-- ============================================================
-- 4. TARIFAS POR ASEGURADORA
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_tarifas_aseguradora_servicio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id UUID NOT NULL REFERENCES hosix_servicios_productos(id),
  aseguradora_id UUID NOT NULL REFERENCES hosix_aseguradoras(id),

  precio_tarifado DECIMAL(12, 2) NOT NULL,
  porcentaje_cobertura DECIMAL(5, 2) DEFAULT 100.00,
  requiere_preautorizacion BOOLEAN DEFAULT false,

  vigente_desde DATE NOT NULL,
  vigente_hasta DATE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(servicio_id, aseguradora_id, vigente_desde)
);

-- ============================================================
-- 5. HISTORIAL DE PRECIOS (AUDITORÍA)
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_historial_precios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id UUID NOT NULL REFERENCES hosix_servicios_productos(id),
  hospital_id UUID NOT NULL REFERENCES hosix_hospitales(id),

  precio_anterior DECIMAL(12, 2),
  precio_nuevo DECIMAL(12, 2) NOT NULL,
  razon_cambio VARCHAR(255),

  usuario_id UUID REFERENCES hosix_usuarios(id),
  fecha_cambio TIMESTAMPTZ DEFAULT now(),

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_categorias_tipo ON hosix_categorias_servicio(tipo);
CREATE INDEX IF NOT EXISTS idx_categorias_activo ON hosix_categorias_servicio(activo);

CREATE INDEX IF NOT EXISTS idx_servicios_codigo ON hosix_servicios_productos(codigo);
CREATE INDEX IF NOT EXISTS idx_servicios_categoria ON hosix_servicios_productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_servicios_tipo ON hosix_servicios_productos(tipo);
CREATE INDEX IF NOT EXISTS idx_servicios_activo ON hosix_servicios_productos(activo);

CREATE INDEX IF NOT EXISTS idx_precios_servicio ON hosix_precios_servicio(servicio_id);
CREATE INDEX IF NOT EXISTS idx_precios_hospital ON hosix_precios_servicio(hospital_id);
CREATE INDEX IF NOT EXISTS idx_precios_vigencia ON hosix_precios_servicio(vigente_desde, vigente_hasta);
CREATE INDEX IF NOT EXISTS idx_precios_activo ON hosix_precios_servicio(activo);

CREATE INDEX IF NOT EXISTS idx_tarifas_servicio ON hosix_tarifas_aseguradora_servicio(servicio_id);
CREATE INDEX IF NOT EXISTS idx_tarifas_aseguradora ON hosix_tarifas_aseguradora_servicio(aseguradora_id);
CREATE INDEX IF NOT EXISTS idx_tarifas_vigencia ON hosix_tarifas_aseguradora_servicio(vigente_desde, vigente_hasta);

CREATE INDEX IF NOT EXISTS idx_historial_servicio ON hosix_historial_precios(servicio_id);
CREATE INDEX IF NOT EXISTS idx_historial_hospital ON hosix_historial_precios(hospital_id);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON hosix_historial_precios(fecha_cambio);

-- ============================================================
-- 7. RLS POLICIES
-- ============================================================

ALTER TABLE hosix_categorias_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_servicios_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_precios_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_tarifas_aseguradora_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosix_historial_precios ENABLE ROW LEVEL SECURITY;

-- Categorías - lectura para todos
CREATE POLICY "categorias_read_policy" ON hosix_categorias_servicio FOR SELECT USING (true);
CREATE POLICY "categorias_insert_policy" ON hosix_categorias_servicio FOR INSERT WITH CHECK (true);
CREATE POLICY "categorias_update_policy" ON hosix_categorias_servicio FOR UPDATE USING (true);

-- Servicios/Productos - lectura para todos
CREATE POLICY "servicios_read_policy" ON hosix_servicios_productos FOR SELECT USING (true);
CREATE POLICY "servicios_insert_policy" ON hosix_servicios_productos FOR INSERT WITH CHECK (true);
CREATE POLICY "servicios_update_policy" ON hosix_servicios_productos FOR UPDATE USING (true);

-- Precios - lectura para todos
CREATE POLICY "precios_read_policy" ON hosix_precios_servicio FOR SELECT USING (true);
CREATE POLICY "precios_insert_policy" ON hosix_precios_servicio FOR INSERT WITH CHECK (true);
CREATE POLICY "precios_update_policy" ON hosix_precios_servicio FOR UPDATE USING (true);

-- Tarifas - lectura para todos
CREATE POLICY "tarifas_read_policy" ON hosix_tarifas_aseguradora_servicio FOR SELECT USING (true);
CREATE POLICY "tarifas_insert_policy" ON hosix_tarifas_aseguradora_servicio FOR INSERT WITH CHECK (true);
CREATE POLICY "tarifas_update_policy" ON hosix_tarifas_aseguradora_servicio FOR UPDATE USING (true);

-- Historial - solo lectura
CREATE POLICY "historial_read_policy" ON hosix_historial_precios FOR SELECT USING (true);
CREATE POLICY "historial_insert_policy" ON hosix_historial_precios FOR INSERT WITH CHECK (true);

-- ============================================================
-- 8. DATOS DE PRUEBA
-- ============================================================

-- Categorías
INSERT INTO hosix_categorias_servicio (codigo, nombre, tipo, descripcion, orden) VALUES
('CONSULTA', 'Consultas', 'servicio', 'Consultas médicas generales', 1),
('PROCEDIMIENTO', 'Procedimientos', 'procedimiento', 'Procedimientos médicos y quirúrgicos', 2),
('LABORATORIO', 'Laboratorio', 'servicio', 'Análisis de laboratorio', 3),
('FARMACIA', 'Farmacia', 'producto', 'Medicamentos y productos farmacéuticos', 4),
('IMAGENOLOGIA', 'Imagenología', 'servicio', 'Servicios de radiología e imagenología', 5)
ON CONFLICT (codigo) DO NOTHING;

-- Servicios/Productos
INSERT INTO hosix_servicios_productos (codigo, nombre, categoria_id, tipo, unidad_medida, requiere_cantidad, es_facturables) VALUES
('CONS-MED-GEN', 'Consulta Médica General', (SELECT id FROM hosix_categorias_servicio WHERE codigo = 'CONSULTA'), 'servicio', 'consulta', true, true),
('CONS-ESP', 'Consulta Especializada', (SELECT id FROM hosix_categorias_servicio WHERE codigo = 'CONSULTA'), 'servicio', 'consulta', true, true),
('ESTANCIA-CAMA', 'Estancia Hospitalaria por Día', (SELECT id FROM hosix_categorias_servicio WHERE codigo = 'PROCEDIMIENTO'), 'servicio', 'día', true, true),
('CIRUGIA-MAYOR', 'Cirugía Mayor', (SELECT id FROM hosix_categorias_servicio WHERE codigo = 'PROCEDIMIENTO'), 'procedimiento', 'procedimiento', false, true),
('LAB-HEMOGRAMA', 'Hemograma Completo', (SELECT id FROM hosix_categorias_servicio WHERE codigo = 'LABORATORIO'), 'servicio', 'análisis', true, true),
('IMG-RX-TORAX', 'Radiografía de Tórax', (SELECT id FROM hosix_categorias_servicio WHERE codigo = 'IMAGENOLOGIA'), 'servicio', 'estudio', true, true)
ON CONFLICT (codigo) DO NOTHING;

-- Precios base para hospital (requiere hospital_id real después de migración de hospitales)
-- Esto es una nota: Se debe ejecutar insert adicional con hospital_id real después de crear hospital master
