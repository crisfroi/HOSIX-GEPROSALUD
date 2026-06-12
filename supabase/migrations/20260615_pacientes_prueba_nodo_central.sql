-- =====================================================================
-- PACIENTES DE PRUEBA EN NODO CENTRAL
-- Para probar sincronización desde hospitales locales (HOSIX)
-- =====================================================================

-- Generar HCU para cada paciente usando la función
INSERT INTO nodo_central.pais_pacientes_maestro (
  hcu, cedula, nombre, apellido, fecha_nacimiento, genero,
  centro_salud_origen_id, tipo_sangre, estado, created_at, updated_at
)
SELECT
  nodo_central.fn_generar_hcu(
    cedula,
    nombre_distrito,
    centro_id
  ) AS hcu,
  cedula,
  nombre,
  apellido,
  fecha_nacimiento,
  genero,
  centro_id,
  tipo_sangre,
  'activo',
  now(),
  now()
FROM (
  -- Pacientes de prueba ecuatoguineanos
  VALUES
    -- Pacientes de Malabo (Distrito Sanitario de Malabo)
    ('00100001001', 'José', 'Nguema Ondó', '1975-03-15', 'M', 'Distrito Sanitario de Malabo', 
     (SELECT id FROM nodo_central.centros_salud_copia WHERE nombre = 'HOSPITAL REGIONAL DE MALABO' LIMIT 1), 'O+'),
    
    ('00100001002', 'María', 'Asang Essono', '1982-07-22', 'F', 'Distrito Sanitario de Malabo',
     (SELECT id FROM nodo_central.centros_salud_copia WHERE nombre = 'CENTRO DE SALUD LA AMISTAD' LIMIT 1), 'A+'),
    
    ('00100001003', 'Francisco', 'Obiang Mba', '1988-11-08', 'M', 'Distrito Sanitario de Malabo',
     (SELECT id FROM nodo_central.centros_salud_copia WHERE nombre = 'POLICLÍNICO DR. LOERI COMBA' LIMIT 1), 'B+'),
    
    ('00100001004', 'Antonia', 'Nze Ndong', '1990-05-30', 'F', 'Distrito Sanitario de Malabo',
     (SELECT id FROM nodo_central.centros_salud_copia WHERE nombre = 'CENTRO DE SALUD MADRE BISILA' LIMIT 1), 'O-'),
    
    -- Pacientes de Bata (Distrito Sanitario de Bata)
    ('00200001001', 'Manuel', 'Mokoro Oyana', '1978-09-12', 'M', 'Distrito Sanitario de Bata',
     (SELECT id FROM nodo_central.centros_salud_copia WHERE nombre = 'HOSPITAL REGIONAL DE BATA' LIMIT 1), 'AB+'),
    
    ('00200001002', 'Dolores', 'Ayong Mbá', '1985-02-14', 'F', 'Distrito Sanitario de Bata',
     (SELECT id FROM nodo_central.centros_salud_copia WHERE nombre = 'HOSPITAL NUEVO INSESO DE BATA' LIMIT 1), 'A+'),
    
    ('00200001003', 'Gabriel', 'Mtoro Mangomo', '1992-08-25', 'M', 'Distrito Sanitario de Bata',
     (SELECT id FROM nodo_central.centros_salud_copia WHERE nombre = 'CENTRO SALUD MARÍA GAY' LIMIT 1), 'O+'),
    
    ('00200001004', 'Rosa', 'Asumu Mbá', '1988-01-18', 'F', 'Distrito Sanitario de Bata',
     (SELECT id FROM nodo_central.centros_salud_copia WHERE nombre = 'CENTRO DE SALUD UKOMBA' LIMIT 1), 'B-'),
    
    -- Pacientes de Ebebiyin (Distrito Sanitario de Ebebiyin)
    ('00300001001', 'Enrique', 'Beyó Nguema', '1980-06-20', 'M', 'Distrito Sanitario de Ebebiyin',
     (SELECT id FROM nodo_central.centros_salud_copia WHERE nombre = 'HOSPITAL INSESO EBIBEYIN' LIMIT 1), 'O+'),
    
    ('00300001002', 'Catalina', 'Eke Ondo', '1987-04-11', 'F', 'Distrito Sanitario de Ebebiyin',
     (SELECT id FROM nodo_central.centros_salud_copia WHERE nombre = 'HOSPITAL LA PAZ AMISTAD LÍBANO GUINEA  ECUATORIAL DE EBIBEYIN' LIMIT 1), 'A+'),
    
    -- Pacientes de Evinayong (Distrito Sanitario de Evinayong)
    ('00400001001', 'Aurelio', 'Moto Nsue', '1976-12-05', 'M', 'Distrito Sanitario de Evinayong',
     (SELECT id FROM nodo_central.centros_salud_copia WHERE nombre = 'HOSPITAL PROVINCIAL DE EVINAYONG' LIMIT 1), 'B+'),
    
    ('00400001002', 'Leonor', 'Mba Eyi', '1989-10-19', 'F', 'Distrito Sanitario de Evinayong',
     (SELECT id FROM nodo_central.centros_salud_copia WHERE nombre = 'HOSPITAL AMISTAD CHINA GUINEA ECUATORIAL' LIMIT 1), 'O+'),
    
    -- Pacientes de Mongomo (Distrito Sanitario de Mongomo)
    ('00500001001', 'Benjamín', 'Mba Mefane', '1981-03-22', 'M', 'Distrito Sanitario de Mongomo',
     (SELECT id FROM nodo_central.centros_salud_copia WHERE nombre = 'HOSPITAL PROVINCIAL DE MONGOMO' LIMIT 1), 'AB-'),
    
    ('00500001002', 'Modesta', 'Nguema Mba', '1986-07-09', 'F', 'Distrito Sanitario de Mongomo',
     (SELECT id FROM nodo_central.centros_salud_copia WHERE nombre = 'CLINICA VIRGEN DE GUADALUPE DE MONGOMO' LIMIT 1), 'A+'),
    
    -- Pacientes de Luba (Distrito Sanitario de Luba)
    ('00600001001', 'Hipólito', 'Ondo Mba', '1979-11-14', 'M', 'Distrito Sanitario de Luba',
     (SELECT id FROM nodo_central.centros_salud_copia WHERE nombre = 'HOSPITAL PROVINCIAL DE LUBA' LIMIT 1), 'O+'),
    
    ('00600001002', 'Remedios', 'Nsiema Eyi', '1991-09-03', 'F', 'Distrito Sanitario de Luba',
     (SELECT id FROM nodo_central.centros_salud_copia WHERE nombre = 'CENTRO DE SALUD DE BATETE' LIMIT 1), 'B+')
     
) AS pacientes(cedula, nombre, apellido, fecha_nacimiento, genero, nombre_distrito, centro_id, tipo_sangre)
ON CONFLICT (cedula) DO NOTHING;

-- =====================================================================
-- LOG DE INSERCIÓN
-- =====================================================================
INSERT INTO nodo_central.sincronizacion_log (tipo_evento, entidad_tipo, estado, datos_nuevos)
SELECT
  'pacientes_prueba_insertados',
  'pacientes',
  'exitoso',
  jsonb_build_object(
    'pacientes_creados', (SELECT COUNT(*) FROM nodo_central.pais_pacientes_maestro),
    'timestamp', now()::text
  );

-- =====================================================================
-- VERIFICACIÓN Y RESUMEN
-- =====================================================================
SELECT '=== PACIENTES DE PRUEBA CREADOS EN NODO CENTRAL ===' as estado;

SELECT 
  COUNT(*) as total_pacientes,
  COUNT(DISTINCT genero) as generos_diferentes,
  MIN(fecha_nacimiento) as paciente_mas_antiguo,
  MAX(fecha_nacimiento) as paciente_mas_joven
FROM nodo_central.pais_pacientes_maestro;

-- Ver pacientes por centro
SELECT 
  c.nombre as centro,
  d.nombre_distrito as distrito,
  COUNT(p.id) as num_pacientes
FROM nodo_central.centros_salud_copia c
LEFT JOIN nodo_central.distritos_sanitarios_copia d ON c.distrito_sanitario = d.nombre_distrito
LEFT JOIN nodo_central.pais_pacientes_maestro p ON p.centro_salud_origen_id = c.id
WHERE COUNT(p.id) > 0 OR c.id IN (
  SELECT DISTINCT centro_salud_origen_id FROM nodo_central.pais_pacientes_maestro
)
GROUP BY c.id, c.nombre, d.nombre_distrito
ORDER BY COUNT(p.id) DESC;

-- Ver HCU generados
SELECT 
  hcu,
  cedula,
  nombre || ' ' || apellido as nombre_completo,
  genero,
  (SELECT nombre FROM nodo_central.centros_salud_copia WHERE id = p.centro_salud_origen_id) as centro_origen,
  estado
FROM nodo_central.pais_pacientes_maestro p
ORDER BY cedula;
