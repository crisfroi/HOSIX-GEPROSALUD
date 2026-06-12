# Resumen Ejecutivo: Arquitectura Final del Sistema

## 🎯 Visión Completa

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RENAPROSA (Proyecto Base)                        │
│                    wdieynendfjbkbhfovrx.supabase.co                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Schema: public (EXISTENTE)                                        │
│  ├─ centros_salud (validados y clasificados)                       │
│  ├─ profesionales_sanitarios (aprobados)                           │
│  ├─ distrito_sanitario (estructura nacional)                       │
│  └─ profesional_centro_asignado (relaciones)                       │
│                                                                     │
│  Schema: nodo_central (NUEVO)                                      │
│  ├─ pais_pacientes_maestro (HCU único nacional)                    │
│  ├─ tarjetas_sanitarias (TS local por hospital)                    │
│  ├─ hospital_profesional_mapping (relación hospitals ↔ RENAPROSA) │
│  ├─ sync_log_global (auditoría centralizada)                       │
│  └─ [Funciones SQL para generación de HCU]                         │
│                                                                     │
│  Schema: sincronizacion_hospitals (NUEVO)                          │
│  ├─ hospital_sync_status (estado de cada hospital)                 │
│  ├─ sync_snapshot (fotos locales de datos)                         │
│  └─ [Logs de sincronización]                                       │
│                                                                     │
│  Edge Functions / Cron Jobs:                                       │
│  ├─ sync-renaprosa-a-central (cada 1h) ⏰                          │
│  ├─ generar-hcu-paciente-nuevo (tiempo real) 🆕                    │
│  └─ sync-central-a-hospitals (cada 1h) 📤                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  ↕
                    (Sincronización bidireccional)
                                  ↕
                    ┌─────────────────────────┐
                    │  HOSIX (Cada Hospital)  │
                    │  (En desarrollo)        │
                    └─────────────────────────┘
```

---

## 📊 Desglose de Componentes

### 1. RENAPROSA (Base de Centros y Profesionales)
**Estado:** ✅ EXISTENTE
**Función:** Registro Nacional de Profesionales Sanitarios

| Tabla | Registros Típicos | Uso |
|-------|------------------|-----|
| `centros_salud` | 50-200 | Base para asignar hospitales y profesionales |
| `profesionales_sanitarios` | 1,000-5,000 | Staff validado de healthcare |
| `distrito_sanitario` | 5 | Estructura regional |

**Hooks ya funcionales:**
- `useCentrosSalud()` → buscar, crear, actualizar centros
- `useProfesionales()` → filtrar profesionales
- `useDistritosSanitarios()` → obtener estructura geográfica

---

### 2. Nodo Central (Historia Clínica Única)
**Estado:** 🔨 EN CONSTRUCCIÓN (7 días)
**Función:** Registrar pacientes con identidad única nacional

**Tablas clave:**

#### `pais_pacientes_maestro`
```
Registro único del paciente a nivel nacional
├─ HCU: HCUCE2026000001-7A (nunca cambia)
├─ Cédula: validada y única
├─ Datos personales: nombre, fecha nac, género
├─ Referencia: centro donde se registra
├─ Alergias: JSON array
├─ Condiciones crónicas: JSON array
└─ Auditoría: quién, cuándo, qué cambió
```

#### `tarjetas_sanitarias`
```
Tarjeta local por hospital (puede cambiar)
├─ HCU: referencia al paciente único
├─ Hospital: código (HOS001, HOS002, etc)
├─ Número: TS-HOS001-2026-00001
├─ Activa: true/false
└─ Válida: con fecha de vencimiento
```

#### `hospital_profesional_mapping`
```
Vincula hospitales HOSIX con profesionales RENAPROSA
├─ Hospital código: HOS001
├─ Profesional ID: UUID de RENAPROSA
├─ Centro: dónde trabaja
├─ Sincronizado: true
└─ Fecha última sync: timestamp
```

---

### 3. Sincronización Automática (Cron Jobs)
**Estado:** 🔨 EN CONSTRUCCIÓN (2 días)
**Función:** Mantener todo sincronizado cada 1h

#### Cron Job 1: `sync-renaprosa-a-central`
```
CADA HORA:
  1. Leer centros validados de RENAPROSA
  2. Crear/actualizar en hospital_profesional_mapping
  3. Leer profesionales aprobados
  4. Vincular a sus centros
  5. Log: sync_log_global
  
RESULTADO: Nodo Central siempre tiene datos frescos de profesionales/centros
```

#### Cron Job 2: `generar-hcu-paciente-nuevo`
```
CUANDO HOSIX CREA UN PACIENTE SIN HCU:
  1. Recibir datos: cédula, nombre, provincia
  2. Generar HCU único usando RPC
  3. Insertar en pais_pacientes_maestro
  4. Retornar HCU a HOSIX
  5. Log: sync_log_global
  
RESULTADO: Cada paciente tiene HCU único nacional, inmediatamente
```

#### Cron Job 3: `sync-central-a-hospitals`
```
CADA HORA:
  1. Leer cambios en Nodo Central
  2. Distribuir a cada hospital HOSIX (vía API)
  3. Actualizar especialidades disponibles
  4. Enviar alergias frecuentes
  5. Log: sync_log_global
  
RESULTADO: HOSIX siempre ve datos referencia actualizados
```

---

## 🔄 Flujos de Datos

### Flujo 1: Crear Centro en RENAPROSA
```
Admin RENAPROSA:
  1. Crea centro: "Hospital Central Malabo"
  2. Estado: "validado"
  
Cron Job (sync-renaprosa-a-central):
  1. Detecta centro nuevo
  2. Crea mapping en hospital_profesional_mapping
  3. Genera hospital_codigo: HOS001
  4. Log: "centro_creado"

HOSIX:
  1. Ve nuevo hospital disponible
  2. Puede registrar pacientes para HOS001
```

### Flujo 2: Registrar Profesional en RENAPROSA
```
Admin RENAPROSA:
  1. Aprueba profesional: "Dr. Juan García"
  2. Centro: "Hospital Central Malabo"
  3. Estado: "Aprobado"

Cron Job (sync-renaprosa-a-central):
  1. Detecta profesional nuevo
  2. Vincular a su hospital
  3. Log: "profesional_agregado"

HOSIX:
  1. Ve Dr. Juan disponible en HOS001
  2. Puede asignarlo a consultas
```

### Flujo 3: Crear Paciente en HOSIX
```
Enfermero HOSIX:
  1. Cédula: 1234567890
  2. Busca en Nodo Central
  3. NO EXISTE
  
HOSIX:
  1. Crea formulario: nombre, edad, etc
  2. Envía POST /generar-hcu-paciente-nuevo

Edge Function:
  1. Genera HCU: HCUCE2026000001-7A
  2. Inserta en pais_pacientes_maestro
  3. Retorna HCU a HOSIX

HOSIX:
  1. Guarda localmente: hosix_pacientes.hcu = HCUCE2026000001-7A
  2. Muestra: "✅ Paciente registrado con HCU"
```

### Flujo 4: Paciente Repite Visita en Diferente Hospital
```
Enfermero HOSIX (Hospital B):
  1. Cédula: 9876543210
  2. Busca en Nodo Central
  3. ENCONTRADO: HCU = HCUCE2026000001-7A
  
Respuesta:
  {
    "encontrado": true,
    "hcu": "HCUCE2026000001-7A",
    "nombre": "María García",
    "alergias": "Penicilina",
    "condiciones_cronicas": ["Hipertensión"]
  }
  
HOSIX (Hospital B):
  1. Muestra: "Paciente previamente visto"
  2. Alerta: "⚠️ ALÉRGICO A PENICILINA"
  3. Crea tarjeta sanitaria local: TS-HOS002-2026-00001
```

---

## 📈 Beneficios Realizados

| Beneficio | Antes | Después | Impacto |
|-----------|-------|---------|--------|
| **Identidad única** | Duplicados posibles | HCU centralizado | ✅ Seguridad paciente |
| **Sincronización** | Manual | Automática cada 1h | ✅ Sin intervención humana |
| **Auditoría** | Ninguna | sync_log_global | ✅ Trazabilidad total |
| **Alergias** | Desconocidas entre hospitales | Visibles en cada visita | ✅ Seguridad clínica |
| **Escalabilidad** | Agregar hospital = manual | Automático | ✅ Crece sin esfuerzo |
| **Cumplimiento** | Débil | RLS + auditoría | ✅ Regulatorio |

---

## 🛠️ Tecnologías Utilizadas

| Componente | Tecnología | Rol |
|-----------|-----------|-----|
| **BD Principal** | PostgreSQL (Supabase) | Almacenar todo |
| **Autenticación** | Supabase Auth | Seguridad |
| **RLS Policies** | PostgreSQL | Control acceso por rol |
| **Edge Functions** | Deno | Lógica serverless |
| **Cron Jobs** | Supabase Scheduler | Sincronización automática |
| **Frontend** | React + TypeScript | UI/UX |
| **State** | React Query | Cache y sincronización |
| **Hooks RENAPROSA** | Custom React Hooks | Lógica de negocio |

---

## 📋 Checklist de Implementación

### Fase 1: Schemas (Días 1-2)
- [ ] Crear migration: `20260613_nodo_central_renaprosa.sql`
- [ ] Crear migration: `20260613_sincronizacion_hospitals_schema.sql`
- [ ] Ejecutar: `supabase migration up`
- [ ] Validar: tablas creadas sin errores

### Fase 2: Edge Functions (Días 3-4)
- [ ] Crear: `sync-renaprosa-a-central/index.ts`
- [ ] Crear: `generar-hcu-paciente-nuevo/index.ts`
- [ ] Deploy: `supabase functions deploy`
- [ ] Validar: funciones disponibles en endpoints

### Fase 3: Cron Jobs (Día 5)
- [ ] Configurar: `sync-renaprosa-a-central` cada 1h
- [ ] Configurar: `generar-hcu-paciente-nuevo` on-demand
- [ ] Prueba: ejecutar manual y verificar logs
- [ ] Validar: `sync_log_global` tiene registros

### Fase 4: Integración HOSIX (Días 6-7)
- [ ] Modificar: `AdmisionCentral.tsx`
- [ ] Integrar búsqueda de HCU
- [ ] Integrar creación con HCU automático
- [ ] Testing: flujos end-to-end
- [ ] Validar: pacientes con HCU localmente

---

## 🚀 Próximos Pasos (Después de esta semana)

### Semana 2: Testing y Optimización
- Ejecutar sincronización manual
- Validar data consistency
- Monitorear logs de sincronización
- Ajustar Cron Job schedule si es necesario

### Semana 3: Portal Web Pacientes
- Fase 6.3: Crear portal web
- Pacientes ven su HCU, alergias, citas
- Acceso solo a datos propios (RLS)

### Semana 4+: MPI y Seguridad
- Fase 6.5: Consolidar MPI
- Fase 6.6: Seguridad Avanzada con Auth/MFA

---

## 💡 Notas Importantes

1. **RENAPROSA es la base:** Centros y profesionales ya validados, no necesitamos recrearlos
2. **HCU es centralizado pero local:** Generado en Nodo Central, usado en HOSIX local
3. **Sincronización es asincrónica:** Cada 1h, no bloquea operaciones
4. **Sin replicación completa:** Solo metadatos y referencias, no datos clínicos masivos
5. **Migración futura fácil:** Cuando pases a Supabase local, copias el schema completo

---

## ✅ Conclusión

Se ha diseñado una **arquitectura distribuida pero centralizada** que permite:
- ✅ Historia Clínica Única nacional
- ✅ Sincronización automática cada hora
- ✅ Profesionales validados de RENAPROSA
- ✅ Centros ya clasificados
- ✅ Auditoría completa de todas las operaciones
- ✅ Fácil escalabilidad a nuevos hospitales
- ✅ Preparado para migración a Supabase local

**Status:** Listo para implementación (7 días de trabajo)
