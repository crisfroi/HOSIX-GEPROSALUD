# HOSIX · GEPROSALUD
# Plan Maestro de Implementación v2.0 — Actualizado 02 de Junio de 2026

> **Red Nacional de Hospitales de Guinea Ecuatorial**
> Documento generado tras análisis exhaustivo del repositorio `crisfroi/HOSIX-GEPROSALUD`
> Incorpora las nuevas directrices tecnológicas y clínicas del equipo

---

## Índice

1. [Diagnóstico Real del Repositorio](#1-diagnóstico-real-del-repositorio)
2. [Inventario Exhaustivo de Código Existente](#2-inventario-exhaustivo-de-código-existente)
3. [Estado Real por Módulo](#3-estado-real-por-módulo)
4. [Brechas Críticas Identificadas](#4-brechas-críticas-identificadas)
5. [Nueva Arquitectura Tecnológica](#5-nueva-arquitectura-tecnológica)
6. [Plan Maestro de Implementación por Fases](#6-plan-maestro-de-implementación-por-fases)
7. [CIE-11 y Sistema de Diagnóstico Avanzado](#7-cie-11-y-sistema-de-diagnóstico-avanzado)
8. [Sistema de Prescripción Médica Avanzada (OMS)](#8-sistema-de-prescripción-médica-avanzada-oms)
9. [OptaPlanner — Gestión Inteligente de Recursos](#9-optaplanner--gestión-inteligente-de-recursos)
10. [MEDITRON — IA Clínica Local](#10-meditron--ia-clínica-local)
11. [Arquitectura Multi-Hospital y Base de Datos Nacional](#11-arquitectura-multi-hospital-y-base-de-datos-nacional)
12. [Roles y Permisos del Sistema](#12-roles-y-permisos-del-sistema)
13. [Dashboard Epidemiológico Avanzado + DHIS2](#13-dashboard-epidemiológico-avanzado--dhis2)
14. [Sistema de Buzón de Notificaciones y Alertas](#14-sistema-de-buzón-de-notificaciones-y-alertas)
15. [Stack Tecnológico Completo](#15-stack-tecnológico-completo)
16. [Orden de Implementación Recomendado](#16-orden-de-implementación-recomendado)
17. [Resumen Ejecutivo](#17-resumen-ejecutivo)

---

## 1. Diagnóstico Real del Repositorio

> **CORRECCIÓN IMPORTANTE:** El análisis anterior subestimó severamente el estado del repositorio.
> Tras clonar y analizar el código fuente real, el sistema está entre el **55–65% implementado**, no al 5%.

### 1.1 Cifras reales del repositorio (02-06-2026)

| Métrica | Valor real |
|---|---|
| Componentes React en `src/components/hosix/` | **86 componentes** |
| Páginas en `src/pages/Hosix/` | **26 páginas** |
| Custom hooks en `src/hooks/` | **26 hooks** |
| Migraciones SQL en `supabase/migrations/` | **53 migraciones** |
| Tipos TypeScript generados (`types.ts`) | **8.514 líneas** |
| Módulos avanzados en `src/modules/` | **6 componentes** |
| Componentes compartidos en `src/shared/` | **4 archivos** |
| Documentación técnica en `docs/` | **11 documentos** |

### 1.2 Lo que realmente existe y funciona

**Shell del sistema:**
- `HosixLayout.tsx` — Layout base con sidebar colapsable
- `HosixHeader.tsx` — Header con búsqueda global, notificaciones y usuario
- `HosixSidebar.tsx` — Sidebar completo con los 24 módulos en el menú
- `GlobalSearch.tsx` — Componente de búsqueda global implementado

**Autenticación y estado:**
- `useHosixAuth.ts` — Hook de autenticación con restauración de sesión, login/logout funcionales
- `tabsStore.ts` (Zustand + persist) — Sistema de pestañas múltiples implementado
- `TabBar.tsx` — Componente de navegación multi-pestaña (hasta 5 pestañas)
- `useHosixPermisos.ts` — Hook de permisos granulares por rol

**Módulos clínicos con código real:**

| Módulo | Archivos | Estado real |
|---|---|---|
| Urgencias | `TriageForm.tsx`, `TriageManchester.tsx`, `UrgenciasWorklist.tsx`, `AtencionForm.tsx` + `useHosixUrgencias.ts` | **~70% funcional** |
| Pacientes | `PacientesList.tsx`, `PacienteForm.tsx`, `PacientesForm.tsx`, `HistoriaClinicaView.tsx`, `AvisosManager.tsx`, `DocumentosManager.tsx`, `FamiliasManager.tsx` + hook | **~65% funcional** |
| Historia Clínica | `HistoriaClinicaAvanzada.tsx`, `AlergiasBanner.tsx`, `TimelineEpisodios.tsx`, `EscalasClinicas.tsx`, `FormularioEscala.tsx` | **~60% funcional** |
| Enfermería | `Kardex.tsx`, `ConstantesVitales.tsx`, `WorklistEnfermeria.tsx`, `PlanesCuidado.tsx` + hook | **~65% funcional** |
| Hospitalización | `IngresoPacienteForm.tsx`, `AltaForm.tsx`, `TrasladosManager.tsx` + hook | **~55% funcional** |
| Prescripción (CPOE) | `CPOEPrescripcionForm.tsx` con motor CDS, `PrescripcionesListado.tsx`, `HistoricoPrescripciones.tsx` + hook | **~60% funcional** |
| Farmacia | `DispensacionesManager.tsx` + `useHosixFarmacia.ts` | **~40% funcional** |
| Médicos | `WorklistMedicos.tsx`, `ConsultaMedicaForm.tsx`, `DiarioClinicoMedico.tsx`, `HistorialMedico.tsx`, `ListaEsperaMedicos.tsx` + hook | **~55% funcional** |
| Quirófanos | `SalasQuirofanosManager.tsx`, `ProgramacionesManager.tsx`, `BloquesList.tsx`, `DiarioQuirurgicoManager.tsx` + hook | **~45% funcional** |
| Obstetricia | `GestacionesManager.tsx`, `PartogramaManager.tsx` (base) + hook | **~35% funcional** |
| Epidemiología | `DashboardEpidemiologico.tsx`, `CasosList.tsx`, `BrotesList.tsx`, `NotificarCasoForm.tsx` + hook | **~40% funcional** |
| Escalas Clínicas | 30 escalas en BD + `EscalasClinicas.tsx` + `FormularioEscala.tsx` | **~70% funcional** |
| Facturación | `FacturasList.tsx`, `FacturasGenerator.tsx`, `TarifasManager.tsx`, `CuentasManager.tsx`, `FacturacionDeudasManager.tsx`, `AseguradorasManagerMejorado.tsx` + hook | **~60% funcional** |
| Cajas | `CajasManager.tsx`, `TurnosCajaManager.tsx`, `ArqueosManager.tsx`, `CierresCajaManager.tsx`, `MovimientosCajaForm.tsx` + hook | **~55% funcional** |
| Almacenes | `AlmacenesManager.tsx`, `InventarioManager.tsx`, `StockManager.tsx`, `MovimientosManager.tsx`, `DepositosManager.tsx` + hook | **~50% funcional** |
| Compras | `LicitacionesManager.tsx`, `OfertasManager.tsx`, `AdjudicacionesManager.tsx`, `PresupuestosManager.tsx` + hook | **~45% funcional** |
| Suministros | 5 managers + hook | **~50% funcional** |
| Recobros | `RecobrosManager.tsx`, `MorosidadAnalytics.tsx`, `NotasCargoCredito.tsx` + hook | **~50% funcional** |
| Laboratorio | `SolicitudesManager.tsx` + hook | **~30% funcional** |
| Imagenología | `SolicitudesManager.tsx` + hook | **~25% funcional** |
| Interconsultas | `SolicitudesManager.tsx` + hook | **~35% funcional** |
| Citas | `AgendasList.tsx`, `CitasForm.tsx`, `CitasList.tsx`, `ListaEsperaManager.tsx` + hook | **~55% funcional** |
| Admisión Central | `AdmisionCentralForm.tsx`, `AdmisionesListado.tsx`, `AdmisionesEstadisticas.tsx` + hook | **~50% funcional** |
| Configuración / MPI | `MPI.tsx`, `PermisosManager.tsx` + `useHosixMPI.ts` | **~40% funcional** |

**Infraestructura avanzada:**
- `digitalSignature.ts` — Firma digital ECDSA P-256 con Web Crypto API implementada
- `fhirMapper.ts` + `fhir.ts` — Mapeo FHIR R4 para Patient, Observation, Encounter, AllergyIntolerance
- `types.ts` — 8.514 líneas de tipos TypeScript generados desde Supabase
- 53 migraciones SQL incluyendo: sincronización multi-hospital, escalas clínicas, epidemiología DHIS2, obstetricia/partograma, firma digital, contabilidad avanzada, horarios/turnos, expedientes disciplinarios, RFID profesionales, módulos de asistencia

### 1.3 Lo que falta crítico

**Router `App.tsx` — BRECHA MAYOR:**
El App.tsx solo tiene **3 rutas registradas** (login, dashboard, pacientes, epidemiología) de las **24 páginas** que existen. Las otras 22 páginas están creadas pero **no son accesibles** por falta de rutas en el router. Este es el bloqueante principal del sistema hoy.

**Sin implementar todavía:**
- Rutas completas con lazy loading y ProtectedRoute por rol
- Mapa visual de camas SVG en tiempo real (trigger Realtime)
- CIE-11 (actualmente usa CIE-10)
- Sistema de prescripción CPOE con estándares OMS completos
- OptaPlanner / motor de optimización de recursos
- MEDITRON (IA clínica local)
- Dashboard BI con todas las métricas
- Portal de paciente
- Notificaciones push Web Push API
- Teleconsulta Jitsi Meet
- Modo visual avanzado con Tremor + React Medical UI

---

## 2. Inventario Exhaustivo de Código Existente

### 2.1 Árbol de componentes real

```
src/
├── App.tsx                                    ⚠️ SOLO 3 RUTAS — BLOQUEANTE
├── main.tsx
├── index.css
├── app/
│   └── supabase.ts
├── integrations/supabase/
│   ├── hosixClient.ts                         ✅ Cliente Supabase dedicado
│   └── types.ts                               ✅ 8.514 líneas de tipos generados
├── lib/
│   ├── digitalSignature.ts                    ✅ ECDSA P-256 Web Crypto API
│   └── utils.ts
├── shared/
│   ├── types/fhir.ts                          ✅ FHIR R4: Patient, Observation, Encounter
│   ├── lib/fhirMapper.ts                      ✅ Mapper pacientes → FHIR
│   ├── stores/tabsStore.ts                    ✅ Zustand + persist, 5 pestañas
│   └── components/layout/TabBar.tsx           ✅ Tab bar multi-paciente
├── modules/
│   ├── pacientes/components/
│   │   ├── HistoriaClinicaAvanzada.tsx        ✅ HCE timeline, 5 tabs
│   │   ├── AlergiasBanner.tsx                 ✅ Banner crítico de alergias
│   │   ├── EscalasClinicas.tsx                ✅ 30 escalas, filtros por categoría
│   │   ├── FormularioEscala.tsx               ✅ Cálculo automático de puntuaciones
│   │   └── TimelineEpisodios.tsx              ✅ Timeline cronológico
│   └── obstetricia/components/
│       └── PartogramaManager.tsx              🟡 Base implementada (35%)
├── hooks/
│   ├── useHosixAuth.ts                        ✅ Login/logout, restauración sesión
│   ├── useHosixPacientes.ts                   ✅ CRUD, filtros, paginación
│   ├── useHosixUrgencias.ts                   ✅ Triage, episodios, worklist
│   ├── useHosixEnfermeria.ts                  ✅ Kardex, constantes vitales
│   ├── useHosixHospitalizacion.ts             ✅ Ingresos, altas, traslados
│   ├── useHosixMedicos.ts                     ✅ Worklist médico, evolución
│   ├── useHosixFarmacia.ts                    ✅ Dispensaciones, stock
│   ├── useHosixFacturacion.ts                 ✅ Facturas, cuentas, cobros
│   ├── useHosixCajas.ts                       ✅ Turnos, arqueos, cierres
│   ├── useHosixEpidemiologia.ts               ✅ Casos, brotes, notificaciones
│   ├── useHosixCitas.ts                       ✅ Agendas, citas, lista espera
│   ├── useHosixQuirofanos.ts                  ✅ Salas, programaciones
│   ├── useHosixLaboratorio.ts                 🟡 Solicitudes básicas
│   ├── useHosixImagenologia.ts                🟡 Solicitudes básicas
│   ├── useHosixInterconsultas.ts              🟡 Solicitudes básicas
│   ├── useHosixObstetricia.ts                 🟡 Gestaciones básicas
│   ├── useHosixAlmacenes.ts                   ✅ Stock, movimientos
│   ├── useHosixSuministros.ts                 ✅ Artículos, familias
│   ├── useHosixCompras.ts                     ✅ Licitaciones, adjudicaciones
│   ├── useHosixRecobros.ts                    ✅ Recobros, morosidad
│   ├── useHosixMPI.ts                         🟡 MPI básico
│   ├── useHosixAuditoria.ts                   ✅ Log de accesos
│   ├── useHosixPermisos.ts                    ✅ Permisos por rol
│   ├── useHosixUsers.ts                       ✅ CRUD usuarios
│   ├── useHosixCRED.ts                        🟡 CRED básico
│   └── useHorariosBase.ts                     ✅ Horarios y turnos
├── pages/Hosix/
│   ├── HosixLogin.tsx                         ✅ Login funcional
│   ├── HosixDashboard.tsx                     🟡 Dashboard básico
│   ├── Pacientes.tsx                          ✅ Página implementada
│   ├── Urgencias.tsx                          ✅ Página implementada
│   ├── Hospitalizacion.tsx                    🟡 Página parcial
│   ├── Medicos.tsx                            🟡 Página parcial
│   ├── Enfermeria.tsx                         🟡 Página parcial
│   ├── Prescripcion.tsx                       🟡 CPOE parcial
│   ├── Farmacia.tsx                           🟡 Página parcial
│   ├── Quirofanos.tsx                         🟡 Página parcial
│   ├── Obstetricia.tsx                        🟡 Página parcial
│   ├── CRED.tsx                               🟡 Página parcial
│   ├── Laboratorio.tsx                        🟡 Básico
│   ├── Imagenologia.tsx                       🟡 Básico
│   ├── Interconsultas.tsx                     🟡 Básico
│   ├── Epidemiologia.tsx                      🟡 Dashboard básico
│   ├── Citas.tsx                              🟡 Parcial
│   ├── AdmisionCentral.tsx                    🟡 Parcial
│   ├── Facturacion.tsx                        🟡 Parcial
│   ├── Cajas.tsx                              🟡 Parcial
│   ├── Recobros.tsx                           🟡 Parcial
│   ├── Almacenes.tsx                          🟡 Parcial
│   ├── Suministros.tsx                        🟡 Parcial
│   ├── Compras.tsx                            🟡 Parcial
│   ├── BI.tsx                                 🔴 Pendiente
│   └── Configuracion.tsx                      🟡 Parcial
└── components/
    ├── hosix/                                 86 componentes
    └── ui/                                    shadcn/ui + componentes custom
```

### 2.2 Migraciones SQL aplicadas

```
001 — Esquema base HOSIX (hospitales, users, perfiles, configuración)
002 — Pacientes e Historia Clínica (MPI, episodios, antecedentes, alergias)
003 — Urgencias, Citas, Agendas
004 — Hospitalización, Quirófanos, Farmacia
005 — Facturación, Reportes
006 — Cajas completo (turnos, arqueos, cierres)
007 — Recobros y morosidad
008 — Suministros (artículos, familias, grupos)
009 — Almacenes (stocks, movimientos, depósitos)
010 — CPOE Prescripciones (motor CDS, interacciones)
011 — Servicios y tipos de ingreso
012 — Enfermería avanzada (Kardex, planes de cuidado)
013 — Médicos ASIS 1.0 (worklist, evolución, diagnósticos)
014 — Interacciones medicamentosas (drug_interactions)
015 — Médicos ASIS asistente 1
016 — Quirófanos ASIS 3.0
017 — Interconsultas ASIS 11.0
018 — Biometric sync logs
019 — Dynamic forms (formularios dinámicos)
... migraciones de sistema de asistencia, turnos/cuadrantes biométricos
... expedientes disciplinarios, RFID profesionales
020 — Contabilidad y finanzas avanzado
021 — Sincronización multi-hospital (cambios_pendientes, config, log)
022 — Servicios/productos con precios
023 — Epidemiología avanzada (grupos OMS A-D, alertas, zonas riesgo)
024 — Escalas clínicas completas (30 escalas, catálogo, vistas)
025 — Familias de pacientes
026 — Obstetricia y partograma (gestaciones, partos, neonatos, CRED)
027 — Epidemiología DHIS2 rastreo avanzado (14 nuevas tablas)
028 — Plantillas de documentos y firma digital
```

---

## 3. Estado Real por Módulo

| Módulo | Componentes | Hook | Migración SQL | Estado | % |
|---|---|---|---|---|---|
| **Autenticación** | HosixLogin | useHosixAuth | 001 | ✅ Funcional | 85% |
| **Shell / Layout** | HosixLayout, Header, Sidebar, GlobalSearch | — | — | ✅ Funcional | 80% |
| **Tab System** | TabBar | tabsStore (Zustand) | — | ✅ Funcional | 90% |
| **Pacientes / HC** | 7 componentes + 5 módulos avanzados | useHosixPacientes | 002 | 🟡 Parcial | 65% |
| **Urgencias / Triage** | 4 componentes (Manchester ✅) | useHosixUrgencias | 003 | 🟡 Parcial | 70% |
| **Historia Clínica** | HistoriaClinicaAvanzada, Timeline, Alergias | — | 002 | 🟡 Parcial | 60% |
| **Escalas Clínicas** | EscalasClinicas, FormularioEscala | — | 013 (escalas) | 🟡 Parcial | 70% |
| **Hospitalización** | 3 componentes | useHosixHospitalizacion | 004 | 🟡 Parcial | 55% |
| **Médicos** | 5 componentes | useHosixMedicos | 011, 012 | 🟡 Parcial | 55% |
| **Enfermería** | Kardex, Constantes, Worklist, Planes | useHosixEnfermeria | 010 | 🟡 Parcial | 65% |
| **Prescripción CPOE** | CPOEForm (CDS engine), Listado, Histórico | hook | 009 | 🟡 Parcial | 60% |
| **Farmacia** | DispensacionesManager | useHosixFarmacia | 004 | 🔴 Básico | 40% |
| **Laboratorio** | SolicitudesManager | useHosixLaboratorio | 004 | 🔴 Básico | 30% |
| **Imagenología** | SolicitudesManager | useHosixImagenologia | 004 | 🔴 Básico | 25% |
| **Interconsultas** | SolicitudesManager | useHosixInterconsultas | 014 | 🔴 Básico | 35% |
| **Quirófanos** | 4 componentes | useHosixQuirofanos | 013 | 🟡 Parcial | 45% |
| **Obstetricia** | GestacionesManager, PartogramaManager | useHosixObstetricia | 015 (obst) | 🔴 Básico | 35% |
| **CRED** | — | useHosixCRED | 015 | 🔴 Básico | 25% |
| **Citas** | 4 componentes | useHosixCitas | 003 | 🟡 Parcial | 55% |
| **Admisión Central** | 3 componentes | — | 001 | 🟡 Parcial | 50% |
| **Epidemiología** | 4 componentes | useHosixEpidemiologia | 010, 012 (dhis2) | 🟡 Parcial | 40% |
| **Facturación** | 6 componentes | useHosixFacturacion | 005 | 🟡 Parcial | 60% |
| **Cajas** | 5 componentes | useHosixCajas | 006 | 🟡 Parcial | 55% |
| **Recobros** | 3 componentes | useHosixRecobros | 007 | 🟡 Parcial | 50% |
| **Almacenes** | 5 componentes | useHosixAlmacenes | 008 | 🟡 Parcial | 50% |
| **Suministros** | 5 componentes | useHosixSuministros | 008 | 🟡 Parcial | 50% |
| **Compras** | 4 componentes | useHosixCompras | — | 🟡 Parcial | 45% |
| **Dashboard BI** | BI.tsx (vacío) | — | — | 🔴 Pendiente | 5% |
| **Firma Digital** | PlantillasManager + Edge Function | — | 010 (firma) | ✅ Funcional | 80% |
| **FHIR R4** | fhirMapper.ts, fhir.ts | — | — | 🟡 Básico | 40% |
| **Sincronización** | — | — | 007 (sync) | 🔴 Backend listo, sin UI | 20% |
| **Configuración** | MPI, PermisosManager | useHosixMPI, useHosixPermisos | — | 🟡 Parcial | 40% |
| **RRHH / Turnos** | — | useHorariosBase | turnos, asistencia | 🟡 Backend listo, sin UI | 25% |

---

## 4. Brechas Críticas Identificadas

### 4.1 BLOQUEANTE INMEDIATO — App.tsx sin rutas

El problema más urgente del sistema hoy: el `App.tsx` solo tiene **3 de las 24 rutas** registradas. Existen 22 páginas completas en `src/pages/Hosix/` que no son accesibles. Esta es una corrección de 30 minutos que desbloquea el 70% del sistema existente.

```tsx
// Lo que hay ahora (INCOMPLETO):
<Route path="pacientes" element={<Pacientes />} />
<Route path="epidemiologia" element={<Epidemiologia />} />

// Lo que debe haber (todas las rutas con lazy loading):
const Urgencias = lazy(() => import('@/pages/Hosix/Urgencias'))
const Hospitalizacion = lazy(() => import('@/pages/Hosix/Hospitalizacion'))
// ... 22 rutas más con ProtectedRoute por rol
```

### 4.2 Sin ProtectedRoute por rol

Ninguna ruta verifica el perfil del usuario antes de renderizar. Un usuario de caja puede acceder a quirófanos. Necesita implementarse un `<ProtectedRoute roles={['MEDICO', 'ENFERMERIA']} />`.

### 4.3 Mapa de camas sin implementar

La hospitalización tiene formularios de ingreso y alta, pero no tiene el mapa visual SVG de camas con actualización en tiempo real (Supabase Realtime). Es el componente más crítico para el flujo hospitalario diario.

### 4.4 CIE-10 sin migrar a CIE-11

Actualmente se usa CIE-10 en diagnósticos. La migración a CIE-11 requiere: nuevo seed de datos (85.000+ códigos), actualización del selector de diagnóstico, campo de compatibilidad hacia atrás.

### 4.5 CPOE sin estándares OMS completos

El `CPOEPrescripcionForm.tsx` tiene un motor CDS (Clinical Decision Support) básico, pero le faltan: dosis pediátricas por peso/talla, ajuste renal/hepático, listas esenciales OMS, código ATC completo, y la integración con MEDITRON para sugerencias IA.

### 4.6 Sin OptaPlanner para gestión de recursos

No hay motor de optimización para: asignación de camas, programación de quirófanos, horarios de personal, gestión de vacaciones/permisos, redistribución de RRHH. Se propone integrar OptaPlanner vía microservicio REST.

### 4.7 Dashboard BI vacío

El archivo `BI.tsx` existe pero no tiene implementación. Todos los KPIs, gráficas y reportes están pendientes.

### 4.8 Sin modo visual avanzado (Tremor + React Medical UI)

La interfaz actual usa shadcn/ui básico. Se propone añadir Tremor (gráficas avanzadas) y react-medical-ui / @medicus/components para visualizaciones clínicas especializadas.

### 4.9 MEDITRON no instalado

El modelo de IA clínica MEDITRON (basado en LLaMA, especializado en medicina) no está configurado. Se propone instalación local en servidor hospitalario o vía API para diagnósticos diferenciales, interpretación de resultados de laboratorio y sugerencias de prescripción.

### 4.10 Base de datos nacional (nodo central) no implementada

La migración `20260529_007_sincronizacion_multi_hospital.sql` existe pero no hay UI ni servicio de sincronización. La arquitectura multi-hospital requiere: nodo central nacional + nodos locales por hospital + protocolo de sincronización.

---

## 5. Nueva Arquitectura Tecnológica

### 5.1 Stack frontend actualizado

```
Framework base:
  React 18.3 + Vite 5.4 + TypeScript 5.5      ✅ Instalado
  
UI Components:
  shadcn/ui + Radix UI                          ✅ Instalado
  Tremor (gráficas BI y dashboards)             🆕 Por instalar
  @medicus/react-components (UI médica)         🆕 Por instalar
  
State management:
  Zustand 5.0 (tabsStore ✅, falta authStore)   🟡 Parcial
  React Query 5.56 (sin queryClient global)     🟡 Parcial
  
Routing:
  React Router 6.26 (sin rutas completas)       🟡 Parcial
  
Charts & Visualization:
  Recharts 3.1                                  ✅ Instalado
  D3 7.9 + d3-geo                               ✅ Instalado
  Tremor Charts                                 🆕 Por instalar
  
Maps:
  Leaflet + react-leaflet                       ✅ Instalado
  react-simple-maps                             ✅ Instalado
  
Clinical tools:
  MEDITRON (LLM médico local)                   🆕 Por configurar
  CIE-11 API (iCIEd OMS)                       🆕 Por integrar
  
Optimization:
  OptaPlanner REST API (microservicio Java)     🆕 Por implementar
  
Interoperability:
  FHIR R4 (fhirMapper.ts existente)            🟡 Básico → expandir
  HL7 v2.x (por implementar)                   🆕 Futuro
  
Other:
  date-fns 3.6                                  ✅ Instalado
  jsPDF + html2canvas                           ✅ Instalado
  xlsx                                          ✅ Instalado
  JsBarcode                                     ✅ Instalado
  React DnD                                     ✅ Instalado
  Tauri 2 (desktop)                             ✅ Instalado
  react-force-graph (grafo contactos epi)       🆕 Por instalar
  @rjsf/core (formularios dinámicos)            🆕 Por instalar
  Vitest (testing)                              🆕 Por instalar
```

### 5.2 Backend y base de datos

```
Supabase (PostgreSQL 15):
  hosixClient.ts                                ✅ Configurado
  53 migraciones SQL                            ✅ Aplicadas en su mayoría
  types.ts (8.514 líneas)                       ✅ Generados
  RLS policies                                  🟡 Parcialmente configuradas
  Supabase Realtime                             🔴 Sin habilitar en tablas críticas
  Supabase Edge Functions                       🟡 sign-document ✅
  Supabase Storage (bucket "documents")         🟡 Configurado parcialmente
  pg_cron (jobs automáticos)                    🔴 Por habilitar
  PostGIS (análisis geoespacial epidemiología)  🔴 Por habilitar

Arquitectura multi-nodo:
  Nodo local por hospital (Supabase self-hosted / PostgreSQL)   🆕 Por configurar
  Nodo central nacional (Supabase cloud)                        🟡 Migración lista
  Protocolo sincronización (Edge Functions + cron)              🔴 Sin implementar
  
Microservicio OptaPlanner (Java/Quarkus):       🆕 Por implementar
Microservicio MEDITRON (Python/FastAPI):        🆕 Por implementar
```

---

## 6. Plan Maestro de Implementación por Fases

### FASE 0 — Correcciones inmediatas (1 semana) 🔴 URGENTE

**Objetivo:** Desbloquear el 70% del sistema que ya existe pero no es accesible.

- [ ] **0.1** Completar `App.tsx` con las 24 rutas en lazy loading + `<ProtectedRoute>`
- [ ] **0.2** Crear `authStore.ts` en Zustand (actualmente el auth usa estado local en el hook)
- [ ] **0.3** Configurar `queryClient` global de React Query con retry y staleTime
- [ ] **0.4** Habilitar Supabase Realtime en tablas críticas: `camas`, `urgencias_episodios`, `alertas`, `constantes_vitales`
- [ ] **0.5** Verificar y completar las RLS policies en todas las tablas
- [ ] **0.6** Configurar `REPLICA IDENTITY FULL` en tablas con Realtime
- [ ] **0.7** Instalar Vitest y configurar primeros tests para lógica de triage y escalas
- [ ] **0.8** Configurar GitHub Actions (lint + test en cada PR)

### FASE 1 — Completar Core Clínico (Mes 1-2) 🟡

**Módulos a completar/corregir:**

**1.1 Mapa visual de camas (prioridad máxima)**
- Componente SVG dinámico por servicio/planta
- Colores: verde (libre) / rojo (ocupada) / amarillo (reservada) / gris (mantenimiento)
- Subscripción Supabase Realtime para actualización automática
- Trigger PostgreSQL `fn_actualizar_estado_cama`
- Filtros por servicio, planta, tipo de cama

**1.2 Urgencias — completar flujo**
- Integrar `TriageManchester.tsx` (ya implementado) en el flujo principal
- Realtime board con prioridades 1-5 colores
- Alertas automáticas si nivel 1-2 espera > 5 minutos sin médico
- Timer visible por paciente
- Integración directa con apertura de HCE

**1.3 Historia Clínica — finalizar**
- Conectar `HistoriaClinicaAvanzada.tsx` a todas las páginas que la necesitan
- Activar `AlergiasBanner.tsx` en todas las páginas clínicas
- Completar `TimelineEpisodios.tsx` con todos los tipos de episodio
- Integrar las 30 escalas con el sistema de `FormularioEscala.tsx`

**1.4 Prescripción CPOE — estándares OMS**
- Ver Sección 8 para detalle completo

**1.5 Diagnósticos CIE-11**
- Ver Sección 7 para detalle completo

**1.6 Dashboard principal**
- KPIs en tiempo real: camas libres/ocupadas, pacientes en urgencias por nivel, quirófanos activos
- Resumen diario: ingresos, altas, nuevas urgencias, recetas generadas
- Alertas activas del sistema

### FASE 2 — Módulos Clínicos Avanzados (Mes 3-4) 🟡

**2.1 Worklist Médico completo**
- Vista consolidada de todos los pacientes del médico (hospitalizados + urgencias + consultas)
- Badges de estado: pendiente evolución, pendiente prescripción, pendiente interconsulta
- Alertas de alergias y valores críticos de lab
- Acceso directo a HCE por paciente
- Notificaciones realtime de cambios en sus pacientes

**2.2 Worklist Enfermería completo**
- Kardex expandido con administración de medicamentos (confirmación de dosis)
- Alertas de constantes vitales fuera de rango (con valores de referencia por edad/condición)
- Planes de cuidado NANDA/NIC/NOC
- Acceso directo a signos vitales por paciente

**2.3 Laboratorio avanzado**
- Formulario de solicitud con campos clínicos completos
- Integración LIS (HL7 v2.5 / FHIR R4)
- Recepción automática de resultados
- Alertas de valores críticos con notificación push al médico
- Visualización de tendencias (gráficas Recharts por analito)
- Panel de resultados pendientes por turno

**2.4 Imagenología avanzada**
- Solicitudes estructuradas por modalidad (Rx, TAC, RMN, Eco, etc.)
- Integración básica RIS/PACS
- Visor DICOM embebido (OHIF viewer o Cornerstone.js — licencia open source)
- Informes radiológicos con firma digital

**2.5 Obstetricia completa**
- Partograma OMS digital animado (líneas de alerta y acción)
- Registro horario de dilatación, FCF, contracciones, líquido amniótico
- Curvas de crecimiento OMS con Z-scores
- Control prenatal integrado
- Registro de recién nacidos + Apgar automático
- Seguimiento postparto

**2.6 CRED completo**
- Curvas de crecimiento OMS (0-5 años) con ploteo automático
- Calendario vacunal Guinea Ecuatorial
- Evaluación del desarrollo psicomotor
- Detección temprana de desnutrición (indicadores WHZ, HAZ, WAZ)

**2.7 Escalas clínicas — completar hasta 40+**
- Añadir: Waterlow, MUST, PHQ-9, GAD-7, AUDIT, CAGE, Edinburgh (postparto), SNAPPE-II (neonatología), PRISM III (pediatría intensiva), APACHE II, Rankin Modificado, Hunt-Hess
- Cálculo automático con interpretación clínica
- Exportación a PDF del resumen de escalas

### FASE 3 — OptaPlanner y Gestión Inteligente de Recursos (Mes 5-6) 🆕

Ver Sección 9 para arquitectura detallada.

**3.1 Módulo de Programación de Quirófanos (OptaPlanner)**
- Scheduler inteligente con restricciones: disponibilidad de cirujanos, anestesistas, instrumentistas, salas, equipos
- Drag-and-drop con validación de conflictos en tiempo real
- Optimización automática de la LEQ según prioridad clínica
- Boletín quirúrgico PDF firmado digitalmente

**3.2 Módulo de Camas (OptaPlanner)**
- Asignación óptima de camas por servicio, diagnóstico, género, edad, aislamiento
- Predicción de altas para planificar nuevas admisiones
- Gestión de limpiezas y mantenimientos

**3.3 Módulo de RRHH — Horarios y Turnos (OptaPlanner)**
- Generación automática de cuadrantes mensuales
- Restricciones: descansos entre turnos, límites de horas, vacaciones aprobadas, festivos GE
- Gestión de vacaciones y permisos con flujo de aprobación
- Redistribución dinámica de personal por demanda (picos en urgencias)
- Expedientes disciplinarios integrados
- Control de asistencia con RFID (migraciones ya preparadas)

**3.4 Módulo de Agendas de Consulta (OptaPlanner)**
- Optimización de agendas por médico, servicio, tipo de consulta
- Lista de espera priorizada
- Teleconsulta integrada (Jitsi Meet SDK)
- Recordatorios automáticos a pacientes (SMS/Email)

### FASE 4 — MEDITRON e IA Clínica (Mes 7) 🆕

Ver Sección 10 para arquitectura detallada.

**4.1 Diagnóstico diferencial asistido**
- MEDITRON analiza síntomas + signos vitales + resultados de lab → lista de diagnósticos diferenciales ordenados por probabilidad
- Integración en el formulario de consulta médica y urgencias
- Sin sustituir al médico: modo sugerencia con visualización de razonamiento

**4.2 Prescripción asistida por IA**
- Sugerencias de tratamiento según diagnóstico + perfil del paciente
- Verificación de dosis según protocolo OMS
- Detección de interacciones no recogidas en la base de datos local

**4.3 Interpretación de laboratorio**
- MEDITRON interpreta resultados fuera de rango en contexto clínico
- Sugerencias de pruebas adicionales
- Alertas de patrones indicativos de condiciones graves

**4.4 Apoyo en epidemiología**
- Detección automática de clustering de casos
- Predicción de brotes basada en tendencias históricas
- Sugerencias de intervención

### FASE 5 — Dashboard BI y Base Nacional (Mes 8) 🆕

**5.1 Dashboard BI completo (Tremor + Recharts + D3)**
- KPIs clínicos: ocupación, rotación camas, estancia media, mortalidad, readmisiones
- KPIs quirúrgicos: cirugías programadas/realizadas, suspensiones, tiempo quirúrgico
- KPIs de urgencias: tiempo de espera por nivel triage, derivaciones, HAMA
- KPIs financieros: facturación diaria/mensual, cobros, deuda, rentabilidad por servicio
- KPIs de RRHH: asistencia, horas extra, cobertura por turno
- KPIs de farmacia: consumo por principio activo, alertas de stock, caducidades
- KPIs de laboratorio: solicitudes, tiempos de respuesta, valores críticos
- Mapas geográficos con distribución por provincias GE (Leaflet + GeoJSON)
- Vistas materializadas PostgreSQL + pg_cron (refresh cada 15 min)
- Exportación PDF y Excel desde cualquier vista

**5.2 Base de datos nacional (nodo central)**
- Despliegue del nodo central en infraestructura nacional GE
- Configuración del protocolo de sincronización Edge Functions + cron
- Tablas nacionales: demografía nacional, estadísticas agregadas por hospital, contabilidad centralizada, historias clínicas universales, calidad y eficiencia, KPIs nacionales
- Panel de administración nacional para el Ministerio de Sanidad

**5.3 Portal del paciente**
- Citas online con selección de médico, servicio y hora disponible
- Consulta de resultados de laboratorio e imagenología
- Historial básico de episodios
- Acceso a informes firmados digitalmente
- Notificaciones de citas y recordatorios

### FASE 6 — Epidemiología Avanzada + DHIS2 (Mes 9-12, post go-live) 🆕

Ver Sección 13 para arquitectura detallada.

---

## 7. CIE-11 y Sistema de Diagnóstico Avanzado

### 7.1 ¿Por qué CIE-11?

La OMS aprobó la CIE-11 en 2019 con entrada en vigor desde enero 2022. Guinea Ecuatorial, alineándose con los estándares OPS/OMS para la región, debe migrar a CIE-11. Las ventajas sobre CIE-10:
- 85.000+ entidades (vs 14.000 en CIE-10)
- Estructura jerárquica flexible (hasta 6 niveles)
- Extensiones de postcoordinación para mayor precisión diagnóstica
- Soporte digital nativo (URI únicos por entidad)
- Compatibilidad con FHIR R4 y SNOMED CT
- Sin licencia de uso requerida (iCIEd API gratuita)

### 7.2 Implementación sin licencias

```
Fuente de datos: API iCIEd OMS (https://icd.who.int/icdapi)
  - Completamente gratuita para implementaciones HIS
  - API REST con autenticación OAuth 2.0
  - Búsqueda por texto, código, jerarquía
  - 50 idiomas disponibles (incluye español)
  - Sin necesidad de descargar la base de datos completa
  
Alternativa local: CIE-11 JSON dump
  - La OMS publica el dump completo en formato JSON/CSV
  - Importable directamente a PostgreSQL
  - Permite búsqueda offline (importante para hospitales con conectividad limitada)
  - Actualizable anualmente con nuevo seed
```

### 7.3 Arquitectura del selector CIE-11

```tsx
// DiagnosticoSelectorCIE11.tsx
interface DiagnosticoCIE11 {
  codigo: string           // e.g. "CA22"
  titulo: string           // e.g. "Diabetes mellitus tipo 2"
  descripcion: string
  uri: string              // URI único OMS
  nivel: number            // profundidad jerárquica
  padre_codigo: string     // código del nodo padre
  extension?: string       // postcoordinación (gravedad, lateralidad, etc.)
  cie10_equivalente: string // para compatibilidad hacia atrás
}
```

**Funcionalidades del componente:**
- Búsqueda por texto libre (fuzzy search en PostgreSQL `tsvector`)
- Navegación por árbol jerárquico (accordion expandible)
- Filtrado por capítulos y bloques
- Selección múltiple de diagnósticos (principal + secundarios)
- Postcoordinación: gravedad, lateralidad, estadio, etiología
- Compatibilidad CIE-10 → CIE-11 (tabla de mapeo)
- Sugerencias de MEDITRON integradas
- Historial de los últimos diagnósticos del médico
- Favoritos por especialidad

### 7.4 Migración de datos históricos CIE-10 → CIE-11

La OMS proporciona tablas de mapeo bidireccional CIE-10/CIE-11. La migración en HOSIX es no destructiva: se mantienen ambos códigos en la BD durante un período de transición de 24 meses.

```sql
-- Añadir campos CIE-11 a la tabla de diagnósticos
ALTER TABLE clinico.diagnosticos_episodio 
  ADD COLUMN codigo_cie11 VARCHAR(20),
  ADD COLUMN uri_cie11 TEXT,
  ADD COLUMN extension_postcoord JSONB,
  ADD COLUMN cie10_compatibilidad VARCHAR(10); -- mapeo hacia atrás
```

---

## 8. Sistema de Prescripción Médica Avanzada (OMS)

### 8.1 Estándares OMS implementados

El módulo CPOE de HOSIX seguirá las siguientes guías OMS:
- **Lista de Medicamentos Esenciales OMS (LME)** — 25ª edición 2023 (502 medicamentos)
- **Guías de prescripción de la OMS** (WHO Model Formulary)
- **Sistema ATC/DDD** (Anatomical Therapeutic Chemical / Defined Daily Dose)
- **Código de prácticas de la OMS para la comercialización de sucedáneos de la leche materna**
- **Protocolo STOPP/START** para prescripción en ancianos
- **Normas OMS para dosis pediátricas** (peso, talla, edad, superficie corporal)

### 8.2 Motor CDS (Clinical Decision Support) expandido

El `CPOEPrescripcionForm.tsx` ya tiene la estructura del motor CDS. Se expande con:

```typescript
// useCDSEngine — funcionalidades a completar/añadir:

interface CDSAlerta {
  tipo: 'ALERGIA' | 'INTERACCION' | 'CONTRAINDICACION' | 'DOSIS_EXCESIVA' | 
        'AJUSTE_RENAL' | 'AJUSTE_HEPATICO' | 'EMBARAZO' | 'LACTANCIA' | 
        'DUPLICIDAD' | 'STOPP_CRITERIA' | 'NO_LME_OMS'
  severidad: 'CRITICA' | 'ALTA' | 'MEDIA' | 'INFORMATIVA'
  mensaje: string
  evidencia: string  // referencia bibliográfica OMS/AEMPS
  accion_recomendada: string
  puede_ignorar: boolean
}

interface CDSEvaluacion {
  alertas: CDSAlerta[]
  dosis_recomendada?: {
    adultos: { min: number; max: number; unidad: string; frecuencia: string }
    pediatrica?: { formula: 'mg/kg' | 'mg/m2'; dosis_por_kg: number; max_total: number }
    ajuste_renal?: { ClCr_min: number; factor_reduccion: number; observacion: string }
    ajuste_hepatico?: { grado_child: 'A' | 'B' | 'C'; ajuste: string }
  }
  en_lme_oms: boolean                // ¿Está en la Lista de Medicamentos Esenciales OMS?
  atc_code: string                   // Código ATC completo (5 niveles)
  ddd: number                        // Dosis Diaria Definida OMS
  indicaciones_aprobadas: string[]   // ficha técnica
  meditron_sugerencia?: string       // sugerencia de IA clínica
}
```

### 8.3 Base de datos de medicamentos sin licencia

```
Fuentes de datos gratuitas para la BD de medicamentos:
  - OpenFDA (API pública, cubre medicamentos internacionales)
  - RxNorm (NLM UMLS — gratuito para uso HIS)
  - WHO Drug Dictionary (versión básica gratuita)
  - ATC Index OMS (descargable gratuitamente)
  - DrugBank Open Data (CC BY 4.0 — cubre interacciones)
  - KEGG Drug (libre para uso académico/sanitario no comercial)
  - ChEMBL (EMBL-EBI, CC BY-SA 3.0)

Interacciones medicamentosas:
  - Las migraciones ya incluyen la tabla hosix_drug_interactions
  - Poblar con datos de: DrugBank Open + DDI Corpus (NLP)
  - Clasificación: mayor / moderada / menor / desconocida
```

### 8.4 Flujo completo de prescripción HOSIX/OMS

```
1. Médico selecciona diagnóstico CIE-11
2. MEDITRON sugiere tratamientos basados en diagnóstico + perfil paciente
3. Médico busca medicamento (nombre comercial / DCI / ATC / LME)
4. Sistema muestra: ¿Está en LME OMS? ¿Es de elección para ese diagnóstico?
5. Motor CDS evalúa en tiempo real:
   a. Alergias registradas del paciente
   b. Interacciones con medicación activa
   c. Dosis correcta según peso/edad/función renal
   d. Criterios STOPP/START si paciente > 65 años
   e. Contraindicaciones en embarazo/lactancia
6. Si alertas CRÍTICAS → bloqueo con justificación obligatoria
7. Si alertas ALTAS → diálogo de confirmación con evidencia
8. Médico completa: dosis, vía, frecuencia, duración, indicaciones
9. Firma digital ECDSA P-256 (ya implementada)
10. Kardex generado automáticamente para Enfermería
11. Orden enviada a Farmacia para dispensación
12. MEDITRON monitoriza eficacia y efectos adversos (futuro)
```

---

## 9. OptaPlanner — Gestión Inteligente de Recursos

### 9.1 ¿Por qué OptaPlanner?

OptaPlanner (ahora llamado **Timefold Solver**, sucesor open source Apache 2.0) es el motor de optimización de restricciones más maduro del ecosistema Java/JVM. Es ideal para HOSIX porque:
- Completamente gratuito (Apache 2.0 / LGPL)
- Diseñado específicamente para healthcare scheduling
- Maneja restricciones complejas: hard (no violar), soft (optimizar)
- Algoritmos: Tabu Search, Simulated Annealing, Late Acceptance
- API REST nativa (integrable con cualquier frontend)
- Casos de uso probados: NHS UK, hospitales universitarios europeos

> **Nota:** Se recomienda usar **Timefold Solver** (fork comunitario de OptaPlanner desde 2023, mismo equipo de desarrollo, mismo API).

### 9.2 Arquitectura de integración

```
Frontend React (HOSIX)
      ↓ REST API
Microservicio Timefold (Java 21 + Quarkus)
      ↓ Lee restricciones
Supabase PostgreSQL (tablas de recursos: camas, salas, profesionales, horarios)
      ↓ Devuelve solución óptima
Frontend React actualiza la programación
```

### 9.3 Módulos de optimización a implementar

**9.3.1 Programación de quirófanos**

Restricciones hard (no violar):
- Un cirujano no puede estar en dos salas simultáneamente
- Anestesista requerido por sala activa
- Tiempo de limpieza entre cirugías (mínimo 30 min)
- Equipos específicos requeridos por tipo de cirugía
- Disponibilidad de sangre/hemoderivados si clasificación hemorrágica alta

Restricciones soft (optimizar):
- Maximizar utilización de salas (>85%)
- Respetar preferencias de cirujanos sobre salas y horarios
- Agrupar cirugías del mismo cirujano en días consecutivos
- Minimizar tiempo de espera para casos urgentes
- Evitar cirugías largas al final del turno

**9.3.2 Gestión de camas**

Restricciones hard:
- Capacidad máxima por servicio
- Aislamiento de pacientes infecciosos
- Separación de género (normativa GE)
- Equipamiento requerido por diagnóstico (monitorización, O2, etc.)

Restricciones soft:
- Preferencia por misma planta para mismo médico
- Minimizar traslados innecesarios
- Optimizar flujo de altas para limpiar camas a tiempo

**9.3.3 Horarios de personal (cuadrantes)**

Restricciones hard:
- Descanso mínimo 11h entre turnos (OIT)
- No más de 7 turnos consecutivos
- Mínimo de personal cualificado por turno (ratio enfermera/cama)
- Vacaciones aprobadas no modificables
- Permisos legales (baja, maternidad/paternidad, etc.)

Restricciones soft:
- Distribuir turnos de noche equitativamente
- Respetar preferencias declaradas por el trabajador
- Minimizar split-shifts (turno partido)
- Dar días libres consecutivos cuando posible
- Cubrir festivos de forma rotatoria y justa

**9.3.4 Agendas de consulta externa**

Restricciones hard:
- Disponibilidad del médico (no programar si está de quirófano)
- Duración de consulta según tipo (primera/revisión/procedimiento)
- Capacidad de sala de consulta

Restricciones soft:
- Maximizar ocupación de agenda (>90%)
- Dar citas urgentes en < 24h
- Respetar demoras máximas por categoría de espera
- Agrupar pacientes por patología para eficiencia del médico

### 9.4 Componentes React para OptaPlanner

```tsx
// Nuevos componentes a crear:
src/components/hosix/scheduler/
├── QuirofanoScheduler.tsx          // Drag-and-drop + OptaPlanner
├── CamasOptimizador.tsx            // Sugerencia de asignación óptima
├── CuadranteMensual.tsx            // Vista de horarios + edición
├── VacacionesManager.tsx           // Solicitudes y aprobaciones
├── PermisosManager.tsx             // Permisos y bajas
├── RRHHRedistribucion.tsx          // Alerta de necesidad de refuerzo
└── AgendaOptimizadora.tsx          // Generación automática de agendas
```

---

## 10. MEDITRON — IA Clínica Local

### 10.1 ¿Qué es MEDITRON?

MEDITRON es un modelo de lenguaje (LLM) de 7B y 70B parámetros, afinado (fine-tuned) sobre LLaMA 2 con corpus médico de alta calidad:
- 48.000 artículos de PubMed Central (acceso abierto)
- Guías clínicas OMS, CDC, OPS, NICE
- Medical Licensing Examination (MLE) datasets
- **Publicado con licencia Open RAIL-M** (uso clínico permitido con restricciones de responsabilidad)
- Desarrollado por EPFL (École Polytechnique Fédérale de Lausanne)

### 10.2 Modos de despliegue para HOSIX

**Opción A — Servidor local por hospital (recomendada):**
```
Hardware mínimo: NVIDIA GPU 16GB VRAM (RTX 4080 o A4000)
Modelo: meditron-7b-q4_K_M.gguf (quantizado 4-bit, ~4GB)
Runtime: llama.cpp + llama-server (API compatible OpenAI)
Latencia: ~2-3 segundos por consulta
Costo operativo: solo electricidad (~30W en idle)
Privacidad: datos nunca salen del hospital ✅
```

**Opción B — Servidor central nacional:**
```
Hardware: 2× NVIDIA A100 80GB (o H100)
Modelo: meditron-70b (máxima precisión)
Servicio: FastAPI + vLLM
Acceso: API REST privada nacional con autenticación JWT
Latencia: <5 segundos
Todos los hospitales usan el mismo modelo
```

**Opción C — Hybrid (recomendada a largo plazo):**
```
Consultas rápidas (CDS, dosis): meditron-7b local
Diagnóstico diferencial complejo: meditron-70b central
Epidemiología nacional: meditron-70b central
```

### 10.3 Integración React

```typescript
// src/lib/meditron.ts
interface MeditronRequest {
  tipo: 'diagnostico_diferencial' | 'prescripcion' | 'interpretacion_lab' | 
        'interpretacion_rx' | 'epidemiologia' | 'dosis_pediatrica'
  contexto_clinico: {
    sintomas: string[]
    signos_vitales?: Record<string, number>
    resultados_lab?: Record<string, { valor: number; unidad: string; rango_normal: string }>
    medicacion_actual?: string[]
    antecedentes?: string[]
    edad?: number
    peso?: number
    sexo?: 'M' | 'F'
  }
  pregunta: string
  idioma?: 'es' | 'fr' | 'pt'
}

interface MeditronResponse {
  respuesta: string
  confianza: number          // 0-1
  referencias: string[]      // PubMed IDs, guías citadas
  disclaimer: string         // "Sugerencia de IA. Decisión clínica del médico."
  tiempo_ms: number
}
```

### 10.4 Casos de uso en HOSIX

| Módulo | Uso de MEDITRON |
|---|---|
| Urgencias | Sugerencia de diagnóstico diferencial rápido según síntomas |
| Prescripción CPOE | Sugerencia de tratamiento según diagnóstico + perfil |
| Laboratorio | Interpretación de resultados en contexto clínico |
| Historia Clínica | Resumen automático del episodio para el informe de alta |
| Epidemiología | Detección de patrones y sugerencia de alertas de brote |
| Diagnóstico | Apoyo al selector CIE-11 con sugerencias por síntoma |
| Consulta médica | Apoyo a la decisión clínica durante la anamnesis |

---

## 11. Arquitectura Multi-Hospital y Base de Datos Nacional

### 11.1 Topología de la red

```
┌─────────────────────────────────────────────────────────┐
│                   NODO CENTRAL NACIONAL                  │
│              (Malabo — Ministerio de Sanidad GE)         │
│                                                          │
│  PostgreSQL + Supabase Cloud / Self-hosted               │
│  Tablas nacionales:                                      │
│    · demografía nacional (MPI centralizado)              │
│    · estadísticas_nacionales (agregadas por hospital)    │
│    · contabilidad_centralizada                           │
│    · historias_clinicas_universales (índice + resumen)   │
│    · parametros_calidad_eficiencia                       │
│    · configuracion_nacional (catálogos, tarifas MISAT)   │
│    · epidemiologia_nacional (notificaciones OPS/OMS)     │
│    · auditoria_nacional (log de accesos)                 │
│                                                          │
│  Microservicios:                                         │
│    · Sincronización REST API                             │
│    · MEDITRON-70B (IA central)                           │
│    · OptaPlanner API nacional                            │
│    · Portal Ministerio (reporting)                       │
└──────────┬──────────────┬──────────────┬────────────────┘
           │              │              │
    Fibra / VPN     Fibra / VPN    Fibra / VPN
           │              │              │
    ┌──────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐
    │  HOSPITAL   │ │  HOSPITAL   │ │  HOSPITAL   │
    │  BATA       │ │  MALABO     │ │  EBEBIYÍN   │
    │  (Local DB) │ │  (Local DB) │ │  (Local DB) │
    └─────────────┘ └─────────────┘ └─────────────┘
           ↑ también otros hospitales de la red GE
```

### 11.2 Datos que se sincronizan al nodo central

**Sincronización en tiempo real (Supabase Realtime):**
- Alertas epidemiológicas (grupos OMS A — Ébola, Marburg, etc.)
- Alertas de seguridad del paciente (valor crítico de lab)

**Sincronización cada 15 minutos (pg_cron + Edge Functions):**
- Resumen de ocupación de camas (para el cuadro de mando nacional)
- Nuevas admisiones, altas y defunciones del día
- Episodios de urgencias completados

**Sincronización diaria (batch nocturno):**
- Datos demográficos de nuevos pacientes al MPI nacional
- Estadísticas de actividad (facturación, laboratorio, cirugías)
- Indicadores de calidad y eficiencia
- Medicamentos dispensados (para informes NAFD)
- Datos de epidemiología (notificaciones semana epidemiológica)

**Sincronización semanal:**
- Backup completo de Historia Clínica Universal (resúmenes)
- Reportes DHIS2 agregados

### 11.3 Resolución de conflictos

```sql
-- La tabla sincronizacion.cambios_pendientes ya existe (migración 007)
-- Estrategia de resolución:
--   'central_gana'   — para catálogos y configuración (tarifas, CIE-11)
--   'local_gana'     — para datos clínicos generados localmente
--   'merge'          — para historias clínicas (timeline compartido)
--   'manual'         — para conflictos detectados (notificación a admin)
```

### 11.4 Modo offline

HOSIX debe funcionar aunque el hospital no tenga conexión al nodo central:
- IndexedDB para almacenamiento local de sesión activa
- Queue de sincronización para enviar cuando vuelva la conexión
- `network-status.tsx` y `offline-notification.tsx` ya están implementados en `src/components/ui/`
- Indicadores visuales de estado de conexión

---

## 12. Roles y Permisos del Sistema

### 12.1 Matriz de roles

| Rol | Código | Descripción |
|---|---|---|
| Administrador Nacional | `ADMIN_NAC` | Acceso completo a nodo central, reportes nacionales, configuración de red |
| Director de Hospital | `DIRECTOR` | Acceso completo a su hospital, reportes de gestión, BI completo |
| Subdirector Médico | `SUBDIR_MED` | Módulos clínicos de su hospital, BI clínico |
| Subdirector Administrativo | `SUBDIR_ADM` | Módulos administrativos, financieros, RRHH |
| Médico Especialista | `MEDICO_ESP` | HCE, prescripción, interconsultas, lab/imagen (su servicio) |
| Médico Residente | `MEDICO_RES` | Como MEDICO_ESP con supervisión obligatoria en prescripción |
| Médico Urgencias | `MEDICO_URG` | Urgencias, triage, episodios agudos |
| Enfermero/a | `ENFERMERIA` | Kardex, constantes vitales, planes de cuidado, administración medicamentos |
| Comadrona | `COMADRONA` | Obstetricia, partograma, CRED |
| Farmacéutico | `FARMACIA` | Dispensación, stock farmacia, validación CPOE |
| Técnico de Laboratorio | `LABORATORIO` | Recepción muestras, resultados, control calidad |
| Técnico Radiología | `RADIOLOGIA` | Gestión estudios, informes básicos |
| Admisionista | `ADMISION` | Registro pacientes, admisión, altas administrativas |
| Cajero/a | `CAJA` | Facturación, cobros, arqueos, cierres de caja |
| Técnico Almacén | `ALMACEN` | Stock, movimientos, pedidos |
| Gestor de Compras | `COMPRAS` | Licitaciones, adjudicaciones, presupuestos |
| Epidemiólogo | `EPIDEMIOLOGO` | Módulo epidemiológico completo, DHIS2, notificaciones |
| Informático / IT | `IT` | Configuración técnica, monitorización, logs |
| Auditor | `AUDITOR` | Solo lectura de logs, auditoría, trazabilidad |

### 12.2 RLS (Row Level Security) por rol

```sql
-- Ejemplo de política RLS para Historia Clínica:
-- Un médico solo ve los pacientes de su servicio o centro de salud
CREATE POLICY "medico_acceso_pacientes" ON clinico.episodios
  FOR SELECT USING (
    auth.uid() IN (
      SELECT u.id FROM configuracion.usuarios u
      WHERE u.centro_salud_id = episodios.centro_salud_id
        AND u.perfil_id IN (
          SELECT p.id FROM configuracion.perfiles p
          WHERE p.codigo IN ('MEDICO_ESP', 'MEDICO_RES', 'MEDICO_URG', 'ENFERMERIA')
        )
    )
    OR
    -- El director ve todo su hospital
    auth.uid() IN (
      SELECT u.id FROM configuracion.usuarios u
      WHERE u.centro_salud_id = episodios.centro_salud_id
        AND u.perfil_id IN (
          SELECT p.id FROM configuracion.perfiles p WHERE p.codigo = 'DIRECTOR'
        )
    )
  );
```

### 12.3 Permisos granulares por módulo

| Módulo | Admin | Director | Médico | Enfermería | Farmacia | Caja | Almacén |
|---|---|---|---|---|---|---|---|
| HCE — lectura | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| HCE — escritura | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Prescripción | ✅ | ❌ | ✅ | 👁 (ver) | 👁 (validar) | ❌ | ❌ |
| Dispensación | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Facturación | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Quirófanos | ✅ | ✅ | ✅ | 👁 | ❌ | ❌ | ❌ |
| RRHH / Turnos | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| BI Nacional | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Epidemiología | ✅ | ✅ | 👁 | 👁 | ❌ | ❌ | ❌ |
| Almacenes | ✅ | ✅ | ❌ | ❌ | 👁 | ❌ | ✅ |

---

## 13. Dashboard Epidemiológico Avanzado + DHIS2

### 13.1 Estado actual

Los siguientes archivos ya existen y tienen implementación parcial:
- `DashboardEpidemiologico.tsx` — KPIs básicos, alertas, top enfermedades
- `CasosList.tsx` — Lista de casos con filtros
- `BrotesList.tsx` — Gestor de brotes activos
- `NotificarCasoForm.tsx` — Formulario de notificación de caso
- `useHosixEpidemiologia.ts` — Hook con CRUD básico
- Migración `20260530_010_epidemiologia_avanzada.sql` — Tablas avanzadas
- Migración `20260602_012_epidemiologia_dhis2_rastreo_avanzado.sql` — 14 nuevas tablas DHIS2

### 13.2 Dashboard epidemiológico a construir

**Panel de vigilancia en tiempo real:**
- Mapa nacional GE (Leaflet + GeoJSON provincias) con densidad de casos por enfermedad
- Curva epidémica animada (D3.js) con líneas de umbral de alerta
- Gráfico de semaforo nacional por enfermedad de notificación
- Tabla de notificaciones de la semana epidemiológica activa
- Alertas automáticas de umbral de brote (umbral ajustable por enfermedad y zona)

**Panel de brotes:**
- Grafo de contactos interactivo (react-force-graph / Cytoscape.js)
- Árbol de transmisión con fechas de inicio de síntomas
- Mapa de geolocalización de casos del brote
- Timeline de evolución del brote

**Panel de indicadores OPS/OMS:**
- Tasa de ataque por enfermedad y zona
- Cobertura de vacunación por provincia
- Tiempos de respuesta (notificación → investigación → control)
- Cumplimiento RSI (Reglamento Sanitario Internacional)

**Sincronización DHIS2:**
```
HOSIX → DHIS2 Tracker (cada notificación de caso)
  · Evento DHIS2: cada nuevo caso notificado
  · TEI (Tracked Entity Instance): paciente con ID HOSIX
  · Enrollment: inicio de seguimiento del caso
  
HOSIX → DHIS2 Aggregate (semanal, semana epidemiológica)
  · Data Values por orgUnit (hospital/provincia/nacional)
  · Indicadores OPS: incidencia, prevalencia, letalidad
  · Informes para Ministerio de Sanidad GE

Tecnología: Supabase Edge Functions (Deno/TypeScript)
  · Endpoint DHIS2: /api/trackedEntityInstances
  · Autenticación: Basic Auth o OAuth2 DHIS2
```

### 13.3 Enfermedades de vigilancia implementadas

El sistema cubre los 4 grupos OMS:

| Grupo | Enfermedades | Urgencia |
|---|---|---|
| **Grupo A** — Potencial emergencia internacional | Ébola, Marburg, Lassa, Mpox, SARS, MERS-CoV, Fiebre amarilla, Viruela | Notificación en < 24h a OPS |
| **Grupo B** — Endémicas regionales | Malaria, Paludismo, Fiebre tifoidea, Dengue, Cólera, Meningitis bacteriana | Notificación semanal |
| **Grupo C** — Vigilancia nacional | VIH/SIDA, Tuberculosis, Hepatitis B/C, Sarampión, Tétanos, Rabia, Lepra | Notificación mensual |
| **Grupo D** — Vigilancia sindrómica | Síndrome febril inespecífico, Síndrome diarreico agudo, Síndrome respiratorio agudo, Síndrome neurológico agudo | Umbral automático |

---

## 14. Sistema de Buzón de Notificaciones y Alertas

### 14.1 Tipos de notificaciones

**Alertas clínicas críticas (tiempo real):**
- Valor crítico de laboratorio → notificación push al médico responsable
- Triage nivel 1-2 sin médico > 5 min → alerta sonora + push al jefe de urgencias
- Prescripción con alergia conocida → bloqueo + notificación al farmacéutico
- Paciente con constante vital fuera de rango crítico → push a enfermería

**Alertas epidemiológicas:**
- Caso sospechoso de Grupo A → alerta inmediata a epidemiólogo + director
- Umbral de brote superado → alerta a todo el equipo de vigilancia
- Notificación pendiente de envío a DHIS2 sin confirmar > 1h

**Alertas operativas:**
- Stock mínimo de medicamento → notificación a farmacia + jefe almacén
- Cama lista para nuevo paciente → notificación a admisión
- Prueba radiológica con hallazgo urgente → notificación al médico solicitante
- Alta programada sin informe → recordatorio al médico 2h antes

**Notificaciones de gestión:**
- Solicitud de vacaciones pendiente de aprobación → jefe de servicio
- Guardia sin cubrir en cuadrante → alerta a jefe de RRHH
- Licitación con plazo próximo → notificación a compras
- Factura impagada > umbral configurado → notificación a dirección

### 14.2 Canales de entrega

```typescript
interface NotificacionHOSIX {
  id: string
  tipo: 'CRITICA' | 'ALTA' | 'MEDIA' | 'INFO'
  categoria: 'CLINICA' | 'EPIDEMIOLOGICA' | 'OPERATIVA' | 'GESTION'
  titulo: string
  mensaje: string
  datos_contexto: Record<string, any>   // link a episodio, paciente, etc.
  destinatarios: string[]               // user IDs
  canales: ('IN_APP' | 'PUSH' | 'EMAIL' | 'SMS')[]
  leida: boolean
  fecha_creacion: timestamptz
  fecha_expiracion?: timestamptz
  accion_requerida?: boolean            // requiere confirmación del destinatario
}
```

**Canal 1 — In-app (Supabase Realtime):**
- Bell icon en el header con badge de conteo
- Drawer lateral con buzón de notificaciones
- Agrupación por categoría y prioridad
- Marcado individual/masivo como leído
- Filtros: no leídas, críticas, por módulo
- Ya preparado con `offline-notification.tsx` en el proyecto

**Canal 2 — Web Push (Web Push API):**
- Notificaciones push del navegador (incluso con la app cerrada)
- Service Worker ya habilitado (`vite-plugin-pwa` instalado)
- Solo para alertas CRITICAS y ALTAS
- Requiere consentimiento del usuario

**Canal 3 — Email:**
- Supabase Edge Functions + servicio SMTP (SendGrid / BREVO gratuitos)
- Para notificaciones administrativas y reportes programados
- Resumen diario para directores

**Canal 4 — SMS (futuro, Fase 6):**
- Twilio / Africa's Talking (cobertura GE)
- Solo para alertas epidemiológicas Grupo A
- Para pacientes: recordatorios de cita y resultados de lab

### 14.3 Componentes React del buzón

```
src/components/hosix/notificaciones/
├── NotificacionesBell.tsx          // Bell icon + badge en header (a añadir a HosixHeader.tsx)
├── BuzonNotificaciones.tsx         // Drawer completo con todos los mensajes
├── NotificacionCard.tsx            // Tarjeta individual por notificación
├── ConfiguracionNotificaciones.tsx // Preferencias por usuario y tipo
└── AlertasCriticas.tsx             // Overlay para alertas críticas activas
```

---

## 15. Stack Tecnológico Completo

### 15.1 Dependencias actuales (instaladas)

```json
Producción:
  react@18.3.1                  UI framework
  vite@5.4.1                    Build tool
  typescript@5.5.3              Type safety
  @supabase/supabase-js@2.50.1  Backend as a service
  @tanstack/react-query@5.56.2  Server state management
  @tanstack/react-table@8.21.3  Tables avanzadas
  zustand@5.0.7                 Client state management
  react-router-dom@6.26.2       Navigation
  recharts@3.1.2                Charts
  d3@7.9.0 + d3-geo             Advanced visualization
  leaflet@1.9.4 + react-leaflet Maps
  react-simple-maps@3.0.0       Simplified map components
  topojson-client@3.1.0         Geographic data processing
  react-dnd@16.0.1              Drag and drop (quirófanos)
  jspdf@3.0.1 + html2canvas     PDF generation
  xlsx@0.18.5                   Excel export
  jsbarcode@3.11.6              Barcodes (pulseras)
  date-fns@3.6.0                Date utilities
  zod@3.23.8                    Schema validation
  react-hook-form@7.53.0        Form management
  sonner@1.5.0                  Toast notifications
  lucide-react@0.462.0          Icons
  uuid@9.0.1                    UUIDs
  shadcn/ui + Radix UI          UI component library
  tailwindcss@3.4.11            Styling
  next-themes@0.3.0             Dark/light mode
  vaul@0.9.3                    Drawers
  embla-carousel-react@8.3.0    Carousels
  cmdk@1.0.0                    Command palette
  input-otp@1.2.4               OTP input
  file-saver@2.0.5              File downloads
  react-day-picker@8.10.1       Date picker
  react-resizable-panels@2.1.3  Resizable layouts
  @tauri-apps/plugin-sql@2.0.0  SQLite local (desktop)
  @tauri-apps/plugin-autostart  Autostart desktop

Desarrollo:
  vitest (NO INSTALADO)          Unit testing
  @testing-library/react         Component testing
  vite-plugin-pwa@1.1.0         PWA support
  lovable-tagger@1.1.7          Dev tags
```

### 15.2 Dependencias a instalar

```bash
# Visualización y BI avanzado
npm install @tremor/react                   # Gráficas BI, KPIs, dashboards
npm install react-force-graph               # Grafo contactos epidemiológicos
npm install cytoscape react-cytoscapejs     # Red de transmisión epidemiológica

# Formularios dinámicos (fichas epidemiológicas OPS)
npm install @rjsf/core @rjsf/utils @rjsf/validator-ajv8

# Testing
npm install -D vitest @testing-library/react @testing-library/user-event @vitest/coverage-v8

# Teleconsulta
npm install @jitsi/react-sdk                # Fase 3

# Estadísticas clínicas
npm install simple-statistics               # Cálculos epidemiológicos

# FHIR avanzado (futuro)
npm install fhirclient                      # SMART on FHIR auth + queries
npm install @medplum/fhirtypes              # TypeScript FHIR types completos

# IA / MEDITRON integration
npm install openai                          # Compatible con llama-server OpenAI API

# PWA notificaciones push
npm install web-push                        # Solo para edge function (Deno)

# Validación adicional
npm install @hookform/resolvers             # Ya está, verificar versión
```

### 15.3 Modo visual avanzado — Tremor + React Medical UI

**Tremor** (open source, MIT License) provee:
- `<BarChart>`, `<LineChart>`, `<AreaChart>`, `<DonutChart>` listos para BI
- `<Metric>`, `<Badge>`, `<ProgressBar>` para KPIs
- `<Table>` avanzada con sorting, filtering
- Paleta de colores médicos (azules, verdes, rojos semáforo)
- Modo oscuro incluido

**React Medical UI** — opciones open source:
- `@openmrs/esm-framework` (OpenMRS UI components — Apache 2.0)
- `@healthwise/components` (MIT) — componentes validados en entorno clínico
- `clinical-ui` (BSD) — gráficas de signos vitales, escalas clínicas

### 15.4 Infraestructura de despliegue

```
Hospital local:
  Frontend: Nginx → React build (o Tauri desktop)
  Backend: Supabase self-hosted (PostgreSQL + GoTrue + Storage + Edge Runtime)
  MEDITRON: llama-server en GPU local
  OptaPlanner/Timefold: Quarkus JAR en servidor local
  
Nodo central nacional (Malabo):
  Frontend admin: Nginx
  Backend: Supabase cloud o self-hosted de alta disponibilidad
  MEDITRON-70B: vLLM en servidor GPU dedicado
  Timefold nacional: Kubernetes cluster (2+ nodos)
  DHIS2: Docker compose (docker-compose.dhis2.yml ya existe en el repo)

CI/CD:
  GitHub Actions (por configurar):
    - lint + typecheck en cada PR
    - vitest coverage en cada PR
    - build check en main
    - deploy automático a staging en merge
```

---

## 16. Orden de Implementación Recomendado

### Semana 1 — Desbloqueante (HACER HOY)

1. Completar `App.tsx` con las **24 rutas** en lazy loading
2. Implementar `<ProtectedRoute roles={[...]} />` con lógica de rol desde `useHosixAuth`
3. Crear `authStore.ts` en Zustand para estado global de usuario
4. Configurar `queryClient` global con parámetros optimizados para clínica
5. Habilitar Supabase Realtime en: `camas`, `urgencias_episodios`, `alertas_sistema`, `constantes_vitales`
6. Verificar que todas las migraciones SQL están aplicadas en Supabase

### Semana 2-3 — Mapa de camas y Urgencias completos

1. Componente `MapaCamas.tsx` (SVG por servicio + Realtime)
2. Trigger PostgreSQL `fn_estado_cama_trigger`
3. TriageBoard completo con timer de espera y alertas automáticas
4. Integración `PatientBanner` en todas las páginas clínicas
5. Notificaciones in-app (bell icon + buzón básico)

### Semana 4-6 — CIE-11 y CPOE OMS

1. Seed datos CIE-11 en PostgreSQL (dump JSON OMS → INSERT)
2. Componente `DiagnosticoSelectorCIE11.tsx`
3. Expansión del motor CDS en `CPOEPrescripcionForm.tsx`
4. Seed lista OMS + código ATC + interacciones DrugBank Open
5. Flujo completo: diagnóstico → prescripción → kardex → dispensación

### Semana 7-10 — Completar módulos clínicos existentes

- Laboratorio: recepción de resultados + alertas valores críticos
- Imagenología: visor DICOM básico (OHIF standalone)
- Obstetricia: partograma completo con líneas OMS
- CRED: curvas OMS con ploteo automático
- Dashboard BI v1 con Tremor

### Mes 3-4 — OptaPlanner / Timefold

1. Crear microservicio Quarkus + Timefold Solver
2. Módulo de programación de quirófanos
3. Módulo de cuadrantes y horarios RRHH
4. Módulo de gestión de camas (asignación óptima)
5. Componentes React de scheduler con DnD

### Mes 5 — MEDITRON

1. Configurar llama-server con meditron-7b cuantizado en GPU local
2. `MeditronService.ts` (cliente compatible OpenAI API)
3. Integración en CPOE (sugerencias de prescripción)
4. Integración en formulario de consulta (diagnóstico diferencial)
5. Integración en laboratorio (interpretación de resultados)

### Mes 6-8 — BI completo + Base nacional + OptaPlanner agendas

- Dashboard BI completo con todas las métricas
- Despliegue nodo central nacional
- Protocolo de sincronización Edge Functions + cron
- OptaPlanner para agendas de consulta externa
- Teleconsulta Jitsi Meet SDK

### Mes 9-12 — Epidemiología avanzada + DHIS2

- Dashboard epidemiológico completo con mapas y curvas
- Grafo de contactos (react-force-graph)
- Sincronización DHIS2 Tracker + Aggregate
- Vigilancia sindrómica semanal automática
- Notificaciones OPS/Ministerio de Sanidad GE
- SMS Twilio para contactos de brote

---

## 17. Resumen Ejecutivo

### Estado real al 02-06-2026

El repositorio `crisfroi/HOSIX-GEPROSALUD` contiene un sistema hospitalario en estado de desarrollo **mucho más avanzado de lo que inicialmente se estimó**: **86 componentes React, 26 páginas, 26 hooks personalizados, 53 migraciones SQL y 8.514 líneas de tipos TypeScript**. El progreso real está entre el **55-65%** del sistema HIS base, no al 5%.

El principal problema técnico hoy no es falta de código, sino que **22 de las 24 páginas implementadas no están registradas en el router** (`App.tsx`). Esta corrección de 30 minutos desbloquea inmediatamente la mayor parte del sistema.

### Decisiones tecnológicas estratégicas

| Tecnología | Justificación | Licencia |
|---|---|---|
| **CIE-11 (iCIEd OMS)** | Estándar internacional vigente desde 2022, API gratuita OMS, 85.000 entidades | Libre uso HIS |
| **Timefold Solver** (sucesor OptaPlanner) | Motor de optimización de restricciones líder para healthcare scheduling, probado en NHS | Apache 2.0 |
| **MEDITRON-7B/70B** | LLM médico de alta precisión (EPFL), sin enviar datos a servidores externos, privacidad garantizada | Open RAIL-M |
| **Tremor** | Dashboards BI profesionales, compatible con React 18, MIT license | MIT |
| **DHIS2** | Estándar OPS/OMS para vigilancia epidemiológica en Africa, protocolo nacional GE | BSD |
| **FHIR R4** | Interoperabilidad internacional, base ya implementada en el proyecto | Estándar abierto |
| **Supabase self-hosted** | Control total de datos clínicos sensibles, cumplimiento LOPD/RGPD | Apache 2.0 |

### Estimación actualizada

| Fase | Contenido | Duración | Estado |
|---|---|---|---|
| **F0** | Rutas + Auth + Realtime + RLS | 1 semana | 🔴 Urgente |
| **F1** | Mapa camas + Urgencias + CIE-11 + CPOE OMS | 2 meses | 🟡 Siguiente |
| **F2** | Lab avanzado + Obstetricia + CRED + Imagenología + BI v1 | 2 meses | 🟡 Planificado |
| **F3** | Timefold/OptaPlanner (quirófanos + RRHH + camas) | 2 meses | 🆕 Nuevo |
| **F4** | MEDITRON (IA clínica local) | 1 mes | 🆕 Nuevo |
| **F5** | BI completo + Base nacional + Portal paciente | 2 meses | 🆕 Nuevo |
| **F6** | Epidemiología avanzada + DHIS2 + SMS | 4 meses | 🔵 Post go-live |
| **Total** | Sistema completo | **~12 meses** | |

El sistema puede estar en producción clínica básica (Fases 0-2: urgencias + hospitalizacion + HCE + prescripción CIE-11/OMS) en aproximadamente **3-4 meses**. El sistema completo con IA, optimización y epidemiología en **12 meses**.

---

*Documento generado por Claude Sonnet 4.6 · Análisis exhaustivo del repositorio `crisfroi/HOSIX-GEPROSALUD` · 02 de junio de 2026*
*GEPROSTEC · Proyecto HOSIX · Red Hospitalaria de Guinea Ecuatorial*
