# FASE 4: CATÁLOGOS FARMACÉUTICOS - RESUMEN EJECUTIVO

**Estado:** 🟡 LISTO PARA INICIAR (6-JUN-2026)

---

## 📌 ALCANCE

**Objetivo Principal:** Integrar catálogos farmacéuticos OMS en HOSIX para prescripción controlada y gestión de proveedores.

**Sub-Objetivos:**
1. Cargar 600+ principios activos OMS con clasificación ATC
2. Integrar OMS LME para Guinea Ecuatorial (350+ medicamentos esenciales)
3. Implementar CRUD de proveedores con historial de compras
4. Mejorar selector de medicamentos en prescripción

---

## 🎯 ENTREGABLES

| Componente | Tipo | Líneas | Prioridad |
|-----------|------|--------|-----------|
| Migraciones BD | SQL | 250 | 🔴 ALTA |
| Seeds OMS (600 PA + 350 LME) | SQL | 400 | 🔴 ALTA |
| Hooks (PrincipiosActivos + Proveedores) | TS | 450 | 🟢 MEDIA |
| UI Managers (3 componentes) | React/TS | 600 | 🟢 MEDIA |
| Integración en Configuración | TS | 150 | 🟢 MEDIA |
| Testing + Documentación | MD | 450 | 🟢 MEDIA |
| **TOTAL** | | **2,300** | |

---

## 🏗️ ARQUITECTURA

### Tablas Principales
- `farmacia.principios_activos` - 600 PA OMS
- `farmacia.oms_lme` - 350 medicamentos esenciales
- `farmacia.proveedores` - Gestión de proveedores
- `farmacia.proveedores_productos` - Catálogo por proveedor
- `farmacia.historial_compras` - Auditoría de compras

### RPC (Remote Procedure Calls)
- `buscar_principios_activos()` - Búsqueda FTS
- `obtener_mejores_opciones()` - Mejor precio/disponibilidad
- `calcular_stock_proyectado()` - Proyección de stock

### Edge Functions
- Sincronización con catálogos externos (opcional)
- Alertas de precios (opcional)

---

## 📅 TIMELINE

| Período | Actividades | Estado |
|---------|------------|--------|
| DÍA 1-2 | Migraciones BD | ⏳ TODO |
| DÍA 2-3 | Seeds (OMS + LME) | ⏳ TODO |
| DÍA 3-4 | Hooks (usePA + useProveedores) | ⏳ TODO |
| DÍA 4-5 | Componentes UI (3x) | ⏳ TODO |
| DÍA 5-6 | Integración Configuración | ⏳ TODO |
| DÍA 6-7 | Testing completo | ⏳ TODO |
| DÍA 7-8 | Documentación final | ⏳ TODO |

**Duración Total:** 7-8 días (línea crítica)

---

## 💾 DEPENDENCIAS

**De Fases anteriores:**
- ✅ FASE 1: Datos Maestros (departamentos, especialidades, etc)
- ✅ FASE 2: CIE-11 (diagnósticos)
- ✅ FASE 3: Plantillas (receta médica)

**Externas:**
- 📥 Catálogo OMS (principios activos)
- 📥 OMS LME Guinea Ecuatorial
- 📥 Listado de proveedores locales

---

## 🔐 SEGURIDAD

**RLS Policies:**
- Principios activos: SELECT público (lectura), UPDATE/DELETE solo admin
- Proveedores: Lectura por roles autorizados, CRUD admin
- Historial de compras: Auditoría completa

**Validaciones:**
- Precios no negativos
- Cantidades mínimas/máximas coherentes
- Restricciones LME vs no-LME

---

## ⚠️ RIESGOS & MITIGACIONES

| Riesgo | Probabilidad | Mitigation |
|--------|-------------|-----------|
| Datos OMS incompletos | Media | Validación manual, seeds iterativos |
| FTS lento con 600 PA | Baja | Índices GIN + límites de resultados |
| LME desactualizada | Baja | Script de sincronización mensual |
| Cambios de precios frecuentes | Media | Auditoría y timestamps de cambio |

---

## ✅ SUCCESS CRITERIA

FASE 4 está COMPLETADA cuando:

- [ ] 600+ principios activos en BD (verificable con COUNT)
- [ ] 350+ medicamentos en LME (verificable con COUNT)
- [ ] Búsqueda FTS responde en < 200ms
- [ ] CRUD proveedores funcional (crear, editar, eliminar, ver historial)
- [ ] Selector medicamentos integrado y mejorado
- [ ] Tests pasan 100% sin errores
- [ ] Documentación actualizada
- [ ] Performance aceptable bajo carga

---

## 📂 ARCHIVOS A CREAR

```
implementacion_v3/FASE_4_Catalogos_Farmaceuticos/
├── PLAN_FASE4.md                    (513 líneas) ✅
├── RESUMEN_FASE4.md                 (esta archivo)
├── seeds/
│   ├── principios_activos_oms.sql   (TODO)
│   └── oms_lme_guinea_ecuatorial.sql (TODO)
├── Tests/
│   ├── TESTING_FASE4_FARMACIA.md    (TODO)
│   └── CHECKLIST_INTERACTIVO_FASE4.md (TODO)
└── Documentacion/
    └── RESULTADOS_FASE4.md          (TODO - después)

src/
├── hooks/
│   ├── usePrincipiosActivos.ts      (TODO)
│   └── useProveedores.ts            (TODO)
├── components/hosix/configuracion/
│   ├── PrincipiosActivosManager.tsx (TODO)
│   └── ProveedoresManager.tsx       (TODO)
├── components/hosix/prescripcion/
│   └── SelectorMedicamentosAvanzado.tsx (TODO)

supabase/migrations/
├── 20260606_023_principios_activos_lme.sql (TODO)
└── 20260607_024_proveedores.sql (TODO)
```

---

## 🚀 PRÓXIMOS PASOS

1. **Confirmar con usuario** si proceder con Fase 4
2. **Descargar catálogos OMS** (principios activos + LME)
3. **Iniciar DÍA 1:** Crear migraciones BD
4. **Iniciar DÍA 2:** Cargar seeds
5. **Continuar según timeline:** Hooks → UI → Testing → Docs

---

**FASE 4: LISTA PARA COMENZAR**

Próxima orden: iniciar implementación de Fase 4
