-- =====================================================================
-- Hospital Configuration - Almacenar la configuración del hospital
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.hospital_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centro_salud_id UUID NOT NULL,
  nombre_hospital VARCHAR NOT NULL,
  codigo_hospital VARCHAR UNIQUE,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insertar la configuración para Hospital General de Sampaka
INSERT INTO public.hospital_config (
  centro_salud_id,
  nombre_hospital,
  codigo_hospital,
  descripcion
) VALUES (
  'f87aa0c0-89d8-46dd-ae6c-f008fe5d0ac1',
  'Hospital General de Sampaka',
  'HGS',
  'Hospital General de Sampaka - Nodo HOSIX'
) ON CONFLICT (codigo_hospital) DO UPDATE SET
  centro_salud_id = 'f87aa0c0-89d8-46dd-ae6c-f008fe5d0ac1',
  nombre_hospital = 'Hospital General de Sampaka',
  updated_at = now();

-- RLS
ALTER TABLE public.hospital_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hospital_config_public_read"
ON public.hospital_config FOR SELECT
USING (true);

CREATE POLICY "hospital_config_auth_write"
ON public.hospital_config FOR INSERT, UPDATE, DELETE
USING (auth.role() = 'authenticated');

-- GRANTS
GRANT SELECT ON public.hospital_config TO anon, authenticated;

SELECT '=== Hospital Configuration Table Created ===' as estado;
