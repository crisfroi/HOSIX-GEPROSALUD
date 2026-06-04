# FASE 4: CATÁLOGOS FARMACÉUTICOS
**Plan de Implementación Detallado**

**Fecha Inicio:** 6 de Junio 2026  
**Duración Estimada:** 7-8 días  
**Timeline:** 6-13 JUN 2026

---

## 🎯 OBJETIVOS FASE 4

### 4.1 Principios Activos (OMS)
- Cargar catálogo OMS de ~600 principios activos
- Integrar en selector de prescripción
- Búsqueda rápida FTS (Full Text Search)
- Vinculación con medicamentos existentes

### 4.2 OMS LME (Listado de Medicamentos Esenciales)
- Cargar LME vigente para Guinea Ecuatorial
- Marcar medicamentos "de referencia"
- Reportes de uso vs recomendado
- Restricciones de prescripción

### 4.3 CRUD de Proveedores
- Manager visual en configuración
- Catálogo de productos por proveedor
- Precios y términos de pago
- Historial de compras integrado

---

## 📦 ENTREGABLES ESPERADOS

| Entregable | Líneas | Prioridad | Estado |
|-----------|--------|-----------|--------|
| Migration: Principios Activos | 150 | 🔴 ALTA | ⏳ TODO |
| Migration: OMS LME | 120 | 🔴 ALTA | ⏳ TODO |
| Migration: Proveedores | 100 | 🔴 ALTA | ⏳ TODO |
| Hook: usePrincipiosActivos | 200 | 🟢 MEDIA | ⏳ TODO |
| Hook: useProveedores | 250 | 🟢 MEDIA | ⏳ TODO |
| Component: PrincipiosActivosManager | 320 | 🟢 MEDIA | ⏳ TODO |
| Component: ProveedoresManager | 380 | 🟢 MEDIA | ⏳ TODO |
| Component: SelectorMedicamentos Mejorado | 200 | 🔵 BAJA | ⏳ TODO |
| Testing Plan | 300 | 🟢 MEDIA | ⏳ TODO |
| Documentación | 150 | 🟢 MEDIA | ⏳ TODO |

**Total Líneas de Código:** ~2,100 líneas  
**Total Documentación:** ~450 líneas

---

## 🔧 ARQUITECTURA TÉCNICA

### 4.1 Schema de Principios Activos

```sql
CREATE TABLE farmacia.principios_activos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_oms TEXT UNIQUE NOT NULL,  -- Ej: A01AA
  nombre TEXT NOT NULL,              -- Ej: Hidróxido de Aluminio
  nombre_comun TEXT,
  clase_terapeutica TEXT,            -- ATC classification
  forma_farmaceutica TEXT[],         -- Tableta, Inyectable, etc
  concentracion TEXT,                -- 500mg, 10%
  vias_administracion TEXT[],        -- Oral, IV, IM, Tópica
  indicaciones_generales TEXT,
  contraindicaciones TEXT,
  efectos_adversos TEXT,
  lme_esencial BOOLEAN DEFAULT FALSE, -- Marcado en OMS LME
  en_stock BOOLEAN DEFAULT TRUE,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_principios_codigo ON farmacia.principios_activos(codigo_oms);
CREATE INDEX idx_principios_nombre ON farmacia.principios_activos USING GIN(
  to_tsvector('spanish', nombre || ' ' || nombre_comun)
);
CREATE INDEX idx_principios_activo ON farmacia.principios_activos(activo);
```

### 4.2 Schema de OMS LME

```sql
CREATE TABLE farmacia.oms_lme (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  principio_activo_id UUID NOT NULL REFERENCES farmacia.principios_activos(id),
  categoria TEXT NOT NULL,           -- 'Antimicrobiano', 'Antiparasitario', etc
  posicion_en_lista INT,
  observaciones_oms TEXT,
  vigencia_desde DATE,
  vigencia_hasta DATE,
  pais_referencia TEXT DEFAULT 'GQ', -- Guinea Ecuatorial
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lme_principio ON farmacia.oms_lme(principio_activo_id);
```

### 4.3 Schema de Proveedores

```sql
CREATE TABLE farmacia.proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  nombre_comercial TEXT NOT NULL,
  razon_social TEXT,
  rfc_nit TEXT UNIQUE,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  ciudad TEXT,
  pais TEXT,
  contacto_principal TEXT,
  terminos_pago TEXT,               -- Ej: '30 días', 'Inmediato'
  tipo_proveedor TEXT,              -- 'Local', 'Nacional', 'Internacional'
  calificacion_general DECIMAL(3,2), -- 1-5
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE farmacia.proveedores_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_id UUID NOT NULL REFERENCES farmacia.proveedores(id),
  principio_activo_id UUID NOT NULL REFERENCES farmacia.principios_activos(id),
  codigo_interno_proveedor TEXT,
  precio_unitario DECIMAL(10,4),
  moneda TEXT DEFAULT 'CFA',
  cantidad_minima INT DEFAULT 1,
  cantidad_maxima INT DEFAULT 1000,
  tiempo_entrega_dias INT,
  disponibilidad_stock INT,
  ultimo_pedido DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE farmacia.historial_compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_id UUID NOT NULL REFERENCES farmacia.proveedores(id),
  producto_id UUID NOT NULL REFERENCES farmacia.proveedores_productos(id),
  cantidad INT,
  precio_unitario DECIMAL(10,4),
  total DECIMAL(12,2),
  fecha_compra DATE,
  fecha_entrega DATE,
  estado TEXT,                       -- 'Pendiente', 'Recibido', 'Cancelado'
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_proveedores_activo ON farmacia.proveedores(activo);
CREATE INDEX idx_historial_proveedor ON farmacia.historial_compras(proveedor_id);
```

---

## 📋 PLAN DETALLADO POR DÍAS

### DÍA 1-2: MIGRACIONES (150 líneas código)

**Archivo:** `supabase/migrations/20260606_023_principios_activos_lme.sql`

```sql
-- 1. Crear schema farmacia (si no existe)
CREATE SCHEMA IF NOT EXISTS farmacia;

-- 2. Principios Activos
CREATE TABLE farmacia.principios_activos (
  [... ver schema arriba ...]
);

-- 3. OMS LME
CREATE TABLE farmacia.oms_lme (
  [... ver schema arriba ...]
);

-- 4. RLS Policies
ALTER TABLE farmacia.principios_activos ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmacia.oms_lme ENABLE ROW LEVEL SECURITY;

CREATE POLICY "principios_activos_select" ON farmacia.principios_activos
  FOR SELECT USING (activo = true);

CREATE POLICY "principios_activos_admin" ON farmacia.principios_activos
  FOR ALL USING (auth.role() = 'authenticated');

-- 5. Índices GIN para búsqueda
CREATE INDEX idx_principios_search ON farmacia.principios_activos 
USING GIN(to_tsvector('spanish', nombre));

-- 6. Triggers para updated_at
CREATE TRIGGER update_principios_activos_timestamp
BEFORE UPDATE ON farmacia.principios_activos
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
```

**Archivo:** `supabase/migrations/20260607_024_proveedores.sql`

```sql
-- 1. Proveedores
CREATE TABLE farmacia.proveedores (
  [... ver schema arriba ...]
);

-- 2. Proveedores-Productos
CREATE TABLE farmacia.proveedores_productos (
  [... ver schema arriba ...]
);

-- 3. Historial de Compras
CREATE TABLE farmacia.historial_compras (
  [... ver schema arriba ...]
);

-- 4. RLS Policies
ALTER TABLE farmacia.proveedores ENABLE ROW LEVEL SECURITY;

-- 5. Triggers
CREATE TRIGGER update_proveedores_timestamp
BEFORE UPDATE ON farmacia.proveedores
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
```

### DÍA 2-3: SEEDS (200 líneas código)

**Archivo:** `implementacion_v3/FASE_4_Catalogos_Farmaceuticos/seeds/principios_activos_oms.sql`

Cargar los ~600 principios activos del catálogo OMS:
- ATC classification
- Formas farmacéuticas
- Vías de administración
- Indicaciones

**Archivo:** `implementacion_v3/FASE_4_Catalogos_Farmaceuticos/seeds/oms_lme_guinea_ecuatorial.sql`

Cargar LME vigente para GQ (aproximadamente 350-400 medicamentos)

### DÍA 3-4: HOOKS (200 líneas código)

**Archivo:** `src/hooks/usePrincipiosActivos.ts`

```typescript
export const usePrincipiosActivos = () => {
  // Query: obtener todos los PA
  const { data: principiosActivos } = useQuery({
    queryKey: ['principios-activos'],
    queryFn: async () => {
      const { data } = await supabase
        .from('farmacia.principios_activos')
        .select('*')
        .eq('activo', true);
      return data || [];
    }
  });

  // Query: búsqueda FTS
  const buscar = async (termino: string) => {
    const { data } = await supabase.rpc('buscar_principios_activos', {
      termino: termino
    });
    return data;
  };

  // Mutation: crear PA
  const crearPA = useMutation({
    mutationFn: async (pa: Partial<PrincipioActivo>) => {
      const { data } = await supabase
        .from('farmacia.principios_activos')
        .insert([pa])
        .select()
        .single();
      return data;
    }
  });

  // Similar: actualizarPA, eliminarPA, toggleLME
};
```

**Archivo:** `src/hooks/useProveedores.ts`

```typescript
export const useProveedores = () => {
  // Query: listar proveedores
  const { data: proveedores } = useQuery({
    queryKey: ['proveedores'],
    queryFn: async () => {
      const { data } = await supabase
        .from('farmacia.proveedores')
        .select('*')
        .eq('activo', true);
      return data || [];
    }
  });

  // Query: productos de un proveedor
  const obtenerProductosProveedor = async (proveedorId: string) => {
    const { data } = await supabase
      .from('farmacia.proveedores_productos')
      .select('*')
      .eq('proveedor_id', proveedorId);
    return data;
  };

  // Query: historial de compras
  const historialCompras = async (proveedorId: string) => {
    const { data } = await supabase
      .from('farmacia.historial_compras')
      .select('*')
      .eq('proveedor_id', proveedorId)
      .order('fecha_compra', { ascending: false });
    return data;
  };

  // Mutations: CRUD proveedor, productos, historial
};
```

### DÍA 4-5: COMPONENTES UI (600 líneas código)

**Archivo:** `src/components/hosix/configuracion/PrincipiosActivosManager.tsx`

Componente para:
- Listar todos los principios activos
- Búsqueda FTS (texto completo)
- Filtro por categoría ATC
- Marcar/desmarcar LME
- Editar detalles
- Crear nuevos

**Archivo:** `src/components/hosix/configuracion/ProveedoresManager.tsx`

Componente para:
- CRUD de proveedores
- Gestión de productos por proveedor
- Precios y términos
- Historial de compras
- Reportes de compra

**Archivo:** `src/components/hosix/prescripcion/SelectorMedicamentosAvanzado.tsx`

Mejorado con:
- Búsqueda FTS integrada
- Filtro por LME (medicamentos esenciales)
- Sugerencias de proveedores
- Precio actualizado
- Disponibilidad en stock

### DÍA 5-6: INTEGRACIÓN EN CONFIGURACIÓN (150 líneas)

**Modificar:** `src/pages/Hosix/Configuracion.tsx`

Agregar en tab "Maestros":
- TabsTrigger para "Principios Activos"
- TabsTrigger para "Proveedores"
- Componentes correspondientes

```typescript
<TabsList className="grid w-full grid-cols-8">
  {/* ... tabs anteriores ... */}
  <TabsTrigger value="principios">Principios</TabsTrigger>
  <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
</TabsList>

{/* Content */}
<TabsContent value="principios">
  <PrincipiosActivosManager />
</TabsContent>
<TabsContent value="proveedores">
  <ProveedoresManager />
</TabsContent>
```

### DÍA 6-7: TESTING (300 líneas)

Crear:
- `TESTING_FASE4_FARMACIA.md` (200 líneas)
- `CHECKLIST_INTERACTIVO_FASE4.md` (200 líneas)

Tests cubrirán:
- Carga de datos OMS (~600 PA + ~350 LME)
- Búsqueda FTS de PA
- CRUD de proveedores
- Historial de compras
- Integración en selector de medicamentos
- Performance de búsqueda
- Browser compatibility

### DÍA 7-8: DOCUMENTACIÓN Y FINALIZACIÓN (150 líneas)

- Actualizar log de implementación
- Resumen de Fase 4
- Próximos pasos (Fase 5)

---

## 🔍 DETALLES TÉCNICOS CLAVE

### Búsqueda FTS (Full Text Search)

```sql
-- RPC para búsqueda rápida
CREATE OR REPLACE FUNCTION buscar_principios_activos(
  termino TEXT
) RETURNS TABLE (
  id UUID,
  codigo_oms TEXT,
  nombre TEXT,
  clase_terapeutica TEXT,
  relevancia REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.id,
    pa.codigo_oms,
    pa.nombre,
    pa.clase_terapeutica,
    ts_rank(
      to_tsvector('spanish', pa.nombre || ' ' || COALESCE(pa.nombre_comun, '')),
      websearch_to_tsquery('spanish', termino)
    ) as relevancia
  FROM farmacia.principios_activos pa
  WHERE to_tsvector('spanish', pa.nombre || ' ' || COALESCE(pa.nombre_comun, ''))
    @@ websearch_to_tsquery('spanish', termino)
  AND pa.activo = true
  ORDER BY relevancia DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;
```

### Restricciones en Prescripción

Para medicamentos NO-LME:
- Requerir justificación
- Requerir firma de supervisión
- Notificación al farmacéutico

```typescript
// En formulario de prescripción
if (!esLME && requiereJustificacion) {
  mostrarCampoJustificacion();
  requerirFirmaSupervision();
}
```

### Cálculo de Precios y Disponibilidad

```typescript
// En selector de medicamentos
const obtenerMejorOpcion = async (principioActivoId: string) => {
  const { data: opciones } = await supabase
    .from('farmacia.proveedores_productos')
    .select(`
      *,
      proveedor:proveedor_id(
        nombre_comercial,
        calificacion_general,
        terminos_pago
      )
    `)
    .eq('principio_activo_id', principioActivoId)
    .order('precio_unitario', { ascending: true });

  return opciones[0]; // Proveedor con mejor precio
};
```

---

## ✅ CHECKLIST PRE-IMPLEMENTACIÓN

- [ ] Catálogo OMS descargado
- [ ] LME Guinea Ecuatorial obtenida
- [ ] Schema diseñado
- [ ] Seeds preparados
- [ ] Documentación lista
- [ ] Plan aprobado por usuario

---

## 📊 MATRIZ DE RIESGOS

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|--------|-----------|
| Datos OMS incompletos | Media | Bajo | Validación y seeds manuales |
| Performance FTS lenta | Baja | Medio | Índices GIN + límites de resultados |
| LME desactualizada | Baja | Medio | Script de sincronización mensual |
| Conflictos de precios | Media | Bajo | Auditoría y historial de cambios |

---

## 📈 SUCCESS CRITERIA

**Phase 4 está COMPLETADA cuando:**

1. ✅ 600+ principios activos cargados en BD
2. ✅ 350+ medicamentos en OMS LME
3. ✅ CRUD de proveedores funcional
4. ✅ Búsqueda FTS responde en < 200ms
5. ✅ Selector de medicamentos mejorado integrado
6. ✅ Historial de compras trackea correctamente
7. ✅ Tests pasan 100%
8. ✅ Documentación completa

---

**FASE 4: LISTA PARA INICIAR**
