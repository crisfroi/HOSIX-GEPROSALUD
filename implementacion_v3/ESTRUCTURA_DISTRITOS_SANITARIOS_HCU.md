# Estructura de Distritos Sanitarios y Generación de HCU

## 📍 Distritos Sanitarios en Guinea Ecuatorial

HOSIX ya tiene los distritos sanitarios mappados con la tabla `hosix_distritos_sanitarios`. Estos deben sincronizarse automáticamente al Nodo Central.

### Estructura en HOSIX
```sql
CREATE TABLE public.hosix_distritos_sanitarios (
  id UUID PRIMARY KEY,
  codigo VARCHAR(10) UNIQUE NOT NULL,         -- DS-RB, DS-BT, DS-MLB, etc.
  nombre_sanitario VARCHAR(255) NOT NULL,      -- "Distrito Sanitario de Riaba"
  nombre_distrito_admin VARCHAR(255),           -- "Riaba" (nombre administrativo)
  provincia_id UUID REFERENCES hosix_provincias(id),
  provincia_codigo VARCHAR(10),                 -- BS, LT, BN, etc.
  capital_distrito VARCHAR(255),
  población_estimada INTEGER,
  centros_salud_count INTEGER,
  zona_geografica VARCHAR(100),
  activo BOOLEAN DEFAULT true,
  orden_presentacion INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Mapeo de Provincias y Códigos

```
PROVINCIAS DE GUINEA ECUATORIAL:

Región Insular (Bioko):
├─ BN = Bioko Norte
│  ├─ Malabo (DS-MLB)
│  ├─ Baney (DS-BNY)
│  └─ Luba (DS-LB)
│
└─ BS = Bioko Sur
   ├─ Riaba (DS-RB)
   └─ San Antonio (SA)

Región Continental:
├─ LT = Litoral
│  ├─ Bata (DS-BT)
│  ├─ Mbini (DS-MBN)
│  ├─ Cogo (DS-KG)
│  └─ Mongomo (DS-MNG)
│
├─ CS = Centro Sur
│  ├─ Evinayong (DS-EV)
│  ├─ Niefang (DS-NF)
│  ├─ Micomiseng (DS-MC)
│  └─ Akurenam (DS-AKM)
│
├─ KN = Kié-Ntem
│  ├─ Ebebiyin (DS-EB)
│  ├─ Nsork Nsomo (DS-NS)
│  └─ Micomiseng (DS-MC)
│
├─ WN = Wele Nzas
│  ├─ Akonibe (DS-AKB)
│  ├─ Anisok (DS-AÑ)
│  ├─ Nsork (DS-NK)
│  ├─ Mongomo (DS-MNG)
│  └─ Oyala (DS-OY)
│
├─ AN = Annobón
│  └─ Annobón (DS-AN)
│
└─ DJL = Djibloho
   └─ Oyala (DS-OY)
```

---

## 🔑 Generación de HCU basada en Distrito Sanitario

### Formato de HCU Nuevo
```
HCU[CODIGO_DISTRITO][AÑO][SECUENCIAL_6DÍGITOS]

Ejemplos:
├─ HCUDS-RB2026000001  (Distrito Riaba, 2026, secuencial 1)
├─ HCUDS-MLB2026000001 (Distrito Malabo, 2026, secuencial 1)
├─ HCUDS-BT2026000001  (Distrito Bata, 2026, secuencial 1)
└─ HCUDS-EV2026000042  (Distrito Evinayong, 2026, secuencial 42)
```

### Tabla: secuenciales_hcu

```sql
CREATE TABLE nodo_central.secuenciales_hcu (
  id UUID PRIMARY KEY,
  distrito_sanitario_codigo VARCHAR(10) NOT NULL,  -- DS-RB
  distrito_sanitario_id UUID REFERENCES nodo_central.distritos_sanitarios_copia(id),
  anio INTEGER NOT NULL,                            -- 2026
  secuencial INTEGER DEFAULT 0,                     -- contador
  
  UNIQUE(distrito_sanitario_codigo, anio)
);
```

### Ejemplo de Secuencia Anual

```
Año 2026:
├─ Distrito Riaba (DS-RB):
│  ├─ HCUDS-RB2026000001 - María García
│  ├─ HCUDS-RB2026000002 - Juan López
│  └─ HCUDS-RB2026000003 - Ana Martínez
│
├─ Distrito Bata (DS-BT):
│  ├─ HCUDS-BT2026000001 - Carlos Rodríguez
│  ├─ HCUDS-BT2026000002 - Elena Fernández
│  └─ HCUDS-BT2026000003 - Pedro Sánchez
│
└─ Distrito Malabo (DS-MLB):
   ├─ HCUDS-MLB2026000001 - Rosa del Carmen
   ├─ HCUDS-MLB2026000002 - Luis González
   └─ ...

Año 2027 (nuevo año = reset secuencial):
├─ Distrito Riaba (DS-RB):
│  └─ HCUDS-RB2027000001 - nuevo paciente
└─ ...
```

---

## 🔄 Flujo de Sincronización de Distritos

### Paso 1: Se crea/actualiza un distrito en HOSIX

```
Admin HOSIX:
  ├─ Crea/actualiza distrito: "Distrito Sanitario de Riaba"
  └─ INSERT/UPDATE INTO hosix_distritos_sanitarios
      
Base de Datos HOSIX:
  ├─ ⚡ TRIGGER: trig_sync_distritos
  │  ├─ EJECUTA: nodo_central.tg_sync_distritos()
  │  ├─ LLAMA: nodo_central.fn_sincronizar_distrito()
  │  │  ├─ INSERT/UPDATE nodo_central.distritos_sanitarios_copia
  │  │  ├─ INSERT nodo_central.sincronizacion_log
  │  │  └─ RETORNA: true
  │  └─ Retorna NEW
  │
  └─ Resultado: ✅ Distrito disponible en Nodo Central al instante
```

### Paso 2: Se genera HCU para un paciente

```
HOSIX (Enfermero crea paciente):
  ├─ Cédula: 1234567890
  ├─ Nombre: María García
  ├─ Centro: Hospital Riaba (distrito_sanitario_codigo: DS-RB)
  └─ POST /generar-hcu-paciente-nuevo
      {
        cedula: '1234567890',
        nombre: 'María',
        apellido: 'García',
        fecha_nacimiento: '1990-01-15',
        provincia: 'Bioko Sur',
        distrito_sanitario_codigo: 'DS-RB'
      }
      
Edge Function:
  ├─ Llamada RPC: nodo_central.fn_generar_hcu()
  │  ├─ Parámetros: cedula, distrito_sanitario_codigo, centro_salud_id
  │  ├─ Mapea: DS-RB → código correcto
  │  ├─ Obtiene año: 2026
  │  ├─ INSERT INTO secuenciales_hcu (ON CONFLICT)
  │  │  └─ secuencial = secuencial + 1
  │  │     └─ RETORNA: 1 (primer paciente del año)
  │  ├─ Construye: 'HCU' || 'DS-RB' || '2026' || '000001'
  │  │             = 'HCUDS-RB2026000001'
  │  └─ RETORNA: 'HCUDS-RB2026000001'
  │
  ├─ INSERT INTO pais_pacientes_maestro
  │  ├─ hcu: 'HCUDS-RB2026000001'
  │  ├─ cedula: '1234567890'
  │  ├─ nombre, apellido, fecha_nacimiento
  │  ├─ distrito_sanitario_id: uuid del distrito Riaba
  │  └─ RETORNA: paciente creado
  │
  └─ RETORNA A HOSIX:
      {
        exito: true,
        hcu: 'HCUDS-RB2026000001',
        paciente_id: 'uuid...'
      }
```

---

## 📊 Tablas Relacionadas

### Relaciones en Nodo Central

```
distritos_sanitarios_copia
├─ id (PK)
├─ codigo (DS-RB, DS-BT, etc.)
├─ nombre_sanitario
└─ provincia_codigo

        ↓ FK (distrito_sanitario_id)

centros_salud_copia
├─ id (PK)
├─ nombre
├─ distrito_sanitario_id ──→ distritos_sanitarios_copia.id
└─ distrito_sanitario_codigo

        ↓ FK (centro_salud_id)

pais_pacientes_maestro
├─ id (PK)
├─ hcu (HCUDS-RB2026000001)
├─ cedula
├─ centro_salud_origen_id ──→ centros_salud_copia.id
└─ [contiene info clínica]

secuenciales_hcu
├─ id (PK)
├─ distrito_sanitario_codigo (DS-RB)
├─ distrito_sanitario_id ──→ distritos_sanitarios_copia.id
├─ anio (2026)
└─ secuencial (contador)
   UNIQUE(distrito_sanitario_codigo, anio)
```

---

## ⚙️ Parámetros de Entrada para fn_generar_hcu()

```typescript
interface GenerarHCURequest {
  cedula: string;                    // "1234567890"
  nombre: string;                    // "María"
  apellido: string;                  // "García"
  fecha_nacimiento: string;           // "1990-01-15"
  provincia: string;                 // "Bioko Sur" (opcional)
  distrito_sanitario_codigo: string;  // "DS-RB" (REQUERIDO)
  centro_salud_id?: string;           // uuid (opcional)
}
```

### Lógica de Selección de Distrito

```
IF distrito_sanitario_codigo IS PROVIDED:
  ├─ USAR DIRECTAMENTE
  
ELSE IF centro_salud_id IS PROVIDED:
  ├─ SELECT distrito_sanitario_codigo FROM centros_salud_copia
  │  WHERE id = centro_salud_id
  
ELSE:
  └─ DEFAULT: 'GE' (Generic Equatorial Guinea)
```

---

## ✅ Checklist de Implementación

- [ ] Tabla `distritos_sanitarios_copia` creada en Nodo Central
- [ ] Trigger `trig_sync_distritos` configurado en HOSIX
- [ ] Función `fn_sincronizar_distrito()` operativa
- [ ] Tabla `secuenciales_hcu` con UNIQUE(distrito_codigo, anio)
- [ ] Función `fn_generar_hcu()` actualizada para usar distrito
- [ ] Edge Function recibe parámetro `distrito_sanitario_codigo`
- [ ] Tests: crear paciente con cada distrito verifica HCU diferente
- [ ] Tests: siguiente paciente del mismo distrito incrementa secuencial

---

## 🔍 Verificación de Sincronización

```sql
-- Ver distritos sincronizados
SELECT codigo, nombre_sanitario, sincronizado_desde_hosix, version_hosix
FROM nodo_central.distritos_sanitarios_copia
ORDER BY orden_presentacion;

-- Ver secuenciales por distrito (año 2026)
SELECT distrito_sanitario_codigo, anio, secuencial
FROM nodo_central.secuenciales_hcu
WHERE anio = 2026
ORDER BY distrito_sanitario_codigo;

-- Ver HCUs generados
SELECT hcu, cedula, nombre, apellido, centro_salud_origen_id
FROM nodo_central.pais_pacientes_maestro
WHERE hcu LIKE 'HCUDS-%'
ORDER BY created_at DESC;

-- Ver logs de sincronización de distritos
SELECT tipo_evento, entidad_id, estado, timestamp
FROM nodo_central.sincronizacion_log
WHERE tipo_evento = 'distrito_sincronizado'
ORDER BY timestamp DESC;
```

---

## 💡 Conclusión

**Estructura optimizada:**
- ✅ Distritos sincronizados automáticamente desde HOSIX
- ✅ HCU generado basado en código de distrito (no provincia)
- ✅ Secuenciales por distrito-año (no provincia-año)
- ✅ Trazabilidad de cada paciente a su distrito de origen
- ✅ Escalable a nuevos distritos sin cambios de código
- ✅ Compatible con estructura real de HOSIX
