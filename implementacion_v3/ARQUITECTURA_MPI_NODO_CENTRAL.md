# Arquitectura: MPI y Nodo Central para HOSIX

## 1. ¿Qué es MPI (Master Patient Index)?

<cite index="1-1">Un MPI facilita la identificación y vinculación de información clínica de pacientes dentro de una institución particular.</cite> En contextos de múltiples sedes o sistemas, <cite index="1-14">se usa el término EMPI (Enterprise Master Patient Index) para distinguir un índice que sirve una sola institución (MPI) de uno que contiene datos de múltiples instituciones.</cite>

### Propósito clave:
<cite index="6-5,6-6">El propósito principal es proporcionar una fuente única y autorizada para identificación de pacientes y crear un identificador único que se use consistentemente en todos los sistemas, permitiendo que proveedores accedan a una vista unificada de datos del paciente y promoviendo coordinación eficiente de cuidados.</cite>

### Cómo funciona:
<cite index="6-13,6-14,6-15">El MPI colecta datos de pacientes de varias fuentes (sistemas de registro, registros de salud electrónicos, sistemas de laboratorio, radiology), luego integra estos datos creando un registro unificado que consolida información de múltiples fuentes mediante un proceso ETL (extracción, transformación y carga).</cite>

---

## 2. Arquitectura: Nodo Central vs. Múltiples Proyectos Supabase

### Opción A: Mismo Proyecto Supabase (RECOMENDADO para Fase Inicial)

**Arquitectura:**
```
Supabase Principal (wdieynendfjbkbhfovrx)
├── auth (multi-rol, single point de verdad)
├── Schemas actuales (hospitalario, laboratorio, imagenología, etc.)
├── Schema nuevo: `mpi` (centralizado)
│   ├── mpi_pacientes (registro maestro único)
│   ├── mpi_identificadores_externos (mapeo a MRNs locales)
│   ├── mpi_busqueda_indices (búsqueda rápida)
│   └── mpi_auditoria (trazabilidad)
└── RLS policies (por sede/departamento)
```

**Ventajas:**
- Una sola autenticación y autorización (ideal con Supabase Auth + MFA)
- Simpler deployment: no hay múltiples proyectos a mantener
- Realtime subscriptions ya integrado
- Costo más bajo (un proyecto, una base de datos)
- Fácil auditoría centralizada

**Desventajas:**
- Single point of failure si el proyecto cae (mitigado con backups Supabase)
- Puede escalar más lentamente a nivel nacional

**Implementación para Fase 6.5:**
1. Crear schema `mpi` dentro del proyecto actual
2. RLS policies basadas en `auth.uid()` + tabla de roles por sede
3. Trigger automático: al crear paciente en cualquier módulo, inserta en `mpi_pacientes`
4. Identificadores únicos: `mpi_id` (UUID global) + local `mrn_xxx` (por sede)

---

### Opción B: Múltiples Proyectos Supabase (Escalada futura)

**Cuándo usar:**
- Múltiples instituciones/sistemas independientes
- Regulaciones que exigen separación de datos (ej. HIPAA regional)
- Volúmenes masivos de datos (millones de registros)

**No recomendado para Fase Inicial:** Añade complejidad de federación, sincronización entre proyectos y gestión de identidades distribuidas.

---

## 3. Nodo Central: Función y Ubicación

### Definición:
Un "Nodo Central" (Central Node) en arquitecturas de integración sanitaria es el punto único de orquestación, enrutamiento y coordinación de datos entre departamentos/sistemas.

<cite index="14-6,14-7,14-8,14-9">El modelo "Hub-and-Spoke" es la aproximación clásica: enrutamiento central, transformación y monitoreo. Es probado, común en hospitales, y aún tiene sentido para mucho tráfico HL7 v2.</cite>

### En HOSIX: Nodo Central = MPI + Orquestador

**Ubicación:**
- **DENTRO del mismo proyecto Supabase (Recomendado)**
- Schema: `nodo_central`
- Funciones: `nodo_central_*` (funciones SQL/RPC)

**Responsabilidades:**
1. **Orquestación de flujos:** Consulta → Lab → Imagenología → Caja
2. **Identificación de paciente:** Localizar/crear MPI ID
3. **Enrutamiento de datos:** Distribuir solicitudes a módulos correctos
4. **Sincronización en tiempo real:** Supabase Realtime + Edge Functions
5. **Auditoría centralizada:** Quién accedió qué, cuándo

**Esquema SQL:**

```sql
-- Nodo Central: Tabla maestra de orquestación
CREATE TABLE nodo_central.flujo_paciente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mpi_id UUID NOT NULL REFERENCES mpi.mpi_pacientes(id),
  etapa TEXT NOT NULL, -- 'admision','consulta','lab','imagen','caja','alta'
  estado TEXT NOT NULL, -- 'pendiente','en_proceso','completado','error'
  datos_flujo JSONB, -- Contexto del flujo actual
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now()
);

-- Tabla de sincronización por departamento
CREATE TABLE nodo_central.sincronizacion_modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo TEXT NOT NULL, -- 'laboratorio', 'imagenologia', 'caja', 'medicos'
  flujo_id UUID REFERENCES nodo_central.flujo_paciente(id),
  estado_sync TEXT NOT NULL, -- 'sincronizado', 'pendiente', 'error'
  timestamp_sync TIMESTAMP DEFAULT now()
);

-- Auditoría de decisiones del Nodo Central
CREATE TABLE nodo_central.auditoria_orquestacion (
  id BIGSERIAL PRIMARY KEY,
  mpi_id UUID NOT NULL REFERENCES mpi.mpi_pacientes(id),
  accion TEXT NOT NULL,
  usuario_id UUID REFERENCES auth.users(id),
  detalles JSONB,
  timestamp TIMESTAMP DEFAULT now()
);
```

---

## 4. Decisión: Supabase Auth para Seguridad (Fase 6.6)

### Por qué Supabase Auth en lugar de Azure AD:

| Criterio | Supabase Auth | Azure AD |
|----------|---------------|----------|
| **Costo** | Incluido en Supabase | Licencia separada ($6-15/usuario/mes) |
| **Integración** | Nativa con PostgreSQL + Realtime | Requiere integraciones adicionales |
| **MFA** | TOTP, SMS, Email OTP, WebAuthn | TOTP, SMS, Phone Call |
| **SSO** | OAuth2, SAML, social providers | Principalmente SAML/OAuth |
| **Time-to-value** | 2-3 días (APIs REST directas) | 1-2 semanas (setup ADFS/entra) |
| **RLS integrado** | Sí (`auth.uid()` en policies) | No (requiere middleware) |
| **Escalabilidad local** | Excelente para MVP/Fase 6 | Mejor para enfoques empresariales |

### Implementación Supabase Auth para HOSIX:

**Niveles de Seguridad (AAL):**
- **AAL1:** Email/Password (acceso básico)
- **AAL2:** Email + TOTP o SMS (acceso a datos sensibles)
- **AAL3:** WebAuthn/biométrica (acceso administrativo)

**Roles y RLS:**
```sql
-- Tabla de roles sanitarios
CREATE TABLE seguridad.roles_sanitarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID UNIQUE REFERENCES auth.users(id),
  rol TEXT NOT NULL, -- 'medico','enfermera','admin','farmaceutico'
  sede_id UUID REFERENCES sedes(id), -- Restricción por sede
  especialidad TEXT,
  mfa_nivel TEXT DEFAULT 'AAL1' -- AAL1, AAL2, AAL3
);

-- RLS Policy: Médico solo ve pacientes de su sede
CREATE POLICY "medicos_ven_pacientes_su_sede"
ON mpi.mpi_pacientes FOR SELECT
USING (
  sede_id = (
    SELECT sede_id FROM seguridad.roles_sanitarios
    WHERE usuario_id = auth.uid()
  )
);
```

**MFA Obligatorio para Roles Sensibles:**
- Médicos: AAL2 (MFA opcional, recomendado)
- Farmacéuticos: AAL2 (MFA obligatorio)
- Administradores: AAL3 (WebAuthn + TOTP)

---

## 5. Arquitectura Final: Integración MPI + Nodo Central + Auth

```
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE PROJECT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ SEGURIDAD (Fase 6.6)                                     │  │
│  │ ├─ Supabase Auth (AAL1/AAL2/AAL3)                        │  │
│  │ ├─ Roles & RLS por sede/departamento                     │  │
│  │ └─ MFA: TOTP, SMS, WebAuthn                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ NODO CENTRAL (Fase 6.3 Base)                             │  │
│  │ ├─ Orquestación de flujos clínicos                       │  │
│  │ ├─ Sincronización Realtime entre módulos                 │  │
│  │ ├─ Edge Functions: decisiones en tiempo real             │  │
│  │ └─ Auditoría centralizada                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ MPI - MASTER PATIENT INDEX (Fase 6.5)                    │  │
│  │ ├─ mpi_pacientes (registro único)                        │  │
│  │ ├─ mpi_identificadores_externos (MRN locales)            │  │
│  │ ├─ mpi_busqueda_indices (búsqueda rápida)                │  │
│  │ └─ mpi_auditoria (trazabilidad completa)                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ MÓDULOS (Existentes + Portal Web Pacientes)              │  │
│  │ ├─ Médicos (Consulta → solicitud Lab/Imagen)             │  │
│  │ ├─ Laboratorio (Recibe solicitud, genera resultado)      │  │
│  │ ├─ Imagenología (Similar a lab)                          │  │
│  │ ├─ Cajas (Procesa pago, emite recibo)                    │  │
│  │ ├─ Admisión (Genera turno automático)                    │  │
│  │ └─ Portal Web Pacientes (Vista unificada con MPI)        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Roadmap: Cómo implementar

### Fase 6.3 - Portal Web Pacientes
- Crear `nodo_central` schema básico
- Portal consume `/api/pacientes/` que internamente consulta MPI
- RLS: Paciente solo ve sus propios datos

### Fase 6.5 - MPI Centralizado
- Implementar schema `mpi` completo
- Migraciones para consolidar identificadores de pacientes existentes
- Trigger automático de sincronización

### Fase 6.6 - Seguridad Azure → Supabase Auth + MFA
- Configurar MFA en Supabase Auth
- RLS policies por sede/rol
- Dashboard de sesiones activas y auditoría

---

## 7. Conclusión

✅ **Decisión:** Usar Supabase mismo proyecto + Nodo Central interno + Supabase Auth/MFA

**Porque:**
- Nada que reinventar: Supabase ya tiene todo (Auth, RLS, Realtime, Functions)
- Menor complejidad operacional
- Mejor time-to-market para Fase 6.3, 6.5, 6.6
- Fácil escalabilidad futura (si es necesario, separar proyectos después)

**Siguiente paso:** Crear plan secuencial detallado para 6.3 → 6.5 → 6.6
