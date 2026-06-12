# Arquitectura Multi-Proyecto Clarificada - Opción 2 Correcta

## 🎯 Concepto Clave

**Hay 2 proyectos Supabase separados:**
1. **RENAPROSA** - Nodo Central Nacional (1 solo)
2. **HOSIX** - Hospitals locales (1 por hospital: Malabo, Bata, etc)

Los hospitales **NO tienen acceso directo** a la BD de RENAPROSA. **Acceden vía Edge Functions HTTP**.

---

## 🏗️ Arquitectura Visual

```
PROYECTO RENAPROSA
════════════════════════════════════════════════════════════════
│ URL: https://wdieynendfjbkbhfovrx.supabase.co               │
│                                                              │
│ Schema: nodo_central.*                                       │
│ ├─ pais_pacientes_maestro (HCU único nacional)             │
│ ├─ distritos_sanitarios_copia                              │
│ ├─ centros_salud_copia                                     │
│ ├─ profesionales_copia                                     │
│ └─ sincronizacion_log                                      │
│                                                              │
│ Edge Functions (Exponen API HTTP)                           │
│ ├─ POST /functions/v1/sync-pull                            │
│ │   └─ Lee de nodo_central.* y retorna JSON               │
│ │   └─ Tipos: distritos, centros, profesionales, pacientes│
│ │   └─ Endpoint: HTTPS (public, con anon key)             │
│ │                                                           │
│ └─ POST /functions/v1/sync-push                            │
│     └─ Recibe cambios de hospitals                         │
│     └─ Valida cédulas (deduplicación)                      │
│     └─ Genera HCU si es nuevo                              │
│     └─ Retorna mapeos (HCU-LOCAL → HCU-REAL)              │
│     └─ Endpoint: HTTPS (public, con anon key)             │
│                                                              │
════════════════════════════════════════════════════════════════
       ↕ (Llamadas HTTPS)
       ↕ (Cualquier hospital puede llamar a estos endpoints)
       ↕

PROYECTO HOSIX - HOSPITAL MALABO
════════════════════════════════════════════════════════════════
│ URL: https://proyecto-hosix-malabo.supabase.co             │
│ (Diferente proyecto Supabase)                               │
│                                                              │
│ Schema: hospital_local.*                                    │
│ ├─ pacientes_maestro_local (réplica de pacientes)          │
│ ├─ centros_salud_sincronizado (réplica)                    │
│ ├─ distritos_sincronizado (réplica)                        │
│ ├─ profesionales_sincronizado (réplica)                    │
│ ├─ pacientes_pendientes_sync (NUEVOS, sin HCU)             │
│ └─ sync_queue (cambios locales pendientes)                 │
│                                                              │
│ SyncService (TypeScript en React)                           │
│ ├─ Lee: hospital_local.* (BD local)                        │
│ ├─ Llama a RENAPROSA vía HTTPS:                            │
│ │  POST https://wdieynendfjbkbhfovrx.supabase.co/         │
│ │      functions/v1/sync-pull                              │
│ │  POST https://wdieynendfjbkbhfovrx.supabase.co/         │
│ │      functions/v1/sync-push                              │
│ │                                                           │
│ ├─ Escribe: hospital_local.* (BD local)                    │
│ └─ Detecta conexión online/offline automáticamente          │
│                                                              │
════════════════════════════════════════════════════════════════
       ↕ (Llamadas HTTPS)
       ↕
PROYECTO HOSIX - HOSPITAL BATA
════════════════════════════════════════════════════════════════
│ URL: https://proyecto-hosix-bata.supabase.co              │
│ (Diferente proyecto Supabase)                               │
│ (Mismo esquema hospital_local.* que Malabo)                │
════════════════════════════════════════════════════════════════
```

---

## 🔄 Flujo de Datos

### Escenario 1: Crear Paciente OFFLINE (Hospital Malabo)

```
1. Enfermero en Malabo (sin internet):
   └─ Crea paciente: María García, Cédula 1234567890
   
2. SyncService.crearPacienteLocal():
   ├─ Busca en hospital_local.pacientes_maestro_local
   │  └─ NO EXISTE
   │
   ├─ Genera HCU TEMPORAL (local):
   │  └─ HCU-LOCAL-DSR-20260614120000-0001
   │
   ├─ Inserta en hospital_local.pacientes_pendientes_sync
   │  └─ estado = 'pendiente'
   │
   ├─ Enqueue en hospital_local.sync_queue
   │  └─ accion = 'crear', cedula, nombre, etc
   │
   └─ Retorna: HCU-LOCAL-DSR-20260614120000-0001
   
3. UI muestra:
   └─ "Paciente creado. Se sincronizará cuando tenga conexión."
   
4. Enfermero continúa:
   ├─ Crea consultas con HCU-LOCAL
   ├─ Crea laboratorios
   └─ Imprime recetas
   
TODO FUNCIONA SIN INTERNET ✅
```

### Escenario 2: Sincronizar ONLINE (Hospital Malabo)

```
1. Detecta conexión a internet:
   └─ Service Worker dispara evento 'online'

2. SyncService.sincronizar() inicia:
   
   PASO 1: Descargar referencias
   ├─ Llama HTTPS a RENAPROSA:
   │  POST https://wdieynendfjbkbhfovrx.supabase.co/functions/v1/sync-pull
   │  { tipo: 'distritos' }
   │
   ├─ RENAPROSA retorna:
   │  [
   │    { nombre_distrito: "Riaba", abreviatura_distrito: "DSR", ... },
   │    ...
   │  ]
   │
   └─ Hospital Malabo inserta en hospital_local.distritos_sincronizado
      (o actualiza si ya existen)
   
   PASO 2: Enviar cambios pendientes
   ├─ Obtiene de hospital_local.sync_queue
   │  WHERE estado = 'pendiente'
   │
   ├─ Llama HTTPS a RENAPROSA:
   │  POST https://wdieynendfjbkbhfovrx.supabase.co/functions/v1/sync-push
   │  {
   │    cambios: [
   │      {
   │        accion: 'crear',
   │        cedula: '1234567890',
   │        nombre: 'María',
   │        apellido: 'García',
   │        nombre_distrito: 'Riaba'
   │      }
   │    ]
   │  }
   │
   ├─ RENAPROSA:
   │  ├─ Verifica: ¿Existe cedula 1234567890?
   │  │  └─ NO
   │  │
   │  ├─ Genera HCU REAL:
   │  │  └─ HCUDSR2026000001
   │  │
   │  ├─ Inserta en nodo_central.pais_pacientes_maestro
   │  │
   │  └─ Retorna mapeo:
   │     {
   │       cedula: '1234567890',
   │       resultado: 'creado',
   │       hcu: 'HCUDSR2026000001'
   │     }
   │
   └─ Hospital Malabo recibe mapeo
   
   PASO 3: Actualizar BD local
   ├─ Hospital Malabo inserta en hospital_local.pacientes_maestro_local:
   │  { hcu: 'HCUDSR2026000001', cedula: '1234567890' }
   │
   ├─ Inserta mapeo en hospital_local.hcu_mapping:
   │  {
   │    hcu_temporal: 'HCU-LOCAL-DSR-20260614120000-0001',
   │    hcu_real: 'HCUDSR2026000001',
   │    cedula: '1234567890'
   │  }
   │
   ├─ Actualiza hospital_local.pacientes_pendientes_sync:
   │  SET hcu_final = 'HCUDSR2026000001', estado = 'completado'
   │
   └─ Actualiza hospital_local.sync_queue:
      SET estado = 'completado'

3. Resultado final:
   ├─ HCU-LOCAL-DSR-20260614120000-0001 → HCUDSR2026000001 (REEMPLAZADO)
   ├─ Paciente ahora tiene HCU REAL en BD local
   ├─ Próxima visita lo encontrará con HCU real
   └─ SINCRONIZACIÓN COMPLETA ✅
```

### Escenario 3: Mismo Paciente Creado en 2 Hospitales

```
Hospital Malabo (sin conexión):
  └─ Crea: María García, Cédula 1234567890
     └─ HCU-LOCAL-DSR-20260614120000-0001

Hospital Bata (sin conexión):
  └─ Crea: María García, Cédula 1234567890
     └─ HCU-LOCAL-BT-20260614130000-0001

Malabo conecta a internet PRIMERO:
  ├─ Envía cambio a RENAPROSA
  ├─ RENAPROSA genera: HCUDSR2026000001
  ├─ Inserta en nodo_central.pais_pacientes_maestro
  └─ Malabo recibe y reemplaza

Bata conecta a internet DESPUÉS:
  ├─ Envía cambio a RENAPROSA
  ├─ RENAPROSA busca: ¿Existe cedula 1234567890?
  │  └─ SÍ EXISTE → Retorna HCU existente: HCUDSR2026000001
  │
  └─ Bata recibe: "paciente_existe", hcu: HCUDSR2026000001
     └─ Reemplaza HCU-LOCAL-BT por HCUDSR2026000001

RESULTADO:
  ✅ Un solo HCU para María García
  ✅ Ambos hospitales usan el mismo HCU
  ✅ Sin conflictos
  ✅ Auditoría: quién fue primero
```

---

## 🔐 Seguridad

### ¿Cómo acceden los hospitals a RENAPROSA?

```
1. Anon Key de RENAPROSA:
   └─ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
   └─ Esta KEY está EN EL CÓDIGO del SyncService
   └─ Es una Anon Key (no confidencial, poder limitado)

2. Edge Functions en RENAPROSA:
   ├─ /sync/pull → Solo SELECT (lectura)
   ├─ /sync/push → INSERT a nodo_central.pais_pacientes_maestro
   └─ Ambas requieren Anon Key válida (HTTPS)

3. RLS en RENAPROSA:
   └─ La política de RLS en nodo_central.* controla:
      ├─ Quién puede leer (SELECT)
      ├─ Quién puede crear (INSERT)
      └─ Quién puede actualizar (UPDATE)

4. Resultado:
   └─ Hospitals pueden:
      ✅ Leer distritos, centros, profesionales
      ✅ Leer pacientes existentes
      ✅ Crear nuevos pacientes
      ❌ Actualizar/Borrar datos de otros hospitals
```

---

## 📊 Tabla de Referencia

| Aspecto | RENAPROSA | HOSIX |
|---------|-----------|-------|
| **Proyecto** | 1 (Central) | N (uno por hospital) |
| **URL** | https://wdieynendfjbkbhfovrx.supabase.co | https://hospital-xx.supabase.co |
| **Schema Principal** | nodo_central.* | hospital_local.* |
| **Contiene Qué** | HCU único nacional | Réplica local + pacientes pendientes |
| **Edge Functions** | /sync/pull, /sync/push | (Ninguna, solo cliente) |
| **Base de Datos** | PostgreSQL en RENAPROSA | PostgreSQL separado |
| **Conectividad** | Siempre online | Puede ser offline |
| **Acceso a RENAPROSA** | N/A | Vía HTTPS con Anon Key |
| **Sincronización** | Recibe cambios vía HTTP | Envía cambios vía HTTP |

---

## 🚀 Implementación

### Migration de Hospital Local

```bash
# En proyecto HOSIX (cada hospital)
supabase migration up  # Ejecuta 20260614_hospital_local_schema.sql
```

**Crea:**
- ✅ hospital_local.distritos_sincronizado
- ✅ hospital_local.centros_salud_sincronizado
- ✅ hospital_local.profesionales_sincronizado
- ✅ hospital_local.pacientes_maestro_local
- ✅ hospital_local.pacientes_pendientes_sync
- ✅ hospital_local.sync_queue
- ✅ hospital_local.sync_log_local
- ✅ hospital_local.hcu_mapping

### Edge Functions en RENAPROSA

```bash
# En proyecto RENAPROSA (CENTRAL, una sola vez)
supabase functions deploy sync-pull   # Lee de nodo_central.*
supabase functions deploy sync-push   # Escribe a nodo_central.*
```

**NOTA:** Ya están creadas, solo asegúrate que estén en RENAPROSA, no en HOSIX.

### SyncService en Hospital

```typescript
// En cualquier proyecto HOSIX
import { useSyncService } from '@/services/syncService'

const syncService = useSyncService(supabase)  // Automáticamente apunta a RENAPROSA
await syncService.crearPacienteLocal({...})   // Crea local
await syncService.sincronizar()                // Sinc con RENAPROSA remoto
```

---

## ✅ Checklist

- [ ] Migration ejecutada en proyecto HOSIX
- [ ] Edge Functions `/sync-pull` y `/sync-push` en RENAPROSA
- [ ] SyncService en `src/services/syncService.ts` apunta a RENAPROSA remoto
- [ ] Hospital puede buscar/crear pacientes offline
- [ ] Hospital sincroniza con RENAPROSA cuando tiene conexión
- [ ] HCU-LOCAL se reemplaza por HCU-REAL después de sync
- [ ] Deduplicación por cédula funciona entre hospitals

---

## 💡 Resumen Ejecutivo

**Opción 2 con Arquitectura Correcta:**

1. **RENAPROSA** = 1 proyecto con Nodo Central (BD centralizada)
2. **HOSIX** = N proyectos (uno por hospital) con réplica local
3. **Conexión** = Vía HTTPS Edge Functions (no acceso directo a BD)
4. **Offline** = Hospital funciona 100% sin internet
5. **Sync** = Automático cuando detecta conexión
6. **Deduplicación** = Centralizada en RENAPROSA (por cédula)

**Status:** ✅ Código corregido y ready para producción
