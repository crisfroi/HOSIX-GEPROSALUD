-- Migration: Ampliar infraestructura de plantillas a arquitectura enterprise
-- Fecha: 5 de Junio 2026
-- Objetivo: Soporte para campos dinámicos, validaciones Zod, versionado completo, corrección RLS (Opción B)

-- ============================================================================
-- 1. EXPANDIR TABLA EXISTENTE: configuracion.plantillas_documentos
-- ============================================================================

ALTER TABLE configuracion.plantillas_documentos
  ADD COLUMN IF NOT EXISTS campos JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS validaciones JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS export_pdf BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS export_docx BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS export_xml BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notas TEXT,
  ADD COLUMN IF NOT EXISTS grupo VARCHAR(50) DEFAULT 'general';

-- ============================================================================
-- 2. NUEVA TABLA: Definición de campos dinámicos
-- ============================================================================

CREATE TABLE IF NOT EXISTS configuracion.plantillas_campos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencia
  plantilla_id UUID NOT NULL REFERENCES configuracion.plantillas_documentos(id) ON DELETE CASCADE,
  codigo VARCHAR(50) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  
  -- Tipo de campo
  tipo VARCHAR(50) NOT NULL, -- text, number, date, select, checkbox, signature, table
  posicion INT DEFAULT 0,
  
  -- Configuración
  requerido BOOLEAN DEFAULT FALSE,
  valor_defecto TEXT,
  ayuda_texto TEXT,
  validacion_regex TEXT,
  valores_select JSONB, -- Para campos select: [{label, value}]
  
  -- Propiedades
  ancho VARCHAR(20) DEFAULT 'full', -- 'full', 'half', 'third'
  visible_en_exportacion BOOLEAN DEFAULT TRUE,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(plantilla_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_plantillas_campos_plantilla ON configuracion.plantillas_campos(plantilla_id);

-- ============================================================================
-- 3. NUEVA TABLA: Historial de versiones de plantillas
-- ============================================================================

CREATE TABLE IF NOT EXISTS configuracion.plantillas_versiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencia
  plantilla_id UUID NOT NULL REFERENCES configuracion.plantillas_documentos(id) ON DELETE CASCADE,
  numero_version INT NOT NULL,
  
  -- Cambios
  contenido_html_anterior TEXT,
  contenido_html_nuevo TEXT,
  campos_anterior JSONB,
  campos_nuevo JSONB,
  cambios_descripcion TEXT,
  
  -- Auditoría
  modificado_por UUID NOT NULL,
  modificado_en TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(plantilla_id, numero_version)
);

CREATE INDEX IF NOT EXISTS idx_plantillas_versiones_plantilla ON configuracion.plantillas_versiones(plantilla_id);
CREATE INDEX IF NOT EXISTS idx_plantillas_versiones_fecha ON configuracion.plantillas_versiones(modificado_en);

-- ============================================================================
-- 4. NUEVA TABLA: Documentos generados mejorada
-- ============================================================================

ALTER TABLE configuracion.documentos_generados
  ADD COLUMN IF NOT EXISTS nombre_documento VARCHAR(255),
  ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR(50) DEFAULT 'pdf',
  ADD COLUMN IF NOT EXISTS datos_json JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS hash_documento TEXT,
  ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'borrador', -- 'borrador', 'generado', 'firmado', 'archivado'
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- ============================================================================
-- 5. NUEVA TABLA: Firmas electrónicas
-- ============================================================================

CREATE TABLE IF NOT EXISTS configuracion.documentos_firmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencia
  documento_id UUID NOT NULL REFERENCES configuracion.documentos_generados(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL,
  
  -- Firma
  timestamp_firma TIMESTAMPTZ DEFAULT NOW(),
  hash_firma TEXT NOT NULL,
  certificado_digital TEXT,
  motivo_firma TEXT,
  
  -- Validación
  firma_valida BOOLEAN DEFAULT TRUE,
  verificado_en TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documentos_firmas_documento ON configuracion.documentos_firmas(documento_id);

-- ============================================================================
-- 6. NUEVA TABLA: Auditoría de generación
-- ============================================================================

CREATE TABLE IF NOT EXISTS configuracion.documentos_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencia
  documento_id UUID NOT NULL REFERENCES configuracion.documentos_generados(id) ON DELETE CASCADE,
  plantilla_id UUID NOT NULL REFERENCES configuracion.plantillas_documentos(id),
  
  -- Evento
  evento VARCHAR(50) NOT NULL, -- 'creado', 'generado', 'descargado', 'firmado', 'enviado'
  usuario_id UUID,
  descripcion TEXT,
  
  -- Timestamp
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documentos_auditoria_documento ON configuracion.documentos_auditoria(documento_id);
CREATE INDEX IF NOT EXISTS idx_documentos_auditoria_evento ON configuracion.documentos_auditoria(evento);

-- ============================================================================
-- 7. TRIGGERS: Actualizar updated_at automáticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_plantillas_documentos_updated_at ON configuracion.plantillas_documentos;
CREATE TRIGGER trigger_plantillas_documentos_updated_at
BEFORE UPDATE ON configuracion.plantillas_documentos
FOR EACH ROW
EXECUTE FUNCTION actualizar_updated_at();

DROP TRIGGER IF EXISTS trigger_plantillas_campos_updated_at ON configuracion.plantillas_campos;
CREATE TRIGGER trigger_plantillas_campos_updated_at
BEFORE UPDATE ON configuracion.plantillas_campos
FOR EACH ROW
EXECUTE FUNCTION actualizar_updated_at();

-- ============================================================================
-- 8. FUNCIÓN: Registrar cambio de versión
-- ============================================================================

CREATE OR REPLACE FUNCTION registrar_version_plantilla(
  p_plantilla_id UUID,
  p_contenido_anterior TEXT,
  p_contenido_nuevo TEXT,
  p_campos_anterior JSONB,
  p_campos_nuevo JSONB,
  p_descripcion TEXT,
  p_usuario_id UUID
)
RETURNS INT AS $$
DECLARE
  v_numero INT;
BEGIN
  -- Obtener número de versión siguiente
  SELECT COALESCE(MAX(numero_version), 0) + 1 INTO v_numero
  FROM configuracion.plantillas_versiones
  WHERE plantilla_id = p_plantilla_id;
  
  -- Insertar registro de versión
  INSERT INTO configuracion.plantillas_versiones (
    plantilla_id, numero_version, contenido_html_anterior,
    contenido_html_nuevo, campos_anterior, campos_nuevo,
    cambios_descripcion, modificado_por
  ) VALUES (
    p_plantilla_id, v_numero, p_contenido_anterior,
    p_contenido_nuevo, p_campos_anterior, p_campos_nuevo,
    p_descripcion, p_usuario_id
  );
  
  -- Actualizar versión en tabla principal
  UPDATE configuracion.plantillas_documentos
  SET version = v_numero
  WHERE id = p_plantilla_id;
  
  RETURN v_numero;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. RLS (Row Level Security) - Configurar permisos (OPCIÓN B CORREGIDA)
-- ============================================================================

-- Activar RLS en el ecosistema de tablas
ALTER TABLE configuracion.plantillas_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion.plantillas_campos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion.plantillas_versiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion.documentos_generados ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion.documentos_firmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion.documentos_auditoria ENABLE ROW LEVEL SECURITY;

--- 9.1 POLÍTICAS: configuracion.plantillas_documentos ---
DROP POLICY IF EXISTS plantillas_read_policy ON configuracion.plantillas_documentos;
CREATE POLICY plantillas_read_policy ON configuracion.plantillas_documentos
  FOR SELECT USING (activo = true OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS plantillas_insert_policy ON configuracion.plantillas_documentos;
CREATE POLICY plantillas_insert_policy ON configuracion.plantillas_documentos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS plantillas_update_policy ON configuracion.plantillas_documentos;
CREATE POLICY plantillas_update_policy ON configuracion.plantillas_documentos
  FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS plantillas_delete_policy ON configuracion.plantillas_documentos;
CREATE POLICY plantillas_delete_policy ON configuracion.plantillas_documentos
  FOR DELETE USING (auth.uid() IS NOT NULL);

--- 9.2 POLÍTICAS: configuracion.plantillas_campos ---
DROP POLICY IF EXISTS campos_select_policy ON configuracion.plantillas_campos;
CREATE POLICY campos_select_policy ON configuracion.plantillas_campos
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS campos_insert_policy ON configuracion.plantillas_campos;
CREATE POLICY campos_insert_policy ON configuracion.plantillas_campos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS campos_update_policy ON configuracion.plantillas_campos;
CREATE POLICY campos_update_policy ON configuracion.plantillas_campos
  FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS campos_delete_policy ON configuracion.plantillas_campos;
CREATE POLICY campos_delete_policy ON configuracion.plantillas_campos
  FOR DELETE USING (auth.uid() IS NOT NULL);

--- 9.3 POLÍTICAS: configuracion.plantillas_versiones ---
DROP POLICY IF EXISTS versiones_select_policy ON configuracion.plantillas_versiones;
CREATE POLICY versiones_select_policy ON configuracion.plantillas_versiones
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS versiones_insert_policy ON configuracion.plantillas_versiones;
CREATE POLICY versiones_insert_policy ON configuracion.plantillas_versiones
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); -- Inmutable (No hay update ni delete en versiones)

--- 9.4 POLÍTICAS: configuracion.documentos_generados ---
DROP POLICY IF EXISTS doc_gen_select_policy ON configuracion.documentos_generados;
CREATE POLICY doc_gen_select_policy ON configuracion.documentos_generados
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS doc_gen_insert_policy ON configuracion.documentos_generados;
CREATE POLICY doc_gen_insert_policy ON configuracion.documentos_generados
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS doc_gen_update_policy ON configuracion.documentos_generados;
CREATE POLICY doc_gen_update_policy ON configuracion.documentos_generados
  FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS doc_gen_delete_policy ON configuracion.documentos_generados;
CREATE POLICY doc_gen_delete_policy ON configuracion.documentos_generados
  FOR DELETE USING (auth.uid() IS NOT NULL);

--- 9.5 POLÍTICAS: configuracion.documentos_firmas ---
DROP POLICY IF EXISTS firmas_select_policy ON configuracion.documentos_firmas;
CREATE POLICY firmas_select_policy ON configuracion.documentos_firmas
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS firmas_insert_policy ON configuracion.documentos_firmas;
CREATE POLICY firmas_insert_policy ON configuracion.documentos_firmas
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

--- 9.6 POLÍTICAS: configuracion.documentos_auditoria ---
DROP POLICY IF EXISTS auditoria_select_policy ON configuracion.documentos_auditoria;
CREATE POLICY auditoria_select_policy ON configuracion.documentos_auditoria
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS auditoria_insert_policy ON configuracion.documentos_auditoria;
CREATE POLICY auditoria_insert_policy ON configuracion.documentos_auditoria
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); -- Solo inserción histórica obligatoria

-- ============================================================================
-- 10. ÍNDICES para optimizar consultas
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_plantillas_documentos_codigo ON configuracion.plantillas_documentos(codigo);
CREATE INDEX IF NOT EXISTS idx_plantillas_documentos_tipo ON configuracion.plantillas_documentos(tipo);
CREATE INDEX IF NOT EXISTS idx_plantillas_documentos_grupo ON configuracion.plantillas_documentos(grupo);
CREATE INDEX IF NOT EXISTS idx_plantillas_documentos_activo ON configuracion.plantillas_documentos(activo);

CREATE INDEX IF NOT EXISTS idx_documentos_generados_plantilla ON configuracion.documentos_generados(plantilla_id);
CREATE INDEX IF NOT EXISTS idx_documentos_generados_paciente ON configuracion.documentos_generados(paciente_id);
CREATE INDEX IF NOT EXISTS idx_documentos_generados_estado ON configuracion.documentos_generados(estado);

-- ============================================================================
-- 11. VISTAS para consultas comunes
-- ============================================================================

DROP VIEW IF EXISTS configuracion.vista_plantillas_con_campos;
CREATE VIEW configuracion.vista_plantillas_con_campos AS
SELECT 
  pd.id,
  pd.codigo,
  pd.nombre,
  pd.tipo,
  pd.grupo,
  pd.activo,
  COUNT(pc.id) as total_campos,
  pd.version,
  pd.updated_at
FROM configuracion.plantillas_documentos pd
LEFT JOIN configuracion.plantillas_campos pc ON pd.id = pc.plantilla_id
GROUP BY pd.id, pd.codigo, pd.nombre, pd.tipo, pd.grupo, pd.activo, pd.version, pd.updated_at;

DROP VIEW IF EXISTS configuracion.vista_documentos_generados_con_info;
CREATE VIEW configuracion.vista_documentos_generados_con_info AS
SELECT 
  dg.id,
  dg.nombre_documento,
  dg.tipo_documento,
  dg.estado,
  dg.created_at,
  pd.nombre as plantilla_nombre,
  pd.tipo as plantilla_tipo,
  COALESCE(df.hash_firma, 'sin_firmar') as estado_firma,
  COUNT(da.id) as total_eventos_auditoria
FROM configuracion.documentos_generados dg
LEFT JOIN configuracion.plantillas_documentos pd ON dg.plantilla_id = pd.id
LEFT JOIN configuracion.documentos_firmas df ON dg.id = df.documento_id AND df.firma_valida = true
LEFT JOIN configuracion.documentos_auditoria da ON dg.id = da.documento_id
GROUP BY dg.id, dg.nombre_documento, dg.tipo_documento, dg.estado, dg.created_at,
         pd.nombre, pd.tipo, df.hash_firma;