-- ============================================================================
-- MIGRACIÓN: Crear usuario Super Admin en HOSIX
-- ============================================================================
-- Crea un usuario completo en auth y hosix_usuarios con perfil Administrador
-- ============================================================================

-- ============================================================================
-- PASO 1: Crear usuario en auth.users
-- ============================================================================
DO $$
DECLARE
  v_user_id uuid;
  v_admin_email text := 'admin@hosix.local';
  v_admin_password text := 'SuperAdmin#2026';
BEGIN
  -- Verificar si el usuario ya existe
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_admin_email;
  
  IF v_user_id IS NULL THEN
    -- Crear nuevo usuario
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
      v_admin_email,
      crypt(v_admin_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"role": "admin", "provider": "email"}'::jsonb,
      '{"full_name": "Administrador Sistema"}'::jsonb
    )
    RETURNING id INTO v_user_id;
    
    RAISE NOTICE 'Usuario creado en auth.users: %', v_user_id;
  ELSE
    RAISE NOTICE 'Usuario ya existe en auth.users: %', v_user_id;
  END IF;

  -- ============================================================================
  -- PASO 2: Crear usuario en hosix_usuarios
  -- ============================================================================
  
  IF NOT EXISTS (
    SELECT 1 FROM public.hosix_usuarios 
    WHERE email = v_admin_email
  ) THEN
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
      v_user_id,
      'admin',
      v_admin_email,
      'Administrador Sistema',
      'b7837400-a462-49cc-9dc8-f49980bb3392'::uuid,
      '6e5eab00-d72a-4d49-9d21-a164df58cae6'::uuid,
      true,
      false,
      false,
      now(),
      now()
    );
    
    RAISE NOTICE 'Usuario creado en hosix_usuarios';
  ELSE
    RAISE NOTICE 'Usuario ya existe en hosix_usuarios';
  END IF;

END $$;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar usuario en auth
SELECT 
  id as auth_id,
  email,
  created_at
FROM auth.users 
WHERE email = 'admin@hosix.local'
LIMIT 1;

-- Verificar usuario en hosix_usuarios con perfil
SELECT 
  u.id,
  u.username,
  u.email,
  u.nombre_completo,
  p.nombre as perfil,
  u.activo,
  u.created_at
FROM public.hosix_usuarios u
LEFT JOIN public.hosix_perfiles p ON u.perfil_id = p.id
WHERE u.email = 'admin@hosix.local'
LIMIT 1;

-- ============================================================================
-- CREDENCIALES
-- ============================================================================
-- Email: admin@hosix.local
-- Contraseña: SuperAdmin#2026
-- Perfil: Administrador (acceso total)
-- Centro de Salud: 6e5eab00-d72a-4d49-9d21-a164df58cae6
-- ============================================================================
