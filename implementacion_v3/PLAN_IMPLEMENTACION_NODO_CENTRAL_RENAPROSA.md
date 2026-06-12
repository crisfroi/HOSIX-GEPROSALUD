# Plan Implementación: Nodo Central + RENAPROSA + Sincronización Automática

## 🎯 Objetivo
Integrar Nodo Central (Historia Clínica Única) con RENAPROSA (Registro de Centros y Profesionales) usando **triggers y funciones PostgreSQL** para sincronización **instantánea**, con copias locales en el Nodo Central que se actualizan automáticamente sin discrepancias ni conflictos.

---

## 🏗️ Estrategia de Sincronización Optimizada

### Problema a Resolver
- ❌ Cron jobs cada 1h → datos pueden estar desactualizados entre ejecuciones
- ❌ Posibles discrepancias si hay cambios simultáneos
- ❌ Difícil mantener consitencia en sistemas distribuidos
- ❌ Escalabilidad: cada hospital nuevo = complejidad

### Solución: Triggers + Funciones + Copias Locales
- ✅ Sincronización **instantánea** en cada cambio
- ✅ **Copias locales** de centros/profesionales en Nodo Central
- ✅ **Triggers automáticos** en RENAPROSA → propagan a Nodo Central
- ✅ **Funciones idempotentes** que no crean duplicados
- ✅ **Auditoría** de cada cambio sincronizado
- ✅ **Sin conflictos** por timestamps y versioning

### Arquitectura de Sincronización

```
RENAPROSA (public.centros_salud, public.profesionales_sanitarios)
              ↓
        [TRIGGER + FUNCIÓN]
              ↓
nodo_central.centros_salud_copia (copias locales)
nodo_central.profesionales_copia (copias locales)
nodo_central.sincronizacion_log (auditoría)
              ↓
HOSIX (consulta copia local, jamás RENAPROSA directamente)
```

---

## 📋 Fases de Implementación

### FASE 1: Preparación de Schemas (Días 1-2)

#### 1.1 Crear Schema `nodo_central` en RENAPROSA
**Archivo:** `supabase/migrations/20260613_nodo_central_renaprosa.sql`

```sql
-- Crear schema nodo_central dentro de RENAPROSA
CREATE SCHEMA IF NOT EXISTS nodo_central;

-- ============================================================
-- TABLAS PRINCIPALES
-- ============================================================

-- 1. Tabla: Historia Clínica Única Nacional
CREATE TABLE nodo_central.pais_pacientes_maestro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hcu VARCHAR(50) UNIQUE NOT NULL,
  cedula VARCHAR(20) UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255) NOT NULL,
  fecha_nacimiento DATE,
  genero VARCHAR(10),

  -- Centro de origen
  centro_salud_origen_id UUID REFERENCES public.centros_salud(id),
  profesional_registrador_id UUID REFERENCES public.profesionales_sanitarios(id),

  -- Datos clínicos
  alergias JSONB,
  condiciones_cronicas JSONB,
  tipo_sangre VARCHAR(5),

  -- Metadata
  estado VARCHAR(50) DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE INDEX idx_pais_pacientes_hcu ON nodo_central.pais_pacientes_maestro(hcu);
CREATE INDEX idx_pais_pacientes_cedula ON nodo_central.pais_pacientes_maestro(cedula);

-- ============================================================
-- COPIAS LOCALES (Sincronizadas desde RENAPROSA)
-- ============================================================

-- 2. Tabla: Copias de Centros de Salud (desde public.centros_salud)
CREATE TABLE nodo_central.centros_salud_copia (
  id UUID PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  categoria VARCHAR(100),
  subcategoria VARCHAR(100),
  provincia VARCHAR(100),
  distrito VARCHAR(100),
  distrito_sanitario VARCHAR(100),
  sector VARCHAR(50),
  director VARCHAR(255),
  telefono VARCHAR(20),
  email VARCHAR(255),
  nif VARCHAR(20),
  responsable VARCHAR(255),
  especialidades JSONB,
  estado VARCHAR(50),
  numero_registro VARCHAR(100),
  fecha_registro TIMESTAMPTZ,

  -- Sincronización
  sincronizado_desde_renaprosa TIMESTAMPTZ,
  version_renaprosa INTEGER DEFAULT 1,

  UNIQUE(id)
);

CREATE INDEX idx_centros_copia_nombre ON nodo_central.centros_salud_copia(nombre);
CREATE INDEX idx_centros_copia_distrito ON nodo_central.centros_salud_copia(distrito_sanitario);

-- 3. Tabla: Copias de Profesionales (desde public.profesionales_sanitarios)
CREATE TABLE nodo_central.profesionales_copia (
  id UUID PRIMARY KEY,
  nombre_completo VARCHAR(255) NOT NULL,
  numero_dip VARCHAR(50),
  area_profesional VARCHAR(255),
  especialidad VARCHAR(255),
  provincia VARCHAR(100),
  distrito VARCHAR(100),
  distrito_sanitario VARCHAR(100),
  categoria_centro VARCHAR(100),
  tipo_sector VARCHAR(50),

  -- Relación a centro
  centro_salud_id UUID REFERENCES nodo_central.centros_salud_copia(id),
  nombre_centro VARCHAR(255),

  -- Estado
  estado_solicitud VARCHAR(50),
  fecha_aprobacion TIMESTAMPTZ,
  funcion_publica BOOLEAN,
  estatus_funcionario VARCHAR(50),

  -- Sincronización
  sincronizado_desde_renaprosa TIMESTAMPTZ,
  version_renaprosa INTEGER DEFAULT 1,

  UNIQUE(id)
);

CREATE INDEX idx_profesionales_copia_nombre ON nodo_central.profesionales_copia(nombre_completo);
CREATE INDEX idx_profesionales_copia_centro ON nodo_central.profesionales_copia(centro_salud_id);
CREATE INDEX idx_profesionales_copia_distrito ON nodo_central.profesionales_copia(distrito_sanitario);

-- 4. Tabla: Tarjetas Sanitarias por Hospital
CREATE TABLE nodo_central.tarjetas_sanitarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hcu VARCHAR(50) NOT NULL REFERENCES nodo_central.pais_pacientes_maestro(hcu),
  hospital_codigo VARCHAR(10) NOT NULL,
  numero_tarjeta VARCHAR(50) UNIQUE NOT NULL,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tarjetas_hcu ON nodo_central.tarjetas_sanitarias(hcu);
CREATE INDEX idx_tarjetas_hospital ON nodo_central.tarjetas_sanitarias(hospital_codigo);

-- 5. Tabla: Mapeado Hospital-Profesional
CREATE TABLE nodo_central.hospital_profesional_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_codigo VARCHAR(10) NOT NULL,
  hospital_nombre VARCHAR(255),

  -- Referencias a copias locales
  profesional_id UUID REFERENCES nodo_central.profesionales_copia(id),
  centro_salud_id UUID REFERENCES nodo_central.centros_salud_copia(id),

  -- Sincronización
  sincronizado BOOLEAN DEFAULT false,
  fecha_sincronizacion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(hospital_codigo, profesional_id)
);

CREATE INDEX idx_mapping_hospital ON nodo_central.hospital_profesional_mapping(hospital_codigo);
CREATE INDEX idx_mapping_profesional ON nodo_central.hospital_profesional_mapping(profesional_id);

-- ============================================================
-- LOG DE SINCRONIZACIÓN Y AUDITORÍA
-- ============================================================

-- 6. Tabla: Log Global de Sincronización
CREATE TABLE nodo_central.sincronizacion_log (
  id BIGSERIAL PRIMARY KEY,
  tipo_evento VARCHAR(50) NOT NULL,  -- centro_sincronizado, profesional_sincronizado, hcu_generado, error_sync
  entidad_tipo VARCHAR(50),          -- centro, profesional, paciente
  entidad_id UUID,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  estado VARCHAR(50) DEFAULT 'exitoso',  -- exitoso, error, ignorado
  mensaje_error TEXT,
  usuario_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sync_log_tipo ON nodo_central.sincronizacion_log(tipo_evento);
CREATE INDEX idx_sync_log_timestamp ON nodo_central.sincronizacion_log(timestamp);
CREATE INDEX idx_sync_log_entidad ON nodo_central.sincronizacion_log(entidad_id);

-- ============================================================
-- FUNCIONES SQL PARA SINCRONIZACIÓN Y HCU
-- ============================================================

-- Función 1: Sincronizar Centro de Salud (INSERT o UPDATE)
CREATE OR REPLACE FUNCTION nodo_central.fn_sincronizar_centro(
  p_centro_id UUID,
  p_nombre VARCHAR(255),
  p_categoria VARCHAR(100),
  p_provincia VARCHAR(100),
  p_distrito VARCHAR(100),
  p_distrito_sanitario VARCHAR(100),
  p_estado VARCHAR(50)
)
RETURNS TABLE (
  exito BOOLEAN,
  mensaje TEXT
) AS $$
DECLARE
  v_existe BOOLEAN;
BEGIN
  -- Verificar si existe
  SELECT EXISTS(SELECT 1 FROM nodo_central.centros_salud_copia WHERE id = p_centro_id)
  INTO v_existe;

  IF v_existe THEN
    -- ACTUALIZAR
    UPDATE nodo_central.centros_salud_copia
    SET
      nombre = p_nombre,
      categoria = p_categoria,
      provincia = p_provincia,
      distrito = p_distrito,
      distrito_sanitario = p_distrito_sanitario,
      estado = p_estado,
      sincronizado_desde_renaprosa = now(),
      version_renaprosa = version_renaprosa + 1
    WHERE id = p_centro_id;

    -- Log: actualización
    INSERT INTO nodo_central.sincronizacion_log (tipo_evento, entidad_tipo, entidad_id, estado)
    VALUES ('centro_sincronizado', 'centro', p_centro_id, 'exitoso');

    RETURN QUERY SELECT true, 'Centro actualizado exitosamente'::TEXT;
  ELSE
    -- INSERTAR
    INSERT INTO nodo_central.centros_salud_copia (
      id, nombre, categoria, provincia, distrito, distrito_sanitario, estado,
      sincronizado_desde_renaprosa, version_renaprosa
    ) VALUES (
      p_centro_id, p_nombre, p_categoria, p_provincia, p_distrito, p_distrito_sanitario, p_estado,
      now(), 1
    );

    -- Log: inserción
    INSERT INTO nodo_central.sincronizacion_log (tipo_evento, entidad_tipo, entidad_id, estado)
    VALUES ('centro_sincronizado', 'centro', p_centro_id, 'exitoso');

    RETURN QUERY SELECT true, 'Centro creado exitosamente'::TEXT;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Log: error
  INSERT INTO nodo_central.sincronizacion_log (tipo_evento, entidad_tipo, entidad_id, estado, mensaje_error)
  VALUES ('centro_sincronizado', 'centro', p_centro_id, 'error', SQLERRM);

  RETURN QUERY SELECT false, 'Error sincronizando centro: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Función 2: Sincronizar Profesional (INSERT o UPDATE)
CREATE OR REPLACE FUNCTION nodo_central.fn_sincronizar_profesional(
  p_profesional_id UUID,
  p_nombre_completo VARCHAR(255),
  p_numero_dip VARCHAR(50),
  p_area_profesional VARCHAR(255),
  p_centro_salud_id UUID,
  p_nombre_centro VARCHAR(255),
  p_distrito_sanitario VARCHAR(100),
  p_estado_solicitud VARCHAR(50)
)
RETURNS TABLE (
  exito BOOLEAN,
  mensaje TEXT
) AS $$
DECLARE
  v_existe BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM nodo_central.profesionales_copia WHERE id = p_profesional_id)
  INTO v_existe;

  IF v_existe THEN
    -- ACTUALIZAR
    UPDATE nodo_central.profesionales_copia
    SET
      nombre_completo = p_nombre_completo,
      numero_dip = p_numero_dip,
      area_profesional = p_area_profesional,
      centro_salud_id = p_centro_salud_id,
      nombre_centro = p_nombre_centro,
      distrito_sanitario = p_distrito_sanitario,
      estado_solicitud = p_estado_solicitud,
      sincronizado_desde_renaprosa = now(),
      version_renaprosa = version_renaprosa + 1
    WHERE id = p_profesional_id;

    INSERT INTO nodo_central.sincronizacion_log (tipo_evento, entidad_tipo, entidad_id, estado)
    VALUES ('profesional_sincronizado', 'profesional', p_profesional_id, 'exitoso');

    RETURN QUERY SELECT true, 'Profesional actualizado'::TEXT;
  ELSE
    -- INSERTAR
    INSERT INTO nodo_central.profesionales_copia (
      id, nombre_completo, numero_dip, area_profesional, centro_salud_id,
      nombre_centro, distrito_sanitario, estado_solicitud, sincronizado_desde_renaprosa, version_renaprosa
    ) VALUES (
      p_profesional_id, p_nombre_completo, p_numero_dip, p_area_profesional, p_centro_salud_id,
      p_nombre_centro, p_distrito_sanitario, p_estado_solicitud, now(), 1
    );

    INSERT INTO nodo_central.sincronizacion_log (tipo_evento, entidad_tipo, entidad_id, estado)
    VALUES ('profesional_sincronizado', 'profesional', p_profesional_id, 'exitoso');

    RETURN QUERY SELECT true, 'Profesional creado'::TEXT;
  END IF;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO nodo_central.sincronizacion_log (tipo_evento, entidad_tipo, entidad_id, estado, mensaje_error)
  VALUES ('profesional_sincronizado', 'profesional', p_profesional_id, 'error', SQLERRM);

  RETURN QUERY SELECT false, 'Error sincronizando profesional: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Función 3: Generar HCU
CREATE OR REPLACE FUNCTION nodo_central.fn_generar_hcu(
  p_cedula VARCHAR(20),
  p_provincia VARCHAR(100),
  p_centro_salud_id UUID
)
RETURNS VARCHAR(50) AS $$
DECLARE
  v_hcu VARCHAR(50);
  v_distrito_codigo VARCHAR(2);
  v_anio INTEGER;
  v_secuencial INTEGER;
BEGIN
  -- Obtener código de provincia de 2 letras
  v_distrito_codigo := CASE
    WHEN p_provincia ILIKE '%Bioko%' THEN 'CE'
    WHEN p_provincia ILIKE '%Bata%' THEN 'BN'
    ELSE 'GE'
  END;

  v_anio := EXTRACT(YEAR FROM now())::INTEGER;

  -- Obtener secuencial único para ese año
  v_secuencial := (
    SELECT COALESCE(MAX(CAST(SUBSTRING(hcu FROM 14 FOR 6) AS INTEGER)), 0) + 1
    FROM nodo_central.pais_pacientes_maestro
    WHERE hcu LIKE 'HCU' || v_distrito_codigo || v_anio || '%'
  );

  -- Generar HCU
  v_hcu := 'HCU' || v_distrito_codigo || v_anio || LPAD(v_secuencial::text, 6, '0');

  RETURN v_hcu;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS PARA SINCRONIZACIÓN AUTOMÁTICA
-- ============================================================

-- Trigger 1: Cuando se INSERTA/ACTUALIZA un centro en RENAPROSA
CREATE OR REPLACE FUNCTION nodo_central.tg_sincronizar_centro_insert_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Llamar función de sincronización
  PERFORM nodo_central.fn_sincronizar_centro(
    NEW.id,
    NEW.nombre,
    NEW.categoria,
    NEW.provincia,
    NEW.distrito,
    NEW.distrito_sanitario,
    NEW.estado
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger en tabla de RENAPROSA
DROP TRIGGER IF EXISTS tg_centros_salud_sync ON public.centros_salud;
CREATE TRIGGER tg_centros_salud_sync
AFTER INSERT OR UPDATE ON public.centros_salud
FOR EACH ROW
EXECUTE FUNCTION nodo_central.tg_sincronizar_centro_insert_update();

-- Trigger 2: Cuando se INSERTA/ACTUALIZA un profesional en RENAPROSA
CREATE OR REPLACE FUNCTION nodo_central.tg_sincronizar_profesional_insert_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo sincronizar si está aprobado
  IF NEW.estado_solicitud = 'Aprobado' THEN
    PERFORM nodo_central.fn_sincronizar_profesional(
      NEW.id,
      NEW.nombre_completo,
      NEW.numero_dip,
      NEW.area_profesional,
      NEW.centro_salud_id,
      NEW.nombre_centro,
      NEW.distrito_sanitario,
      NEW.estado_solicitud
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_profesionales_sync ON public.profesionales_sanitarios;
CREATE TRIGGER tg_profesionales_sync
AFTER INSERT OR UPDATE ON public.profesionales_sanitarios
FOR EACH ROW
EXECUTE FUNCTION nodo_central.tg_sincronizar_profesional_insert_update();

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE nodo_central.pais_pacientes_maestro ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodo_central.tarjetas_sanitarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodo_central.centros_salud_copia ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodo_central.profesionales_copia ENABLE ROW LEVEL SECURITY;

-- Policy: Pacientes visibles a admin y su hospital
CREATE POLICY "pais_pacientes_visible"
ON nodo_central.pais_pacientes_maestro FOR SELECT
USING (auth.jwt() ->> 'role' IN ('admin', 'hospital_admin'));

-- Policy: Centros visibles a todos (datos públicos)
CREATE POLICY "centros_copia_visible"
ON nodo_central.centros_salud_copia FOR SELECT
USING (true);

-- Policy: Profesionales visibles a todos (datos públicos)
CREATE POLICY "profesionales_copia_visible"
ON nodo_central.profesionales_copia FOR SELECT
USING (true);
```

#### 1.2 RLS Grants
**Archivo:** (continuación del mismo archivo de migración)

```sql
-- ============================================================
-- GRANTS Y PERMISOS
-- ============================================================

GRANT USAGE ON SCHEMA nodo_central TO anon, authenticated;
GRANT SELECT ON nodo_central.centros_salud_copia TO anon, authenticated;
GRANT SELECT ON nodo_central.profesionales_copia TO anon, authenticated;
GRANT SELECT ON nodo_central.pais_pacientes_maestro TO authenticated;
GRANT EXECUTE ON FUNCTION nodo_central.fn_generar_hcu TO authenticated;
GRANT EXECUTE ON FUNCTION nodo_central.fn_sincronizar_centro TO service_role;
GRANT EXECUTE ON FUNCTION nodo_central.fn_sincronizar_profesional TO service_role;

-- Grant de selección de logs a admin
GRANT SELECT ON nodo_central.sincronizacion_log TO authenticated;
```

---

### FASE 2: Edge Functions para Operaciones Específicas (Día 3)

**Nota:** Los triggers ya sincronizan automáticamente. Las Edge Functions ahora solo se usan para:
- Generar HCU cuando lo solicita HOSIX
- Consultar estado de sincronización
- Reportes y auditoría

#### 2.1 Edge Function: `generar-hcu-paciente-nuevo`
**Archivo:** `supabase/functions/generar-hcu-paciente-nuevo/index.ts`

Cuando HOSIX crea un paciente sin HCU (tiempo real).

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface PacienteNuevoRequest {
  cedula: string
  nombre: string
  apellido: string
  fecha_nacimiento: string
  provincia: string
  centro_salud_id?: string
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const body: PacienteNuevoRequest = await req.json()

    console.log('🆕 Generando HCU para paciente:', body.cedula)

    // Verificar que no exista HCU ya
    const { data: existente } = await supabase
      .from('nodo_central.pais_pacientes_maestro')
      .select('hcu')
      .eq('cedula', body.cedula)
      .limit(1)

    if (existente?.length) {
      return new Response(JSON.stringify({
        exito: true,
        hcu: existente[0].hcu,
        mensaje: 'Paciente ya tiene HCU'
      }), { status: 200 })
    }

    // Generar HCU usando función SQL
    const { data: hcu_result, error: hcu_error } = await supabase.rpc(
      'nodo_central.fn_generar_hcu',
      {
        p_cedula: body.cedula,
        p_provincia: body.provincia,
        p_centro_salud_id: body.centro_salud_id || null
      }
    )

    if (hcu_error) throw hcu_error

    // Crear paciente en Nodo Central
    const { data: paciente, error: insert_error } = await supabase
      .from('nodo_central.pais_pacientes_maestro')
      .insert({
        hcu: hcu_result,
        cedula: body.cedula,
        nombre: body.nombre,
        apellido: body.apellido,
        fecha_nacimiento: body.fecha_nacimiento,
        centro_salud_origen_id: body.centro_salud_id || null,
        estado: 'activo'
      })
      .select()
      .single()

    if (insert_error) throw insert_error

    // Log: exitoso
    await supabase.from('nodo_central.sincronizacion_log').insert({
      tipo_evento: 'hcu_generado',
      entidad_tipo: 'paciente',
      entidad_id: paciente.id,
      datos_nuevos: { cedula: body.cedula, hcu: hcu_result },
      estado: 'exitoso'
    })

    console.log('✅ HCU generado:', hcu_result)

    return new Response(JSON.stringify({
      exito: true,
      hcu: hcu_result,
      paciente_id: paciente.id,
      mensaje: 'HCU generado exitosamente'
    }), { status: 201 })
  } catch (error) {
    console.error('❌ Error generando HCU:', error)

    return new Response(JSON.stringify({
      exito: false,
      error: String(error)
    }), { status: 500 })
  }
})
```

#### 2.2 Edge Function: `consultar-estado-sincronizacion`
**Archivo:** `supabase/functions/consultar-estado-sincronizacion/index.ts`

Reportes y auditoría de sincronización.

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const url = new URL(req.url)
    const tipo = url.searchParams.get('tipo') || 'resumen'

    if (tipo === 'resumen') {
      // Resumen general
      const { data: centros_count } = await supabase
        .from('nodo_central.centros_salud_copia')
        .select('count(*)', { count: 'exact' })

      const { data: profesionales_count } = await supabase
        .from('nodo_central.profesionales_copia')
        .select('count(*)', { count: 'exact' })

      const { data: pacientes_count } = await supabase
        .from('nodo_central.pais_pacientes_maestro')
        .select('count(*)', { count: 'exact' })

      const { data: logs_recientes } = await supabase
        .from('nodo_central.sincronizacion_log')
        .select('tipo_evento, estado, timestamp')
        .order('timestamp', { ascending: false })
        .limit(10)

      return new Response(JSON.stringify({
        estado: 'operativo',
        centros_sincronizados: centros_count?.[0]?.count || 0,
        profesionales_sincronizados: profesionales_count?.[0]?.count || 0,
        pacientes_con_hcu: pacientes_count?.[0]?.count || 0,
        ultimos_logs: logs_recientes
      }), { status: 200 })
    } else if (tipo === 'logs') {
      // Logs de sincronización
      const limit = url.searchParams.get('limit') || '50'

      const { data: logs } = await supabase
        .from('nodo_central.sincronizacion_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(parseInt(limit))

      return new Response(JSON.stringify({ logs }), { status: 200 })
    } else {
      return new Response(JSON.stringify({ error: 'Tipo de consulta inválido' }), { status: 400 })
    }
  } catch (error) {
    console.error('❌ Error en consulta:', error)
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 })
  }
})
```

---

### FASE 3: Integración en HOSIX (Días 4-5)

#### 3.1 Modificar `AdmisionCentral.tsx`

Ahora cuando se busca un paciente:
1. Buscar en Nodo Central (copia local sincronizada)
2. Si existe: traer HCU + alergias + condiciones
3. Si no existe: crear con HCU automático vía Edge Function

```typescript
const buscarPacienteEnNodoCentral = async (cedula: string) => {
  // Buscar en Nodo Central
  const { data: paciente } = await supabase
    .from('nodo_central.pais_pacientes_maestro')
    .select('hcu, nombre, apellido, alergias, condiciones_cronicas')
    .eq('cedula', cedula)
    .single()

  return paciente
}

const crearPacienteConHCU = async (datos: PacienteData) => {
  // Llamar a Edge Function para generar HCU
  const { data, error } = await supabase.functions.invoke('generar-hcu-paciente-nuevo', {
    body: {
      cedula: datos.cedula,
      nombre: datos.nombre,
      apellido: datos.apellido,
      fecha_nacimiento: datos.fecha_nacimiento,
      provincia: datos.provincia,
      centro_salud_id: sedeActual.id
    }
  })

  if (error) throw error
  return data
}

const obtenerCentrosSincronizados = async () => {
  // Obtener copias locales de centros
  const { data: centros } = await supabase
    .from('nodo_central.centros_salud_copia')
    .select('id, nombre, categoria, distrito_sanitario')
    .eq('estado', 'validado')

  return centros
}

const obtenerProfesionalesPorCentro = async (centroId: UUID) => {
  // Obtener profesionales asignados a un centro
  const { data: profesionales } = await supabase
    .from('nodo_central.profesionales_copia')
    .select('id, nombre_completo, area_profesional, especialidad')
    .eq('centro_salud_id', centroId)
    .eq('estado_solicitud', 'Aprobado')

  return profesionales
}
```

---

## 🗓️ Cronograma Optimizado

```
DÍA 1: Crear migrations (schemas + triggers + funciones)
DÍA 2: Ejecutar migrations en RENAPROSA
DÍA 3: Crear Edge Functions (generar-hcu, estado-sincronizacion)
DÍA 4: Integrar búsqueda en AdmisionCentral.tsx
DÍA 5: Testing y validación completa
```

---

## ✅ Checklist de Validación

- [ ] Tabla `distritos_sanitarios_copia` creada (from hosix_distritos_sanitarios)
- [ ] Tabla `centros_salud_copia` creada con FK a distrito
- [ ] Tabla `secuenciales_hcu` con UNIQUE(distrito_codigo, anio)
- [ ] Migraciones ejecutadas en Nodo Central sin errores
- [ ] Trigger `trig_sync_distritos` activo en hosix_distritos_sanitarios
- [ ] Triggers en centros_salud y profesionales_sanitarios activos
- [ ] Funciones SQL de sincronización operativas:
  - [ ] fn_sincronizar_distrito()
  - [ ] fn_sincronizar_centro()
  - [ ] fn_sincronizar_profesional()
  - [ ] fn_generar_hcu() [usa distrito_sanitario_codigo]
- [ ] Edge Functions deployadas:
  - [ ] generar-hcu-paciente-nuevo [parámetro: distrito_sanitario_codigo]
  - [ ] consultar-estado-sincronizacion
- [ ] Copias locales se sincronizan automáticamente (distritos, centros, profesionales)
- [ ] Búsqueda en AdmisionCentral funciona
- [ ] HCU generado con formato: HCUDS-RB2026000001 (código de distrito)
- [ ] Logs en sincronizacion_log registran cada operación
- [ ] Sin discrepancias entre HOSIX y Nodo Central
- [ ] Profesionales y centros visibles con asignación a distrito correcto

---

## 🎯 Ventajas de Esta Arquitectura

✅ **Sincronización instantánea**: Triggers en RENAPROSA → copias locales inmediatas
✅ **Sin cron jobs complejos**: Lógica en triggers = más simple
✅ **Cero discrepancias**: Funciones idempotentes garantizan consistencia
✅ **Escalable**: Nuevos hospitales no añaden complejidad
✅ **Auditoría completa**: Cada cambio registrado en sincronizacion_log
✅ **Desacoplado**: HOSIX no consulta RENAPROSA directo, usa copias
✅ **Preparado para migración**: Copias locales son tablas ordinarias, fácil migrar a Supabase local

---

## 🚀 Resultado Final

✅ Nodo Central operativo en RENAPROSA con sincronización automática
✅ Copias locales de centros y profesionales siempre actualizadas
✅ HOSIX consume HCU centralizado sin consultar RENAPROSA
✅ Historia Clínica Única nacional activa
✅ Auditoría completa de todas las operaciones
✅ Arquitectura escalable y mantenible a largo plazo
✅ Preparado para migración futura a Supabase local en el Ministerio
