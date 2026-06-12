# Guía Completa: Nodo Central

## Estado
✅ **Schema creado** - `supabase/migrations/20260612_nodo_central_schema.sql`
✅ **Edge Functions creadas** - búsqueda y creación de pacientes
⏳ **Integración en HOSIX** - próximo paso

---

## 1. Estructura del Nodo Central

### Tablas Principales

```
nodo_central/
├─ distritos_sanitarios (CE, BN, BS, EB, OB)
├─ hospitales_registrados (cada hospital tiene API key)
├─ pais_pacientes_maestro (HCU único nacional)
├─ tarjetas_sanitarias (TS-HOSXXX-AAAA-NNNNN)
├─ pais_historico_clinico (eventos clínicos)
├─ sincronizacion_log (auditoría)
└─ secuenciales_hcu (contador anual por distrito)
```

### Distritos Sanitarios (Ya Insertados)
```
CE - Centro-Este (Bioko)
BN - Bata-Norte (Continental)
BS - Bata-Sur (Continental)
EB - Este-Bioko (Bioko)
OB - Oeste-Bioko (Bioko)
```

---

## 2. Flujo de Uso: Admisión en Hospital

### Escenario 1: Paciente NUEVO (no existe en Nodo Central)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Enfermero en Admisión del Hospital A                     │
│    Ingresa cédula: "1234567890"                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. HOSIX busca en Nodo Central                              │
│    POST /functions/v1/nodo-central-buscar-paciente          │
│    {                                                         │
│      "cedula": "1234567890"                                 │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Nodo Central responde: NO ENCONTRADO                     │
│    {                                                         │
│      "encontrado": false                                    │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Mostrar formulario para crear paciente nuevo             │
│    - Nombre, Apellido, Fecha Nacimiento, Género             │
│    - Seleccionar Distrito Sanitario                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Crear en Nodo Central                                    │
│    POST /functions/v1/nodo-central-crear-paciente           │
│    {                                                         │
│      "cedula": "1234567890",                                │
│      "nombre": "Juan",                                      │
│      "apellido": "Pérez",                                   │
│      "fecha_nacimiento": "1980-05-15",                      │
│      "genero": "M",                                         │
│      "distrito_id": "uuid-de-CE",                           │
│      "telefono": "+240666111222",                           │
│      "email": "juan@example.com"                            │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Nodo Central responde con HCU generado                   │
│    {                                                         │
│      "exitoso": true,                                       │
│      "hcu": "HCUCE2026000001-7A",                            │
│      "paciente_id": "uuid-paciente",                        │
│      "mensaje": "Paciente creado exitosamente"              │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. HOSIX guarda localmente en hosix_pacientes:              │
│    {                                                         │
│      "cedula": "1234567890",                                │
│      "nombre": "Juan",                                      │
│      "apellido": "Pérez",                                   │
│      "hcu": "HCUCE2026000001-7A",  ← Del Nodo Central       │
│      "tarjeta_sanitaria": "TS-HOS001-2026-00001"            │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
```

### Escenario 2: Paciente EXISTENTE (ya tiene HCU)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Enfermero ingresa cédula: "9876543210"                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. HOSIX busca en Nodo Central                              │
│    POST /functions/v1/nodo-central-buscar-paciente          │
│    { "cedula": "9876543210" }                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Nodo Central responde: ENCONTRADO                        │
│    {                                                         │
│      "encontrado": true,                                    │
│      "paciente": {                                          │
│        "hcu": "HCUCE2026000001-7A",                          │
│        "cedula": "9876543210",                              │
│        "nombre_completo": "María García López",             │
│        "fecha_nacimiento": "1985-03-20",                    │
│        "genero": "F",                                       │
│        "alergias": "Penicilina",                            │
│        "condiciones_cronicas": "Hipertensión",              │
│        "tarjetas": [                                        │
│          {                                                  │
│            "numero_tarjeta": "TS-HOS001-2024-00150",        │
│            "hospital": "Hospital A",                        │
│            "activa": true                                   │
│          },                                                 │
│          {                                                  │
│            "numero_tarjeta": "TS-HOS002-2025-00075",        │
│            "hospital": "Hospital B",                        │
│            "activa": false                                  │
│          }                                                  │
│        ]                                                    │
│      }                                                      │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Mostrar datos del paciente en UI                         │
│    - Confirmar identidad                                    │
│    - Mostrar alergias, condiciones crónicas                 │
│    - Mostrar histórico de hospitalizaciones                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Si es primera vez en este hospital:                      │
│    - Crear nueva tarjeta sanitaria local                    │
│    - Sincronizar en hosix_pacientes con HCU                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. API Endpoints

### Endpoint 1: Buscar Paciente

**URL:** `POST /functions/v1/nodo-central-buscar-paciente`

**Headers:**
```
Content-Type: application/json
X-API-Key: <api-key-del-hospital>
```

**Request:**
```json
{
  "cedula": "1234567890"
}
```

**Response (Encontrado):**
```json
{
  "encontrado": true,
  "paciente": {
    "id": "uuid-paciente",
    "hcu": "HCUCE2026000001-7A",
    "cedula": "1234567890",
    "nombre_completo": "Juan Pérez García",
    "fecha_nacimiento": "1980-05-15",
    "genero": "M",
    "alergias": "Penicilina, Sulfonamidas",
    "condiciones_cronicas": "Hipertensión, Diabetes",
    "tarjetas": [
      {
        "numero_tarjeta": "TS-HOS001-2024-00150",
        "hospital": "Hospital Central",
        "activa": true,
        "fecha_emision": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

**Response (No encontrado):**
```json
{
  "encontrado": false
}
```

**Códigos HTTP:**
- `200 OK` - Búsqueda completada (encontrado o no)
- `400 Bad Request` - Cédula faltante
- `401 Unauthorized` - API Key inválida
- `500 Internal Server Error` - Error en servidor

---

### Endpoint 2: Crear Paciente

**URL:** `POST /functions/v1/nodo-central-crear-paciente`

**Headers:**
```
Content-Type: application/json
X-API-Key: <api-key-del-hospital>
```

**Request:**
```json
{
  "cedula": "1234567890",
  "nombre": "Juan",
  "apellido": "Pérez",
  "fecha_nacimiento": "1980-05-15",
  "genero": "M",
  "distrito_id": "uuid-of-CE",
  "telefono": "+240666111222",
  "email": "juan@example.com",
  "direccion": "Calle Principal #123"
}
```

**Response (Éxito):**
```json
{
  "exitoso": true,
  "hcu": "HCUCE2026000001-7A",
  "paciente_id": "uuid-paciente",
  "mensaje": "Paciente creado exitosamente"
}
```

**Response (Error - cédula duplicada):**
```json
{
  "exitoso": false,
  "mensaje": "Cédula ya existe en el sistema"
}
```

**Códigos HTTP:**
- `201 Created` - Paciente creado
- `400 Bad Request` - Campo faltante o inválido
- `401 Unauthorized` - API Key inválida
- `500 Internal Server Error` - Error en servidor

---

## 4. Configurar Hospital en Nodo Central

Para que un hospital pueda usar el Nodo Central, necesita:

1. **Estar registrado** en `nodo_central.hospitales_registrados`
2. **Tener una API Key** única
3. **Conocer su ID de distrito sanitario**

### SQL para registrar un hospital

```sql
-- 1. Obtener UUID del distrito
SELECT id FROM nodo_central.distritos_sanitarios WHERE codigo = 'CE';
-- Resultado: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

-- 2. Generar API Key
-- Usar UUID o hash SHA-256 del código del hospital
SELECT encode(digest('HOS001_2026_SECRET', 'sha256'), 'hex');
-- Resultado: 7e3b0c...

-- 3. Registrar hospital
INSERT INTO nodo_central.hospitales_registrados (
  codigo,
  nombre,
  distrito_id,
  direccion,
  telefono,
  email_contacto,
  api_key,
  api_base_url
) VALUES (
  'HOS001',
  'Hospital Central de Malabo',
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  'Avenida Principal, Malabo',
  '+240666111222',
  'admin@hospital.gq',
  '7e3b0c...',
  'http://localhost:3000/api'
)
RETURNING id, codigo, api_key;
```

---

## 5. Integración en HOSIX (Próximo Paso)

### Componente: `AdmisionCentralForm.tsx`

```typescript
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export function AdmisionCentralForm() {
  const [cedula, setCedula] = useState('')
  const [pacienteEncontrado, setPacienteEncontrado] = useState(null)

  // 1. Buscar paciente en Nodo Central
  const buscarMutation = useMutation({
    mutationFn: async (cedulaBuscar: string) => {
      const { data } = await supabase.functions.invoke(
        'nodo-central-buscar-paciente',
        {
          body: { cedula: cedulaBuscar },
          headers: {
            'X-API-Key': process.env.VITE_HOSPITAL_API_KEY
          }
        }
      )
      return data
    },
    onSuccess: (data) => {
      if (data.encontrado) {
        setPacienteEncontrado(data.paciente)
        // Mostrar datos del paciente
      } else {
        // Mostrar formulario de crear nuevo
      }
    }
  })

  // 2. Crear paciente si no existe
  const crearMutation = useMutation({
    mutationFn: async (nuevosPaciente) => {
      const { data } = await supabase.functions.invoke(
        'nodo-central-crear-paciente',
        {
          body: nuevosPaciente,
          headers: {
            'X-API-Key': process.env.VITE_HOSPITAL_API_KEY
          }
        }
      )
      return data
    },
    onSuccess: (data) => {
      if (data.exitoso) {
        // Guardar en hosix_pacientes local
        guardarPacienteLocal({
          cedula: formData.cedula,
          nombre: formData.nombre,
          apellido: formData.apellido,
          hcu: data.hcu, // ← Del Nodo Central
          tarjeta_sanitaria: `TS-HOS001-${new Date().getFullYear()}-${contador}`
        })
      }
    }
  })

  return (
    <div>
      <input
        value={cedula}
        onChange={(e) => setCedula(e.target.value)}
        placeholder="Ingresa cédula del paciente"
      />
      
      <button onClick={() => buscarMutation.mutate(cedula)}>
        Buscar en Nodo Central
      </button>

      {buscarMutation.isPending && <p>Buscando...</p>}

      {pacienteEncontrado && (
        <div>
          <h3>Paciente Encontrado</h3>
          <p>Nombre: {pacienteEncontrado.nombre_completo}</p>
          <p>HCU: {pacienteEncontrado.hcu}</p>
          <p>Alergias: {pacienteEncontrado.alergias}</p>
          <button onClick={() => admitirPaciente(pacienteEncontrado.hcu)}>
            Admitir
          </button>
        </div>
      )}

      {!pacienteEncontrado && buscarMutation.isSuccess && (
        <FormularioCrearPaciente
          cedula={cedula}
          onSubmit={(datos) => crearMutation.mutate(datos)}
        />
      )}
    </div>
  )
}
```

---

## 6. Tabla de Sincronización (Auditoría)

Cada operación queda registrada en `nodo_central.sincronizacion_log`:

```sql
SELECT 
  h.codigo as hospital,
  ts.tipo_sincronizacion,
  ts.estado,
  ts.created_at
FROM nodo_central.sincronizacion_log ts
JOIN nodo_central.hospitales_registrados h ON ts.hospital_id = h.id
ORDER BY ts.created_at DESC
LIMIT 10;
```

Resultado:
```
hospital | tipo_sincronizacion | estado   | created_at
---------|---------------------|----------|------------------
HOS001   | buscar_paciente     | exitoso  | 2026-06-12 10:15:30
HOS001   | crear_paciente      | exitoso  | 2026-06-12 10:16:45
HOS002   | buscar_paciente     | exitoso  | 2026-06-12 10:20:10
HOS001   | buscar_paciente     | exitoso  | 2026-06-12 10:25:00
```

---

## 7. Generador de HCU (Formato)

### Estructura del HCU

```
HCUCE2026000001-7A
│││││ │││  │││││ ││
│││││ │││  │││││ └─ Check Digit (hexadecimal)
│││││ │││  └────── Secuencial anual (6 dígitos)
│││││ └───────────── Año de generación
│└─┴───────────────── Código distrito sanitario (2 letras)
└──────────────────── Prefijo: HCU
```

### Validación

```typescript
function validarHCU(hcu: string): boolean {
  // Patrón: HCUXX####XXXXXX-XX
  const patron = /^HCU[A-Z]{2}\d{4}\d{6}-[A-F0-9]{2}$/
  return patron.test(hcu)
}

validarHCU('HCUCE2026000001-7A') // true
validarHCU('INVALID') // false
```

---

## 8. Próximos Pasos

### Fase 1: Integración Básica (Esta semana)
- [ ] Registrar hospitales en Nodo Central (SQL)
- [ ] Crear componente `AdmisionNodoCentral.tsx`
- [ ] Integrar búsqueda en admisión
- [ ] Almacenar HCU en hosix_pacientes local

### Fase 2: Sincronización Completa (Semana siguiente)
- [ ] Sincronizar alergias/condiciones crónicas
- [ ] Reportar eventos clínicos (hospitalizaciones, cirugías)
- [ ] Cron job para reconciliación

### Fase 3: Migración a Supabase Local (Futuro)
- [ ] Crear instancia local de Supabase
- [ ] Migrar schema `nodo_central` a DB local
- [ ] Cambiar `api_base_url` de hospitales
- [ ] Mantener API REST compatible

---

## 9. Troubleshooting

### Error: "API Key inválida"
- Verificar que `X-API-Key` está correcta en headers
- Verificar que hospital existe en `nodo_central.hospitales_registrados`
- Verificar que hospital está `activo = true`

### Error: "Cédula ya existe"
- La cédula ya está registrada en Nodo Central
- Hacer búsqueda en lugar de crear

### Error: "Distrito no encontrado"
- Usar UUID válido del distrito
- Valores válidos: CE, BN, BS, EB, OB (obtenidos de `distritos_sanitarios`)

---

## Conclusión

✅ **Nodo Central está LISTO** para integrarse en HOSIX.

**Próximo:** Integrar búsqueda/creación en `AdmisionCentral.tsx`
