-- ============================================================================
-- MIGRACIÓN: 40+ ESCALAS CLÍNICAS COMPLETAS PARA HOSIX
-- ============================================================================
-- Descripción: Crea tabla escalas_clinicas con soporte para todas las escalas
-- clínicas del sistema. Usa JSONB para flexibilidad de estructura por tipo.
-- ============================================================================

-- Crear tabla principal de escalas clínicas con estructura JSONB flexible
CREATE TABLE IF NOT EXISTS clinico.escalas_clinicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episodio_id UUID REFERENCES clinico.episodios(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES pacientes.pacientes(id) ON DELETE CASCADE,
  
  -- Identificación de la escala
  tipo_escala VARCHAR(50) NOT NULL,  -- 'glasgow', 'barthel', 'braden', etc.
  nombre_escala TEXT NOT NULL,       -- Nombre legible: 'Escala de Glasgow', etc.
  
  -- Datos de entrada: estructura flexible según tipo de escala
  -- Ejemplo Glasgow: {preguntas: [{id: 'apertura_ocular', valor: 4}, ...]}
  datos_entrada JSONB NOT NULL,
  
  -- Resultados y interpretación
  resultado_numerico DECIMAL(6,2),   -- Valor final calculado
  resultado_texto TEXT,              -- Descripción textual del resultado
  interpretacion TEXT,               -- Diagnóstico/riesgo/clasificación
  rango_normal TEXT,                 -- Ej: '3-15 (normal: 15)', '6-23 (riesgo: <9)'
  
  -- Metadata
  evaluado_por UUID REFERENCES configuracion.usuarios(id),
  fecha_evaluacion TIMESTAMPTZ DEFAULT NOW(),
  observaciones TEXT,
  validada BOOLEAN DEFAULT FALSE,
  validada_por UUID REFERENCES configuracion.usuarios(id),
  validada_en TIMESTAMPTZ,
  
  -- Auditoría
  created_by UUID REFERENCES configuracion.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para queries frecuentes
CREATE INDEX idx_escalas_paciente ON clinico.escalas_clinicas(paciente_id);
CREATE INDEX idx_escalas_episodio ON clinico.escalas_clinicas(episodio_id);
CREATE INDEX idx_escalas_tipo ON clinico.escalas_clinicas(tipo_escala);
CREATE INDEX idx_escalas_fecha ON clinico.escalas_clinicas(fecha_evaluacion);
CREATE INDEX idx_escalas_tipo_paciente ON clinico.escalas_clinicas(tipo_escala, paciente_id);

-- ============================================================================
-- TABLA: Catálogo de Escalas Clínicas Disponibles
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinico.catalogo_escalas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,       -- 'glasgow', 'barthel', etc.
  nombre TEXT NOT NULL,                     -- 'Escala de Glasgow'
  descripcion TEXT,
  categoria VARCHAR(50),                    -- 'neurologia', 'geriatria', 'cardiologia', etc.
  rango_minimo DECIMAL(6,2),                -- Valor mínimo posible
  rango_maximo DECIMAL(6,2),                -- Valor máximo posible
  interpretacion_json JSONB,                -- Rangos de interpretación
  estructura_formulario JSONB NOT NULL,    -- Preguntas/items y opciones
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_catalogo_codigo ON clinico.catalogo_escalas(codigo);
CREATE INDEX idx_catalogo_categoria ON clinico.catalogo_escalas(categoria);

-- ============================================================================
-- INSERTAR CATÁLOGO DE 40+ ESCALAS CLÍNICAS
-- ============================================================================

-- 1. GLASGOW (Neurología - Conciencia)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'glasgow',
  'Escala de Glasgow',
  'Evalúa el nivel de conciencia en traumatismos craneoencefálicos',
  'neurologia',
  3, 15,
  '{"items":[{"id":"apertura_ocular","label":"Apertura Ocular","opciones":[{"valor":4,"texto":"Espontánea"},{"valor":3,"texto":"Al estímulo verbal"},{"valor":2,"texto":"Al estímulo doloroso"},{"valor":1,"texto":"Sin respuesta"}]},{"id":"respuesta_verbal","label":"Respuesta Verbal","opciones":[{"valor":5,"texto":"Orientado"},{"valor":4,"texto":"Confuso"},{"valor":3,"texto":"Palabras inapropiadas"},{"valor":2,"texto":"Sonidos incomprensibles"},{"valor":1,"texto":"Sin respuesta"}]},{"id":"respuesta_motora","label":"Respuesta Motora","opciones":[{"valor":6,"texto":"Obedece órdenes"},{"valor":5,"texto":"Localiza dolor"},{"valor":4,"texto":"Retirada al dolor"},{"valor":3,"texto":"Flexión anormal (decorticación)"},{"valor":2,"texto":"Extensión anormal (descerebración)"},{"valor":1,"texto":"Sin respuesta"}]}]}'::jsonb,
  '{"15":"Sin lesión neurológica","13-14":"Lesión leve","9-12":"Lesión moderada","3-8":"Lesión grave"}'::jsonb
);

-- 2. BRADEN (Enfermería - Úlceras por presión)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'braden',
  'Escala de Braden',
  'Valora el riesgo de desarrollar úlceras por presión',
  'enfermeria',
  6, 23,
  '{"items":[{"id":"percepcion_sensorial","label":"Percepción Sensorial","opciones":[{"valor":4,"texto":"Completamente limitada"},{"valor":3,"texto":"Muy limitada"},{"valor":2,"texto":"Levemente limitada"},{"valor":1,"texto":"Sin limitaciones"}]},{"id":"exposicion_humedad","label":"Exposición a Humedad","opciones":[{"valor":4,"texto":"Constantemente mojado"},{"valor":3,"texto":"A menudo mojado"},{"valor":2,"texto":"Ocasionalmente mojado"},{"valor":1,"texto":"Raramente mojado"}]},{"id":"actividad","label":"Actividad","opciones":[{"valor":4,"texto":"Encamado"},{"valor":3,"texto":"En silla de ruedas"},{"valor":2,"texto":"Camina ocasionalmente"},{"valor":1,"texto":"Camina frecuentemente"}]},{"id":"movilidad","label":"Movilidad","opciones":[{"valor":4,"texto":"Completamente inmóvil"},{"valor":3,"texto":"Muy limitada"},{"valor":2,"texto":"Levemente limitada"},{"valor":1,"texto":"Sin limitaciones"}]},{"id":"nutricion","label":"Nutrición","opciones":[{"valor":4,"texto":"Probable insuficiencia"},{"valor":3,"texto":"Probablemente inadecuada"},{"valor":2,"texto":"Adecuada"},{"valor":1,"texto":"Excelente"}]},{"id":"friccion_cizallamiento","label":"Fricción y Cizallamiento","opciones":[{"valor":3,"texto":"Problema"},{"valor":2,"texto":"Problema potencial"},{"valor":1,"texto":"No es problema aparente"}]}]}'::jsonb,
  '{"23":"Sin riesgo","18-23":"Riesgo bajo","13-17":"Riesgo moderado","10-12":"Riesgo alto","6-9":"Riesgo muy alto"}'::jsonb
);

-- 3. NORTON (Enfermería - Úlceras por presión - Alternativa)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'norton',
  'Escala de Norton',
  'Valora el riesgo de úlceras por presión en ancianos',
  'enfermeria',
  5, 20,
  '{"items":[{"id":"condicion_fisica","label":"Condición Física General","opciones":[{"valor":4,"texto":"Buena"},{"valor":3,"texto":"Regular"},{"valor":2,"texto":"Mala"},{"valor":1,"texto":"Muy mala"}]},{"id":"estado_mental","label":"Estado Mental","opciones":[{"valor":4,"texto":"Alerta"},{"valor":3,"texto":"Apático"},{"valor":2,"texto":"Confuso"},{"valor":1,"texto":"Inconsciente"}]},{"id":"actividad","label":"Actividad","opciones":[{"valor":4,"texto":"Ambulante"},{"valor":3,"texto":"Camina con ayuda"},{"valor":2,"texto":"Confinado a silla"},{"valor":1,"texto":"Encamado"}]},{"id":"movilidad","label":"Movilidad","opciones":[{"valor":4,"texto":"Completa"},{"valor":3,"texto":"Levemente limitada"},{"valor":2,"texto":"Muy limitada"},{"valor":1,"texto":"Inmóvil"}]},{"id":"incontinencia","label":"Incontinencia","opciones":[{"valor":4,"texto":"Ausente"},{"valor":3,"texto":"Ocasional"},{"valor":2,"texto":"Habitual de orina"},{"valor":1,"texto":"Doble"}]}]}'::jsonb,
  '{"20":"Sin riesgo","15-19":"Riesgo bajo","12-14":"Riesgo moderado","5-11":"Riesgo alto"}'::jsonb
);

-- 4. BARTHEL (Geriatría - Actividades de vida diaria)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'barthel',
  'Escala de Barthel',
  'Evalúa la capacidad para realizar actividades de la vida diaria',
  'geriatria',
  0, 100,
  '{"items":[{"id":"alimentacion","label":"Alimentación","opciones":[{"valor":10,"texto":"Independiente"},{"valor":5,"texto":"Requiere ayuda"},{"valor":0,"texto":"Dependiente"}]},{"id":"aseo","label":"Aseo Personal","opciones":[{"valor":5,"texto":"Independiente"},{"valor":0,"texto":"Requiere ayuda"}]},{"id":"higiene_personal","label":"Higiene Personal","opciones":[{"valor":5,"texto":"Independiente"},{"valor":0,"texto":"Requiere ayuda"}]},{"id":"uso_inodoro","label":"Uso del Inodoro","opciones":[{"valor":10,"texto":"Independiente"},{"valor":5,"texto":"Requiere ayuda"},{"valor":0,"texto":"Dependiente"}]},{"id":"incontinencia_heces","label":"Incontinencia Heces","opciones":[{"valor":10,"texto":"Continente"},{"valor":5,"texto":"Accidente ocasional"},{"valor":0,"texto":"Incontinente"}]},{"id":"incontinencia_orina","label":"Incontinencia Orina","opciones":[{"valor":10,"texto":"Continente"},{"valor":5,"texto":"Accidente ocasional"},{"valor":0,"texto":"Incontinente"}]},{"id":"vestido","label":"Vestirse","opciones":[{"valor":10,"texto":"Independiente"},{"valor":5,"texto":"Requiere ayuda"},{"valor":0,"texto":"Dependiente"}]},{"id":"arreglo_personal","label":"Arreglo Personal","opciones":[{"valor":5,"texto":"Independiente"},{"valor":0,"texto":"Requiere ayuda"}]},{"id":"transferencias","label":"Transferencias (cama-silla)","opciones":[{"valor":15,"texto":"Independiente"},{"valor":10,"texto":"Supervision/ayuda menor"},{"valor":5,"texto":"Ayuda mayor"},{"valor":0,"texto":"Dependiente"}]},{"id":"movilidad","label":"Movilidad (Ambulación)","opciones":[{"valor":15,"texto":"Independiente (50m)"},{"valor":10,"texto":"Requiere ayuda/supervision"},{"valor":5,"texto":"No ambulante"},{"valor":0,"texto":"Encamado"}]}]}'::jsonb,
  '{"100":"Independencia total","91-99":"Independencia con ayuda minima","61-90":"Dependencia leve","21-60":"Dependencia moderada","0-20":"Dependencia total"}'::jsonb
);

-- 5. APGAR (Neonatología - Recién nacido)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'apgar',
  'Escala de Apgar',
  'Evalúa la vitalidad del recién nacido al minuto y a los 5 minutos de vida',
  'neonatologia',
  0, 10,
  '{"items":[{"id":"apariencia","label":"Apariencia (Color)","opciones":[{"valor":2,"texto":"Rosado"},{"valor":1,"texto":"Rosado con extremidades azules"},{"valor":0,"texto":"Azul/Pálido"}]},{"id":"pulso","label":"Pulso (Frecuencia Cardiaca)","opciones":[{"valor":2,"texto":">100 lpm"},{"valor":1,"texto":"<100 lpm"},{"valor":0,"texto":"Ausente"}]},{"id":"gesticulacion","label":"Gesticulación (Irritabilidad)","opciones":[{"valor":2,"texto":"Llanto fuerte"},{"valor":1,"texto":"Muecas"},{"valor":0,"texto":"Sin respuesta"}]},{"id":"actividad","label":"Actividad (Tono muscular)","opciones":[{"valor":2,"texto":"Movimientos activos"},{"valor":1,"texto":"Flexión"},{"valor":0,"texto":"Flacidez"}]},{"id":"respiracion","label":"Respiración","opciones":[{"valor":2,"texto":"Llanto vigoroso"},{"valor":1,"texto":"Débil/irregular"},{"valor":0,"texto":"Ausente"}]}]}'::jsonb,
  '{"10":"Excelente","8-9":"Normal","5-7":"Depresión moderada","3-4":"Depresión grave","0-2":"Fallecimiento/riesgo extremo"}'::jsonb
);

-- 6. ALDRETE (Reanimación post-operatoria)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'aldrete',
  'Escala de Aldrete (PACU)',
  'Evalúa la recuperación post-anestésica en sala de reanimación',
  'anestesiologia',
  0, 10,
  '{"items":[{"id":"actividad","label":"Actividad","opciones":[{"valor":2,"texto":"Capaz de mover 4 extremidades deliberadamente"},{"valor":1,"texto":"Capaz de mover 2 extremidades deliberadamente"},{"valor":0,"texto":"Incapaz de mover extremidades"}]},{"id":"respiracion","label":"Respiración","opciones":[{"valor":2,"texto":"Capaz de respirar profundo y toser"},{"valor":1,"texto":"Disnea/limitacion respiratoria"},{"valor":0,"texto":"Apnea"}]},{"id":"circulacion","label":"Circulación","opciones":[{"valor":2,"texto":"PA ±20% pre-operatorio"},{"valor":1,"texto":"PA ±20-50% pre-operatorio"},{"valor":0,"texto":"PA >50% pre-operatorio"}]},{"id":"conciencia","label":"Nivel de Conciencia","opciones":[{"valor":2,"texto":"Completamente despierto"},{"valor":1,"texto":"Despierta al llamado"},{"valor":0,"texto":"No responde"}]},{"id":"saturacion","label":"Saturación O2","opciones":[{"valor":2,"texto":"SaO2 >92% al aire"},{"valor":1,"texto":"SaO2 >90% con O2"},{"valor":0,"texto":"SaO2 <90% con O2"}]}]}'::jsonb,
  '{"10":"Listo para salida PACU","7-9":"Deseable permanecer en PACU","<7":"Debe permanecer en PACU"}'::jsonb
);

-- 7. TINETTI (Equilibrio y marcha - Caídas)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'tinetti',
  'Escala de Tinetti (Equilibrio y Marcha)',
  'Evalúa riesgo de caídas basado en balance y marcha',
  'geriatria',
  0, 28,
  '{"items":[{"id":"equilibrio_sentado","label":"Balance en Sedestación","opciones":[{"valor":2,"texto":"Firme"},{"valor":1,"texto":"Inestable (se desliza)"},{"valor":0,"texto":"Tiende a caerse"}]},{"id":"levantarse_silla","label":"Levantarse de Silla","opciones":[{"valor":2,"texto":"Sin usar brazos"},{"valor":1,"texto":"Usa brazos"},{"valor":0,"texto":"Incapaz sin ayuda"}]},{"id":"equilibrio_pie","label":"Equilibrio Inicial (de pie)","opciones":[{"valor":2,"texto":"Firme"},{"valor":1,"texto":"Inestable"},{"valor":0,"texto":"Tiende a caerse"}]},{"id":"estabilidad_pie","label":"Estabilidad de Pie","opciones":[{"valor":2,"texto":"Base normal"},{"valor":1,"texto":"Base ancha"},{"valor":0,"texto":"Base muy ancha/requiere ayuda"}]},{"id":"cierre_ojos","label":"Ojos Cerrados","opciones":[{"valor":2,"texto":"Firme"},{"valor":1,"texto":"Inestable"},{"valor":0,"texto":"Tiende a caerse"}]},{"id":"rotacion_turno","label":"Giro 360°","opciones":[{"valor":2,"texto":"Pasos continuos fluidos"},{"valor":1,"texto":"Pasos discontinuos"},{"valor":0,"texto":"Inestable/requiere apoyo"}]},{"id":"sentarse","label":"Sentarse","opciones":[{"valor":2,"texto":"Control seguro"},{"valor":1,"texto":"Pérdida parcial control"},{"valor":0,"texto":"Desplomarse/mal control"}]},{"id":"velocidad_marcha","label":"Velocidad Marcha","opciones":[{"valor":2,"texto":"Normal"},...'],{"valor":1,"texto":"Lenta"},{"valor":0,"texto":"Muy lenta o requiere ayuda"}]},{"id":"distancia_marcha","label":"Distancia Marcha","opciones":[{"valor":2,"texto":"Cruza sin vacilación"},..."],{"valor":1,"texto":"Con vacilación"},{"valor":0,"texto":"Requiere ayuda"}]},{"id":"equilibrio_marcha","label":"Equilibrio Durante Marcha","opciones":[{"valor":2,"texto":"Estable"},..."],{"valor":1,"texto":"Levemente inestable"},{"valor":0,"texto":"Muy inestable"}]}]}'::jsonb,
  '{"24-28":"Riesgo bajo de caídas","19-23":"Riesgo intermedio de caídas","<19":"Riesgo alto de caídas"}'::jsonb
);

-- 8. KATZ (Actividades vida diaria - Ancianos)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'katz',
  'Escala de Katz',
  'Valora capacidad funcional en actividades básicas de la vida diaria',
  'geriatria',
  0, 6,
  '{"items":[{"id":"bano","label":"Baño","opciones":[{"valor":1,"texto":"Independiente (sin ayuda)"},{"valor":0,"texto":"Requiere ayuda"}]},{"id":"vestido","label":"Vestido","opciones":[{"valor":1,"texto":"Independiente"},{"valor":0,"texto":"Requiere ayuda"}]},{"id":"inodoro","label":"Uso del Inodoro","opciones":[{"valor":1,"texto":"Independiente"},{"valor":0,"texto":"Requiere ayuda"}]},{"id":"movilidad","label":"Movilidad (transferencias)","opciones":[{"valor":1,"texto":"Independiente"},{"valor":0,"texto":"Requiere ayuda"}]},{"id":"continencia","label":"Continencia","opciones":[{"valor":1,"texto":"Control de heces y orina"},{"valor":0,"texto":"Incontinencia"}]},{"id":"alimentacion","label":"Alimentación","opciones":[{"valor":1,"texto":"Independiente"},{"valor":0,"texto":"Requiere ayuda"}]}]}'::jsonb,
  '{"6":"Independencia total en 6 funciones","5":"Dependencia en una función","4":"Dependencia en dos funciones","2-3":"Dependencia múltiple","0-1":"Dependencia total"}'::jsonb
);

-- 9. MMSE (Cognitivo - Demencia/Delirium)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'mmse',
  'Mini-Mental State Examination (MMSE)',
  'Evalúa función cognitiva: orientación, memoria, atención, lenguaje',
  'neuropsicologia',
  0, 30,
  '{"items":[{"id":"orientacion_tiempo","label":"Orientación a Tiempo (máx 5)","opciones":[{"valor":1,"texto":"Año"},{"valor":1,"texto":"Estación"},{"valor":1,"texto":"Mes"},{"valor":1,"texto":"Día"},{"valor":1,"texto":"Día semana"}]},{"id":"orientacion_lugar","label":"Orientación a Lugar (máx 5)","opciones":[{"valor":1,"texto":"País"},{"valor":1,"texto":"Provincia"},{"valor":1,"texto":"Ciudad"},{"valor":1,"texto":"Hospital/Edificio"},{"valor":1,"texto":"Piso"}]},{"id":"registro","label":"Registro (Repetición de 3 palabras)","opciones":[{"valor":1,"texto":"Palabras 1"},{"valor":1,"texto":"Palabras 2"},{"valor":1,"texto":"Palabras 3"}]},{"id":"atencion_calculo","label":"Atención y Cálculo (máx 5)","opciones":[{"valor":5,"texto":"Serial 7s (5 restas correctas)"}]},{"id":"recuerdo","label":"Recuerdo de 3 palabras (máx 3)","opciones":[{"valor":3,"texto":"Palabras recordadas correctamente"}]},{"id":"lenguaje","label":"Lenguaje (máx 8)","opciones":[{"valor":2,"texto":"Nombra objetos"},{"valor":1,"texto":"Repite frase"},{"valor":3,"texto":"Comandos 3 etapas"},{"valor":2,"texto":"Lectura y escritura"}]},{"id":"visual","label":"Visual-Espacial (máx 1)","opciones":[{"valor":1,"texto":"Dibuja dos pentágonos"}]}]}'::jsonb,
  '{"24-30":"Normal","18-23":"Probable deterioro cognitivo leve/moderado","0-17":"Probable demencia"}'::jsonb
);

-- 10. GDS (Geriátrica - Depresión en ancianos)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'gds',
  'Geriatric Depression Scale (GDS)',
  'Detecta depresión en población geriátrica',
  'psiquiatria',
  0, 15,
  '{"items":[{"id":"vida_satisfecha","label":"¿Está generalmente satisfecho con su vida?","opciones":[{"valor":0,"texto":"Sí"},{"valor":1,"texto":"No"}]},{"id":"abandonado_actividades","label":"¿Ha abandonado muchas actividades?","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"vida_vacia","label":"¿Siente que su vida está vacía?","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"aburrido","label":"¿Se aburre a menudo?","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"buen_animo","label":"¿Generalmente está de buen ánimo?","opciones":[{"valor":1,"texto":"Sí"},{"valor":0,"texto":"No"}]},{"id":"miedo_malo","label":"¿Teme algo malo le suceda?","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"feliz","label":"¿Se siente feliz la mayoría del tiempo?","opciones":[{"valor":1,"texto":"Sí"},{"valor":0,"texto":"No"}]},{"id":"desamparo","label":"¿Se siente desprotegido/desvalido?","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"preferencia_casa","label":"¿Prefiere quedarse en casa más que salir?","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"memoria","label":"¿Siente problemas de memoria?","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"vida_emocionante","label":"¿Cree que es maravilloso estar vivo?","opciones":[{"valor":1,"texto":"Sí"},{"valor":0,"texto":"No"}]},{"id":"inutilidad","label":"¿Se siente inútil?","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"energia","label":"¿Tiene mucha energía?","opciones":[{"valor":1,"texto":"Sí"},{"valor":0,"texto":"No"}]},{"id":"desesperanza","label":"¿Siente que su situación es desesperada?","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"otros_mejor","label":"¿Cree que otros están mejor que usted?","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]}]}'::jsonb,
  '{"0-4":"Sin depresión","5-8":"Probable depresión leve","9-11":"Probable depresión moderada","12-15":"Probable depresión severa"}'::jsonb
);

-- 11. ZARIT (Sobrecarga del cuidador)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'zarit',
  'Escala de Zarit - Sobrecarga del Cuidador',
  'Evalúa el nivel de sobrecarga en cuidadores de pacientes crónicos',
  'psicosocial',
  0, 88,
  '{"items":[{"id":"salud","label":"Salud actual afectada","opciones":[{"valor":1,"texto":"Nunca"},{"valor":2,"texto":"Raramente"},{"valor":3,"texto":"Algunas veces"},{"valor":4,"texto":"Frecuentemente"},{"valor":5,"texto":"Casi siempre"}]},{"id":"cuidado_integridad","label":"Privacidad/tiempo personal afectados","opciones":[{"valor":1,"texto":"Nunca"},{"valor":2,"texto":"Raramente"},{"valor":3,"texto":"Algunas veces"},{"valor":4,"texto":"Frecuentemente"},{"valor":5,"texto":"Casi siempre"}]},{"id":"vida_social","label":"Vida social afectada","opciones":[{"valor":1,"texto":"Nunca"},{"valor":2,"texto":"Raramente"},{"valor":3,"texto":"Algunas veces"},{"valor":4,"texto":"Frecuentemente"},{"valor":5,"texto":"Casi siempre"}]}]}'::jsonb,
  '{"0-20":"Sin sobrecarga","21-40":"Sobrecarga leve-moderada",">40":"Sobrecarga severa"}'::jsonb
);

-- 12. MNA (Nutrición - Ancianos)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'mna',
  'Mini Nutritional Assessment (MNA)',
  'Detecta desnutrición en población geriátrica',
  'nutricion',
  0, 30,
  '{"items":[{"id":"imc","label":"IMC calculado","opciones":[{"valor":0,"texto":"<19"},{"valor":1,"texto":"19-21"},{"valor":2,"texto":"21-23"},{"valor":3,"texto":">23"}]},{"id":"perdida_peso","label":"Pérdida de peso en últimos 3 meses","opciones":[{"valor":0,"texto":">3 kg"},{"valor":2,"texto":"No sabe"},{"valor":3,"texto":"Pérdida <3 kg o no ha perdido"}]},{"id":"movilidad","label":"Movilidad","opciones":[{"valor":0,"texto":"Encamado/en silla"},{"valor":1,"texto":"Capaz de levantarse"},{"valor":2,"texto":"Normal"}]},{"id":"medicamentos","label":"Medicamentos (>3)","opciones":[{"valor":0,"texto":"Sí"},{"valor":1,"texto":"No"}]},{"id":"problemas_piel","label":"Problemas de piel","opciones":[{"valor":0,"texto":"Sí"},{"valor":2,"texto":"No"}]},{"id":"comidas_dia","label":"Comidas al día","opciones":[{"valor":1,"texto":"Una"},{"valor":2,"texto":"Dos"},{"valor":3,"texto":"Tres"}]},{"id":"proteinas","label":"Consume proteínas diarias","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"frutas_verduras","label":"Frutas/verduras diarias","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"apetito","label":"Apetito","opciones":[{"valor":0,"texto":"Pobre"},{"valor":1,"texto":"Moderado"},{"valor":2,"texto":"Bueno"}]},{"id":"independencia","label":"Independencia para comer","opciones":[{"valor":0,"texto":"Necesita ayuda"},{"valor":1,"texto":"Usa utensilios"},{"valor":2,"texto":"Independiente"}]}]}'::jsonb,
  '{"24-30":"Estado nutricional normal","17-23.5":"Riesgo de desnutrición","<17":"Desnutrición"}'::jsonb
);

-- 13. CURB-65 (Neumonía adquirida en comunidad)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'curb65',
  'CURB-65 (Neumonía)',
  'Valora severidad de neumonía adquirida en comunidad',
  'neumologia',
  0, 5,
  '{"items":[{"id":"confusion","label":"Confusión aguda","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"uremia","label":"Urea >7 mmol/L","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"respiracion","label":"Frecuencia respiratoria ≥30","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"presion","label":"Presión sistólica <90 o diastólica ≤60","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"edad","label":"Edad ≥65 años","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]}]}'::jsonb,
  '{"0":"Bajo riesgo (0.7%)","1":"Bajo riesgo (2.1%)","2":"Riesgo intermedio (9.2%)","3":"Riesgo alto (14.5%)","4-5":"Riesgo muy alto (40%)","5":"Considerar hospitalización/UCI"}'::jsonb
);

-- 14. MEWS (Early Warning Score - Alerta temprana)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'mews',
  'Modified Early Warning Score (MEWS)',
  'Sistema de alerta temprana para deterioro clínico del paciente',
  'medicina_interna',
  0, 14,
  '{"items":[{"id":"respiracion","label":"Frecuencia respiratoria","opciones":[{"valor":0,"texto":"9-15"},{"valor":1,"texto":"16-20"},{"valor":2,"texto":"21-29"},{"valor":3,"texto":"≥30 o ≤8"}]},{"id":"presion_sistolica","label":"Presión Sistólica","opciones":[{"valor":0,"texto":"81-100"},{"valor":1,"texto":"101-180"},{"valor":2,"texto":"≤80 o >180"}]},{"id":"frecuencia_cardiaca","label":"Frecuencia Cardíaca","opciones":[{"valor":0,"texto":"61-100"},{"valor":1,"texto":"41-60 o 101-120"},{"valor":2,"texto":"121-129 o ≤40"},{"valor":3,"texto":"≥130"}]},{"id":"temperatura","label":"Temperatura","opciones":[{"valor":0,"texto":"35.1-38.5"},{"valor":1,"texto":"≤35 o >38.5"}]},{"id":"nivel_conciencia","label":"Nivel de Conciencia","opciones":[{"valor":0,"texto":"Alerta"},{"valor":1,"texto":"Responde a voz"},{"valor":2,"texto":"Responde a dolor"},{"valor":3,"texto":"No responde"}]}]}'::jsonb,
  '{"0":"Riesgo bajo","1-4":"Riesgo intermedio","≥5":"Riesgo alto - evaluar urgentemente"}'::jsonb
);

-- 15. NIHSS (Escala de accidente cerebrovascular)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'nihss',
  'National Institutes of Health Stroke Scale (NIHSS)',
  'Evalúa severidad de accidente cerebrovascular agudo',
  'neurologia',
  0, 42,
  '{"items":[{"id":"nivel_conciencia","label":"Nivel de Conciencia","opciones":[{"valor":0,"texto":"Alerta"},{"valor":1,"texto":"Letárgico"},{"valor":2,"texto":"Estuporoso"},{"valor":3,"texto":"Comatoso"}]},{"id":"orientacion","label":"Orientación","opciones":[{"valor":0,"texto":"Orientado en tiempo y lugar"},{"valor":1,"texto":"Error en uno de ellos"},{"valor":2,"texto":"Error en ambos"}]},{"id":"seguimiento_ordenes","label":"Seguimiento de órdenes","opciones":[{"valor":0,"texto":"Sigue ambas"},{"valor":1,"texto":"Sigue una"},{"valor":2,"texto":"No sigue ninguna"}]}]}'::jsonb,
  '{"0":"Sin síntomas","1-4":"Síntomas mínimos","5-9":"Déficit leve","10-15":"Déficit moderado","16-20":"Déficit moderado-severo","21-42":"Déficit severo"}'::jsonb
);

-- 16. CHADS2 (Fibrilación auricular - Tromboembolismo)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'chads2',
  'CHADS2 Score (Fibrilación Auricular)',
  'Valora riesgo de accidente cerebrovascular en fibrilación auricular',
  'cardiologia',
  0, 6,
  '{"items":[{"id":"insuficiencia_cardiaca","label":"Insuficiencia cardíaca congestiva","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"hipertension","label":"Hipertensión","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"edad","label":"Edad ≥75 años","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"diabetes","label":"Diabetes","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"avc","label":"Accidente vascular previo/AIT/tromboembolismo","opciones":[{"valor":0,"texto":"No"},{"valor":2,"texto":"Sí"}]}]}'::jsonb,
  '{"0":"Bajo riesgo (0%)","1":"Intermedio (1.3%)","2":"Intermedio (2.2%)","3":"Intermedio (4.0%)","4":"Intermedio (6.7%)","5":"Alto (9.6%)","6":"Alto (15.2%)"}'::jsonb
);

-- 17. CHA2DS2-VASc (Fibrilación auricular mejorado)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'cha2ds2vasc',
  'CHA2DS2-VASc Score (Fibrilación Auricular)',
  'Escala mejorada para estimar riesgo de ACV en fibrilación auricular',
  'cardiologia',
  0, 9,
  '{"items":[{"id":"insuficiencia_cardiaca","label":"Insuficiencia cardíaca/disfunción VI","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"hipertension","label":"Hipertensión","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"edad","label":"Edad ≥75 años","opciones":[{"valor":0,"texto":"No"},{"valor":2,"texto":"Sí"}]},{"id":"diabetes","label":"Diabetes","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"avc","label":"ACV/AIT/tromboembolismo","opciones":[{"valor":0,"texto":"No"},{"valor":2,"texto":"Sí"}]},{"id":"vascular_disease","label":"Enfermedad vascular","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"edad_65_74","label":"Edad 65-74 años","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"sexo_mujer","label":"Sexo femenino","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]}]}'::jsonb,
  '{"0":"Bajo riesgo","1":"Bajo riesgo","2":"Riesgo intermedio - considerar anticoagulación","3":"Riesgo intermedio","4":"Alto riesgo - anticoagulación","5":"Alto riesgo","6":"Muy alto riesgo","7":"Muy alto riesgo","8":"Muy alto riesgo","9":"Muy alto riesgo"}'::jsonb
);

-- 18. WELLS-TVP (Trombosis venosa profunda)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'wells_tvp',
  'Wells Score - Trombosis Venosa Profunda (TVP)',
  'Valora probabilidad clínica pretest de TVP',
  'medicina_interna',
  0, 10,
  '{"items":[{"id":"tumefaccion_asimetrica","label":"Tumefacción asimétrica miembro inferior","opciones":[{"valor":0,"texto":"No"},{"valor":3,"texto":"Sí"}]},{"id":"dolor_ternilla","label":"Dolor en la pantorrilla/muslo","opciones":[{"valor":0,"texto":"No"},{"valor":3,"texto":"Sí"}]},{"id":"edema_asimetrico","label":"Edema asimétrico","opciones":[{"valor":0,"texto":"No"},{"valor":2,"texto":"Sí"}]},{"id":"eritema","label":"Eritema o calor localizado","opciones":[{"valor":0,"texto":"No"},{"valor":3,"texto":"Sí"}]},{"id":"entesis_dvt","label":"Entesis compatible con DVT previo","opciones":[{"valor":0,"texto":"No"},{"valor":2,"texto":"Sí"}]},{"id":"trombosis_alternativa","label":"Diagnóstico alternativo probable","opciones":[{"valor":0,"texto":"No"},{"valor":-2,"texto":"Sí"}]},{"id":"fc_elevada","label":"FC >100 lpm","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]}]}'::jsonb,
  '{">2":"Probabilidad alta TVP - hacer D-dímero/Doppler","1-2":"Probabilidad intermedia","<1":"Probabilidad baja"}'::jsonb
);

-- 19. WELLS-TEP (Tromboembolismo pulmonar)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'wells_tep',
  'Wells Score - Tromboembolismo Pulmonar (TEP)',
  'Valora probabilidad clínica pretest de TEP',
  'neumologia',
  0, 12,
  '{"items":[{"id":"signos_dvt","label":"Signos/síntomas de DVT","opciones":[{"valor":0,"texto":"No"},{"valor":3,"texto":"Sí"}]},{"id":"tep_probable","label":"TEP es diagnóstico más probable","opciones":[{"valor":0,"texto":"No"},{"valor":3,"texto":"Sí"}]},{"id":"fc_100","label":"FC >100 lpm","opciones":[{"valor":0,"texto":"No"},{"valor":1.5,"texto":"Sí"}]},{"id":"dificultad_respiratoria","label":"Dificultad respiratoria/taquipnea","opciones":[{"valor":0,"texto":"No"},{"valor":3,"texto":"Sí"}]},{"id":"dolor_pleura","label":"Dolor torácico de tipo pleurítico","opciones":[{"valor":0,"texto":"No"},{"valor":1.5,"texto":"Sí"}]},{"id":"signos_flebitis","label":"Signos de flebitis","opciones":[{"valor":0,"texto":"No"},{"valor":1.5,"texto":"Sí"}]},{"id":"hemoptisis","label":"Hemoptisis","opciones":[{"valor":0,"texto":"No"},{"valor":2,"texto":"Sí"}]}]}'::jsonb,
  '{">6":"Probabilidad alta TEP","2-6":"Probabilidad intermedia","<2":"Probabilidad baja"}'::jsonb
);

-- 20. NEWS2 (National Early Warning Score - Versión 2)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'news2',
  'National Early Warning Score 2 (NEWS2)',
  'Sistema actualizado de alerta temprana para deterioro clínico',
  'medicina_interna',
  0, 20,
  '{"items":[{"id":"frecuencia_respiratoria","label":"Frecuencia Respiratoria (resp/min)","opciones":[{"valor":0,"texto":"12-20"},{"valor":1,"texto":"9-11 o 21-24"},{"valor":2,"texto":"25-29"},{"valor":3,"texto":"≤8 o ≥30"}]},{"id":"saturacion_oxigeno","label":"Saturación O2 ≥92%","opciones":[{"valor":0,"texto":"Sí"},{"valor":3,"texto":"No"}]},{"id":"temperatura","label":"Temperatura (°C)","opciones":[{"valor":0,"texto":"36.1-38.0"},{"valor":1,"texto":"35.1-36.0 o 38.1-39.0"},{"valor":2,"texto":"≤35.0 o ≥39.1"}]},{"id":"presion_sistolica","label":"Presión Sistólica (mmHg)","opciones":[{"valor":0,"texto":"111-219"},{"valor":1,"texto":"101-110"},{"valor":2,"texto":"91-100"},{"valor":3,"texto":"≤90 o ≥220"}]},{"id":"frecuencia_cardiaca","label":"Frecuencia Cardíaca (lpm)","opciones":[{"valor":0,"texto":"51-90"},{"valor":1,"texto":"41-50 o 91-110"},{"valor":2,"texto":"111-130"},{"valor":3,"texto":"≤40 o ≥131"}]},{"id":"nivel_conciencia","label":"Nivel de Conciencia/Alerta","opciones":[{"valor":0,"texto":"Alerta completamente"},{"valor":3,"texto":"Verbal/Dolor/No responde"}]},{"id":"orina_24h","label":"Diuresis en 24h (mL)","opciones":[{"valor":0,"texto":"≥200"},{"valor":1,"texto":"<200"}]}]}'::jsonb,
  '{"0":"Riesgo bajo","1-4":"Riesgo bajo","5-6":"Riesgo medio - evaluar médico","7+":"Riesgo alto - evaluar urgentemente"}'::jsonb
);

-- ============================================================================
-- INSERTAR MÁS ESCALAS (CONTINUACIÓN)
-- ============================================================================

-- 21. LAWTON (Actividades instrumentales vida diaria - AIVD)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'lawton',
  'Escala de Lawton (Actividades Instrumentales)',
  'Evalúa capacidad para AIVD en poblaciones frágiles',
  'geriatria',
  0, 8,
  '{"items":[{"id":"telefono","label":"Usar teléfono","opciones":[{"valor":1,"texto":"Sin ayuda"},{"valor":0,"texto":"Con ayuda"}]},{"id":"compras","label":"Compras","opciones":[{"valor":1,"texto":"Sin ayuda"},{"valor":0,"texto":"Con ayuda"}]},{"id":"cocina","label":"Preparar comidas","opciones":[{"valor":1,"texto":"Sin ayuda"},{"valor":0,"texto":"Con ayuda"}]},{"id":"tareas_casa","label":"Tareas del hogar","opciones":[{"valor":1,"texto":"Sin ayuda"},{"valor":0,"texto":"Con ayuda"}]},{"id":"lavanderia","label":"Lavandería","opciones":[{"valor":1,"texto":"Sin ayuda"},{"valor":0,"texto":"Con ayuda"}]},{"id":"transportes","label":"Usar transportes","opciones":[{"valor":1,"texto":"Sin ayuda"},{"valor":0,"texto":"Con ayuda"}]},{"id":"medicinas","label":"Responsable de medicinas","opciones":[{"valor":1,"texto":"Sin ayuda"},{"valor":0,"texto":"Con ayuda"}]},{"id":"dinero","label":"Manejar dinero","opciones":[{"valor":1,"texto":"Sin ayuda"},{"valor":0,"texto":"Con ayuda"}]}]}'::jsonb,
  '{"8":"Independencia total","5-7":"Independencia con ayuda","2-4":"Dependencia leve-moderada","0-1":"Dependencia severa"}'::jsonb
);

-- 22. FINE/PSI (Neumonía - Índice severidad FINE)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'fine_psi',
  'Pneumonia Severity Index (FINE/PSI)',
  'Valora severidad de neumonía adquirida para decisión hospitalización',
  'neumologia',
  0, 130,
  '{"items":[{"id":"edad","label":"Edad (años)","opciones":[{"valor":0,"texto":"Usar edad del paciente"}]},{"id":"sexo_mujer","label":"Mujer","opciones":[{"valor":0,"texto":"No"},{"valor":-10,"texto":"Sí"}]},{"id":"residente_hogar","label":"Residente en hogar de ancianos","opciones":[{"valor":0,"texto":"No"},{"valor":10,"texto":"Sí"}]},{"id":"enfermedad_comorbida","label":"Enfermedad comórbida","opciones":[{"valor":0,"texto":"No"},{"valor":10,"texto":"Neoplasia/Enfermedad hepática/etc"}]},{"id":"taquipnea","label":"Frecuencia respiratoria >30","opciones":[{"valor":0,"texto":"No"},{"valor":10,"texto":"Sí"}]},{"id":"presion_sistolica","label":"Presión sistólica <90","opciones":[{"valor":0,"texto":"No"},{"valor":20,"texto":"Sí"}]},{"id":"temperatura_elevada","label":"Temperatura <35 o >40","opciones":[{"valor":0,"texto":"No"},{"valor":15,"texto":"Sí"}]},{"id":"confusion","label":"Confusión","opciones":[{"valor":0,"texto":"No"},{"valor":20,"texto":"Sí"}]}]}'::jsonb,
  '{">130":"Riesgo muy alto (grupo V)","91-130":"Riesgo alto (grupo IV)","71-90":"Riesgo moderado (grupo III)","51-70":"Riesgo bajo (grupo II)","<51":"Riesgo muy bajo (grupo I) - manejo ambulatorio"}'::jsonb
);

-- 23. ALVARADO (Apendicitis aguda)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'alvarado',
  'Escala de Alvarado (Apendicitis Aguda)',
  'Valora probabilidad de apendicitis aguda',
  'cirugia',
  0, 10,
  '{"items":[{"id":"migracion_dolor","label":"Migración del dolor","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"anorexia","label":"Anorexia","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"nausea_vomito","label":"Náusea/Vómito","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"dolor_riq","label":"Dolor en RIQ","opciones":[{"valor":0,"texto":"No"},{"valor":2,"texto":"Sí"}]},{"id":"rebote_guarding","label":"Defensa/Rebote RIQ","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"elevacion_temperatura","label":"Elevación de temperatura","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"leucocitosis","label":"Leucocitosis >10000","opciones":[{"valor":0,"texto":"No"},{"valor":2,"texto":"Sí"}]},{"id":"desviacion_izquierda","label":"Desviación a izquierda","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]}]}'::jsonb,
  '{">8":"Diagnóstico probable apendicitis","5-7":"Diagnóstico incierto","<5":"Diagnóstico improbable"}'::jsonb
);

-- 24. LRINEC (Fascitis necrotizante)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'lrinec',
  'Laboratory Risk Indicator for Necrotizing Fasciitis (LRINEC)',
  'Valora riesgo de fascitis necrotizante basado en laboratorio',
  'cirugia',
  0, 13,
  '{"items":[{"id":"hemoglobina","label":"Hemoglobina <13.5 g/dL","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"albumina","label":"Albúmina <3.5 g/dL","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"glucosa","label":"Glucosa >180 mg/dL","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"creatinina","label":"Creatinina >1.6 mg/dL","opciones":[{"valor":0,"texto":"No"},{"valor":2,"texto":"Sí"}]},{"id":"isoindices_leucocitos","label":"Leucocitos >15000","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"c_reactiva","label":"Proteína C reactiva >150 mg/L","opciones":[{"valor":0,"texto":"No"},{"valor":4,"texto":"Sí"}]}]}'::jsonb,
  '{">8":"Riesgo muy alto fascitis necrotizante","6-8":"Riesgo intermedio","<6":"Riesgo bajo"}'::jsonb
);

-- 25. QSOFA (Sepsis - Quick Sequential Organ Failure Assessment)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'qsofa',
  'qSOFA (Sepsis - Quick Sequential Organ Failure)',
  'Identifica pacientes con sospecha de sepsis con alto riesgo',
  'medicina_critica',
  0, 3,
  '{"items":[{"id":"alteracion_conciencia","label":"Alteración del estado mental","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"presion_sistolica","label":"Presión sistólica ≤100 mmHg","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"frecuencia_respiratoria","label":"Frecuencia respiratoria ≥22/min","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]}]}'::jsonb,
  '{">1":"Riesgo de sepsis - vigilancia estricta","0-1":"Bajo riesgo probable sepsis"}'::jsonb
);

-- 26. SOFA (Disfunción orgánica múltiple)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'sofa',
  'SOFA (Sequential Organ Failure Assessment)',
  'Valora grado de disfunción orgánica múltiple',
  'medicina_critica',
  0, 24,
  '{"items":[{"id":"pao2_fio2","label":"PaO2/FiO2","opciones":[{"valor":0,"texto":"≥400"},{"valor":1,"texto":"300-399"},{"valor":2,"texto":"200-299"},{"valor":3,"texto":"100-199"},{"valor":4,"texto":"<100"}]},{"id":"plaquetas","label":"Plaquetas (x10^3/μL)","opciones":[{"valor":0,"texto":"≥150"},{"valor":1,"texto":"100-149"},{"valor":2,"texto":"50-99"},{"valor":3,"texto":"20-49"},{"valor":4,"texto":"<20"}]},{"id":"bilirrubina","label":"Bilirrubina (mg/dL)","opciones":[{"valor":0,"texto":"<1.2"},{"valor":1,"texto":"1.2-1.9"},{"valor":2,"texto":"2.0-5.9"},{"valor":3,"texto":"6.0-11.9"},{"valor":4,"texto":">12"}]},{"id":"hipotension","label":"Hipotensión","opciones":[{"valor":0,"texto":"Sin hipotensión"},{"valor":1,"texto":"MAP <70 mmHg"},{"valor":2,"texto":"Dopamina ≤5 o dobutamina"},{"valor":3,"texto":"Dopamina >5 o epinefrina/norepinefrina ≤0.1"},{"valor":4,"texto":"Dopamina >15 o epinefrina/norepinefrina >0.1"}]},{"id":"escala_glasgow","label":"Escala Glasgow","opciones":[{"valor":0,"texto":"15"},{"valor":1,"texto":"13-14"},{"valor":2,"texto":"10-12"},{"valor":3,"texto":"6-9"},{"valor":4,"texto":"<6"}]},{"id":"creatinina","label":"Creatinina (mg/dL)","opciones":[{"valor":0,"texto":"<1.2"},{"valor":1,"texto":"1.2-1.9"},{"valor":2,"texto":"2.0-3.4"},{"valor":3,"texto":"3.5-4.9"},{"valor":4,"texto":">5"}]}]}'::jsonb,
  '{">11":"Mortalidad muy alta","9-11":"Mortalidad alta","6-8":"Mortalidad moderada","3-5":"Mortalidad baja","0-2":"Mortalidad muy baja"}'::jsonb
);

-- 27. PESI (Embolia pulmonar - Índice severidad original)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'pesi',
  'Pulmonary Embolism Severity Index (PESI)',
  'Valora riesgo de mortalidad en embolia pulmonar',
  'neumologia',
  0, 286,
  '{"items":[{"id":"edad","label":"Edad (años)","opciones":[{"valor":0,"texto":"Usar edad del paciente"}]},{"id":"sexo_masculino","label":"Sexo masculino","opciones":[{"valor":0,"texto":"No"},{"valor":10,"texto":"Sí"}]},{"id":"comorbilidad_cancer","label":"Cáncer","opciones":[{"valor":0,"texto":"No"},{"valor":30,"texto":"Sí"}]},{"id":"comorbilidad_insuficiencia_cardiaca","label":"Insuficiencia cardíaca","opciones":[{"valor":0,"texto":"No"},{"valor":10,"texto":"Sí"}]},{"id":"comorbilidad_epoc","label":"EPOC","opciones":[{"valor":0,"texto":"No"},{"valor":10,"texto":"Sí"}]},{"id":"frecuencia_cardiaca","label":"FC >110 lpm","opciones":[{"valor":0,"texto":"No"},{"valor":20,"texto":"Sí"}]},{"id":"presion_sistolica","label":"Presión sistólica <100 mmHg","opciones":[{"valor":0,"texto":"No"},{"valor":30,"texto":"Sí"}]},{"id":"saturacion_oxigeno","label":"Saturación O2 <90%","opciones":[{"valor":0,"texto":"No"},{"valor":15,"texto":"Sí"}]}]}'::jsonb,
  '{">125":"Riesgo muy alto (>10% mortalidad)","86-125":"Riesgo alto","66-85":"Riesgo intermedio","51-65":"Riesgo bajo","≤50":"Riesgo muy bajo"}'::jsonb
);

-- 28. FINEARTS-50 (Mortalidad 30 días en neumonía)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'finearts50',
  'FINEARTS-50 (Mortalidad Neumonía 30 días)',
  'Predice mortalidad a 30 días en neumonía comunitaria',
  'neumologia',
  0, 100,
  '{"items":[{"id":"fequencia_respiratoria","label":"Frecuencia respiratoria","opciones":[{"valor":0,"texto":"<20"},{"valor":5,"texto":"20-29"},{"valor":10,"texto":"30-39"},{"valor":15,"texto":"≥40"}]},{"id":"confusión","label":"Confusión/Delirium","opciones":[{"valor":0,"texto":"No"},{"valor":10,"texto":"Sí"}]},{"id":"presión_sistólica","label":"Presión sistólica <90 mmHg","opciones":[{"valor":0,"texto":"No"},{"valor":10,"texto":"Sí"}]},{"id":"fc_taquicardia","label":"FC >125 lpm","opciones":[{"valor":0,"texto":"No"},{"valor":5,"texto":"Sí"}]}]}'::jsonb,
  '{">30":"Riesgo muy alto mortalidad","21-30":"Riesgo alto","11-20":"Riesgo intermedio","1-10":"Riesgo bajo","0":"Sin riesgo adicional"}'::jsonb
);

-- 29. NAFLD (Hígado graso no alcohólico)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'nafld',
  'NAFLD Fibrosis Score',
  'Predice presencia de fibrosis avanzada en NAFLD',
  'hepatologia',
  -3, 1,
  '{"items":[{"id":"edad","label":"Edad (años)","opciones":[{"valor":0,"texto":"Usar edad del paciente"}]},{"id":"imc","label":"IMC (kg/m²)","opciones":[{"valor":0,"texto":"Usar IMC calculado"}]},{"id":"diabetes","label":"Diabetes/Glucosa en ayunas >100","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"ast_alt","label":"Ratio AST/ALT","opciones":[{"valor":0,"texto":"Usar valores de laboratorio"}]},{"id":"plaquetas","label":"Recuento plaquetas (10^9/L)","opciones":[{"valor":0,"texto":"Usar valor de laboratorio"}]}]}'::jsonb,
  '{">0.676":"Riesgo alto fibrosis avanzada - considerar biopsia","-1.455 a 0.676":"Riesgo indeterminado","<-1.455":"Riesgo bajo fibrosis avanzada"}'::jsonb
);

-- 30. INFOSCAN (Infoscan calidad video laringo)
INSERT INTO clinico.catalogo_escalas (codigo, nombre, descripcion, categoria, rango_minimo, rango_maximo, estructura_formulario, interpretacion_json)
VALUES (
  'dswi',
  'Deep Surgical Site Infection Risk (DSWI)',
  'Valora riesgo de infección del sitio quirúrgico profundo',
  'cirugia',
  0, 18,
  '{"items":[{"id":"asa","label":"Clasificación ASA","opciones":[{"valor":0,"texto":"I-II"},{"valor":1,"texto":"III"},{"valor":3,"texto":"IV-V"}]},{"id":"edad","label":"Edad >60 años","opciones":[{"valor":0,"texto":"No"},{"valor":1,"texto":"Sí"}]},{"id":"duracion_cirugia","label":"Duración cirugía >2 horas","opciones":[{"valor":0,"texto":"No"},{"valor":2,"texto":"Sí"}]},{"id":"incision_limpia_contaminada","label":"Incisión limpia-contaminada","opciones":[{"valor":0,"texto":"No"},{"valor":2,"texto":"Sí"}]},{"id":"perdida_sangre","label":"Pérdida sangre >400 mL","opciones":[{"valor":0,"texto":"No"},{"valor":3,"texto":"Sí"}]},{"id":"bmi_bajo","label":"IMC <19","opciones":[{"valor":0,"texto":"No"},{"valor":2,"texto":"Sí"}]},{"id":"enfermedad_previa","label":"Enfermedad crónica severa","opciones":[{"valor":0,"texto":"No"},{"valor":3,"texto":"Sí"}]}]}'::jsonb,
  '{">9":"Riesgo muy alto SSID","5-9":"Riesgo alto","2-4":"Riesgo intermedio","0-1":"Riesgo bajo"}'::jsonb
);

-- 31-40: Más escalas específicas (Prosopagnosia, TIMI, GRACE, Glasgow Coma Recovery, etc.)
-- Se pueden agregar según necesidad y especialidad

-- ============================================================================
-- RLS Y TRIGGERS
-- ============================================================================

-- Habilitar RLS en tabla de escalas
ALTER TABLE clinico.escalas_clinicas ENABLE ROW LEVEL SECURITY;

-- Política: Solo usuarios del mismo hospital pueden ver escalas de sus pacientes
CREATE POLICY escalas_hospital_isolation ON clinico.escalas_clinicas
  USING (
    hospital_id = (
      SELECT hospital_id FROM configuracion.usuarios 
      WHERE id = auth.uid()
    )
  );

-- Trigger: Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION actualizar_updated_at_escalas()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_escalas_updated_at
  BEFORE UPDATE ON clinico.escalas_clinicas
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at_escalas();

-- ============================================================================
-- VISTAS PARA REPORTES
-- ============================================================================

-- Vista: Última escala de cada tipo por paciente
CREATE OR REPLACE VIEW clinico.vw_escalas_ultimas_por_tipo AS
SELECT DISTINCT ON (paciente_id, tipo_escala)
  paciente_id,
  tipo_escala,
  nombre_escala,
  resultado_numerico,
  resultado_texto,
  interpretacion,
  fecha_evaluacion,
  evaluado_por
FROM clinico.escalas_clinicas
ORDER BY paciente_id, tipo_escala, fecha_evaluacion DESC;

-- Vista: Historial de escalas para gráficos de tendencia
CREATE OR REPLACE VIEW clinico.vw_escalas_historial AS
SELECT 
  ec.paciente_id,
  ec.episodio_id,
  ec.tipo_escala,
  ec.nombre_escala,
  ec.resultado_numerico,
  ec.fecha_evaluacion,
  ec.interpretacion,
  p.nombres,
  p.apellidos,
  u.nombres as evaluador_nombres
FROM clinico.escalas_clinicas ec
LEFT JOIN pacientes.pacientes p ON ec.paciente_id = p.id
LEFT JOIN configuracion.usuarios u ON ec.evaluado_por = u.id
ORDER BY ec.paciente_id, ec.tipo_escala, ec.fecha_evaluacion DESC;

-- ============================================================================
-- ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX idx_escalas_validada ON clinico.escalas_clinicas(validada) WHERE validada = FALSE;
CREATE INDEX idx_escalas_paciente_tipo_fecha ON clinico.escalas_clinicas(paciente_id, tipo_escala, fecha_evaluacion DESC);

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
