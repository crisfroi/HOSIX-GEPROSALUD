# Estado: Nodo Central Completado ✅

## Qué se ha hecho esta sesión

### 1. Schema del Nodo Central Creado
**Archivo:** `supabase/migrations/20260612_nodo_central_schema.sql` (441 líneas)

**Incluye:**
- ✅ Schema `nodo_central` (separado del resto)
- ✅ 7 tablas maestro:
  - `distritos_sanitarios` (CE, BN, BS, EB, OB - ya insertados)
  - `hospitales_registrados` (registro de cada hospital con API key)
  - `pais_pacientes_maestro` (HCU único nacional)
  - `tarjetas_sanitarias` (TS local por hospital)
  - `pais_historico_clinico` (eventos clínicos consolidados)
  - `sincronizacion_log` (auditoría de todas las ops)
  - `secuenciales_hcu` (contador anual por distrito)

- ✅ 4 funciones SQL:
  - `obtener_proximo_secuencial()` - contador anual
  - `calcular_check_digit()` - validación de HCU
  - `generar_hcu()` - crear HCU único nacional
  - `validar_hcu()` - verificar formato HCU
  - `buscar_paciente_por_cedula()` - búsqueda
  - `crear_paciente_central()` - inserción con validación

- ✅ RLS policies:
  - Hospitales ven sus pacientes
  - Admin central ve todos
  - Histórico visible a hospitales relacionados

---

### 2. Edge Functions Creadas

#### A. `nodo-central-buscar-paciente/index.ts`
**Endpoint:** `POST /functions/v1/nodo-central-buscar-paciente`

```json
// REQUEST
{
  "cedula": "1234567890"
}

// RESPONSE (encontrado)
{
  "encontrado": true,
  "paciente": {
    "id": "uuid",
    "hcu": "HCUCE2026000001-7A",
    "cedula": "1234567890",
    "nombre_completo": "Juan Pérez García",
    "fecha_nacimiento": "1980-05-15",
    "genero": "M",
    "alergias": "Penicilina",
    "condiciones_cronicas": "Hipertensión",
    "tarjetas": [...]
  }
}
```

**Features:**
- Validación de API Key
- Búsqueda por cédula
- Retorna tarjetas sanitarias activas
- Logs automáticos en `sincronizacion_log`
- Manejo de errores completo

#### B. `nodo-central-crear-paciente/index.ts`
**Endpoint:** `POST /functions/v1/nodo-central-crear-paciente`

```json
// REQUEST
{
  "cedula": "1234567890",
  "nombre": "Juan",
  "apellido": "Pérez",
  "fecha_nacimiento": "1980-05-15",
  "genero": "M",
  "distrito_id": "uuid-CE",
  "telefono": "+240666111222",
  "email": "juan@example.com"
}

// RESPONSE (éxito)
{
  "exitoso": true,
  "hcu": "HCUCE2026000001-7A",
  "paciente_id": "uuid",
  "mensaje": "Paciente creado exitosamente"
}
```

**Features:**
- Validación completa de campos
- Generación automática de HCU
- Detección de cédulas duplicadas
- Logs de creación
- Check digit automático

---

### 3. Documentación Completa
**Archivo:** `implementacion_v3/GUIA_NODO_CENTRAL.md` (519 líneas)

**Contiene:**
- ✅ Estructura del Nodo Central
- ✅ Flujo completo de admisión (escenarios nuevo vs existente)
- ✅ Documentación de APIs (request/response, códigos HTTP)
- ✅ Cómo registrar un hospital
- ✅ Integración en HOSIX (código React)
- ✅ Auditoría de sincronización
- ✅ Validación de HCU
- ✅ Troubleshooting
- ✅ Próximos pasos

---

## Arquitectura Final

```
┌─────────────────────────────────────────────────┐
│         NODO CENTRAL (en tu Supabase)           │
├─────────────────────────────────────────────────┤
│  Schema: nodo_central                           │
│  ├─ pais_pacientes_maestro (HCU único)          │
│  ├─ tarjetas_sanitarias (TS locales)            │
│  ├─ hospitales_registrados (con API keys)       │
│  ├─ sincronizacion_log (auditoría)              │
│  └─ Edge Functions:                             │
│     ├─ nodo-central-buscar-paciente             │
│     └─ nodo-central-crear-paciente              │
└─────────────────────────────────────────────────┘
                        ↕
              (API REST + X-API-Key)
                        ↕
   ┌──────────────┬──────────────┬──────────────┐
   │   HOSPITAL 1 │  HOSPITAL 2  │  HOSPITAL N  │
   │   (HOSIX)    │   (HOSIX)    │   (HOSIX)    │
   │              │              │              │
   │ hosix_pacientes (incluye HCU) │              │
   └──────────────┴──────────────┴──────────────┘
```

---

## Cómo Usarlo

### Paso 1: Ejecutar Migración
```bash
supabase migration up
```

Esto crea el schema `nodo_central` con todas sus tablas, funciones e índices.

### Paso 2: Registrar Hospital (SQL)
```sql
-- Obtener UUID de distrito CE
SELECT id FROM nodo_central.distritos_sanitarios WHERE codigo = 'CE';

-- Insertar hospital
INSERT INTO nodo_central.hospitales_registrados (
  codigo, nombre, distrito_id, api_key, api_base_url, email_contacto
) VALUES (
  'HOS001',
  'Hospital Central Malabo',
  'uuid-CE',
  'api-key-secreto',
  'http://localhost:3000/api',
  'admin@hospital.gq'
);

-- Copiar api_key retornada
```

### Paso 3: Integrar en HOSIX
- Guardar API Key en env: `VITE_HOSPITAL_API_KEY`
- Integrar componentes de búsqueda/creación en `AdmisionCentral.tsx`
- Guardar HCU en `hosix_pacientes` (campo nuevo: `hcu`)

### Paso 4: Usar en Admisión
1. Enfermero ingresa cédula
2. HOSIX busca en Nodo Central
3. Si existe: mostrar datos + histórico
4. Si no existe: formulario de creación
5. Guardar localmente con HCU del Central

---

## HCU: Formato y Generación

### Ejemplos de HCU Generados
```
HCUCE2026000001-7A   (Hospital CE, Año 2026, Seq 1)
HCUCE2026000002-4B   (Hospital CE, Año 2026, Seq 2)
HCUBN2026000001-9C   (Hospital BN, Año 2026, Seq 1)
HCUEB2026000100-3F   (Hospital EB, Año 2026, Seq 100)
```

### Estructura
```
HCU|CE|2026|000001|-|7A
   ││   │    │      │ └─ Check digit (hexadecimal, Luhn)
   ││   │    └──────── Secuencial anual (6 dígitos)
   ││   └──────────── Año de creación
   └┴──────────────── Código distrito sanitario (2 letras)
```

---

## Flujos de Sincronización (Ya Funcionan)

### Hospital → Central
1. Enfermero busca cédula
2. HOSIX envía `POST /nodo-central-buscar-paciente` con API key
3. Central responde con HCU (o no encontrado)
4. Todo queda logueado en `sincronizacion_log`

### Central → Hospital
- Los hospitales consultan el endpoint cuando necesitan pacientes
- Pueden reportar eventos clínicos después (próxima fase)

### Auditoría
- Cada búsqueda/creación queda en `nodo_central.sincronizacion_log`
- Admin puede ver quién accedió qué, cuándo, con qué resultado

---

## Migración Futura a Supabase Local

Cuando decidas pasar a Supabase local:

1. **Crear BD local** (PostgreSQL)
2. **Copiar archivo de migración:**
   - `20260612_nodo_central_schema.sql` → BD local
3. **Actualizar Edge Functions:**
   - Cambiar `Deno.env.get('SUPABASE_URL')` a DB local
4. **Actualizar hospitales:**
   - Cambiar `api_base_url` a apuntar a Supabase local
5. **Listo:** mismo schema, mismo funcionamiento

**Ventaja:** código ya preparado para migrar sin reescribir.

---

## Próximo Paso

**Integrar en HOSIX:**

Necesitas crear/modificar `src/pages/Hosix/AdmisionCentral.tsx` para:
1. Llamar a `nodo-central-buscar-paciente` con cédula
2. Si existe: mostrar datos + alergias + condiciones crónicas
3. Si no existe: formulario para crear
4. Guardar HCU del Central en `hosix_pacientes.hcu`

¿Continuamos con eso?
