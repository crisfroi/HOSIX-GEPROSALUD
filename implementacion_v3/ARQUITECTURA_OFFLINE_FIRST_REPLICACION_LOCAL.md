# Arquitectura Offline-First: Replicación Local + Queue de Sincronización

## 🎯 Visión General

**Problema:** Hospitales sin conexión constante a internet no pueden consultar/generar HCU en tiempo real.

**Solución:** Cada hospital mantiene una **copia local sincronizada** del Nodo Central + **queue local** de cambios.

```
┌─────────────────────────────────────────────────────────────────┐
│                    NODO CENTRAL (Remoto)                        │
│         En RENAPROSA (wdieynendfjbkbhfovrx.supabase.co)         │
├─────────────────────────────────────────────────────────────────┤
│  - Pacientes: HCU único por cédula                              │
│  - Distritos, centros, profesionales                            │
│  - Sincronizacion_log (auditoría)                               │
│  - Source of Truth                                              │
└─────────────────────────────────────────────────────────────────┘
                            ↕ (Sincronización)
              (Cuando hay conexión a internet)
                            ↕
┌─────────────────────────────────────────────────────────────────┐
│              HOSPITAL LOCAL (Con o sin conexión)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Schema: hospital_local (SQLite o Supabase local)              │
│  ├─ distritos_sincronizado                                      │
│  ├─ centros_salud_sincronizado                                  │
│  ├─ profesionales_sincronizado                                  │
│  ├─ pacientes_maestro_local (copia HCU)                         │
│  ├─ pacientes_pendientes (nuevos sin HCU)                       │
│  └─ sync_queue (cambios pendientes)                             │
│                                                                 │
│  Operación:                                                     │
│  ├─ SIN conexión: Consulta local, crea localmente              │
│  ├─ CON conexión: Sincroniza bidireccional                     │
│  └─ Service Worker: Detecta conexión y dispara sync            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Esquema de Tablas - Hospital Local

### 1. Tablas de Réplica (Read-Only, Sincronizadas)

```sql
-- Hospital local: tablas de solo lectura sincronizadas desde Central
CREATE TABLE hospital_local.distritos_sincronizado (
  nombre_distrito TEXT PRIMARY KEY,
  abreviatura_provincia VARCHAR(10),
  nombre_provincia VARCHAR(255),
  abreviatura_distrito VARCHAR(10),
  sincronizado_desde_central TIMESTAMPTZ,
  version_central INTEGER,
  
  -- Control de sync
  hash_contenido VARCHAR(64),  -- para detectar cambios
  fecha_ultima_verificacion TIMESTAMPTZ
);

CREATE TABLE hospital_local.centros_salud_sincronizado (
  id UUID PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  categoria TEXT,
  provincia TEXT,
  distrito TEXT,
  distrito_sanitario TEXT,
  ... -- todos los campos
  
  -- Control de sync
  sincronizado_desde_central TIMESTAMPTZ,
  version_central INTEGER,
  hash_contenido VARCHAR(64)
);

CREATE TABLE hospital_local.profesionales_sincronizado (
  id UUID PRIMARY KEY,
  nombre_completo VARCHAR(255),
  numero_dip VARCHAR(50),
  area_profesional VARCHAR(255),
  centro_salud_id UUID,
  ... -- todos los campos
  
  -- Control de sync
  sincronizado_desde_central TIMESTAMPTZ,
  version_central INTEGER,
  hash_contenido VARCHAR(64)
);

-- CRÍTICA: Pacientes con HCU (búsqueda rápida)
CREATE TABLE hospital_local.pacientes_maestro_local (
  id UUID PRIMARY KEY,
  hcu VARCHAR(50) UNIQUE NOT NULL,
  cedula VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(255),
  apellido VARCHAR(255),
  fecha_nacimiento DATE,
  estado VARCHAR(50),
  
  -- De dónde viene
  origen_hospital VARCHAR(50),  -- "Central" o código hospital origen
  
  -- Control de sync
  sincronizado_desde_central TIMESTAMPTZ,
  version_central INTEGER
);

CREATE INDEX idx_pacientes_local_cedula ON hospital_local.pacientes_maestro_local(cedula);
CREATE INDEX idx_pacientes_local_hcu ON hospital_local.pacientes_maestro_local(hcu);
```

---

### 2. Tablas Operacionales (Write, Local)

```sql
-- Pacientes creados LOCALMENTE, sin HCU aún
CREATE TABLE hospital_local.pacientes_pendientes_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedula VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255) NOT NULL,
  fecha_nacimiento DATE,
  nombre_distrito TEXT NOT NULL,
  centro_salud_id UUID,
  
  -- Estado del sync
  estado VARCHAR(50) DEFAULT 'pendiente',  -- pendiente, sincronizando, completado, error
  
  -- HCU temporal (mientras se sincroniza)
  hcu_temporal VARCHAR(50) UNIQUE,  -- HCU-LOCAL-xxxx
  hcu_final VARCHAR(50),             -- HCU real del Central (cuando se sincroniza)
  
  -- Control
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  fecha_ultimo_sync_intento TIMESTAMPTZ,
  intentos_sync INTEGER DEFAULT 0,
  error_mensaje TEXT,
  
  UNIQUE(cedula)
);

-- Cola de cambios para sincronizar
CREATE TABLE hospital_local.sync_queue (
  id BIGSERIAL PRIMARY KEY,
  accion VARCHAR(50) NOT NULL,      -- crear, actualizar, eliminar
  entidad_tipo VARCHAR(50) NOT NULL, -- paciente, consulta, laboratorio, etc
  entidad_id UUID NOT NULL,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'pendiente',  -- pendiente, sincronizando, completado, error
  numero_intento INTEGER DEFAULT 0,
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  fecha_ultimo_intento TIMESTAMPTZ,
  error_mensaje TEXT,
  
  -- Prioridad
  prioridad INTEGER DEFAULT 1,  -- 1=alta (paciente), 2=media (consulta), 3=baja (auditoría)
  
  INDEX idx_sync_queue_estado (estado),
  INDEX idx_sync_queue_prioridad (prioridad),
  INDEX idx_sync_queue_fecha (fecha_creacion)
);

-- Log local de sincronización (para auditoría)
CREATE TABLE hospital_local.sync_log_local (
  id BIGSERIAL PRIMARY KEY,
  tipo_evento VARCHAR(50),
  detalles JSONB,
  estado VARCHAR(50),
  timestamp TIMESTAMPTZ DEFAULT now(),
  
  INDEX idx_sync_log_tipo (tipo_evento),
  INDEX idx_sync_log_timestamp (timestamp)
);
```

---

## 🔄 Flujo de Operación

### Escenario 1: Hospital SIN Conexión - Paciente Nuevo

```
Enfermero en HOSIX:
  ├─ Crea paciente: Cédula 1234567890, María García
  └─ Selecciona: Distrito "Riaba"

Aplicación (Offline):
  1. Busca en hospital_local.pacientes_maestro_local
     WHERE cedula = '1234567890'
     → NO EXISTE
  
  2. Genera HCU temporal:
     ├─ Obtiene abreviatura de distrito: "DSR"
     ├─ Obtiene timestamp local: 2026-06-13T15:30:00
     ├─ Genera: HCU-LOCAL-DSR-20260613-0001
     └─ Almacena en pacientes_pendientes_sync
  
  3. Crea registro local:
     INSERT INTO hospital_local.pacientes_pendientes_sync (
       cedula: '1234567890',
       nombre: 'María',
       apellido: 'García',
       hcu_temporal: 'HCU-LOCAL-DSR-20260613-0001',
       estado: 'pendiente'
     )
  
  4. Enqueue para sync:
     INSERT INTO hospital_local.sync_queue (
       accion: 'crear',
       entidad_tipo: 'paciente',
       entidad_id: paciente_local.id,
       datos_nuevos: {cedula, nombre, ...},
       prioridad: 1  -- alta
     )
  
  5. Retorna a UI:
     {
       exito: true,
       hcu: 'HCU-LOCAL-DSR-20260613-0001',
       estado: 'pendiente_sincronizacion',
       mensaje: 'Paciente creado. Se sincronizará cuando tenga conexión.'
     }

Enfermero continúa:
  ├─ Puede ver el paciente en búsquedas locales
  ├─ Puede crear consultas con HCU temporal
  ├─ Puede crear laboratorios
  └─ Todo funciona OFFLINE ✅
```

---

### Escenario 2: Hospital SIN Conexión - Paciente Existente

```
Enfermero:
  └─ Busca paciente: Cédula 9876543210

Aplicación (Offline):
  1. Busca en hospital_local.pacientes_maestro_local
     WHERE cedula = '9876543210'
     → EXISTE
  
  2. Retorna:
     {
       id: 'uuid...',
       hcu: 'HCUDSR2026000042',
       nombre: 'Juan López',
       estado: 'sincronizado'
     }

Enfermero:
  ├─ Ve paciente con HCU real ✅
  ├─ Crea consulta
  └─ Todo normal
```

---

### Escenario 3: Hospital OBTIENE Conexión - Sincronización

```
Service Worker detecta:
  └─ Conexión a internet disponible

Inicia sincronización:
  
PASO 1: Sincronizar REFERENCIA (centros, profesionales, distritos)
  ├─ GET /sync/pull?tipo=referencia&ultima_version=5
  ├─ Central retorna cambios desde versión 5
  ├─ Hospital actualiza tablas: *_sincronizado
  └─ Actualiza versions locales
  
PASO 2: Sincronizar PACIENTES CON HCU
  ├─ GET /sync/pull?tipo=pacientes&fecha_ultima_sync=2026-06-13T10:00:00
  ├─ Central retorna nuevos pacientes desde esa fecha
  ├─ Hospital MERGE en pacientes_maestro_local:
  │  ├─ Si cedula NO existe: insertar
  │  ├─ Si cedula existe: actualizar (version)
  │  └─ Si versión central > local: usar central
  └─ Hospital marca como sincronizado
  
PASO 3: Enviar COLA PENDIENTE (pacientes nuevos)
  ├─ SELECT * FROM sync_queue WHERE estado = 'pendiente'
  │  └─ [crear_paciente_1, crear_paciente_2, ...]
  │
  ├─ POST /sync/push con los cambios:
  │  {
  │    cambios: [
  │      {
  │        accion: 'crear',
  │        entidad_tipo: 'paciente',
  │        cedula: '1234567890',
  │        nombre: 'María',
  │        ...
  │      },
  │      ...
  │    ]
  │  }
  │
  └─ Central procesa:
      ├─ Para cada cambio:
      │  ├─ Verifica si cedula existe
      │  ├─ Si NO: genera HCU real, inserta
      │  ├─ Si SÍ: retorna HCU existente
      │  └─ Retorna mapeo: {local_id → hcu_real}
      │
      └─ Respuesta:
          {
            exitoso: true,
            mapeos: [
              {local_id: 'uuid1', hcu_real: 'HCUDSR2026000043'},
              {local_id: 'uuid2', hcu_real: 'HCUDSR2026000044'},
              ...
            ]
          }

PASO 4: Hospital ACTUALIZA MAPEOS
  ├─ Recibe mapeos de Central
  ├─ Para cada mapeo:
  │  ├─ UPDATE pacientes_pendientes_sync
  │  │  SET hcu_final = hcu_real, estado = 'completado'
  │  │  WHERE id = local_id
  │  │
  │  ├─ INSERT INTO pacientes_maestro_local
  │  │  WITH hcu_final
  │  │
  │  └─ UPDATE sync_queue
  │     SET estado = 'completado'
  │     WHERE entidad_id = local_id
  │
  ├─ REEMPLAZA HCU en todos los documentos:
  │  ├─ Consultas: HCU-LOCAL → HCUDSR2026000043
  │  ├─ Laboratorios: HCU-LOCAL → HCUDSR2026000043
  │  └─ Historiales: HCU-LOCAL → HCUDSR2026000043
  │
  └─ INSERT INTO sync_log_local
     {tipo_evento: 'hcu_real_asignado', ...}

RESULTADO:
  ✅ Todos los pacientes temporales ahora tienen HCU real
  ✅ Cola vacía (o con reintentos en case de error)
  ✅ Hospital sincronizado con Central
  ✅ Auditoría completa registrada
```

---

## 🚨 Manejo de Conflictos

### Conflicto 1: Mismo Paciente Creado en 2 Hospitales

```
Hospital A (sin conexión):
  └─ Crea: María García, Cédula 1234567890

Hospital B (sin conexión):
  └─ Crea: María García, Cédula 1234567890 (mismo)

Cuando ambos sincronizan:

Nodo Central:
  1. Recibe de Hospital A PRIMERO (timestamp anterior)
     ├─ Cédula 1234567890 NO existe
     ├─ Genera HCU: HCUDSR2026000100
     ├─ Inserta en pacientes_maestro
     └─ Retorna: {cedula: '1234567890', hcu: 'HCUDSR2026000100'}
  
  2. Recibe de Hospital B (timestamp posterior)
     ├─ Cédula 1234567890 YA existe
     ├─ Retorna HCU existente: HCUDSR2026000100
     └─ Datos ignorados (o marcados como "duplicado por cédula")
  
  3. Retorna a Hospital B:
     {
       resultado: 'paciente_existe',
       cedula: '1234567890',
       hcu: 'HCUDSR2026000100',
       hospital_origen: 'Hospital A',
       fecha_creacion: 'antes'
     }

Hospital B:
  ├─ Recibe que paciente ya existe
  ├─ Reemplaza HCU-LOCAL por HCUDSR2026000100
  ├─ Marca como 'sincronizado'
  └─ Log: "Paciente duplicado resuelto"

RESULTADO:
  ✅ Un solo HCU para María García
  ✅ Ambos hospitales usan el mismo HCU
  ✅ Auditoría: quién fue primero
```

---

### Conflicto 2: Datos Diferentes para Mismo Paciente

```
Hospital A:
  └─ Registra: María García, Mujer, 1990-01-15

Hospital B:
  └─ Registra: María García, Mujer, 1990-01-16 (fecha nac diferente)

Nodo Central:
  1. Recibe de A: genera HCU HCUDSR2026000100
  2. Recibe de B: detecta cédula existe
  3. Compara campos:
     ├─ Nombre: igual ✅
     ├─ Género: igual ✅
     ├─ Fecha nac: DIFERENTE ❌
  
  4. Acción:
     ├─ Usa datos de Hospital A (fue primero)
     ├─ Registra conflicto: "fecha_nacimiento inconsistente"
     └─ Marca para revisión manual
  
  5. Retorna:
     {
       resultado: 'paciente_existe_con_conflictos',
       hcu: 'HCUDSR2026000100',
       conflictos: [
         {campo: 'fecha_nacimiento', valor_a: '1990-01-15', valor_b: '1990-01-16'}
       ],
       accion: 'usar_existente',
       requiere_revision: true
     }

Hospital B:
  ├─ Marca paciente como "necesita revisión"
  ├─ Notifica a enfermero: "Conflicto en fecha de nacimiento"
  └─ Permite editar localmente, reintenta sync

Admin Central:
  ├─ Ve conflictos en dashboard
  ├─ Verifica documentos del paciente
  └─ Actualiza HCU con datos correctos
```

---

## 💾 Estrategia de Almacenamiento Local

### Opción A: SQLite (Recomendado para Offline Total)

```typescript
// Usar Capacitor SQLite o sqlite.js

import { Database } from '@capacitor-community/sqlite'

const db = new Database({
  name: 'hosix_local.db',
  encrypted: true,
  mode: 'secret'
})

await db.create()
await db.open()

// Crear esquema
await db.execute(schemas.pacientes_maestro_local)
await db.execute(schemas.sync_queue)
await db.execute(schemas.sync_log_local)

// Insertar paciente (sin conexión)
await db.run(
  'INSERT INTO pacientes_pendientes_sync (cedula, nombre, hcu_temporal) VALUES (?, ?, ?)',
  [cedula, nombre, hcuTemporal]
)

// Buscar paciente (sin conexión)
const resultado = await db.query(
  'SELECT hcu, nombre FROM pacientes_maestro_local WHERE cedula = ?',
  [cedula]
)
```

### Opción B: Supabase Local (Si Quieres Mantener Misma API)

```typescript
// Usar @supabase/js con IndexedDB storage

import { createClient } from '@supabase/supabase-js'
import { StorageAdapter } from '@supabase/auth-js'

// Cliente Supabase con persistencia local
const supabase = createClient(
  'https://...',
  'anon-key',
  {
    localStorage: window.localStorage,
    // Habilitar modo offline-first con caché
    persistSession: true,
    autoRefreshToken: true,
  }
)

// Funciona igual con o sin conexión
const { data } = await supabase
  .from('hospital_local.pacientes_maestro_local')
  .select()
  .eq('cedula', cedula)
```

---

## 🔗 Service Worker para Detección de Conexión

```typescript
// service-worker.ts

// Detectar conexión
window.addEventListener('online', async () => {
  console.log('📡 Conexión disponible - iniciando sync')
  
  try {
    const resultado = await sincronizarConNodoCentral()
    console.log('✅ Sincronización completada', resultado)
  } catch (error) {
    console.error('❌ Error en sincronización', error)
  }
})

window.addEventListener('offline', () => {
  console.log('📴 Sin conexión - funcionando en modo offline')
})

// Retry automático cada X tiempo si hay cola pendiente
setInterval(async () => {
  const { data: pendientes } = await db.query(
    'SELECT COUNT(*) FROM sync_queue WHERE estado = ?',
    ['pendiente']
  )
  
  if (pendientes[0].count > 0 && navigator.onLine) {
    await sincronizarConNodoCentral()
  }
}, 5 * 60 * 1000)  // Cada 5 minutos
```

---

## 📈 Inicialización - Descarga de Copia Local

```typescript
// Primer acceso del hospital: descargar referencias

async function inicializarHospitalLocal() {
  console.log('🔄 Descargando copia local...')
  
  try {
    // 1. Descargar distritos
    const distritos = await fetch('/sync/pull/distritos')
    await db.bulkInsert('distritos_sincronizado', distritos)
    
    // 2. Descargar centros
    const centros = await fetch('/sync/pull/centros')
    await db.bulkInsert('centros_salud_sincronizado', centros)
    
    // 3. Descargar profesionales
    const profesionales = await fetch('/sync/pull/profesionales')
    await db.bulkInsert('profesionales_sincronizado', profesionales)
    
    // 4. Descargar pacientes existentes (últimos 2 años)
    const pacientes = await fetch('/sync/pull/pacientes?desde=2024-01-01')
    await db.bulkInsert('pacientes_maestro_local', pacientes)
    
    console.log('✅ Copia local inicializada')
    
  } catch (error) {
    console.error('❌ Error inicializando', error)
  }
}
```

---

## 📊 Dashboard de Sincronización

Mostrar en Configuración:

```
╔═══════════════════════════════════════════════╗
║       ESTADO DE SINCRONIZACIÓN                ║
╠═══════════════════════════════════════════════╣
║ Última sincronización: 2026-06-13 15:30:00  ║
║ Estado: ✅ Sincronizado                       ║
║                                               ║
║ 📊 REFERENCIAS LOCALES:                       ║
║   ├─ Distritos: 20                            ║
║   ├─ Centros: 145                             ║
║   └─ Profesionales: 1,234                     ║
║                                               ║
║ 👥 PACIENTES:                                 ║
║   ├─ Con HCU: 8,932                           ║
║   ├─ Pendientes sync: 3                       ║
║   └─ Espacio usado: 245 MB                    ║
║                                               ║
║ 📤 COLA DE SINCRONIZACIÓN:                    ║
║   ├─ Pendientes: 3                            ║
║   ├─ Completados hoy: 12                      ║
║   └─ Errores: 0                               ║
║                                               ║
║ 🔗 CONEXIÓN: 📡 Conectado (5G)               ║
║                                               ║
║  [🔄 Sincronizar Ahora] [↓ Limpiar Caché]   ║
╚═══════════════════════════════════════════════╝
```

---

## ✅ Checklist de Implementación

- [ ] Crear schema `hospital_local` en HOSIX
- [ ] Tablas: distritos_sincronizado, centros_salud_sincronizado, etc
- [ ] Tablas: pacientes_pendientes_sync, sync_queue, sync_log_local
- [ ] Implementar generador de HCU temporal (local)
- [ ] Edge Function: `/sync/pull` (descargar referencias)
- [ ] Edge Function: `/sync/push` (subir cambios)
- [ ] Service Worker: Detectar conexión y sincronizar
- [ ] UI: Dashboard de estado de sync
- [ ] Función: Reemplazar HCU-LOCAL por HCU-REAL
- [ ] Manejo de conflictos: deduplicación por cédula
- [ ] Testing: Offline + Online + Conflictos
- [ ] Documentación: Flujos para enfermeros

---

## 🎯 Conclusión

**Opción 2 implementada = Hospital funciona 100% offline:**
- ✅ Búsquedas de pacientes instantáneas (local)
- ✅ Generación de HCU temporal (local)
- ✅ Creación de consultas/lab (local)
- ✅ Sync automático cuando hay conexión
- ✅ Deduplicación automática por cédula
- ✅ Auditoría completa
- ✅ Escalable (funciona en hospitales sin internet)

**Mejora futura (Comentario del Usuario):**
- 💡 Pre-generar HCU desde cédulas del Ministerio
- 💡 Eliminaría 80% de conflictos
- 💡 Todos los mayores de edad ya tendrían HCU
