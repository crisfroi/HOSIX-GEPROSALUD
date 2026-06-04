-- Migration: 20260603_fase2_codificacion_cie11_procedimientos.sql
-- FASE 2: Codificación & Terminología
-- Contiene tablas para CIE-10/CIE-11 y Procedimientos Médicos

-- ===================================================
-- 1. TABLA: hosix_codigos_cie (CIE-10 y CIE-11)
-- ===================================================
CREATE TABLE IF NOT EXISTS public.hosix_codigos_cie (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT NOT NULL CHECK (version IN ('CIE-10', 'CIE-11')),
    codigo VARCHAR(20) NOT NULL,
    descripcion TEXT NOT NULL,
    descripcion_corta VARCHAR(255),
    grupo_principal VARCHAR(255), -- Ej: Enfermedades infecciosas, Traumatismos
    subcategoria VARCHAR(255),
    letra_inicial CHAR(1),
    es_primaria BOOLEAN DEFAULT true,
    mapeo_cie10 VARCHAR(20), -- Para CIE-11: referencia a su equivalente CIE-10
    mapeo_cie11 VARCHAR(20), -- Para CIE-10: referencia a su equivalente CIE-11
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices para búsqueda rápida
    CONSTRAINT uk_codigo_version UNIQUE(codigo, version),
    CONSTRAINT fk_letra_inicial_check CHECK (letra_inicial IS NULL OR letra_inicial ~ '^[A-Z]$')
);

-- Índices
CREATE INDEX idx_codigos_cie_version ON public.hosix_codigos_cie(version);
CREATE INDEX idx_codigos_cie_codigo ON public.hosix_codigos_cie(codigo);
CREATE INDEX idx_codigos_cie_descripcion ON public.hosix_codigos_cie USING GIN(to_tsvector('spanish', descripcion));
CREATE INDEX idx_codigos_cie_grupo ON public.hosix_codigos_cie(grupo_principal);
CREATE INDEX idx_codigos_cie_activo ON public.hosix_codigos_cie(activo);

-- RLS
ALTER TABLE public.hosix_codigos_cie ENABLE ROW LEVEL SECURITY;

CREATE POLICY "codigos_cie_read_authenticated" ON public.hosix_codigos_cie
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "codigos_cie_write_admin" ON public.hosix_codigos_cie
    FOR ALL
    USING (auth.role() = 'authenticated' AND EXISTS (
        SELECT 1 FROM public.hosix_usuarios u
        JOIN public.hosix_perfiles p ON p.id = u.perfil_id
        WHERE u.auth_user_id = auth.uid() AND p.codigo IN ('admin', 'medico')
    ));

-- ===================================================
-- 2. TABLA: hosix_procedimientos_medicos
-- ===================================================
CREATE TABLE IF NOT EXISTS public.hosix_procedimientos_medicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_procedimiento VARCHAR(20) NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    especialidad VARCHAR(100), -- Ej: Cirugía General, Ginecología, etc.
    area_quirurgica VARCHAR(100), -- Ej: Abdomen, Tórax, Extremidades, Cabeza
    requiere_autorizacion BOOLEAN DEFAULT false,
    tiempo_estimado_min INTEGER, -- Duración estimada en minutos
    requiere_preparacion TEXT, -- Descripción de la preparación requerida
    requiere_ayuno BOOLEAN DEFAULT false,
    requiere_acompañante BOOLEAN DEFAULT false,
    contraindicaciones TEXT, -- Condiciones en las que no se debe realizar
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_procedimientos_codigo ON public.hosix_procedimientos_medicos(codigo_procedimiento);
CREATE INDEX idx_procedimientos_descripcion ON public.hosix_procedimientos_medicos USING GIN(to_tsvector('spanish', descripcion));
CREATE INDEX idx_procedimientos_especialidad ON public.hosix_procedimientos_medicos(especialidad);
CREATE INDEX idx_procedimientos_area ON public.hosix_procedimientos_medicos(area_quirurgica);
CREATE INDEX idx_procedimientos_activo ON public.hosix_procedimientos_medicos(activo);

-- RLS
ALTER TABLE public.hosix_procedimientos_medicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "procedimientos_read_authenticated" ON public.hosix_procedimientos_medicos
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "procedimientos_write_admin" ON public.hosix_procedimientos_medicos
    FOR ALL
    USING (auth.role() = 'authenticated' AND EXISTS (
        SELECT 1 FROM public.hosix_usuarios u
        JOIN public.hosix_perfiles p ON p.id = u.perfil_id
        WHERE u.auth_user_id = auth.uid() AND p.codigo IN ('admin')
    ));

-- ===================================================
-- 3. TABLA: hosix_mapeos_cie (Mapeo CIE-10 ↔ CIE-11)
-- ===================================================
CREATE TABLE IF NOT EXISTS public.hosix_mapeos_cie (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_cie10 VARCHAR(20) NOT NULL,
    codigo_cie11 VARCHAR(20) NOT NULL,
    descripcion_mapeo TEXT,
    similitud_porcentaje INTEGER DEFAULT 100 CHECK (similitud_porcentaje >= 0 AND similitud_porcentaje <= 100),
    validado_por UUID REFERENCES public.hosix_usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices para búsqueda
    CONSTRAINT uk_mapeo_cie UNIQUE(codigo_cie10, codigo_cie11)
);

-- Índices
CREATE INDEX idx_mapeos_cie10 ON public.hosix_mapeos_cie(codigo_cie10);
CREATE INDEX idx_mapeos_cie11 ON public.hosix_mapeos_cie(codigo_cie11);

-- RLS
ALTER TABLE public.hosix_mapeos_cie ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mapeos_cie_read_authenticated" ON public.hosix_mapeos_cie
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "mapeos_cie_write_admin" ON public.hosix_mapeos_cie
    FOR ALL
    USING (auth.role() = 'authenticated' AND EXISTS (
        SELECT 1 FROM public.hosix_usuarios u
        JOIN public.hosix_perfiles p ON p.id = u.perfil_id
        WHERE u.auth_user_id = auth.uid() AND p.codigo IN ('admin')
    ));

-- ===================================================
-- TRIGGERS para actualizar updated_at
-- ===================================================
CREATE OR REPLACE FUNCTION update_updated_at_codigos_cie()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_codigos_cie
    BEFORE UPDATE ON public.hosix_codigos_cie
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_codigos_cie();

CREATE OR REPLACE FUNCTION update_updated_at_procedimientos()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_procedimientos
    BEFORE UPDATE ON public.hosix_procedimientos_medicos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_procedimientos();

-- ===================================================
-- SEED DATA: Primeros códigos CIE-11 (muestra)
-- ===================================================
-- Esta sección puede ser reemplazada por un script de importación de OMS
INSERT INTO public.hosix_codigos_cie 
(version, codigo, descripcion, descripcion_corta, grupo_principal, es_primaria, activo)
VALUES
('CIE-11', '1A00', 'Cólera', 'Cólera', 'Enfermedades infecciosas', true, true),
('CIE-11', '1A01', 'Cólera por Vibrio cholerae', 'Cólera', 'Enfermedades infecciosas', true, true),
('CIE-11', '1B81', 'Tuberculosis pulmonar', 'Tuberculosis pulmonar', 'Enfermedades infecciosas', true, true),
('CIE-11', '4A80', 'Hipertensión esencial', 'Hipertensión esencial', 'Enfermedades del aparato circulatorio', true, true),
('CIE-11', '5A10', 'Diabetes mellitus tipo 1', 'Diabetes tipo 1', 'Enfermedades endocrinas', true, true),
('CIE-11', '5A11', 'Diabetes mellitus tipo 2', 'Diabetes tipo 2', 'Enfermedades endocrinas', true, true),
('CIE-11', '6A60', 'Pneumonía', 'Pneumonía', 'Enfermedades del aparato respiratorio', true, true),
('CIE-11', '7A80', 'Gastritis y duodenitis', 'Gastritis', 'Enfermedades del aparato digestivo', true, true),
('CIE-11', '8A80', 'Pielonefritis aguda', 'Pielonefritis', 'Enfermedades del aparato genitourinario', true, true),
('CIE-11', '9A88', 'Embarazo, parto y puerperio', 'Embarazo', 'Condiciones relacionadas con el embarazo', true, true),
('CIE-10', 'A00', 'Cólera', 'Cólera', 'Enfermedades infecciosas y parasitarias', true, true),
('CIE-10', 'A01', 'Fiebre tifoidea y paratifoidea', 'Fiebre tifoidea', 'Enfermedades infecciosas y parasitarias', true, true),
('CIE-10', 'A15', 'Tuberculosis respiratoria', 'Tuberculosis pulmonar', 'Enfermedades infecciosas y parasitarias', true, true),
('CIE-10', 'I10', 'Hipertensión esencial', 'Hipertensión', 'Enfermedades del aparato circulatorio', true, true),
('CIE-10', 'E10', 'Diabetes mellitus insulinodependiente', 'Diabetes tipo 1', 'Enfermedades endocrinas', true, true),
('CIE-10', 'E11', 'Diabetes mellitus no insulinodependiente', 'Diabetes tipo 2', 'Enfermedades endocrinas', true, true),
('CIE-10', 'J13', 'Neumonía por Streptococcus pneumoniae', 'Pneumonía neumocócica', 'Enfermedades del aparato respiratorio', true, true),
('CIE-10', 'K29', 'Gastritis y duodenitis', 'Gastritis', 'Enfermedades del aparato digestivo', true, true),
('CIE-10', 'N10', 'Pielonefritis aguda', 'Pielonefritis aguda', 'Enfermedades del aparato genitourinario', true, true),
('CIE-10', 'O00', 'Embarazo ectópico', 'Embarazo ectópico', 'Complicaciones del embarazo, parto y puerperio', false, true)
ON CONFLICT (codigo, version) DO NOTHING;

-- ===================================================
-- SEED DATA: Primeros mapeos CIE-10 → CIE-11 (muestra)
-- ===================================================
INSERT INTO public.hosix_mapeos_cie 
(codigo_cie10, codigo_cie11, descripcion_mapeo, similitud_porcentaje)
VALUES
('A00', '1A00', 'Cólera - mapeo directo', 100),
('A01', '1A02', 'Fiebre tifoidea - mapeo directo', 100),
('A15', '1B81', 'Tuberculosis respiratoria', 95),
('I10', '4A80', 'Hipertensión esencial - mapeo directo', 100),
('E10', '5A10', 'Diabetes mellitus tipo 1 - mapeo directo', 100),
('E11', '5A11', 'Diabetes mellitus tipo 2 - mapeo directo', 100),
('J13', '6A61', 'Neumonía neumocócica', 95),
('K29', '7A80', 'Gastritis y duodenitis - mapeo directo', 100),
('N10', '8A80', 'Pielonefritis aguda - mapeo directo', 100)
ON CONFLICT (codigo_cie10, codigo_cie11) DO NOTHING;

-- ===================================================
-- SEED DATA: Procedimientos médicos (muestra)
-- ===================================================
INSERT INTO public.hosix_procedimientos_medicos 
(codigo_procedimiento, descripcion, especialidad, area_quirurgica, requiere_autorizacion, tiempo_estimado_min, requiere_ayuno, requiere_acompañante)
VALUES
('CPT-99213', 'Consulta médica general', 'Medicina General', NULL, false, 15, false, false),
('CPT-47000', 'Colecistectomía abierta', 'Cirugía General', 'Abdomen', true, 90, true, true),
('CPT-47562', 'Colecistectomía laparoscópica', 'Cirugía General', 'Abdomen', true, 45, true, true),
('CPT-76700', 'Abdominal ultrasound', 'Radiología', NULL, false, 30, false, false),
('CPT-71020', 'Radiografía de tórax', 'Radiología', NULL, false, 10, false, false),
('CPT-36415', 'Venipunción - toma de muestra', 'Laboratorio', NULL, false, 5, false, false),
('CPT-80053', 'Panel metabólico', 'Laboratorio', NULL, false, 60, true, false),
('CPT-70450', 'TAC cabeza sin contraste', 'Radiología', NULL, true, 30, false, true),
('CPT-99281', 'Consulta en urgencias - nivel bajo', 'Urgencias', NULL, false, 20, false, false),
('CPT-99285', 'Consulta en urgencias - nivel alto', 'Urgencias', NULL, false, 45, false, true)
ON CONFLICT (codigo_procedimiento) DO NOTHING;
