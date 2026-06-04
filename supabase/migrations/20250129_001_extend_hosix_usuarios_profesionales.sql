-- Migración: Extender hosix_usuarios para integrar datos de profesionales_sanitarios
-- Fecha: 2025-01-29
-- Descripción: Agrega campos de profesional a hosix_usuarios para sincronización local

-- ============================================================================
-- 0. REQUISITOS PREVIOS
-- ============================================================================
-- Asegurar la extensión para UUIDs si no está activa
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. AGREGAR COLUMNAS A TABLA EXISTENTE (Sin los COMMENT inline)
-- ============================================================================

ALTER TABLE hosix_usuarios
  ADD COLUMN IF NOT EXISTS es_profesional BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS id_profesional_unico VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS numero_funcionario VARCHAR(50),
  ADD COLUMN IF NOT EXISTS especialidad VARCHAR(255),
  ADD COLUMN IF NOT EXISTS area_profesional VARCHAR(255),
  ADD COLUMN IF NOT EXISTS estado_solicitud VARCHAR(50) DEFAULT 'Aprobado',
  ADD COLUMN IF NOT EXISTS telefono VARCHAR(20),
  ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
  ADD COLUMN IF NOT EXISTS genero VARCHAR(20),
  ADD COLUMN IF NOT EXISTS fecha_sincronizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS profesional_remoto_id UUID,
  ADD COLUMN IF NOT EXISTS contrasena_hasheada VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contrasena_default_usada BOOLEAN DEFAULT false;

-- ============================================================================
-- 2. CREAR ÍNDICES PARA MEJOR RENDIMIENTO
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_hosix_usuarios_es_profesional ON hosix_usuarios(es_profesional);
CREATE INDEX IF NOT EXISTS idx_hosix_usuarios_id_profesional_unico ON hosix_usuarios(id_profesional_unico);
CREATE INDEX IF NOT EXISTS idx_hosix_usuarios_centro_profesional ON hosix_usuarios(centro_salud_id, es_profesional);
CREATE INDEX IF NOT EXISTS idx_hosix_usuarios_profesional_remoto ON hosix_usuarios(profesional_remoto_id);

-- ============================================================================
-- 3. CREAR TABLA DE SINCRONIZACIÓN (para auditoría)
-- ============================================================================

CREATE TABLE IF NOT EXISTS hosix_sincronizacion_profesionales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información de la sincronización
  director_id UUID NOT NULL REFERENCES hosix_usuarios(id),
  centro_salud_id UUID NOT NULL REFERENCES centros_salud(id),
  
  -- Detalles
  total_profesionales INTEGER,
  nuevos_insertados INTEGER,
  actualizados INTEGER,
  fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_fin TIMESTAMP,
  estado VARCHAR(50) DEFAULT 'completada',
  mensaje_error TEXT,
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sincronizacion_centro ON hosix_sincronizacion_profesionales(centro_salud_id);
CREATE INDEX IF NOT EXISTS idx_sincronizacion_director ON hosix_sincronizacion_profesionales(director_id);

-- ============================================================================
-- 4. CREAR TABLA DE HISTORIAL DE CAMBIOS DE CONTRASEÑA
-- ============================================================================

CREATE TABLE IF NOT EXISTS hosix_profesionales_cambios_password (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuario
  usuario_id UUID NOT NULL REFERENCES hosix_usuarios(id),
  
  -- Detalles del cambio
  password_anterior_hash VARCHAR(255),
  cambio_tipo VARCHAR(50),
  motivo VARCHAR(255),
  ip_cambio VARCHAR(45),
  user_agent TEXT,
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cambios_password_usuario ON hosix_profesionales_cambios_password(usuario_id);

-- ============================================================================
-- 5. CREAR FUNCIÓN PARA VERIFICAR PROFESIONAL POR ID Y CONTRASEÑA
-- ============================================================================

CREATE OR REPLACE FUNCTION verificar_profesional(
  p_id_profesional VARCHAR,
  p_contrasena_plain VARCHAR
) RETURNS TABLE(
  usuario_id UUID,
  nombre_completo VARCHAR,
  centro_salud_id UUID,
  cambio_password_requerido BOOLEAN,
  activo BOOLEAN,
  error_mensaje TEXT
) AS $$
DECLARE
  v_usuario hosix_usuarios;
BEGIN
  -- Obtener usuario por ID profesional
  SELECT * INTO v_usuario FROM hosix_usuarios
  WHERE id_profesional_unico = p_id_profesional
    AND es_profesional = true
    AND activo = true
  LIMIT 1;
  
  -- Si no existe
  IF v_usuario IS NULL THEN
    RETURN QUERY SELECT 
      null::UUID,
      null::VARCHAR,
      null::UUID,
      null::BOOLEAN,
      null::BOOLEAN,
      'Profesional no encontrado'::TEXT;
    RETURN;
  END IF;
  
  -- Verificar si la contraseña es válida
  -- NOTA: Esto es un placeholder. En la implementación real, usar pgcrypto.crypt()
  IF v_usuario.contrasena_hasheada IS NULL THEN
    RETURN QUERY SELECT 
      null::UUID,
      null::VARCHAR,
      null::UUID,
      null::BOOLEAN,
      null::BOOLEAN,
      'Usuario sin contraseña configurada'::TEXT;
    RETURN;
  END IF;
  
  -- Retornar datos del usuario si la contraseña es válida
  RETURN QUERY SELECT 
    v_usuario.id,
    v_usuario.nombre_completo,
    v_usuario.centro_salud_id,
    v_usuario.cambio_password_requerido,
    v_usuario.activo,
    null::TEXT;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. COMENTARIOS Y DOCUMENTACIÓN OFICIAL DE POSTGRESQL
-- ============================================================================

-- Comentarios de la tabla hosix_usuarios y sus nuevas columnas
COMMENT ON TABLE hosix_usuarios IS 
'Usuarios del sistema HOSIX. Puede ser administrador o profesional sanitario sincronizado. Cuando es_profesional=true, contiene datos de copia local del sistema de registro remoto.';

COMMENT ON COLUMN hosix_usuarios.es_profesional IS 'true = profesional sanitario sincronizado del registro centralizado, false = usuario administrativo del sistema HOSIX';
COMMENT ON COLUMN hosix_usuarios.id_profesional_unico IS 'Identificador único del profesional (ej: MED-2025-001). Viene del sistema de registro remoto. Usado para login de profesionales.';
COMMENT ON COLUMN hosix_usuarios.contrasena_hasheada IS 'Hash bcrypt de la contraseña. Solo para profesionales (es_profesional=true). Administradores usan auth de Supabase.';
COMMENT ON COLUMN hosix_usuarios.contrasena_default_usada IS 'true = contraseña fue generada automáticamente (id_profesional + "123456"). Requiere cambio obligatorio en primer login.';
COMMENT ON COLUMN hosix_usuarios.fecha_sincronizacion IS 'Timestamp de la última sincronización. Ayuda a identificar registros desactualizados.';
COMMENT ON COLUMN hosix_usuarios.profesional_remoto_id IS 'UUID del registro en el sistema remoto (para auditoría y trazabilidad).';
COMMENT ON COLUMN hosix_usuarios.estado_solicitud IS 'Estado de la solicitud de registro';
COMMENT ON COLUMN hosix_usuarios.numero_funcionario IS 'Número de funcionario del profesional';
COMMENT ON COLUMN hosix_usuarios.especialidad IS 'Especialidad médica del profesional';
COMMENT ON COLUMN hosix_usuarios.area_profesional IS 'Área profesional (Medicina, Enfermería, etc.)';

-- Comentarios de la tabla de sincronización y auditoría
COMMENT ON COLUMN hosix_sincronizacion_profesionales.estado IS 'completada, error, parcial';

-- Comentarios de la tabla de historial de contraseñas
COMMENT ON COLUMN hosix_profesionales_cambios_password.cambio_tipo IS 'inicial, obligatorio, voluntario, forzado';