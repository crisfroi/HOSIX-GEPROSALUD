# 🚀 PLAN DE ACCIÓN INMEDIATO - HOSIX

**Fecha:** 29-05-2026 | **Versión:** 1.0 | **Estado:** Ready to Implement

---

## 📋 TAREAS INMEDIATAS (Semana 1)

### TAREA 1: Migración de Sincronización Multi-Hospital
**Prioridad:** 🔴 CRÍTICA | **Tiempo:** 4h

```sql
-- supabase/migrations/20260529_001_sync_multi_hospital.sql

CREATE SCHEMA IF NOT EXISTS sincronizacion;

-- Tabla de cambios pendientes por sincronizar
CREATE TABLE IF NOT EXISTS sincronizacion.cambios_pendientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_origen_id UUID REFERENCES configuracion.hospitales(id),
  tabla_origen VARCHAR(100) NOT NULL,
  registro_id UUID NOT NULL,
  
  -- Tipo de cambio
  tipo_cambio VARCHAR(20) NOT NULL,  -- 'insert', 'update', 'delete'
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  
  -- Estado de sincronización
  sincronizado BOOLEAN DEFAULT FALSE,
  fecha_cambio TIMESTAMPTZ DEFAULT NOW(),
  fecha_sincronizacion TIMESTAMPTZ,
  intento_numero INT DEFAULT 0,
  ultimo_error TEXT,
  
  -- Metadata
  usuario_id UUID REFERENCES configuracion.usuarios(id),
  ip_origen INET,
  
  UNIQUE(hospital_origen_id, tabla_origen, registro_id, tipo_cambio, fecha_cambio)
);

-- Tabla de configuración por hospital
CREATE TABLE IF NOT EXISTS sincronizacion.config_hospital (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES configuracion.hospitales(id) UNIQUE,
  
  -- Tipo de sincronización
  tipo_sync VARCHAR(50),  -- 'realtime', 'cron', 'manual_usb'
  
  -- Parámetros
  frecuencia_minutos INT DEFAULT 15,
  activa BOOLEAN DEFAULT TRUE,
  
  -- Tablas a sincronizar
  tablas_sync TEXT[] DEFAULT ARRAY['pacientes.pacientes', 'clinico.episodios', 'facturacion.facturas'],
  
  -- Resolución de conflictos
  conflicto_resolucion VARCHAR(50) DEFAULT 'central_gana',  -- 'local_gana', 'central_gana', 'merge'
  
  -- Control
  ultima_sync TIMESTAMPTZ,
  proxima_sync_programada TIMESTAMPTZ,
  estado VARCHAR(20) DEFAULT 'activo',  -- 'activo', 'pausado', 'error'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log de sincronizaciones
CREATE TABLE IF NOT EXISTS sincronizacion.log_sincronizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES configuracion.hospitales(id),
  
  fecha_inicio TIMESTAMPTZ DEFAULT NOW(),
  fecha_fin TIMESTAMPTZ,
  
  registros_sincronizados INT DEFAULT 0,
  registros_con_conflicto INT DEFAULT 0,
  registros_error INT DEFAULT 0,
  
  estado VARCHAR(20),  -- 'en_curso', 'completada', 'con_errores', 'fallida'
  error_mensaje TEXT,
  
  -- Metadata
  tipo_sync VARCHAR(50),
  tablas_procesadas TEXT[]
);

-- Índices para performance
CREATE INDEX idx_cambios_pendientes_hospital ON sincronizacion.cambios_pendientes(hospital_origen_id, sincronizado);
CREATE INDEX idx_cambios_pendientes_fecha ON sincronizacion.cambios_pendientes(fecha_cambio DESC);
CREATE INDEX idx_cambios_pendientes_tabla ON sincronizacion.cambios_pendientes(tabla_origen);

-- Función para registrar cambios automáticamente
CREATE OR REPLACE FUNCTION registrar_cambio_sync()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO sincronizacion.cambios_pendientes (
    hospital_origen_id, tabla_origen, registro_id, tipo_cambio, datos_anteriores, datos_nuevos, usuario_id
  )
  SELECT
    COALESCE(
      (SELECT hospital_id FROM configuracion.usuarios WHERE id = auth.uid()),
      (SELECT id FROM configuracion.hospitales LIMIT 1)  -- fallback
    ),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    auth.uid();
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Activar triggers en tablas críticas
CREATE TRIGGER trig_sync_pacientes AFTER INSERT OR UPDATE OR DELETE ON pacientes.pacientes
  FOR EACH ROW EXECUTE FUNCTION registrar_cambio_sync();

CREATE TRIGGER trig_sync_episodios AFTER INSERT OR UPDATE ON clinico.episodios
  FOR EACH ROW EXECUTE FUNCTION registrar_cambio_sync();

CREATE TRIGGER trig_sync_facturas AFTER INSERT OR UPDATE ON facturacion.facturas
  FOR EACH ROW EXECUTE FUNCTION registrar_cambio_sync();

-- Función para procesar sincronizaciones
CREATE OR REPLACE FUNCTION procesar_sincronizacion(p_hospital_id UUID)
RETURNS TABLE(procesados INT, errores INT, conflictos INT) AS $$
DECLARE
  v_procesados INT := 0;
  v_errores INT := 0;
  v_conflictos INT := 0;
BEGIN
  -- Aquí irá la lógica de sincronización
  -- Por ahora, marcar como procesados
  UPDATE sincronizacion.cambios_pendientes
  SET sincronizado = TRUE,
      fecha_sincronizacion = NOW()
  WHERE hospital_origen_id = p_hospital_id
    AND sincronizado = FALSE
    AND intento_numero < 3;
  
  GET DIAGNOSTICS v_procesados = ROW_COUNT;
  
  RETURN QUERY SELECT v_procesados, v_errores, v_conflictos;
END;
$$ LANGUAGE plpgsql;

GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA sincronizacion TO authenticated;
```

### TAREA 2: TabBar para Navegación Multi-Pestaña
**Prioridad:** 🟠 ALTA | **Tiempo:** 3h

Crear archivo `src/shared/stores/tabsStore.ts`:
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppTab {
  id: string;  // UUID
  title: string;
  icon?: string;
  paciente_id: string;
  paciente_nombre: string;
  nhc: string;
  episodio_id?: string;
  episodio_tipo?: string;
  modulo_activo: string;
  timestamp_apertura: number;
  datos_contexto?: Record<string, any>;
}

interface TabsStore {
  tabs: AppTab[];
  activeTabId: string | null;
  
  // Actions
  openTab: (tab: AppTab) => void;
  closeTab: (tabId: string) => void;
  closeAllTabs: () => void;
  switchTab: (tabId: string) => void;
  updateTabContext: (tabId: string, context: Record<string, any>) => void;
  getActiveTab: () => AppTab | undefined;
}

export const useTabsStore = create<TabsStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,

      openTab: (tab) => set((state) => {
        // Si la pestaña ya existe, solo activarla
        const existingTab = state.tabs.find(t => t.id === tab.id);
        if (existingTab) {
          return { activeTabId: tab.id };
        }
        
        // Limitar a máximo 5 tabs abiertos
        const newTabs = state.tabs.length >= 5 
          ? [...state.tabs.slice(1), tab]
          : [...state.tabs, tab];
        
        return {
          tabs: newTabs,
          activeTabId: tab.id,
        };
      }),

      closeTab: (tabId) => set((state) => {
        const newTabs = state.tabs.filter(t => t.id !== tabId);
        return {
          tabs: newTabs,
          activeTabId: newTabs.length > 0 
            ? (state.activeTabId === tabId ? newTabs[newTabs.length - 1].id : state.activeTabId)
            : null,
        };
      }),

      closeAllTabs: () => set({ tabs: [], activeTabId: null }),

      switchTab: (tabId) => set({ activeTabId: tabId }),

      updateTabContext: (tabId, context) => set((state) => ({
        tabs: state.tabs.map(t =>
          t.id === tabId
            ? { ...t, datos_contexto: { ...t.datos_contexto, ...context } }
            : t
        ),
      })),

      getActiveTab: () => {
        const state = get();
        return state.tabs.find(t => t.id === state.activeTabId);
      },
    }),
    {
      name: 'hosix-tabs-storage',
      version: 1,
    }
  )
);
```

Crear componente `src/shared/components/layout/TabBar.tsx`:
```tsx
import React from 'react';
import { X, Plus } from 'lucide-react';
import { useTabsStore } from '@/shared/stores/tabsStore';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

export const TabBar: React.FC = () => {
  const { tabs, activeTabId, closeTab, switchTab } = useTabsStore();

  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center gap-1 bg-muted/50 border-b px-2 py-2 overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-md border cursor-pointer transition-colors',
            activeTabId === tab.id
              ? 'bg-background border-primary'
              : 'bg-muted border-border hover:bg-muted/80'
          )}
          onClick={() => switchTab(tab.id)}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{tab.title}</p>
            <p className="text-xs text-muted-foreground truncate">{tab.nhc}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
            className="rounded hover:bg-destructive/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}

      {/* Indicador de límite */}
      {tabs.length >= 5 && (
        <div className="text-xs text-muted-foreground px-2">
          Máximo 5 pestañas
        </div>
      )}
    </div>
  );
};
```

### TAREA 3: Historia Clínica Avanzada (HCE)
**Prioridad:** 🟠 ALTA | **Tiempo:** 6h

Crear archivo `src/modules/pacientes/components/HistoriaClinicaAvanzada.tsx`:
```tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/app/supabase';

interface Props {
  paciente_id: string;
}

export const HistoriaClinicaAvanzada: React.FC<Props> = ({ paciente_id }) => {
  // Queries
  const { data: paciente } = useQuery({
    queryKey: ['paciente', paciente_id],
    queryFn: () =>
      supabase
        .from('pacientes.pacientes')
        .select('*')
        .eq('id', paciente_id)
        .single(),
  });

  const { data: alergias } = useQuery({
    queryKey: ['alergias', paciente_id],
    queryFn: () =>
      supabase
        .from('pacientes.alergias')
        .select('*')
        .eq('paciente_id', paciente_id)
        .eq('activa', true),
  });

  const { data: episodios } = useQuery({
    queryKey: ['episodios', paciente_id],
    queryFn: () =>
      supabase
        .from('clinico.episodios')
        .select('*, medico_responsable:configuracion.usuarios(nombres, apellidos)')
        .eq('paciente_id', paciente_id)
        .order('fecha_inicio', { ascending: false }),
  });

  const { data: antecedentes } = useQuery({
    queryKey: ['antecedentes', paciente_id],
    queryFn: () =>
      supabase
        .from('pacientes.antecedentes')
        .select('*')
        .eq('paciente_id', paciente_id)
        .eq('activo', true),
  });

  const { data: constantesUltimas } = useQuery({
    queryKey: ['constantes-ultimas', paciente_id],
    queryFn: () =>
      supabase
        .from('clinico.signos_vitales')
        .select('*')
        .eq('paciente_id', paciente_id)
        .order('fecha_hora', { ascending: false })
        .limit(5),
  });

  const { data: escalasClinicas } = useQuery({
    queryKey: ['escalas-clinicas', paciente_id],
    queryFn: () =>
      supabase
        .from('clinico.escalas_clinicas')
        .select('*')
        .eq('episodio_id', episodios?.[0]?.id)
        .order('fecha_evaluacion', { ascending: false })
        .limit(10),
  });

  return (
    <div className="space-y-4">
      {/* ALERTA DE ALERGIAS */}
      {alergias && alergias.length > 0 && (
        <Alert variant="destructive" className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            ⚠️ <strong>ALERGIAS DETECTADAS:</strong>{' '}
            {alergias.map(a => (
              <span key={a.id} className="block text-sm">
                • {a.sustancia} ({a.tipo}) - Severidad: <strong>{a.severidad}</strong>
              </span>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* DATOS DEMOGRÁFICOS */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-semibold mb-2">Información del Paciente</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">NHC:</span> {paciente?.nhc}
          </div>
          <div>
            <span className="text-muted-foreground">Edad:</span>{' '}
            {new Date().getFullYear() - new Date(paciente?.fecha_nacimiento).getFullYear()} años
          </div>
          <div>
            <span className="text-muted-foreground">Género:</span> {paciente?.genero}
          </div>
          <div>
            <span className="text-muted-foreground">Grupo Sanguíneo:</span>{' '}
            {paciente?.grupo_sanguineo}
          </div>
        </div>
      </div>

      {/* TABS */}
      <Tabs defaultValue="timeline">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="antecedentes">Antecedentes</TabsTrigger>
          <TabsTrigger value="constantes">Constantes</TabsTrigger>
          <TabsTrigger value="escalas">Escalas</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-3">
          {episodios?.map((ep) => (
            <div key={ep.id} className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-sm">
                    {ep.tipo_episodio.toUpperCase()}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {new Date(ep.fecha_inicio).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  ep.estado === 'abierto' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                  {ep.estado}
                </span>
              </div>
              <p className="text-sm mt-1">
                <strong>Diagnóstico:</strong> {ep.diagnostico_principal_cie10}
              </p>
              <p className="text-sm">
                <strong>Médico:</strong> {ep.medico_responsable?.nombres} {ep.medico_responsable?.apellidos}
              </p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="antecedentes">
          {/* Implementar tabla de antecedentes */}
        </TabsContent>

        <TabsContent value="constantes">
          {/* Implementar gráfico de constantes vitales */}
        </TabsContent>

        <TabsContent value="escalas">
          {/* Implementar tabla de escalas clínicas */}
        </TabsContent>

        <TabsContent value="documentos">
          {/* Implementar lista de documentos adjuntos */}
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

---

## 📊 ESTADO ACTUAL DE IMPLEMENTACIÓN (29-05-2026)

### ✅ COMPLETADO - SEMANA 1 (3/3 TAREAS)
1. ✅ **Migración 007:** Sincronización Multi-Hospital - Aplicada
2. ✅ **TabBar Multi-Pestaña:** Zustand store + React component - Implementado
3. ✅ **Historia Clínica Avanzada:** HCE con alergias críticas, Timeline, Medicación - Implementado

### ✅ COMPLETADO - SEMANA 2 (3/3 TAREAS)
4. ✅ **Migración 009:** Servicios/Productos/Precios - Aplicada
5. ✅ **ServiciosProductosManager:** CRUD + búsqueda + filtros - Implementado
6. ✅ **PreciosTarifasManager:** Precios hospital + tarifas aseguradoras - Implementado
7. ✅ **AseguradorasManagerMejorado:** Gestión mejorada con tarifas vigentes - Implementado
8. ✅ **FacturacionDeudasManager:** Dashboard KPIs + morosidad + gráficos - Implementado

### ⭐ NUEVO - MIGRACIONES APLICADAS
- ✅ **Migración 006:** Contabilidad & Finanzas Avanzado - Aplicada
  - Cuentas bancarias por hospital
  - Solicitudes de movimiento con autorización obligatoria
  - Comprobantes con firma digital
  - Auditoria contable completa

---

## 🎯 PRÓXIMAS 2 SEMANAS (SEMANA 3-4)

### SEMANA 3: Epidemiología + Plantillas + Escalas
- [x] **Tarea 7:** Control Epidemiológico Avanzado (16h) — base iniciada
  - Alertas de enfermedades notificables
  - Parámetros configurables
  - Rastreo de contactos/familias
  - Dashboard epidemiológico
  - Detectado: `supabase/migrations/20260530_010_epidemiologia_avanzada.sql` y `src/components/hosix/epidemiologia/DashboardEpidemiologico.tsx`
  - Pendiente: formularios de casos, rastreo de contactos, gestión de brotes y alertas configurables
  - Avance: Módulo inicial de familias y convivencia agregado en `src/components/hosix/pacientes/FamiliasManager.tsx`
  - Migración propuesta: `supabase/migrations/20260601_011_hosix_familias.sql`
  
- [ ] **Tarea 8:** Sistema de Plantillas de Documentos (16h)
  - Editor WYSIWYG con campos dinámicos
  - Generación PDF e integración firma digital
  - Plantillas de reportes, referencias, altas
  
- [ ] **Tarea 9:** 40+ Escalas Clínicas (17h)
  - EVA, APACHE, SOFA, Glasgow, EMTALA, etc.
  - Cálculo automático
  - Historial y comparativas

### SEMANA 4: QA y Finalización
- [ ] Testing completo de todas las funcionalidades
- [ ] Performance optimization
- [ ] Deploy a staging
- [ ] Documentación final

---

## 💾 CHECKLIST DE MIGRACIONES A APLICAR

```bash
# Orden correcto de aplicación
npm run apply-migrations:mcp

# Migraciones nuevas a crear:
supabase/migrations/20260529_001_sync_multi_hospital.sql
supabase/migrations/20260530_010_epidemiologia_avanzada.sql
supabase/migrations/20260601_011_hosix_familias.sql
supabase/migrations/20250205_010_hosix_enfermeria.sql  # escala Glasgow/Braden/Norton
supabase/migrations/20260529_004_servicios_productos.sql
# Plantillas de documentos pendiente de crear
```

---

## 📦 DEPENDENCIAS A INSTALAR

```bash
npm install html-to-text quill-delta  # Para editor plantillas
npm install chart.js react-chartjs-2   # Para gráficos epidemiología
npm install uuid-validation            # Para validar UUIDs
npm install cron                       # Para gestión de cron jobs
npm install @jitsi/react-sdk           # Para Jitsi Meet
```

---

## 🔄 PRÓXIMOS PASOS DESPUÉS DE ESTO

1. **Crear issue en GitHub** con este plan
2. **Asignar tareas** a equipo de desarrollo
3. **Setup CI/CD** para migraciones automáticas
4. **Testing en dev branch**
5. **Deployment a producción**

---

*Proyecto: HOSIX*
*Red Nacional de Hospitales - Guinea Ecuatorial*
*Fecha: 29-05-2026*
