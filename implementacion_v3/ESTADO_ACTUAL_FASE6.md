# Estado Actual - Fase 6 (Junio 2026)

## ✅ COMPLETADO

### 1. Arquitectura Multi-Proyecto
- **RENAPROSA (Central):** Proyecto Supabase remoto con Nodo Central
  - URL: `https://wdieynendfjbkbhfovrx.supabase.co`
  - Schema: `nodo_central.*`
  - Tablas maestras: distritos, centros, profesionales
  - Pacientes nacionales con HCU único

- **HOSIX (Hospitales Locales):** Proyectos Supabase independientes
  - Schema: `hospital_local.*`
  - Réplica local de referencias
  - Cola de sincronización offline-first
  - Mapeo HCU temporal → real

### 2. Datos Maestros Sincronizados
✅ **Distritos Sanitarios:** 18+ distritos copiados desde RENAPROSA
✅ **Centros de Salud:** 85+ centros copiados con categoría, director, especialidades
✅ **Profesionales:** 120+ profesionales aprobados con especialidades

### 3. Datos de Prueba
✅ **Pacientes en Nodo Central:** 16 pacientes ecuatoguineanos
  - Distribuidos en 6 distritos
  - Con HCU generado automáticamente
  - Con tipos de sangre y datos clínicos

### 4. Edge Functions (RENAPROSA)
✅ **sync-pull:** Descargar referencias (distritos, centros, profesionales, pacientes)
  ```
  POST /functions/v1/sync-pull
  Autenticación: anon key (publishable)
  ```

✅ **sync-push:** Crear/actualizar pacientes con HCU
  ```
  POST /functions/v1/sync-push
  Autenticación: secret key (service role)
  Genera HCU en Nodo Central
  Retorna mapeo TEMPORAL → REAL
  ```

### 5. SyncService (Cliente HOSIX)
✅ **Métodos Públicos:**
- `inicializarHospitalLocal()` - Descargar referencias iniciales
- `crearPacienteLocal()` - Crear paciente offline con HCU temporal
- `sincronizar()` - Sincronizar cambios pendientes
- `obtenerEstadoSync()` - Estado actual de sincronización

✅ **Características:**
- HCU temporal generado localmente (TEMP-XX-NNN-YYYY)
- Detección automática de conexión (online/offline)
- Cola de sincronización con reintentos
- Mapeo de HCU temporal a real después de sync
- Logging completo de eventos

### 6. Integración en Frontend
✅ **PacienteForm.tsx:**
- Detección de estado online/offline
- Creación offline con HCU temporal
- Sincronización automática al restaurar conexión
- UI feedback (alertas, indicadores de estado)

✅ **DashboardSincronizacion.tsx:**
- Estado de conexión (🟢 En línea / 🔴 Offline)
- Estadísticas en tiempo real:
  - Centros sincronizados
  - Profesionales activos
  - Pacientes con HCU real
  - Pacientes con HCU temporal (offline)
  - Cambios en cola
  - Última sincronización
- Botones: "Descargar Referencias" y "Sincronizar Ahora"
- Auto-refresco cada 30 segundos

✅ **Configuración.tsx:**
- Nueva pestaña "Sync" integrada
- Acceso directo al dashboard de sincronización

### 7. Base de Datos

**RENAPROSA (nodo_central):**
```
- distritos_sanitarios_copia: 18+ registros
- centros_salud_copia: 85+ registros
- profesionales_copia: 120+ registros
- pais_pacientes_maestro: 16 pacientes de prueba
- tarjetas_sanitarias: estructura lista
- sincronizacion_log: eventos registrados
- secuenciales_hcu: contadores por distrito/año
```

**HOSIX (hospital_local):**
```
- distritos_sincronizado: réplica local
- centros_salud_sincronizado: réplica local
- profesionales_sincronizado: réplica local
- pacientes_maestro_local: pacientes con HCU real
- pacientes_pendientes_sync: pacientes temporales
- sync_queue: cola de cambios pendientes
- hcu_mapping: mapeo TEMP → REAL
- sync_log_local: auditoria local
```

### 8. Flujo Offline-First Completo

**Sin Conexión:**
```
1. Usuario crea paciente en PacienteForm
2. SyncService.crearPacienteLocal()
   ├─ Genera HCU temporal (TEMP-BN-001-2024)
   ├─ Inserta en pacientes_pendientes_sync
   ├─ Enqueue en sync_queue
   └─ Retorna HCU temporal
3. Paciente operativo localmente
4. UI muestra: "Sin conexión. Se sincronizará cuando haya conexión"
```

**Con Conexión Restaurada:**
```
1. Evento 'online' → sincronizar automático
2. SyncService.sincronizar()
   ├─ Obtiene cambios pendientes de sync_queue
   ├─ POST a RENAPROSA:/functions/v1/sync-push
   ├─ RENAPROSA genera HCU real (HCU-0001-BN-2024-001)
   ├─ Retorna mapeo TEMP → REAL
   ├─ Actualiza pacientes_maestro_local
   ├─ Inserta mapeo en hcu_mapping
   ├─ Marca sync_queue como completado
   └─ Retorna confirmación
3. HCU temporal reemplazado por real
4. Paciente disponible en RENAPROSA
```

### 9. Testing
✅ **SyncService Tests:**
- Test de creación local offline
- Test de búsqueda de paciente existente
- Test de sincronización
- Test de manejo de errores
- Test de generación de HCU (format validation)
- Test de resolución de conflictos (first-write-wins)
- Test de detección online/offline
- Test de edge cases

---

## 🔄 EN PROCESO / PENDIENTE

### Fase 6.3 - Portal Web de Pacientes
**Estado:** No iniciado
**Objetivos:**
- Crear acceso web para pacientes
- Historial médico en línea
- Citas médicas
- Recetas y medicamentos
- Resultados de laboratorio

### Fase 6.5 - MPI Centralizado
**Estado:** Infraestructura lista en nodo_central
**Objetivos:**
- Master Patient Index completo
- Búsqueda nacional por cédula
- Deduplicación de pacientes
- Historial médico consolidado
- Sincronización de cambios

### Fase 6.6 - Seguridad Avanzada (Supabase)
**Estado:** No iniciado
**Objetivos:**
- Reemplazar Azure con Supabase Auth
- MFA/TOTP
- SMS OTP
- Email OTP
- Row Level Security (RLS)
- Auditoría completa

---

## 📋 MIGRACIONES APLICADAS

```bash
✅ 20260612_nodo_central_schema_optimizado.sql
   └─ Schema nodo_central con tablas y funciones

✅ 20260614_hospital_local_schema.sql
   └─ Schema hospital_local para réplica local offline

✅ 20260615_copiar_datos_renaprosa_a_nodo_central.sql
   └─ Copia de datos maestros reales (distritos, centros, profesionales)

✅ 20260615_pacientes_prueba_nodo_central.sql
   └─ 16 pacientes ecuatoguineanos para testing
```

---

## 📦 COMPONENTES IMPLEMENTADOS

### Servicios
- ✅ `src/services/syncService.ts` - SyncService completo con offline-first
- ✅ Tests en `src/services/__tests__/syncService.test.ts`

### Componentes UI
- ✅ `src/components/hosix/pacientes/PacienteForm.tsx` - Integración offline-first
- ✅ `src/components/hosix/configuracion/DashboardSincronizacion.tsx` - Nuevo dashboard
- ✅ `src/pages/Hosix/Configuracion.tsx` - Nueva pestaña "Sync"

### Edge Functions
- ✅ `supabase/functions/sync-pull/index.ts` - Adaptado a withSupabase
- ✅ `supabase/functions/sync-push/index.ts` - Adaptado a withSupabase

### Documentación
- ✅ `implementacion_v3/GUIA_SINCRONIZACION_OFFLINE_FIRST.md`
- ✅ `implementacion_v3/ARQUITECTURA_MULTI_PROYECTO_CLARIFICADA.md`
- ✅ `implementacion_v3/ESTADO_ACTUAL_FASE6.md` (este archivo)

---

## 🧪 COMO PROBAR

### 1. Verificar datos sincronizados
```sql
-- En RENAPROSA
SELECT COUNT(*) FROM nodo_central.distritos_sanitarios_copia;
SELECT COUNT(*) FROM nodo_central.centros_salud_copia;
SELECT COUNT(*) FROM nodo_central.profesionales_copia;
SELECT COUNT(*) FROM nodo_central.pais_pacientes_maestro;
```

### 2. Crear paciente offline en HOSIX
1. Abrir dev tools: F12 → Aplicación → Servicio workers
2. Simular offline: Network → Offline
3. Ir a Pacientes → Crear Nuevo
4. Llenar datos y click "Crear Paciente"
5. Verificar en BD local que se creó con HCU temporal

### 3. Sincronizar manualmente
1. Restaurar conexión
2. Ir a Configuración → Sync
3. Click "Sincronizar Ahora"
4. Verificar en logs que se sincronizó
5. Confirmar que HCU temporal se reemplazó por real en RENAPROSA

### 4. Ver estado en Dashboard
1. Configuración → Sync
2. Ver estadísticas en tiempo real
3. Verificar "Última sincronización"
4. Confirmar "Cambios pendientes" = 0 después de sync

---

## 🔗 INTEGRACIONES PENDIENTES

Para fases 6.3, 6.5, 6.6 necesitaremos:

1. **Portal Pacientes:**
   - Login con Supabase Auth
   - Búsqueda de citas por HCU
   - Descarga de resultados
   - Historial médico personalizado

2. **MPI:**
   - API de búsqueda nacional por cédula
   - Deduplicación automática
   - Merge de historiales
   - Validación de datos únicos

3. **Seguridad:**
   - Supabase Auth + MFA
   - RLS policies por rol
   - Auditoría de accesos
   - Encriptación de datos sensibles

---

## 📊 MÉTRICAS ACTUALES

| Métrica | Valor |
|---------|-------|
| Distritos sincronizados | 18+ |
| Centros de salud | 85+ |
| Profesionales aprobados | 120+ |
| Pacientes de prueba | 16 |
| Edge Functions | 2 (sync-pull, sync-push) |
| Componentes nuevos | 3 |
| Tests | 10+ casos |
| Migraciones | 4 |

---

## ✍️ NOTAS IMPORTANTES

1. **HCU Generation:** La función `nodo_central.fn_generar_hcu()` en RENAPROSA genera secuenciales por distrito y año. Verificar que los nombres de distrito coincidan exactamente.

2. **Triggers:** Los triggers en RENAPROSA (`trig_sync_distritos`, `trig_sync_centros`, `trig_sync_profesionales`) replican cambios futuros automáticamente. Los datos históricos fueron copiados manualmente con la migración 20260615.

3. **Offline Storage:** HOSIX almacena localmente en `hospital_local.*` schema. Cuando no hay conexión, todo opera desde BD local. Cuando se restaura, sincroniza con RENAPROSA remoto.

4. **First-Write-Wins:** Si dos hospitales crean el mismo paciente (mismo cédula), el primero en sincronizar "gana" y RENAPROSA retorna su HCU. El segundo obtiene el HCU del primero (no duplicado).

5. **Production Readiness:** El sistema está listo para testing. Para producción, se debe:
   - Validar performance con millones de pacientes
   - Implementar compresión de sync_queue
   - Agregar reintentos con backoff exponencial
   - Encriptar datos en tránsito
   - Auditoría de todos los cambios

---

**Actualizado:** 15 Junio 2026
**Próxima revisión:** Después de implementar Fase 6.3 (Portal Pacientes)
