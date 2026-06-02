-- HOSIX - Habilitar Realtime en Tablas Críticas
-- Tablas: camas, alertas, episodios, seguimiento_contactos

-- Habilitar publicación de cambios para Realtime
BEGIN;

-- Crear publicación si no existe
CREATE PUBLICATION IF NOT EXISTS "hosix_realtime" FOR ALL TABLES;

-- Agregar tablas específicas a la publicación
ALTER PUBLICATION hosix_realtime ADD TABLE IF EXISTS hosix_camas;
ALTER PUBLICATION hosix_realtime ADD TABLE IF EXISTS hosix_alertas;
ALTER PUBLICATION hosix_realtime ADD TABLE IF EXISTS hosix_episodios;
ALTER PUBLICATION hosix_realtime ADD TABLE IF EXISTS hosix_seguimiento_contactos;
ALTER PUBLICATION hosix_realtime ADD TABLE IF EXISTS hosix_signos_vitales;
ALTER PUBLICATION hosix_realtime ADD TABLE IF EXISTS hosix_ordenes_medicas;
ALTER PUBLICATION hosix_realtime ADD TABLE IF EXISTS hosix_interconsultas;

COMMIT;

-- Verificar publicaciones
SELECT * FROM pg_publication;