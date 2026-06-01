-- Migración: tablas de familias y vínculos familiares
-- Fecha: 2026-06-01

CREATE TABLE IF NOT EXISTS hosix_familias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  direccion VARCHAR(255),
  barrio VARCHAR(255),
  distrito VARCHAR(255),
  provincia VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosix_familias_vinculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_origen_id UUID REFERENCES hosix_familias(id) NOT NULL,
  familia_destino_id UUID REFERENCES hosix_familias(id) NOT NULL,
  tipo_relacion VARCHAR(100),
  comentarios TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE IF NOT EXISTS hosix_pacientes
  ADD COLUMN IF NOT EXISTS familia_id UUID REFERENCES hosix_familias(id);

CREATE INDEX IF NOT EXISTS idx_pacientes_familia_id ON hosix_pacientes(familia_id);
CREATE INDEX IF NOT EXISTS idx_familias_nombre ON hosix_familias(nombre);
CREATE INDEX IF NOT EXISTS idx_familias_vinculos_origen ON hosix_familias_vinculos(familia_origen_id);
CREATE INDEX IF NOT EXISTS idx_familias_vinculos_destino ON hosix_familias_vinculos(familia_destino_id);
