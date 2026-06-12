-- =====================================================================
-- PORTAL WEB DE PACIENTES - SCHEMA
-- Tablas para gestión de acceso de pacientes al portal
-- =====================================================================

-- =====================================================================
-- 1. PERFIL DE PACIENTE EN PORTAL
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.portal_pacientes (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hcu VARCHAR(50) UNIQUE NOT NULL,
  cedula VARCHAR(20) UNIQUE NOT NULL,
  nombre_completo VARCHAR(255) NOT NULL,
  fecha_nacimiento DATE,
  genero VARCHAR(10),
  telefono VARCHAR(20),
  email VARCHAR(255),
  direccion TEXT,
  centro_salud_id UUID,
  
  -- Datos médicos
  alergias JSONB DEFAULT '[]'::jsonb,
  condiciones_cronicas JSONB DEFAULT '[]'::jsonb,
  tipo_sangre VARCHAR(5),
  contacto_emergencia JSONB DEFAULT '{}'::jsonb,
  
  -- Perfil
  foto_perfil TEXT,
  notificaciones_habilitadas BOOLEAN DEFAULT true,
  privacidad_historial VARCHAR(50) DEFAULT 'privado',
  
  -- Metadata
  estado VARCHAR(50) DEFAULT 'activo',
  primer_acceso_en TIMESTAMPTZ,
  ultimo_acceso_en TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_portal_pacientes_hcu ON public.portal_pacientes(hcu);
CREATE INDEX idx_portal_pacientes_cedula ON public.portal_pacientes(cedula);
CREATE INDEX idx_portal_pacientes_email ON public.portal_pacientes(email);
CREATE INDEX idx_portal_pacientes_centro ON public.portal_pacientes(centro_salud_id);

-- =====================================================================
-- 2. LOG DE ACCESO AL PORTAL
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.portal_acceso_log (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES public.portal_pacientes(id) ON DELETE CASCADE,
  
  -- Tipo de acceso
  tipo_acceso VARCHAR(50) NOT NULL,
  modulo VARCHAR(50),
  accion VARCHAR(100),
  
  -- Info de conexión
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'exitoso',
  error_mensaje TEXT,
  
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_portal_acceso_usuario ON public.portal_acceso_log(usuario_id);
CREATE INDEX idx_portal_acceso_timestamp ON public.portal_acceso_log(timestamp);
CREATE INDEX idx_portal_acceso_tipo ON public.portal_acceso_log(tipo_acceso);

-- =====================================================================
-- 3. FORMULARIO DE CONTACTO
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.portal_contacto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES public.portal_pacientes(id) ON DELETE CASCADE,
  
  asunto VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  
  -- Contacto
  email_respuesta VARCHAR(255),
  telefono_respuesta VARCHAR(20),
  
  -- Admin
  estado VARCHAR(50) DEFAULT 'nuevo',
  respondido_en TIMESTAMPTZ,
  respuesta_texto TEXT,
  respondido_por UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_portal_contacto_usuario ON public.portal_contacto(usuario_id);
CREATE INDEX idx_portal_contacto_estado ON public.portal_contacto(estado);
CREATE INDEX idx_portal_contacto_fecha ON public.portal_contacto(created_at);

-- =====================================================================
-- 4. SESIONES DE PACIENTE
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.portal_sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES public.portal_pacientes(id) ON DELETE CASCADE,
  
  token_sesion VARCHAR(500),
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  activa BOOLEAN DEFAULT true,
  iniciada_en TIMESTAMPTZ DEFAULT now(),
  ultima_actividad TIMESTAMPTZ DEFAULT now(),
  cerrada_en TIMESTAMPTZ
);

CREATE INDEX idx_portal_sesiones_usuario ON public.portal_sesiones(usuario_id);
CREATE INDEX idx_portal_sesiones_activa ON public.portal_sesiones(activa);

-- =====================================================================
-- 5. NOTIFICACIONES DEL PORTAL
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.portal_notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.portal_pacientes(id) ON DELETE CASCADE,
  
  tipo VARCHAR(50),
  titulo VARCHAR(255),
  mensaje TEXT,
  datos_json JSONB DEFAULT '{}'::jsonb,
  
  leida BOOLEAN DEFAULT false,
  leida_en TIMESTAMPTZ,
  
  enlace_accion VARCHAR(255),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_portal_notif_paciente ON public.portal_notificaciones(paciente_id);
CREATE INDEX idx_portal_notif_leida ON public.portal_notificaciones(leida);
CREATE INDEX idx_portal_notif_fecha ON public.portal_notificaciones(created_at);

-- =====================================================================
-- 6. ROW LEVEL SECURITY
-- =====================================================================

-- Pacientes ven solo su perfil
ALTER TABLE public.portal_pacientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pacientes ven solo su perfil"
  ON public.portal_pacientes
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Pacientes actualizan solo su perfil"
  ON public.portal_pacientes
  FOR UPDATE
  USING (auth.uid() = id);

-- Log de acceso
ALTER TABLE public.portal_acceso_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven solo sus accesos"
  ON public.portal_acceso_log
  FOR SELECT
  USING (usuario_id = auth.uid());

-- Contacto
ALTER TABLE public.portal_contacto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pacientes ven solo su contacto"
  ON public.portal_contacto
  FOR SELECT
  USING (usuario_id = auth.uid());

CREATE POLICY "Pacientes envian contacto"
  ON public.portal_contacto
  FOR INSERT
  WITH CHECK (usuario_id = auth.uid());

-- Sesiones
ALTER TABLE public.portal_sesiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven solo sus sesiones"
  ON public.portal_sesiones
  FOR SELECT
  USING (usuario_id = auth.uid());

-- Notificaciones
ALTER TABLE public.portal_notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pacientes ven solo sus notificaciones"
  ON public.portal_notificaciones
  FOR SELECT
  USING (paciente_id IN (
    SELECT id FROM public.portal_pacientes WHERE id = auth.uid()
  ));

CREATE POLICY "Pacientes marcan sus notificaciones como leidas"
  ON public.portal_notificaciones
  FOR UPDATE
  USING (paciente_id IN (
    SELECT id FROM public.portal_pacientes WHERE id = auth.uid()
  ));

-- =====================================================================
-- 7. FUNCIONES ÚTILES
-- =====================================================================

-- Función para registrar acceso
CREATE OR REPLACE FUNCTION public.fn_registrar_acceso_portal(
  p_usuario_id UUID,
  p_tipo_acceso VARCHAR,
  p_modulo VARCHAR DEFAULT NULL,
  p_ip_address VARCHAR DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.portal_acceso_log (
    usuario_id, tipo_acceso, modulo, ip_address, status
  ) VALUES (
    p_usuario_id, p_tipo_acceso, p_modulo, p_ip_address, 'exitoso'
  );

  -- Actualizar ultimo acceso
  UPDATE public.portal_pacientes
  SET ultimo_acceso_en = now()
  WHERE id = p_usuario_id;
END;
$$ LANGUAGE plpgsql;

-- Función para crear notificación
CREATE OR REPLACE FUNCTION public.fn_crear_notificacion_portal(
  p_paciente_id UUID,
  p_tipo VARCHAR,
  p_titulo VARCHAR,
  p_mensaje TEXT,
  p_enlace VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notif_id UUID;
BEGIN
  INSERT INTO public.portal_notificaciones (
    paciente_id, tipo, titulo, mensaje, enlace_accion
  ) VALUES (
    p_paciente_id, p_tipo, p_titulo, p_mensaje, p_enlace
  )
  RETURNING id INTO v_notif_id;

  RETURN v_notif_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- VERIFICACIÓN
-- =====================================================================
SELECT '=== PORTAL PACIENTES SCHEMA CREATED ===' as status;
SELECT COUNT(*) as portal_tables FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name LIKE 'portal_%';
