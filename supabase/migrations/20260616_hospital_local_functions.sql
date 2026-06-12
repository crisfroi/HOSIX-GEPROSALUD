-- =====================================================================
-- FUNCIONES FALTANTES PARA hospital_local
-- =====================================================================

-- =====================================================================
-- Función: Obtener Estado de Sincronización
-- =====================================================================
CREATE OR REPLACE FUNCTION hospital_local.fn_obtener_estado_sync()
RETURNS TABLE (
  centros_locales BIGINT,
  profesionales_locales BIGINT,
  pacientes_con_hcu BIGINT,
  pacientes_pendientes BIGINT,
  cambios_en_cola BIGINT,
  ultima_sincronizacion TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM hospital_local.centros_salud_sincronizado)::BIGINT,
    (SELECT COUNT(*) FROM hospital_local.profesionales_sincronizado)::BIGINT,
    (SELECT COUNT(*) FROM hospital_local.pacientes_maestro_local WHERE hcu IS NOT NULL)::BIGINT,
    (SELECT COUNT(*) FROM hospital_local.pacientes_pendientes_sync WHERE estado = 'pendiente')::BIGINT,
    (SELECT COUNT(*) FROM hospital_local.sync_queue WHERE estado = 'pendiente')::BIGINT,
    (SELECT MAX(fecha_ultimo_intento) FROM hospital_local.sync_log_local WHERE tipo_evento = 'sincronizacion_completada')::TIMESTAMPTZ;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- Función: Generar HCU Temporal (si no existe)
-- =====================================================================
CREATE OR REPLACE FUNCTION hospital_local.fn_generar_hcu_temporal(
  p_nombre_distrito TEXT
)
RETURNS VARCHAR(50) AS $$
DECLARE
  v_codigo_distrito VARCHAR(2);
  v_secuencial SMALLINT;
  v_hcu VARCHAR(50);
BEGIN
  -- Mapear distrito a código (primeras 2 letras en mayúscula)
  v_codigo_distrito := UPPER(SUBSTRING(p_nombre_distrito, 1, 2));
  
  -- Obtener próximo secuencial de la tabla de secuenciales
  SELECT COALESCE(MAX(CAST(SUBSTRING(hcu_temporal, 9, 3) AS INTEGER)), 0) + 1
  INTO v_secuencial
  FROM hospital_local.pacientes_pendientes_sync
  WHERE hcu_temporal LIKE CONCAT('TEMP-', v_codigo_distrito, '-%');
  
  -- Generar HCU temporal: TEMP-XX-NNN-YYYY
  v_hcu := CONCAT('TEMP-', v_codigo_distrito, '-', LPAD(v_secuencial::TEXT, 3, '0'), '-', EXTRACT(YEAR FROM NOW())::TEXT);
  
  RETURN v_hcu;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- Función: Marcar como Completado (si no existe)
-- =====================================================================
CREATE OR REPLACE FUNCTION hospital_local.fn_marcar_completado(
  p_sync_queue_id BIGINT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE hospital_local.sync_queue
  SET estado = 'completado', fecha_ultimo_intento = NOW()
  WHERE id = p_sync_queue_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- Verificación
-- =====================================================================
SELECT '=== Hospital Local Functions Created ===' as status;
