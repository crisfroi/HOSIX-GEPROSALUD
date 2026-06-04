-- ============================================================================
-- HOSIX - Migración 023: Maestros de Ubicación Geográfica
-- Fecha: 2025-06-04
-- Descripción: Tablas maestras para provincias y distritos sanitarios
--              Estructura normalizada y escalable para gestión de ubicaciones
-- ============================================================================

-- ============================================================================
-- 1. TABLA MAESTRA: hosix_provincias
-- ============================================================================

CREATE TABLE IF NOT EXISTS hosix_provincias (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo              VARCHAR(5)  NOT NULL UNIQUE,
  nombre              VARCHAR(255) NOT NULL UNIQUE,
  abreviatura         VARCHAR(10) NOT NULL UNIQUE,
  region              VARCHAR(255),
  activo              BOOLEAN DEFAULT true,
  orden_presentacion  SMALLINT DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provincias_codigo ON hosix_provincias(codigo);
CREATE INDEX IF NOT EXISTS idx_provincias_nombre ON hosix_provincias(nombre);
CREATE INDEX IF NOT EXISTS idx_provincias_abreviatura ON hosix_provincias(abreviatura);

ALTER TABLE hosix_provincias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "provincias_read" ON hosix_provincias FOR SELECT USING (true);
CREATE POLICY "provincias_write" ON hosix_provincias FOR INSERT WITH CHECK (true);

-- Seed data - Provincias de Guinea Ecuatorial
INSERT INTO hosix_provincias (codigo, nombre, abreviatura, orden_presentacion) VALUES
  ('BN', 'Bioko Norte', 'BN', 1),
  ('BS', 'Bioko Sur', 'BS', 2),
  ('LT', 'Litoral', 'LT', 3),
  ('CS', 'Centro Sur', 'CS', 4),
  ('KN', 'Kie-Ntem', 'KN', 5),
  ('WN', 'Wele-Nzas', 'WN', 6),
  ('DJL', 'Djibloho', 'DJL', 7),
  ('AN', 'Annobón', 'AN', 8)
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================================
-- 2. TABLA MAESTRA: hosix_distritos_sanitarios
-- ============================================================================

CREATE TABLE IF NOT EXISTS hosix_distritos_sanitarios (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo                  VARCHAR(10) NOT NULL UNIQUE,
  nombre_sanitario        VARCHAR(255) NOT NULL,
  nombre_distrito_admin   VARCHAR(255),
  provincia_id            UUID NOT NULL REFERENCES hosix_provincias(id) ON DELETE RESTRICT,
  provincia_codigo        VARCHAR(5),
  
  -- Información adicional
  capital_distrito        VARCHAR(255),
  población_estimada      INTEGER,
  centros_salud_count     INTEGER DEFAULT 0,
  zona_geografica         VARCHAR(100),
  
  -- Control
  activo                  BOOLEAN DEFAULT true,
  orden_presentacion      SMALLINT DEFAULT 0,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_distritos_codigo ON hosix_distritos_sanitarios(codigo);
CREATE INDEX IF NOT EXISTS idx_distritos_nombre ON hosix_distritos_sanitarios(nombre_sanitario);
CREATE INDEX IF NOT EXISTS idx_distritos_provincia ON hosix_distritos_sanitarios(provincia_id);
CREATE INDEX IF NOT EXISTS idx_distritos_provincia_codigo ON hosix_distritos_sanitarios(provincia_codigo);

ALTER TABLE hosix_distritos_sanitarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "distritos_read" ON hosix_distritos_sanitarios FOR SELECT USING (true);
CREATE POLICY "distritos_write" ON hosix_distritos_sanitarios FOR INSERT WITH CHECK (true);

-- Seed data - Distritos Sanitarios de Guinea Ecuatorial (del CSV proporcionado)
-- Nota: Los IDs de provincia se obtienen con subconsultas
INSERT INTO hosix_distritos_sanitarios (codigo, nombre_sanitario, nombre_distrito_admin, provincia_id, provincia_codigo, orden_presentacion) 
SELECT 
  'DS-AKB' AS codigo,
  'Distrito Sanitario de Akonibe' AS nombre_sanitario,
  'Akonibe' AS nombre_distrito_admin,
  (SELECT id FROM hosix_provincias WHERE codigo = 'WN') AS provincia_id,
  'WN' AS provincia_codigo,
  1 AS orden_presentacion
WHERE NOT EXISTS (SELECT 1 FROM hosix_distritos_sanitarios WHERE codigo = 'DS-AKB');

INSERT INTO hosix_distritos_sanitarios (codigo, nombre_sanitario, nombre_distrito_admin, provincia_id, provincia_codigo, orden_presentacion) 
SELECT 'DS-AKM', 'Distrito Sanitario de Akurenam', 'Akurenam', (SELECT id FROM hosix_provincias WHERE codigo = 'CS'), 'CS', 2 WHERE NOT EXISTS (SELECT 1 FROM hosix_distritos_sanitarios WHERE codigo = 'DS-AKM');

INSERT INTO hosix_distritos_sanitarios (codigo, nombre_sanitario, nombre_distrito_admin, provincia_id, provincia_codigo, orden_presentacion) 
SELECT 'DS-AÑ', 'Distrito Sanitario de Anisok', 'Anisok', (SELECT id FROM hosix_provincias WHERE codigo = 'WN'), 'WN', 3 WHERE NOT EXISTS (SELECT 1 FROM hosix_distritos_sanitarios WHERE codigo = 'DS-AÑ');

INSERT INTO hosix_distritos_sanitarios (codigo, nombre_sanitario, nombre_distrito_admin, provincia_id, provincia_codigo, orden_presentacion) 
SELECT 'DS-AN', 'Distrito Sanitario de Annobón', 'Annobón', (SELECT id FROM hosix_provincias WHERE codigo = 'AN'), 'AN', 4 WHERE NOT EXISTS (SELECT 1 FROM hosix_distritos_sanitarios WHERE codigo = 'DS-AN');

INSERT INTO hosix_distritos_sanitarios (codigo, nombre_sanitario, nombre_distrito_admin, provincia_id, provincia_codigo, orden_presentacion) 
SELECT 'DS-BNY', 'Distrito Sanitario de Baney', 'Baney', (SELECT id FROM hosix_provincias WHERE codigo = 'BN'), 'BN', 5 WHERE NOT EXISTS (SELECT 1 FROM hosix_distritos_sanitarios WHERE codigo = 'DS-BNY');

INSERT INTO hosix_distritos_sanitarios (codigo, nombre_sanitario, nombre_distrito_admin, provincia_id, provincia_codigo, orden_presentacion) 
SELECT 'DS-BT', 'Distrito Sanitario de Bata', 'Bata', (SELECT id FROM hosix_provincias WHERE codigo = 'LT'), 'LT', 6 WHERE NOT EXISTS (SELECT 1 FROM hosix_distritos_sanitarios WHERE codigo = 'DS-BT');

INSERT INTO hosix_distritos_sanitarios (codigo, nombre_sanitario, nombre_distrito_admin, provincia_id, provincia_codigo, orden_presentacion) 
SELECT 'DS-KG', 'Distrito Sanitario de Cogo', 'Cogo', (SELECT id FROM hosix_provincias WHERE codigo = 'LT'), 'LT', 7 WHERE NOT EXISTS (SELECT 1 FROM hosix_distritos_sanitarios WHERE codigo = 'DS-KG');

INSERT INTO hosix_distritos_sanitarios (codigo, nombre_sanitario, nombre_distrito_admin, provincia_id, provincia_codigo, orden_presentacion) 
SELECT 'DS-EB', 'Distrito Sanitario de Ebebiyin', 'Ebebiyin', (SELECT id FROM hosix_provincias WHERE codigo = 'KN'), 'KN', 8 WHERE NOT EXISTS (SELECT 1 FROM hosix_distritos_sanitarios WHERE codigo = 'DS-EB');

INSERT INTO hosix_distritos_sanitarios (codigo, nombre_sanitario, nombre_distrito_admin, provincia_id, provincia_codigo, orden_presentacion) 
SELECT 'DS-EV', 'Distrito Sanitario de Evinayong', 'Evinayong', (SELECT id FROM hosix_provincias WHERE codigo = 'CS'), 'CS', 9 WHERE NOT EXISTS (SELECT 1 FROM hosix_distritos_sanitarios WHERE codigo = 'DS-EV');

INSERT INTO hosix_distritos_sanitarios (codigo, nombre_sanitario, nombre_distrito_admin, provincia_id, provincia_codigo, orden_presentacion) 
SELECT 'DS-LB', 'Distrito Sanitario de Luba', 'Luba', (SELECT id FROM hosix_provincias WHERE codigo = 'BS'), 'BS', 10 WHERE NOT EXISTS (SELECT 1 FROM hosix_distritos_sanitarios WHERE codigo = 'DS-LB');

INSERT INTO hosix_distritos_sanitarios (codigo, nombre_sanitario, nombre_distrito_admin, provincia_id, provincia_codigo, orden_presentacion) 
SELECT 'DS-MLB', 'Distrito Sanitario de Malabo', 'Malabo', (SELECT id FROM hosix_provincias WHERE codigo = 'BN'), 'BN', 11 WHERE NOT EXISTS (SELECT 1 FROM hosix_distritos_sanitarios WHERE codigo = 'DS-MLB');

INSERT INTO hosix_distritos_sanitarios (codigo, nombre_sanitario, nombre_distrito_admin, provincia_id, provincia_codigo, orden_presentacion) 
SELECT 'DS-MBN', 'Distrito Sanitario de Mbini', 'Mbini', (SELECT id FROM hosix_provincias WHERE codigo = 'LT'), 'LT', 12 WHERE NOT EXISTS (SELECT 1 FROM hosix_distritos_sanitarios WHERE codigo = 'DS-MBN');

INSERT INTO hosix_distritos_sanitarios (codigo, nombre_sanitario, nombre_distrito_admin, provincia_id, provincia_codigo, orden_presentacion) 
SELECT 'DS-MC', 'Distrito Sanitario de Micomiseng', 'Micomiseng', (SELECT id FROM hosix_provincias WHERE codigo = 'KN'), 'KN', 13 WHERE NOT EXISTS (SELECT 1 FROM hosix_distritos_sanitarios WHERE codigo = 'DS-MC');

INSERT INTO hosix_distritos_sanitarios (codigo, nombre_sanitario, nombre_distrito_admin, provincia_id, provincia_codigo, orden_presentacion) 
SELECT 'DS-MNG', 'Distrito Sanitario de Mongomo', 'Mongomo', (SELECT id FROM hosix_provincias WHERE codigo = 'WN'), 'WN', 14 WHERE NOT EXISTS (SELECT 1 FROM hosix_distritos_sanitarios WHERE codigo = 'DS-MNG');

INSERT INTO hosix_distritos_sanitarios (codigo, nombre_sanitario, nombre_distrito_admin, provincia_id, provincia_codigo, orden_presentacion) 
SELECT 'DS-NF', 'Distrito Sanitario de Niefang', 'Niefang', (SELECT id FROM hosix_provincias WHERE codigo = 'CS'), 'CS', 15 WHERE NOT EXISTS (SELECT 1 FROM hosix_distritos_sanitarios WHERE codigo = 'DS-NF');

INSERT INTO hosix_distritos_sanitarios (codigo, nombre_sanitario, nombre_distrito_admin, provincia_id, provincia_codigo, orden_presentacion) 
SELECT 'DS-NS', 'Distrito Sanitario de Nsok Nsomo', 'Nsok Nsomo', (SELECT id FROM hosix_provincias WHERE codigo = 'KN'), 'KN', 16 WHERE NOT EXISTS (SELECT 1 FROM hosix_distritos_sanitarios WHERE codigo = 'DS-NS');

INSERT INTO hosix_distritos_sanitarios (codigo, nombre_sanitario, nombre_distrito_admin, provincia_id, provincia_codigo, orden_presentacion) 
SELECT 'DS-NK', 'Distrito Sanitario de Nsork', 'Nsork', (SELECT id FROM hosix_provincias WHERE codigo = 'WN'), 'WN', 17 WHERE NOT EXISTS (SELECT 1 FROM hosix_distritos_sanitarios WHERE codigo = 'DS-NK');

INSERT INTO hosix_distritos_sanitarios (codigo, nombre_sanitario, nombre_distrito_admin, provincia_id, provincia_codigo, orden_presentacion) 
SELECT 'DS-OY', 'Distrito Sanitario de Oyala', 'Oyala', (SELECT id FROM hosix_provincias WHERE codigo = 'DJL'), 'DJL', 18 WHERE NOT EXISTS (SELECT 1 FROM hosix_distritos_sanitarios WHERE codigo = 'DS-OY');

INSERT INTO hosix_distritos_sanitarios (codigo, nombre_sanitario, nombre_distrito_admin, provincia_id, provincia_codigo, orden_presentacion) 
SELECT 'DS-RB', 'Distrito Sanitario de Riaba', 'Riaba', (SELECT id FROM hosix_provincias WHERE codigo = 'BS'), 'BS', 19 WHERE NOT EXISTS (SELECT 1 FROM hosix_distritos_sanitarios WHERE codigo = 'DS-RB');

-- ============================================================================
-- 3. AGREGAR FOREIGN KEYS A centros_salud (de forma eficiente)
-- ============================================================================

ALTER TABLE IF EXISTS centros_salud
  ADD COLUMN IF NOT EXISTS provincia_id UUID REFERENCES hosix_provincias(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS distrito_sanitario_id UUID REFERENCES hosix_distritos_sanitarios(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_centros_salud_provincia_id ON centros_salud(provincia_id);
CREATE INDEX IF NOT EXISTS idx_centros_salud_distrito_sanitario_id ON centros_salud(distrito_sanitario_id);

COMMIT;
