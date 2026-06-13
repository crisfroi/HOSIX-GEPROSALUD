-- =====================================================================
-- Asegurar RLS y políticas públicas en todas las tablas de copia
-- para que la Edge Function sync-pull pueda acceder sin restricción
-- =====================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE nodo_central.distritos_sanitarios_copia ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "distritos_visible" ON nodo_central.distritos_sanitarios_copia;
DROP POLICY IF EXISTS "centros_copia_visible" ON nodo_central.centros_salud_copia;
DROP POLICY IF EXISTS "profesionales_copia_visible" ON nodo_central.profesionales_copia;

-- Crear políticas públicas (visible a todos, incluyendo anon)
CREATE POLICY "distritos_sanitarios_copia_public"
ON nodo_central.distritos_sanitarios_copia FOR SELECT
USING (true);

CREATE POLICY "centros_salud_copia_public"
ON nodo_central.centros_salud_copia FOR SELECT
USING (true);

CREATE POLICY "profesionales_copia_public"
ON nodo_central.profesionales_copia FOR SELECT
USING (true);

-- Asegurar GRANTs explícitos al anon role
GRANT USAGE ON SCHEMA nodo_central TO anon;
GRANT SELECT ON nodo_central.distritos_sanitarios_copia TO anon, authenticated;
GRANT SELECT ON nodo_central.centros_salud_copia TO anon, authenticated;
GRANT SELECT ON nodo_central.profesionales_copia TO anon, authenticated;

-- Comentario: Las tablas pais_pacientes_maestro tienen RLS más restrictiva
-- que sólo permite ver a hospital_admin y health_worker roles
SELECT '=== Políticas RLS de copia habilitadas para acceso público ===' as estado;
