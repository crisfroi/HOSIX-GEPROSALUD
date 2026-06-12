# Instrucciones: Implementar Opción 2 - Paso a Paso

## ✅ Archivos Creados - Listos para Implementar

### 1. Migration SQL
- **Archivo:** `supabase/migrations/20260614_hospital_local_schema.sql`
- **Contenido:** 
  - Schema `hospital_local`
  - Tablas de réplica (distritos, centros, profesionales, pacientes)
  - Tablas operacionales (pacientes_pendientes_sync, sync_queue, sync_log_local, hcu_mapping)
  - Función `fn_generar_hcu_temporal()`
  - RLS policies
  - Grants

### 2. Edge Functions
- **Archivo 1:** `supabase/functions/sync-pull/index.ts`
  - Descarga referencias desde Nodo Central
  - Soporta: distritos, centros, profesionales, pacientes
  - Respeta última sincronización (para incremental)

- **Archivo 2:** `supabase/functions/sync-push/index.ts`
  - Envía cambios pendientes al Nodo Central
  - Genera HCU para pacientes nuevos
  - Maneja deduplicación por cédula
  - Retorna mapeos de HCU

### 3. TypeScript Service
- **Archivo:** `src/services/syncService.ts`
- **Clase:** `SyncService`
  - `inicializarHospitalLocal()` - Descarga referencias iniciales
  - `crearPacienteLocal()` - Crea paciente con HCU temporal
  - `sincronizar()` - Sincroniza bidireccional
  - `obtenerEstadoSync()` - Estado actual
  - `useSyncService()` - Hook de React

---

## 📋 Pasos de Implementación

### PASO 1: Ejecutar Migration (Día 1)

```bash
# 1. Copiar archivo migration a carpeta supabase/migrations/
# El archivo ya está en: supabase/migrations/20260614_hospital_local_schema.sql

# 2. Ejecutar migration
supabase migration up

# 3. Verificar tablas creadas
supabase db list-tables  # Debería mostrar hospital_local.*
```

**Verificación:**
```sql
-- En Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'hospital_local'
ORDER BY table_name;

-- Debería retornar:
-- centros_salud_sincronizado
-- distritos_sincronizado
-- hcu_mapping
-- pacientes_maestro_local
-- pacientes_pendientes_sync
-- profesionales_sincronizado
-- sync_log_local
-- sync_queue
```

### PASO 2: Deploy Edge Functions (Día 1-2)

```bash
# 1. Copiar archivos
# - supabase/functions/sync-pull/index.ts
# - supabase/functions/sync-push/index.ts

# 2. Deploy
supabase functions deploy sync-pull
supabase functions deploy sync-push

# 3. Verificar que están disponibles
# En Supabase Dashboard → Functions
# Debería mostrar:
# - sync-pull (POST)
# - sync-push (POST)
```

**Testing de Edge Functions:**

```bash
# Test sync-pull
curl -X POST https://<project>.supabase.co/functions/v1/sync-pull \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <anon_key>" \
  -d '{"tipo":"distritos"}'

# Respuesta esperada:
# {
#   "exitoso": true,
#   "tipo": "distritos",
#   "total": 20,
#   "registros": 20,
#   "datos": [...]
# }
```

### PASO 3: Instalar SyncService (Día 2)

```bash
# 1. Copiar archivo
# - src/services/syncService.ts

# 2. Instalar dependencias (si faltan)
npm install @supabase/supabase-js

# 3. Verificar imports en tu proyecto
# En src/main.tsx o src/App.tsx:
import { SyncService } from './services/syncService'
```

### PASO 4: Integrar en Componente (Día 2-3)

**Ejemplo: Usar SyncService en AdmisionCentral.tsx**

```typescript
import { useSyncService, type PacientePendiente } from '@/services/syncService'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export function AdmisionCentral() {
  const supabase = useSupabaseClient()
  const syncService = useSyncService(supabase)  // ✅ Detecta conexión automáticamente
  
  const [estado, setEstado] = useState<'buscando' | 'encontrado' | 'nuevo' | 'error'>('buscando')
  const [cedula, setCedula] = useState('')
  const [hcu, setHcu] = useState<string | null>(null)
  
  const buscarOCrearPaciente = async () => {
    const resultado = await syncService.crearPacienteLocal({
      cedula,
      nombre: 'Test',
      apellido: 'User',
      fecha_nacimiento: '1990-01-15',
      nombre_distrito: 'Riaba',
      genero: 'M'
    })
    
    if (resultado.exitoso) {
      setHcu(resultado.hcu)
      setEstado(resultado.encontrado ? 'encontrado' : 'nuevo')
    } else {
      setEstado('error')
    }
  }
  
  return (
    <div>
      <input 
        value={cedula}
        onChange={(e) => setCedula(e.target.value)}
        placeholder="Cédula del paciente"
      />
      <button onClick={buscarOCrearPaciente}>Buscar/Crear</button>
      
      {hcu && (
        <div className="bg-green-100 p-4 mt-4">
          <p className="font-bold">HCU: {hcu}</p>
          <p className="text-sm text-gray-600">
            Estado: {estado === 'nuevo' ? 'Pendiente sincronización' : 'Sincronizado'}
          </p>
        </div>
      )}
    </div>
  )
}
```

### PASO 5: Crear Dashboard de Sincronización (Día 3)

**Componente: SyncStatusDashboard.tsx**

```typescript
import { useSyncService } from '@/services/syncService'
import { useEffect, useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export function SyncStatusDashboard() {
  const supabase = useSupabaseClient()
  const syncService = useSyncService(supabase)
  const [estado, setEstado] = useState<any>(null)
  
  useEffect(() => {
    const obtenerEstado = async () => {
      const estadoActual = await syncService.obtenerEstadoSync()
      setEstado(estadoActual)
    }
    
    obtenerEstado()
    
    // Actualizar cada 30 segundos
    const intervalo = setInterval(obtenerEstado, 30000)
    return () => clearInterval(intervalo)
  }, [syncService])
  
  if (!estado) return <div>Cargando...</div>
  
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Estado de Sincronización</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded">
          <p className="text-gray-600">Centros Locales</p>
          <p className="text-2xl font-bold">{estado.centros_locales}</p>
        </div>
        
        <div className="bg-white p-4 rounded">
          <p className="text-gray-600">Profesionales</p>
          <p className="text-2xl font-bold">{estado.profesionales_locales}</p>
        </div>
        
        <div className="bg-white p-4 rounded">
          <p className="text-gray-600">Pacientes con HCU</p>
          <p className="text-2xl font-bold">{estado.pacientes_con_hcu}</p>
        </div>
        
        <div className="bg-white p-4 rounded">
          <p className="text-gray-600">Pendientes Sync</p>
          <p className="text-2xl font-bold text-orange-500">
            {estado.pacientes_pendientes}
          </p>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-blue-50 rounded">
        <p className="text-sm text-gray-600">
          Última sincronización:{' '}
          {estado.ultima_sincronizacion 
            ? new Date(estado.ultima_sincronizacion).toLocaleString('es-ES')
            : 'Nunca'}
        </p>
        <p className="text-sm text-gray-600">
          Cambios en cola: {estado.cambios_en_cola}
        </p>
      </div>
      
      <div className="mt-4">
        <p className="text-sm">
          {navigator.onLine ? (
            <span className="text-green-600">✅ Conectado</span>
          ) : (
            <span className="text-red-600">📴 Sin conexión (Modo Offline)</span>
          )}
        </p>
      </div>
    </div>
  )
}
```

---

## 🧪 Testing Manual

### Test 1: Inicializar Hospital

```typescript
import { SyncService } from '@/services/syncService'

const syncService = new SyncService(supabase, 'https://...')
const resultado = await syncService.inicializarHospitalLocal()

console.log('Inicialización:', resultado)
// {
//   exitoso: true,
//   distritos: 20,
//   centros: 145,
//   profesionales: 1234,
//   pacientes: 5000
// }
```

### Test 2: Crear Paciente Offline

```typescript
// Sin conexión a internet
const resultado = await syncService.crearPacienteLocal({
  cedula: '1234567890',
  nombre: 'María',
  apellido: 'García',
  fecha_nacimiento: '1990-01-15',
  nombre_distrito: 'Riaba',
  genero: 'F'
})

console.log('Paciente creado:', resultado)
// {
//   exitoso: true,
//   encontrado: false,
//   hcu: 'HCU-LOCAL-DSR-20260614120000-0001',
//   estado: 'pendiente_sincronizacion'
// }
```

### Test 3: Sincronizar

```typescript
// Conectar a internet
const resultado = await syncService.sincronizar()

console.log('Sincronización:', resultado)
// {
//   exitoso: true,
//   sincronizados: 1,
//   mapeos: [
//     {
//       cedula: '1234567890',
//       resultado: 'creado',
//       hcu: 'HCUDSR2026000001'
//     }
//   ]
// }
```

### Test 4: Verificar HCU Reemplazado

```typescript
// Después de sincronizar, verificar que el HCU fue reemplazado en BD local
const { data } = await supabase
  .from('hospital_local.pacientes_maestro_local')
  .select('hcu, cedula')
  .eq('cedula', '1234567890')

console.log('Paciente actualizado:', data[0])
// {
//   hcu: 'HCUDSR2026000001',  // ← REAL (antes era HCU-LOCAL-...)
//   cedula: '1234567890'
// }
```

---

## 🚀 Checkpoints

- [ ] Migration ejecutada sin errores
- [ ] Schema hospital_local visible en Supabase
- [ ] Edge Functions /sync-pull y /sync-push deployadas
- [ ] SyncService importable en src/
- [ ] AdmisionCentral integrada con SyncService
- [ ] Detecta conexión online/offline
- [ ] Crea pacientes con HCU temporal offline
- [ ] Sincroniza cuando hay conexión
- [ ] Reemplaza HCU-LOCAL por HCU-REAL
- [ ] Dashboard muestra estado correcto
- [ ] Testing manual completado

---

## 📊 Timeline Resumido

```
Día 1:
  - Ejecutar migration
  - Deploy Edge Functions
  - Testing básico

Día 2-3:
  - Integrar SyncService en AdmisionCentral
  - Crear Dashboard
  - Testing completo

Día 3-4:
  - UAT con hospital piloto
  - Refinamientos si es necesario
```

---

## ❓ FAQ de Implementación

**P: ¿La migration interfiere con las existentes?**
A: No. Crea schema `hospital_local` que es independiente. Las migraciones anteriores siguen intactas.

**P: ¿Las Edge Functions usan la misma Supabase que HOSIX?**
A: Sí. Se conectan al mismo proyecto. Sin embargo, leen del Nodo Central (`nodo_central.*`) y escriben en `hospital_local.*`.

**P: ¿Qué pasa si el hospital nunca se conecta?**
A: Sigue funcionando 100% offline. Los pacientes se crean con HCU temporal. Si llegan a conectarse, se sincroniza automáticamente.

**P: ¿Cómo manejamos conflictos de la misma cédula en 2 hospitales?**
A: El Nodo Central tiene el lock. El primero que sincroniza gana, el segundo recibe "paciente existe" y usa el HCU ya generado.

---

## ✅ Próximo Paso

Una vez implementado todo, te avisaré para:
1. Testing end-to-end completo
2. UAT con un hospital piloto
3. Documentar procedure para otros hospitales

**Status:** Listo para comenzar Día 1. ¿Empezamos? 🚀
