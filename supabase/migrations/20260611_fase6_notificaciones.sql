-- Crear tabla hosix_notificaciones
CREATE TABLE IF NOT EXISTS hosix_notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  tipo VARCHAR NOT NULL,
  titulo VARCHAR NOT NULL,
  descripcion TEXT,
  datos JSONB,
  leida BOOLEAN DEFAULT FALSE,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_lectura TIMESTAMP,
  prioridad VARCHAR DEFAULT 'normal' CHECK (prioridad IN ('critical', 'high', 'normal', 'low')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejor performance
CREATE INDEX idx_notif_usuario ON hosix_notificaciones(usuario_id);
CREATE INDEX idx_notif_leida ON hosix_notificaciones(leida);
CREATE INDEX idx_notif_tipo ON hosix_notificaciones(tipo);
CREATE INDEX idx_notif_usuario_leida ON hosix_notificaciones(usuario_id, leida);
CREATE INDEX idx_notif_fecha ON hosix_notificaciones(fecha_creacion DESC);

-- RLS para notificaciones
ALTER TABLE hosix_notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios ven solo sus notificaciones"
  ON hosix_notificaciones
  FOR SELECT
  USING (usuario_id = auth.uid());

CREATE POLICY "Insertar notificaciones (sistema)"
  ON hosix_notificaciones
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Actualizar propias notificaciones"
  ON hosix_notificaciones
  FOR UPDATE
  USING (usuario_id = auth.uid());

CREATE POLICY "Borrar propias notificaciones"
  ON hosix_notificaciones
  FOR DELETE
  USING (usuario_id = auth.uid());

-- Crear tabla hosix_preferencias_notificacion
CREATE TABLE IF NOT EXISTS hosix_preferencias_notificacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE UNIQUE,
  sonido_habilitado BOOLEAN DEFAULT TRUE,
  tipo_sonido VARCHAR DEFAULT 'chime' CHECK (tipo_sonido IN ('chime', 'bell', 'alert')),
  volumen INTEGER DEFAULT 100 CHECK (volumen >= 0 AND volumen <= 100),
  altavoz_habilitado BOOLEAN DEFAULT FALSE,
  altavoz_velocidad NUMERIC DEFAULT 1.0,
  notif_laboratorio BOOLEAN DEFAULT TRUE,
  notif_imagenologia BOOLEAN DEFAULT TRUE,
  notif_admision BOOLEAN DEFAULT TRUE,
  notif_recaudacion BOOLEAN DEFAULT FALSE,
  notif_caja BOOLEAN DEFAULT TRUE,
  silencio_temporal_hasta TIMESTAMP,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_pref_usuario ON hosix_preferencias_notificacion(usuario_id);

-- RLS para preferencias
ALTER TABLE hosix_preferencias_notificacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios ven solo sus preferencias"
  ON hosix_preferencias_notificacion
  FOR SELECT
  USING (usuario_id = auth.uid());

CREATE POLICY "Actualizar propias preferencias"
  ON hosix_preferencias_notificacion
  FOR UPDATE
  USING (usuario_id = auth.uid());

CREATE POLICY "Insertar propias preferencias"
  ON hosix_preferencias_notificacion
  FOR INSERT
  WITH CHECK (usuario_id = auth.uid());

-- Trigger para crear preferencias automáticamente cuando se crea usuario
CREATE OR REPLACE FUNCTION crear_preferencias_notificacion()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO hosix_preferencias_notificacion (usuario_id)
  VALUES (NEW.id)
  ON CONFLICT (usuario_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_crear_pref_notif
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION crear_preferencias_notificacion();

-- Función para notificar resultados de laboratorio
CREATE OR REPLACE FUNCTION notificar_resultados_laboratorio()
RETURNS TRIGGER AS $$
DECLARE
  v_medico_id UUID;
  v_paciente_nombre VARCHAR;
BEGIN
  -- Obtener médico solicitante y nombre del paciente
  SELECT sol.medico_id, pac.nombre_completo
  INTO v_medico_id, v_paciente_nombre
  FROM hosix_laboratorio_solicitudes sol
  JOIN hosix_pacientes pac ON sol.paciente_id = pac.id
  WHERE sol.id = NEW.solicitud_id;

  -- Insertar notificación si hay médico asignado
  IF v_medico_id IS NOT NULL THEN
    INSERT INTO hosix_notificaciones 
    (usuario_id, tipo, titulo, descripcion, datos, prioridad)
    VALUES (
      v_medico_id,
      'laboratorio',
      'Resultados de Laboratorio Disponibles',
      'Los resultados para ' || v_paciente_nombre || ' están listos',
      jsonb_build_object(
        'solicitud_id', NEW.solicitud_id,
        'paciente_nombre', v_paciente_nombre,
        'tipo_resultado', 'laboratorio'
      ),
      'high'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para laboratorio
CREATE TRIGGER trig_notif_resultado_lab
AFTER INSERT ON hosix_laboratorio_resultados
FOR EACH ROW
WHEN (NEW.valor_resultado IS NOT NULL)
EXECUTE FUNCTION notificar_resultados_laboratorio();

-- Función para notificar estudios de imagenología completados
CREATE OR REPLACE FUNCTION notificar_estudio_imagenologia()
RETURNS TRIGGER AS $$
DECLARE
  v_medico_id UUID;
  v_paciente_nombre VARCHAR;
BEGIN
  SELECT sol.medico_id, pac.nombre_completo
  INTO v_medico_id, v_paciente_nombre
  FROM hosix_imagenologia_solicitudes sol
  JOIN hosix_pacientes pac ON sol.paciente_id = pac.id
  WHERE sol.id = NEW.solicitud_id;

  IF v_medico_id IS NOT NULL THEN
    INSERT INTO hosix_notificaciones 
    (usuario_id, tipo, titulo, descripcion, datos, prioridad)
    VALUES (
      v_medico_id,
      'imagenologia',
      'Estudio de Imagenología Completado',
      'El estudio para ' || v_paciente_nombre || ' está listo',
      jsonb_build_object(
        'solicitud_id', NEW.solicitud_id,
        'paciente_nombre', v_paciente_nombre,
        'estudio_id', NEW.id
      ),
      'high'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para imagenología
CREATE TRIGGER trig_notif_estudio_imagen
AFTER INSERT ON hosix_imagenologia_estudios
FOR EACH ROW
EXECUTE FUNCTION notificar_estudio_imagenologia();

-- Función para notificar cuando es el turno del paciente en lista de espera
CREATE OR REPLACE FUNCTION notificar_turno_lista_espera()
RETURNS TRIGGER AS $$
DECLARE
  v_paciente_id UUID;
  v_paciente_nombre VARCHAR;
BEGIN
  -- Si el estado cambió a "en_consulta" o "llamado", notificar
  IF NEW.estado IN ('en_consulta', 'llamado') AND OLD.estado != NEW.estado THEN
    SELECT pac.id, pac.nombre_completo
    INTO v_paciente_id, v_paciente_nombre
    FROM hosix_pacientes pac
    WHERE pac.id = NEW.paciente_id;

    -- Notificar al paciente
    INSERT INTO hosix_notificaciones 
    (usuario_id, tipo, titulo, descripcion, datos, prioridad)
    VALUES (
      v_paciente_id,
      'admision',
      '¡Es tu turno!',
      'Por favor acérquese al consultorio',
      jsonb_build_object(
        'lista_espera_id', NEW.id,
        'numero_turno', NEW.numero_turno,
        'tipo_solicitud', NEW.tipo_solicitud
      ),
      'critical'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para lista de espera
CREATE TRIGGER trig_notif_turno
AFTER UPDATE ON hosix_lista_espera
FOR EACH ROW
EXECUTE FUNCTION notificar_turno_lista_espera();

-- Función para notificar pago registrado
CREATE OR REPLACE FUNCTION notificar_pago_registrado()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO hosix_notificaciones 
  (usuario_id, tipo, titulo, descripcion, datos, prioridad)
  VALUES (
    NEW.usuario_id,
    'caja',
    'Pago Registrado',
    'Se registró un pago de $' || TO_CHAR(NEW.monto_total, '999,999.99'),
    jsonb_build_object(
      'recibo_id', NEW.id,
      'numero_recibo', NEW.numero_recibo,
      'monto', NEW.monto_total,
      'metodo', NEW.metodo_pago
    ),
    'normal'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para recibos (si usuario_id existe en tabla)
-- Nota: Ajustar según estructura real de hosix_recibos_pagos

-- Grants
GRANT SELECT ON hosix_notificaciones TO authenticated;
GRANT INSERT ON hosix_notificaciones TO authenticated;
GRANT UPDATE ON hosix_notificaciones TO authenticated;
GRANT DELETE ON hosix_notificaciones TO authenticated;

GRANT SELECT ON hosix_preferencias_notificacion TO authenticated;
GRANT INSERT ON hosix_preferencias_notificacion TO authenticated;
GRANT UPDATE ON hosix_preferencias_notificacion TO authenticated;
