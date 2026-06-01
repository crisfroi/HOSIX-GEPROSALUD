# 📋 ANÁLISIS DE ALINEAMIENTO - HOSIX SISTEMA HOSPITALARIO
**Fecha:** 29-05-2026 | **Estado:** Análisis Completo | **Red Nacional:** Guinea Ecuatorial

---

## 🎯 VISIÓN GENERAL

HOSIX es un **Sistema Integral de Gestión Hospitalaria (HIS) para la Red Nacional de Hospitales de Guinea Ecuatorial**, diseñado para funcionar:
- ✅ **En local** en cada hospital (base de datos local + aplicación)
- ✅ **Multi-hospital** con sincronización centralizada de información
- ✅ **Multi-usuario y multirrol** con control granular de permisos
- ✅ **24/7** sin dependencia de conectividad contínua

**Stack Confirmado:**
- Frontend: React 18 + Vite + Tailwind + shadcn/ui
- Backend: Supabase (PostgreSQL + PostgREST + Edge Functions)
- Auth: Supabase Auth (JWT + RLS)
- Real-time: Supabase Realtime para sincronización

---

## 📊 ESTADO DEL PROYECTO

### ✅ MÓDULOS IMPLEMENTADOS (ya en código)

```
Núcleo:
  ✅ Configuración & Seguridad (Users, Roles, Permisos, Auditoría)
  ✅ Pacientes (Registro, Búsqueda, Historia Clínica Básica)
  ✅ MPI (Master Patient Index)

Flujos Clínicos:
  ✅ Consulta Externa (Citas, Agendas)
  ✅ Urgencias (Admisión, Triage)
  ✅ Hospitalización (Ingreso, Traslados, Alta)
  ✅ Quirófanos (LEQ, Programación)

Asistenciales:
  ✅ Médicos (Worklist, Notas Clínicas, Evolución)
  ✅ Enfermería (Kardex, Constantes Vitales, Planes de Cuidado)
  ✅ Laboratorio (Solicitudes)
  ✅ Imagenología (Solicitudes)
  ✅ Interconsultas
  ✅ Farmacia (Dispensaciones)

Administrativos:
  ✅ Admisión & Citas
  ✅ Facturación (Facturas, Tarifas, Cuentas)
  ✅ Aseguradoras
  ✅ Cajas (Turnos, Movimientos, Arqueos)
  ✅ Logística (Almacenes, Stock, Movimientos)
  ✅ Compras (Licitaciones, Presupuestos, Ofertas, Adjudicaciones)
  
Complementarios:
  ✅ Obstetricia (Gestaciones)
  ✅ BI (Reportes, Dashboard)

Otros:
  ✅ Control Epidemiológico (Básico)
  ✅ Plantillas de Documentos (Básico)
```

### ⚠️ MÓDULOS A REVISAR/COMPLETAR

| Módulo | Estado | Acción Requerida |
|--------|--------|------------------|
| **Historia Clínica Electrónica (HCE) Avanzada** | 🟡 Básica | Expandir a: Timeline eventos, Antecedentes unificados, Alergias con alertas, Escalas clínicas (40+), Diagnósticos activos CIE-10 |
| **Control Epidemiológico** | 🟡 Básico | Agregar: Sistemas de alertas, Parámetros configurables, Rastreo de contactos/familias, Dashboard epidemiológico |
| **Plantillas de Documentos** | 🟡 Básico | Sistema avanzado: Editor WYSIWYG, Variables dinámicas, Firmas digitales, Generación PDF, Autoguardado |
| **Sincronización Multi-hospital** | 🟠 No implementada | Cron jobs, APIs de sincronización, Exportación USB, Manejo de conflictos |
| **Workspaces/Pestañas** | 🟠 No implementada | Sistema de contextos múltiples, Navegación entre episodios abiertos |
| **Gestión de Servicios/Productos** | 🟡 Parcial | Unificar edición de precios, Stock, Aseguradoras |
| **Escalas Clínicas (40+)** | 🟡 Básico | Implementar todas: Glasgow, Barthel, Braden, Norton, Apgar, NIHSS, CHADS2, etc. |
| **Teleconsulta (Jitsi)** | 🟠 No implementada | Integración con Jitsi Meet SDK |
| **PACS/DICOM** | 🟠 No implementada | Integración con sistemas de imágenes médicas |

---

## 🗄️ ARQUITECTURA DE BASE DE DATOS

### Esquemas en Supabase (CONFIRMADOS)

```sql
✅ configuracion    -- Maestros, parametrización, seguridad
✅ pacientes        -- HC, MPI, datos demográficos
✅ clinico          -- Episodios, diagnósticos, evolución
✅ administrativo   -- Citas, hospitalización, urgencias
✅ quirurgico       -- LEQ, quirófanos, programaciones
✅ farmacia         -- Medicamentos, prescripciones, stock
✅ logistica        -- Almacenes, suministros, compras
✅ facturacion      -- Facturas, cobros, seguros, cajas
✅ bi               -- Vistas materializadas para reportes
✅ auditoria        -- Logs de acceso, cambios críticos
```

### Tablas Maestras Principales (IMPLEMENTADAS)

```
✅ configuracion.hospitales          -- Red nacional
✅ configuracion.departamentos       -- Por hospital
✅ configuracion.servicios           -- Por departamento
✅ configuracion.usuarios            -- Con perfiles y permisos
✅ configuracion.perfiles            -- Roles granulares
✅ configuracion.camas               -- Gestión de camas
✅ configuracion.cie10               -- Diagnósticos
✅ configuracion.procedimientos      -- Procedimientos médicos
✅ pacientes.pacientes               -- Registro maestro
✅ pacientes.antecedentes            -- Historial médico
✅ pacientes.alergias                -- Con severidad
✅ pacientes.seguros                 -- Pólizas por paciente
✅ clinico.episodios                 -- Todas las atenciones
✅ clinico.signos_vitales            -- Monitoreo
✅ clinico.notas_clinicas            -- Con firma digital
✅ facturacion.companias_seguro      -- Aseguradoras
✅ facturacion.tarifas               -- Precios por concepto
✅ facturacion.facturas              -- Generación automática
✅ facturacion.cobros                -- Registrar pagos
```

---

## 🔄 FLUJOS DE NEGOCIO (4 FLUJOS CRÍTICOS)

### FLUJO 1: CONSULTA EXTERNA ✅
```
1. Paciente llega → Obtiene ticket
2. Admisión: ¿Tiene HC?
   - NO: Registro + creación HC + NHC único (usar función generar_nhc)
   - SÍ: Identificación por documento/NHC
3. ¿Requiere cita?
   - Cita existente o genera para hoy
4. Llamado a consultorio → Inicio episodio_tipo='consulta_externa'
5. Médico: Evolución, diagnóstico (CIE-10), solicitudes (Lab/RX), prescripción
6. Enfermería: Constantes vitales, Kardex
7. Farmacia: Validación prescripción, Dispensación, Descuento stock
8. Alta médica: Domicilio/Hospitalización/Referencia
9. Cierre administrativo → Facturación automática
```

### FLUJO 2: EMERGENCIA ✅
```
1. Llegada paciente → Identificación (HC o creación)
2. Triage → Clasificación 1-5 → Asignación box/zona
3. Si nivel 1 (Shock): atención inmediata
4. Atención Enfermería: Constantes vitales, Diario clínico
5. Atención Médica: Evaluación, solicitudes, interconsultas, prescripción
6. Manejo Farmacéutico:
   - Medicamentos internos (24h) → Enfermería kardex
   - Receta de alta → Farmacia ventanilla
7. Alta médica → tipo destino
8. Alta administrativa → Libera box → Facturación automática
```

### FLUJO 3: HOSPITALIZACIÓN ✅
```
1. Origen: Urgencias / Programada / Consulta
2. Admisión: Datos ingreso, asignación cama (mapa visual de camas)
3. Instalación: Pulsera identificativa, registro constantes iniciales
4. Ciclo diario:
   - Médico: Visita, Evolución, Órdenes, Solicitudes
   - Enfermería: Kardex, Administración medicamentos, Procedimientos
   - Farmacia: Validación prescripciones, Dispensación nominativa
5. Posibles traslados de cama/servicio
6. Alta médica → Informe automático + CIE-10
7. Alta administrativa → Libera cama → Facturación global
```

### FLUJO 4: QUIRÓFANOS & LEQ ✅
```
1. Médico ingresa paciente en LEQ desde cualquier episodio
2. Admisión: Programación pre-QX (Lab, RX, EKG, Anestesia)
3. Evaluación anestesiológica → APTO/NO APTO
4. Programación: Quirófano, fecha, hora, equipo, kits
5. Farmacia: Preparación materiales
6. Día de cirugía:
   - CheckList pre-op (Enfermería + Médico)
   - Registro entrada paciente → Inicio ejecución
7. Ejecución: Hallazgos, técnica, materiales, devoluciones
8. Fin → Boletín quirúrgico firmado
9. Destino post-op: Reanimación/UCI/Hospitalización
```

---

## 🎯 REQUISITOS CLAVE DEL USUARIO (CRÍTICOS)

### 1️⃣ ARQUITECTURA MULTI-HOSPITAL CON SINCRONIZACIÓN
**Objetivo:** Cada hospital corre **localmente** pero sincroniza con **central**

#### Implementación:
```typescript
// Opción A: Supabase + Edge Functions (RECOMENDADO)
// - Edge Functions como API de sincronización
// - Realtime para cambios en tiempo real
// - Scheduled functions para cron jobs

// Opción B: Sistema Manual + USB
// - Exportar datos en JSON/CSV
// - Importar en hospital central
// - Resolver conflictos automáticamente

// Opción C: Cron Automático (Híbrido)
// - Cron job cada N minutos/horas
// - Sincronización asíncrona de tablas críticas
// - Log de cambios (change log) para auditoría

interface SincronizacionConfig {
  hospital_id: UUID;
  tipo: 'realtime' | 'cron' | 'manual_usb';
  frecuencia_minutos: number;
  tablas_sincronizar: string[];  // pacientes, episodios, facturas, etc.
  conflicto_resolucion: 'local_gana' | 'central_gana' | 'merge';
}
```

**Tablas a sincronizar (prioridad):**
1. `pacientes.pacientes` (MPI centralizado)
2. `clinico.episodios` (Actividad clínica)
3. `facturacion.facturas` (Cierre financiero)
4. `configuracion.usuarios` (Gestión de permisos central)

**Nueva tabla para gestionar sincronización:**
```sql
CREATE TABLE IF NOT EXISTS sincronizacion.cambios_pendientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_origen_id UUID REFERENCES configuracion.hospitales(id),
  tabla VARCHAR(100) NOT NULL,
  registro_id UUID NOT NULL,
  tipo_cambio VARCHAR(20),  -- 'insert','update','delete'
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  sincronizado BOOLEAN DEFAULT FALSE,
  fecha_cambio TIMESTAMPTZ DEFAULT NOW(),
  fecha_sincronizacion TIMESTAMPTZ,
  intento_numero INT DEFAULT 0
);
```

### 2️⃣ NAVEGACIÓN MULTI-PESTAÑA (WORKSPACES)
**Objetivo:** Médico abre 3 pacientes simultáneamente, navega entre ellos

#### Requisitos:
- Cada pestaña = un **contexto independiente** (episodio activo)
- Breadcrumb contextual por pestaña
- PatientBanner con datos del paciente activo
- Cambio de tab = cambio de contexto automático

#### Implementación:
```typescript
// Zustand store para tabs abiertos
interface AppTab {
  id: string;  // UUID
  title: string;  // "Juan García - HC-001"
  paciente_id: UUID;
  episodio_id: UUID;
  modulo_activo: string;  // 'medicos', 'enfermeria', etc.
  timestamp_apertura: number;
}

interface AppState {
  tabs: AppTab[];
  activeTabId: string;
  openTab: (tab: AppTab) => void;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  clearAllTabs: () => void;
}

// Componente TabBar en AppShell
<TabBar>
  {tabs.map(tab => (
    <Tab
      key={tab.id}
      active={activeTabId === tab.id}
      onClick={() => switchTab(tab.id)}
      onClose={() => closeTab(tab.id)}
    >
      {tab.title}
    </Tab>
  ))}
</TabBar>
```

### 3️⃣ HISTORIA CLÍNICA ELECTRÓNICA (HCE) AVANZADA
**Objetivo:** Vista unificada de TODO el historial del paciente

#### Componentes:
```typescript
interface HistoriaClinicaAvanzada {
  // 1. Timeline Events (orden cronológico inverso)
  episodios: {
    tipo: 'consulta' | 'urgencia' | 'hospitalización' | 'cirugía';
    fecha: Date;
    servicio: string;
    médico: string;
    diagnóstico_principal: string;
    estado: 'abierto' | 'cerrado';
  }[];

  // 2. Antecedentes Unificados
  antecedentes: {
    personales: string[];
    familiares: string[];
    quirúrgicos: string[];
    alérgicos: string[];
    hábitos: string[];
  };

  // 3. Alergias (BANNER DE ALERTA PERMANENTE)
  alergias_activas: {
    sustancia: string;
    tipo: 'medicamento' | 'alimento' | 'ambiental';
    severidad: 'leve' | 'moderada' | 'grave' | 'fatal';
    reacción: string;
  }[];

  // 4. Medicación Activa (durante episodio)
  medicacion_activa: {
    nombre: string;
    dosis: string;
    frecuencia: string;
    vía: string;
    fecha_inicio: Date;
    fecha_fin?: Date;
  }[];

  // 5. Constantes Vitales Recientes
  constantes_ultimas: {
    temperatura: number;
    presion: string;
    frecuencia_cardiaca: number;
    saturacion_oxigeno: number;
    peso: number;
    timestamp: Date;
  };

  // 6. Accesos Rápidos
  laboratorios_recientes: Laboratorio[];
  imagenes_recientes: Imagen[];
  informes_recientes: Informe[];

  // 7. Escalas Clínicas (40+ tipos)
  escalas_realizadas: {
    tipo: 'glasgow' | 'barthel' | 'braden' | ...;
    resultado: number | string;
    interpretacion: string;
    fecha: Date;
    evaluado_por: string;
  }[];

  // 8. Diagnósticos Activos (CIE-10)
  diagnosticos_activos: {
    codigo_cie10: string;
    descripcion: string;
    episodio_origen: string;
    estado: 'activo' | 'resuelto';
    fecha_diagno: Date;
  }[];

  // 9. Vacunas (si aplica pediatría)
  vacunas: VacunasRecord[];

  // 10. Documentos Adjuntos
  documentos: {
    tipo: 'informe' | 'resultado_lab' | 'imagen' | 'consentimiento';
    nombre: string;
    url: string;
    fecha: Date;
  }[];
}
```

**Componente React:**
```tsx
<HistoriaClinicaPanel paciente_id={uuid}>
  {/* AlertBanner: Alergias activas */}
  <AlergiasBanner alergias={alergias_activas} />

  {/* Tabs: Antecedentes | Medicación | Escalas | Documentos */}
  <Tabs defaultValue="timeline">
    <TabsList>
      <TabTrigger value="timeline">Timeline</TabTrigger>
      <TabTrigger value="antecedentes">Antecedentes</TabTrigger>
      <TabTrigger value="medicacion">Medicación Activa</TabTrigger>
      <TabTrigger value="escalas">Escalas Clínicas</TabTrigger>
      <TabTrigger value="diagnosticos">Diagnósticos CIE-10</TabTrigger>
    </TabsList>

    <TabsContent value="timeline">
      <TimelineEpisodios episodios={episodios} />
    </TabsContent>

    {/* ... otros tabs */}
  </Tabs>
</HistoriaClinicaPanel>
```

### 4️⃣ GESTIÓN DE SERVICIOS Y PRODUCTOS CON PRECIOS
**Objetivo:** Editar servicios/productos y sus precios de forma centralizada

#### Flujo:
```typescript
// Tabla principal (NUEVA)
CREATE TABLE IF NOT EXISTS configuracion.servicios_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(30) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50),  -- 'consulta', 'estancia', 'laboratorio', 'imagen', 'medicamento', 'cirugia'
  
  // Información de stock (si aplica)
  es_medicamento BOOLEAN DEFAULT FALSE,
  medicamento_id UUID REFERENCES farmacia.medicamentos(id),
  articulo_id UUID REFERENCES logistica.articulos(id),
  
  // Precios por aseguradora
  precio_base DECIMAL(12,2),
  moneda VARCHAR(3) DEFAULT 'XAF',
  
  activo BOOLEAN DEFAULT TRUE,
  hospital_id UUID REFERENCES configuracion.hospitales(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

// Tabla de precios por aseguradora (permite override)
CREATE TABLE IF NOT EXISTS facturacion.precios_aseguradora (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_producto_id UUID REFERENCES configuracion.servicios_productos(id),
  compania_seguro_id UUID REFERENCES facturacion.companias_seguro(id),
  
  precio_especial DECIMAL(12,2),
  descuento_porcentaje DECIMAL(5,2) DEFAULT 0,
  
  vigencia_desde DATE,
  vigencia_hasta DATE,
  
  UNIQUE(servicio_producto_id, compania_seguro_id)
);
```

**Componente UI:**
```tsx
<ServiciosProductosManager>
  <DataTable
    columns={[
      { accessorKey: "codigo", header: "Código" },
      { accessorKey: "nombre", header: "Servicio/Producto" },
      { accessorKey: "tipo", header: "Tipo" },
      { accessorKey: "precio_base", header: "Precio Base (XAF)" },
      {
        id: "acciones",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">Editar</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => editarPrecioBase(row.original.id)}>
                Editar Precio Base
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editarPreciosAseguradora(row.original.id)}>
                Precios por Aseguradora
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ]}
  />
</ServiciosProductosManager>
```

### 5️⃣ MÓDULO DE ASEGURADORAS (MEJORADO)
**Objetivo:** Gestión completa de seguros y sus tarifas

#### Tabla mejorada:
```sql
CREATE TABLE IF NOT EXISTS facturacion.companias_seguro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  tipo VARCHAR(20),  -- 'publica', 'privada', 'mutua', 'convenio'
  
  // Contacto
  contacto TEXT,
  email TEXT,
  telefono TEXT,
  
  // Configuración de cobertura
  cubre_consulta BOOLEAN DEFAULT TRUE,
  cubre_hospitalizacion BOOLEAN DEFAULT TRUE,
  cubre_cirugia BOOLEAN DEFAULT TRUE,
  porcentaje_cobertura_default DECIMAL(5,2) DEFAULT 100,
  copago_porcentaje DECIMAL(5,2) DEFAULT 0,
  
  // Límites
  limite_mensual DECIMAL(12,2),
  limite_anual DECIMAL(12,2),
  requiere_autorizacion BOOLEAN DEFAULT FALSE,
  
  // Facturación
  dias_pago INT DEFAULT 30,
  requiere_recobro BOOLEAN DEFAULT FALSE,
  
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6️⃣ FACTURACIÓN CON VISTA DE DEUDAS TOTALES
**Objetivo:** Al momento de cobro, ver TODAS las deudas del paciente

#### Flujo:
```typescript
// Nueva vista/función
CREATE OR REPLACE FUNCTION obtener_deudas_paciente(p_paciente_id UUID)
RETURNS TABLE (
  factura_id UUID,
  numero_factura VARCHAR,
  tipo_episodio VARCHAR,
  fecha_emision TIMESTAMPTZ,
  monto_total DECIMAL,
  monto_pagado DECIMAL,
  monto_adeudado DECIMAL,
  dias_atraso INT,
  estado VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.numero_factura,
    e.tipo_episodio,
    f.fecha_emision,
    f.total,
    COALESCE(SUM(c.monto), 0) as monto_pagado,
    f.total - COALESCE(SUM(c.monto), 0) as monto_adeudado,
    EXTRACT(DAY FROM NOW() - f.fecha_emision)::INT as dias_atraso,
    f.estado
  FROM facturacion.facturas f
  LEFT JOIN facturacion.cobros c ON f.id = c.factura_id AND c.anulado = FALSE
  LEFT JOIN clinico.episodios e ON f.episodio_id = e.id
  WHERE f.paciente_id = p_paciente_id
    AND f.estado != 'anulada'
  GROUP BY f.id, f.numero_factura, e.tipo_episodio, f.fecha_emision, f.total, f.estado
  ORDER BY f.fecha_emision DESC;
END;
$$ LANGUAGE plpgsql;

// Componente en facturación
<CobrosPanel paciente_id={uuid}>
  <ResumenDeudas paciente_id={uuid} />
  
  {/* Vista todas las deudas */}
  <DataTable
    columns={[
      { accessorKey: "numero_factura", header: "Factura" },
      { accessorKey: "tipo_episodio", header: "Tipo" },
      { accessorKey: "fecha_emision", header: "Fecha" },
      { accessorKey: "monto_total", header: "Total (XAF)" },
      { accessorKey: "monto_pagado", header: "Pagado (XAF)" },
      { accessorKey: "monto_adeudado", header: "Adeudado (XAF)", className: "text-red-600 font-bold" },
      { accessorKey: "dias_atraso", header: "Días Atraso" },
    ]}
    data={deudas}
  />

  {/* Registrar Cobro Parcial */}
  <RegistroCobro>
    <Input
      name="monto_cobrado"
      label="Monto a cobrar (XAF)"
      placeholder={`Máximo: ${montoTotalAdeudado}`}
    />
  </RegistroCobro>
</CobrosPanel>
```

### 7️⃣ CONTROL EPIDEMIOLÓGICO CON ALERTAS
**Objetivo:** Monitoreo de enfermedades notificables con alertas por parámetros

#### Nuevas tablas:
```sql
-- Enfermedades bajo vigilancia epidemiológica
CREATE TABLE IF NOT EXISTS epidemiologia.enfermedades_vigilancia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) UNIQUE,
  nombre TEXT NOT NULL,
  cie10_codigo VARCHAR(10),
  es_notificable BOOLEAN DEFAULT TRUE,
  
  -- Parámetros de alerta
  umbral_casos_semana INT,
  umbral_casos_mes INT,
  riesgo_brote BOOLEAN DEFAULT FALSE,
  
  activa BOOLEAN DEFAULT TRUE
);

-- Casos epidemiológicos
CREATE TABLE IF NOT EXISTS epidemiologia.casos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES pacientes.pacientes(id),
  episodio_id UUID REFERENCES clinico.episodios(id),
  enfermedad_id UUID REFERENCES epidemiologia.enfermedades_vigilancia(id),
  
  fecha_inicio_sintomas DATE,
  fecha_diagnostico DATE,
  localidad TEXT,
  
  -- Contactos/Familia
  tiene_contactos_hogar BOOLEAN DEFAULT FALSE,
  num_contactos INT DEFAULT 0,
  
  -- Rastreo de familia (árbol de contagio)
  paciente_contacto_id UUID REFERENCES pacientes.pacientes(id),
  es_contacto_confirmado BOOLEAN DEFAULT FALSE,
  
  estado VARCHAR(20),  -- 'sospecha', 'confirmado', 'descartado', 'recuperado'
  
  notificado_a_autoridades BOOLEAN DEFAULT FALSE,
  fecha_notificacion TIMESTAMPTZ,
  
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alertas epidemiológicas
CREATE TABLE IF NOT EXISTS epidemiologia.alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_alerta VARCHAR(50),  -- 'brote_posible', 'umbral_excedido', 'contacto_identificado'
  enfermedad_id UUID REFERENCES epidemiologia.enfermedades_vigilancia(id),
  paciente_id UUID REFERENCES pacientes.pacientes(id),
  
  descripcion TEXT,
  severidad VARCHAR(20),  -- 'info', 'warning', 'critical'
  
  enviada BOOLEAN DEFAULT FALSE,
  fecha_alerta TIMESTAMPTZ DEFAULT NOW()
);
```

**Rastreo de Familia:**
```typescript
interface RastreoContactos {
  paciente_indice_id: UUID;
  contactos: {
    paciente_id: UUID;
    relacion: 'familiar' | 'conviviente' | 'contacto_laboral';
    fecha_ultimo_contacto: Date;
    sintomas_identificados: boolean;
    en_vigilancia: boolean;
  }[];
  arbol_contagio: {
    caso_raiz: UUID;
    generaciones: {
      generacion: number;
      casos: UUID[];
    }[];
  };
}

// Componente
<RastreoContactosPanel paciente_id={uuid}>
  <ArbolContactos data={arbolContagio} />
  
  {/* Agregar contacto */}
  <AgregarContactoForm
    onSubmit={({ contacto_id, relacion }) => {
      // Crear relación epidemiológica
      crearCasoContacto(paciente_id, contacto_id, relacion);
    }}
  />
</RastreoContactosPanel>
```

**Dashboard Epidemiológico:**
```tsx
<DashboardEpidemiologia>
  {/* KPIs */}
  <Row>
    <KPICard title="Casos Activos" value={activeCases} icon={AlertCircle} />
    <KPICard title="Brotes Detectados" value={outbreaks} icon={AlertTriangle} />
    <KPICard title="Contactos en Vigilancia" value={underSurveillance} icon={Users} />
  </Row>

  {/* Alertas Recientes */}
  <AlertasRecientes limit={10} />

  {/* Gráfico de casos por enfermedad */}
  <LineChart data={casosPorEnfermedad} />

  {/* Mapa de distribucion geográfica */}
  <MapaDistribucionCasos />
</DashboardEpidemiologia>
```

### 8️⃣ SISTEMA DE PLANTILLAS DE DOCUMENTOS
**Objetivo:** Crear, editar y usar plantillas para informes y documentos

#### Tablas:
```sql
CREATE TABLE IF NOT EXISTS configuracion.plantillas_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50),  -- 'informe_alta', 'receta', 'referencia', 'consentimiento', 'boletin_quirurgico'
  
  -- Contenido (HTML con variables)
  contenido_html TEXT NOT NULL,
  
  -- Variables dinámicas {{paciente.nombre}}, {{episodio.diagnostico}}, etc.
  variables_disponibles JSONB,  -- [{ var: '{{paciente.nombre}}', descripcion: 'Nombre del paciente' }, ...]
  
  -- Firma digital
  requiere_firma BOOLEAN DEFAULT FALSE,
  
  -- Versioning
  version INT DEFAULT 1,
  activo BOOLEAN DEFAULT TRUE,
  
  created_by UUID REFERENCES configuracion.usuarios(id),
  updated_by UUID REFERENCES configuracion.usuarios(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documentos generados a partir de plantillas
CREATE TABLE IF NOT EXISTS configuracion.documentos_generados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plantilla_id UUID REFERENCES configuracion.plantillas_documentos(id),
  episodio_id UUID REFERENCES clinico.episodios(id),
  paciente_id UUID REFERENCES pacientes.pacientes(id),
  
  contenido_final HTML,
  
  -- PDF generado
  pdf_url TEXT,
  
  -- Firma digital
  firmado BOOLEAN DEFAULT FALSE,
  firmado_por UUID REFERENCES configuracion.usuarios(id),
  firmado_en TIMESTAMPTZ,
  hash_firma TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  viewed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);
```

**Editor de Plantillas:**
```tsx
<EditorPlantillas plantilla_id={uuid}>
  {/* Barra de herramientas */}
  <ToolBar>
    <Button onClick={insertarVariable}>
      Insertar Variable {{...}}
    </Button>
    <Button onClick={formatNegrita}>Negrita</Button>
    <Button onClick={formatItalica}>Itálica</Button>
  </ToolBar>

  {/* Editor WYSIWYG */}
  <Editor
    value={contenido}
    onChange={setContenido}
    placeholder="Escriba el contenido de la plantilla..."
  />

  {/* Variables disponibles */}
  <VariablesPanel>
    <VariablesList
      variables={[
        { var: '{{paciente.nombre}}', desc: 'Nombre completo' },
        { var: '{{paciente.nhc}}', desc: 'Número HC' },
        { var: '{{episodio.diagnostico}}', desc: 'Diagnóstico principal' },
        { var: '{{usuario.nombre}}', desc: 'Nombre del médico' },
      ]}
    />
  </VariablesPanel>

  {/* Preview */}
  <PreviewPanel content={renderVariables(contenido, testData)} />
</EditorPlantillas>

// Uso de plantilla
<GenerarDocumento plantilla_id={uuid} episodio_id={uuid}>
  <Button onClick={generar}>Generar PDF</Button>
</GenerarDocumento>
```

### 9️⃣ ESCALAS CLÍNICAS (40+ TIPOS)
**Objetivo:** Implementar todas las escalas médicas mencionadas

---

### 🔟 CONTABILIDAD & FINANZAS AVANZADO ⭐ NUEVO
**Objetivo:** Sistema contable completo con autorización mandatoria y portal central

#### Características:
1. **Cuentas Bancarias por Hospital** - Múltiples cuentas por institución
2. **Solicitudes de Movimiento** - Gasto/ingreso con flujo de autorización (Solicitante → Director → Aprobación)
3. **Comprobantes con Firma Digital** - Códigos únicos, hash, firma digital, rastreo
4. **Registro de Movimientos Contables** - Log completo de todas las transacciones
5. **Portal Tesorería Central** - Acceso centralizado a datos de todos hospitales
   - Dashboard consolidado por hospital
   - Reportes financieros
   - KPIs: ingresos, egresos, flujo
   - Exportación PDF/Excel
   - Acceso restringido a rol "Tesorería Central"

#### Tablas Base:
```sql
hosix_cuentas_bancarias
hosix_solicitudes_movimiento  -- Estados: pendiente, aprobado, rechazado, procesado
hosix_comprobantes_movimiento  -- Con firma digital y rastreo
hosix_movimientos_contables    -- Registro de cada movimiento
hosix_auditoria_contable       -- Trazabilidad completa
```

**Se sincroniza a Central:** Sí, automático via triggers a hosix_sync_cambios_pendientes

#### Escalas a implementar:
```typescript
const ESCALAS_CLINICAS = {
  // Neurológicas
  'glasgow': { nombre: 'Glasgow Coma Scale', items: 15, max: 15 },
  'nihss': { nombre: 'NIHSS (Stroke)', items: 11, max: 42 },
  'mmse': { nombre: 'Mini-Mental State Exam', items: 30, max: 30 },
  
  // Funcionales
  'barthel': { nombre: 'Índice de Barthel', items: 10, max: 100 },
  'katz': { nombre: 'Escala de Katz (ADLs)', items: 6, max: 6 },
  'lawton': { nombre: 'Escala de Lawton (IADLs)', items: 8, max: 8 },
  
  // Riesgo
  'braden': { nombre: 'Escala de Braden', items: 6, max: 23 },
  'norton': { nombre: 'Escala de Norton', items: 5, max: 20 },
  'wells_tvp': { nombre: 'Wells TVP', items: 10, max: 12 },
  'wells_tep': { nombre: 'Wells TEP', items: 9, max: 12 },
  'curb65': { nombre: 'CURB-65', items: 5, max: 5 },
  
  // Cardiovascular
  'chads2': { nombre: 'CHADS2', items: 5, max: 6 },
  'cha2ds2vasc': { nombre: 'CHA2DS2-VASc', items: 8, max: 9 },
  
  // Neonatal
  'apgar': { nombre: 'APGAR (Recién Nacido)', items: 5, max: 10 },
  'aldrete': { nombre: 'Aldrete (Recuperación)', items: 5, max: 10 },
  
  // Geriátrico
  'gds': { nombre: 'Geriatric Depression Scale', items: 15, max: 15 },
  'zarit': { nombre: 'Zarit (Cuidador)', items: 22, max: 88 },
  'mna': { nombre: 'Mini Nutritional Assessment', items: 18, max: 30 },
  'tinetti': { nombre: 'Tinetti (Marcha/Equilibrio)', items: 16, max: 28 },
  
  // Movilidad/Dolor
  'mews': { nombre: 'Modified EWS', items: 5, max: 15 },
  'norton_modificada': { nombre: 'Norton Modificada', items: 5, max: 20 },
  
  // Nutrición
  'mna_short': { nombre: 'MNA Short Form', items: 6, max: 14 },
};
```

**Componente genérico de Escala:**
```tsx
<EscalaClinicaForm escala_tipo={tipo}>
  {items.map((item, idx) => (
    <FormField
      key={idx}
      label={item.nombre}
      type={item.tipo}  // 'radio', 'select', 'number'
      options={item.opciones}
      value={values[item.id]}
      onChange={(val) => calcularPuntaje()}
    />
  ))}

  {/* Resultado automático */}
  <ResultadoEscala
    puntaje={totalScore}
    interpretacion={interpretacion}
    alertas={alertas}
  />

  {/* Guardar en BD */}
  <Button onClick={guardarEscala}>
    Guardar Escala
  </Button>
</EscalaClinicaForm>
```

---

## 🏗️ ESTRUCTURA FRONTEND ACTUALIZADA

```
src/
├── app/
│   ├── router.tsx              # Con lazy loading por módulo
│   ├── queryClient.ts
│   └── supabase.ts
│
├── modules/
│   ├── auth/
│   ├── pacientes/
│   │   └── components/
│   │       └── HistoriaClinicaAvanzada.tsx  (NUEVO)
│   ├── consulta-externa/
│   ├── urgencias/
│   ├── hospitalizacion/
│   ├── quirofanos/
│   ├── medico/
│   ├── enfermeria/
│   ├── farmacia/
│   ├── laboratorio/
│   ├── imagen/
│   ├── facturacion/
│   │   └── components/
│   │       └── CobrosConDeudas.tsx  (NUEVO)
│   ├── logistica/
│   ├── obstetricia/
│   ├── epidemiologia/  (NUEVO — DESACTIVADO EN ESTA FASE)
│   │   ├── components/
│   │   │   ├── DashboardEpidemiologia.tsx
│   │   │   ├── RastreoContactos.tsx
│   │   │   └── AlertasEpidemiologia.tsx
│   │   ├── hooks/
│   │   └── services/
│   ├── teleconsulta/  (NUEVO - Jitsi)
│   ├── plantillas/  (NUEVO)
│   │   ├── components/
│   │   │   ├── EditorPlantillas.tsx
│   │   │   └── GeneradorDocumentos.tsx
│   │   └── services/
│   ├── escalas-clinicas/  (NUEVO)
│   │   ├── components/
│   │   │   ├── GlasgowForm.tsx
│   │   │   ├── BarthelForm.tsx
│   │   │   └── EscalaGenericForm.tsx
│   │   └── services/
│   ├── bi/
│   └── configuracion/
│       ├── components/
│       │   └── GestionServiciosProductos.tsx  (MEJORADO)
│
├── shared/
│   ├── components/
│   │   ├── ui/                 # shadcn/ui
│   │   ├── layout/
│   │   │   ├── AppShell.tsx    # Con TabBar (NUEVO)
│   │   │   ├── TabBar.tsx      # Tabs abiertos (NUEVO)
│   │   │   ├── PatientBanner.tsx
│   │   │   └── Breadcrumb.tsx
│   │   ├── patient/
│   │   ├── forms/
│   │   ├── tables/
│   │   ├── charts/
│   │   ├── medical/
│   │   └── notifications/
│   │
│   ├── hooks/
│   │   ├── usePatient.ts
│   │   ├── useEpisode.ts
│   │   ├── useTabs.ts  (NUEVO)
│   │   ├── useRealtime.ts
│   │   └── usePermissions.ts
│   │
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── patientStore.ts
│   │   ├── tabsStore.ts  (NUEVO)
│   │   └── notificationStore.ts
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   ├── validators/
│   │   ├── formatters/
│   │   ├── escalas/  (NUEVO)
│   │   │   ├── glasgowCalculator.ts
│   │   │   ├── barthelCalculator.ts
│   │   │   └── ...
│   │   └── constants/
│   │
│   └── types/
│
└── assets/
```

---

## 🗺️ ROADMAP DE IMPLEMENTACIÓN

### FASE 1: Alineamiento Core (2-3 semanas)
- [ ] Revisar todas las migraciones de Supabase vs PROMPT_MAESTRO
- [ ] Crear tabla de sincronización multi-hospital
- [ ] Implementar TabBar para navegación multi-pestaña
- [ ] Expandir HCE a versión avanzada
- [ ] Mejorar gestión de servicios/productos/precios

### FASE 2: Módulos Especializados (3-4 semanas)
- [ ] Control Epidemiológico completo + Alertas + Rastreo
- [ ] Sistema de Plantillas de Documentos con editor WYSIWYG
- [ ] Implementar 40+ escalas clínicas
- [ ] Facturación mejorada con vista de deudas
- [ ] Mejorar módulo de Aseguradoras

### FASE 3: Integraciones (2-3 semanas)
- [ ] Sincronización multi-hospital (Realtime + Cron)
- [ ] Teleconsulta (Jitsi Meet SDK)
- [ ] PACS/DICOM integration
- [ ] LIS integration (laboratorio)

### FASE 4: Polish & QA (1-2 semanas)
- [ ] Testing completo
- [ ] Performance optimization
- [ ] Documentación
- [ ] Deploy a producción

---

## 📌 NOTAS IMPORTANTES

1. **Moneda:** Usar XAF (Franco CFA) en todos los cálculos financieros
2. **Idiomas:** Sistema en Español (español oficial de Guinea Ecuatorial)
3. **Timezone:** Africa/Malabo
4. **RLS:** Todas las tablas críticas con Row Level Security habilitado
5. **Auditoría:** Loguear todos los cambios en `auditoria.log_accesos`
6. **Firmas Digitales:** Para notas clínicas, informes, boletín quirúrgico, recetas
7. **Offline Support:** IndexedDB local para operaciones críticas sin conexión
8. **Performance:** Vistas materializadas PostgreSQL para BI/reportes

---

## 🎓 REFERENCIAS TÉCNICAS

- **React Router:** Code splitting con React.lazy
- **React Query:** Invalidación automática de caché
- **Supabase RLS:** Multi-tenant por hospital
- **Realtime:** Subscripciones en episodios activos
- **Edge Functions:** APIs personalizadas de sincronización
- **PostgreSQL:** Funciones plpgsql para lógica compleja

---

*Documento actualizado: 29-05-2026*
*Proyecto: HOSIX Red Hospitalaria Guinea Ecuatorial*
*Equipo: GEPROSTEC*
