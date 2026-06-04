# GET: Estructura de Datos para Sincronización

## 📡 Endpoints GET Utilizados

### 1. GET: Profesionales Sanitarios (del remoto)

**URL**: `https://wdieynendfjbkbhfovrx.supabase.co/rest/v1/profesionales_sanitarios`

**Headers**:
```
Authorization: Bearer sb_publishable_9KoyZtFgO79lLad
Content-Type: application/json
```

**Query String** (filtrado por centro y aprobados):
```
?centro_salud_id=eq.{centro_id}
&estado_solicitud=eq.Aprobado
&select=id,id_profesional_unico,nombre_completo,especialidad,area_profesional,
        email,telefono,fecha_nacimiento,genero,numero_funcionario,
        estado_solicitud,centro_salud_id
```

**Respuesta Ejemplo**:
```json
[
  {
    "id": "2c1734ed-352d-4502-896f-748a5de9d9fb",
    "id_profesional_unico": "MED-2025-001",
    "nombre_completo": "DR. SILIÓ MBA ESONO",
    "especialidad": "Medicina General",
    "area_profesional": "Medicina",
    "email": "silio.mba@hospital.eq",
    "telefono": "+240222123456",
    "fecha_nacimiento": "1975-05-12",
    "genero": "Masculino",
    "numero_funcionario": "FUN-2025-001",
    "estado_solicitud": "Aprobado",
    "centro_salud_id": "5727583a-a8a3-4793-b4d6-ade6fe5c1234"
  },
  {
    "id": "d9558abf-d313-4950-83b2-cb2a597c83fc",
    "id_profesional_unico": "ENF-2025-002",
    "nombre_completo": "ENFERMERA MONIQUE OBOAMA",
    "especialidad": "Enfermería",
    "area_profesional": "Enfermería",
    "email": "monique.oboama@hospital.eq",
    "telefono": "+240222654321",
    "fecha_nacimiento": "1988-03-22",
    "genero": "Femenino",
    "numero_funcionario": "FUN-2025-002",
    "estado_solicitud": "Aprobado",
    "centro_salud_id": "5727583a-a8a3-4793-b4d6-ade6fe5c1234"
  }
]
```

---

### 2. GET: Centros de Salud (del remoto)

**URL**: `https://wdieynendfjbkbhfovrx.supabase.co/rest/v1/centros_salud`

**Headers**: Igual al anterior

**Query String** (filtrado):
```
?select=id,nombre,estado,distrito,categoria,sector
```

**Respuesta Ejemplo**:
```json
[
  {
    "id": "5727583a-a8a3-4793-b4d6-ade6fe5c1234",
    "nombre": "HOSPITAL PROVINCIAL DE LUBA",
    "estado": "Activo",
    "distrito": "Luba",
    "categoria": "Hospital Provincial",
    "sector": "Público"
  },
  {
    "id": "bcaf7185-d213-4042-a8c8-6e3937bdc5fe",
    "nombre": "CENTRO DE SALUD DE MOKA",
    "estado": "Activo",
    "distrito": "Moka",
    "categoria": "Centro de Salud",
    "sector": "Público"
  }
]
```

---

### 3. GET: Centros del Usuario (local)

**URL**: (LOCAL) `{BASE_URL}/rest/v1/centros_salud`

**Query**:
```
?select=id,nombre,estado,director
&estado=eq.Activo
```

**Respuesta**:
```json
[
  {
    "id": "5727583a-a8a3-4793-b4d6-ade6fe5c1234",
    "nombre": "HOSPITAL PROVINCIAL DE LUBA",
    "estado": "Activo",
    "director": "dir_001_uuid"
  }
]
```

---

## 🔄 Flujo de Sincronización - GET

```
1. Director hace click en "Sincronizar Profesionales"
   ↓
2. Sistema obtiene centro_salud_id del director loggeado
   ↓
3. GET https://remoto/rest/v1/profesionales_sanitarios
   Query: centro_salud_id=eq.{id}&estado_solicitud=eq.Aprobado
   ↓
4. Recibe [profesional1, profesional2, ...]
   ↓
5. Para cada profesional:
   - Si NO existe en local (por id_profesional_unico):
     → INSERT en hosix_usuarios
   - Si EXISTE:
     → UPDATE datos (excepto contraseña si ya fue cambiada)
   ↓
6. INSERT en hosix_sincronizacion_profesionales (auditoría)
   ↓
7. Mostrar resumen al director
```

---

## 📊 Campos Mapeados Durante Sincronización

| Campo Remoto | Campo Local (hosix_usuarios) | Tipo | Obligatorio |
|---|---|---|---|
| `id` | `profesional_remoto_id` | UUID | Sí |
| `id_profesional_unico` | `id_profesional_unico` | VARCHAR | Sí ✓ |
| `nombre_completo` | `nombre_completo` | VARCHAR | Sí ✓ |
| `email` | `email` | VARCHAR | No (default) |
| `especialidad` | `especialidad` | VARCHAR | No |
| `area_profesional` | `area_profesional` | VARCHAR | No |
| `telefono` | `telefono` | VARCHAR | No |
| `fecha_nacimiento` | `fecha_nacimiento` | DATE | No |
| `genero` | `genero` | VARCHAR | No |
| `numero_funcionario` | `numero_funcionario` | VARCHAR | No |
| `estado_solicitud` | `estado_solicitud` | VARCHAR | No (def: 'Aprobado') |
| `centro_salud_id` | `centro_salud_id` | UUID | Sí ✓ |
| (generado) | `username` | VARCHAR | Sí ✓ |
| (generado) | `contrasena_hasheada` | VARCHAR | Sí ✓ |
| (generado) | `cambio_password_requerido` | BOOLEAN | Sí ✓ |
| (generado) | `es_profesional` | BOOLEAN | Sí (true) |
| NOW() | `fecha_sincronizacion` | TIMESTAMP | Sí ✓ |

---

## 🔐 Generación de Campos

### username
```
Derivado de: id_profesional_unico (convertido a minúsculas)
Ejemplo: "MED-2025-001" → "med-2025-001"
```

### contrasena_hasheada
```
Contraseña inicial = id_profesional_unico + "123456"
Ejemplo: "MED-2025-001" → "MED-2025-001123456"
Hash: btoa("MED-2025-001123456") → (base64, NO SEGURO)
En producción: bcrypt o pgcrypto
```

### cambio_password_requerido
```
Siempre: true (para nuevos)
El profesional DEBE cambiar en primer login
```

### es_profesional
```
Siempre: true
Indica que es un profesional sincronizado (no admin)
```

---

## 📌 Ejemplo Real: Solicitud GET en JavaScript

```javascript
// Obtener profesionales del remoto
const centroId = "5727583a-a8a3-4793-b4d6-ade6fe5c1234"
const remoteUrl = "https://wdieynendfjbkbhfovrx.supabase.co"
const remoteKey = "sb_publishable_9KoyZtFgO79lLad"

const query = new URLSearchParams({
  'centro_salud_id': `eq.${centroId}`,
  'estado_solicitud': 'eq.Aprobado',
  'select': 'id,id_profesional_unico,nombre_completo,especialidad,area_profesional,email,telefono,fecha_nacimiento,genero,numero_funcionario,estado_solicitud,centro_salud_id'
})

const response = await fetch(
  `${remoteUrl}/rest/v1/profesionales_sanitarios?${query.toString()}`,
  {
    headers: {
      'Authorization': `Bearer ${remoteKey}`,
      'Content-Type': 'application/json'
    }
  }
)

const profesionales = await response.json()
console.log(profesionales) // Array de profesionales
```

---

## ✅ Validaciones en Sincronización

```
ANTES DE INSERTAR:
✓ id_profesional_unico no vacío
✓ nombre_completo no vacío
✓ centro_salud_id coincide con director
✓ No existe ya en BD local (check id_profesional_unico)

DURANTE INSERCIÓN:
✓ Generar username único
✓ Generar contraseña + hash
✓ Establecer cambio_password_requerido = true
✓ Marcar como es_profesional = true

DESPUÉS:
✓ Registrar en hosix_sincronizacion_profesionales
✓ Invalidar cache de React Query
✓ Mostrar resumen al director
```

---

## 🚨 Errores Comunes y Manejo

| Error | Causa | Manejo |
|---|---|---|
| "401 Unauthorized" | API key inválida | Verificar VITE_RENAPROSA_SUPABASE_ANON_KEY |
| "400 Bad Request" | Query string inválido | Revisar sintaxis de select= |
| "403 Forbidden" | RLS en remoto | Usar anon key (lectura pública) |
| "No profesionales" | Centro sin profesionales | Mostrar mensaje amigable |
| "Duplicate key" | id_profesional_unico ya existe | Actualizar en lugar de insertar |

---

## 📈 Payload de Respuesta Típica

```json
{
  "total_solicitados": 15,
  "total_obtenidos": 15,
  "nuevos_insertados": 12,
  "actualizados": 3,
  "errores": [
    {
      "id_profesional": "MED-2025-014",
      "error": "Email ya existe en el sistema"
    }
  ]
}
```

---

## 🔗 Relacionados

- **Hook**: `src/hooks/useProfesionalesSync.ts` → `obtenerProfesionalesRemoto()`
- **Componente**: `src/components/hosix/ProfesionalSyncManager.tsx`
- **Migración**: `supabase/migrations/20250129_001_extend_hosix_usuarios_profesionales.sql`

