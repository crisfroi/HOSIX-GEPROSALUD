# Análisis: Integración RENAPROSA con Nodo Central - OPTIMIZADO

## Estrategia: Triggers + Copias Locales (SIN Cron Jobs)

La sincronización ahora ocurre **instantáneamente** cuando se crean/actualizan datos en RENAPROSA. Las copias locales en Nodo Central se mantienen siempre en sync sin necesidad de cron jobs complejos.

---

## 1. Estructura Actual de RENAPROSA

### Base de Datos Principal
```
RENAPROSA (Registro Nacional de Profesionales Sanitarios)
├── Tabla: centros_salud
│   ├─ id (PK)
│   ├─ nombre
│   ├─ categoria
│   ├─ sector
│   ├─ provincia
│   ├─ distrito
│   ├─ distrito_sanitario
│   ├─ director
│   ├─ telefono
│   ├─ subcategoria
│   └─ estado (pendiente_validacion, validado, rechazado)
│
├── Tabla: profesionales_sanitarios
│   ├─ id (PK)
│   ├─ nombre_completo
│   ├─ area_profesional / area_profesional_id (FK)
│   ├─ centro_salud_id (FK a centros_salud)
│   ├─ nombre_centro (desnormalizado)
│   ├─ estado_solicitud (Aprobado, Rechazado, Pendiente)
│   ├─ numero_carnet_profesional
│   ├─ fecha_graduacion
│   ├─ lugar_trabajo
│   ├─ provincia
│   ├─ genero
│   ├─ tipo_sector
│   ├─ distrito
│   ├─ distrito_sanitario
│   └─ estatus_funcionario (nombrado, no_nombrado)
│
├── Tabla: distrito_sanitario
│   ├─ id (PK)
│   ├─ nombre_distrito
│   ├─ nombre_provincia
│   ├─ abreviatura_distrito
│   └─ abreviatura_provincia
│
└── Tabla: profesional_centro_asignado
    ├─ id (PK)
    ├─ id_profesional (FK)
    ├─ nombre_centro
    └─ [otros campos de relación]
```

### Frontend RENAPROSA
- `useCentrosSalud()` → buscar, crear, actualizar, eliminar centros
- `useProfesionales()` → filtrar profesionales por múltiples criterios
- `useDistritosSanitarios()` → obtener distritos por provincia
- `useCenterSync()` → sincronizar centros desde registro de profesionales

---

## 2. Visión: Nodo Central Integrado

### Arquitectura Propuesta

```
┌────────────────────────────────────────────────────────────┐
│  RENAPROSA (Proyecto Supabase Existente)                  │
│  wdieynendfjbkbhfovrx.supabase.co                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Schema: public (actual)                                  │
│  ├─ centros_salud                                         │
│  ├─ profesionales_sanitarios                              │
│  ├─ distrito_sanitario                                    │
│  └─ profesional_centro_asignado                           │
│                                                            │
│  Schema: nodo_central (NUEVO)                             │
│  ├─ pais_pacientes_maestro (HCU único)                    │
│  ├─ tarjetas_sanitarias (TS por hospital)                 │
│  ├─ pais_historico_clinico                                │
│  ├─ sincronizacion_log                                    │
│  └─ hospital_profesional_mapping                          │
│                                                            │
│  Schema: sincronizacion_hospitals (NUEVO)                 │
│  ├─ sync_hospital_HOSXXX (por cada hospital)              │
│  │   ├─ centros_salud_local (copia local)                 │
│  │   ├─ profesionales_local (copia local)                 │
│  │   └─ pacientes_mpi (con HCU)                           │
│  └─ sync_log_global                                       │
│                                                            │
│  Edge Functions / Cron Jobs                               │
│  ├─ sync-hospitals-a-central (cada 1h)                    │
│  ├─ sync-central-a-hospitals (cada 1h)                    │
│  └─ procesar-hcu-nuevos (en tiempo real)                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Ventajas
✅ RENAPROSA ya tiene centros y profesionales bien clasificados
✅ Nodo Central vive en el mismo proyecto (no requiere BD separada)
✅ Sincronización automática cada 1h via Cron Jobs
✅ Cada hospital tendrá una "foto local" sincronizada
✅ HCU (Historia Clínica Única) generado centralmente, usado localmente

---

## 3. Tablas Nuevas a Crear (en RENAPROSA) - OPTIMIZADAS

### Tablas Principales
```sql
-- A. Historia Clínica Única Nacional
nodo_central.pais_pacientes_maestro
├─ id, hcu, cedula, nombre, apellido, fecha_nacimiento
├─ centro_salud_origen_id (FK a centros_salud_copia)
├─ alergias, condiciones_cronicas (JSON)
├─ estado, created_at, updated_at

-- B. Copias Locales de Centros (SINCRONIZADAS VÍA TRIGGER)
nodo_central.centros_salud_copia
├─ id (PK, mismo de public.centros_salud)
├─ nombre, categoria, provincia, distrito, distrito_sanitario
├─ especialidades, estado
├─ sincronizado_desde_renaprosa (timestamp)
├─ version_renaprosa (contador)

-- C. Copias Locales de Profesionales (SINCRONIZADAS VÍA TRIGGER)
nodo_central.profesionales_copia
├─ id (PK, mismo de public.profesionales_sanitarios)
├─ nombre_completo, numero_dip, area_profesional
├─ centro_salud_id (FK a centros_salud_copia)
├─ estado_solicitud, fecha_aprobacion
├─ sincronizado_desde_renaprosa (timestamp)
├─ version_renaprosa (contador)

-- D. Log de Auditoría
nodo_central.sincronizacion_log
├─ id, tipo_evento (centro_sync, profesional_sync, hcu_generado)
├─ entidad_tipo, entidad_id
├─ datos_anteriores, datos_nuevos (JSON diff)
├─ estado, mensaje_error
├─ timestamp
```

---

## 4. Flujo de Sincronización OPTIMIZADO (Instantáneo vía Triggers)

### Paso 1: Crear Centro en RENAPROSA
```
Admin en RENAPROSA:
  INSERT INTO public.centros_salud (nombre, categoria, estado, ...)

Automáticamente (VÍA TRIGGER tg_centros_salud_sync):
  1. Trigger dispara: AFTER INSERT OR UPDATE
  2. Función nodo_central.fn_sincronizar_centro() ejecuta:
     - INSERT INTO nodo_central.centros_salud_copia (copia local)
     - INSERT INTO nodo_central.sincronizacion_log (auditoría)
  3. Log muestra: 'centro_sincronizado', estado='exitoso'

Resultado:
  ✅ Centro disponible en Nodo Central al instante
  ✅ Sin esperar 1 hora, sin cron jobs
```

### Paso 2: Aprobar Profesional en RENAPROSA
```
Admin en RENAPROSA:
  UPDATE public.profesionales_sanitarios SET estado_solicitud = 'Aprobado' WHERE id = ?

Automáticamente (VÍA TRIGGER tg_profesionales_sync):
  1. Trigger dispara: AFTER UPDATE
  2. Si estado_solicitud == 'Aprobado':
     - Función nodo_central.fn_sincronizar_profesional() ejecuta:
       - INSERT/UPDATE nodo_central.profesionales_copia
       - INSERT nodo_central.sincronizacion_log
  3. Log muestra: 'profesional_sincronizado', estado='exitoso'

Resultado:
  ✅ Profesional disponible en Nodo Central al instante
  ✅ Links correctos al centro_salud_id
```

### Paso 3: HOSIX Crea Paciente (RPC a Nodo Central)
```
Enfermero en HOSIX:
  POST /generar-hcu-paciente-nuevo
  {cedula, nombre, apellido, provincia, centro_salud_id}

Edge Function:
  1. Genera HCU vía nodo_central.fn_generar_hcu()
  2. INSERT INTO nodo_central.pais_pacientes_maestro (HCU único)
  3. INSERT INTO nodo_central.sincronizacion_log (auditoría)
  4. Retorna: {hcu, paciente_id, mensaje}

Resultado:
  ✅ Paciente tiene HCU único nacional
  ✅ Log registra la creación
  ✅ Disponible para próximas visitas
```

### Paso 4: HOSIX Busca Paciente (SELECT desde copias)
```
Enfermero en HOSIX:
  SELECT * FROM nodo_central.pais_pacientes_maestro WHERE cedula = ?

Respuesta:
  ✅ HCU anterior + alergias + condiciones crónicas
  ✅ Datos desde Nodo Central (no RENAPROSA)
  ✅ Sin latencia (copias locales)

Caso 2: Buscar profesionales disponibles
  SELECT * FROM nodo_central.profesionales_copia
  WHERE centro_salud_id = ? AND estado_solicitud = 'Aprobado'

Resultado:
  ✅ Lista de profesionales con su especialidad
  ✅ Datos desde copias locales (actualizadas vía trigger)
```

---

## 5. Edge Functions Necesarias (Optimizadas)

### `generar-hcu-paciente-nuevo` ⭐
**Cuándo:** Cuando HOSIX necesita crear un paciente
**Qué hace:**
- Valida que cédula no existe
- Llamada RPC a `nodo_central.fn_generar_hcu()`
- Inserta en `pais_pacientes_maestro`
- Log en `sincronizacion_log`
- Retorna HCU

### `consultar-estado-sincronizacion`
**Cuándo:** Para reportes y auditoría
**Qué hace:**
- Cuenta centros sincronizados
- Cuenta profesionales sincronizados
- Cuenta pacientes con HCU
- Retorna últimos logs de sincronización

**NO necesarios:**
- ❌ `sync-renaprosa-a-central` (ahora es TRIGGER)
- ❌ `sync-central-a-hospitals` (no es necesario, HOSIX consulta directo)
- ❌ Cron jobs complejos (Triggers son instantáneos)

---

## 6. Timeline de Sincronización (Instantáneo)

```
EVENTOS EN RENAPROSA:
├─ INSERT/UPDATE centros_salud
│  └─ ⚡ TRIGGER dispara instantáneamente
│     └─ Copia local en nodo_central.centros_salud_copia SINCRONIZADA
│
├─ UPDATE profesionales_sanitarios (estado_solicitud = 'Aprobado')
│  └─ ⚡ TRIGGER dispara instantáneamente
│     └─ Copia local en nodo_central.profesionales_copia SINCRONIZADA
│
└─ [Sin delay, sin cron jobs, SIN DISCREPANCIAS]

EVENTOS EN HOSIX:
├─ POST /generar-hcu-paciente-nuevo
│  └─ Edge Function → RPC a nodo_central.fn_generar_hcu()
│     └─ HCU generado en < 100ms
│
└─ SELECT * FROM nodo_central (búsquedas)
   └─ Datos siempre frescos (vía triggers)
```

---

## 7. Beneficios de Esta Arquitectura Optimizada

✅ **Sincronización instantánea** → Triggers, no cron jobs (0ms delay)
✅ **Copias locales siempre consistentes** → Funciones idempotentes
✅ **Sin discrepancias** → Versioning y auditoría completa
✅ **Auditoría completa** → Cada cambio registrado en sincronizacion_log
✅ **HOSIX no consulta RENAPROSA** → Usa copias desacopladas
✅ **Escalable** → Nuevos hospitales no añaden complejidad
✅ **Mantenible** → Lógica en funciones SQL, fácil de revisar
✅ **Migración fácil** → Copias locales son tablas ordinarias

---

## 8. Próximos Pasos

### Fase 1: Setup (esta semana)
1. ✅ Crear schemas: `nodo_central` y `sincronizacion_hospitals`
2. ✅ Crear Edge Functions para sincronización
3. ✅ Configurar Cron Jobs (cada 1h)
4. ✅ Documentar flujos

### Fase 2: Testing (próxima semana)
1. Ejecutar manual sync_hospitals_a_central
2. Verificar que centros de RENAPROSA se replican
3. Ejecutar manual sync_central_a_hospitals
4. Verificar que HOSIX recibe datos

### Fase 3: Integración HOSIX (2 semanas)
1. HOSIX busca HCU en Nodo Central
2. HOSIX crea pacientes con HCU automático
3. Validar flujos completos

---

## 9. Conclusión

**Estrategia Final:**
- Nodo Central = Centralizado en RENAPROSA (mismo Supabase)
- Sincronización = Automática cada 1h vía Cron
- HOSIX = Consume HCU generado en Nodo Central
- Profesionales = Ya validados en RENAPROSA, referenciados en Nodo Central

**Ventaja**: No requiere migración a Supabase local ahora. Cuando lo necesites, migramos el schema completo como un bloque.
