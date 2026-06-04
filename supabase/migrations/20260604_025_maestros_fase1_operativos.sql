-- ============================================================================
-- HOSIX - Migración 025: Maestros Completos Fase 1 - Operativos + Configuración
-- Fecha: 2025-06-04
-- Descripción: Proveedores, Material Médico, Parámetros Sistema, Políticas
-- ============================================================================

-- ============================================================================
-- 1. MAESTRO: ZONAS DE COBERTURA TERRITORIAL
-- ============================================================================

CREATE TABLE IF NOT EXISTS hosix_zonas_cobertura (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo              VARCHAR(10) NOT NULL UNIQUE,
  nombre              VARCHAR(255) NOT NULL,
  descripcion         TEXT,
  
  -- Ubicación geográfica
  provincia_id        UUID NOT NULL REFERENCES hosix_provincias(id),
  distrito_id         UUID REFERENCES hosix_distritos_sanitarios(id),
  limites_geograficos TEXT, -- GeoJSON o descripción de límites
  
  -- Características operativas
  población_cobertura INTEGER,
  centros_responsables UUID[] DEFAULT ARRAY[]::UUID[], -- Array de IDs de centros
  responsable_id      UUID REFERENCES hosix_usuarios(id),
  
  -- Control
  activo              BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_zonas_provincia ON hosix_zonas_cobertura(provincia_id);
CREATE INDEX IF NOT EXISTS idx_zonas_distrito ON hosix_zonas_cobertura(distrito_id);
CREATE INDEX IF NOT EXISTS idx_zonas_responsable ON hosix_zonas_cobertura(responsable_id);

ALTER TABLE hosix_zonas_cobertura ENABLE ROW LEVEL SECURITY;
CREATE POLICY "zonas_read" ON hosix_zonas_cobertura FOR SELECT USING (true);
CREATE POLICY "zonas_write" ON hosix_zonas_cobertura FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 2. MAESTRO: PROVEEDORES / DISTRIBUIDORES
-- ============================================================================

CREATE TABLE IF NOT EXISTS hosix_proveedores (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo              VARCHAR(20) NOT NULL UNIQUE,
  nombre              VARCHAR(255) NOT NULL UNIQUE,
  tipo_proveedor      VARCHAR(50) CHECK (tipo_proveedor IN ('farmaceutico', 'medico_quirurgico', 'laboratorio', 'servicios', 'otros')),
  
  -- Información de contacto
  telefono            VARCHAR(20),
  email               VARCHAR(255),
  sitio_web           VARCHAR(255),
  
  -- Datos legales
  nif_ruc             VARCHAR(20),
  pais_origen         VARCHAR(100),
  
  -- Condiciones comerciales
  terminos_pago       VARCHAR(100),
  plazo_entrega_dias  INTEGER,
  descuento_volumen   DECIMAL(5,2), -- Porcentaje
  
  -- Clasificación
  es_autorizado       BOOLEAN DEFAULT false,
  es_preferente       BOOLEAN DEFAULT false,
  
  -- Contactos
  contacto_principal  VARCHAR(255),
  telefono_contacto   VARCHAR(20),
  
  -- Control
  activo              BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proveedores_nombre ON hosix_proveedores(nombre);
CREATE INDEX IF NOT EXISTS idx_proveedores_tipo ON hosix_proveedores(tipo_proveedor);
CREATE INDEX IF NOT EXISTS idx_proveedores_autorizacion ON hosix_proveedores(es_autorizado);

ALTER TABLE hosix_proveedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proveedores_read" ON hosix_proveedores FOR SELECT USING (true);
CREATE POLICY "proveedores_write" ON hosix_proveedores FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 3. MAESTRO: MATERIAL MÉDICO / INSUMOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS hosix_material_medico (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo              VARCHAR(20) NOT NULL UNIQUE,
  nombre              VARCHAR(255) NOT NULL,
  descripcion         TEXT,
  
  -- Clasificación
  categoria           VARCHAR(100),
  subcategoria        VARCHAR(100),
  tipo_material        VARCHAR(50) CHECK (tipo_material IN ('insumo', 'equipo', 'reactivo', 'suministro', 'otro')),
  
  -- Especificaciones técnicas
  especificaciones    JSONB, -- ej: {calibre: "18G", material: "acero inoxidable"}
  presentacion        VARCHAR(100), -- ej: "caja de 100"
  unidad_medida       VARCHAR(20),
  
  -- Características
  requiere_refrigeracion BOOLEAN DEFAULT false,
  es_estéril          BOOLEAN DEFAULT false,
  fecha_vencimiento   BOOLEAN DEFAULT false,
  
  -- Asociaciones
  proveedor_id        UUID REFERENCES hosix_proveedores(id),
  almacen_id          UUID REFERENCES hosix_almacenes(id),
  
  -- Costos
  precio_unitario     DECIMAL(10,2),
  precio_actualizado  TIMESTAMPTZ,
  
  -- Control
  activo              BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_material_codigo ON hosix_material_medico(codigo);
CREATE INDEX IF NOT EXISTS idx_material_codigo ON hosix_material_medico(codigo);
CREATE INDEX IF NOT EXISTS idx_material_categoria ON hosix_material_medico(categoria);
CREATE INDEX IF NOT EXISTS idx_material_proveedor ON hosix_material_medico(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_material_almacen ON hosix_material_medico(almacen_id);

ALTER TABLE hosix_material_medico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "material_read" ON hosix_material_medico FOR SELECT USING (true);
CREATE POLICY "material_write" ON hosix_material_medico FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 4. MAESTRO: SERVICIOS DE TERCEROS
-- ============================================================================

CREATE TABLE IF NOT EXISTS hosix_servicios_terceros (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo              VARCHAR(20) NOT NULL UNIQUE,
  nombre              VARCHAR(255) NOT NULL,
  descripcion         TEXT,
  
  -- Tipo de servicio
  tipo_servicio       VARCHAR(50) CHECK (tipo_servicio IN ('mantenimiento', 'limpieza', 'seguridad', 'transporte', 'consultoria', 'otro')),
  
  -- Proveedor del servicio
  proveedor_id        UUID NOT NULL REFERENCES hosix_proveedores(id),
  
  -- Cobertura
  aplica_a            VARCHAR(100)[], -- ej: ['quirofanos', 'farmacia', 'laboratorio']
  
  -- Contractual
  fecha_inicio        DATE,
  fecha_vencimiento   DATE,
  periodicidad        VARCHAR(50), -- 'diario', 'semanal', 'mensual', 'anual'
  costo_periodo       DECIMAL(12,2),
  
  -- Responsables
  responsable_interno_id UUID REFERENCES hosix_usuarios(id),
  contacto_externo    VARCHAR(255),
  
  -- Control
  activo              BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_servicios_tipo ON hosix_servicios_terceros(tipo_servicio);
CREATE INDEX IF NOT EXISTS idx_servicios_proveedor ON hosix_servicios_terceros(proveedor_id);

ALTER TABLE hosix_servicios_terceros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "servicios_terceros_read" ON hosix_servicios_terceros FOR SELECT USING (true);
CREATE POLICY "servicios_terceros_write" ON hosix_servicios_terceros FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 5. MAESTRO: PARÁMETROS DE SISTEMA
-- ============================================================================

CREATE TABLE IF NOT EXISTS hosix_parametros_sistema (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo              VARCHAR(50) NOT NULL UNIQUE,
  nombre              VARCHAR(255) NOT NULL,
  descripcion         TEXT,
  
  -- Valores
  valor_texto         TEXT,
  valor_numero        DECIMAL(15,2),
  valor_booleano      BOOLEAN,
  valor_json          JSONB,
  
  -- Tipo de parámetro
  tipo_parametro      VARCHAR(50) CHECK (tipo_parametro IN ('texto', 'numero', 'booleano', 'json', 'fecha')),
  categoría           VARCHAR(100), -- ej: 'facturacion', 'seguridad', 'clinico'
  
  -- Control de acceso
  requiere_admin      BOOLEAN DEFAULT false,
  es_confidencial     BOOLEAN DEFAULT false,
  
  -- Auditoría
  modificado_por      UUID REFERENCES hosix_usuarios(id),
  fecha_modificacion  TIMESTAMPTZ DEFAULT now(),
  
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parametros_codigo ON hosix_parametros_sistema(codigo);
CREATE INDEX IF NOT EXISTS idx_parametros_categoria ON hosix_parametros_sistema(categoría);

ALTER TABLE hosix_parametros_sistema ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parametros_read" ON hosix_parametros_sistema FOR SELECT USING (true);
CREATE POLICY "parametros_admin" ON hosix_parametros_sistema FOR UPDATE USING (requiere_admin = false OR auth.uid()::text IN (
  SELECT id::text FROM hosix_usuarios WHERE email LIKE '%admin%'
));

-- Seed data: Parámetros básicos
INSERT INTO hosix_parametros_sistema (codigo, nombre, valor_texto, tipo_parametro, categoría, descripcion) VALUES
  ('MONEDA_PAIS', 'Moneda del País', 'XAF', 'texto', 'facturacion', 'Moneda utilizada para cotizaciones'),
  ('IDIOMA_DEFECTO', 'Idioma por Defecto', 'es', 'texto', 'general', 'Idioma de la interfaz'),
  ('FORMATO_FECHA', 'Formato de Fecha', 'DD/MM/YYYY', 'texto', 'general', 'Formato de visualización de fechas'),
  ('HORAS_ANTICIPO_CITA', 'Cancelación Anticipada Citas', '24', 'numero', 'clinico', 'Horas de anticipación para cancelar'),
  ('DIAS_RETENCION_LOGS', 'Retención de Logs', '90', 'numero', 'seguridad', 'Días para mantener logs de auditoría'),
  ('ACTIVA_VALIDACION_RUT', 'Validar RUT', 'true', 'booleano', 'facturacion', 'Validación obligatoria de RUT en facturas')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================================
-- 6. MAESTRO: POLÍTICAS DE SEGURIDAD (gestión de RLS policies)
-- ============================================================================

CREATE TABLE IF NOT EXISTS hosix_politicas_seguridad (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo              VARCHAR(50) NOT NULL UNIQUE,
  nombre              VARCHAR(255) NOT NULL,
  descripcion         TEXT,
  
  -- Política
  tabla_aplicada      VARCHAR(100), -- nombre de tabla que afecta
  operacion           VARCHAR(20) CHECK (operacion IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL')),
  condicion_sql       TEXT, -- expresión WHERE para la política
  
  -- Aplicabilidad
  aplica_a_roles      VARCHAR(50)[], -- ej: ['medico', 'enfermera', 'admin']
  aplica_a_usuarios   UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Estado
  activa              BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_politicas_tabla ON hosix_politicas_seguridad(tabla_aplicada);
CREATE INDEX IF NOT EXISTS idx_politicas_operacion ON hosix_politicas_seguridad(operacion);

ALTER TABLE hosix_politicas_seguridad ENABLE ROW LEVEL SECURITY;
CREATE POLICY "politicas_read" ON hosix_politicas_seguridad FOR SELECT USING (true);
CREATE POLICY "politicas_write" ON hosix_politicas_seguridad FOR INSERT WITH CHECK (true);

-- Seed data: Políticas de seguridad básicas
INSERT INTO hosix_politicas_seguridad (codigo, nombre, tabla_aplicada, operacion, condicion_sql, aplica_a_roles, descripcion) VALUES
  ('POL-PACIENTES-MEDICO', 'Médicos ven solo pacientes de su centro', 'hosix_pacientes', 'SELECT',
   'centro_salud_id IN (SELECT centro_salud_id FROM hosix_usuarios WHERE id = auth.uid())',
   ARRAY['medico', 'medico_jefe'], 'Restricción por centro de salud'),
  ('POL-HC-MEDICO', 'Historia clínica visible solo por médico responsable', 'historia_clinica', 'SELECT',
   'paciente_id IN (SELECT id FROM hosix_pacientes WHERE centro_salud_id = (SELECT centro_salud_id FROM hosix_usuarios WHERE id = auth.uid()))',
   ARRAY['medico', 'enfermera'], 'Restricción de lectura'),
  ('POL-DATOS-SENSIBLES', 'Solo admins ven datos de salarios', 'hosix_usuarios', 'SELECT',
   'false', ARRAY['admin'], 'Máxima restricción'),
  ('POL-AUDITORIA-LECTURA', 'Todos pueden leer logs de auditoría propios', 'hosix_auditoria_logs', 'SELECT',
   'usuario_id = auth.uid() OR auth.uid()::text IN (SELECT id::text FROM hosix_usuarios WHERE email LIKE ''%admin%'')',
   ARRAY['all'], 'Auditoría personal')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================================
-- 7. VISTA CONSOLIDADA: PROVEEDOR + SERVICIOS
-- ============================================================================

CREATE OR REPLACE VIEW vista_proveedores_servicios AS
SELECT 
  p.id AS proveedor_id,
  p.nombre AS proveedor,
  p.tipo_proveedor,
  p.email,
  s.id AS servicio_id,
  s.nombre AS servicio,
  s.tipo_servicio,
  s.fecha_vencimiento,
  s.costo_periodo
FROM hosix_proveedores p
LEFT JOIN hosix_servicios_terceros s ON p.id = s.proveedor_id
WHERE p.activo = true AND (s.activo = true OR s.id IS NULL);

-- ============================================================================
-- 8. FUNCIÓN: Validar vencimiento de contrato
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_servicio_vigente(p_servicio_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM hosix_servicios_terceros
    WHERE id = p_servicio_id 
      AND activo = true
      AND (fecha_vencimiento IS NULL OR fecha_vencimiento > CURRENT_DATE)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMIT;
