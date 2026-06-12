# HOSIX/RENAPROSA - Implementation Log

**Proyecto:** Sistema de Salud Descentralizado (Guinea Ecuatorial)
**Última actualización:** 15 Junio 2026
**Estado General:** Fase 6 (Offline-First Sync) - ✅ COMPLETADO

---

## TIMELINE

### Fase 1-5 (Histórico)
- ✅ Arquitectura base HOSIX
- ✅ Módulos clínicos (consultas, lab, imagenología)
- ✅ Cajas y billing
- ✅ Kioscos públicos
- ✅ Notificaciones
- ✅ Branding (Sermed logo)

### Fase 6 - Descentralización & Sincronización

#### 6.0 - Planificación & Arquitectura (Mayo - Junio 2026)

**Sesión 1: Clarificación de Requisitos**
- Confirmó que RENAPROSA es proyecto remoto separado (MPC independiente)
- Definió que HOSIX son múltiples proyectos locales (uno por hospital)
- Estableció flujo offline-first con replicación local
- Descartó cron jobs → triggers en RENAPROSA para replicación

**Sesión 2: Esquema Central**
- Creó `nodo_central.*` schema en RENAPROSA remoto
- Tablas: distritos, centros, profesionales, pacientes, HCU
- Funciones: generación HCU, sincronización, validación
- Triggers para replicación automática

**Sesión 3: Esquema Local Hospital**
- Creó `hospital_local.*` schema en HOSIX
- Tablas: réplica local, cola de sync, mapeo HCU, logs
- Idempotente: upsert por cédula, deduplicación
- Offline-first: pacientes temporales con HCU temporal

#### 6.1 - Edge Functions & API (Junio 2026)

**sync-pull:** Descarga de referencias
```typescript
Endpoint: /functions/v1/sync-pull
Entrada: { tipo: 'distritos|centros|profesionales|pacientes' }
Salida: { exitoso, tipo, total, datos: [...] }
Autenticación: anon key (publishable)
```

**sync-push:** Creación de pacientes centrales
```typescript
Endpoint: /functions/v1/sync-push
Entrada: { cambios: [...pacientes] }
Salida: { exitoso, mapeos: [{ cedula, hcu, resultado }] }
Autenticación: secret key (service role)
Genera HCU en RENAPROSA
```

Ambas adaptadas al modelo `withSupabase` (no Deno.serve)

#### 6.2 - SyncService & Integración (Junio 2026)

**SyncService.ts:**
```typescript
class SyncService {
  inicializarHospitalLocal() // Descargar referencias iniciales
  crearPacienteLocal() // Crear offline con HCU temporal
  sincronizar() // Sincronizar cambios pendientes
  obtenerEstadoSync() // Estado actual
  pullDatos() // Llamar sync-pull remoto
  pushDatos() // Llamar sync-push remoto
}

export useSyncService() // Hook de React
```

**Integración PacienteForm.tsx:**
- Detección online/offline
- Creación con HCU temporal
- Auto-sync al restaurar conexión
- UI feedback (alertas, indicadores)

**DashboardSincronizacion.tsx:**
- Estado de conexión
- Estadísticas en tiempo real
- Botones: Descargar Referencias, Sincronizar Ahora
- Auto-refresco cada 30s
- Integrado en Configuración → Sync

#### 6.3 - Datos Maestros (Junio 2026)

**Migración: copiar_datos_renaprosa_a_nodo_central.sql**
- Copió 18+ distritos sanitarios
- Copió 85+ centros de salud reales
- Copió 120+ profesionales aprobados
- Estrategia: UNION en dos pasos para evitar ForeignKey conflicts
- Resultado: ✅ Todos los datos maestros sincronizados

**Migración: pacientes_prueba_nodo_central.sql**
- Creó 16 pacientes ecuatoguineanos
- Distribuidos en 6 distritos diferentes
- Con HCU generado automáticamente
- Listos para testing de sincronización

#### 6.4 - Testing (Junio 2026)

**syncService.test.ts:**
- 10+ casos de test
- Cubre: creación local, sync, conflictos, offline/online
- Format validation HCU temporal y real
- Edge cases: distrito inexistente, fecha inválida
- Tests de detección de conexión

---

## ARCHIVOS MODIFICADOS/CREADOS

### Servicios
```
✅ NEW  src/services/syncService.ts (450+ líneas)
   └─ SyncService completo, useSyncService hook
   
✅ NEW  src/services/__tests__/syncService.test.ts (290+ líneas)
   └─ Tests con Vitest
```

### Componentes
```
✅ EDIT src/components/hosix/pacientes/PacienteForm.tsx
   ├─ +useSyncService hook
   ├─ +detección online/offline
   ├─ +crearPacienteLocal() en submit
   ├─ +UI feedback alertas
   └─ Tamaño: +150 líneas
   
✅ NEW  src/components/hosix/configuracion/DashboardSincronizacion.tsx (340+ líneas)
   ├─ Estado conexión
   ├─ Estadísticas en tiempo real
   ├─ Botones Descargar/Sincronizar
   ├─ Auto-refresco 30s
   └─ Resumen operativo
   
✅ EDIT src/pages/Hosix/Configuracion.tsx
   ├─ +import DashboardSincronizacion
   ├─ +new TabsTrigger "Sync"
   ├─ +TabsContent sincronizacion
   └─ Tamaño: +20 líneas
```

### Migraciones
```
✅ NEW  supabase/migrations/20260612_nodo_central_schema_optimizado.sql
   ├─ Schema nodo_central
   ├─ Tablas: distritos, centros, profesionales, pacientes
   ├─ Funciones: fn_generar_hcu, fn_sincronizar_*
   ├─ Triggers: trig_sync_*
   └─ ~500 líneas

✅ NEW  supabase/migrations/20260614_hospital_local_schema.sql
   ├─ Schema hospital_local
   ├─ Tablas: réplica local, sync_queue, hcu_mapping
   ├─ Índices para performance
   ├─ RLS policies
   └─ ~350 líneas

✅ NEW  supabase/migrations/20260615_copiar_datos_renaprosa_a_nodo_central.sql
   ├─ INSERT con UNION para distritos
   ├─ INSERT para centros de salud
   ├─ INSERT para profesionales (solo Aprobado)
   ├─ Estrategia: DO NOTHING en UNION
   └─ ~180 líneas

✅ NEW  supabase/migrations/20260615_pacientes_prueba_nodo_central.sql
   ├─ 16 pacientes ecuatoguineanos
   ├─ Con HCU generado automático
   ├─ Distribuidos en 6 distritos
   └─ ~140 líneas
```

### Edge Functions
```
✅ REWRITE supabase/functions/sync-pull/index.ts
   ├─ Cambiado a: withSupabase({ auth: ["publishable", "secret"] })
   ├─ Obtiene ctx.supabase en lugar de crear nuevo
   ├─ Mantiene lógica de consultas igual
   └─ ~115 líneas

✅ REWRITE supabase/functions/sync-push/index.ts
   ├─ Cambiado a: withSupabase({ auth: ["publishable", "secret"] })
   ├─ +Validación: requiere ctx.authMode === 'secret'
   ├─ Rechaza con 403 si usa anon key
   ├─ Mantiene lógica de HCU igual
   └─ ~185 líneas
```

### Documentación
```
✅ NEW  implementacion_v3/GUIA_SINCRONIZACION_OFFLINE_FIRST.md (580+ líneas)
   └─ Guía completa del flujo offline-first
   
✅ NEW  implementacion_v3/ESTADO_ACTUAL_FASE6.md (314 líneas)
   └─ Resumen de estado y tareas pendientes
   
✅ NEW  implementacion_v3/IMPLEMENTATION_LOG.md (este archivo)
   └─ Log detallado de todos los cambios
```

---

## ARQUITECTURA FINAL

### Multi-Proyecto
```
┌─────────────────────────────────────────────────────────────┐
│                    RENAPROSA (Central)                      │
│          Proyecto Supabase Remoto (Production)             │
├─────────────────────────────────────────────────────────────┤
│  nodo_central schema:                                        │
│  ├─ distritos_sanitarios_copia (18+)                        │
│  ├─ centros_salud_copia (85+)                               │
│  ├─ profesionales_copia (120+)                              │
│  ├─ pais_pacientes_maestro (16+ prueba)                     │
│  ├─ sincronizacion_log                                      │
│  ├─ secuenciales_hcu (por distrito/año)                     │
│  └─ tarjetas_sanitarias                                     │
│                                                              │
│  Edge Functions:                                             │
│  ├─ /functions/v1/sync-pull                                 │
│  └─ /functions/v1/sync-push                                 │
│                                                              │
│  Triggers:                                                   │
│  ├─ trig_sync_distritos (auto-replicate)                    │
│  ├─ trig_sync_centros (auto-replicate)                      │
│  └─ trig_sync_profesionales (auto-replicate)                │
└──────────────────┬──────────────────────────────────────────┘
                   │
        HTTPS Calls (sync-pull/push)
                   │
┌──────────────────┴──────────────────────────────────────────┐
│        HOSIX Hospital 1 (Proyecto Supabase Local)           │
│                 Instancia Independiente                      │
├─────────────────────────────────────────────────────────────┤
│  hospital_local schema (Offline-First):                      │
│  ├─ distritos_sincronizado (réplica)                        │
│  ├─ centros_salud_sincronizado (réplica)                    │
│  ├─ profesionales_sincronizado (réplica)                    │
│  ├─ pacientes_maestro_local (real HCU)                      │
│  ├─ pacientes_pendientes_sync (HCU temporal)                │
│  ├─ sync_queue (cambios pendientes)                         │
│  ├─ hcu_mapping (TEMP → REAL)                               │
│  └─ sync_log_local (auditoría)                              │
│                                                              │
│  SyncService:                                                │
│  ├─ crearPacienteLocal() → HCU TEMP                         │
│  ├─ sincronizar() → push a RENAPROSA                        │
│  ├─ pullDatos() → GET referencias remotas                   │
│  └─ obtenerEstadoSync() → estado actual                     │
│                                                              │
│  UI:                                                         │
│  ├─ PacienteForm: integración offline                       │
│  ├─ DashboardSincronizacion: estado y controles             │
│  └─ Configuración → Sync: acceso directo                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
     (Múltiples instancias de HOSIX)
                   │
        Hospital 2, Hospital 3, ... Hospital N
```

### Flujo Offline-First
```
Sin Conexión:
  user_crea_paciente → crearPacienteLocal()
    ├─ fn_generar_hcu_temporal() → TEMP-XX-NNN-YYYY
    ├─ INSERT pacientes_pendientes_sync
    ├─ INSERT sync_queue
    └─ return HCU temporal
  ✓ Paciente operativo localmente

Con Conexión:
  window.addEventListener('online') → sincronizar()
    ├─ SELECT from sync_queue (pendiente)
    ├─ POST RENAPROSA:/functions/v1/sync-push
    │   └─ RENAPROSA.fn_generar_hcu() → HCU-XXXX-XX-YYYY-NNN
    ├─ RETURN mapeos: [{ cedula, hcu_real }]
    ├─ INSERT hcu_mapping (TEMP → REAL)
    ├─ UPDATE pacientes_maestro_local
    ├─ UPDATE sync_queue (completado)
    └─ return { exitoso: true, sincronizados: N }
  ✓ HCU temporal reemplazado por real
  ✓ Paciente disponible en RENAPROSA
```

---

## METRICAS

| Métrica | Valor |
|---------|-------|
| **Líneas de Código** |  |
| - SyncService | 450 |
| - Tests | 290 |
| - Componentes nuevos | 340 + 150 |
| - Migraciones SQL | ~1200 |
| - **Total** | ~2430 |
| **Base de Datos** |  |
| - Distritos | 18+ |
| - Centros | 85+ |
| - Profesionales | 120+ |
| - Pacientes de prueba | 16 |
| **Funciones** |  |
| - Edge Functions | 2 |
| - SQL Functions | 3+ |
| - React Hooks | 1 (useSyncService) |
| **Testing** |  |
| - Test cases | 10+ |
| - Coverage areas | 8 (create, sync, error, conflict, etc) |
| **Documentación** |  |
| - Documentos nuevos | 3 |
| - Total páginas | ~1200 líneas |

---

## ERRORES CORREGIDOS

### Error 1: Invalid INDEX syntax
**Problema:** `CREATE TABLE ... (... INDEX idx_name ...)` no es válido en PostgreSQL
```sql
-- ❌ INCORRECTO
CREATE TABLE hospital_local.sync_queue (
  id BIGSERIAL PRIMARY KEY,
  estado VARCHAR(50),
  INDEX idx_state (estado)  ← INVÁLIDO
);

-- ✅ CORRECTO
CREATE TABLE hospital_local.sync_queue (
  id BIGSERIAL PRIMARY KEY,
  estado VARCHAR(50)
);
CREATE INDEX idx_sync_queue_estado ON hospital_local.sync_queue(estado);
```
**Solución:** Separar CREATE INDEX en statements independientes

### Error 2: Column does not exist
**Problema:** `d.codigo_provincia` no existe en `public.distrito_sanitario`
**Solución:** Usar nombres de columna reales: `d.abreviatura_provincia`

### Error 3: ForeignKey constraint violation
**Problema:** Intentar INSERT en `centros_salud_copia` sin que existan los distritos
**Solución:** INSERT distritos PRIMERO, luego centros (UNION en dos pasos)

### Error 4: System trigger permission denied
**Problema:** No se puede `DISABLE TRIGGER ALL` (triggers del sistema protegidos)
**Solución:** Insertar datos en orden correcto sin desactivar triggers

### Error 5: ON CONFLICT duplicate values
**Problema:** UNION producía duplicados con ON CONFLICT DO UPDATE
**Solución:** Usar `ON CONFLICT DO NOTHING` y dos INSERTs separados

---

## VALIDATION CHECKLIST

- ✅ Arquitectura multi-proyecto confirmada
- ✅ Edge Functions deployadas en RENAPROSA remoto
- ✅ Datos maestros sincronizados (distritos, centros, profesionales)
- ✅ SyncService completo con flujo offline-first
- ✅ PacienteForm integrado con offline
- ✅ DashboardSincronizacion implementado
- ✅ Tests escritos para SyncService
- ✅ Documentación completa
- ✅ HCU temporal generado localmente
- ✅ HCU real generado en RENAPROSA
- ✅ Mapeo TEMPORAL → REAL funcionando
- ✅ Auto-sync al restaurar conexión
- ✅ Detección de conflictos por cédula (first-write-wins)

---

## PRÓXIMAS FASES

### Fase 6.3 - Portal Web de Pacientes
**Componentes:**
- Portal web accesible (login + búsqueda)
- Historial médico por HCU
- Citas médicas
- Recetas y medicamentos
- Resultados de laboratorio

### Fase 6.5 - MPI Centralizado
**Componentes:**
- Master Patient Index nacional
- Búsqueda avanzada
- Deduplicación automática
- Historial consolidado

### Fase 6.6 - Seguridad Avanzada (Supabase)
**Componentes:**
- Supabase Auth (reemplazar Azure)
- MFA/TOTP
- SMS OTP
- Email OTP
- Row Level Security (RLS)
- Auditoría completa

---

**Versión:** 1.0
**Fecha:** 15 Junio 2026
**Próxima actualización:** Después de Fase 6.3
