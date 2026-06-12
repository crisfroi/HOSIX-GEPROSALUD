# ARQUITECTURA: NODO CENTRAL + HISTORIA CLÍNICA ÚNICA

**Estado:** 🔴 PENDIENTE IMPLEMENTACIÓN (después de Lab-Imagen-Facturación)
**Fecha Creado:** 11 de Junio 2026
**Responsable:** Implementar en Fase 7+

---

## 📐 VISIÓN GENERAL

HOSIX opera como un **sistema distribuido**:

```
┌─────────────────────────────────────────────────────────┐
│         NODO CENTRAL (Ministerio/Sistema Nacional)      │
│  - Base de datos maestro de pacientes                   │
│  - Historia Clínica Única (HCU) centralizada            │
│  - Sincronización bidireccional                         │
│  - MPI (Master Patient Index) nacional                  │
└─────────────────────────────────────────────────────────┘
                          ↕
              (API REST + webhooks + cron)
                          ↕
   ┌──────────────┬──────────────┬──────────────┐
   │    NODO      │    NODO      │    NODO      │
   │  HOSPITAL 1  │  HOSPITAL 2  │  HOSPITAL N  │
   │   (HOSIX)    │   (HOSIX)    │   (HOSIX)    │
   └──────────────┴──────────────┴──────────────┘
```

**Flujo:**
1. Paciente llega a **admisión de Hospital 1**
2. Se valida si existe en **Nodo Central** por historia clínica única
3. Si existe → trae datos, asigna tarjeta sanitaria local
4. Si no existe → crea en Nodo Central, asigna HCU + tarjeta sanitaria
5. Los datos se sincronizan bidireccionalente con Nodo Central

---

## 🔑 CONCEPTOS CLAVE

### Historia Clínica Única (HCU)
- **Identificador único nacional** del paciente
- **Nunca cambia**, incluso si cambia de hospital o país
- Formato: `HCU-[DS]-[AAAA]-[SECUENCIAL]-[CHECK]`
  - Ejemplo: `HCU-CE-2026-000001-7A`
  - `CE` = Distrito Sanitario (abreviatura)
  - `2026` = Año de registro
  - `000001` = Secuencial del año en ese DS
  - `7A` = Check digit (validación)

### Tarjeta Sanitaria
- **Identificador local** por hospital/región
- Puede cambiar si paciente se registra en otro hospital
- Formato: `TS-[COD_HOSPITAL]-[AAAA]-[SECUENCIAL]`
  - Ejemplo: `TS-HOS001-2026-00450`

### Nodo Central (Futuro)
- Base de datos maestro de pacientes
- Almacena HCU, cédula, datos demográficos
- Sincroniza con todos los hospitales
- Resuelve duplicados (MPI)

---

## 📊 FLUJO EN ADMISIÓN (FUTURO)

### Paso 1: Búsqueda de Paciente
```
Enfermero en Admisión:
  1. Ingresa cédula del paciente
  2. Sistema busca en Nodo Central
  3. Resultados:
     a) ENCONTRADO → Mostrar datos + HCU + Tarjeta Sanitaria
     b) NO ENCONTRADO → Formulario para crear nuevo
```

### Paso 2: Si Paciente Existe (ya tiene HCU)
```
{
  "resultado": "encontrado",
  "hcu": "HCU-CE-2026-000001-7A",
  "cedula": "1234567890",
  "nombre": "Juan Pérez García",
  "fecha_nacimiento": "1980-05-15",
  "tarjetas_sanitarias": [
    {"codigo": "TS-HOS001-2023-00150", "hospital": "Hospital A", "activa": true},
    {"codigo": "TS-HOS002-2024-00075", "hospital": "Hospital B", "activa": false}
  ],
  "historicos": {
    "hospitalizaciones": 5,
    "cirugias": 2,
    "alergias": ["Penicilina"],
    "condiciones_cronicas": ["Hipertensión"]
  }
}
```

En este caso:
- ✅ Ya tiene HCU
- ✅ Ya tiene tarjeta sanitaria (puede tener varias)
- ✅ Mostrar histórico (hospitalizaciones previas, alergias, etc.)
- ✅ Crear entrada en `hosix_pacientes` local del hospital si no existe
- ✅ Asignar tarjeta sanitaria nueva si es primera vez en este hospital

### Paso 3: Si Paciente NO Existe (crear nuevo)
```
Flujo de creación:
  1. Ingresar datos: nombre, apellido, cédula, fecha nac, etc.
  2. Enviar a Nodo Central API
  3. Nodo Central:
     - Verifica que cédula sea única
     - Genera HCU con algoritmo
     - Crea paciente maestro
     - Retorna HCU + tarjeta sanitaria
  4. Hospital local:
     - Guarda en hosix_pacientes
     - Asigna tarjeta sanitaria local
     - Registra sincronización
```

---

## 🔧 GENERADOR DE HCU (ALGORITMO)

```typescript
function generarHCU(
  cedula: string,
  nombre: string,
  apellido: string,
  distrito_sanitario_id: string,
  fecha_nacimiento: string
): string {
  // 1. Obtener abreviatura del distrito sanitario
  const dsCodigo = distrito_sanitario_id.substring(0, 2); // "CE", "BN", etc.

  // 2. Año actual
  const anio = new Date().getFullYear();

  // 3. Obtener secuencial del año para este DS
  const secuencial = obtenerSecuencialDS(dsCodigo, anio);
  // Busca en hosix_pacientes:
  //   WHERE distrito_sanitario LIKE 'CE%' 
  //     AND YEAR(created_at) = 2026
  //   COUNT(*) + 1

  // 4. Crear número base
  const numeroBase = `HCU${dsCodigo}${anio}${String(secuencial).padStart(6, '0')}`;

  // 5. Calcular check digit (Luhn o similar)
  const checkDigit = calcularCheckDigit(numeroBase);

  // 6. Retornar HCU completo
  return `${numeroBase}-${checkDigit}`;
}

// Ejemplo:
// generarHCU('1234567890', 'Juan', 'Pérez', 'ce-provincia-1', '1980-05-15')
// Retorna: 'HCUCE2026000001-7A'
```

### Validación de HCU
```typescript
function validarHCU(hcu: string): boolean {
  const patron = /^HCUCE\d{4}\d{6}-[A-Z0-9]{2}$/; // Ejemplo para CE
  if (!patron.test(hcu)) return false;

  // Validar check digit
  const numeroBase = hcu.substring(0, hcu.length - 3);
  const checkEsperado = hcu.substring(hcu.length - 2);
  const checkCalculado = calcularCheckDigit(numeroBase);

  return checkEsperado === checkCalculado;
}
```

---

## 🗄️ TABLAS NUEVAS (NODO CENTRAL - FUTURO)

### Central: `pais_pacientes_maestro`
```sql
CREATE TABLE pais_pacientes_maestro (
  id UUID PRIMARY KEY,
  hcu VARCHAR(50) UNIQUE NOT NULL,
  cedula VARCHAR(20) UNIQUE,
  nombre_completo VARCHAR(255),
  fecha_nacimiento DATE,
  genero VARCHAR(10),
  
  -- Contacto
  telefono VARCHAR(20),
  email VARCHAR(255),
  direccion TEXT,
  distrito_sanitario VARCHAR(100),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  sincronizado_en TIMESTAMPTZ
);

CREATE INDEX idx_pais_pacientes_hcu ON pais_pacientes_maestro(hcu);
CREATE INDEX idx_pais_pacientes_cedula ON pais_pacientes_maestro(cedula);
```

### Central: `pais_historico_clinico`
```sql
CREATE TABLE pais_historico_clinico (
  id UUID PRIMARY KEY,
  hcu VARCHAR(50) REFERENCES pais_pacientes_maestro(hcu),
  tipo_evento VARCHAR(50), -- 'hospitalizacion', 'cirugia', 'alergia', 'condicion_cronica'
  descripcion TEXT,
  fecha_evento DATE,
  hospital_reportante VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Local (cada Hospital): `hosix_pacientes` (extensión)
```sql
ALTER TABLE hosix_pacientes ADD COLUMN IF NOT EXISTS (
  hcu VARCHAR(50) UNIQUE, -- Historia Clínica Única (from central node)
  tarjeta_sanitaria VARCHAR(50) UNIQUE, -- Tarjeta local del hospital
  sincronizado_con_central BOOLEAN DEFAULT false,
  fecha_primera_visita TIMESTAMPTZ,
  nodo_central_id UUID, -- ID en base de datos central (si existe)
  estado_sincronizacion VARCHAR(50) DEFAULT 'sincronizado' -- sincronizado, pendiente, error
);

CREATE INDEX idx_pacientes_hcu ON hosix_pacientes(hcu);
CREATE INDEX idx_pacientes_tarjeta_sanitaria ON hosix_pacientes(tarjeta_sanitaria);
```

---

## 🔄 SINCRONIZACIÓN (FUTURO)

### Flujos de Sincronización

#### 1. Hospital → Central (Eventos)
```
Trigger: Cuando se crea/actualiza evento clínico importante
  → Enviar webhook a Nodo Central con:
    - HCU del paciente
    - Tipo de evento (hospitalizacion, cirugia)
    - Detalles
    - Hospital origin ID
```

#### 2. Central → Hospital (Datos Maestros)
```
Cron: Cada hora (ajustable)
  → Obtener cambios en pais_pacientes_maestro
  → Para cada hospital:
    - Si paciente existe en hospital local → sincronizar datos
    - Si paciente nuevo → notificar (para confirmación manual)
```

#### 3. Hospital Nuevo → Central (Primer Registro)
```
Flujo en Admisión:
  1. Enfermero busca en Central por cédula
  2. Central responde con HCU (o crea nueva)
  3. Hospital crea tarjeta sanitaria local
  4. Establece relación en hosix_pacientes:
     - hcu = HCU del Central
     - tarjeta_sanitaria = local
     - sincronizado_con_central = true
```

---

## 🔐 SEGURIDAD

- HCU es immutable (nunca cambia)
- Cada sincronización requiere autenticación JWT
- Logs de auditoría para todas las sincronizaciones
- Encriptación en tránsito (HTTPS)
- RLS: cada hospital solo ve sus pacientes

---

## 📋 TABLA DE IMPLEMENTACIÓN (FASE 7+)

| Tarea | Prioridad | Esfuerzo | Notas |
|-------|-----------|----------|-------|
| Crear BD Nodo Central | 🔴 CRÍTICA | Alto | Primero: DB schema + indices |
| API Nodo Central | 🔴 CRÍTICA | Alto | Endpoints: buscar, crear, sincronizar |
| Generador de HCU | 🟡 ALTA | Medio | Algoritmo de numeración único |
| Sincronización Hospital → Central | 🟡 ALTA | Medio | Webhooks + error handling |
| Integración en AdmisionCentralForm | 🟡 ALTA | Medio | UI para buscar + crear paciente |
| Sincronización Central → Hospital | 🟠 MEDIA | Bajo | Cron job + reconciliación |
| Portal Nodo Central (futura) | 🟠 MEDIA | Alto | Supervisión nacional de datos |

---

## ✅ BENEFICIOS

✅ Paciente tiene identidad única nacional
✅ Histórico clínico portátil entre hospitales
✅ Sincronización automática de alergias, condiciones crónicas
✅ Prevención de duplicados (MPI centralizado)
✅ Seguimiento nacional de epidemiología
✅ Auditoría de flujos de datos

---

## 🚫 RESTRICCIONES (POR AHORA)

❌ NO IMPLEMENTAR TODAVÍA:
- BD Nodo Central no existe
- API del Nodo Central no existe
- HCU no se genera automáticamente
- Sin sincronización en tiempo real

**Mantener en código local:**
- hosix_pacientes con cédula como PK (por ahora)
- Sin integración con central node

---

## 📝 NOTA PARA DESPUÉS

Cuando se implemente:
1. Crear BD central (PostgreSQL o similar)
2. Crear API REST para Nodo Central
3. Actualizar AdmisionCentralForm para buscar en Central
4. Agregar campos HCU + tarjeta_sanitaria a hosix_pacientes
5. Implementar sincronización bidireccional
6. Testing completo de flujos

**No mezclar con implementación actual** de Lab-Imagen-Facturación.
