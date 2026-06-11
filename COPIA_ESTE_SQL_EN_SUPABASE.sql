-- ============================================================================
-- CREAR SUPER ADMIN - EJECUTA ESTO EN SUPABASE SQL EDITOR
-- ============================================================================

-- PASO 1: Crear usuario en auth.users (sin usar Supabase SDK)
-- Verifica primero si el usuario existe
SELECT id, email FROM auth.users WHERE email = 'admin@hosix.local';

-- Si no existe, copia y ejecuta ESTO:
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'f4f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2'::uuid,
  'authenticated',
  'authenticated',
  'admin@hosix.local',
  crypt('SuperAdmin#2026', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"role": "admin", "provider": "email"}'::jsonb,
  '{"full_name": "Administrador Sistema"}'::jsonb
);

-- PASO 2: Crear usuario en hosix_usuarios
INSERT INTO public.hosix_usuarios (
  auth_user_id,
  username,
  email,
  nombre_completo,
  perfil_id,
  centro_salud_id,
  activo,
  es_profesional,
  cambio_password_requerido,
  created_at,
  updated_at
)
VALUES (
  'f4f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2'::uuid,
  'admin',
  'admin@hosix.local',
  'Administrador Sistema',
  'b7837400-a462-49cc-9dc8-f49980bb3392'::uuid,
  '6e5eab00-d72a-4d49-9d21-a164df58cae6'::uuid,
  true,
  false,
  false,
  now(),
  now()
);

-- PASO 3: Conceder permisos a tablas de plantillas
GRANT SELECT ON configuracion.plantillas_documentos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON configuracion.plantillas_documentos TO authenticated;

GRANT SELECT ON configuracion.plantillas_campos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON configuracion.plantillas_campos TO authenticated;

GRANT SELECT ON configuracion.documentos_generados TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON configuracion.documentos_generados TO authenticated;

GRANT SELECT ON configuracion.documentos_firmas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON configuracion.documentos_firmas TO authenticated;

GRANT SELECT ON configuracion.documentos_auditoria TO anon, authenticated;

GRANT SELECT ON configuracion.plantillas_versiones TO anon, authenticated;
GRANT INSERT, UPDATE ON configuracion.plantillas_versiones TO authenticated;

-- PASO 4: Verificar que todo fue creado
SELECT 
  u.username,
  u.email,
  u.nombre_completo,
  p.nombre as perfil,
  u.activo
FROM public.hosix_usuarios u
LEFT JOIN public.hosix_perfiles p ON u.perfil_id = p.id
WHERE u.email = 'admin@hosix.local';

-- ============================================================================
-- CREDENCIALES PARA LOGUEARTE
-- ============================================================================
-- Email: admin@hosix.local
-- Contraseña: SuperAdmin#2026
-- Perfil: Administrador (acceso total)
-- ============================================================================
