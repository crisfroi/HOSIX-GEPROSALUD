# Plan de Implementación: Opción 2 - Replicación Local + Queue

## 📅 Timeline: 2-3 Semanas

```
Semana 1: Setup Local + Edge Functions
  ├─ Día 1-2: Crear schema hospital_local
  ├─ Día 2-3: Edge Functions (/sync/pull y /sync/push)
  └─ Día 3: Testing básico

Semana 2: Sincronización + Service Worker
  ├─ Día 1-2: Service Worker + Detector de conexión
  ├─ Día 2-3: Funciones de sync local ↔ remoto
  └─ Día 3: Testing de conflictos

Semana 3: UI + Refinamiento
  ├─ Día 1: Dashboard de sincronización
  ├─ Día 2: Ui para HCU temporal → real
  └─ Día 3: Testing end-to-end + UAT
```

---

## 🎯 Fase 1: Setup Base de Datos Local (Día 1-2)

### 1.1 Crear Schema en HOSIX

```typescript
// supabase/migrations/20260614_hospital_local_schema.sql

CREATE SCHEMA IF NOT EXISTS hospital_local;

-- ====== TABLAS DE RÉPLICA (Read-Only, Sincronizadas) ======

CREATE TABLE hospital_local.distritos_sincronizado (
  nombre_distrito TEXT PRIMARY KEY,
  abreviatura_provincia VARCHAR(10),
  nombre_provincia VARCHAR(255),
  abreviatura_distrito VARCHAR(10),
  sincronizado_desde_central TIMESTAMPTZ,
  version_central INTEGER DEFAULT 1,
  hash_contenido VARCHAR(64),
  fecha_ultima_verificacion TIMESTAMPTZ
);

CREATE TABLE hospital_local.centros_salud_sincronizado (
  id UUID PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  categoria TEXT,
  provincia TEXT,
  distrito TEXT,
  distrito_sanitario TEXT,
  sector TEXT,
  director TEXT,
  telefono TEXT,
  especialidades TEXT[],
  estado TEXT,
  numero_registro TEXT,
  fecha_registro TIMESTAMPTZ,
  subcategoria TEXT,
  nif TEXT,
  responsable TEXT,
  fotos_establecimiento TEXT[],
  
  sincronizado_desde_central TIMESTAMPTZ,
  version_central INTEGER DEFAULT 1,
  hash_contenido VARCHAR(64),
  
  UNIQUE(nombre)
);

CREATE TABLE hospital_local.profesionales_sincronizado (
  id UUID PRIMARY KEY,
  nombre_completo VARCHAR(255) NOT NULL,
  numero_dip VARCHAR(50),
  area_profesional VARCHAR(255),
  especialidad VARCHAR(255),
  provincia VARCHAR(100),
  distrito VARCHAR(100),
  distrito_sanitario VARCHAR(100),
  centro_salud_id UUID,
  nombre_centro VARCHAR(255),
  estado_solicitud VARCHAR(50),
  fecha_aprobacion TIMESTAMPTZ,
  
  sincronizado_desde_central TIMESTAMPTZ,
  version_central INTEGER DEFAULT 1,
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
  genero VARCHAR(10),
  estado VARCHAR(50),
  
  origen_hospital VARCHAR(50),
  sincronizado_desde_central TIMESTAMPTZ,
  version_central INTEGER DEFAULT 1,
  
  UNIQUE(cedula)
);

CREATE INDEX idx_pacientes_local_cedula ON hospital_local.pacientes_maestro_local(cedula);
CREATE INDEX idx_pacientes_local_hcu ON hospital_local.pacientes_maestro_local(hcu);

-- ====== TABLAS OPERACIONALES (Write, Local) ======

-- Pacientes NUEVOS sin HCU aún
CREATE TABLE hospital_local.pacientes_pendientes_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedula VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255) NOT NULL,
  fecha_nacimiento DATE,
  genero VARCHAR(10),
  nombre_distrito TEXT NOT NULL,
  centro_salud_id UUID,
  
  estado VARCHAR(50) DEFAULT 'pendiente',
  hcu_temporal VARCHAR(50) UNIQUE,
  hcu_final VARCHAR(50),
  
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  fecha_ultimo_sync_intento TIMESTAMPTZ,
  intentos_sync INTEGER DEFAULT 0,
  error_mensaje TEXT
);

-- Cola de sincronización
CREATE TABLE hospital_local.sync_queue (
  id BIGSERIAL PRIMARY KEY,
  accion VARCHAR(50) NOT NULL,
  entidad_tipo VARCHAR(50) NOT NULL,
  entidad_id UUID NOT NULL,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  
  estado VARCHAR(50) DEFAULT 'pendiente',
  numero_intento INTEGER DEFAULT 0,
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  fecha_ultimo_intento TIMESTAMPTZ,
  error_mensaje TEXT,
  
  prioridad INTEGER DEFAULT 1,
  
  INDEX idx_estado (estado),
  INDEX idx_prioridad (prioridad),
  INDEX idx_fecha (fecha_creacion)
);

-- Log local
CREATE TABLE hospital_local.sync_log_local (
  id BIGSERIAL PRIMARY KEY,
  tipo_evento VARCHAR(50),
  detalles JSONB,
  estado VARCHAR(50),
  timestamp TIMESTAMPTZ DEFAULT now(),
  
  INDEX idx_tipo (tipo_evento),
  INDEX idx_timestamp (timestamp)
);

-- Mapeo de HCU temporales a reales
CREATE TABLE hospital_local.hcu_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hcu_temporal VARCHAR(50) UNIQUE NOT NULL,
  hcu_real VARCHAR(50) UNIQUE NOT NULL,
  cedula VARCHAR(20) NOT NULL,
  paciente_pendientes_id UUID REFERENCES hospital_local.pacientes_pendientes_sync,
  
  estado VARCHAR(50) DEFAULT 'completado',
  fecha_mapping TIMESTAMPTZ DEFAULT now(),
  
  INDEX idx_hcu_temporal (hcu_temporal),
  INDEX idx_hcu_real (hcu_real)
);

GRANT USAGE ON SCHEMA hospital_local TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA hospital_local TO authenticated;
```

### 1.2 Función para Generar HCU Temporal Local

```typescript
// supabase/migrations/20260614_fn_generar_hcu_temporal.sql

CREATE OR REPLACE FUNCTION hospital_local.fn_generar_hcu_temporal(
  p_nombre_distrito TEXT
)
RETURNS VARCHAR(50) AS $$
DECLARE
  v_hcu_temporal VARCHAR(50);
  v_abreviatura VARCHAR(10);
  v_timestamp VARCHAR(14);
  v_contador INTEGER;
BEGIN
  -- Obtener abreviatura del distrito
  SELECT abreviatura_distrito INTO v_abreviatura
  FROM hospital_local.distritos_sincronizado
  WHERE nombre_distrito = p_nombre_distrito;
  
  IF v_abreviatura IS NULL THEN
    v_abreviatura := 'GE';
  END IF;
  
  -- Obtener timestamp: YYYYMMDDHHMMSS
  v_timestamp := TO_CHAR(now(), 'YYYYMMDDHHMMSS');
  
  -- Obtener contador para ese día
  v_contador := COALESCE(
    (SELECT MAX(CAST(SUBSTRING(hcu_temporal FROM 22 FOR 4) AS INTEGER))
     FROM hospital_local.pacientes_pendientes_sync
     WHERE hcu_temporal LIKE 'HCU-LOCAL-' || v_abreviatura || v_timestamp || '%'),
    0
  ) + 1;
  
  -- Generar: HCU-LOCAL-[DIST]-[TIMESTAMP]-[CONTADOR]
  -- Ejemplo: HCU-LOCAL-DSR-20260613153000-0001
  v_hcu_temporal := 'HCU-LOCAL-' || v_abreviatura || '-' || v_timestamp || '-' || LPAD(v_contador::text, 4, '0');
  
  RETURN v_hcu_temporal;
END;
$$ LANGUAGE plpgsql;
```

---

## 🎯 Fase 2: Edge Functions (Día 2-3)

### 2.1 Edge Function: `/sync/pull` (Descargar Cambios)

```typescript
// supabase/functions/sync-pull/index.ts

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface SyncPullRequest {
  tipo: 'distritos' | 'centros' | 'profesionales' | 'pacientes'
  ultima_version?: number
  fecha_ultima_sync?: string
  limite?: number
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const body: SyncPullRequest = await req.json()

    console.log(`📥 SYNC PULL: ${body.tipo}`)

    let datos: any[] = []

    if (body.tipo === 'distritos') {
      const { data } = await supabase
        .from('nodo_central.distritos_sanitarios_copia')
        .select('*')
        .order('nombre_distrito')

      datos = data || []

    } else if (body.tipo === 'centros') {
      const { data } = await supabase
        .from('nodo_central.centros_salud_copia')
        .select('*')
        .eq('estado', 'Activo')
        .order('nombre')

      datos = data || []

    } else if (body.tipo === 'profesionales') {
      const { data } = await supabase
        .from('nodo_central.profesionales_copia')
        .select('*')
        .eq('estado_solicitud', 'Aprobado')
        .order('nombre_completo')

      datos = data || []

    } else if (body.tipo === 'pacientes') {
      let query = supabase
        .from('nodo_central.pais_pacientes_maestro')
        .select('id, hcu, cedula, nombre, apellido, fecha_nacimiento, estado')
        .eq('estado', 'activo')

      // Si hay fecha de última sync, traer solo cambios posteriores
      if (body.fecha_ultima_sync) {
        query = query.gt('updated_at', body.fecha_ultima_sync)
      }

      const { data } = await query
        .order('updated_at', { ascending: false })
        .limit(body.limite || 1000)

      datos = data || []
    }

    return new Response(JSON.stringify({
      exitoso: true,
      tipo: body.tipo,
      total: datos.length,
      datos: datos,
      timestamp: new Date().toISOString()
    }), { status: 200 })

  } catch (error) {
    console.error('❌ Error en sync pull:', error)
    return new Response(JSON.stringify({
      exitoso: false,
      error: String(error)
    }), { status: 500 })
  }
})
```

### 2.2 Edge Function: `/sync/push` (Subir Cambios)

```typescript
// supabase/functions/sync-push/index.ts

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface CambioPaciente {
  accion: string
  cedula: string
  nombre: string
  apellido: string
  fecha_nacimiento: string
  nombre_distrito: string
  datos_nuevos?: any
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const body = await req.json()
    const cambios: CambioPaciente[] = body.cambios || []

    console.log(`📤 SYNC PUSH: ${cambios.length} cambios`)

    const mapeos = []

    for (const cambio of cambios) {
      if (cambio.accion === 'crear') {
        // Verificar si paciente existe
        const { data: existe } = await supabase
          .from('nodo_central.pais_pacientes_maestro')
          .select('hcu')
          .eq('cedula', cambio.cedula)
          .limit(1)

        if (existe?.length) {
          // Paciente ya existe - retornar HCU existente
          mapeos.push({
            cedula: cambio.cedula,
            resultado: 'paciente_existe',
            hcu: existe[0].hcu
          })
        } else {
          // Generar HCU nuevo
          const { data: hcu } = await supabase.rpc(
            'nodo_central.fn_generar_hcu',
            {
              p_cedula: cambio.cedula,
              p_nombre_distrito: cambio.nombre_distrito,
              p_centro_salud_id: null
            }
          )

          // Insertar paciente
          const { error: insert_error } = await supabase
            .from('nodo_central.pais_pacientes_maestro')
            .insert({
              hcu: hcu,
              cedula: cambio.cedula,
              nombre: cambio.nombre,
              apellido: cambio.apellido,
              fecha_nacimiento: cambio.fecha_nacimiento,
              estado: 'activo'
            })

          if (!insert_error) {
            mapeos.push({
              cedula: cambio.cedula,
              resultado: 'creado',
              hcu: hcu
            })
          } else {
            mapeos.push({
              cedula: cambio.cedula,
              resultado: 'error',
              error: insert_error.message
            })
          }
        }
      }
    }

    return new Response(JSON.stringify({
      exitoso: true,
      procesados: cambios.length,
      mapeos: mapeos,
      timestamp: new Date().toISOString()
    }), { status: 200 })

  } catch (error) {
    console.error('❌ Error en sync push:', error)
    return new Response(JSON.stringify({
      exitoso: false,
      error: String(error)
    }), { status: 500 })
  }
})
```

---

## 🎯 Fase 3: Sincronización en Cliente (Día 4-7)

### 3.1 Service Worker + Detector de Conexión

```typescript
// src/services/syncService.ts

export class SyncService {
  private db: Database
  private supabase: SupabaseClient

  async inicializarHospital() {
    console.log('🔄 Inicializando copia local del hospital...')

    try {
      // 1. Descargar distritos
      const respDistritos = await fetch('/api/sync/pull', {
        method: 'POST',
        body: JSON.stringify({ tipo: 'distritos' })
      })
      const { datos: distritos } = await respDistritos.json()
      await this.db.bulkInsert('hospital_local.distritos_sincronizado', distritos)

      // 2. Descargar centros
      const respCentros = await fetch('/api/sync/pull', {
        method: 'POST',
        body: JSON.stringify({ tipo: 'centros' })
      })
      const { datos: centros } = await respCentros.json()
      await this.db.bulkInsert('hospital_local.centros_salud_sincronizado', centros)

      // 3. Descargar profesionales
      const respProf = await fetch('/api/sync/pull', {
        method: 'POST',
        body: JSON.stringify({ tipo: 'profesionales' })
      })
      const { datos: profesionales } = await respProf.json()
      await this.db.bulkInsert('hospital_local.profesionales_sincronizado', profesionales)

      // 4. Descargar pacientes existentes
      const respPacientes = await fetch('/api/sync/pull', {
        method: 'POST',
        body: JSON.stringify({ tipo: 'pacientes', limite: 10000 })
      })
      const { datos: pacientes } = await respPacientes.json()
      await this.db.bulkInsert('hospital_local.pacientes_maestro_local', pacientes)

      console.log('✅ Hospital inicializado')
      return { exitoso: true }

    } catch (error) {
      console.error('❌ Error inicializando:', error)
      return { exitoso: false, error }
    }
  }

  async crearPacienteLocal(cedula: string, nombre: string, apellido: string, nombreDistrito: string) {
    try {
      // Verificar si existe en copia local
      const existe = await this.db.query(
        'SELECT hcu FROM hospital_local.pacientes_maestro_local WHERE cedula = ?',
        [cedula]
      )

      if (existe.length > 0) {
        return { exitoso: true, encontrado: true, hcu: existe[0].hcu }
      }

      // Generar HCU temporal
      const hcuTemporal = await this.db.query(
        'SELECT hospital_local.fn_generar_hcu_temporal(?) AS hcu',
        [nombreDistrito]
      )

      const hcuTemp = hcuTemporal[0].hcu

      // Insertar paciente pendiente
      await this.db.run(
        `INSERT INTO hospital_local.pacientes_pendientes_sync 
         (cedula, nombre, apellido, nombre_distrito, hcu_temporal, estado)
         VALUES (?, ?, ?, ?, ?, 'pendiente')`,
        [cedula, nombre, apellido, nombreDistrito, hcuTemp]
      )

      // Enqueue para sync
      await this.db.run(
        `INSERT INTO hospital_local.sync_queue 
         (accion, entidad_tipo, entidad_id, datos_nuevos, prioridad)
         VALUES ('crear', 'paciente', ?, ?, 1)`,
        [cedula, JSON.stringify({ cedula, nombre, apellido, nombreDistrito })]
      )

      return {
        exitoso: true,
        encontrado: false,
        hcu: hcuTemp,
        estado: 'pendiente_sincronizacion'
      }

    } catch (error) {
      console.error('❌ Error creando paciente local:', error)
      return { exitoso: false, error }
    }
  }

  async sincronizar() {
    console.log('🔄 Iniciando sincronización...')

    try {
      // PASO 1: Descargar referencias
      const respRef = await fetch('/api/sync/pull', {
        method: 'POST',
        body: JSON.stringify({ tipo: 'distritos' })
      })
      const { datos: distritosNuevos } = await respRef.json()

      for (const distrito of distritosNuevos) {
        await this.db.run(
          `INSERT OR REPLACE INTO hospital_local.distritos_sincronizado VALUES (?, ?, ?, ?)`,
          [distrito.nombre_distrito, distrito.abreviatura_provincia, 
           distrito.nombre_provincia, distrito.abreviatura_distrito]
        )
      }

      // PASO 2: Enviar cambios pendientes
      const pendientes = await this.db.query(
        'SELECT * FROM hospital_local.sync_queue WHERE estado = "pendiente" ORDER BY prioridad, fecha_creacion'
      )

      const respPush = await fetch('/api/sync/push', {
        method: 'POST',
        body: JSON.stringify({ cambios: pendientes })
      })

      const { mapeos } = await respPush.json()

      // PASO 3: Actualizar HCU y marcar como completado
      for (const mapeo of mapeos) {
        if (mapeo.resultado === 'creado' || mapeo.resultado === 'paciente_existe') {
          // Insertar en pacientes_maestro_local
          await this.db.run(
            `INSERT OR REPLACE INTO hospital_local.pacientes_maestro_local 
             (hcu, cedula) VALUES (?, ?)`,
            [mapeo.hcu, mapeo.cedula]
          )

          // Registrar mapeo
          const pendiente = await this.db.query(
            'SELECT id FROM hospital_local.pacientes_pendientes_sync WHERE cedula = ?',
            [mapeo.cedula]
          )

          if (pendiente.length > 0) {
            await this.db.run(
              `INSERT INTO hospital_local.hcu_mapping (hcu_temporal, hcu_real, cedula, paciente_pendientes_id)
               SELECT hcu_temporal, ?, cedula, id 
               FROM hospital_local.pacientes_pendientes_sync WHERE cedula = ?`,
              [mapeo.hcu, mapeo.cedula]
            )

            // Marcar como completado
            await this.db.run(
              'UPDATE hospital_local.pacientes_pendientes_sync SET hcu_final = ?, estado = "completado" WHERE cedula = ?',
              [mapeo.hcu, mapeo.cedula]
            )

            // Actualizar sync_queue
            await this.db.run(
              'UPDATE hospital_local.sync_queue SET estado = "completado" WHERE entidad_id = ?',
              [mapeo.cedula]
            )
          }
        }
      }

      console.log('✅ Sincronización completada')
      return { exitoso: true, sincronizados: mapeos.length }

    } catch (error) {
      console.error('❌ Error sincronizando:', error)
      return { exitoso: false, error }
    }
  }
}

// Detector de conexión
window.addEventListener('online', async () => {
  console.log('📡 Conexión disponible')
  const syncService = new SyncService()
  await syncService.sincronizar()
})

window.addEventListener('offline', () => {
  console.log('📴 Sin conexión - modo offline')
})
```

---

## ✅ Checklist Final

- [ ] Migration: `20260614_hospital_local_schema.sql` ejecutada
- [ ] Función: `fn_generar_hcu_temporal()` creada
- [ ] Edge Function: `/sync/pull` deployada
- [ ] Edge Function: `/sync/push` deployada
- [ ] Service: `SyncService` implementada
- [ ] Detectores de conexión funcionando
- [ ] UI: Mostrar HCU temporal/real
- [ ] Testing: Offline + Online + Conflictos
- [ ] UAT: Hospital piloto

---

## 🎯 Resultado Final

✅ Hospital funciona 100% offline
✅ Búsquedas instantáneas (local)
✅ Sincronización automática (cuando hay conexión)
✅ Deduplicación automática (por cédula)
✅ Auditoría completa

**Status:** Listo para implementación.
