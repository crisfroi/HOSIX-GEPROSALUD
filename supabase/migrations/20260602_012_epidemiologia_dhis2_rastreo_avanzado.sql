-- Migración: Ampliación de epidemiología con DHIS2, rastreo avanzado y laboratorio
-- Fecha: 2026-06-02
-- Propósito: Adaptar arquitectura DHIS2 + rastreo de contactos diario + vigilancia sindrómica

-- ============================================================
-- 1. EXTENDER hosix_enfermedades_notificables CON DHIS2 Y GRUPOS OMS
-- ============================================================

ALTER TABLE hosix_enfermedades_notificables
  ADD COLUMN IF NOT EXISTS grupo_vigilancia VARCHAR(10) CHECK (grupo_vigilancia IN ('A','B','C','D')),
  ADD COLUMN IF NOT EXISTS nombre_ingles VARCHAR(255),
  ADD COLUMN IF NOT EXISTS modo_transmision TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tipo_aislamiento VARCHAR(50),
  ADD COLUMN IF NOT EXISTS plazo_notificacion_horas INTEGER DEFAULT 24,
  ADD COLUMN IF NOT EXISTS periodo_infeccioso_dias INTEGER,
  ADD COLUMN IF NOT EXISTS dhis2_uid VARCHAR(50),
  ADD COLUMN IF NOT EXISTS dhis2_codigo VARCHAR(20),
  ADD COLUMN IF NOT EXISTS ficha_notificacion JSONB,
  ADD COLUMN IF NOT EXISTS acciones_inmediatas TEXT[] DEFAULT '{}';

-- Crear índices para búsqueda por grupo
CREATE INDEX IF NOT EXISTS idx_enfermedades_grupo ON hosix_enfermedades_notificables(grupo_vigilancia);
CREATE INDEX IF NOT EXISTS idx_enfermedades_dhis2 ON hosix_enfermedades_notificables(dhis2_uid);

-- ============================================================
-- 2. EXTENDER hosix_casos_epidemiologicos CON DHIS2 Y DETALLES
-- ============================================================

ALTER TABLE hosix_casos_epidemiologicos
  ADD COLUMN IF NOT EXISTS clasificacion VARCHAR(50) DEFAULT 'sospechoso' 
    CHECK (clasificacion IN ('sospechoso','probable','confirmado','descartado')),
  ADD COLUMN IF NOT EXISTS criterio_clasificacion TEXT,
  ADD COLUMN IF NOT EXISTS edad_exacta_anios INTEGER,
  ADD COLUMN IF NOT EXISTS edad_exacta_meses INTEGER,
  ADD COLUMN IF NOT EXISTS embarazada BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS provincia VARCHAR(255),
  ADD COLUMN IF NOT EXISTS distrito VARCHAR(255),
  ADD COLUMN IF NOT EXISTS localidad VARCHAR(255),
  ADD COLUMN IF NOT EXISTS coordenadas_lat DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS coordenadas_lng DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS ocupacion VARCHAR(255),
  ADD COLUMN IF NOT EXISTS etnia VARCHAR(100),
  ADD COLUMN IF NOT EXISTS origen_infeccion VARCHAR(50) DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS pais_origen VARCHAR(100),
  ADD COLUMN IF NOT EXISTS fuente_probable_infeccion TEXT,
  ADD COLUMN IF NOT EXISTS muestras_tomadas BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS resultado_laboratorio VARCHAR(20),
  ADD COLUMN IF NOT EXISTS tipo_prueba_diagnostica TEXT,
  ADD COLUMN IF NOT EXISTS fecha_confirmacion_lab TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS laboratorio_referencia VARCHAR(255),
  ADD COLUMN IF NOT EXISTS estado_vacunacion VARCHAR(20) DEFAULT 'desconocido',
  ADD COLUMN IF NOT EXISTS dosis_vacuna INTEGER,
  ADD COLUMN IF NOT EXISTS aislado BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS lugar_aislamiento VARCHAR(50),
  ADD COLUMN IF NOT EXISTS fecha_inicio_aislamiento DATE,
  ADD COLUMN IF NOT EXISTS fecha_fin_aislamiento DATE,
  ADD COLUMN IF NOT EXISTS investigado_por UUID REFERENCES hosix_usuarios(id),
  ADD COLUMN IF NOT EXISTS dhis2_tracked_entity_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS dhis2_enrollment_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS dhis2_sincronizado BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dhis2_ultima_sincronizacion TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ficha_epidemiologica JSONB,
  ADD COLUMN IF NOT EXISTS estado_caso VARCHAR(30) DEFAULT 'activo' 
    CHECK (estado_caso IN ('activo','cerrado','archivado'));

CREATE INDEX IF NOT EXISTS idx_casos_clasificacion ON hosix_casos_epidemiologicos(clasificacion);
CREATE INDEX IF NOT EXISTS idx_casos_localidad ON hosix_casos_epidemiologicos(provincia, distrito);
CREATE INDEX IF NOT EXISTS idx_casos_dhis2 ON hosix_casos_epidemiologicos(dhis2_tracked_entity_id);
CREATE INDEX IF NOT EXISTS idx_casos_ocupacion ON hosix_casos_epidemiologicos(ocupacion);

-- ============================================================
-- 3. SEGUIMIENTO DIARIO DE CONTACTOS (NUEVA TABLA)
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_seguimiento_contactos_diario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contacto_id UUID NOT NULL REFERENCES hosix_contactos_epidemiologicos(id),
  
  dia_vigilancia INTEGER NOT NULL,  -- día 1, 2, 3... del período de vigilancia
  fecha_seguimiento DATE NOT NULL,
  
  -- Estado del contacto en ese día
  contacto_realizado BOOLEAN DEFAULT FALSE,
  canal_contacto VARCHAR(30),       -- 'presencial','telefono','sms','whatsapp','email'
  
  -- Evaluación de síntomas
  asintomatico BOOLEAN DEFAULT TRUE,
  fiebre BOOLEAN DEFAULT FALSE,
  temperatura_celsius DECIMAL(4,1),
  tos BOOLEAN DEFAULT FALSE,
  dificultad_respiratoria BOOLEAN DEFAULT FALSE,
  vomitos BOOLEAN DEFAULT FALSE,
  diarrea BOOLEAN DEFAULT FALSE,
  cefalea BOOLEAN DEFAULT FALSE,
  mialgias BOOLEAN DEFAULT FALSE,
  rash BOOLEAN DEFAULT FALSE,
  ictericia BOOLEAN DEFAULT FALSE,
  hemorragia BOOLEAN DEFAULT FALSE,
  sintomas_neurologicos BOOLEAN DEFAULT FALSE,
  otros_sintomas TEXT,
  
  -- Evaluación de alerta
  nivel_alerta VARCHAR(10) DEFAULT 'verde' CHECK (nivel_alerta IN ('verde','amarillo','rojo')),
  accion_tomada VARCHAR(50),  -- 'continua_vigilancia','derivado_salud','hospitalizado','caso_notificado'
  
  -- Intervenciones
  vacuna_post_exposicion BOOLEAN DEFAULT FALSE,
  quimioprofilaxis BOOLEAN DEFAULT FALSE,
  
  registrado_por UUID REFERENCES hosix_usuarios(id),
  notas TEXT,
  
  -- DHIS2
  dhis2_event_id VARCHAR(50),
  dhis2_sincronizado BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (contacto_id, dia_vigilancia, fecha_seguimiento)
);

CREATE INDEX IF NOT EXISTS idx_seguimiento_contacto ON hosix_seguimiento_contactos_diario(contacto_id);
CREATE INDEX IF NOT EXISTS idx_seguimiento_fecha ON hosix_seguimiento_contactos_diario(fecha_seguimiento);
CREATE INDEX IF NOT EXISTS idx_seguimiento_alerta ON hosix_seguimiento_contactos_diario(nivel_alerta);

-- ============================================================
-- 4. EXTENDER hosix_contactos_epidemiologicos CON RASTREO DETALLADO
-- ============================================================

ALTER TABLE hosix_contactos_epidemiologicos
  ADD COLUMN IF NOT EXISTS nombres VARCHAR(255),
  ADD COLUMN IF NOT EXISTS apellidos VARCHAR(255),
  ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
  ADD COLUMN IF NOT EXISTS edad_anios INTEGER,
  ADD COLUMN IF NOT EXISTS sexo VARCHAR(10),
  ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR(30),
  ADD COLUMN IF NOT EXISTS numero_documento VARCHAR(50),
  ADD COLUMN IF NOT EXISTS telefono VARCHAR(30),
  ADD COLUMN IF NOT EXISTS telefono_alternativo VARCHAR(30),
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS provincia VARCHAR(255),
  ADD COLUMN IF NOT EXISTS distrito VARCHAR(255),
  ADD COLUMN IF NOT EXISTS localidad VARCHAR(255),
  ADD COLUMN IF NOT EXISTS direccion_completa TEXT,
  ADD COLUMN IF NOT EXISTS coordenadas_lat DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS coordenadas_lng DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS lugar_contacto TEXT,
  ADD COLUMN IF NOT EXISTS subtipo_contacto VARCHAR(50),  -- 'conviviente','vecino','compañero','pareja'
  ADD COLUMN IF NOT EXISTS grado_exposicion VARCHAR(20) DEFAULT 'medio' 
    CHECK (grado_exposicion IN ('bajo','medio','alto')),
  ADD COLUMN IF NOT EXISTS duracion_exposicion_horas DECIMAL(5,1),
  ADD COLUMN IF NOT EXISTS distancia_exposicion_metros DECIMAL(6,1),
  ADD COLUMN IF NOT EXISTS uso_epp BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS descripcion_exposicion TEXT,
  ADD COLUMN IF NOT EXISTS contacto_de_contacto_id UUID REFERENCES hosix_contactos_epidemiologicos(id),
  ADD COLUMN IF NOT EXISTS generacion INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS se_convirtio_en_caso BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS caso_secundario_id UUID REFERENCES hosix_casos_epidemiologicos(id),
  ADD COLUMN IF NOT EXISTS agente_seguimiento_id UUID REFERENCES hosix_usuarios(id),
  ADD COLUMN IF NOT EXISTS dhis2_tracked_entity_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS lugar_cuarentena VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_contactos_nombre ON hosix_contactos_epidemiologicos(apellidos, nombres);
CREATE INDEX IF NOT EXISTS idx_contactos_documento ON hosix_contactos_epidemiologicos(numero_documento);
CREATE INDEX IF NOT EXISTS idx_contactos_localidad ON hosix_contactos_epidemiologicos(provincia, distrito);
CREATE INDEX IF NOT EXISTS idx_contactos_generacion ON hosix_contactos_epidemiologicos(generacion);

-- ============================================================
-- 5. VIGILANCIA SINDRÓMICA AGREGADA (NUEVA TABLA)
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_vigilancia_sindromica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hosix_hospitales(id),
  
  semana_epidemiologica INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  fecha_inicio_semana DATE NOT NULL,
  fecha_fin_semana DATE NOT NULL,
  
  -- Síndromes vigilados (conteos semanales)
  sindrome_febril_agudo INTEGER DEFAULT 0,
  sindrome_respiratorio_agudo_severo INTEGER DEFAULT 0,
  sindrome_diarreico_agudo INTEGER DEFAULT 0,
  sindrome_neurologico_agudo INTEGER DEFAULT 0,
  sindrome_icterico_agudo INTEGER DEFAULT 0,
  sindrome_hemorragico INTEGER DEFAULT 0,
  
  -- Desglose demográfico
  casos_menos_5_anios INTEGER DEFAULT 0,
  casos_5_a_14 INTEGER DEFAULT 0,
  casos_15_a_49 INTEGER DEFAULT 0,
  casos_50_mas INTEGER DEFAULT 0,
  casos_mujeres_embarazadas INTEGER DEFAULT 0,
  
  -- Mortalidad
  muertes_total INTEGER DEFAULT 0,
  muertes_menores_5 INTEGER DEFAULT 0,
  
  -- Denominador
  total_consultas_semana INTEGER DEFAULT 0,
  
  -- DHIS2
  dhis2_dataset_id VARCHAR(50),
  dhis2_org_unit_id VARCHAR(50),
  dhis2_sincronizado BOOLEAN DEFAULT FALSE,
  
  completado_por UUID REFERENCES hosix_usuarios(id),
  aprobado_por UUID REFERENCES hosix_usuarios(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (hospital_id, semana_epidemiologica, anio)
);

CREATE INDEX IF NOT EXISTS idx_vigilancia_sindromica_semana ON hosix_vigilancia_sindromica(semana_epidemiologica, anio);
CREATE INDEX IF NOT EXISTS idx_vigilancia_sindromica_hospital ON hosix_vigilancia_sindromica(hospital_id);

-- ============================================================
-- 6. LABORATORIO EPIDEMIOLÓGICO (NUEVA TABLA)
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_muestras_epidemiologicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID REFERENCES hosix_casos_epidemiologicos(id),
  contacto_id UUID REFERENCES hosix_contactos_epidemiologicos(id),
  
  codigo_muestra VARCHAR(50) UNIQUE NOT NULL,
  tipo_muestra TEXT NOT NULL,  -- 'sangre','suero','orina','heces','hisopo_nasal','lcr','tejido'
  fecha_toma TIMESTAMPTZ NOT NULL,
  tomada_por UUID REFERENCES hosix_usuarios(id),
  
  -- Cadena de frío
  temperatura_almacenamiento DECIMAL(4,1),
  medio_transporte TEXT,
  fecha_envio TIMESTAMPTZ,
  laboratorio_destino VARCHAR(255),  -- 'LCGE','INSP','WHO_Lab','CDC'
  
  -- Resultados
  prueba_realizada TEXT,
  resultado VARCHAR(20) DEFAULT 'pendiente' 
    CHECK (resultado IN ('positivo','negativo','indeterminado','pendiente')),
  resultado_detalle JSONB,  -- {serotipo, cepa, carga_viral, ct_value}
  fecha_resultado TIMESTAMPTZ,
  
  estado VARCHAR(30) DEFAULT 'en_transito' 
    CHECK (estado IN ('en_transito','recibida','procesando','completada','rechazada')),
  
  -- DHIS2
  dhis2_event_id VARCHAR(50),
  dhis2_sincronizado BOOLEAN DEFAULT FALSE,
  
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_muestras_caso ON hosix_muestras_epidemiologicas(caso_id);
CREATE INDEX IF NOT EXISTS idx_muestras_contacto ON hosix_muestras_epidemiologicas(contacto_id);
CREATE INDEX IF NOT EXISTS idx_muestras_fecha ON hosix_muestras_epidemiologicas(fecha_toma);
CREATE INDEX IF NOT EXISTS idx_muestras_resultado ON hosix_muestras_epidemiologicas(resultado);

-- ============================================================
-- 7. ZONAS DE RIESGO / GEOESPACIAL (NUEVA TABLA)
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_zonas_riesgo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(30),  -- 'foco_activo','zona_buffer','zona_alerta','zona_libre'
  enfermedad_id UUID REFERENCES hosix_enfermedades_notificables(id),
  brote_id UUID REFERENCES hosix_brotes_epidemiologicos(id),
  
  -- Geometría como GeoJSON
  geojson JSONB NOT NULL,
  area_km2 DECIMAL(10,3),
  poblacion_estimada INTEGER,
  
  -- Medidas
  en_cuarentena BOOLEAN DEFAULT FALSE,
  acceso_restringido BOOLEAN DEFAULT FALSE,
  fumigacion_activa BOOLEAN DEFAULT FALSE,
  
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  
  nivel_riesgo VARCHAR(20) DEFAULT 'medio' 
    CHECK (nivel_riesgo IN ('muy_bajo','bajo','medio','alto','muy_alto')),
  color_mapa VARCHAR(10),  -- '#00cc00','#ffcc00','#ff6600','#ff0000'
  
  created_by UUID REFERENCES hosix_usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zonas_riesgo_brote ON hosix_zonas_riesgo(brote_id);
CREATE INDEX IF NOT EXISTS idx_zonas_riesgo_tipo ON hosix_zonas_riesgo(tipo);

-- ============================================================
-- 8. CAMPAÑAS DE VACUNACIÓN (NUEVA TABLA)
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_campanas_vacunacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo VARCHAR(30),  -- 'preventiva','reactiva','seguimiento'
  vacuna TEXT NOT NULL,
  enfermedad_id UUID REFERENCES hosix_enfermedades_notificables(id),
  brote_id UUID REFERENCES hosix_brotes_epidemiologicos(id),
  
  -- Cobertura geográfica
  nivel_geografico VARCHAR(30),
  provincias_objetivo TEXT[],
  distritos_objetivo TEXT[],
  poblacion_objetivo INTEGER,
  
  -- Grupo objetivo
  edad_min_meses INTEGER,
  edad_max_meses INTEGER,
  embarazadas_incluidas BOOLEAN DEFAULT FALSE,
  personal_sanitario_incluido BOOLEAN DEFAULT FALSE,
  
  -- Planificación
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  dosis_disponibles INTEGER,
  meta_cobertura_porcentaje DECIMAL(5,2) DEFAULT 95.0,
  
  -- Seguimiento
  dosis_administradas INTEGER DEFAULT 0,
  cobertura_alcanzada DECIMAL(5,2),
  eventos_adversos INTEGER DEFAULT 0,
  
  estado VARCHAR(30) DEFAULT 'planificada' 
    CHECK (estado IN ('planificada','activa','completada','cancelada')),
  
  -- DHIS2
  dhis2_program_id VARCHAR(50),
  dhis2_sincronizado BOOLEAN DEFAULT FALSE,
  
  created_by UUID REFERENCES hosix_usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campanas_enfermedad ON hosix_campanas_vacunacion(enfermedad_id);
CREATE INDEX IF NOT EXISTS idx_campanas_estado ON hosix_campanas_vacunacion(estado);

-- ============================================================
-- 9. NOTIFICACIÓN OFICIAL A DHIS2 (NUEVA TABLA)
-- ============================================================

CREATE TABLE IF NOT EXISTS hosix_notificaciones_dhis2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(30),  -- 'caso_individual','agregado_semanal','brote'
  periodo_semana INTEGER,
  periodo_anio INTEGER,
  
  datos_notificacion JSONB NOT NULL,
  destino VARCHAR(50),  -- 'dhis2','ministerio','ops','oms'
  
  estado VARCHAR(30) DEFAULT 'pendiente' 
    CHECK (estado IN ('pendiente','enviado','confirmado','error','rechazado')),
  
  intentos_envio INTEGER DEFAULT 0,
  fecha_envio TIMESTAMPTZ,
  fecha_confirmacion TIMESTAMPTZ,
  respuesta_servidor JSONB,
  error_detalle TEXT,
  
  dhis2_import_summaries JSONB,
  
  notificado_por UUID REFERENCES hosix_usuarios(id),
  aprobado_por UUID REFERENCES hosix_usuarios(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_estado ON hosix_notificaciones_dhis2(estado);
CREATE INDEX IF NOT EXISTS idx_notificaciones_periodo ON hosix_notificaciones_dhis2(periodo_semana, periodo_anio);

-- ============================================================
-- 10. EXTENSIÓN: ALERTAS CON MÁS DETALLES DHIS2
-- ============================================================

ALTER TABLE hosix_alertas_epidemiologicas
  ADD COLUMN IF NOT EXISTS nivel VARCHAR(20) DEFAULT 'alta' 
    CHECK (nivel IN ('info','advertencia','critica','emergencia')),
  ADD COLUMN IF NOT EXISTS titulo_alerta TEXT,
  ADD COLUMN IF NOT EXISTS estado_alerta VARCHAR(30) DEFAULT 'activa' 
    CHECK (estado_alerta IN ('activa','leida','gestionada','falso_positivo')),
  ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES hosix_hospitales(id),
  ADD COLUMN IF NOT EXISTS provincia VARCHAR(255),
  ADD COLUMN IF NOT EXISTS acciones_requeridas TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS accion_tomada TEXT,
  ADD COLUMN IF NOT EXISTS tomada_por UUID REFERENCES hosix_usuarios(id),
  ADD COLUMN IF NOT EXISTS fecha_accion TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sms_enviado BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_enviado BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dhis2_alert_id VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_alertas_nivel ON hosix_alertas_epidemiologicas(nivel);
CREATE INDEX IF NOT EXISTS idx_alertas_hospital ON hosix_alertas_epidemiologicas(hospital_id);

-- ============================================================
-- 11. RELACIÓN: BROTES Y CONTACTOS DE CONTACTO (GRAFOS)
-- ============================================================

-- Los contactos ya tienen "contacto_de_contacto_id" para crear cadenas
-- Esto permite análisis de redes (D3.js) para mostrar la propagación

-- ============================================================
-- 12. VISTAS PARA REPORTES RÁPIDOS
-- ============================================================

CREATE OR REPLACE VIEW vista_casos_activos AS
  SELECT 
    c.id, c.numero_caso, c.paciente_id, e.nombre as enfermedad,
    c.clasificacion, c.fecha_sintomas, c.provincia, c.distrito,
    c.aislado, c.estado_caso, c.created_at
  FROM hosix_casos_epidemiologicos c
  JOIN hosix_enfermedades_notificables e ON c.enfermedad_id = e.id
  WHERE c.estado_caso = 'activo'
  ORDER BY c.created_at DESC;

CREATE OR REPLACE VIEW vista_contactos_sintomaticos AS
  SELECT 
    cont.id, cont.nombres, cont.apellidos, cont.telefono,
    cont.caso_indice_id, casos.numero_caso,
    cont.nivel_riesgo, seg.nivel_alerta,
    seg.fecha_seguimiento, seg.asintomatico
  FROM hosix_contactos_epidemiologicos cont
  JOIN hosix_casos_epidemiologicos casos ON cont.caso_indice_id = casos.id
  LEFT JOIN (
    SELECT contacto_id, MAX(fecha_seguimiento) as fecha_max, nivel_alerta, asintomatico
    FROM hosix_seguimiento_contactos_diario
    GROUP BY contacto_id
  ) seg ON seg.contacto_id = cont.id
  WHERE cont.estado_vigilancia = 'activa' AND seg.asintomatico = FALSE
  ORDER BY seg.nivel_alerta DESC;

CREATE OR REPLACE VIEW vista_brotes_vigentes AS
  SELECT 
    b.id, b.numero_brote, e.nombre as enfermedad,
    b.ubicacion_geografica, b.total_casos, b.casos_confirmados,
    b.tasa_mortalidad, b.estado, b.fecha_inicio
  FROM hosix_brotes_epidemiologicos b
  JOIN hosix_enfermedades_notificables e ON b.enfermedad_id = e.id
  WHERE b.estado IN ('activo','controlado')
  ORDER BY b.fecha_inicio DESC;

-- ============================================================
-- 13. ÍNDICES PARA PERFORMANCE GENERAL
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_casos_created ON hosix_casos_epidemiologicos(created_at);
CREATE INDEX IF NOT EXISTS idx_contactos_estado_vigilancia ON hosix_contactos_epidemiologicos(estado_vigilancia);
CREATE INDEX IF NOT EXISTS idx_brotes_hospital ON hosix_brotes_epidemiologicos(hospital_id);

-- ============================================================
-- 14. COMENTARIOS
-- ============================================================

COMMENT ON TABLE hosix_seguimiento_contactos_diario 
  IS 'Seguimiento diario de síntomas de contactos en vigilancia epidemiológica';

COMMENT ON TABLE hosix_vigilancia_sindromica 
  IS 'Datos agregados semanales de síndromes notificables por hospital';

COMMENT ON TABLE hosix_muestras_epidemiologicas 
  IS 'Registro de muestras biológicas para diagnóstico confirmatorio';

COMMENT ON TABLE hosix_zonas_riesgo 
  IS 'Zonas geográficas de riesgo/contención para brotes';

COMMENT ON TABLE hosix_campanas_vacunacion 
  IS 'Planificación y seguimiento de campañas preventivas y reactivas';

COMMENT ON TABLE hosix_notificaciones_dhis2 
  IS 'Logs de envío oficial de notificaciones a DHIS2 y ministerio';
