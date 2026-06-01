# 🦠 PROMPT AVANZADO — MÓDULO DE VIGILANCIA EPIDEMIOLÓGICA
### HOSIX × DHIS2 · Guinea Ecuatorial · React + Supabase + DHIS2 API

---

## CONTEXTO Y ALCANCE

Eres el arquitecto principal del módulo de **Vigilancia Epidemiológica y Control de Brotes** integrado en el HIS HOSIX de la Red Hospitalaria de Guinea Ecuatorial.

Este módulo amplía el simple registro de contactos familiares existente hacia un sistema robusto de **detección, notificación, rastreo de contactos y control de brotes**, completamente integrado bidireccialmente con **DHIS2** (instancia nacional del Ministerio de Sanidad de Guinea Ecuatorial), siguiendo los estándares de la **OMS** y el **ECDC** para la vigilancia epidemiológica en África Subsahariana.

### Enfermedades Prioritarias para Guinea Ecuatorial
```
GRUPO A — Notificación inmediata (< 24h):
  Ébola, Fiebre de Marburg, Fiebre de Lassa, Viruela del Mono (Mpox),
  Cólera, Peste, Fiebre Amarilla, Meningitis Meningocócica, 
  Polio (AFP), Rabia, SARS/MERS/COVID-19 variantes preocupantes,
  Fiebre Hemorrágica sin identificar

GRUPO B — Notificación semanal:
  Malaria (P. falciparum, P. vivax), VIH/SIDA, Tuberculosis,
  Hepatitis A/B/C/E, Tifoidea, Dengue, Chikungunya, Fiebre del Nilo,
  Brucelosis, Leptospirosis, Leishmaniasis, Esquistosomiasis,
  Tripanosomiasis Africana (Enfermedad del Sueño), Oncocercosis

GRUPO C — Vigilancia sindrómica continua:
  Síndrome Febril Agudo, Síndrome Respiratorio Agudo Severo (SRAS),
  Síndrome Diarreico Agudo, Síndrome Neurológico Agudo,
  Síndrome Ictérico Agudo, Síndrome Hemorrágico

GRUPO D — Enfermedades Tropicales Desatendidas (ETD):
  Lepra, Filariasis linfática, Úlcera de Buruli, Tracoma, Yaws
```

---

## STACK TECNOLÓGICO ADICIONAL

```
DHIS2 Integration:
  dhis2/app-runtime          → Cliente oficial DHIS2 para React
  dhis2/ui                   → Componentes UI DHIS2 (cuando en contexto DHIS2)
  API DHIS2 v40+             → REST API principal (tracker, events, analytics)
  DHIS2 Tracker Program      → Gestión de casos individuales
  DHIS2 Event Programs       → Notificación agregada semanal/mensual
  DHIS2 Org Unit Tree        → Jerarquía geográfica GE (Nacional→Provincia→Distrito→Facility)

Geoespacial:
  Leaflet.js + react-leaflet  → Mapas interactivos de brotes
  Mapbox GL JS                → Mapas avanzados con heatmaps
  GeoJSON Guinea Ecuatorial   → Límites provinciales/distritales
  Turf.js                     → Análisis espacial (radio de contactos, clusters)

Grafos / Rastreo de Contactos:
  D3.js + d3-force            → Visualización de red de contactos
  react-force-graph           → Grafo interactivo de contactos
  Cytoscape.js               → Análisis de redes epidemiológicas

Análisis Epidemiológico:
  Chart.js / Recharts         → Curvas epidémicas (epi curves)
  jStat                       → Estadística (IC 95%, OR, RR)
  simple-statistics           → Tendencias, anomalías, clustering

Comunicación y Alertas:
  Supabase Realtime           → Alertas en tiempo real
  Twilio SMS API              → SMS a personal de salud (notificaciones)
  Nodemailer (Edge Function)  → Emails automáticos al Ministerio/OPS

Formularios Dinámicos:
  React Hook Form + Zod       → Formularios de notificación por enfermedad
  @rjsf/core                  → JSON Schema Forms para fichas OPS/OMS
```

---

## ARQUITECTURA DE BASE DE DATOS — ESQUEMA EPIDEMIOLOGÍA

```sql
-- =========================================================
-- ESQUEMA PRINCIPAL: epidemiologia
-- =========================================================
CREATE SCHEMA epidemiologia;

-- -------------------------------------------------------
-- CATÁLOGOS Y MAESTROS EPIDEMIOLÓGICOS
-- -------------------------------------------------------

CREATE TABLE epidemiologia.enfermedades_vigilancia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_cie10 VARCHAR(10),
  codigo_dhis2 VARCHAR(50),         -- UID del programa DHIS2
  nombre TEXT NOT NULL,
  nombre_ingles TEXT,
  nombre_local TEXT,                -- En idiomas locales GE (Fang, Bubi, etc.)
  grupo_vigilancia VARCHAR(10),     -- 'A','B','C','D'
  tipo_notificacion VARCHAR(20),    -- 'inmediata','semanal','mensual','sindromica'
  plazo_notificacion_horas INTEGER, -- 24 para Grupo A, 168 para Grupo B
  es_brote_potencial BOOLEAN DEFAULT TRUE,
  periodo_incubacion_min_dias INTEGER,
  periodo_incubacion_max_dias INTEGER,
  periodo_infeccioso_dias INTEGER,
  modo_transmision TEXT[],          -- ['contacto_directo','aerosolizado','vectorial','fecal_oral']
  requiere_aislamiento BOOLEAN DEFAULT FALSE,
  tipo_aislamiento VARCHAR(20),     -- 'estandar','gotas','aerosolizado','contacto','inverso'
  umbral_alerta_casos INTEGER DEFAULT 1,  -- nº casos en X días para activar alerta brote
  umbral_alerta_dias INTEGER DEFAULT 7,
  ficha_notificacion_schema JSONB,  -- JSON Schema de la ficha oficial OPS/OMS
  acciones_inmediatas TEXT[],       -- pasos automáticos al confirmar caso
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE epidemiologia.casos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identificación
  numero_caso VARCHAR(30) UNIQUE NOT NULL,  -- GE-MAL-2026-000001
  paciente_id UUID REFERENCES pacientes.pacientes(id),
  episodio_id UUID REFERENCES clinico.episodios(id),  -- enlace al HIS
  hospital_id UUID REFERENCES configuracion.hospitales(id),
  
  -- Enfermedad
  enfermedad_id UUID REFERENCES epidemiologia.enfermedades_vigilancia(id),
  codigo_cie10 VARCHAR(10),
  
  -- Clasificación del caso
  clasificacion VARCHAR(20),         -- 'sospechoso','probable','confirmado','descartado'
  criterio_clasificacion TEXT,       -- criterios clínicos/laboratorio/epidemiológicos
  
  -- Datos demográficos del caso (desnormalizados para reportes rápidos)
  edad_anios INTEGER,
  edad_meses INTEGER,                -- para menores de 1 año
  sexo VARCHAR(10),
  embarazada BOOLEAN,
  provincia TEXT,
  distrito TEXT,
  localidad TEXT,
  coordenadas_lat DECIMAL(10,7),
  coordenadas_lng DECIMAL(10,7),
  etnia TEXT,
  ocupacion TEXT,
  
  -- Fechas clave
  fecha_inicio_sintomas DATE,
  fecha_consulta DATE,
  fecha_notificacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_confirmacion_lab TIMESTAMPTZ,
  fecha_hospitalizacion DATE,
  fecha_alta DATE,
  fecha_muerte DATE,
  
  -- Desenlace
  estado_vital VARCHAR(15) DEFAULT 'vivo',  -- 'vivo','muerto','desconocido'
  desenlace VARCHAR(20),                    -- 'recuperado','secuelas','muerte','seguimiento'
  
  -- Origen / contexto
  origen_infeccion VARCHAR(20),     -- 'local','importado','relacionado_brote','desconocido'
  pais_origen TEXT,                 -- si es caso importado
  brote_id UUID,                    -- FK a epidemiologia.brotes (nullable)
  fuente_probable_infeccion TEXT,
  
  -- Laboratorio
  muestras_tomadas BOOLEAN DEFAULT FALSE,
  resultado_laboratorio VARCHAR(20), -- 'positivo','negativo','pendiente','no_realizado'
  tipo_prueba_diagnostica TEXT,
  laboratorio_referencia TEXT,
  
  -- Vacunación (relevante para enf. prevenibles por vacuna)
  estado_vacunacion VARCHAR(20),     -- 'vacunado','no_vacunado','desconocido','parcial'
  dosis_vacuna INTEGER,
  
  -- Aislamiento
  aislado BOOLEAN DEFAULT FALSE,
  tipo_aislamiento VARCHAR(20),
  lugar_aislamiento VARCHAR(30),     -- 'hospital','domicilio','centro_cuarentena'
  fecha_inicio_aislamiento DATE,
  fecha_fin_aislamiento DATE,
  
  -- Notificación
  notificado_por UUID REFERENCES configuracion.usuarios(id),
  investigado_por UUID REFERENCES configuracion.usuarios(id),
  
  -- DHIS2 Sync
  dhis2_tracked_entity_id VARCHAR(50),  -- UID del TEI en DHIS2 Tracker
  dhis2_enrollment_id VARCHAR(50),
  dhis2_sincronizado BOOLEAN DEFAULT FALSE,
  dhis2_ultima_sincronizacion TIMESTAMPTZ,
  dhis2_error_sync TEXT,
  
  -- Ficha epidemiológica completa (datos variables por enfermedad)
  ficha_epidemiologica JSONB,
  
  -- Control
  estado_caso VARCHAR(20) DEFAULT 'activo',  -- 'activo','cerrado','archivado'
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- RASTREO DE CONTACTOS (Contact Tracing Robusto)
-- -------------------------------------------------------

CREATE TABLE epidemiologia.contactos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_fuente_id UUID REFERENCES epidemiologia.casos(id) NOT NULL,
  
  -- Identificación del contacto
  paciente_id UUID REFERENCES pacientes.pacientes(id),  -- si ya está en HIS
  
  -- Datos personales (para contactos no registrados en HIS)
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  fecha_nacimiento DATE,
  edad_anios INTEGER,
  sexo VARCHAR(10),
  tipo_documento VARCHAR(20),
  numero_documento VARCHAR(30),
  
  -- Localización
  telefono VARCHAR(20),
  telefono_alternativo VARCHAR(20),
  email TEXT,
  provincia TEXT,
  distrito TEXT,
  localidad TEXT,
  direccion_completa TEXT,
  coordenadas_lat DECIMAL(10,7),
  coordenadas_lng DECIMAL(10,7),
  lugar_contacto TEXT,              -- casa, trabajo, escuela, transporte, etc.
  
  -- Tipo y naturaleza del contacto
  tipo_contacto VARCHAR(30),        -- 'familiar','laboral','escolar','sanitario','social','comunitario','viaje'
  subtipo_contacto VARCHAR(30),     -- 'conviviente','vecino','compañero_trabajo','pareja','etc'
  grado_exposicion VARCHAR(10),     -- 'alto','medio','bajo'
  
  -- Detalles de la exposición
  fecha_primera_exposicion DATE,
  fecha_ultima_exposicion DATE,
  duracion_exposicion_horas DECIMAL(5,1),
  distancia_exposicion_metros DECIMAL(5,1),
  uso_epp_durante_contacto BOOLEAN DEFAULT FALSE,
  descripcion_exposicion TEXT,      -- descripción libre de cómo fue el contacto
  
  -- Relación de red (para grafo de contactos)
  contacto_de_contacto_id UUID REFERENCES epidemiologia.contactos(id),  -- contacto de 2do grado
  generacion INTEGER DEFAULT 1,     -- 1=contacto directo, 2=contacto de contacto, etc.
  
  -- Seguimiento de cuarentena/vigilancia
  estado_seguimiento VARCHAR(20) DEFAULT 'pendiente',  
  -- 'pendiente','en_seguimiento','completado','perdido','negativo','caso_secundario'
  
  fecha_inicio_cuarentena DATE,
  fecha_fin_cuarentena DATE,
  dias_cuarentena INTEGER GENERATED ALWAYS AS 
    (EXTRACT(DAY FROM fecha_fin_cuarentena - fecha_inicio_cuarentena)::INTEGER) STORED,
  lugar_cuarentena VARCHAR(30),     -- 'domicilio','hospital','centro_cuarentena'
  
  -- Si se convierte en caso
  se_convirtio_en_caso BOOLEAN DEFAULT FALSE,
  caso_secundario_id UUID REFERENCES epidemiologia.casos(id),
  fecha_inicio_sintomas DATE,
  
  -- Responsable del seguimiento
  agente_seguimiento_id UUID REFERENCES configuracion.usuarios(id),
  
  -- DHIS2
  dhis2_tracked_entity_id VARCHAR(50),
  dhis2_sincronizado BOOLEAN DEFAULT FALSE,
  
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- SEGUIMIENTO DIARIO DE CONTACTOS
-- -------------------------------------------------------

CREATE TABLE epidemiologia.seguimiento_contactos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contacto_id UUID REFERENCES epidemiologia.contactos(id) NOT NULL,
  dia_seguimiento INTEGER NOT NULL,      -- día 1, 2, 3... del periodo vigilancia
  fecha_seguimiento DATE NOT NULL,
  
  -- Estado del día
  contacto_realizado BOOLEAN DEFAULT FALSE,
  canal_contacto VARCHAR(20),           -- 'presencial','telefono','sms','whatsapp'
  
  -- Síntomas evaluados
  asintomatico BOOLEAN DEFAULT TRUE,
  fiebre BOOLEAN DEFAULT FALSE,
  temperatura DECIMAL(4,1),
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
  
  -- Evaluación
  nivel_alerta VARCHAR(10) DEFAULT 'verde',  -- 'verde','amarillo','rojo'
  accion_tomada VARCHAR(30),
  -- 'continua_vigilancia','derivado_salud','hospitalizado','muestra_tomada','caso_notificado'
  
  -- Vacunación de post-exposición (si aplica)
  vacuna_post_exposicion BOOLEAN DEFAULT FALSE,
  quimioprofilaxis BOOLEAN DEFAULT FALSE,
  
  registrado_por UUID REFERENCES configuracion.usuarios(id),
  notas TEXT,
  
  -- DHIS2 Event
  dhis2_event_id VARCHAR(50),
  dhis2_sincronizado BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (contacto_id, dia_seguimiento)
);

-- -------------------------------------------------------
-- GESTIÓN DE BROTES
-- -------------------------------------------------------

CREATE TABLE epidemiologia.brotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_brote VARCHAR(30) UNIQUE NOT NULL,  -- GE-EBOLA-2026-001
  
  -- Identificación
  nombre TEXT NOT NULL,
  enfermedad_id UUID REFERENCES epidemiologia.enfermedades_vigilancia(id),
  
  -- Ámbito geográfico
  nivel_geografico VARCHAR(20),    -- 'local','distrital','provincial','nacional','internacional'
  provincias_afectadas TEXT[],
  distritos_afectados TEXT[],
  localidades_afectadas TEXT[],
  coordenadas_epicentro_lat DECIMAL(10,7),
  coordenadas_epicentro_lng DECIMAL(10,7),
  radio_afectacion_km DECIMAL(6,2),
  
  -- Cronología
  fecha_inicio_estimada DATE,
  fecha_deteccion DATE NOT NULL,
  fecha_declaracion TIMESTAMPTZ,
  fecha_control DATE,
  fecha_cierre DATE,
  
  -- Estado
  estado VARCHAR(20) DEFAULT 'activo',   -- 'sospecha','confirmado','activo','controlado','cerrado'
  nivel_alerta VARCHAR(10) DEFAULT 'naranja',  -- 'amarillo','naranja','rojo'
  fase_respuesta VARCHAR(20),            -- 'deteccion','contencion','mitigacion','recuperacion'
  
  -- Estadísticas (se actualizan automáticamente con triggers)
  total_casos_sospechosos INTEGER DEFAULT 0,
  total_casos_probables INTEGER DEFAULT 0,
  total_casos_confirmados INTEGER DEFAULT 0,
  total_casos_descartados INTEGER DEFAULT 0,
  total_muertes INTEGER DEFAULT 0,
  tasa_letalidad DECIMAL(5,2),
  total_contactos_identificados INTEGER DEFAULT 0,
  total_contactos_en_seguimiento INTEGER DEFAULT 0,
  total_casos_secundarios INTEGER DEFAULT 0,
  numero_reproductivo_R0 DECIMAL(4,2),  -- calculado
  
  -- Fuente probable
  fuente_probable TEXT,
  hipotesis_transmision TEXT,
  
  -- Respuesta
  equipo_respuesta_rapida_activado BOOLEAN DEFAULT FALSE,
  fecha_activacion_err TIMESTAMPTZ,
  coordinador_brote_id UUID REFERENCES configuracion.usuarios(id),
  organismos_notificados TEXT[],   -- ['OMS','ECDC','OPS','MSalud_GE']
  fecha_notificacion_oms TIMESTAMPTZ,
  
  -- Intervenciones
  vacunacion_reactiva BOOLEAN DEFAULT FALSE,
  quimioprofilaxis_masiva BOOLEAN DEFAULT FALSE,
  cierre_escuelas BOOLEAN DEFAULT FALSE,
  cuarentena_comunitaria BOOLEAN DEFAULT FALSE,
  control_vectorial BOOLEAN DEFAULT FALSE,
  
  -- DHIS2
  dhis2_outbreak_id VARCHAR(50),
  dhis2_sincronizado BOOLEAN DEFAULT FALSE,
  
  -- Documentación
  informe_inicial_url TEXT,
  informes_situacion JSONB DEFAULT '[]',  -- [{numero, fecha, url}]
  informe_cierre_url TEXT,
  
  observaciones TEXT,
  created_by UUID REFERENCES configuracion.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- ALERTAS EPIDEMIOLÓGICAS AUTOMÁTICAS
-- -------------------------------------------------------

CREATE TABLE epidemiologia.alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_alerta VARCHAR(30),  
  -- 'umbral_casos','nuevo_brote','caso_grupo_a','contacto_sintomatico',
  -- 'perdida_seguimiento','retraso_notificacion','cluster_geografico','anomalia_estadistica'
  
  nivel VARCHAR(10),         -- 'info','advertencia','critica','emergencia'
  titulo TEXT NOT NULL,
  descripcion TEXT,
  
  -- Referencias
  caso_id UUID REFERENCES epidemiologia.casos(id),
  brote_id UUID REFERENCES epidemiologia.brotes(id),
  contacto_id UUID REFERENCES epidemiologia.contactos(id),
  hospital_id UUID REFERENCES configuracion.hospitales(id),
  enfermedad_id UUID REFERENCES epidemiologia.enfermedades_vigilancia(id),
  provincia TEXT,
  
  -- Estado
  estado VARCHAR(15) DEFAULT 'activa',  -- 'activa','leida','gestionada','falso_positivo'
  
  -- Notificaciones enviadas
  notificados JSONB DEFAULT '[]',  -- [{usuario_id, canal, timestamp}]
  sms_enviado BOOLEAN DEFAULT FALSE,
  email_enviado BOOLEAN DEFAULT FALSE,
  
  -- Acciones requeridas
  acciones_requeridas TEXT[],
  accion_tomada TEXT,
  tomada_por UUID REFERENCES configuracion.usuarios(id),
  fecha_accion TIMESTAMPTZ,
  
  generada_automaticamente BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- NOTIFICACIÓN OFICIAL AL MINISTERIO / DHIS2
-- -------------------------------------------------------

CREATE TABLE epidemiologia.notificaciones_oficiales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(20),           -- 'caso_individual','agregado_semanal','brote','alerta_rsai'
  periodo_semana INTEGER,     -- Semana epidemiológica ISO
  periodo_anio INTEGER,
  
  -- Datos a notificar
  datos_notificacion JSONB NOT NULL,  -- formato OPS/OMS por enfermedad
  
  -- Destino
  destino VARCHAR(20),        -- 'dhis2','ministerio_ge','ops','oms','ecdc'
  url_destino TEXT,
  
  -- Estado de envío
  estado VARCHAR(15) DEFAULT 'pendiente',   -- 'pendiente','enviado','confirmado','error','rechazado'
  intentos_envio INTEGER DEFAULT 0,
  fecha_envio TIMESTAMPTZ,
  fecha_confirmacion TIMESTAMPTZ,
  respuesta_servidor JSONB,
  error_detalle TEXT,
  
  -- DHIS2 específico
  dhis2_import_summaries JSONB,
  
  notificado_por UUID REFERENCES configuracion.usuarios(id),
  aprobado_por UUID REFERENCES configuracion.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- VIGILANCIA SINDRÓMICA (datos agregados por servicio/semana)
-- -------------------------------------------------------

CREATE TABLE epidemiologia.vigilancia_sindromica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES configuracion.hospitales(id),
  servicio_id UUID REFERENCES configuracion.servicios(id),
  semana_epidemiologica INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  fecha_inicio_semana DATE,
  fecha_fin_semana DATE,
  
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
  
  -- Muertes
  muertes_total INTEGER DEFAULT 0,
  muertes_menos_5_anios INTEGER DEFAULT 0,
  
  -- Total consultas (denominador)
  total_consultas_semana INTEGER DEFAULT 0,
  
  -- DHIS2
  dhis2_dataset_id VARCHAR(50),      -- UID del DataSet en DHIS2
  dhis2_org_unit_id VARCHAR(50),     -- UID del OrgUnit en DHIS2
  dhis2_sincronizado BOOLEAN DEFAULT FALSE,
  
  completado_por UUID REFERENCES configuracion.usuarios(id),
  aprobado_por UUID REFERENCES configuracion.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (hospital_id, servicio_id, semana_epidemiologica, anio)
);

-- -------------------------------------------------------
-- INMUNIZACIÓN / CAMPAÑAS DE VACUNACIÓN
-- -------------------------------------------------------

CREATE TABLE epidemiologia.campanas_vacunacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo VARCHAR(20),           -- 'preventiva','reactiva','seguimiento'
  vacuna TEXT NOT NULL,
  enfermedad_objetivo_id UUID REFERENCES epidemiologia.enfermedades_vigilancia(id),
  brote_id UUID REFERENCES epidemiologia.brotes(id),  -- si es reactiva
  
  -- Cobertura geográfica
  nivel_geografico VARCHAR(20),
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
  
  -- DHIS2
  dhis2_program_id VARCHAR(50),
  dhis2_sincronizado BOOLEAN DEFAULT FALSE,
  
  estado VARCHAR(20) DEFAULT 'planificada',   -- 'planificada','activa','completada','cancelada'
  created_by UUID REFERENCES configuracion.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- LABORATORIO EPIDEMIOLÓGICO
-- -------------------------------------------------------

CREATE TABLE epidemiologia.muestras_epidemiologicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID REFERENCES epidemiologia.casos(id),
  contacto_id UUID REFERENCES epidemiologia.contactos(id),
  
  tipo_muestra TEXT NOT NULL,   -- 'sangre','suero','orina','heces','hisopo_nasal','LCR','tejido'
  fecha_toma TIMESTAMPTZ NOT NULL,
  tomada_por UUID REFERENCES configuracion.usuarios(id),
  
  -- Cadena de frío / Manejo
  temperatura_almacenamiento DECIMAL(4,1),
  medio_transporte TEXT,
  fecha_envio_laboratorio TIMESTAMPTZ,
  laboratorio_destino TEXT,       -- 'LCGE','INSP','WHO_Reference_Lab','CDC_Afrika'
  
  -- Resultado
  prueba_realizada TEXT,
  resultado VARCHAR(20),          -- 'positivo','negativo','indeterminado','pendiente'
  resultado_detalle JSONB,        -- {serotipo, cepa, carga_viral, ct_value}
  fecha_resultado TIMESTAMPTZ,
  
  -- DHIS2
  dhis2_event_id VARCHAR(50),
  
  codigo_muestra VARCHAR(30) UNIQUE NOT NULL,
  estado VARCHAR(15) DEFAULT 'en_transito',  -- 'en_transito','recibida','procesando','completada','rechazada'
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- MAPEO GEOESPACIAL (para análisis de clusters)
-- -------------------------------------------------------

CREATE TABLE epidemiologia.zonas_riesgo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo VARCHAR(20),             -- 'foco_activo','zona_buffer','zona_alerta','zona_libre'
  enfermedad_id UUID REFERENCES epidemiologia.enfermedades_vigilancia(id),
  brote_id UUID REFERENCES epidemiologia.brotes(id),
  
  -- Geometría (PostGIS o GeoJSON)
  geojson JSONB NOT NULL,       -- GeoJSON Polygon/MultiPolygon
  area_km2 DECIMAL(10,3),
  poblacion_estimada INTEGER,
  
  -- Acciones en la zona
  en_cuarentena BOOLEAN DEFAULT FALSE,
  acceso_restringido BOOLEAN DEFAULT FALSE,
  fumigacion_activa BOOLEAN DEFAULT FALSE,
  
  fecha_inicio DATE,
  fecha_fin DATE,
  
  nivel_riesgo VARCHAR(10),     -- 'muy_alto','alto','medio','bajo'
  color_mapa VARCHAR(10),       -- '#ff0000','#ff6600','#ffcc00','#00cc00'
  
  created_by UUID REFERENCES configuracion.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- TRIGGERS AUTOMÁTICOS CRÍTICOS
-- -------------------------------------------------------

-- Trigger 1: Generar número de caso automático
CREATE OR REPLACE FUNCTION generar_numero_caso()
RETURNS TRIGGER AS $$
DECLARE
  pais_codigo TEXT := 'GE';
  enf_codigo TEXT;
  anio TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
  secuencia INTEGER;
BEGIN
  SELECT UPPER(LEFT(REPLACE(nombre, ' ', ''), 3))
  INTO enf_codigo
  FROM epidemiologia.enfermedades_vigilancia
  WHERE id = NEW.enfermedad_id;
  
  SELECT COALESCE(MAX(CAST(RIGHT(numero_caso, 6) AS INTEGER)), 0) + 1
  INTO secuencia
  FROM epidemiologia.casos
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
    AND enfermedad_id = NEW.enfermedad_id;
  
  NEW.numero_caso := pais_codigo || '-' || enf_codigo || '-' || anio || '-' || LPAD(secuencia::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_numero_caso
  BEFORE INSERT ON epidemiologia.casos
  FOR EACH ROW EXECUTE FUNCTION generar_numero_caso();

-- Trigger 2: Alerta automática para Grupo A
CREATE OR REPLACE FUNCTION alerta_enfermedad_grupo_a()
RETURNS TRIGGER AS $$
DECLARE
  enf_grupo TEXT;
  enf_nombre TEXT;
BEGIN
  SELECT grupo_vigilancia, nombre INTO enf_grupo, enf_nombre
  FROM epidemiologia.enfermedades_vigilancia
  WHERE id = NEW.enfermedad_id;
  
  IF enf_grupo = 'A' THEN
    INSERT INTO epidemiologia.alertas (
      tipo_alerta, nivel, titulo, descripcion,
      caso_id, hospital_id, enfermedad_id,
      acciones_requeridas
    ) VALUES (
      'caso_grupo_a', 'emergencia',
      '🚨 CASO GRUPO A DETECTADO: ' || enf_nombre,
      'Nuevo caso sospechoso de ' || enf_nombre || ' registrado. Notificación obligatoria en < 24h.',
      NEW.id, NEW.hospital_id, NEW.enfermedad_id,
      ARRAY['aislar_paciente','tomar_muestras','notificar_epidemiologia','activar_rastreo_contactos','notificar_oms']
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_alerta_grupo_a
  AFTER INSERT OR UPDATE OF clasificacion ON epidemiologia.casos
  FOR EACH ROW EXECUTE FUNCTION alerta_enfermedad_grupo_a();

-- Trigger 3: Actualizar estadísticas del brote en tiempo real
CREATE OR REPLACE FUNCTION actualizar_estadisticas_brote()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.brote_id IS NOT NULL THEN
    UPDATE epidemiologia.brotes SET
      total_casos_sospechosos = (SELECT COUNT(*) FROM epidemiologia.casos WHERE brote_id = NEW.brote_id AND clasificacion = 'sospechoso'),
      total_casos_probables    = (SELECT COUNT(*) FROM epidemiologia.casos WHERE brote_id = NEW.brote_id AND clasificacion = 'probable'),
      total_casos_confirmados  = (SELECT COUNT(*) FROM epidemiologia.casos WHERE brote_id = NEW.brote_id AND clasificacion = 'confirmado'),
      total_muertes            = (SELECT COUNT(*) FROM epidemiologia.casos WHERE brote_id = NEW.brote_id AND estado_vital = 'muerto'),
      tasa_letalidad           = CASE 
        WHEN (SELECT COUNT(*) FROM epidemiologia.casos WHERE brote_id = NEW.brote_id AND clasificacion IN ('confirmado','probable')) > 0
        THEN ROUND(
          (SELECT COUNT(*) FROM epidemiologia.casos WHERE brote_id = NEW.brote_id AND estado_vital = 'muerto')::DECIMAL /
          (SELECT COUNT(*) FROM epidemiologia.casos WHERE brote_id = NEW.brote_id AND clasificacion IN ('confirmado','probable')) * 100, 2)
        ELSE 0 END,
      updated_at = NOW()
    WHERE id = NEW.brote_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_estadisticas_brote
  AFTER INSERT OR UPDATE ON epidemiologia.casos
  FOR EACH ROW EXECUTE FUNCTION actualizar_estadisticas_brote();

-- Trigger 4: Alerta contacto sintomático
CREATE OR REPLACE FUNCTION alerta_contacto_sintomatico()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.fiebre = TRUE OR NEW.nivel_alerta IN ('amarillo','rojo') THEN
    INSERT INTO epidemiologia.alertas (
      tipo_alerta, nivel, titulo, descripcion,
      contacto_id,
      acciones_requeridas
    )
    SELECT 
      'contacto_sintomatico',
      CASE WHEN NEW.nivel_alerta = 'rojo' THEN 'critica' ELSE 'advertencia' END,
      '⚠️ Contacto con síntomas: ' || c.nombres || ' ' || c.apellidos,
      'Contacto del caso ' || ca.numero_caso || ' presenta síntomas. Requiere evaluación inmediata.',
      NEW.contacto_id,
      ARRAY['evaluar_contacto','tomar_muestra','notificar_medico','considerar_hospitalizacion']
    FROM epidemiologia.contactos c
    JOIN epidemiologia.casos ca ON ca.id = c.caso_fuente_id
    WHERE c.id = NEW.contacto_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_alerta_contacto_sintomatico
  AFTER INSERT OR UPDATE ON epidemiologia.seguimiento_contactos
  FOR EACH ROW EXECUTE FUNCTION alerta_contacto_sintomatico();

-- -------------------------------------------------------
-- FUNCIÓN: Detectar umbral de brote automáticamente
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION detectar_umbral_brote(
  p_enfermedad_id UUID,
  p_hospital_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  umbral_casos INTEGER;
  umbral_dias INTEGER;
  casos_recientes INTEGER;
  enf_nombre TEXT;
BEGIN
  SELECT umbral_alerta_casos, umbral_alerta_dias, nombre
  INTO umbral_casos, umbral_dias, enf_nombre
  FROM epidemiologia.enfermedades_vigilancia
  WHERE id = p_enfermedad_id;
  
  SELECT COUNT(*) INTO casos_recientes
  FROM epidemiologia.casos
  WHERE enfermedad_id = p_enfermedad_id
    AND hospital_id = p_hospital_id
    AND clasificacion IN ('sospechoso','probable','confirmado')
    AND fecha_notificacion >= NOW() - (umbral_dias || ' days')::INTERVAL;
  
  IF casos_recientes >= umbral_casos THEN
    INSERT INTO epidemiologia.alertas (
      tipo_alerta, nivel, titulo, descripcion,
      hospital_id, enfermedad_id,
      acciones_requeridas
    ) VALUES (
      'umbral_casos', 'critica',
      '🔴 POSIBLE BROTE: ' || enf_nombre || ' — ' || casos_recientes || ' casos en ' || umbral_dias || ' días',
      'Se ha superado el umbral de alerta. Activar protocolo de investigación de brote.',
      p_hospital_id, p_enfermedad_id,
      ARRAY['activar_equipo_respuesta','investigar_fuente','notificar_ministerio','reforzar_vigilancia']
    )
    ON CONFLICT DO NOTHING;
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------
-- VISTAS MATERIALIZADAS PARA ANÁLISIS
-- -------------------------------------------------------

-- Vista: Curva epidémica semanal por enfermedad
CREATE MATERIALIZED VIEW epidemiologia.curva_epidemica_semanal AS
SELECT
  EXTRACT(YEAR FROM fecha_notificacion) AS anio,
  EXTRACT(WEEK FROM fecha_notificacion) AS semana_epi,
  enfermedad_id,
  e.nombre AS enfermedad,
  e.grupo_vigilancia,
  clasificacion,
  COUNT(*) AS numero_casos,
  SUM(CASE WHEN estado_vital = 'muerto' THEN 1 ELSE 0 END) AS numero_muertes,
  AVG(CASE WHEN fecha_inicio_sintomas IS NOT NULL 
    THEN EXTRACT(DAY FROM fecha_notificacion - fecha_inicio_sintomas) 
    ELSE NULL END) AS retraso_notificacion_promedio_dias
FROM epidemiologia.casos c
JOIN epidemiologia.enfermedades_vigilancia e ON e.id = c.enfermedad_id
GROUP BY 1, 2, 3, 4, 5, 6
WITH DATA;

CREATE UNIQUE INDEX ON epidemiologia.curva_epidemica_semanal (anio, semana_epi, enfermedad_id, clasificacion);

-- Vista: Estado de seguimiento de contactos por brote
CREATE MATERIALIZED VIEW epidemiologia.resumen_contactos_brote AS
SELECT
  b.id AS brote_id,
  b.codigo_brote,
  b.nombre AS brote_nombre,
  COUNT(DISTINCT c.id) AS total_contactos,
  COUNT(DISTINCT CASE WHEN c.estado_seguimiento = 'en_seguimiento' THEN c.id END) AS en_seguimiento,
  COUNT(DISTINCT CASE WHEN c.estado_seguimiento = 'completado' THEN c.id END) AS completados,
  COUNT(DISTINCT CASE WHEN c.estado_seguimiento = 'perdido' THEN c.id END) AS perdidos,
  COUNT(DISTINCT CASE WHEN c.se_convirtio_en_caso = TRUE THEN c.id END) AS convertidos_en_casos,
  ROUND(
    COUNT(DISTINCT CASE WHEN c.se_convirtio_en_caso = TRUE THEN c.id END)::DECIMAL /
    NULLIF(COUNT(DISTINCT c.id), 0) * 100, 2
  ) AS tasa_ataque_secundaria
FROM epidemiologia.brotes b
JOIN epidemiologia.casos ca ON ca.brote_id = b.id
JOIN epidemiologia.contactos c ON c.caso_fuente_id = ca.id
GROUP BY b.id, b.codigo_brote, b.nombre
WITH DATA;
```

---

## INTEGRACIÓN DHIS2 — ARQUITECTURA TÉCNICA

### Arquitectura de Sincronización Bidireccional

```typescript
// src/modules/epidemiologia/services/dhis2/dhis2-sync.service.ts

/**
 * MODELO DE INTEGRACIÓN DHIS2 ↔ HOSIX
 * 
 * HOSIX → DHIS2:  Notificación casos, contactos, datos semanales
 * DHIS2 → HOSIX:  Alertas nacionales, datos referencia, catálogos
 * 
 * Protocolo: REST API DHIS2 v40 + Supabase Edge Functions
 * Autenticación: OAuth2 / Basic Auth sobre HTTPS
 * Frecuencia: 
 *   - Casos Grupo A:    Inmediata (webhook → Edge Function → DHIS2)
 *   - Casos Grupo B/C:  Cada hora (cron job Edge Function)
 *   - Datos agregados:  Semanal (lunes 00:00 WAT)
 *   - Catálogos:        Diario (pull desde DHIS2)
 */

interface DHIS2Config {
  baseUrl: string;                // https://dhis2.minsalud.gq/
  apiVersion: string;             // '40'
  credentials: {
    username: string;
    password: string;             // almacenado en Supabase Vault
  };
  orgUnits: {
    national: string;             // UID OrgUnit Nacional GE
    hospitals: Record<string, string>; // hospital_codigo → DHIS2 UID
  };
  programs: {
    caseSurveillance: string;     // UID Tracker Program Vigilancia de Casos
    contactTracing: string;       // UID Tracker Program Rastreo Contactos
    weeklyReport: string;         // UID DataSet Informe Semanal
    vaccination: string;          // UID Program Vacunación
  };
}

// Estructura de envío de un caso a DHIS2 Tracker
interface DHIS2TrackedEntityCase {
  trackedEntityType: string;      // UID del Tipo de Entidad Seguida 'Caso'
  orgUnit: string;                // UID del hospital/establecimiento
  attributes: Array<{
    attribute: string;            // UID del atributo DHIS2
    value: string;
  }>;
  enrollments: Array<{
    program: string;              // UID del Programa de Vigilancia
    orgUnit: string;
    enrollmentDate: string;       // fecha_notificacion
    incidentDate: string;         // fecha_inicio_sintomas
    events: Array<{
      programStage: string;       // UID de la etapa (Notificación, Lab, Seguimiento)
      orgUnit: string;
      eventDate: string;
      status: 'ACTIVE' | 'COMPLETED';
      dataValues: Array<{
        dataElement: string;      // UID del elemento de dato
        value: string;
      }>;
    }>;
  }>;
}
```

### Edge Functions Supabase para Sincronización

```typescript
// supabase/functions/sync-dhis2-case/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { caso_id, modo } = await req.json(); // modo: 'create' | 'update'
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  // 1. Obtener datos completos del caso
  const { data: caso } = await supabase
    .from('epidemiologia.casos')
    .select(`
      *,
      paciente:pacientes!inner(*),
      enfermedad:enfermedades_vigilancia!inner(*),
      hospital:configuracion.hospitales!inner(*)
    `)
    .eq('id', caso_id)
    .single();
  
  // 2. Mapear a estructura DHIS2
  const dhis2Payload = mapCasoToDHIS2TrackedEntity(caso);
  
  // 3. Enviar a DHIS2
  const dhis2Config = await getDHIS2Config(supabase);
  
  const endpoint = modo === 'create'
    ? `${dhis2Config.baseUrl}/api/${dhis2Config.apiVersion}/trackedEntityInstances`
    : `${dhis2Config.baseUrl}/api/${dhis2Config.apiVersion}/trackedEntityInstances/${caso.dhis2_tracked_entity_id}`;
  
  const response = await fetch(endpoint, {
    method: modo === 'create' ? 'POST' : 'PUT',
    headers: {
      'Authorization': `Basic ${btoa(`${dhis2Config.credentials.username}:${dhis2Config.credentials.password}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dhis2Payload),
  });
  
  const dhis2Response = await response.json();
  
  // 4. Actualizar estado de sincronización en HOSIX
  const syncSuccess = dhis2Response.httpStatus === 'OK';
  
  await supabase.from('epidemiologia.casos').update({
    dhis2_tracked_entity_id: dhis2Response.response?.importSummaries?.[0]?.reference,
    dhis2_sincronizado: syncSuccess,
    dhis2_ultima_sincronizacion: new Date().toISOString(),
    dhis2_error_sync: syncSuccess ? null : JSON.stringify(dhis2Response),
  }).eq('id', caso_id);
  
  // 5. Registrar en notificaciones oficiales
  await supabase.from('epidemiologia.notificaciones_oficiales').insert({
    tipo: 'caso_individual',
    destino: 'dhis2',
    datos_notificacion: dhis2Payload,
    estado: syncSuccess ? 'confirmado' : 'error',
    dhis2_import_summaries: dhis2Response,
    fecha_envio: new Date().toISOString(),
  });
  
  return new Response(JSON.stringify({ success: syncSuccess, dhis2Response }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Mapper HOSIX → DHIS2 (configurar UIDs según instancia DHIS2 GE)
function mapCasoToDHIS2TrackedEntity(caso: any): DHIS2TrackedEntityCase {
  return {
    trackedEntityType: 'DHIS2_TEI_CASO_UID',
    orgUnit: HOSPITAL_TO_DHIS2_OU[caso.hospital.codigo],
    attributes: [
      { attribute: 'DHIS2_ATTR_NHC',           value: caso.paciente.nhc },
      { attribute: 'DHIS2_ATTR_NOMBRES',        value: `${caso.paciente.nombres} ${caso.paciente.apellidos}` },
      { attribute: 'DHIS2_ATTR_FECHA_NAC',      value: caso.paciente.fecha_nacimiento },
      { attribute: 'DHIS2_ATTR_SEXO',           value: caso.paciente.genero },
      { attribute: 'DHIS2_ATTR_EDAD',           value: String(caso.edad_anios) },
      { attribute: 'DHIS2_ATTR_PROVINCIA',      value: caso.provincia },
      { attribute: 'DHIS2_ATTR_DISTRITO',       value: caso.distrito },
    ],
    enrollments: [{
      program: DHIS2_PROGRAM_VIGILANCIA,
      orgUnit: HOSPITAL_TO_DHIS2_OU[caso.hospital.codigo],
      enrollmentDate: caso.fecha_notificacion,
      incidentDate: caso.fecha_inicio_sintomas || caso.fecha_notificacion,
      events: [
        {
          programStage: 'DHIS2_STAGE_NOTIFICACION',
          orgUnit: HOSPITAL_TO_DHIS2_OU[caso.hospital.codigo],
          eventDate: caso.fecha_notificacion,
          status: 'COMPLETED',
          dataValues: [
            { dataElement: 'DHIS2_DE_ENFERMEDAD',       value: caso.enfermedad.codigo_dhis2 },
            { dataElement: 'DHIS2_DE_CLASIFICACION',    value: caso.clasificacion },
            { dataElement: 'DHIS2_DE_CIE10',            value: caso.codigo_cie10 },
            { dataElement: 'DHIS2_DE_FECHA_SINTOMAS',   value: caso.fecha_inicio_sintomas },
            { dataElement: 'DHIS2_DE_ORIGEN',           value: caso.origen_infeccion },
            { dataElement: 'DHIS2_DE_ESTADO_VITAL',     value: caso.estado_vital },
          ]
        }
      ]
    }]
  };
}
```

---

## ESTRUCTURA FRONTEND — MÓDULO EPIDEMIOLOGÍA

```
src/modules/epidemiologia/
├── pages/
│   ├── DashboardEpidemiologico.tsx       # Panel principal de vigilancia
│   ├── GestionCasos.tsx                  # Lista y búsqueda de casos
│   ├── NotificarCaso.tsx                 # Formulario de notificación por enfermedad
│   ├── InvestigacionCaso.tsx             # Ficha epidemiológica completa
│   ├── RastreoContactos.tsx              # Gestión de contactos de un caso
│   ├── SeguimientoContactos.tsx          # Check-in diario de contactos
│   ├── GestionBrotes.tsx                 # Lista y gestión de brotes activos
│   ├── InvestigacionBrote.tsx            # Dashboard de un brote específico
│   ├── MapaEpidemiologico.tsx            # Mapa geográfico de casos/brotes
│   ├── CurvaEpidemica.tsx                # Curvas epidémicas interactivas
│   ├── VigilanciaSindromica.tsx          # Entrada semanal de datos sindrómicos
│   ├── NotificacionMinisterio.tsx        # Reportes oficiales y estado DHIS2
│   ├── AlertasEpidemiologicas.tsx        # Centro de alertas activas
│   ├── CampanasVacunacion.tsx            # Gestión de campañas
│   └── ConfiguracionEpidemiologia.tsx    # Enfermedades, umbrales, parámetros
│
├── components/
│   ├── casos/
│   │   ├── CasoCard.tsx                  # Tarjeta resumen de caso
│   │   ├── CasoBadge.tsx                 # Badge de clasificación con color
│   │   ├── FichaNotificacion.tsx         # Formulario dinámico por enfermedad
│   │   ├── FichaInvestigacion.tsx        # Investigación epidemiológica completa
│   │   ├── LineaTiempoCaso.tsx           # Timeline del caso
│   │   └── ClasificacionCaso.tsx        # Selector con criterios OMS
│   │
│   ├── contactos/
│   │   ├── GrafoContactos.tsx            # ★ Visualización grafo D3/Cytoscape
│   │   ├── ListaContactos.tsx            # Tabla de contactos con estado
│   │   ├── FormContacto.tsx              # Registro de nuevo contacto
│   │   ├── CheckinDiario.tsx             # Formulario de seguimiento diario
│   │   ├── KanbanContactos.tsx           # Vista Kanban por estado de seguimiento
│   │   ├── MapaContactos.tsx             # Mapa de ubicación de contactos
│   │   └── EstadisticasContactos.tsx     # Métricas de rastreo
│   │
│   ├── brotes/
│   │   ├── BroteDashboard.tsx            # Dashboard completo de un brote
│   │   ├── EpiCurve.tsx                  # ★ Curva epidémica animada
│   │   ├── MapaBrote.tsx                 # ★ Mapa con zonas de riesgo
│   │   ├── ArbolTransmision.tsx          # ★ Árbol de transmisión D3
│   │   ├── InformesSituacion.tsx         # Informes de situación del brote
│   │   └── IndicadoresControl.tsx        # KPIs de control del brote
│   │
│   ├── mapa/
│   │   ├── MapaVigilancia.tsx            # ★ Mapa nacional con Leaflet/Mapbox
│   │   ├── HeatmapIncidencia.tsx         # Mapa de calor de casos
│   │   ├── ZonasRiesgo.tsx               # Dibujado y edición de zonas
│   │   └── CapasGeograficas.tsx          # Control de capas del mapa
│   │
│   ├── alertas/
│   │   ├── AlertaPanel.tsx               # Panel de alertas activas
│   │   ├── AlertaBanner.tsx              # Banner de alerta crítica (sticky)
│   │   └── AlertaTimeline.tsx            # Historial de alertas
│   │
│   └── dhis2/
│       ├── DHIS2SyncStatus.tsx           # Estado de sincronización DHIS2
│       ├── DHIS2SyncLog.tsx              # Log de envíos a DHIS2
│       └── DHIS2ConfigPanel.tsx          # Configuración de la integración
│
├── hooks/
│   ├── useCasos.ts                       # CRUD casos + React Query
│   ├── useContactos.ts                   # Contactos de un caso
│   ├── useSeguimiento.ts                 # Seguimiento diario
│   ├── useBrotes.ts                      # Gestión de brotes
│   ├── useAlertas.ts                     # Alertas en tiempo real (Realtime)
│   ├── useGrafoContactos.ts              # Construcción del grafo de red
│   ├── useDHIS2Sync.ts                   # Disparar sincronizaciones manuales
│   ├── useMapaEpidemiologico.ts          # Datos geoespaciales
│   └── useVigilanciaSindromica.ts        # Datos sindrómicos semanales
│
├── services/
│   ├── dhis2/
│   │   ├── dhis2-client.ts              # Cliente HTTP DHIS2
│   │   ├── dhis2-mapper.ts             # Mapeo HOSIX ↔ DHIS2
│   │   ├── dhis2-tracker.ts            # Tracker API (TEI, enrollments)
│   │   ├── dhis2-events.ts             # Events API
│   │   ├── dhis2-analytics.ts          # Analytics API (datos nacionales)
│   │   └── dhis2-metadata.ts           # Descarga catálogos/metadatos
│   │
│   ├── geoespacial.service.ts           # Análisis espacial Turf.js
│   ├── estadisticas-epi.service.ts      # R0, tasa ataque, IC 95%
│   └── notificacion-oficial.service.ts  # Envío reportes Ministerio
│
└── types/
    ├── caso.types.ts
    ├── contacto.types.ts
    ├── brote.types.ts
    ├── dhis2.types.ts
    └── epidemiologia.types.ts
```

---

## COMPONENTES UI ESTRELLA — ESPECIFICACIONES DETALLADAS

### ★ 1. GRAFO DE RED DE CONTACTOS (GrafoContactos.tsx)

```typescript
/**
 * Visualización interactiva de la red de transmisión de un brote.
 * 
 * NODOS:
 *   - Caso índice: círculo grande rojo con borde grueso
 *   - Casos secundarios: círculo medio naranja
 *   - Contactos en seguimiento: círculo pequeño amarillo
 *   - Contactos completados sin síntomas: círculo pequeño verde
 *   - Contactos perdidos: círculo pequeño gris con X
 *   - Contactos con síntomas (posible caso): parpadeo rojo
 * 
 * ARISTAS (conexiones):
 *   - Grosor = duración/intensidad del contacto
 *   - Color = tipo de contacto (familiar/laboral/comunitario)
 *   - Etiqueta = tipo de relación
 *   - Animación de flujo = dirección de transmisión confirmada
 * 
 * INTERACCIONES:
 *   - Click nodo: panel lateral con detalles del caso/contacto
 *   - Doble click: zoom al subgrafo
 *   - Hover: tooltip con estado de seguimiento
 *   - Filtros: por generación (1°, 2°, 3°), por estado, por tipo contacto
 *   - Botón "Agregar contacto" desde el grafo (drag desde nodo)
 *   - Exportar imagen PNG / datos CSV
 * 
 * CAPAS DE ANÁLISIS (toggle):
 *   - Cluster detection: resaltar grupos de transmisión
 *   - Nodos puente: identificar "super-spreaders"
 *   - Generaciones: colorear por generación de transmisión
 * 
 * LIBRERÍAS: react-force-graph-2d + D3-force para layout
 */

interface GrafoContactosProps {
  casoId: string;
  broteId?: string;
  profundidadMaxima?: number;     // generaciones a mostrar (default: 4)
  modoVisualizacion?: 'arbol' | 'fuerza' | 'radial' | 'jerarquico';
  mostrarCompletados?: boolean;
  onNodoSeleccionado?: (nodo: NodoGrafo) => void;
}

interface NodoGrafo {
  id: string;
  tipo: 'caso' | 'contacto';
  nombre: string;
  estado: string;
  generacion: number;
  sintomasActivos: boolean;
  lat?: number;
  lng?: number;
  // Métricas de centralidad (análisis de red)
  grado: number;               // número de conexiones
  intermediacion: number;      // betweenness centrality
  esSuperSpreader: boolean;    // umbral configurable
}
```

### ★ 2. CURVA EPIDÉMICA INTERACTIVA (EpiCurve.tsx)

```typescript
/**
 * Histograma animado de casos por fecha de inicio de síntomas.
 * Estándar epidemiológico OMS/ECDC.
 * 
 * CARACTERÍSTICAS:
 * - Agrupación flexible: diaria / semanal / semana epidemiológica
 * - Barras apiladas por clasificación (confirmado/probable/sospechoso)
 * - Línea de tendencia (media móvil 7 días)
 * - Línea de umbral de brote (configurable)
 * - Marcadores de intervenciones (cuarentena, vacunación, etc.)
 * - Superposición de curva esperada (modelo SEIR/SIR)
 * - Brushing: seleccionar rango temporal para filtrar la tabla de casos
 * - Animación al cargar (barras crecen desde la base)
 * - Doble eje Y: casos (izquierda) + muertes (derecha)
 * - Exportar imagen SVG/PNG
 */

interface EpiCurveProps {
  broteId?: string;
  enfermedadId?: string;
  fechaInicio: Date;
  fechaFin: Date;
  agrupacion: 'dia' | 'semana' | 'semana_epi';
  mostrarMuertes?: boolean;
  mostrarTendencia?: boolean;
  onRangoSeleccionado?: (inicio: Date, fin: Date) => void;
}
```

### ★ 3. MAPA EPIDEMIOLÓGICO NACIONAL (MapaVigilancia.tsx)

```typescript
/**
 * Mapa interactivo de Guinea Ecuatorial con capas epidemiológicas.
 * Basado en Leaflet.js + react-leaflet con tiles OpenStreetMap.
 * 
 * CAPAS DISPONIBLES (toggle):
 *   🔴 Casos activos (puntos con radio proporcional al número)
 *   🌡️ Heatmap de incidencia por 100.000 hab.
 *   🗺️ Zonas de riesgo (polígonos coloreados por nivel)
 *   👥 Clusters de contactos (agrupación espacial)
 *   🏥 Establecimientos de salud (iconos de hospital)
 *   📡 Áreas de cobertura sanitaria
 *   🦟 Zonas de presencia vectorial (malaria/dengue)
 * 
 * CONTROLES:
 *   - Selector de enfermedad y rango temporal
 *   - Nivel geográfico: Nacional / Provincia / Distrito / Localidad
 *   - Animación temporal: reproducir evolución del brote en el tiempo
 *   - Crear zona de riesgo: dibujar polígono en el mapa
 *   - Click en punto: ficha rápida del caso/brote
 *   - Exportar mapa como imagen PNG
 * 
 * DATOS GEOESPACIALES GE:
 *   Incluir GeoJSON con límites de:
 *   - 7 Provincias (Bioko Norte, Bioko Sur, Centro Sur, Kie-Ntem, Litoral, Wele-Nzas, Djibloho)
 *   - Distritos
 *   - Municipios
 *   Fuente: OpenStreetMap + datos oficiales INE-GE
 */

interface MapaVigilanciaProps {
  defaultCenter: [number, number];  // [3.75, 8.78] — centro GE
  defaultZoom: number;              // 8
  capasActivas: CapaMapa[];
  broteId?: string;
  enfermedadId?: string;
  fechaFiltro?: DateRange;
  onZonaCreada?: (geoJSON: GeoJSON) => void;
}
```

### ★ 4. KANBAN DE SEGUIMIENTO DE CONTACTOS

```typescript
/**
 * Vista Kanban para gestionar el pipeline de seguimiento.
 * 
 * COLUMNAS:
 *   📋 IDENTIFICADO    → Contacto registrado, pendiente asignación
 *   📞 PRIMER CONTACTO → Intentando contactar por primera vez
 *   🔍 EN SEGUIMIENTO  → Seguimiento activo (con contador de días)
 *   ⚠️ CON SÍNTOMAS    → Contacto que reportó síntomas (urgente)
 *   🏥 HOSPITALIZADO   → Derivado para evaluación médica
 *   ✅ COMPLETADO      → Período de seguimiento finalizado sin síntomas
 *   ❌ PERDIDO         → Contacto no localizable
 * 
 * TARJETA DE CONTACTO muestra:
 *   - Nombre, foto (si disponible), teléfono
 *   - Caso fuente del que proviene
 *   - Día actual de seguimiento (ej: "Día 7 de 21")
 *   - Barra de progreso del período de cuarentena
 *   - Último síntoma reportado
 *   - Próximo check-in programado
 *   - Botón rápido: llamar / SMS / marcar check-in
 * 
 * DRAG & DROP entre columnas para cambio de estado
 * Filtros: por agente de seguimiento, por fecha, por generación
 * Contador de alertas por columna
 */
```

### ★ 5. FORMULARIO DINÁMICO DE FICHA EPIDEMIOLÓGICA

```typescript
/**
 * El formulario de notificación cambia completamente según la enfermedad.
 * Basado en JSON Schema (react-jsonschema-form).
 * 
 * Cada enfermedad tiene su ficha_notificacion_schema en la BD con:
 *   - Campos básicos comunes (siempre presentes)
 *   - Secciones específicas por enfermedad:
 *     Ébola: exposición a cadáveres, manejo de fluidos, contacto con animales
 *     Malaria: tipo de plasmodium, tratamiento previo, zona de exposición
 *     Tuberculosis: BCG, contacto previo TB, prueba tuberculina, baciloscopia
 *     COVID: variante, vacunación previa, comorbilidades, hospitalización UCI
 *     Cólera: fuente de agua, alimentos, saneamiento básico
 *   - Validaciones y condicionales (mostrar campo X solo si Y = true)
 *   - Autocompletar desde datos del paciente/HIS
 *   - Cálculo automático de período de incubación posible
 *   - Indicador de completitud de la ficha (% completado)
 *   - Modo borrador / guardar y continuar
 */

// Ejemplo de schema para Malaria:
const malariaSchema = {
  type: 'object',
  title: 'Ficha de Notificación — Malaria',
  required: ['tipo_plasmodium', 'zona_adquisicion'],
  properties: {
    tipo_plasmodium: {
      type: 'string',
      title: 'Tipo de Plasmodium',
      enum: ['P. falciparum', 'P. vivax', 'P. malariae', 'P. ovale', 'mixta', 'no_identificado'],
    },
    zona_adquisicion: {
      type: 'string', title: 'Zona probable de adquisición',
      description: 'Localidad/zona donde estuvo el paciente en los últimos 30 días'
    },
    viaje_reciente: { type: 'boolean', title: '¿Viaje reciente a zona endémica?' },
    pais_viaje: {
      type: 'string', title: 'País/zona de viaje',
      // Solo mostrar si viaje_reciente = true
    },
    tratamiento_previo: { type: 'boolean', title: '¿Tratamiento antimalárico previo?' },
    uso_mosquitero: {
      type: 'string', title: 'Uso de mosquitero',
      enum: ['siempre', 'a_veces', 'nunca', 'no_disponible']
    },
    quimioprofilaxis: { type: 'boolean', title: '¿Recibía quimioprofilaxis?' },
    parasitemia: { type: 'number', title: 'Parasitemia (parásitos/μL)' },
    prueba_diagnostica: {
      type: 'string', title: 'Tipo de prueba diagnóstica',
      enum: ['gota_gruesa','TDR','PCR','microscopía']
    },
    complicaciones: {
      type: 'array', title: 'Complicaciones',
      items: { type: 'string', enum: ['malaria_cerebral','anemia_grave','hipoglucemia','insuficiencia_renal','edema_pulmonar'] }
    },
  }
};
```

---

## DASHBOARD EPIDEMIOLÓGICO — KPIs EN TIEMPO REAL

```typescript
// Panels del Dashboard Principal (DashboardEpidemiologico.tsx)

interface DashboardEpidemiologicoPanels {
  // ---- FILA 1: SITUACIÓN ACTUAL ----
  alertasActivas: {
    tipo: 'KPICard';
    valor: number;
    tendencia: 'subiendo' | 'estable' | 'bajando';
    criticas: number;
    color: 'rojo' | 'naranja' | 'verde';
    accion: 'ir a alertas';
  };
  
  brotesActivos: {
    tipo: 'KPICard';
    valor: number;
    enfermedades: string[];  // lista de enfermedades en brote
    provinciasAfectadas: string[];
  };
  
  casosSemana: {
    tipo: 'KPICard';
    valor: number;
    variacionRespectoPeriodoAnterior: number;  // porcentaje
    desglosePorGrupo: { A: number; B: number; C: number; D: number };
  };
  
  contactosEnSeguimiento: {
    tipo: 'KPICard';
    valor: number;
    completados: number;
    perdidos: number;
    conSintomas: number;    // ← ALERTA si > 0
  };
  
  // ---- FILA 2: VISUALIZACIONES PRINCIPALES ----
  mapaNacional: MapaVigilanciaProps;    // mapa interactivo GE
  curvaEpidemica: EpiCurveProps;        // últimas 12 semanas
  
  // ---- FILA 3: TABLAS Y LISTAS ----
  tablaCasosRecientes: {
    columnas: ['numero_caso','enfermedad','clasificacion','provincia','fecha','estado'];
    filtros: boolean;
    exportable: boolean;
  };
  
  listaContactosCriticos: {
    descripcion: 'contactos con síntomas o cercanos al fin de cuarentena';
    mostrar: number;  // top 10
  };
  
  // ---- FILA 4: SINCRONIZACIÓN DHIS2 ----
  estadoDHIS2: {
    ultimaSincronizacion: Date;
    pendientesEnvio: number;
    erroresSincronizacion: number;
    botonForzarSincronizacion: boolean;
  };
}
```

---

## SEMANA EPIDEMIOLÓGICA Y NOTIFICACIÓN SEMANAL

```typescript
// Cálculo automático de semanas epidemiológicas OMS (ISO 8601)
// La semana 1 comienza el lunes de la semana que contiene el primer jueves de enero

function getSemanaEpidemiologica(fecha: Date): { semana: number; anio: number } {
  // Implementar según estándar ISO 8601
  // Usando date-fns: getISOWeek(fecha), getISOWeekYear(fecha)
  return {
    semana: getISOWeek(fecha),
    anio: getISOWeekYear(fecha)
  };
}

// Componente VigilanciaSindromica.tsx:
// Formulario de entrada semanal que el responsable epidemiológico llena
// cada lunes para el período semana anterior.
// Campos: por cada síndrome vigilado → número de casos en esa semana
// Envío automático a DHIS2 DataSets al aprobar

// Recordatorio automático: si lunes > 10:00 WAT y no hay datos ingresados,
// notificar por Supabase Realtime al responsable del establecimiento
```

---

## ROLES Y PERMISOS EPIDEMIOLOGÍA

```typescript
const ROLES_EPIDEMIOLOGIA = {
  EPIDEMIOLOGO_NACIONAL: {
    descripcion: 'Ministerio de Sanidad GE / OPS',
    permisos: {
      casos: ['leer', 'crear', 'editar', 'eliminar', 'aprobar'],
      brotes: ['leer', 'crear', 'editar', 'gestionar', 'cerrar'],
      alertas: ['leer', 'gestionar', 'configurar'],
      notificacion_ministerio: ['crear', 'aprobar', 'enviar'],
      dhis2: ['sincronizar', 'configurar'],
      mapa: ['leer', 'crear_zonas', 'editar_zonas'],
      reportes: ['todos'],
      configuracion: ['enfermedades', 'umbrales', 'parametros'],
    }
  },
  
  EPIDEMIOLOGO_HOSPITAL: {
    descripcion: 'Epidemiólogo/a del hospital',
    permisos: {
      casos: ['leer', 'crear', 'editar'],
      contactos: ['leer', 'crear', 'editar', 'asignar'],
      seguimiento: ['leer', 'registrar'],
      brotes: ['leer', 'crear'],
      alertas: ['leer', 'gestionar_propias'],
      vigilancia_sindromica: ['crear', 'editar'],
      notificacion: ['crear'],         // pero no enviar al Ministerio
      reportes: ['hospital_propio'],
    }
  },
  
  MEDICO_TRATANTE: {
    descripcion: 'Médico que notifica caso desde HIS',
    permisos: {
      casos: ['leer', 'crear'],        // desde episodio del HIS
      contactos: ['leer', 'crear'],    // registrar contactos directos del caso
      alertas: ['leer_propias'],
    }
  },
  
  AGENTE_CAMPO: {
    descripcion: 'Rastreador de contactos en campo',
    permisos: {
      contactos: ['leer_asignados', 'editar_asignados'],
      seguimiento: ['registrar'],      // check-in diario
      muestras: ['registrar'],
    }
  },
  
  LABORATORIO: {
    descripcion: 'Personal de laboratorio de referencia',
    permisos: {
      muestras: ['leer', 'actualizar_resultado'],
      casos: ['actualizar_laboratorio'],
    }
  },
};
```

---

## CONFIGURACIÓN DHIS2 GUINEA ECUATORIAL

```typescript
// Mapeo de UIDs específicos para la instancia DHIS2 de Guinea Ecuatorial
// (estos UIDs deben obtenerse del administrador DHIS2 del Ministerio de Sanidad GE)

const GE_DHIS2_CONFIG = {
  baseUrl: 'https://dhis2.minsalud.gq',  // URL hipotética — confirmar con Ministerio
  apiVersion: '40',
  
  // Jerarquía Organizacional
  orgUnits: {
    national: 'GE_NATIONAL_UID',
    provincias: {
      'Bioko Norte':   'GE_BIOKO_NORTE_UID',
      'Bioko Sur':     'GE_BIOKO_SUR_UID',
      'Centro Sur':    'GE_CENTRO_SUR_UID',
      'Kie-Ntem':      'GE_KIE_NTEM_UID',
      'Litoral':       'GE_LITORAL_UID',
      'Wele-Nzas':     'GE_WELE_NZAS_UID',
      'Djibloho':      'GE_DJIBLOHO_UID',
    },
    hospitales: {
      'HGM': 'GE_HGM_UID',    // Hospital General Malabo
      'HRB': 'GE_HRB_UID',    // Hospital Regional Bata
      // ... completar con todos los establecimientos registrados en DHIS2
    }
  },
  
  // Programas Tracker para vigilancia de casos individuales
  trackerPrograms: {
    vigilanciaCasos:   'GE_VIGIL_PROG_UID',
    rastreoContactos:  'GE_CONTACT_PROG_UID',
    inmunizacion:      'GE_INMUN_PROG_UID',
  },
  
  // DataSets para datos agregados semanales/mensuales
  dataSets: {
    vigilanciaSindromica: 'GE_SINDROM_DS_UID',
    malariaSemanal:       'GE_MAL_WEEK_DS_UID',
    rutinaMensual:        'GE_RUTINA_DS_UID',
  },
  
  // Tipos de entidades seguidas (Tracked Entity Types)
  trackedEntityTypes: {
    caso:     'GE_CASO_TET_UID',
    contacto: 'GE_CONTACT_TET_UID',
    paciente: 'GE_PATIENT_TET_UID',
  },
};
```

---

## FLUJOS DE TRABAJO OPERATIVOS

### FLUJO A: Detección → Notificación → DHIS2 (< 2 horas para Grupo A)

```
1. Médico en HIS detecta caso sospechoso de Ébola
2. Sistema HOSIX activa ALERTA INMEDIATA (banner rojo en toda la red)
3. Médico abre ficha de notificación desde el episodio del paciente
   → Datos del paciente pre-rellenados automáticamente desde HC
4. Médico completa campos específicos del Ébola (exposición, síntomas, etc.)
5. Médico registra contactos directos conocidos
6. Epidemiólogo del hospital revisa y aprueba la notificación (< 30 min)
7. Sistema envía automáticamente a DHIS2 Tracker via Edge Function
8. SMS automático al Epidemiólogo Nacional y al Director del Hospital
9. Email al Ministerio de Sanidad GE + OPS Guinea Ecuatorial
10. Caso aparece en mapa nacional en tiempo real
11. Sistema genera lista inicial de acciones requeridas
```

### FLUJO B: Rastreo de Contactos (primeras 48h)

```
1. Caso confirmado → Sistema crea automáticamente investigación de contactos
2. Agente de campo recibe notificación push con lista de contactos a investigar
3. Para cada contacto:
   a. Búsqueda en HIS (¿ya es paciente?)
   b. Si no: registro nuevo (mínimo: nombre, teléfono, dirección)
   c. Clasificación: tipo contacto, grado de exposición, fechas
   d. Asignación automática del período de cuarentena según enfermedad
4. Grafo de red actualizado en tiempo real
5. Agentes de campo asignados geográficamente (contactos más cercanos = mismo agente)
6. Agenda de check-ins generada automáticamente (recordatorios por SMS)
```

### FLUJO C: Seguimiento Diario de Contactos

```
1. Cada mañana a las 7:00 WAT: SMS automático a todos los contactos activos
   "Hola [Nombre], soy el sistema de vigilancia sanitaria de Guinea Ecuatorial.
    Por favor responda: ¿Tiene fiebre o síntomas hoy? Responda SI o NO"
2. Si responde NO → registro automático en sistema, verde
3. Si responde SI → alerta al agente de campo, cita urgente de evaluación
4. Si no responde en 4 horas → alerta al agente asignado (posible contacto perdido)
5. Agente confirma check-in presencial o telefónico en la app
6. Dashboard actualizado en tiempo real con estado de todos los contactos
7. Al finalizar período → contacto pasa a "Completado", liberar cuarentena
```

### FLUJO D: Detección Automática de Brote

```sql
-- Job que corre cada 6 horas en Supabase pg_cron:
SELECT epidemiologia.detectar_umbral_brote(
  enfermedad_id, hospital_id
)
FROM (
  SELECT DISTINCT enfermedad_id, hospital_id 
  FROM epidemiologia.casos 
  WHERE fecha_notificacion > NOW() - INTERVAL '14 days'
    AND estado_caso = 'activo'
) subquery;
-- Si umbral superado → alerta crítica → notificación inmediata
-- → epidemiólogo activa investigación de brote desde alerta
```

---

## REPORTES EPIDEMIOLÓGICOS ESTÁNDAR

```typescript
// Todos exportables en PDF (formato OPS/Ministerio) y Excel

const REPORTES_EPIDEMIOLOGICOS = [
  'Informe_Semanal_Morbilidad',          // EWARS - Early Warning Alert Response System
  'Boletin_Epidemiologico_Mensual',      // Formato OPS/Ministerio GE
  'Informe_Situacion_Brote',             // Formato OMS Situation Report
  'Ficha_Investigacion_Caso',            // Por enfermedad según protocolo OPS
  'Lista_Contactos_Rastreo',             // Para trabajo de campo
  'Informe_Cierre_Brote',               // Informe final de brote
  'Reporte_Vigilancia_Sindromica',       // Semana epidemiológica
  'Informe_Cobertura_Vacunacion',        // Por campaña y zona geográfica
  'Mapa_Epidemiologico_Nacional',        // Imagen con capas activas
  'Tablero_Indicadores_OMS_IDSR',        // Integrated Disease Surveillance and Response
];
```

---

## INTEGRACIÓN CON EL HIS HOSIX EXISTENTE

```typescript
// Puntos de integración HIS ↔ Módulo Epidemiología:

// 1. DESDE consulta médica en HIS:
//    Al registrar diagnóstico CIE-10 de enfermedad de notificación obligatoria:
//    → Popup: "Este diagnóstico requiere notificación epidemiológica. ¿Notificar ahora?"
//    → Datos del paciente/episodio pre-llenados en la ficha

// 2. DESDE urgencias:
//    Triage nivel 1 con síndrome hemorrágico o febril sin foco:
//    → Alerta automática al epidemiólogo del hospital

// 3. DESDE laboratorio:
//    Resultado positivo a patógeno de notificación obligatoria:
//    → Notificación automática al epidemiólogo
//    → Si no hay caso notificado → crear caso automáticamente

// 4. HACIA el módulo médico del HIS:
//    Al registrar un contacto en la lista del HIS (módulo familias actual):
//    → Opción "Registrar como contacto epidemiológico"
//    → Formulario complementario de exposición

// 5. INDICADORES en Dashboard HIS:
//    Widget pequeño con: alertas activas, contactos con síntomas,
//    brotes activos en la red (visible para todos los usuarios del HIS)
```

---

## COMANDOS DE CONFIGURACIÓN ADICIONALES

```bash
# Dependencias adicionales para el módulo epidemiológico
npm install react-force-graph leaflet react-leaflet @leaflet/geosearch
npm install @turf/turf cytoscape react-cytoscapejs
npm install @rjsf/core @rjsf/utils @rjsf/validator-ajv8
npm install simple-statistics jstat
npm install @dhis2/app-runtime @dhis2/ui
npm install react-map-gl mapbox-gl  # alternativa a Leaflet para heatmaps

# Habilitar PostGIS en Supabase para análisis geoespacial
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- para búsqueda fuzzy
CREATE EXTENSION IF NOT EXISTS pg_cron;  -- para jobs automáticos

# Job automático de detección de umbrales (cada 6 horas)
SELECT cron.schedule(
  'detectar-umbrales-brote',
  '0 */6 * * *',
  $$ SELECT epidemiologia.detectar_umbral_brote(enfermedad_id, hospital_id)
     FROM (SELECT DISTINCT enfermedad_id, hospital_id FROM epidemiologia.casos
           WHERE fecha_notificacion > NOW() - INTERVAL '14 days') s; $$
);

# Job semanal: recordatorio de informe semanal (lunes 07:00 WAT = 06:00 UTC)
SELECT cron.schedule('recordatorio-informe-semanal','0 6 * * 1',
  $$ SELECT epidemiologia.enviar_recordatorio_informe_semanal(); $$
);

# Activar Supabase Realtime para alertas en tiempo real
ALTER TABLE epidemiologia.alertas REPLICA IDENTITY FULL;
ALTER TABLE epidemiologia.casos REPLICA IDENTITY FULL;
ALTER TABLE epidemiologia.seguimiento_contactos REPLICA IDENTITY FULL;

# En Supabase dashboard → Replication → Enable para esas tablas
```

---

## ENTREGABLES POR FASE — MÓDULO EPIDEMIOLOGÍA

### Fase 1 — Core (6 semanas)
- [ ] Catálogo de enfermedades de vigilancia (40+ enfermedades con fichas)
- [ ] Registro de casos con ficha dinámica por enfermedad
- [ ] Alertas automáticas para Grupo A
- [ ] Registro básico de contactos (sustituyendo módulo familias actual)
- [ ] Seguimiento diario de contactos con check-in
- [ ] Integración básica con HIS (desde episodio médico)

### Fase 2 — Rastreo Avanzado (4 semanas)
- [ ] Grafo interactivo de red de contactos (GrafoContactos.tsx)
- [ ] Kanban de seguimiento (KanbanContactos.tsx)
- [ ] Mapa epidemiológico nacional con Leaflet + GeoJSON GE
- [ ] Detección automática de umbrales de brote (trigger + cron)
- [ ] Gestión completa de brotes con curva epidémica

### Fase 3 — DHIS2 e Integración (4 semanas)
- [ ] Sincronización bidireccional DHIS2 Tracker (casos + contactos)
- [ ] Envío automático de datos agregados semanales
- [ ] Panel de estado DHIS2 y log de sincronización
- [ ] Vigilancia sindrómica semanal con envío al Ministerio
- [ ] Notificaciones SMS automáticas (Twilio) a contactos y personal

### Fase 4 — Análisis Avanzado (3 semanas)
- [ ] Árbol de transmisión y análisis de red (super-spreaders)
- [ ] Cálculo automático de R0 y tasas de ataque secundaria
- [ ] Heatmaps y zonas de riesgo geoespaciales
- [ ] Reportes estándar OPS/OMS exportables
- [ ] Dashboard BI epidemiológico completo con todos los KPIs

---

*Documento generado el 29/05/2026 para el proyecto HOSIX — Red Hospitalaria de Guinea Ecuatorial*
*Módulo de Vigilancia Epidemiológica + Integración DHIS2*
*Complementa: PROMPT_MAESTRO_HOSIX_GUINEA_ECUATORIAL.md*

