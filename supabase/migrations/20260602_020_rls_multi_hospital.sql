-- HOSIX - RLS Policies para Aislamiento Multi-Hospital
-- Fecha: 2026-06-02
-- Descri: Políticas de seguridad para aislamiento de datos por hospital/centro

-- ============================================================
-- 1. AGREGAR COLUMNA DE CENTRO_SALUD A TABLAS CLAVE
-- ============================================================

ALTER TABLE IF EXISTS hosix_pacientes
ADD COLUMN IF NOT EXISTS centro_salud_id UUID REFERENCES centros_salud(id);

ALTER TABLE IF EXISTS hosix_episodios
ADD COLUMN IF NOT EXISTS centro_salud_id UUID REFERENCES centros_salud(id);

ALTER TABLE IF EXISTS hosix_usuarios
ADD COLUMN IF NOT EXISTS centro_salud_id UUID REFERENCES centros_salud(id);

ALTER TABLE IF EXISTS hosix_camas
ADD COLUMN IF NOT EXISTS centro_salud_id UUID REFERENCES centros_salud(id);

-- ============================================================
-- 2. RLS PARA TABLAS DE PACIENTES Y EPISODIOS
-- ============================================================

-- Pacientes: usuarios solo ven sus propios pacientes del centro asignado
DROP POLICY IF EXISTS "pacientes_select_by_center" ON hosix_pacientes;
CREATE POLICY "pacientes_select_by_center"
  ON hosix_pacientes
  FOR SELECT
  USING (
    centro_salud_id IN (
      SELECT DISTINCT centro_salud_id FROM hosix_usuarios
      WHERE id = auth.uid()
    )
    OR auth.uid() IN (
      SELECT id FROM hosix_usuarios WHERE rol = 'SUPER_ADMINISTRADOR'
    )
  );

DROP POLICY IF EXISTS "pacientes_insert_by_center" ON hosix_pacientes;
CREATE POLICY "pacientes_insert_by_center"
  ON hosix_pacientes
  FOR INSERT
  WITH CHECK (
    centro_salud_id IN (
      SELECT DISTINCT centro_salud_id FROM hosix_usuarios
      WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pacientes_update_by_center" ON hosix_pacientes;
CREATE POLICY "pacientes_update_by_center"
  ON hosix_pacientes
  FOR UPDATE
  USING (
    centro_salud_id IN (
      SELECT DISTINCT centro_salud_id FROM hosix_usuarios
      WHERE id = auth.uid()
    )
  );

-- Episodios
DROP POLICY IF EXISTS "episodios_select_by_center" ON hosix_episodios;
CREATE POLICY "episodios_select_by_center"
  ON hosix_episodios
  FOR SELECT
  USING (
    centro_salud_id IN (
      SELECT DISTINCT centro_salud_id FROM hosix_usuarios
      WHERE id = auth.uid()
    )
    OR auth.uid() IN (
      SELECT id FROM hosix_usuarios WHERE rol = 'SUPER_ADMINISTRADOR'
    )
  );

-- Camas
DROP POLICY IF EXISTS "camas_select_by_center" ON hosix_camas;
CREATE POLICY "camas_select_by_center"
  ON hosix_camas
  FOR SELECT
  USING (
    centro_salud_id IN (
      SELECT DISTINCT centro_salud_id FROM hosix_usuarios
      WHERE id = auth.uid()
    )
  );

-- ============================================================
-- 3. RLS PARA DATOS SENSIBLES (CIFRADOS)
-- ============================================================

-- Historia clínica: solo personal médico del mismo centro
DROP POLICY IF EXISTS "historias_clinicas_select" ON hosix_historias_clinicas;
CREATE POLICY "historias_clinicas_select"
  ON hosix_historias_clinicas
  FOR SELECT
  USING (
    paciente_id IN (
      SELECT id FROM hosix_pacientes
      WHERE centro_salud_id IN (
        SELECT DISTINCT centro_salud_id FROM hosix_usuarios
        WHERE id = auth.uid()
      )
    )
    OR auth.uid() IN (
      SELECT id FROM hosix_usuarios WHERE rol = 'SUPER_ADMINISTRADOR'
    )
  );

-- Diagnósticos pacientes
DROP POLICY IF EXISTS "diagnosticos_pacientes_select" ON hosix_diagnosticos_pacientes;
CREATE POLICY "diagnosticos_pacientes_select"
  ON hosix_diagnosticos_pacientes
  FOR SELECT
  USING (
    paciente_id IN (
      SELECT id FROM hosix_pacientes
      WHERE centro_salud_id IN (
        SELECT DISTINCT centro_salud_id FROM hosix_usuarios
        WHERE id = auth.uid()
      )
    )
  );

-- Consultas médicas
DROP POLICY IF EXISTS "consultas_medicas_select" ON hosix_consultas_medicas;
CREATE POLICY "consultas_medicas_select"
  ON hosix_consultas_medicas
  FOR SELECT
  USING (
    paciente_id IN (
      SELECT id FROM hosix_pacientes
      WHERE centro_salud_id IN (
        SELECT DISTINCT centro_salud_id FROM hosix_usuarios
        WHERE id = auth.uid()
      )
    )
  );

-- ============================================================
-- 4. RLS PARA DATOS DE OPERACIONES
-- ============================================================

-- Quirófanos
DROP POLICY IF EXISTS "quirofanos_select_by_center" ON hosix_quirofanos_salas;
CREATE POLICY "quirofanos_select_by_center"
  ON hosix_quirofanos_salas
  FOR SELECT
  USING (true); -- Los quirófanos se usan entre centros en algunos casos

-- Citas
DROP POLICY IF EXISTS "citas_select_by_center" ON hosix_citas;
CREATE POLICY "citas_select_by_center"
  ON hosix_citas
  FOR SELECT
  USING (
    paciente_id IN (
      SELECT id FROM hosix_pacientes
      WHERE centro_salud_id IN (
        SELECT DISTINCT centro_salud_id FROM hosix_usuarios
        WHERE id = auth.uid()
      )
    )
  );

-- ============================================================
-- 5. RLS PARA DATOS FINANCIEROS
-- ============================================================

-- Facturas: solo acceso a facturas del mismo centro
DROP POLICY IF EXISTS "facturas_select_by_center" ON hosix_facturas;
CREATE POLICY "facturas_select_by_center"
  ON hosix_facturas
  FOR SELECT
  USING (
    paciente_id IN (
      SELECT id FROM hosix_pacientes
      WHERE centro_salud_id IN (
        SELECT DISTINCT centro_salud_id FROM hosix_usuarios
        WHERE id = auth.uid()
      )
    )
    OR auth.uid() IN (
      SELECT id FROM hosix_usuarios WHERE rol IN ('SUPER_ADMINISTRADOR', 'CONTADOR', 'CONTADOR_GENERAL')
    )
  );

-- ============================================================
-- 6. RLS PARA USUARIOS (INFORMACIÓN SENSIBLE)
-- ============================================================

-- Usuarios solo ven usuarios del mismo centro (excepto admin)
DROP POLICY IF EXISTS "usuarios_select_by_center" ON hosix_usuarios;
CREATE POLICY "usuarios_select_by_center"
  ON hosix_usuarios
  FOR SELECT
  USING (
    id = auth.uid()
    OR centro_salud_id = (SELECT centro_salud_id FROM hosix_usuarios WHERE id = auth.uid())
    OR auth.uid() IN (SELECT id FROM hosix_usuarios WHERE rol = 'SUPER_ADMINISTRADOR')
  );

-- ============================================================
-- 7. AUDITORÍA - TABLA DE ACCESOS
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_auditoria_accesos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES hosix_usuarios(id),
  tabla_accesada VARCHAR(100) NOT NULL,
  tipo_operacion VARCHAR(10) NOT NULL, -- SELECT, INSERT, UPDATE, DELETE
  centro_salud_id UUID REFERENCES centros_salud(id),
  registro_id UUID,
  ip_address INET,
  user_agent TEXT,
  resultado VARCHAR(20) DEFAULT 'success', -- success, denied, error
  motivo_denegacion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_auditoria_usuario ON hosix_auditoria_accesos(usuario_id);
CREATE INDEX idx_auditoria_tabla ON hosix_auditoria_accesos(tabla_accesada);
CREATE INDEX idx_auditoria_centro ON hosix_auditoria_accesos(centro_salud_id);
CREATE INDEX idx_auditoria_fecha ON hosix_auditoria_accesos(created_at DESC);

ALTER TABLE hosix_auditoria_accesos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auditoria_select_admin"
  ON hosix_auditoria_accesos
  FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM hosix_usuarios WHERE rol = 'SUPER_ADMINISTRADOR')
  );

-- ============================================================
-- 8. FUNCIÓN PARA LOGGING DE ACCESOS
-- ============================================================

CREATE OR REPLACE FUNCTION log_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO hosix_auditoria_accesos (
    usuario_id, tabla_accesada, tipo_operacion, centro_salud_id
  )
  VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.centro_salud_id, OLD.centro_salud_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
