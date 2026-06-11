-- ============================================================================
-- CREAR SUPER ADMINISTRADOR COMPLETO EN HOSIX
-- ============================================================================
-- Este script crea un usuario admin con:
-- 1. Cuenta en Supabase Auth
-- 2. Usuario en hosix_usuarios con perfil Administrador
-- 3. Permisos de acceso a todos los módulos
-- ============================================================================

-- ============================================================================
-- PASO 1: Crear usuario en auth.users
-- ============================================================================
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
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@hosix.local',
  crypt('SuperAdmin#2026', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"role": "admin", "provider": "email"}'::jsonb,
  '{"full_name": "Administrador Sistema"}'::jsonb
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- PASO 2: Obtener los IDs que necesitamos
-- ============================================================================

-- ID del usuario que acabamos de crear en auth
-- (Guardaremos esto para PASO 3)

-- ID del perfil Administrador (ya existe en hosix_perfiles)
-- Perfil: 'b7837400-a462-49cc-9dc8-f49980bb3392' (Administrador)

-- ID del Centro de Salud Principal
-- Centro: '6e5eab00-d72a-4d49-9d21-a164df58cae6'

-- ============================================================================
-- PASO 3: Crear usuario en hosix_usuarios
-- ============================================================================

-- OPCIÓN A: Si quieres usar el mismo ID que en Supabase Auth
-- (Necesitarás obtener el ID del usuario creado arriba)
-- Primero ejecuta esto para obtener el ID:
-- SELECT id FROM auth.users WHERE email = 'admin@hosix.local';

-- Luego usa ese ID aquí:
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
SELECT 
  u.id as auth_user_id,
  'admin' as username,
  'admin@hosix.local' as email,
  'Administrador Sistema' as nombre_completo,
  'b7837400-a462-49cc-9dc8-f49980bb3392'::uuid as perfil_id,
  '6e5eab00-d72a-4d49-9d21-a164df58cae6'::uuid as centro_salud_id,
  true as activo,
  false as es_profesional,
  false as cambio_password_requerido,
  now() as created_at,
  now() as updated_at
FROM auth.users u
WHERE u.email = 'admin@hosix.local'
AND NOT EXISTS (
  SELECT 1 FROM public.hosix_usuarios 
  WHERE username = 'admin' OR email = 'admin@hosix.local'
);

-- ============================================================================
-- PASO 4: Verificar que el usuario fue creado correctamente
-- ============================================================================

SELECT 
  u.username,
  u.email,
  u.nombre_completo,
  p.nombre as perfil,
  u.activo,
  u.created_at
FROM public.hosix_usuarios u
LEFT JOIN public.hosix_perfiles p ON u.perfil_id = p.id
WHERE u.email = 'admin@hosix.local';

-- ============================================================================
-- PASO 5: Conceder permisos a las tablas de plantillas
-- ============================================================================
-- (Ejecuta esto SOLO si aún no lo has hecho)

-- GRANT SELECT ON configuracion.plantillas_documentos TO anon, authenticated;
-- GRANT INSERT, UPDATE, DELETE ON configuracion.plantillas_documentos TO authenticated;
-- GRANT SELECT ON configuracion.plantillas_campos TO anon, authenticated;
-- GRANT INSERT, UPDATE, DELETE ON configuracion.plantillas_campos TO authenticated;
-- GRANT SELECT ON configuracion.documentos_generados TO anon, authenticated;
-- GRANT INSERT, UPDATE, DELETE ON configuracion.documentos_generados TO authenticated;
-- GRANT SELECT ON configuracion.documentos_firmas TO anon, authenticated;
-- GRANT INSERT, UPDATE, DELETE ON configuracion.documentos_firmas TO authenticated;
-- GRANT SELECT ON configuracion.documentos_auditoria TO anon, authenticated;
-- GRANT SELECT ON configuracion.plantillas_versiones TO anon, authenticated;
-- GRANT INSERT, UPDATE ON configuracion.plantillas_versiones TO authenticated;

-- ============================================================================
-- PASO 6: Verificar usuarios en auth
-- ============================================================================

SELECT id, email, created_at FROM auth.users WHERE email = 'admin@hosix.local';

-- ============================================================================
-- CREDENCIALES PARA LOGUEARTE
-- ============================================================================
-- Usuario: admin
-- Email: admin@hosix.local
-- Contraseña: SuperAdmin#2026
-- 
-- Rol esperado en frontend: SUPER_ADMINISTRADOR
-- Centro de salud: 6e5eab00-d72a-4d49-9d21-a164df58cae6
-- ============================================================================
