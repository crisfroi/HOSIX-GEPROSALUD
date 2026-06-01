-- Migration: configuracion.plantillas_documentos + configuracion.documentos_generados

CREATE SCHEMA IF NOT EXISTS configuracion;

CREATE TABLE IF NOT EXISTS configuracion.plantillas_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50) NOT NULL,
  contenido_html TEXT NOT NULL,
  variables_disponibles JSONB,
  requiere_firma BOOLEAN DEFAULT FALSE,
  version INT DEFAULT 1,
  activo BOOLEAN DEFAULT TRUE,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS configuracion.documentos_generados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plantilla_id UUID REFERENCES configuracion.plantillas_documentos(id),
  episodio_id UUID,
  paciente_id UUID,
  contenido_final TEXT NOT NULL,
  pdf_url TEXT,
  firmado BOOLEAN DEFAULT FALSE,
  firmado_por UUID,
  firmado_en TIMESTAMPTZ,
  hash_firma TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  viewed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);
