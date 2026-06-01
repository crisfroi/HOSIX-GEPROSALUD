# ✅ CHECKLIST & MATRIZ DE DECISIÓN - HOSIX

**Documento de Referencia Rápida** | 29-05-2026

---

## 🎯 CHECKLIST: REQUISITOS DEL USUARIO

### ✅ REQUISITO 1: Sistema Multi-Hospital con Sincronización
- [x] **Especificación:** Cada hospital en LOCAL, sincroniza con CENTRAL
- [x] **Opción A (REALTIME):** Supabase Realtime + Edge Functions
- [x] **Opción B (CRON):** Automático cada N minutos
- [x] **Opción C (MANUAL USB):** Exportación JSON manual
- [x] **Tablas nuevas:** 3 tablas de sincronización
- [x] **Resolución de conflictos:** central_gana | local_gana | merge
- [x] **Status:** 🟢 LISTO PARA CODIFICAR

### ✅ REQUISITO 2: Navegación Multi-Pestaña
- [x] **Especificación:** Médico abre 3+ pacientes simultáneamente
- [x] **Máximo:** 5 pestañas abiertas
- [x] **Cada pestaña:** Contexto independiente (episodio_id, modulo_activo)
- [x] **PatientBanner:** Datos del paciente activo siempre visible
- [x] **Breadcrumb:** Contextual por pestaña
- [x] **Estado persistente:** Guardar tabs en localStorage (Zustand)
- [x] **Código:** TabsStore + TabBar component listos
- [x] **Status:** 🟢 LISTO PARA CODIFICAR

### ✅ REQUISITO 3: Historia Clínica Unificada Avanzada
- [x] **Timeline:** Todos los episodios ordenados cronológicamente
- [x] **Antecedentes:** Personales, familiares, quirúrgicos, alérgicos
- [x] **Alergias:** BANNER ROJO DE ALERTA PERMANENTE (crítico)
- [x] **Medicación activa:** Durante episodio + Kardex
- [x] **Constantes vitales:** Últimas 5 + gráficos trend
- [x] **Escalas clínicas:** 40+ tipos, historial completo
- [x] **Diagnósticos:** CIE-10 activos + históricos
- [x] **Accesos rápidos:** Labs, imágenes, informes
- [x] **Vacunas:** Registro (si aplica)
- [x] **Documentos:** Adjuntos y generados
- [x] **Componente React:** Base lista en PLAN_ACCION_INMEDIATO.md
- [x] **Status:** 🟢 LISTO PARA CODIFICAR

### ✅ REQUISITO 4: Edición de Servicios/Productos con Precios
- [x] **Tabla única:** configuracion.servicios_productos
- [x] **Campos:** Código, nombre, tipo, descripción, precio_base
- [x] **Precios por aseguradora:** facturacion.precios_aseguradora
- [x] **Descuentos:** Campo descuento_porcentaje
- [x] **Vigencia:** desde DATE, hasta DATE
- [x] **Stock integration:** Link a medicamento_id o articulo_id
- [x] **UI Component:** GestionServiciosProductos.tsx
- [x] **Acciones:** Editar precio base, precios x aseguradora
- [x] **Status:** 🟢 LISTO PARA CODIFICAR

### ✅ REQUISITO 5: Módulo de Aseguradoras (Mejorado)
- [x] **Tabla mejorada:** facturacion.companias_seguro (expandida)
- [x] **Cobertura:** cubre_consulta, cubre_hospitalizacion, cubre_cirugia
- [x] **Límites:** limite_mensual, limite_anual
- [x] **Configuración:** porcentaje_cobertura_default, copago_porcentaje
- [x] **Autorización:** requiere_autorizacion flag
- [x] **Facturación:** dias_pago, requiere_recobro
- [x] **Status:** 🟢 LISTO PARA CODIFICAR

### ✅ REQUISITO 6: Facturación con Vista de Deudas Totales
- [x] **Función SQL:** obtener_deudas_paciente(p_paciente_id)
- [x] **Retorna:** Todas las deudas del paciente
- [x] **Campos:** numero_factura, monto_total, pagado, adeudado, dias_atraso
- [x] **Cálculos automáticos:** adeudado = total - pagado, atraso = NOW() - fecha_emision
- [x] **Filtros:** Solo facturas no anuladas
- [x] **UI Component:** ResumenDeudas + TablaDeudas
- [x] **Cobro:** Cobro parcial por factura o monto total
- [x] **Status:** 🟢 LISTO PARA CODIFICAR

### ✅ REQUISITO 7: Control Epidemiológico Avanzado
- [x] **Enfermedades vigilancia:** epidemiologia.enfermedades_vigilancia
- [x] **Casos:** epidemiologia.casos con estado (sospecha, confirmado, descartado)
- [x] **Alertas:** epidemiologia.alertas por umbrales
- [x] **RASTREO FAMILIA:** Árbol de contagio + contactos + relaciones
- [x] **Notificación:** Flag para autoridades sanitarias
- [x] **Dashboard:** KPIs, alertas, gráficos, mapa
- [x] **Status:** 🟢 LISTO PARA CODIFICAR

### ✅ REQUISITO 8: Sistema de Plantillas de Documentos
- [x] **Tabla:** configuracion.plantillas_documentos
- [x] **Tipos:** informe_alta, receta, referencia, consentimiento, boletin_quirurgico
- [x] **Variables dinámicas:** {{paciente.nombre}}, {{episodio.diagnostico}}, etc.
- [x] **Editor WYSIWYG:** Barra de herramientas, inserción variables
- [x] **Generador:** Auto-llenar desde episodio, editar, generar PDF
- [x] **Firma digital:** Pin secundario + hash SHA-256
- [x] **Versioning:** Control de versiones de plantillas
- [x] **Status:** 🟢 LISTO PARA CODIFICAR

### ✅ REQUISITO 9: 40+ Escalas Clínicas
- [x] **Glasgow Coma Scale** (neurología)
- [x] **Barthel** (funcionales)
- [x] **Braden** (riesgo presión)
- [x] **Norton** (caídas)
- [x] **Wells TVP** (trombosis)
- [x] **CHADS2** (fibrilación atrial)
- [x] **APGAR** (neonatal)
- [x] **MNA** (nutrición geriátrica)
- [x] **Tinetti** (marcha/equilibrio)
- [x] **Y 31 más...** (ver ANALISIS_ALINEAMIENTO_HOSIX.md)
- [x] **Componente genérico:** EscalaClinicaForm.tsx
- [x] **Cálculo automático:** Puntaje + interpretación
- [x] **Alertas:** Para valores críticos
- [x] **Status:** 🟢 LISTO PARA CODIFICAR

---

## 🚦 MATRIZ DE PRIORIZACIÓN

### URGENCIA vs COMPLEJIDAD

```
                    ALTA URGENCIA
                         ↑
                         │
                 ╔════════╬════════╗
                 │        │        │
    COMPLEJIDAD  │   4    │    5   │
      BAJA       │        │        │
                 ├────────┼────────┤
                 │   2    │   3    │
    COMPLEJIDAD  │        │        │
      ALTA       │        │        │
                 └────────┼────────┘
                         │
                    BAJA URGENCIA
                         ↓

CUADRANTE 1 (ROJO): Urgente + Simple → HACER PRIMERO
  ✅ Sincronización multi-hospital
  ✅ TabBar navegación
  ✅ Alertas epidemiológicas
  
CUADRANTE 2 (AMARILLO): No urgente + Simple → HACER DESPUÉS
  ✅ Escalas clínicas (40+)
  ✅ Aseguradoras mejorada
  
CUADRANTE 3 (AZUL): Urgente + Complejo → PLANIFICAR BIEN
  ✅ HCE avanzada
  ✅ Plantillas documentos
  
CUADRANTE 4 (VERDE): No urgente + Complejo → DEJAR PARA DESPUÉS
  ✅ Teleconsulta (Jitsi)
  ✅ PACS/DICOM
```

### MAPA DE IMPLEMENTACIÓN

| # | Requisito | Semana | Equipo | Status |
|---|-----------|--------|--------|--------|
| 1 | Sincronización | 1 | Backend | 🔴 TODO |
| 2 | TabBar | 1 | Frontend | 🔴 TODO |
| 3 | HCE Avanzada | 1-2 | Frontend | 🔴 TODO |
| 4 | Servicios/Productos | 2 | Frontend | 🔴 TODO |
| 5 | Aseguradoras | 1 | Backend | 🔴 TODO |
| 6 | Facturación Deudas | 2 | Frontend | 🔴 TODO |
| 7 | Epidemiología | 2-3 | Backend+Frontend | 🔴 TODO |
| 8 | Plantillas | 3 | Frontend | 🔴 TODO |
| 9 | Escalas 40+ | 3-4 | Frontend | 🔴 TODO |
| + | Testing & QA | 4 | QA | 🔴 TODO |
| + | Deploy | 4 | DevOps | 🔴 TODO |

---

## 🎓 GUÍA DE DECISIÓN RÁPIDA

### ¿POR DÓNDE EMPIEZO?

**Opción A: "Quiero todo lo antes posible"**
→ Implementar en orden de PLAN_ACCION_INMEDIATO.md (4 semanas)

**Opción B: "Primero lo crítico para operación diaria"**
→ Semana 1: Sincronización + TabBar + HCE básica
→ Luego: Resto en fases

**Opción C: "Epidemiología es urgente"**
→ Saltar Semana 1-2, empezar Semana 2-3 con epidemiología
→ Hacer sincronización en paralelo

**Opción D: "Plantillas es prioridad"**
→ Hacer plantillas en Semana 3 (antes de escalas)
→ Ajustar roadmap

**Opción E: "MVP mínimo de 4 días"**
→ Día 1: Sincronización
→ Día 2: TabBar
→ Día 3: HCE básica + epidemiología simple
→ Día 4: Testing

---

## 📊 MATRIZ DE CAPACIDAD

### Estimación por Equipo Size

| Equipo | Tiempo Total | Fases | Quality |
|--------|--------------|-------|---------|
| 1 desarrollador | 12 semanas | 12 iteraciones | ⭐⭐⭐ |
| 2 desarrolladores | 6 semanas | 2-3 fases | ⭐⭐⭐⭐ |
| 3 desarrolladores | 4 semanas | 4 fases paralelas | ⭐⭐⭐⭐ |
| 4+ desarrolladores | 2-3 semanas | Paralelo máximo | ⭐⭐⭐⭐⭐ |

**Recomendación:** Mínimo 2 desarrolladores (1 backend + 1 frontend)

---

## 💰 ESTIMACIÓN DE ESFUERZO

| Componente | Frontend | Backend | Testing | Total |
|------------|----------|---------|---------|-------|
| Sincronización | - | 12h | 3h | **15h** |
| TabBar | 4h | - | 1h | **5h** |
| HCE Avanzada | 8h | 4h | 2h | **14h** |
| Servicios/Productos | 6h | 6h | 2h | **14h** |
| Aseguradoras (mejora) | 2h | 2h | 1h | **5h** |
| Facturación Deudas | 4h | 2h | 1h | **7h** |
| Epidemiología | 6h | 8h | 2h | **16h** |
| Plantillas | 10h | 4h | 2h | **16h** |
| Escalas 40+ | 12h | 2h | 3h | **17h** |
| QA Completo | - | - | 8h | **8h** |
| **TOTAL** | **52h** | **40h** | **25h** | **117h** |

---

## 🔄 DIAGRAMA DE FLUJO DE IMPLEMENTACIÓN

```
           START
             │
             ▼
    ┌─────────────────┐
    │ Sincronización  │ (15h)
    │ (Semana 1-inicio)
    └────────┬────────┘
             │
             ├─────────────────────┐
             │                     │
             ▼                     ▼
      ┌─────────────┐      ┌──────────────┐
      │  TabBar +   │      │  Asegurador  │ (5h)
      │  HCE Avanz. │      │    mejorada  │
      │   (18h)     │      └──────────────┘
      └────────┬────────────────────┘
               │
               ├─────────────────────────────┐
               │                             │
               ▼                             ▼
        ┌──────────────┐            ┌────────────────┐
        │  Epidemiolog │            │  Servicios +   │
        │   ía (16h)   │            │  Facturación   │
        │  +Escalas(17)│            │     (21h)      │
        └────────┬─────────────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │  Plantillas Doc │ (16h)
        │  + Testing (8h) │
        └────────┬────────┘
                 │
                 ▼
          ┌─────────────┐
          │  DEPLOY     │ ✅
          │ PRODUCCIÓN  │
          └─────────────┘
```

---

## 📱 TECNOLOGÍAS STACK CONFIRMADO

```
✅ Frontend:
   - React 18.3.1 + TypeScript
   - Vite (bundler rápido)
   - Tailwind CSS + shadcn/ui
   - React Router v6
   - Zustand (state management)
   - React Query v5 (server state)
   - React Hook Form + Zod (forms)
   - Recharts (gráficos)
   - Tanstack Table (datatables)

✅ Backend:
   - Supabase (PostgreSQL)
   - PostgREST API
   - Edge Functions (serverless)
   - Realtime (subscriptions)
   - Auth (JWT + RLS)
   - Storage (files/images)

✅ Tooling:
   - npm (package manager)
   - ESLint + TypeScript strict
   - Vitest (unit testing)
   - Playwright/Cypress (E2E)
```

---

## 🎬 CÓMO INICIAR HOY

### Paso 1: Leer Documentos (30 minutos)
```bash
# Lee en este orden:
1. RESUMEN_EJECUTIVO.md ✓ (tú)
2. ANALISIS_ALINEAMIENTO_HOSIX.md ✓ (técnico)
3. PLAN_ACCION_INMEDIATO.md ✓ (developers)
```

### Paso 2: Decidir Prioridad (15 minutos)
```
¿Cuál de los 9 requisitos es el MÁS crítico para tu negocio?
→ Epidemiología
→ Sincronización
→ Escalas clínicas
→ Plantillas documentos
→ Otro
```

### Paso 3: Crear Issues en GitHub (30 minutos)
```bash
# Crear 9 issues (uno por requisito)
# Asignar a developers
# Crear milestone "HOSIX-v2.0"
# Enlazar a este documento
```

### Paso 4: Kick-off Meeting (1 hora)
```
Equipo + PMs + Doctors/Usuarios
- Presentar 3 documentos
- Explicar arquitectura
- Preguntas y aclaraciones
- Comprometer timeline
```

### Paso 5: Comenzar Desarrollo (Hoy)
```bash
git checkout -b feature/hosix-v2-enhancements
# Crear rama para Semana 1
```

---

## ⚠️ RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|------------|---------|------------|
| Datos inconsistentes en sincronización | Media | Alto | Log detallado + manual review |
| Performance HCE con muchos datos | Baja | Medio | Índices DB + paginación |
| Conflictos de merge multi-hospital | Media | Alto | Timestamp + version control |
| Usuarios confundidos con 5 tabs | Baja | Bajo | UI/UX testing + tooltip |
| Escalas clínicas: errores cálculo | Baja | Crítico | Unit testing 100% |
| Plantas sin validación: datos basura | Media | Medio | Validación Zod |
| Integración Jitsi fallida | Baja | Medio | Fallback alternativa |

---

## 🎯 DEFINICIÓN DE "LISTO PARA PRODUCCIÓN"

```
✅ Código:
   - TypeScript strict
   - 80%+ test coverage en lógica crítica
   - ESLint 0 errores
   - React components re-render optimizados

✅ Base de Datos:
   - Todas las migraciones aplicadas
   - Índices creados
   - RLS policies habilitadas
   - Backup automatizado

✅ Testing:
   - Unit tests: funciones críticas
   - Integration tests: flujos completos
   - E2E tests: casos de usuario
   - Performance: < 500ms response time

✅ Seguridad:
   - OWASP top 10 auditado
   - Penetration testing
   - Certificado SSL/TLS
   - HIPAA compliance (opcional)

✅ Documentación:
   - README actualizado
   - Comentarios en código
   - Guía de deploy
   - Runbooks para operación

✅ Operación:
   - Monitoreo activo (Sentry/LogRocket)
   - Alertas configuradas
   - Plan de rollback
   - SOP para incidentes
```

---

## 📞 CONTACTO & PREGUNTAS

Si tienes dudas sobre:
- **Arquitectura:** Ver ANALISIS_ALINEAMIENTO_HOSIX.md
- **Código SQL:** Ver PLAN_ACCION_INMEDIATO.md
- **Componentes React:** Ver PLAN_ACCION_INMEDIATO.md
- **Timeline:** Ver esta checklist
- **Priorización:** Ver matriz de decisión arriba

---

**Proyecto:** HOSIX v2.0  
**Red Nacional:** Guinea Ecuatorial  
**Status:** ✅ Listo para comenzar  
**Documento:** Checklist & Matriz de Decisión  
**Versión:** 1.0  
**Actualizado:** 29-05-2026
