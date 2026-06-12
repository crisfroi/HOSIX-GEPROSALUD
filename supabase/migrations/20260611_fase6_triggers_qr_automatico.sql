-- HOSIX Sistema de Gestión Hospitalaria
-- Migración Fase 6: Triggers de generación automática de QR
-- Fecha: 2026-06-11
-- Descripción: Triggers que generan QR automáticamente cuando se crean solicitudes de laboratorio e imagenología

-- ============================================================
-- 1. FUNCIÓN: Generar QR para solicitud de laboratorio
-- ============================================================
CREATE OR REPLACE FUNCTION generar_qr_solicitud_laboratorio()
RETURNS TRIGGER AS $$
DECLARE
  v_numero_documento VARCHAR;
  v_codigo_qr VARCHAR;
BEGIN
  -- Evitar generar QR si ya existe
  IF NEW.codigo_qr IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Generar número de documento único
  v_numero_documento := 'LAB' || EXTRACT(YEAR FROM now())::INT || LPAD((
    SELECT COUNT(*) + 1 FROM hosix_laboratorio_solicitudes 
    WHERE EXTRACT(YEAR FROM fecha_solicitud) = EXTRACT(YEAR FROM now())
  )::TEXT, 6, '0');

  -- Generar código QR (basado en ID de la solicitud)
  v_codigo_qr := 'QR' || SUBSTRING(NEW.id::TEXT, 1, 8) || SUBSTRING(v_numero_documento, -4);

  -- Actualizar la solicitud con número de documento y código QR
  NEW.numero_documento := v_numero_documento;
  NEW.codigo_qr := v_codigo_qr;

  -- Intentar insertar en hosix_codigos_documentos
  INSERT INTO hosix_codigos_documentos (
    tipo_documento,
    documento_id,
    numero_documento,
    codigo_qr,
    datos_json
  ) VALUES (
    'solicitud_lab',
    NEW.id,
    v_numero_documento,
    v_codigo_qr,
    jsonb_build_object(
      'tipo', 'laboratorio',
      'numero', v_numero_documento,
      'documento_id', NEW.id,
      'paciente_id', NEW.paciente_id,
      'fecha', now(),
      'prioridad', NEW.prioridad
    )
  ) ON CONFLICT (codigo_qr) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. FUNCIÓN: Generar QR para solicitud de imagenología
-- ============================================================
CREATE OR REPLACE FUNCTION generar_qr_solicitud_imagenologia()
RETURNS TRIGGER AS $$
DECLARE
  v_numero_documento VARCHAR;
  v_codigo_qr VARCHAR;
BEGIN
  -- Evitar generar QR si ya existe
  IF NEW.codigo_qr IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Generar número de documento único
  v_numero_documento := 'IMG' || EXTRACT(YEAR FROM now())::INT || LPAD((
    SELECT COUNT(*) + 1 FROM hosix_imagenologia_solicitudes 
    WHERE EXTRACT(YEAR FROM fecha_solicitud) = EXTRACT(YEAR FROM now())
  )::TEXT, 6, '0');

  -- Generar código QR (basado en ID de la solicitud)
  v_codigo_qr := 'QR' || SUBSTRING(NEW.id::TEXT, 1, 8) || SUBSTRING(v_numero_documento, -4);

  -- Actualizar la solicitud con número de documento y código QR
  NEW.numero_documento := v_numero_documento;
  NEW.codigo_qr := v_codigo_qr;

  -- Intentar insertar en hosix_codigos_documentos
  INSERT INTO hosix_codigos_documentos (
    tipo_documento,
    documento_id,
    numero_documento,
    codigo_qr,
    datos_json
  ) VALUES (
    'solicitud_imagen',
    NEW.id,
    v_numero_documento,
    v_codigo_qr,
    jsonb_build_object(
      'tipo', 'imagenologia',
      'numero', v_numero_documento,
      'documento_id', NEW.id,
      'paciente_id', NEW.paciente_id,
      'fecha', now(),
      'prioridad', NEW.prioridad
    )
  ) ON CONFLICT (codigo_qr) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. TRIGGERS: Activar generación automática de QR
-- ============================================================
DROP TRIGGER IF EXISTS trigger_generar_qr_laboratorio ON hosix_laboratorio_solicitudes;
CREATE TRIGGER trigger_generar_qr_laboratorio
BEFORE INSERT ON hosix_laboratorio_solicitudes
FOR EACH ROW
EXECUTE FUNCTION generar_qr_solicitud_laboratorio();

DROP TRIGGER IF EXISTS trigger_generar_qr_imagenologia ON hosix_imagenologia_solicitudes;
CREATE TRIGGER trigger_generar_qr_imagenologia
BEFORE INSERT ON hosix_imagenologia_solicitudes
FOR EACH ROW
EXECUTE FUNCTION generar_qr_solicitud_imagenologia();

-- ============================================================
-- 4. FUNCIÓN: Registrar escaneo de documento
-- ============================================================
CREATE OR REPLACE FUNCTION registrar_escaneo_documento(p_codigo_qr VARCHAR)
RETURNS TABLE (
  id UUID,
  tipo_documento VARCHAR,
  numero_documento VARCHAR,
  escaneo_count INT,
  datos_json JSONB
) AS $$
BEGIN
  UPDATE hosix_codigos_documentos
  SET
    escaneo_count = escaneo_count + 1,
    ultimo_escaneo = now(),
    primer_escaneo = COALESCE(primer_escaneo, now())
  WHERE codigo_qr = p_codigo_qr AND activo = true
  RETURNING
    hosix_codigos_documentos.id,
    hosix_codigos_documentos.tipo_documento,
    hosix_codigos_documentos.numero_documento,
    hosix_codigos_documentos.escaneo_count,
    hosix_codigos_documentos.datos_json
  INTO id, tipo_documento, numero_documento, escaneo_count, datos_json;

  RETURN QUERY SELECT id, tipo_documento, numero_documento, escaneo_count, datos_json;
END;
$$ LANGUAGE plpgsql;

-- Permitir llamar la función desde edge functions
GRANT EXECUTE ON FUNCTION registrar_escaneo_documento(VARCHAR) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION generar_numero_documento(VARCHAR) TO authenticated, anon;
