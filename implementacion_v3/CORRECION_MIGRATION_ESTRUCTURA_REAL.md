# Corrección de Migration - Estructura Real de RENAPROSA

## 🔧 Problema Identificado

El archivo `20260612_nodo_central_schema_optimizado.sql` asumía estructura de HOSIX, pero:
- **RENAPROSA NO tiene `hosix_distritos_sanitarios`**
- **RENAPROSA tiene `public.distrito_sanitario`** (tabla simplificada)
- **`centros_salud` usa `distrito_sanitario` como TEXT** (no ID)

## ✅ Correcciones Realizadas

### 1. Tabla `distritos_sanitarios_copia` - ANTES vs DESPUÉS

**ANTES (Incorrecto):**
```sql
CREATE TABLE nodo_central.distritos_sanitarios_copia (
  id UUID PRIMARY KEY,
  codigo VARCHAR(10),
  nombre_sanitario VARCHAR(255),
  nombre_distrito_admin VARCHAR(255),
  provincia_id UUID,
  provincia_codigo VARCHAR(10),
  activo BOOLEAN,
  ...
);
```

**DESPUÉS (Correcto - coincide con `public.distrito_sanitario`):**
```sql
CREATE TABLE nodo_central.distritos_sanitarios_copia (
  nombre_distrito TEXT PRIMARY KEY,
  abreviatura_provincia VARCHAR(10),
  nombre_provincia VARCHAR(255),
  abreviatura_distrito VARCHAR(10),
  sincronizado_desde_renaprosa TIMESTAMPTZ,
  version_renaprosa INTEGER DEFAULT 1,
  UNIQUE(nombre_distrito)
);
```

### 2. Tabla `centros_salud_copia` - Tipos de Datos

**ANTES:**
```sql
distrito_sanitario VARCHAR(100)
```

**DESPUÉS:**
```sql
-- Los tipos ahora coinciden con public.centros_salud de RENAPROSA
categoria TEXT NOT NULL,
distrito_sanitario TEXT REFERENCES nodo_central.distritos_sanitarios_copia,
sector TEXT NOT NULL,
especialidades TEXT[],
...
```

### 3. Tabla `secuenciales_hcu` - FK Corregido

**ANTES:**
```sql
UNIQUE(distrito_sanitario_codigo, anio)
```

**DESPUÉS:**
```sql
nombre_distrito TEXT NOT NULL REFERENCES nodo_central.distritos_sanitarios_copia(nombre_distrito),
anio INTEGER NOT NULL,
UNIQUE(nombre_distrito, anio)
```

### 4. Función `fn_sincronizar_distrito()` - Parámetros

**ANTES (Incorrecto):**
```sql
fn_sincronizar_distrito(
  p_distrito_id UUID,
  p_codigo VARCHAR(10),
  ...
)
```

**DESPUÉS (Correcto):**
```sql
fn_sincronizar_distrito(
  p_nombre_distrito TEXT,
  p_abreviatura_provincia VARCHAR(10),
  p_nombre_provincia VARCHAR(255),
  p_abreviatura_distrito VARCHAR(10)
)
```

### 5. Función `fn_sincronizar_centro()` - Parámetros Completos

**ANTES:**
```sql
fn_sincronizar_centro(
  p_centro_id UUID,
  p_nombre VARCHAR(255),
  p_categoria VARCHAR(100),
  p_provincia VARCHAR(100),
  p_distrito VARCHAR(100),
  p_distrito_sanitario VARCHAR(100),
  p_estado VARCHAR(50)
)
```

**DESPUÉS:**
```sql
fn_sincronizar_centro(
  p_id UUID,
  p_nombre TEXT,
  p_categoria TEXT,
  p_provincia TEXT,
  p_distrito TEXT,
  p_distrito_sanitario TEXT,
  p_sector TEXT,
  p_director TEXT,
  p_telefono TEXT,
  p_especialidades TEXT[],
  p_estado TEXT,
  p_numero_registro TEXT,
  p_fecha_registro TIMESTAMPTZ,
  p_subcategoria TEXT,
  p_nif TEXT,
  p_responsable TEXT,
  p_fotos_establecimiento TEXT[]
)
```

### 6. Función `fn_generar_hcu()` - Usa Nombre de Distrito

**ANTES:**
```sql
fn_generar_hcu(
  p_cedula VARCHAR(20),
  p_distrito_sanitario_codigo VARCHAR(10),  -- ❌ No existía
  p_centro_salud_id UUID
)
-- Generaba: HCUDS-RB2026000001
```

**DESPUÉS:**
```sql
fn_generar_hcu(
  p_cedula VARCHAR(20),
  p_nombre_distrito TEXT,  -- ✅ Existe en RENAPROSA
  p_centro_salud_id UUID
)
-- Obtiene abreviatura de distritos_sanitarios_copia
-- Genera: HCUDSR2026000001 (usando abreviatura del distrito)
```

### 7. Triggers - Apuntan a Tablas de RENAPROSA

**ANTES (Incorrecto):**
```sql
CREATE TRIGGER trig_sync_distritos
ON public.hosix_distritos_sanitarios  -- ❌ NO EXISTE EN RENAPROSA
```

**DESPUÉS (Correcto):**
```sql
CREATE TRIGGER trig_sync_distritos
ON public.distrito_sanitario  -- ✅ Existe en RENAPROSA

CREATE TRIGGER trig_sync_centros
ON public.centros_salud  -- ✅ Con todos los campos

CREATE TRIGGER trig_sync_profesionales
ON public.profesionales_sanitarios  -- ✅ Con todos los campos
```

---

## 📊 Mapeo de Campos

### `public.distrito_sanitario` → `nodo_central.distritos_sanitarios_copia`

```
RENAPROSA                  →  Nodo Central
─────────────────────────────────────────
nombre_distrito            →  nombre_distrito (PK)
abreviatura_provincia      →  abreviatura_provincia
nombre_provincia           →  nombre_provincia
abreviatura_distrito       →  abreviatura_distrito
(nuevo)                    →  sincronizado_desde_renaprosa
(nuevo)                    →  version_renaprosa
```

### `public.centros_salud` → `nodo_central.centros_salud_copia`

```
RENAPROSA                  →  Nodo Central
─────────────────────────────────────────
id                         →  id (PK)
nombre                     →  nombre (UNIQUE)
categoria                  →  categoria
provincia                  →  provincia
distrito                   →  distrito
distrito_sanitario         →  distrito_sanitario (FK)
sector                     →  sector
director                   →  director
telefono                   →  telefono
especialidades             →  especialidades (TEXT[])
estado                     →  estado
numero_registro            →  numero_registro
fecha_registro             →  fecha_registro
subcategoria               →  subcategoria
nif                        →  nif
responsable                →  responsable
fotos_establecimiento      →  fotos_establecimiento (TEXT[])
(nuevo)                    →  sincronizado_desde_renaprosa
(nuevo)                    →  version_renaprosa
```

---

## 🚀 Flujo de Ejecución Correcto

### Paso 1: Se actualiza un distrito en RENAPROSA

```
RENAPROSA:
  UPDATE public.distrito_sanitario
  SET nombre_provincia = 'Bioko Sur'
  WHERE nombre_distrito = 'Riaba'

Automáticamente:
  ⚡ TRIGGER: trig_sync_distritos
  → Ejecuta: tg_sync_distritos()
    → Llama: fn_sincronizar_distrito(
        'Riaba',
        'BS',
        'Bioko Sur',
        'RB'
      )
    → Inserta/actualiza en nodo_central.distritos_sanitarios_copia
    → Log en sincronizacion_log

RESULTADO: ✅ Distrito sincronizado al Nodo Central
```

### Paso 2: Se crea/actualiza un centro en RENAPROSA

```
RENAPROSA:
  INSERT INTO public.centros_salud (
    id, nombre, categoria, provincia, distrito,
    distrito_sanitario, sector, director, telefono,
    especialidades, estado, numero_registro, ...
  ) VALUES (...)

Automáticamente:
  ⚡ TRIGGER: trig_sync_centros
  → Ejecuta: tg_sync_centros()
    → Llama: fn_sincronizar_centro(
        id,
        'Hospital Central Riaba',
        'Tercer nivel',
        'Bioko Sur',
        'Riaba',
        'Riaba',        -- ← Este TEXT mapea a nombre_distrito
        'Público',
        'Dr. Juan',
        '+240222...',
        ARRAY['Cardiología'],
        'Activo',
        'REG-0001',
        ...
      )
    → Inserta/actualiza en nodo_central.centros_salud_copia
    → Log en sincronizacion_log

RESULTADO: ✅ Centro sincronizado al Nodo Central
```

---

## ✅ Validación

Antes de ejecutar la migration, verifica en RENAPROSA:

```sql
-- 1. Confirmar tabla public.distrito_sanitario
SELECT COUNT(*) FROM public.distrito_sanitario;

-- 2. Confirmar campos en centros_salud
SELECT 
  id, nombre, categoria, provincia, distrito, 
  distrito_sanitario, sector, especialidades, estado
FROM public.centros_salud
LIMIT 1;

-- 3. Confirmar que distrito_sanitario es TEXT, no UUID
SELECT data_type 
FROM information_schema.columns
WHERE table_name = 'centros_salud' 
AND column_name = 'distrito_sanitario';
-- Debe retornar: text
```

---

## 📋 Checklist Final

- [ ] Migration `20260612_nodo_central_schema_optimizado.sql` corregida
- [ ] Tabla `distritos_sanitarios_copia` creada (estructura RENAPROSA)
- [ ] Tabla `centros_salud_copia` creada (campos TEXT no VARCHAR)
- [ ] Tabla `secuenciales_hcu` con FK a nombre_distrito
- [ ] Función `fn_sincronizar_distrito()` con parámetros correctos
- [ ] Función `fn_sincronizar_centro()` con todos los campos
- [ ] Función `fn_generar_hcu()` usa nombre_distrito
- [ ] Trigger `trig_sync_distritos` apunta a `public.distrito_sanitario`
- [ ] Trigger `trig_sync_centros` apunta a `public.centros_salud`
- [ ] Trigger `trig_sync_profesionales` apunta a `public.profesionales_sanitarios`
- [ ] Migration ejecuta sin errores
- [ ] Logs muestran sincronización exitosa

---

## 🎯 Conclusión

La migration ahora es **compatible con la estructura real de RENAPROSA**:
- ✅ Usa `public.distrito_sanitario` (no hosix_distritos_sanitarios)
- ✅ Mapea todos los campos TEXT correctamente
- ✅ Triggers en las tablas correctas
- ✅ Funciones con parámetros reales
- ✅ HCU generado con abreviatura real del distrito

**Status**: Listo para ejecutar en RENAPROSA.
