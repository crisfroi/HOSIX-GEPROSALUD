-- ============================================================================
-- HOSIX - Migración 022: Integración CIE-11 sobre tablas existentes
-- Fecha: 2025-06-03
-- Descripción: Añade soporte CIE-11 a tablas existentes sin eliminar columnas
--              Tabla de caché + vista materializada para BI de morbilidad
-- Estrategia: Columnas nuevas (ADD COLUMN IF NOT EXISTS) + índices + RLS
-- ============================================================================

-- ============================================================================
-- 1. TABLA DE CACHÉ CIE-11: hosix_cie11_cache
-- ============================================================================

CREATE TABLE IF NOT EXISTS hosix_cie11_cache (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificadores canónicos OMS (únicos por entidad)
  codigo_cie11        VARCHAR(20)  NOT NULL,
  linearization_uri   TEXT         NOT NULL UNIQUE,
  foundation_uri      TEXT,
  
  -- Textos en español
  titulo_es           TEXT         NOT NULL,
  descripcion_es      TEXT,
  
  -- Jerarquía para estadísticas
  capitulo_codigo     VARCHAR(10),
  capitulo_titulo_es  TEXT,
  bloque_codigo       VARCHAR(20),
  bloque_titulo_es    TEXT,
  class_kind          VARCHAR(20),
  profundidad         SMALLINT,
  
  -- Mapeo hacia CIE-10 para compatibilidad
  cie10_equivalente   VARCHAR(10),
  cie10_descripcion   TEXT,
  
  -- Flags clínicos
  es_notificable      BOOLEAN DEFAULT false,
  es_cronica          BOOLEAN DEFAULT false,
  
  -- Versión del contenedor
  release_id          VARCHAR(20)  DEFAULT '2026-01',
  
  created_at          TIMESTAMPTZ  DEFAULT now(),
  updated_at          TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cie11_cache_codigo
  ON hosix_cie11_cache(codigo_cie11);

CREATE INDEX IF NOT EXISTS idx_cie11_cache_capitulo
  ON hosix_cie11_cache(capitulo_codigo);

CREATE INDEX IF NOT EXISTS idx_cie11_cache_titulo_fts
  ON hosix_cie11_cache USING GIN (to_tsvector('spanish', titulo_es));

ALTER TABLE hosix_cie11_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cie11_cache_read"   ON hosix_cie11_cache FOR SELECT USING (true);
CREATE POLICY "cie11_cache_insert" ON hosix_cie11_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "cie11_cache_update" ON hosix_cie11_cache FOR UPDATE USING (true);

-- ============================================================================
-- 2. AGREGAR COLUMNAS CIE-11 A hosix_diagnosticos
-- ============================================================================

ALTER TABLE hosix_diagnosticos
  ADD COLUMN IF NOT EXISTS cie11_cache_id     UUID REFERENCES hosix_cie11_cache(id),
  ADD COLUMN IF NOT EXISTS codigo_cie11       VARCHAR(20),
  ADD COLUMN IF NOT EXISTS titulo_cie11       TEXT,
  ADD COLUMN IF NOT EXISTS foundation_uri     TEXT,
  ADD COLUMN IF NOT EXISTS capitulo_cie11     VARCHAR(10),
  ADD COLUMN IF NOT EXISTS bloque_cie11       VARCHAR(20),
  ADD COLUMN IF NOT EXISTS postcoordinacion   JSONB;

CREATE INDEX IF NOT EXISTS idx_diagnosticos_cie11
  ON hosix_diagnosticos(codigo_cie11)
  WHERE codigo_cie11 IS NOT NULL;

-- ============================================================================
-- 3. AGREGAR COLUMNAS CIE-11 A hosix_urgencias_episodios
-- ============================================================================

ALTER TABLE hosix_urgencias_episodios
  ADD COLUMN IF NOT EXISTS cie11_inicial_codigo     VARCHAR(20),
  ADD COLUMN IF NOT EXISTS cie11_inicial_titulo     TEXT,
  ADD COLUMN IF NOT EXISTS cie11_inicial_cache_id   UUID REFERENCES hosix_cie11_cache(id),
  ADD COLUMN IF NOT EXISTS cie11_final_codigo       VARCHAR(20),
  ADD COLUMN IF NOT EXISTS cie11_final_titulo       TEXT,
  ADD COLUMN IF NOT EXISTS cie11_final_cache_id     UUID REFERENCES hosix_cie11_cache(id);

CREATE INDEX IF NOT EXISTS idx_urgencias_cie11
  ON hosix_urgencias_episodios(cie11_final_codigo)
  WHERE cie11_final_codigo IS NOT NULL;

-- ============================================================================
-- 4. AGREGAR COLUMNAS CIE-11 A hosix_hospitalizacion_episodios
-- ============================================================================

ALTER TABLE hosix_hospitalizacion_episodios
  ADD COLUMN IF NOT EXISTS cie11_ingreso_codigo   VARCHAR(20),
  ADD COLUMN IF NOT EXISTS cie11_ingreso_titulo   TEXT,
  ADD COLUMN IF NOT EXISTS cie11_ingreso_cache_id UUID REFERENCES hosix_cie11_cache(id),
  ADD COLUMN IF NOT EXISTS cie11_alta_codigo      VARCHAR(20),
  ADD COLUMN IF NOT EXISTS cie11_alta_titulo      TEXT,
  ADD COLUMN IF NOT EXISTS cie11_alta_cache_id    UUID REFERENCES hosix_cie11_cache(id);

-- ============================================================================
-- 5. AGREGAR COLUMNA CIE-11 A hosix_consultas_medicas
-- ============================================================================

ALTER TABLE hosix_consultas_medicas
  ADD COLUMN IF NOT EXISTS diagnosticos_cie11 JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_consultas_cie11
  ON hosix_consultas_medicas USING GIN (diagnosticos_cie11);

-- ============================================================================
-- 6. VISTA MATERIALIZADA PARA BI: hosix_bi_morbilidad_cie11
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS hosix_bi_morbilidad_cie11 AS
SELECT
  d.paciente_id,
  d.episodio_id,
  d.tipo_episodio,
  d.fecha_diagnostico AS fecha,
  'consulta'::TEXT AS origen,
  d.codigo_cie11,
  d.titulo_cie11,
  d.capitulo_cie11,
  c.capitulo_titulo_es,
  d.bloque_cie11,
  c.bloque_titulo_es,
  c.cie10_equivalente,
  d.tipo_diagnostico,
  d.certeza,
  p.sexo,
  EXTRACT(YEAR FROM AGE(d.fecha_diagnostico, p.fecha_nacimiento))::INT AS edad,
  CASE
    WHEN EXTRACT(YEAR FROM AGE(d.fecha_diagnostico, p.fecha_nacimiento)) < 1  THEN 'Menor 1 año'
    WHEN EXTRACT(YEAR FROM AGE(d.fecha_diagnostico, p.fecha_nacimiento)) < 5  THEN '1-4 años'
    WHEN EXTRACT(YEAR FROM AGE(d.fecha_diagnostico, p.fecha_nacimiento)) < 15 THEN '5-14 años'
    WHEN EXTRACT(YEAR FROM AGE(d.fecha_diagnostico, p.fecha_nacimiento)) < 45 THEN '15-44 años'
    WHEN EXTRACT(YEAR FROM AGE(d.fecha_diagnostico, p.fecha_nacimiento)) < 65 THEN '45-64 años'
    ELSE '65+ años'
  END AS grupo_etario,
  cs.id AS centro_salud_id,
  cs.nombre AS hospital,
  p.provincia AS provincia
FROM hosix_diagnosticos d
JOIN hosix_pacientes p ON p.id = d.paciente_id
JOIN centros_salud cs ON cs.id = p.centro_salud_id
LEFT JOIN hosix_cie11_cache c ON c.id = d.cie11_cache_id
WHERE d.codigo_cie11 IS NOT NULL

UNION ALL

SELECT
  u.paciente_id,
  u.id AS episodio_id,
  'urgencia'::TEXT AS tipo_episodio,
  COALESCE(u.fecha_salida, u.fecha_entrada) AS fecha,
  'urgencias'::TEXT AS origen,
  u.cie11_final_codigo AS codigo_cie11,
  u.cie11_final_titulo AS titulo_cie11,
  c.capitulo_codigo AS capitulo_cie11,
  c.capitulo_titulo_es,
  c.bloque_codigo AS bloque_cie11,
  c.bloque_titulo_es,
  c.cie10_equivalente,
  'principal'::TEXT AS tipo_diagnostico,
  'confirmado'::TEXT AS certeza,
  p.sexo,
  EXTRACT(YEAR FROM AGE(u.fecha_entrada, p.fecha_nacimiento))::INT AS edad,
  CASE
    WHEN EXTRACT(YEAR FROM AGE(u.fecha_entrada, p.fecha_nacimiento)) < 1  THEN 'Menor 1 año'
    WHEN EXTRACT(YEAR FROM AGE(u.fecha_entrada, p.fecha_nacimiento)) < 5  THEN '1-4 años'
    WHEN EXTRACT(YEAR FROM AGE(u.fecha_entrada, p.fecha_nacimiento)) < 15 THEN '5-14 años'
    WHEN EXTRACT(YEAR FROM AGE(u.fecha_entrada, p.fecha_nacimiento)) < 45 THEN '15-44 años'
    WHEN EXTRACT(YEAR FROM AGE(u.fecha_entrada, p.fecha_nacimiento)) < 65 THEN '45-64 años'
    ELSE '65+ años'
  END AS grupo_etario,
  cs.id, cs.nombre, p.provincia AS provincia
FROM hosix_urgencias_episodios u
JOIN hosix_pacientes p ON p.id = u.paciente_id
JOIN centros_salud cs ON cs.id = p.centro_salud_id
LEFT JOIN hosix_cie11_cache c ON c.id = u.cie11_final_cache_id
WHERE u.cie11_final_codigo IS NOT NULL

UNION ALL

SELECT
  h.paciente_id,
  h.id AS episodio_id,
  'hospitalizacion'::TEXT AS tipo_episodio,
  COALESCE(h.fecha_alta, h.fecha_ingreso) AS fecha,
  'hospitalizacion'::TEXT AS origen,
  h.cie11_alta_codigo AS codigo_cie11,
  h.cie11_alta_titulo AS titulo_cie11,
  c.capitulo_codigo AS capitulo_cie11,
  c.capitulo_titulo_es,
  c.bloque_codigo AS bloque_cie11,
  c.bloque_titulo_es,
  c.cie10_equivalente,
  'principal'::TEXT AS tipo_diagnostico,
  'confirmado'::TEXT AS certeza,
  p.sexo,
  EXTRACT(YEAR FROM AGE(h.fecha_ingreso, p.fecha_nacimiento))::INT AS edad,
  CASE
    WHEN EXTRACT(YEAR FROM AGE(h.fecha_ingreso, p.fecha_nacimiento)) < 1  THEN 'Menor 1 año'
    WHEN EXTRACT(YEAR FROM AGE(h.fecha_ingreso, p.fecha_nacimiento)) < 5  THEN '1-4 años'
    WHEN EXTRACT(YEAR FROM AGE(h.fecha_ingreso, p.fecha_nacimiento)) < 15 THEN '5-14 años'
    WHEN EXTRACT(YEAR FROM AGE(h.fecha_ingreso, p.fecha_nacimiento)) < 45 THEN '15-44 años'
    WHEN EXTRACT(YEAR FROM AGE(h.fecha_ingreso, p.fecha_nacimiento)) < 65 THEN '45-64 años'
    ELSE '65+ años'
  END AS grupo_etario,
  cs.id, cs.nombre, p.provincia AS provincia
FROM hosix_hospitalizacion_episodios h
JOIN hosix_pacientes p ON p.id = h.paciente_id
JOIN centros_salud cs ON cs.id = p.centro_salud_id
LEFT JOIN hosix_cie11_cache c ON c.id = h.cie11_alta_cache_id
WHERE h.cie11_alta_codigo IS NOT NULL
WITH DATA;

CREATE INDEX IF NOT EXISTS idx_bi_morbilidad_fecha
  ON hosix_bi_morbilidad_cie11(fecha);

CREATE INDEX IF NOT EXISTS idx_bi_morbilidad_capitulo
  ON hosix_bi_morbilidad_cie11(capitulo_cie11);

CREATE INDEX IF NOT EXISTS idx_bi_morbilidad_hospital
  ON hosix_bi_morbilidad_cie11(hospital);

CREATE INDEX IF NOT EXISTS idx_bi_morbilidad_codigo
  ON hosix_bi_morbilidad_cie11(codigo_cie11);

-- ============================================================================
-- 7. FUNCIÓN PARA REFRESCAR BI
-- ============================================================================

CREATE OR REPLACE FUNCTION refrescar_bi_morbilidad()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY hosix_bi_morbilidad_cie11;
END;
$$;
