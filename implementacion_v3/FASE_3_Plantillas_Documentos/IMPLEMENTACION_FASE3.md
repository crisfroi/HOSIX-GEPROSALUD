# IMPLEMENTACIÓN FASE 3 - PLAN EJECUTIVO

**Fecha:** 5 de Junio 2026  
**Estado:** 🟢 INICIANDO IMPLEMENTACIÓN  
**Código Base Detectado:** ✅ SÍ

---

## 📋 CÓDIGO BASE EXISTENTE

### Tablas BD Existentes
```
schema: configuracion
├── plantillas_documentos (migraciones/20260603_010)
│   └── Campos: id, codigo, nombre, tipo, contenido_html, variables, versión, activo
└── documentos_generados
    └── Campos: id, plantilla_id, episodio_id, paciente_id, contenido_final, pdf_url, firma
```

### Componentes Existentes
- `src/components/hosix/pacientes/PlantillasManager.tsx` (611 líneas)
  - Ya integrado en `/pacientes` tab "Plantillas"
  - Usa `html2canvas` + `jsPDF` para generación
  - Variables simples: {{paciente.nombre}}, {{usuario.nombre}}, etc.

### Hooks Existentes
- `useHosixPacientes()` en hooks
  - `listarPlantillasDocumentos()`
  - `crearPlantillaDocumento()`
  - `generarDocumentoDesdePlantilla()`

---

## 🎯 ESTRATEGIA DE IMPLEMENTACIÓN

### FASE 3A: MEJORAR INFRAESTRUCTURA BASE (Días 1-2)

**1. Expandir Migraciones BD**
- Nueva tabla: `hosix_plantillas_esquemas` (definiciones de campos)
- Nueva tabla: `hosix_plantillas_versiones` (historial)
- Agregar columnas a `configuracion.plantillas_documentos`:
  - `campos JSONB` (definición de campos dinámicos)
  - `validaciones JSONB` (esquema zod serializado)
  - `export_pdf BOOLEAN`
  - `export_docx BOOLEAN`

**Archivo:** `supabase/migrations/20260605_plantillas_mejoradas.sql`

---

### FASE 3B: CREAR EDITOR ENTERPRISE (Días 2-4)

**Reemplazar/Mejorar PlantillasManager:**

1. **Nuevo componente:** `src/components/hosix/PlantillasEditor.tsx`
   - Interfaz visual para crear campos dinámicos
   - Drag-drop de elementos
   - Vista previa en tiempo real con paginación CSS

2. **Nuevo hook:** `src/hooks/useHosixPlantillasAvanzado.ts`
   - Manejo de campos complejos (Zod validation)
   - Generación de esquemas JSON
   - Versionado automático

3. **Actualizar integración:** `src/pages/Hosix/Configuracion.tsx`
   - Agregar tab "Plantillas" en Configuración (no solo en pacientes)
   - Acceso administrativo para crear/editar

---

### FASE 3C: IMPLEMENTAR 24 PLANTILLAS (Días 4-7)

**Seed data SQL:** `supabase/migrations/20260606_seed_24_plantillas.sql`

Insertar definiciones de las 24 plantillas con:
- Campos validados (Zod schemas)
- Variables CIE-11 integradas
- Configuración PDF/DOCX

**Categorización:**
- 12 Plantillas médicas
- 5 Plantillas administrativas
- 5 Plantillas de control
- 2 Plantillas de BI

---

### FASE 3D: GENERACIÓN PDF/DOCX (Días 5-7)

**Opción 1: Playwright en Edge Function (Recomendado)**
- `supabase/functions/generate-pdf/index.ts`
- Renderiza HTML con CSS Paginado
- Genera PDF clean sin saltos rotos

**Opción 2: Librería docx para DOCX**
- `supabase/functions/generate-docx/index.ts`
- Crea DOCX con control OpenXML
- Permite edición posterior en Word

---

## 📊 DESGLOSE REALISTA

| Fase | Tarea | Días | Archivos | Status |
|------|-------|------|----------|--------|
| 3A | Migraciones BD + Esquemas | 2 | 1 SQL | 🔴 |
| 3B | Editor Enterprise | 2 | 3 TSX + 1 TS | 🔴 |
| 3C | 24 Plantillas (seed) | 2 | 1 SQL | 🔴 |
| 3D | Generación PDF/DOCX | 2 | 2 TS (Edge Fn) | 🔴 |
| 3E | Testing + Documentación | 1 | - | 🔴 |

**Total Realista:** 7-9 días (vs 5-7 optimista)

---

## 🔧 ORDEN DE EJECUCIÓN RECOMENDADO

### Día 1: BD + Esquemas
1. Crear migración con nuevas tablas
2. Expandir columnas existentes
3. Verificar integridad referencial

### Día 2: Hook Mejorado
1. Crear `useHosixPlantillasAvanzado.ts`
2. Validaciones Zod
3. Query de plantillas con esquemas

### Día 3: Editor UI
1. Nueva UI para editor (drag-drop)
2. Preview CSS paginado
3. Integración con hook

### Día 4: Seed Plantillas Médicas
1. Insertar 12 plantillas médicas
2. Testing básico en UI
3. Validar variables

### Día 5: Seed Admin + Control
1. Insertar 7 plantillas admin/control
2. Insertar 2 plantillas BI
3. Testing completo

### Día 6: Generación PDF
1. Edge Function Playwright
2. CSS Paginado en acción
3. Testing sin saltos rotos

### Día 7: Generación DOCX
1. Edge Function docx
2. OpenXML control
3. Testing edición en Word

### Día 8-9: Polish + Docs
1. Testing integracion
2. Documentacion
3. Bugfixes

---

## ⚠️ CONSIDERACIONES TÉCNICAS

### HTML2Canvas → Playwright
**Problema:** html2canvas tiene limitaciones con CSS paginado
**Solución:** Usar Playwright para renderizar real en browser headless

### Variables Dinámicas
**Actual:** Reemplazo simple `{{campo}}`
**Mejorado:** Soporte para:
- Condicionales: `{{#if diagnostico}}...{{/if}}`
- Loops: `{{#each medicamentos}}...{{/each}}`
- Formatos: `{{fecha | format:'dd/MM/yyyy'}}`

### Versionado
**Actual:** Campo `version INT`
**Mejorado:** Tabla `hosix_plantillas_versiones` con:
- Registro de cambios
- Auditoría completa
- Rollback a versión anterior

---

## ✅ CRITERIOS DE ACEPTACIÓN

- [ ] Editor funcional (crear plantilla en UI)
- [ ] 24 plantillas insertadas en BD
- [ ] Generación PDF sin saltos rotos
- [ ] Generación DOCX editable
- [ ] Variables CIE-11 integradas
- [ ] Versionado funcionando
- [ ] Testing completado
- [ ] Documentacion lista

---

## 📝 PRÓXIMOS PASOS

1. ✅ Crear migración BD (Día 1)
2. ✅ Crear hook mejorado (Día 2)
3. ✅ Crear editor (Día 3)
4. ✅ Seed plantillas (Días 4-5)
5. ✅ PDF + DOCX (Días 6-7)
6. ✅ Testing + Docs (Días 8-9)

---

**Comencemos con Día 1: Migraciones BD**

Versión: 1.0  
Estado: LISTO PARA IMPLEMENTAR
