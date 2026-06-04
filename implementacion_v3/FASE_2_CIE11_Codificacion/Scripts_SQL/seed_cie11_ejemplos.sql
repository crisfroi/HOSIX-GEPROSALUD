-- ============================================================================
-- SEED DATA: DIAGNÓSTICOS CIE-11 DE EJEMPLO
-- ============================================================================
-- Copiar y ejecutar en Supabase SQL Editor
-- Propósito: Cargar diagnósticos comunes CIE-11 para testing y uso inicial

-- ============================================================================
-- 1. INFECCIONES Y PARASITOSIS (Capítulo BA)
-- ============================================================================

INSERT INTO hosix_cie11_cache (
  codigo_cie11, linearization_uri, foundation_uri,
  titulo_es, descripcion_es,
  capitulo_codigo, capitulo_titulo_es,
  bloque_codigo, bloque_titulo_es,
  cie10_equivalente
) VALUES

-- Tuberculosis pulmonar
('BA12.34', 'http://id.who.int/icd/entity/XN2V10', 'http://id.who.int/icd/foundation/XN2V10',
 'Tuberculosis pulmonar', 'Infección por Mycobacterium tuberculosis del pulmón',
 'BA', 'Enfermedades infecciosas',
 'BA1', 'Tuberculosis',
 'A15'),

-- COVID-19
('RA01.0', 'http://id.who.int/icd/entity/XN109Y', 'http://id.who.int/icd/foundation/XN109Y',
 'COVID-19', 'Enfermedad por coronavirus 2019',
 'RA', 'Enfermedades infecciosas virales',
 'RA0', 'Enfermedades por coronavirus',
 'U07.1'),

-- Influenza
('BA45', 'http://id.who.int/icd/entity/XN3ZE63', 'http://id.who.int/icd/foundation/XN3ZE63',
 'Influenza estacional', 'Infección por virus de influenza',
 'BA', 'Enfermedades infecciosas',
 'BA4', 'Enfermedades por virus respiratorios',
 'J09', true),

-- Neumonía bacteriana
('BA26', 'http://id.who.int/icd/entity/XN8V5B3', 'http://id.who.int/icd/foundation/XN8V5B3',
 'Neumonía bacteriana', 'Inflamación pulmonar causada por bacterias',
 'BA', 'Enfermedades infecciosas',
 'BA2', 'Infecciones del tracto respiratorio',
 'J15', true),

-- ============================================================================
-- 2. ENFERMEDADES ENDOCRINAS (Capítulo 5A)
-- ============================================================================

-- Diabetes mellitus tipo 1
('5A11.1', 'http://id.who.int/icd/entity/XN4BZ9', 'http://id.who.int/icd/foundation/XN4BZ9',
 'Diabetes mellitus tipo 1', 'Trastorno endocrino autoinmune',
 '5A', 'Enfermedades endocrinas, nutricionales o metabólicas',
 '5A1', 'Diabetes mellitus',
 'E10', true),

-- Diabetes mellitus tipo 2
('5A12', 'http://id.who.int/icd/entity/XN4CY0', 'http://id.who.int/icd/foundation/XN4CY0',
 'Diabetes mellitus tipo 2', 'Trastorno metabólico',
 '5A', 'Enfermedades endocrinas, nutricionales o metabólicas',
 '5A1', 'Diabetes mellitus',
 'E11', true),

-- Hipotiroidismo
('5A80', 'http://id.who.int/icd/entity/XN3SQI3', 'http://id.who.int/icd/foundation/XN3SQI3',
 'Hipotiroidismo', 'Insuficiencia de hormonas tiroideas',
 '5A', 'Enfermedades endocrinas, nutricionales o metabólicas',
 '5A8', 'Enfermedades de la glándula tiroidea',
 'E03', true),

-- Obesidad
('5B81', 'http://id.who.int/icd/entity/XN3NHP5', 'http://id.who.int/icd/foundation/XN3NHP5',
 'Obesidad', 'Sobrepeso crónico significativo',
 '5A', 'Enfermedades endocrinas, nutricionales o metabólicas',
 '5B8', 'Desnutrición y sobrepeso',
 'E66', true),

-- ============================================================================
-- 3. ENFERMEDADES DEL SISTEMA CARDIOVASCULAR (Capítulo BA / BD)
-- ============================================================================

-- Hipertensión esencial
('BA00.10', 'http://id.who.int/icd/entity/XN0BI63', 'http://id.who.int/icd/foundation/XN0BI63',
 'Hipertensión esencial', 'Presión arterial elevada sin causa secundaria',
 'BA', 'Enfermedades del sistema circulatorio',
 'BA0', 'Hipertensión',
 'I10', true),

-- Infarto agudo del miocardio
('BA41', 'http://id.who.int/icd/entity/XN08V0', 'http://id.who.int/icd/foundation/XN08V0',
 'Infarto agudo del miocardio', 'Necrosis del tejido cardíaco',
 'BA', 'Enfermedades del sistema circulatorio',
 'BA4', 'Enfermedades isquémicas del corazón',
 'I21', true),

-- Insuficiencia cardíaca
('BA50', 'http://id.who.int/icd/entity/XN0DI71', 'http://id.who.int/icd/foundation/XN0DI71',
 'Insuficiencia cardíaca', 'Incapacidad del corazón de bombear sangre',
 'BA', 'Enfermedades del sistema circulatorio',
 'BA5', 'Enfermedades del corazón',
 'I50', true),

-- Accidente cerebrovascular isquémico
('BA4.0', 'http://id.who.int/icd/entity/XN29MZ7', 'http://id.who.int/icd/foundation/XN29MZ7',
 'Accidente cerebrovascular isquémico', 'Obstrucción del flujo sanguíneo cerebral',
 'BA', 'Enfermedades del sistema circulatorio',
 'BA4', 'Enfermedades cerebrovasculares',
 'I63', true),

-- ============================================================================
-- 4. ENFERMEDADES DEL SISTEMA RESPIRATORIO (Capítulo BA)
-- ============================================================================

-- Asma bronquial
('CA25', 'http://id.who.int/icd/entity/XN2V10', 'http://id.who.int/icd/foundation/XN2V10',
 'Asma bronquial', 'Enfermedad inflamatoria de las vías aéreas',
 'CA', 'Enfermedades del sistema respiratorio',
 'CA2', 'Enfermedades crónicas de las vías aéreas',
 'J45', true),

-- EPOC (Enfermedad Pulmonar Obstructiva Crónica)
('CA25.1', 'http://id.who.int/icd/entity/XN5F3J5', 'http://id.who.int/icd/foundation/XN5F3J5',
 'Enfermedad Pulmonar Obstructiva Crónica', 'Limitación persistente del flujo aéreo',
 'CA', 'Enfermedades del sistema respiratorio',
 'CA2', 'Enfermedades crónicas de las vías aéreas',
 'J44', true),

-- ============================================================================
-- 5. ENFERMEDADES DEL SISTEMA DIGESTIVO (Capítulo DA)
-- ============================================================================

-- Gastritis
('DA90.01', 'http://id.who.int/icd/entity/XN4QT19', 'http://id.who.int/icd/foundation/XN4QT19',
 'Gastritis aguda', 'Inflamación aguda de la mucosa gástrica',
 'DA', 'Enfermedades del sistema digestivo',
 'DA9', 'Enfermedades del estómago',
 'K29', true),

-- Úlcera péptica
('DA92.01', 'http://id.who.int/icd/entity/XN1VWH9', 'http://id.who.int/icd/foundation/XN1VWH9',
 'Úlcera duodenal', 'Pérdida de continuidad de la mucosa duodenal',
 'DA', 'Enfermedades del sistema digestivo',
 'DA9', 'Enfermedades del estómago y duodeno',
 'K26', true),

-- Diarrea
('DA90.4', 'http://id.who.int/icd/entity/XN1GH8I', 'http://id.who.int/icd/foundation/XN1GH8I',
 'Diarrea', 'Aumento de frecuencia y fluidez de deposiciones',
 'DA', 'Enfermedades del sistema digestivo',
 'DA9', 'Síntomas y signos',
 'A09', true),

-- ============================================================================
-- 6. ENFERMEDADES DEL SISTEMA NERVIOSO Y MENTAL (Capítulo 8A)
-- ============================================================================

-- Depresión mayor
('8A40.1', 'http://id.who.int/icd/entity/XN9QR68', 'http://id.who.int/icd/foundation/XN9QR68',
 'Trastorno depresivo mayor', 'Episodio depresivo de duración prolongada',
 '8A', 'Trastornos mentales o del comportamiento',
 '8A4', 'Trastornos depresivos',
 'F32', true),

-- Ansiedad
('8A85.1', 'http://id.who.int/icd/entity/XN16M3F', 'http://id.who.int/icd/foundation/XN16M3F',
 'Trastorno de ansiedad generalizada', 'Preocupación excesiva y persistente',
 '8A', 'Trastornos mentales o del comportamiento',
 '8A8', 'Trastornos de ansiedad',
 'F41', true),

-- Migraña
('8A81', 'http://id.who.int/icd/entity/XN7TH3D', 'http://id.who.int/icd/foundation/XN7TH3D',
 'Migraña', 'Cefalea vascular recurrente',
 '8A', 'Trastornos del sistema nervioso',
 '8A8', 'Migraña',
 'G43', true),

-- Epilepsia
('8A61', 'http://id.who.int/icd/entity/XN0JZ7X', 'http://id.who.int/icd/foundation/XN0JZ7X',
 'Epilepsia', 'Tendencia a sufrir convulsiones recurrentes',
 '8A', 'Trastornos del sistema nervioso',
 '8A6', 'Epilepsia',
 'G40', true),

-- ============================================================================
-- 7. ENFERMEDADES DEL SISTEMA GENITOURINARIO (Capítulo GB)
-- ============================================================================

-- Infección urinaria
('GB12.00', 'http://id.who.int/icd/entity/XN7W0K3', 'http://id.who.int/icd/foundation/XN7W0K3',
 'Infección urinaria no especificada', 'Infección del tracto urinario',
 'GB', 'Enfermedades del sistema genitourinario',
 'GB1', 'Infecciones de localización específica',
 'N39.0', true),

-- Insuficiencia renal crónica
('GB41.11', 'http://id.who.int/icd/entity/XN72K2Z', 'http://id.who.int/icd/foundation/XN72K2Z',
 'Enfermedad renal crónica - Estadio 3a', 'Reducción moderada de TFG',
 'GB', 'Enfermedades del sistema genitourinario',
 'GB4', 'Enfermedades del riñón',
 'N18.3', true),

-- ============================================================================
-- 8. ENFERMEDADES DEL SISTEMA MUSCULOESQUELÉTICO (Capítulo HA)
-- ============================================================================

-- Artrosis de rodilla
('HA23', 'http://id.who.int/icd/entity/XN4B37X', 'http://id.who.int/icd/foundation/XN4B37X',
 'Artrosis primaria de rodilla', 'Degeneración del cartílago articular',
 'HA', 'Enfermedades del sistema musculoesquelético',
 'HA2', 'Artrosis',
 'M17', true),

-- Lumbalgia
('HA84.01', 'http://id.who.int/icd/entity/XN0FU0Y', 'http://id.who.int/icd/foundation/XN0FU0Y',
 'Lumbalgia', 'Dolor en región lumbar',
 'HA', 'Enfermedades del sistema musculoesquelético',
 'HA8', 'Trastornos de la columna vertebral',
 'M54.5', true),

-- Osteoporosis
('HA81', 'http://id.who.int/icd/entity/XN5UN88', 'http://id.who.int/icd/foundation/XN5UN88',
 'Osteoporosis', 'Disminución de la densidad mineral ósea',
 'HA', 'Enfermedades del sistema musculoesquelético',
 'HA8', 'Enfermedades óseas',
 'M81', true),

-- ============================================================================
-- 9. ENFERMEDADES DE LA PIEL Y TEJIDO SUBCUTÁNEO (Capítulo EA)
-- ============================================================================

-- Dermatitis
('EA89.0', 'http://id.who.int/icd/entity/XN3VVF9', 'http://id.who.int/icd/foundation/XN3VVF9',
 'Dermatitis de contacto', 'Inflamación de la piel por agente irritante',
 'EA', 'Enfermedades de la piel y tejido subcutáneo',
 'EA8', 'Dermatitis',
 'L25', true),

-- Micosis
('EA89.5', 'http://id.who.int/icd/entity/XN5CW77', 'http://id.who.int/icd/foundation/XN5CW77',
 'Infección micótica de la piel', 'Infección por hongos',
 'EA', 'Enfermedades de la piel y tejido subcutáneo',
 'EA8', 'Infecciones de la piel',
 'B35', true),

-- Acné
('EA80.0', 'http://id.who.int/icd/entity/XN2GI53', 'http://id.who.int/icd/foundation/XN2GI53',
 'Acné vulgaris', 'Enfermedad inflamatoria de las glándulas sebáceas',
 'EA', 'Enfermedades de la piel y tejido subcutáneo',
 'EA8', 'Enfermedades de las glándulas sebáceas y sudoríparas',
 'L70', true),

ON CONFLICT (linearization_uri) DO NOTHING;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT 
  COUNT(*) as total_diagnosticos_cargados,
  COUNT(DISTINCT capitulo_codigo) as capitulos,
  COUNT(DISTINCT bloque_codigo) as bloques
FROM hosix_cie11_cache
WHERE codigo_cie11 IS NOT NULL;

-- Listar diagnósticos cargados
SELECT
  codigo_cie11,
  titulo_es,
  capitulo_titulo_es,
  cie10_equivalente
FROM hosix_cie11_cache
ORDER BY capitulo_codigo, bloque_codigo, codigo_cie11;
