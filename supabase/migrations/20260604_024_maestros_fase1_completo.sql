-- ============================================================================
-- HOSIX - Migración 024: Maestros Completos Fase 1 - Organización + RRHH
-- Fecha: 2025-06-04
-- Descripción: Normalización y creación de maestros faltantes para Fase 1
--              Incluye: Unidades Funcionales, Especialidades, Roles, Cualificaciones
-- ============================================================================

-- ============================================================================
-- 1. MAESTRO: UNIDADES FUNCIONALES
-- ============================================================================

CREATE TABLE IF NOT EXISTS hosix_unidades_funcionales (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo              VARCHAR(10) NOT NULL UNIQUE,
  nombre              VARCHAR(255) NOT NULL,
  descripcion         TEXT,
  
  -- Vinculación organizacional
  departamento_id     UUID NOT NULL REFERENCES hosix_departamentos(id) ON DELETE RESTRICT,
  servicio_id         UUID REFERENCES hosix_servicios(id) ON DELETE SET NULL,
  
  -- Características operativas
  jefe_unidad_id      UUID REFERENCES hosix_usuarios(id) ON DELETE SET NULL,
  tipo_unidad         VARCHAR(50) CHECK (tipo_unidad IN ('clinica', 'administrativa', 'apoyo', 'mixta')),
  cantidad_camas      INTEGER,
  cantidad_personal   INTEGER,
  
  -- Control
  activo              BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_unidades_departamento ON hosix_unidades_funcionales(departamento_id);
CREATE INDEX IF NOT EXISTS idx_unidades_servicio ON hosix_unidades_funcionales(servicio_id);
CREATE INDEX IF NOT EXISTS idx_unidades_jefe ON hosix_unidades_funcionales(jefe_unidad_id);

ALTER TABLE hosix_unidades_funcionales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "unidades_read" ON hosix_unidades_funcionales FOR SELECT USING (true);
CREATE POLICY "unidades_write" ON hosix_unidades_funcionales FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 2. MAESTRO: ESPECIALIDADES MÉDICAS (normalizado)
-- ============================================================================

CREATE TABLE IF NOT EXISTS hosix_especialidades_medicas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo              VARCHAR(10) NOT NULL UNIQUE,
  nombre              VARCHAR(255) NOT NULL UNIQUE,
  descripcion         TEXT,
  
  -- Clasificación
  tipo_especialidad   VARCHAR(50) CHECK (tipo_especialidad IN ('medica', 'quirurgica', 'auxiliar', 'administrativa')),
  area_clinica        VARCHAR(100),
  
  -- Asociaciones
  servicio_id         UUID REFERENCES hosix_servicios(id),
  
  -- Control
  requiere_certificacion BOOLEAN DEFAULT false,
  activo              BOOLEAN DEFAULT true,
  orden_presentacion  SMALLINT DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_especialidades_nombre ON hosix_especialidades_medicas(nombre);
CREATE INDEX IF NOT EXISTS idx_especialidades_servicio ON hosix_especialidades_medicas(servicio_id);
CREATE INDEX IF NOT EXISTS idx_especialidades_tipo ON hosix_especialidades_medicas(tipo_especialidad);

ALTER TABLE hosix_especialidades_medicas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "especialidades_read" ON hosix_especialidades_medicas FOR SELECT USING (true);
CREATE POLICY "especialidades_write" ON hosix_especialidades_medicas FOR INSERT WITH CHECK (true);

-- Seed data: Especialidades básicas de medicina
INSERT INTO hosix_especialidades_medicas (codigo, nombre, tipo_especialidad, area_clinica, requiere_certificacion, orden_presentacion) VALUES
  ('MED-001', 'Medicina General', 'medica', 'Clinica General', false, 1),
  ('MED-002', 'Pediatría', 'medica', 'Clinica Pediátrica', true, 2),
  ('MED-003', 'Ginecología y Obstetricia', 'medica', 'Clinica Obstetrica', true, 3),
  ('MED-004', 'Cardiología', 'medica', 'Clinica Especializada', true, 4),
  ('MED-005', 'Neumología', 'medica', 'Clinica Especializada', true, 5),
  ('MED-006', 'Gastroenterología', 'medica', 'Clinica Especializada', true, 6),
  ('MED-007', 'Neurología', 'medica', 'Clinica Especializada', true, 7),
  ('MED-008', 'Dermatología', 'medica', 'Clinica Especializada', true, 8),
  ('CIR-001', 'Cirugía General', 'quirurgica', 'Quirurgica', true, 9),
  ('CIR-002', 'Traumatología', 'quirurgica', 'Quirurgica', true, 10),
  ('CIR-003', 'Ortopedia', 'quirurgica', 'Quirurgica', true, 11),
  ('AUX-001', 'Enfermería', 'auxiliar', 'Apoyo', false, 12),
  ('AUX-002', 'Laboratorio Clínico', 'auxiliar', 'Apoyo', true, 13),
  ('AUX-003', 'Radiología', 'auxiliar', 'Apoyo', true, 14),
  ('ADM-001', 'Administración', 'administrativa', 'Administrativa', false, 15)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================================
-- 3. MAESTRO: ROLES ORGANIZACIONALES (dinámico, no enum)
-- ============================================================================

CREATE TABLE IF NOT EXISTS hosix_roles_organizacionales (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo              VARCHAR(20) NOT NULL UNIQUE,
  nombre              VARCHAR(255) NOT NULL UNIQUE,
  descripcion         TEXT,
  
  -- Niveles de responsabilidad
  nivel_jerarquico    SMALLINT CHECK (nivel_jerarquico BETWEEN 1 AND 5),
  es_ejecutivo        BOOLEAN DEFAULT false,
  es_medico           BOOLEAN DEFAULT false,
  es_administrativo   BOOLEAN DEFAULT false,
  
  -- Permisos asociados (relación con módulos)
  permisos_defecto    VARCHAR(50)[] DEFAULT ARRAY[]::VARCHAR[],
  
  -- Control
  activo              BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roles_org_codigo ON hosix_roles_organizacionales(codigo);
CREATE INDEX IF NOT EXISTS idx_roles_org_nombre ON hosix_roles_organizacionales(nombre);
CREATE INDEX IF NOT EXISTS idx_roles_org_nivel ON hosix_roles_organizacionales(nivel_jerarquico);

ALTER TABLE hosix_roles_organizacionales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles_org_read" ON hosix_roles_organizacionales FOR SELECT USING (true);
CREATE POLICY "roles_org_write" ON hosix_roles_organizacionales FOR INSERT WITH CHECK (true);

-- Seed data: Roles organizacionales
INSERT INTO hosix_roles_organizacionales (codigo, nombre, descripcion, nivel_jerarquico, es_ejecutivo, es_medico, es_administrativo) VALUES
  ('DIR', 'Director General', 'Máxima autoridad del hospital', 1, true, false, true),
  ('SUBDIRECTOR', 'Subdirector', 'Autoridad delegada del director', 2, true, false, true),
  ('JEFE_DEPTO', 'Jefe de Departamento', 'Responsable de departamento clínico', 3, false, true, true),
  ('JEFE_UNIDAD', 'Jefe de Unidad', 'Responsable de unidad funcional', 3, false, true, false),
  ('MEDICO_JEFE', 'Médico Jefe', 'Médico con responsabilidad supervisora', 3, false, true, false),
  ('MEDICO_SENIOR', 'Médico Senior', 'Médico experimentado', 4, false, true, false),
  ('MEDICO_JUNIOR', 'Médico Junior', 'Médico en formación/nuevo', 5, false, true, false),
  ('ESPECIALISTA', 'Especialista', 'Médico especialista', 4, false, true, false),
  ('ENFERMERA_JEFE', 'Enfermera Jefe', 'Responsable de enfermería por área', 3, false, false, false),
  ('ENFERMERA_SENIOR', 'Enfermera Senior', 'Enfermera experimentada', 4, false, false, false),
  ('ENFERMERA', 'Enfermera', 'Enfermera asistencial', 5, false, false, false),
  ('TECNICO_LABORATORIO', 'Técnico Laboratorio', 'Técnico de laboratorio clínico', 4, false, false, false),
  ('TECNICO_RADIOLOGIA', 'Técnico Radiología', 'Técnico en radiología', 4, false, false, false),
  ('FARMACEUTICO', 'Farmacéutico', 'Responsable de farmacia', 3, false, false, true),
  ('ADMINISTRADOR', 'Administrador', 'Gestor administrativo', 3, false, false, true),
  ('RECEPCIONISTA', 'Recepcionista', 'Personal de recepción', 5, false, false, true)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================================
-- 4. MAESTRO: CUALIFICACIONES PROFESIONALES
-- ============================================================================

CREATE TABLE IF NOT EXISTS hosix_cualificaciones_profesionales (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo              VARCHAR(20) NOT NULL UNIQUE,
  nombre              VARCHAR(255) NOT NULL,
  descripcion         TEXT,
  
  -- Clasificación
  tipo_cualificacion  VARCHAR(50) CHECK (tipo_cualificacion IN ('grado', 'diplomado', 'postgrado', 'especialidad', 'certificacion', 'curso')),
  duracion_meses      INTEGER,
  
  -- Requisitos
  es_obligatorio      BOOLEAN DEFAULT false,
  aplica_a            VARCHAR(100)[], -- ej: ['medicos', 'enfermeras']
  
  -- Control
  activo              BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cualificaciones_tipo ON hosix_cualificaciones_profesionales(tipo_cualificacion);
CREATE INDEX IF NOT EXISTS idx_cualificaciones_nombre ON hosix_cualificaciones_profesionales(nombre);

ALTER TABLE hosix_cualificaciones_profesionales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cualificaciones_read" ON hosix_cualificaciones_profesionales FOR SELECT USING (true);
CREATE POLICY "cualificaciones_write" ON hosix_cualificaciones_profesionales FOR INSERT WITH CHECK (true);

-- Seed data: Cualificaciones
INSERT INTO hosix_cualificaciones_profesionales (codigo, nombre, tipo_cualificacion, es_obligatorio, aplica_a) VALUES
  ('LIC-MED', 'Licenciatura en Medicina', 'grado', true, ARRAY['medicos']),
  ('DIP-ENF', 'Diplomatura en Enfermería', 'grado', true, ARRAY['enfermeras']),
  ('ESPEC-CARD', 'Especialidad en Cardiología', 'especialidad', false, ARRAY['medicos']),
  ('ESPEC-NEUMOLOGIA', 'Especialidad en Neumología', 'especialidad', false, ARRAY['medicos']),
  ('ESPEC-PEDIATRIA', 'Especialidad en Pediatría', 'especialidad', false, ARRAY['medicos']),
  ('ESPEC-CIRUGIA', 'Especialidad en Cirugía', 'especialidad', false, ARRAY['medicos']),
  ('CERT-BLS', 'Certificación BLS (Reanimación)', 'certificacion', false, ARRAY['medicos', 'enfermeras']),
  ('CERT-ACLS', 'Certificación ACLS', 'certificacion', false, ARRAY['medicos']),
  ('CERT-PALS', 'Certificación PALS (Pediatría)', 'certificacion', false, ARRAY['medicos', 'enfermeras']),
  ('CURSO-EHR', 'Curso Sistema de Información Médica', 'curso', false, ARRAY['medicos', 'enfermeras', 'administrativos'])
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================================
-- 5. TABLA RELACIÓN: hosix_usuarios - Cualificaciones
-- ============================================================================

CREATE TABLE IF NOT EXISTS hosix_usuarios_cualificaciones (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id          UUID NOT NULL REFERENCES hosix_usuarios(id) ON DELETE CASCADE,
  cualificacion_id    UUID NOT NULL REFERENCES hosix_cualificaciones_profesionales(id) ON DELETE CASCADE,

  -- Detalles de la cualificación
  fecha_obtencion     DATE NOT NULL,
  fecha_vencimiento   DATE,
  institucion         VARCHAR(255),
  numero_certificado  VARCHAR(100),

  -- Validación
  verificado          BOOLEAN DEFAULT false,
  fecha_verificacion  TIMESTAMPTZ,

  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),

  UNIQUE(usuario_id, cualificacion_id)
);

CREATE INDEX IF NOT EXISTS idx_usuario_cualificaciones ON hosix_usuarios_cualificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cualificaciones_usuario ON hosix_usuarios_cualificaciones(cualificacion_id);

ALTER TABLE hosix_usuarios_cualificaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuario_cualificaciones_read" ON hosix_usuarios_cualificaciones FOR SELECT USING (true);
CREATE POLICY "usuario_cualificaciones_write" ON hosix_usuarios_cualificaciones FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 6. ACTUALIZAR hosix_usuarios CON REFERENCIA A ROLES ORGANIZACIONALES
-- ============================================================================

ALTER TABLE IF EXISTS hosix_usuarios
  ADD COLUMN IF NOT EXISTS rol_organizacional_id UUID REFERENCES hosix_roles_organizacionales(id);

CREATE INDEX IF NOT EXISTS idx_usuarios_rol_org ON hosix_usuarios(rol_organizacional_id);

-- ============================================================================
-- 7. FUNCIÓN HELPER: Validar cualificación vigente
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_cualificacion_vigente(
  p_profesional_id UUID,
  p_tipo_cualificacion VARCHAR
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM hosix_profesionales_cualificaciones pc
    JOIN hosix_cualificaciones_profesionales qp ON qp.id = pc.cualificacion_id
    WHERE pc.profesional_id = p_profesional_id
      AND qp.tipo_cualificacion = p_tipo_cualificacion
      AND (pc.fecha_vencimiento IS NULL OR pc.fecha_vencimiento > NOW())
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 8. VISTA: Usuarios Médicos con especialidades normalizadas
-- ============================================================================

CREATE OR REPLACE VIEW vista_usuarios_medicos_especialidades AS
SELECT
  hu.id AS usuario_id,
  hu.nombre_completo,
  COALESCE(em.nombre, hu.especialidad) AS especialidad,
  em.id AS especialidad_id,
  em.tipo_especialidad,
  hu.area_profesional,
  fn_cualificacion_vigente(hu.id, 'especialidad') AS especialidad_certificada,
  hu.activo
FROM hosix_usuarios hu
LEFT JOIN hosix_especialidades_medicas em ON LOWER(em.nombre) = LOWER(hu.especialidad)
WHERE hu.es_profesional = true
  AND hu.nombre_completo IS NOT NULL;

COMMIT;
