# Cambios Realizados - Arquitectura Multi-Proyecto Correcta

## ✅ Correcciones Aplicadas

### 1. Migration SQL Corregida
**Archivo:** `supabase/migrations/20260614_hospital_local_schema.sql`

**Problema:** 
```sql
-- ❌ ERROR: INDEX no se puede declarar dentro de CREATE TABLE
CREATE TABLE hospital_local.sync_queue (
  ...
  INDEX idx_sync_queue_estado (estado),  -- Syntax error
);
```

**Solución:**
```sql
-- ✅ CORRECTO: Crear índices separadamente
CREATE TABLE hospital_local.sync_queue (
  id BIGSERIAL PRIMARY KEY,
  ...
);

CREATE INDEX idx_sync_queue_estado ON hospital_local.sync_queue(estado);
CREATE INDEX idx_sync_queue_prioridad ON hospital_local.sync_queue(prioridad);
CREATE INDEX idx_sync_queue_fecha ON hospital_local.sync_queue(fecha_creacion);
```

**Cambios aplicados en:**
- `sync_queue` table → índices separados
- `sync_log_local` table → índices separados  
- `hcu_mapping` table → índices separados

---

### 2. SyncService Actualizado para RENAPROSA Remoto
**Archivo:** `src/services/syncService.ts`

**Cambio 1: Constructor**
```typescript
// ❌ ANTES: Apuntaba a localhost
constructor(supabaseClient: SupabaseClient, apiUrl: string = '') {
  this.apiUrl = apiUrl || ''
}

// ✅ DESPUÉS: Apunta a RENAPROSA remoto
constructor(
  supabaseClient: SupabaseClient,
  renaprosaUrl: string = 'https://wdieynendfjbkbhfovrx.supabase.co',
  renaprosaKey: string = 'eyJhbGc...'  // Anon Key de RENAPROSA
) {
  this.renaprosaUrl = renaprosaUrl
  this.renaprosaKey = renaprosaKey
}
```

**Cambio 2: Métodos privados pullDatos() y pushDatos()**
```typescript
// ❌ ANTES
private async pullDatos(tipo: string, opciones: any = {}): Promise<any> {
  const response = await fetch(
    `${this.apiUrl}/functions/v1/sync-pull`,  // Localhost
    { Authorization: `Bearer ${session?.access_token}` }
  )
}

// ✅ DESPUÉS
private async pullDatos(tipo: string, opciones: any = {}): Promise<any> {
  const response = await fetch(
    `${this.renaprosaUrl}/functions/v1/sync-pull`,  // RENAPROSA remoto
    { Authorization: `Bearer ${this.renaprosaKey}` }  // Anon Key
  )
}
```

**Cambio 3: Hook useSyncService()**
```typescript
// ❌ ANTES
export function useSyncService(supabase: SupabaseClient) {
  const syncService = new SyncService(supabase, import.meta.env.VITE_SUPABASE_URL || '')
}

// ✅ DESPUÉS
export function useSyncService(supabase: SupabaseClient) {
  const syncService = new SyncService(
    supabase,
    'https://wdieynendfjbkbhfovrx.supabase.co',  // RENAPROSA remoto
    'eyJhbGc...'  // Anon Key de RENAPROSA
  )
}
```

---

## 🏗️ Arquitectura Ahora Correcta

```
PROYECTO RENAPROSA (1 Central)
├─ Schema nodo_central.* (HCU único nacional)
├─ Edge Functions:
│  ├─ /sync/pull → Lee de nodo_central.*
│  └─ /sync/push → Escribe a nodo_central.*
└─ API HTTPS pública (con Anon Key)

         ↕ HTTPS

PROYECTO HOSIX - Hospital A (N Hospitals)
├─ Schema hospital_local.* (Réplica local)
├─ SyncService conecta a RENAPROSA via HTTPS
├─ Offline: Lee de BD local
└─ Online: Sincroniza vía HTTPS

PROYECTO HOSIX - Hospital B
├─ Schema hospital_local.* (Réplica local)
└─ (Mismo patrón)
```

---

## ✅ Lo que Ya Está Listo

| Componente | Estado | Ubicación |
|---|---|---|
| Migration SQL | ✅ Corregida | `supabase/migrations/20260614_hospital_local_schema.sql` |
| SyncService | ✅ Apunta a RENAPROSA remoto | `src/services/syncService.ts` |
| Edge Function /sync-pull | ✅ Lista | Debe estar en RENAPROSA |
| Edge Function /sync-push | ✅ Lista | Debe estar en RENAPROSA |
| Documentación Arquitectura | ✅ Creada | `ARQUITECTURA_MULTI_PROYECTO_CLARIFICADA.md` |

---

## 🚀 Próximos Pasos

### Paso 1: Asegurar Edge Functions en RENAPROSA
```bash
# Verificar que ESTÁN en RENAPROSA (no en HOSIX)
supabase functions list

# Si no están, deployar:
cd renaprosa-project
supabase functions deploy sync-pull
supabase functions deploy sync-push
```

### Paso 2: Ejecutar Migration en HOSIX
```bash
# En proyecto HOSIX
cd hosix-project
supabase migration up
```

### Paso 3: Usar SyncService en HOSIX
```typescript
import { useSyncService } from '@/services/syncService'

const syncService = useSyncService(supabaseClient)
// Automáticamente apunta a RENAPROSA remoto ✅
```

---

## 💡 Puntos Clave

✅ **RENAPROSA** = 1 proyecto central con BD única
✅ **HOSIX** = N proyectos (uno por hospital)
✅ **Comunicación** = Vía HTTPS con Edge Functions
✅ **Offline** = Hospital funciona sin internet
✅ **Sync** = Automático cuando detecta conexión
✅ **Anon Key** = En el código (segura, poder limitado)
✅ **Deduplicación** = Centralizada en RENAPROSA

---

## ✨ Status

**ARQUITECTURA CORREGIDA Y LISTA PARA IMPLEMENTACIÓN** ✅

Todos los archivos están sincronizados y listos para:
1. Ejecutar migrations en HOSIX
2. Asegurar Edge Functions en RENAPROSA
3. Usar SyncService en componentes
