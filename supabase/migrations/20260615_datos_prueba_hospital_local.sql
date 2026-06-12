-- Datos de prueba para hospital_local schema
-- Ejecutar DESPUÉS de aplicar 20260614_hospital_local_schema.sql

-- Limpiar datos existentes (en caso de re-ejecución)
DELETE FROM hospital_local.distritos_sincronizado;
DELETE FROM hospital_local.centros_salud_sincronizado;
DELETE FROM hospital_local.profesionales_sincronizado;
DELETE FROM hospital_local.pacientes_maestro_local;
DELETE FROM hospital_local.pacientes_pendientes_sync;
DELETE FROM hospital_local.hcu_mapping;
DELETE FROM hospital_local.sync_queue;

-- 1. DISTRITOS SINCRONIZADOS (copia del Nodo Central)
INSERT INTO hospital_local.distritos_sincronizado (
  codigo_provincia,
  nombre_distrito,
  region_sanitaria,
  estado_sync,
  sincronizado_en
) VALUES
  ('01', 'Bioko Norte', 'Región I', 'activo', now()),
  ('02', 'Bioko Sur', 'Región I', 'activo', now()),
  ('03', 'Littoral', 'Región II', 'activo', now()),
  ('04', 'Centro Sur', 'Región II', 'activo', now()),
  ('05', 'Kié-Ntem', 'Región III', 'activo', now()),
  ('06', 'Wele-Nzas', 'Región III', 'activo', now());

-- 2. CENTROS DE SALUD SINCRONIZADOS
INSERT INTO hospital_local.centros_salud_sincronizado (
  nombre,
  tipo,
  nombre_distrito,
  responsable,
  estado,
  sincronizado_en
) VALUES
  ('Hospital General de Malabo', 'Hospital', 'Bioko Norte', 'Dr. Francisco García', 'Activo', now()),
  ('Centro de Salud Punta Europa', 'Centro', 'Bioko Norte', 'Dra. María López', 'Activo', now()),
  ('Hospital de Bata', 'Hospital', 'Littoral', 'Dr. Juan Martínez', 'Activo', now()),
  ('Centro de Salud Bata Centro', 'Centro', 'Littoral', 'Dra. Rosa Núñez', 'Activo', now()),
  ('Centro de Salud Luba', 'Centro', 'Bioko Sur', 'Dr. Carlos Sánchez', 'Activo', now()),
  ('Hospital de Ebebiyín', 'Hospital', 'Kié-Ntem', 'Dr. Pedro González', 'Activo', now());

-- 3. PROFESIONALES SINCRONIZADOS
INSERT INTO hospital_local.profesionales_sincronizado (
  nombre_completo,
  especialidad,
  numero_colegiado,
  nombre_distrito,
  centro_salud,
  estado_solicitud,
  sincronizado_en
) VALUES
  ('Dr. Francisco García Martínez', 'Medicina General', 'CM-001', 'Bioko Norte', 'Hospital General de Malabo', 'Aprobado', now()),
  ('Dra. María López Fernández', 'Enfermería', 'EN-002', 'Bioko Norte', 'Centro de Salud Punta Europa', 'Aprobado', now()),
  ('Dr. Juan Martínez González', 'Cirugía', 'CI-003', 'Littoral', 'Hospital de Bata', 'Aprobado', now()),
  ('Dra. Rosa Núñez Sánchez', 'Pediatría', 'PE-004', 'Littoral', 'Centro de Salud Bata Centro', 'Aprobado', now()),
  ('Dr. Carlos Sánchez Rodríguez', 'Medicina Interna', 'MI-005', 'Bioko Sur', 'Centro de Salud Luba', 'Aprobado', now()),
  ('Dra. Elena Díaz García', 'Ginecología', 'GI-006', 'Kié-Ntem', 'Hospital de Ebebiyín', 'Aprobado', now());

-- 4. PACIENTES MAESTRO LOCAL (con HCU reales de ejemplo)
INSERT INTO hospital_local.pacientes_maestro_local (
  hcu,
  cedula,
  nombre,
  apellido,
  fecha_nacimiento,
  genero,
  estado
) VALUES
  ('HCU-0001-BN-2024-001', '00123456789', 'Juan', 'Pérez', '1980-05-15', 'M', 'activo'),
  ('HCU-0001-BN-2024-002', '00123456790', 'María', 'García', '1990-08-20', 'F', 'activo'),
  ('HCU-0001-BN-2024-003', '00123456791', 'Carlos', 'López', '1975-12-10', 'M', 'activo'),
  ('HCU-0001-LT-2024-004', '00123456792', 'Rosa', 'Martínez', '1985-03-25', 'F', 'activo'),
  ('HCU-0001-LT-2024-005', '00123456793', 'Pedro', 'Rodríguez', '1995-07-08', 'M', 'activo');

-- 5. PACIENTES PENDIENTES DE SINCRONIZACIÓN (con HCU temporales)
INSERT INTO hospital_local.pacientes_pendientes_sync (
  cedula,
  nombre,
  apellido,
  fecha_nacimiento,
  genero,
  nombre_distrito,
  hcu_temporal,
  estado,
  creado_en,
  sincronizado_en
) VALUES
  ('00123456794', 'Ana', 'Fernández', '1988-06-18', 'F', 'Bioko Norte', 'TEMP-BN-001-2024', 'pendiente', now(), NULL),
  ('00123456795', 'Luis', 'González', '1992-09-30', 'M', 'Littoral', 'TEMP-LT-002-2024', 'pendiente', now(), NULL),
  ('00123456796', 'Sofia', 'Hernández', '1987-01-14', 'F', 'Bioko Sur', 'TEMP-BS-003-2024', 'completado', now(), now()),
  ('00123456797', 'Diego', 'Torres', '1998-11-22', 'M', 'Kié-Ntem', 'TEMP-KN-004-2024', 'completado', now(), now());

-- 6. MAPEOS HCU (temporal → real)
INSERT INTO hospital_local.hcu_mapping (
  hcu_temporal,
  hcu_real,
  cedula,
  paciente_pendientes_id,
  sincronizado_en
) VALUES
  ('TEMP-BS-003-2024', 'HCU-0001-BS-2024-006', '00123456796', 
   (SELECT id FROM hospital_local.pacientes_pendientes_sync WHERE cedula = '00123456796' LIMIT 1),
   now()),
  ('TEMP-KN-004-2024', 'HCU-0001-KN-2024-007', '00123456797',
   (SELECT id FROM hospital_local.pacientes_pendientes_sync WHERE cedula = '00123456797' LIMIT 1),
   now());

-- 7. COLA DE SINCRONIZACIÓN (cambios pendientes)
INSERT INTO hospital_local.sync_queue (
  accion,
  entidad_tipo,
  entidad_id,
  datos_nuevos,
  estado,
  numero_intento,
  prioridad
) VALUES
  ('crear', 'paciente', (SELECT id FROM hospital_local.pacientes_pendientes_sync WHERE cedula = '00123456794' LIMIT 1),
   '{
     "cedula": "00123456794",
     "nombre": "Ana",
     "apellido": "Fernández",
     "fecha_nacimiento": "1988-06-18",
     "nombre_distrito": "Bioko Norte",
     "genero": "F"
   }'::jsonb,
   'pendiente', 0, 1),
  ('crear', 'paciente', (SELECT id FROM hospital_local.pacientes_pendientes_sync WHERE cedula = '00123456795' LIMIT 1),
   '{
     "cedula": "00123456795",
     "nombre": "Luis",
     "apellido": "González",
     "fecha_nacimiento": "1992-09-30",
     "nombre_distrito": "Littoral",
     "genero": "M"
   }'::jsonb,
   'pendiente', 0, 1);

-- 8. LOG DE SINCRONIZACIÓN
INSERT INTO hospital_local.sync_log_local (
  tipo_evento,
  entidad_tipo,
  detalles,
  estado
) VALUES
  ('inicializacion', 'hospital_local', '{"mensaje": "Hospital inicializado con datos de prueba", "registros": 5}'::jsonb, 'exitoso'),
  ('sincronizacion_completada', 'pacientes', '{"pacientes_sincronizados": 2, "mapeos_creados": 2}'::jsonb, 'exitoso'),
  ('error_sincronizacion', 'pacientes', '{"cedula": "00123456794", "error": "Timeout en conexión"}'::jsonb, 'error');

-- Verificación final
SELECT '=== DATOS DE PRUEBA INSERTADOS ===' as estado;
SELECT COUNT(*) as distritos FROM hospital_local.distritos_sincronizado;
SELECT COUNT(*) as centros FROM hospital_local.centros_salud_sincronizado;
SELECT COUNT(*) as profesionales FROM hospital_local.profesionales_sincronizado;
SELECT COUNT(*) as pacientes_maestro FROM hospital_local.pacientes_maestro_local;
SELECT COUNT(*) as pacientes_pendientes FROM hospital_local.pacientes_pendientes_sync;
SELECT COUNT(*) as mapeos FROM hospital_local.hcu_mapping;
SELECT COUNT(*) as en_cola FROM hospital_local.sync_queue;
