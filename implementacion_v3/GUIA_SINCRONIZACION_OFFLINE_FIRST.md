# Guía: Sincronización Offline-First con RENAPROSA

## Visión General

El HOSIX implementa un modelo **offline-first** con sincronización a RENAPROSA (Nodo Central):

```
┌─────────────────────┐         HTTPS          ┌──────────────────────┐
│   HOSIX Hospital    │◄──────────────────────►│  RENAPROSA (Central) │
│  (Proyecto Local)   │   Edge Functions       │  (Proyecto Central)  │
│                     │   sync-pull / push     │                      │
│  - hospital_local.* │                        │  - nodo_central.*    │
│  - sqlite offline   │                        │  - PostgreSQL        │
│  - sync_queue       │                        │  - HCU generation    │
└─────────────────────┘                        └──────────────────────┘
```

## Flujo de Creación de Pacientes (Offline)

### 1. Sin Conexión a Internet

Cuando un operador crea un paciente **SIN conexión**:

```
┌─ PacienteForm.tsx
│
├─ usuario escribe datos
├─ click "Crear Paciente"
│
└─► syncService.crearPacienteLocal()
    ├─ genera HCU_TEMPORAL (ej: "TEMP-BN-001-2024")
    ├─ inserta en hospital_local.pacientes_pendientes_sync
    ├─ enqueue en hospital_local.sync_queue
    └─► toast: "Paciente creado localmente. Se sincronizará cuando haya conexión"
```

**Resultado:**
- Paciente guardado en BD local
- HCU temporal para operaciones locales
- Encolado para sincronización

**Código en PacienteForm.tsx:**
```tsx
const resultado = await syncService.crearPacienteLocal({
  cedula: formData.numero_documento,
  nombre: formData.primer_nombre,
  apellido: formData.primer_apellido,
  fecha_nacimiento: formData.fecha_nacimiento,
  nombre_distrito: nombreDistrito,
  genero: formData.sexo,
})

if (resultado.exitoso) {
  toast.success(`Paciente creado localmente. HCU: ${resultado.hcu}`)
}
```

### 2. Con Conexión a Internet

Cuando hay **conexión restaurada**:

```
┌─ window.addEventListener('online')
│
└─► syncService.sincronizar()
    ├─ obtiene cambios pendientes de sync_queue
    ├─ POST a RENAPROSA:/functions/v1/sync-push
    │   └─ RENAPROSA genera HCU_REAL
    │      └─ retorna mapeo TEMPORAL → REAL
    │
    ├─ actualiza hospital_local.pacientes_maestro_local con HCU real
    ├─ inserta mapeo en hospital_local.hcu_mapping
    ├─ marca sync_queue como completado
    └─► toast: "Sincronizado correctamente. X cambios procesados"
```

**Resultado:**
- HCU temporal reemplazado por HCU real de RENAPROSA
- Paciente disponible en el Nodo Central
- Sincronización automática al restaurarse conexión

### 3. Edge Functions (RENAPROSA)

#### sync-pull (GET referencias)

**URL:** `https://wdieynendfjbkbhfovrx.supabase.co/functions/v1/sync-pull`

**Request:**
```json
{
  "tipo": "distritos|centros|profesionales|pacientes",
  "fecha_ultima_sync": "2024-06-15T10:30:00Z",
  "limite": 1000
}
```

**Response:**
```json
{
  "exitoso": true,
  "tipo": "distritos",
  "total": 6,
  "registros": 6,
  "datos": [
    {
      "codigo_provincia": "01",
      "nombre_distrito": "Bioko Norte",
      "region_sanitaria": "Región I"
    },
    ...
  ],
  "timestamp": "2024-06-15T10:35:00Z"
}
```

#### sync-push (CREATE/UPDATE pacientes)

**URL:** `https://wdieynendfjbkbhfovrx.supabase.co/functions/v1/sync-push`

**Request:**
```json
{
  "cambios": [
    {
      "accion": "crear",
      "cedula": "00123456789",
      "nombre": "Juan",
      "apellido": "Pérez",
      "fecha_nacimiento": "1980-05-15",
      "nombre_distrito": "Bioko Norte",
      "genero": "M"
    }
  ]
}
```

**Response:**
```json
{
  "exitoso": true,
  "procesados": 1,
  "exitosos": 1,
  "con_error": 0,
  "mapeos": [
    {
      "cedula": "00123456789",
      "resultado": "creado",
      "hcu": "HCU-0001-BN-2024-001",
      "paciente_id": "uuid-123"
    }
  ],
  "timestamp": "2024-06-15T10:35:00Z"
}
```

## Dashboard de Sincronización

Ubicación: **Configuración → Sync**

### Características

1. **Estado de Conexión**
   - Indicador 🟢 En línea / 🔴 Offline
   - Información del estado actual

2. **Acciones Principales**
   - **Descargar Referencias:** Inicializa/actualiza copia local de distritos, centros, profesionales
   - **Sincronizar Ahora:** Fuerza sincronización manual (solo con conexión)

3. **Estadísticas en Tiempo Real**
   - Centros de salud sincronizados
   - Profesionales activos
   - Pacientes con HCU real
   - Pacientes con HCU temporal (offline)
   - Cambios pendientes en cola
   - Última sincronización

4. **Resumen Operativo**
   - Total de registros maestro en BD local
   - Cantidad de pacientes offline
   - Estado de sincronización (Sincronizado / X cambios pendientes)

### Uso Típico

```
1. Al iniciar el hospital por primera vez:
   └─► click "Descargar Referencias"
       └─► carga distritos, centros, profesionales desde RENAPROSA

2. Durante operaciones offline:
   └─► los pacientes se crean con HCU temporal
   └─► se encollan automáticamente
   └─► dashboard muestra "X cambios pendientes"

3. Cuando conexión se restaura:
   └─► sincronización automática
   └─► o click "Sincronizar Ahora" para forzar
   └─► HCU temporales se reemplazan por reales
   └─► "Cambios pendientes" regresa a 0
```

## Integración en Creación de Pacientes

**Archivo:** `src/components/hosix/pacientes/PacienteForm.tsx`

### Cambios Realizados

1. **Imports:**
   ```tsx
   import { useSyncService } from '@/services/syncService'
   import { useSupabase } from '@/hooks/useSupabase'
   ```

2. **Inicialización:**
   ```tsx
   const { supabase } = useSupabase()
   const syncService = useSyncService(supabase)
   const [isOnline, setIsOnline] = useState(navigator.onLine)
   ```

3. **Detección de Conexión:**
   ```tsx
   useEffect(() => {
     const handleOnline = () => setIsOnline(true)
     const handleOffline = () => setIsOnline(false)
     
     window.addEventListener('online', handleOnline)
     window.addEventListener('offline', handleOffline)
     
     return () => {
       window.removeEventListener('online', handleOnline)
       window.removeEventListener('offline', handleOffline)
     }
   }, [])
   ```

4. **Submit Offline-First:**
   ```tsx
   const handleSubmit = async (e) => {
     e.preventDefault()
     
     // Crear localmente
     const resultado = await syncService.crearPacienteLocal({
       cedula: formData.numero_documento,
       nombre: formData.primer_nombre,
       apellido: formData.primer_apellido,
       fecha_nacimiento: formData.fecha_nacimiento,
       nombre_distrito: nombreDistrito,
       genero: formData.sexo,
     })
     
     // Si hay conexión, sincronizar
     if (isOnline) {
       const syncResult = await syncService.sincronizar()
     }
   }
   ```

5. **UI Feedback:**
   ```tsx
   {!isOnline && (
     <Alert className="border-yellow-200 bg-yellow-50">
       <CloudOff className="h-4 w-4 text-yellow-600" />
       <AlertDescription>
         Sin conexión. Los pacientes se crearán localmente.
       </AlertDescription>
     </Alert>
   )}
   ```

## Datos de Prueba

**Archivo:** `supabase/migrations/20260615_datos_prueba_hospital_local.sql`

Contiene:
- 6 distritos de prueba
- 6 centros de salud
- 6 profesionales
- 5 pacientes maestro (con HCU real)
- 4 pacientes pendientes (con HCU temporal)
- 2 mapeos HCU (TEMPORAL → REAL)
- 2 cambios en cola de sincronización

### Aplicar datos de prueba:

```bash
supabase db push supabase/migrations/20260615_datos_prueba_hospital_local.sql
```

## Arquitectura de Tablas

### Hospital Local (HOSIX)

```sql
hospital_local.distritos_sincronizado
├─ id (BIGSERIAL PRIMARY KEY)
├─ codigo_provincia
├─ nombre_distrito
├─ region_sanitaria
├─ estado_sync
└─ sincronizado_en (TIMESTAMP)

hospital_local.centros_salud_sincronizado
├─ id (BIGSERIAL PRIMARY KEY)
├─ nombre
├─ tipo
├─ nombre_distrito
├─ responsable
├─ estado
└─ sincronizado_en

hospital_local.profesionales_sincronizado
├─ id (BIGSERIAL PRIMARY KEY)
├─ nombre_completo
├─ especialidad
├─ numero_colegiado
├─ nombre_distrito
├─ centro_salud
├─ estado_solicitud
└─ sincronizado_en

hospital_local.pacientes_maestro_local
├─ id (BIGSERIAL PRIMARY KEY)
├─ hcu (VARCHAR UNIQUE) ← HCU REAL (desde RENAPROSA)
├─ cedula (VARCHAR UNIQUE)
├─ nombre
├─ apellido
├─ fecha_nacimiento
├─ genero
├─ estado
└─ updated_at

hospital_local.pacientes_pendientes_sync
├─ id (BIGSERIAL PRIMARY KEY)
├─ cedula
├─ nombre
├─ apellido
├─ fecha_nacimiento
├─ genero
├─ nombre_distrito
├─ hcu_temporal ← HCU TEMPORAL (generado localmente)
├─ hcu_final ← HCU REAL (después de sincronizar)
├─ estado (pendiente → completado)
├─ creado_en
└─ sincronizado_en

hospital_local.sync_queue
├─ id (BIGSERIAL PRIMARY KEY)
├─ accion (crear|actualizar|eliminar)
├─ entidad_tipo (paciente|...)
├─ entidad_id
├─ datos_nuevos (JSONB)
├─ estado (pendiente → completado)
├─ numero_intento
├─ error_mensaje
├─ prioridad
└─ fecha_creacion

hospital_local.hcu_mapping
├─ id (BIGSERIAL PRIMARY KEY)
├─ hcu_temporal ← TEMP-BN-001-2024
├─ hcu_real ← HCU-0001-BN-2024-001
├─ cedula
├─ paciente_pendientes_id
└─ sincronizado_en

hospital_local.sync_log_local
├─ id (BIGSERIAL PRIMARY KEY)
├─ tipo_evento
├─ entidad_tipo
├─ detalles (JSONB)
├─ estado
└─ timestamp
```

## SyncService API

### Métodos Públicos

#### inicializarHospitalLocal()

Descargar referencias iniciales de RENAPROSA.

```tsx
const resultado = await syncService.inicializarHospitalLocal()

if (resultado.exitoso) {
  console.log(`Descargados:
    - ${resultado.distritos} distritos
    - ${resultado.centros} centros
    - ${resultado.profesionales} profesionales
    - ${resultado.pacientes} pacientes
  `)
}
```

**Retorna:**
```ts
{
  exitoso: boolean
  distritos?: number
  centros?: number
  profesionales?: number
  pacientes?: number
  error?: string
}
```

#### crearPacienteLocal(paciente)

Crear paciente localmente sin conexión.

```tsx
const resultado = await syncService.crearPacienteLocal({
  cedula: '00123456789',
  nombre: 'Juan',
  apellido: 'Pérez',
  fecha_nacimiento: '1980-05-15',
  nombre_distrito: 'Bioko Norte',
  genero: 'M'
})

if (resultado.exitoso) {
  console.log(`Paciente creado: HCU ${resultado.hcu}`)
  console.log(`Estado: ${resultado.estado}`) // 'pendiente_sincronizacion'
}
```

**Retorna:**
```ts
{
  exitoso: boolean
  encontrado: boolean // true si ya existía
  hcu?: string // HCU generado (temporal o real)
  estado?: string // 'sincronizado' | 'pendiente_sincronizacion'
  error?: string
}
```

#### sincronizar()

Sincronizar cambios con RENAPROSA.

```tsx
const resultado = await syncService.sincronizar()

if (resultado.exitoso) {
  console.log(`${resultado.sincronizados} cambios procesados`)
  resultado.mapeos?.forEach(mapeo => {
    console.log(`${mapeo.cedula} → HCU ${mapeo.hcu}`)
  })
}
```

**Retorna:**
```ts
{
  exitoso: boolean
  sincronizados?: number
  errores?: number
  mapeos?: any[] // { cedula, resultado, hcu, ... }
  error?: string
}
```

#### obtenerEstadoSync()

Obtener estado actual de sincronización.

```tsx
const estado = await syncService.obtenerEstadoSync()

console.log(`
  Centros: ${estado?.centros_locales}
  Profesionales: ${estado?.profesionales_locales}
  Pacientes (HCU real): ${estado?.pacientes_con_hcu}
  Pacientes (HCU temporal): ${estado?.pacientes_pendientes}
  Cambios en cola: ${estado?.cambios_en_cola}
  Última sync: ${estado?.ultima_sincronizacion}
`)
```

**Retorna:**
```ts
{
  centros_locales: number
  profesionales_locales: number
  pacientes_con_hcu: number
  pacientes_pendientes: number
  cambios_en_cola: number
  ultima_sincronizacion: string | null
}
```

## Manejo de Errores

### Escenario: Paciente duplicado

Si se intenta sincronizar un paciente que ya existe en RENAPROSA:

```json
{
  "cedula": "00123456789",
  "resultado": "paciente_existe",
  "hcu": "HCU-0001-BN-2024-001"
}
```

**El HCU temporal se reemplaza con el real** y no se crea duplicado.

### Escenario: Sin conexión

Si sync-push falla por falta de conexión:

```tsx
setSyncStatus('Cambios pendientes de sincronizar')
toast.warning('Sin conexión. Los cambios se sincronizarán cuando haya conexión.')
```

La cola persiste en BD local y se reintenta automáticamente.

### Escenario: Error en RENAPROSA

Si la HCU generación falla:

```json
{
  "cedula": "00123456789",
  "resultado": "error",
  "error": "Error generando HCU: ..."
}
```

El cambio permanece en cola con `numero_intento` incrementado.

## Testing

### Setup de datos de prueba

```bash
# Aplicar migración con datos de prueba
supabase db push supabase/migrations/20260615_datos_prueba_hospital_local.sql

# Verificar datos
supabase db query "SELECT COUNT(*) FROM hospital_local.distritos_sincronizado"
# Resultado: 6

supabase db query "SELECT COUNT(*) FROM hospital_local.pacientes_maestro_local"
# Resultado: 5

supabase db query "SELECT COUNT(*) FROM hospital_local.sync_queue WHERE estado='pendiente'"
# Resultado: 2
```

### Test Manual

1. **Inicialización:**
   - Abrir Configuración → Sync
   - Click "Descargar Referencias"
   - Esperar confirmación

2. **Creación Offline:**
   - Apagar internet (DevTools → Offline)
   - Ir a Pacientes
   - Crear nuevo paciente
   - Verificar HCU temporal creado
   - Verificar en Sync: "X cambios pendientes"

3. **Sincronización Automática:**
   - Restaurar conexión
   - Esperar/forzar sincronización
   - Verificar en Sync: cambios procesados, HCU real asignado

## Próximos Pasos

- [ ] Implementar reintentos automáticos con backoff exponencial
- [ ] Agregar conflicto resolution por timestamp
- [ ] Dashboard de logs de sincronización
- [ ] Exportar/importar datos de sincronización para debugging
- [ ] Compresión de cambios en queue (agrupar por cedula)
- [ ] Replicación de otras entidades (consultas, resultados, etc.)
