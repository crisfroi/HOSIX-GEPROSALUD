# Idea Futura: Pre-generación de HCU desde Cédulas del Ministerio

## 💡 Concepto

En lugar de generar HCU **bajo demanda** (cuando un paciente llega al hospital), **pre-generar HCU para TODAS las cédulas válidas** del país desde el Ministerio de Seguridad/Población.

```
┌─────────────────────────────────────────────────────────────────┐
│         Ministerio de Seguridad de Guinea Ecuatorial             │
│              (Base de Cédulas Personales)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    [Exportar cédulas validas]
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  NODO CENTRAL                                    │
│  Pre-generación: CÉDULA → HCU (sin necesidad de nombres)        │
├─────────────────────────────────────────────────────────────────┤
│  INSERT INTO pais_pacientes_maestro:                            │
│  ├─ cedula: '1234567890' (del Ministerio)                       │
│  ├─ hcu: 'HCUDSR2026000001' (generado)                          │
│  ├─ nombre: NULL (a completar en primer registro)               │
│  ├─ apellido: NULL (a completar en primer registro)             │
│  └─ estado: 'pre_registrado' (especial)                         │
│                                                                  │
│  TOTAL: ~500,000+ registros (población adulta)                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Ventajas

### 1. **Elimina Duplicados por Completo**
```
ANTES (Actual - Opción 2):
  Hospital A: Crea María García, Cédula 1234567890 → HCU-LOCAL
  Hospital B: Crea María García, Cédula 1234567890 → HCU-LOCAL
  Conflicto: Mismo HCU-LOCAL, debe deduplicarse
  
DESPUÉS (Con Pre-generación):
  Ministerio: Cédula 1234567890 → HCUDSR2026000001 (único)
  Hospital A: Busca cédula 1234567890 → Encuentra HCUDSR2026000001
  Hospital B: Busca cédula 1234567890 → Encuentra HCUDSR2026000001
  Resultado: ✅ Un solo HCU, sin conflictos
```

### 2. **Búsqueda Instantánea por Cédula**
```
Sin pre-generación:
  Enfermero busca: "¿Existe cédula 1234567890?"
  App: Query a Nodo Central (requiere conexión)
  Respuesta: "No existe, generar nuevo HCU"
  
Con pre-generación:
  Enfermero busca: "¿Existe cédula 1234567890?"
  App: Query local (INSTANTÁNEO)
  Respuesta: "Sí, HCU: HCUDSR2026000001"
```

### 3. **Reduce Sincronización**
```
Sin pre-generación:
  ├─ Sync: enviar cada paciente nuevo
  ├─ Sync: deduplicar conflictos
  ├─ Sync: resolver inconsistencias
  └─ Overhead: Alto

Con pre-generación:
  ├─ Sync: solo actualizar datos demográficos
  ├─ Sync: agregar consultas/resultados
  └─ Overhead: Bajo (tabla pre-generada es read-only)
```

### 4. **Mejora UX**
```
Sin pre-generación:
  Enfermero: "¿Este paciente está en el sistema?"
  Sistema: "Checking... espera... no existe"
  Enfermero: "Debo crear nuevo registro"
  Tiempo: 2-3 minutos
  
Con pre-generación:
  Enfermero: "¿Este paciente está en el sistema?"
  Sistema: "Sí, HCU: HCUDSR2026000001 (instantáneo)"
  Enfermero: "Completo datos y continúo"
  Tiempo: 10 segundos
```

---

## ⚙️ Proceso de Pre-generación

### Paso 1: Obtener Cédulas del Ministerio

```sql
-- Ministerio exporta:
-- cedula_persona.csv

cedula,fecha_nacimiento,genero,provincia,fecha_emision,fecha_vencimiento
1234567890,1990-01-15,M,Bioko Sur,2020-01-10,2030-01-10
9876543210,1985-05-20,F,Litoral,2019-06-15,2029-06-15
...
```

**Datos requeridos (mínimo):**
- ✅ Cédula (PK)
- ✅ Fecha nacimiento
- ⚠️ Género (opcional, para estadísticas)
- ⚠️ Provincia (opcional, para agrupar)
- ❌ NO nombre (privacidad - se completa en primer contacto)

### Paso 2: Crear Tabla de Cédulas Validadas

```sql
CREATE TABLE nodo_central.cedulas_validadas_ministerio (
  cedula VARCHAR(20) PRIMARY KEY,
  fecha_nacimiento DATE,
  genero VARCHAR(1),
  provincia VARCHAR(100),
  hcu_asignado VARCHAR(50) NOT NULL UNIQUE,
  
  fecha_importacion TIMESTAMPTZ DEFAULT now(),
  fecha_validacion TIMESTAMPTZ,
  
  estado VARCHAR(50) DEFAULT 'pre_registrado',  -- pre_registrado, activo, inactivo
  
  INDEX idx_cedula (cedula),
  INDEX idx_hcu (hcu_asignado)
);

INSERT INTO cedulas_validadas_ministerio (cedula, fecha_nacimiento, genero, provincia, hcu_asignado)
SELECT 
  cedula,
  fecha_nacimiento,
  genero,
  provincia,
  nodo_central.fn_generar_hcu_para_cedula(cedula, provincia)  -- nueva función
FROM cedulas_import_ministerio
ON CONFLICT (cedula) DO NOTHING;

-- RESULTADO: 500,000+ cédulas con HCU pre-generado
```

### Paso 3: Crear Registros de Pacientes Pre-generados

```sql
-- Cuando primer contacto:
-- Se completa el registro desde pre-generado

-- Opción A: Tablas separadas
CREATE TABLE nodo_central.pais_pacientes_maestro_pregenerados (
  cedula VARCHAR(20) PRIMARY KEY REFERENCES cedulas_validadas_ministerio,
  hcu VARCHAR(50) UNIQUE NOT NULL,
  
  -- Datos demográficos (completan en primer contacto)
  nombre VARCHAR(255),
  apellido VARCHAR(255),
  
  -- Datos clínicos (se agregan con el tiempo)
  alergias JSONB,
  condiciones_cronicas JSONB,
  
  -- Metadata
  estado VARCHAR(50) DEFAULT 'sin_contacto',  -- sin_contacto, primer_contacto, activo
  fecha_primer_contacto TIMESTAMPTZ,
  hospital_primer_contacto UUID,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Opción B: Una sola tabla con estado
ALTER TABLE nodo_central.pais_pacientes_maestro
ADD COLUMN tipo_registro VARCHAR(50) DEFAULT 'creado_en_hospital'
  -- creado_en_hospital: normal (actual)
  -- pre_registrado: desde cédula ministerio
  -- pre_generado: futuro, desde ministerio
;
```

---

## 🚀 Flujo Mejorado con Pre-generación

### Escenario: Paciente Nuevo Llega al Hospital

```
Enfermero:
  ├─ Ingresa cédula: 1234567890
  └─ "Buscar paciente"

Aplicación:
  1. Busca en pais_pacientes_maestro (cédula pre-generada)
     ├─ SELECT cedula, hcu, nombre, apellido FROM ...
     │  WHERE cedula = '1234567890'
     │  AND tipo_registro = 'pre_registrado'
     ├─ ENCONTRADO
     └─ {cedula, hcu: 'HCUDSR2026000001', nombre: NULL, ...}
  
  2. Retorna a UI:
     ├─ HCU: HCUDSR2026000001 ✅
     ├─ Nombre: [vacío - pedir en UI]
     ├─ Apellido: [vacío - pedir en UI]
     └─ Mensaje: "Cédula pre-registrada. Completa datos:"
  
  3. Enfermero completa:
     ├─ Nombre: "María"
     ├─ Apellido: "García"
     └─ "Guardar"
  
  4. Actualizar registro:
     UPDATE pais_pacientes_maestro
     SET 
       nombre = 'María',
       apellido = 'García',
       tipo_registro = 'activo',
       fecha_primer_contacto = now(),
       hospital_primer_contacto = uuid
     WHERE cedula = '1234567890'
  
  5. Resultado:
     ✅ Paciente activo
     ✅ HCU: HCUDSR2026000001
     ✅ Sin conflictos
     ✅ Sin sincronización pendiente
```

---

## 📊 Comparativa

| Aspecto | Opción 2 Actual | Con Pre-generación |
|---------|-----------------|-------------------|
| **Duplicados** | ⚠️ Debe deduplicarse | ✅ 0 (imposible) |
| **Búsqueda cédula** | 🔴 Requiere sync | ✅ Instantáneo |
| **Menores sin cédula** | ✅ Soportados | ❌ NO soportados |
| **Almacenamiento inicial** | 🟢 Bajo | 🔴 Alto (500k+) |
| **Sincronización** | 🟡 Media (muchos cambios) | ✅ Baja (tabla read-only) |
| **Implementación** | 🟢 Ahora | ⏳ Futuro (depende Ministerio) |
| **Complejidad** | 🟢 Media | 🟡 Media-Alta |

---

## 🚨 Limitaciones

### 1. Menores de Edad
```
Problema: Menores NO tienen cédula personal
Solución: Crear tabla separada para menores

CREATE TABLE nodo_central.pacientes_menores_sin_cedula (
  id UUID PRIMARY KEY,
  nombres VARCHAR(255),
  fecha_nacimiento DATE,
  nombre_madre VARCHAR(255),
  numero_acta_nacimiento VARCHAR(50),
  
  hcu_generado VARCHAR(50),  -- Generado en primer contacto
  hospital_primer_contacto UUID,
  ...
)
```

### 2. Extranjeros / Residentes
```
Problema: No están en cédulas del país
Solución: Crear registro separado

CREATE TABLE nodo_central.pacientes_extranjeros (
  id UUID PRIMARY KEY,
  tipo_documento VARCHAR(50),  -- pasaporte, carné extranjería
  numero_documento VARCHAR(50),
  pais_origen VARCHAR(100),
  
  hcu_generado VARCHAR(50),
  ...
)
```

### 3. Privacidad
```
Riesgo: Ministerio comparte datos demográficos
Mitigación: 
  ├─ Encriptación en tránsito (TLS)
  ├─ Acceso restringido (roles, RLS)
  ├─ Auditoría de acceso
  └─ Cumplimiento GDPR/local
```

---

## 📋 Implementación (Futura)

### Fase 0: Coordinar con Ministerio
- [ ] Solicitar data de cédulas
- [ ] Firmar acuerdo de datos
- [ ] Obtener autorización

### Fase 1: Setup
- [ ] Tabla cedulas_validadas_ministerio
- [ ] Función fn_generar_hcu_para_cedula
- [ ] Import batch de cédulas

### Fase 2: Integración
- [ ] Actualizar fn_buscar_paciente (primero cédula pre-gen, luego nuevo)
- [ ] Actualizar UI: mostrar HCU pre-generado
- [ ] Crear flujo de "completar datos"

### Fase 3: Migración
- [ ] Migrar pacientes existentes a pre-generados
- [ ] Validar duplicados
- [ ] Testing end-to-end

---

## 💭 Consideración Final

**Esta idea es EXCELENTE pero requiere:**
1. ✅ Coordinación política (Ministerio)
2. ✅ Acuerdos de seguridad/privacidad
3. ✅ Preparación de datos
4. ⏳ 2-3 meses de implementación

**Recomendación:**
- **Ahora:** Implementar Opción 2 (Replicación Local + Queue)
- **Próximos meses:** Contactar Ministerio para pre-generación
- **3-6 meses:** Migrar a pre-generación cuando esté disponible

**Beneficio combinado:**
- Opción 2: Funciona hoy, offline-first
- Pre-generación: Cuando esté lista, elimina duplicados
- Juntas: Sistema robusto y escalable

---

## ✅ Conclusión

La idea de pre-generar HCU desde cédulas del Ministerio es **estratégicamente excelente** porque:
- ✅ Elimina conflictos de duplicados
- ✅ Mejora UX (búsqueda instantánea)
- ✅ Reduce complejidad de sincronización
- ✅ Escalable a todo el país

**Status:** 💾 Documentada para fase 2 (futuro).

**Ahora:** Implementar Opción 2 (Replicación Local) que funciona hoy.
