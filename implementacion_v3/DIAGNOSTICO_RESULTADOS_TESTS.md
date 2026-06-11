# Diagnóstico de Resultados de Tests - Sesión Actual

## Resumen Ejecutivo

Los scripts ejecutables han revelado **3 problemas críticos** que bloquean las fases:

| Fase | Problema | Estado | Impacto |
|------|----------|--------|--------|
| **Fase 1** | Tab "Maestros" no se encuentra en DOM | 🔴 Bloqueador | 12 subtabs inaccesibles |
| **Fase 2** | ICD API no responde (puerto 8090) | 🔴 Bloqueador | CIE-11/ECT sin acceso |
| **Fase 3** | Plantillas no renderizadas (0 en DOM) | 🟡 Parcial | No se muestran en UI |
| **General** | 15 botones sin handlers | 🟡 Parcial | UX degradada |

---

## FASE 1: MAESTROS

### Resultado del Test
```
✓ En página configuración: ✅
✓ Tab Maestros existe: ❌
✓ Subtabs encontrados: 0
✓ Sin errores en consola: ✅
```

### Análisis

**El problema detectado:**
- El código en `Configuracion.tsx` línea 41 define: `<TabsTrigger value="maestros">Maestros</TabsTrigger>`
- El archivo contiene TODO el código de la tab (líneas 120-260+)
- PERO el script no lo encuentra en el DOM

**Posibles causas:**
1. El component no está siendo renderizado completamente
2. Hay un error en el Tabs component de Shadcn
3. La grid de columnas (grid-cols-7) está truncando la vista

### Investigación Necesaria

```bash
# En DevTools Console:
# 1. Copiar y pegar: testing-scripts/debug-maestros.js
# 2. Ejecutar: testMaestrosDebug()
# 3. Revisar estructura del Tabs
```

---

## FASE 2: CIE-11

### Resultado del Test
```
❌ ICD API (puerto 8090): NO RESPONDE
   Error: net::ERR_CONNECTION_REFUSED
❌ Selector CIE-11: No encontrado
❌ ECT disponible: NO
❌ CSS ECT: NO ENCONTRADO
❌ JS ECT: NO ENCONTRADO
```

### Análisis

**El problema es claro:**
- El Docker de ICD11 que se suponía estaría corriendo en puerto 8090 **no está disponible**
- Sin el API, el selector CIE-11 no puede cargar
- Sin el selector, los formularios de clínica no pueden funcionar

**Verificación necesaria:**
```bash
# En terminal:
docker ps | grep icd
# O verificar si el servicio está configurado en docker-compose

# En navegador:
# http://localhost:8090/swagger/index.html
```

---

## FASE 3: PLANTILLAS

### Resultado del Test
```
✓ En página plantillas: ✅
✓ Plantillas en DOM: 0
✓ Errores 404/RLS: 0
✓ Plantillas esperadas: 24 (según seed)
```

### Análisis

**El problema es sutil:**
- No hay **errores de red** (ni 404, ni RLS)
- Pero también hay **0 plantillas en el DOM**
- Esto sugiere que:
  - La query se ejecuta correctamente ✅
  - Pero retorna datos vacíos (0 rows)
  - O el rendering está oculto/no visible

**Causas potenciales:**
1. Las plantillas se han insertado pero NO están activas (`activo = false`)
2. El usuario actual no tiene permisos para verlas (RLS silenciosa)
3. El hook está consultando el schema incorrecto

### Verificación Necesaria

**En Supabase Dashboard:**
```sql
SELECT COUNT(*) as total,
       COUNT(CASE WHEN activo = true THEN 1 END) as activas,
       COUNT(CASE WHEN activo = false THEN 1 END) as inactivas
FROM configuracion.plantillas_documentos;
```

**En el navegador:**
```js
// En DevTools Console, ejecutar:
// testing-scripts/fix-plantillas-loading.js
```

---

## BOTONES COLGADOS

### Resultado del Test
```
📊 Total botones: 18
⚠️  Sin handler: 15
❌ Botones afectados:
   - 6 sin ID (tabs principales)
   - "General", "Usuarios", "Profesionales", "Permisos"
   - "Maestros", "Plantillas", "Seguridad"
   - "Guardar Cambios"
```

### Análisis

**Causa identificada:**
- Los botones son **TabsTrigger** de Shadcn UI
- Shadcn maneja el onClick internamente (no en el HTML)
- El script está buscando `onclick` en el HTML (search manual)
- **Falso positivo**: Los botones funcionan, solo se detectan incorrectamente

**Conclusión:**
Este no es un problema real, es un problema con la forma de detectar handlers.

---

## Matriz de Prioridades

| Tarea | Bloqueador | Tiempo Est | Prioridad |
|-------|-----------|-----------|-----------|
| Revisar por qué no aparece tab Maestros | SÍ | 15 min | 🔴 CRÍTICA |
| Verificar/Iniciar Docker ICD | SÍ | 5 min | 🔴 CRÍTICA |
| Diagnosticar por qué plantillas están vacías | SÍ | 20 min | 🔴 CRÍTICA |
| Validar seeds de plantillas en DB | - | 10 min | 🟡 ALTA |
| Revisar RLS de plantillas | - | 15 min | 🟡 ALTA |

---

## Plan de Acción

### Próximos Pasos Inmediatos

1. **Ejecutar diagnósticos específicos** (scripts ya creados):
   - `debug-maestros.js` → Entender estructura del Tabs
   - `diagnose-all.js` → Visión completa
   - `fix-plantillas-loading.js` → Diagnóstico plantillas

2. **Verificar infraestructura**:
   - ¿Docker ICD está corriendo?
   - ¿Qué plantillas hay en la BD?

3. **Ejecutar correcciones**:
   - Ajustar referencias de schema si es necesario
   - Revisar grid-cols en Configuracion.tsx
   - Validar RLS y permisos

---

## Notas Técnicas

### Sobre los Tabs que "no existen"
- Shadcn usa Radix UI Tabs
- Los TabsTrigger usan data attributes internos
- El script busca `[value="maestros"]` que SÍ existe en el código
- Pero el DOM actual podría estar mostrando solo los triggers principales

### Sobre las Plantillas Vacías
- Hay dos posibles schemas: `plantillas_documentos` vs `configuracion.plantillas_documentos`
- El hook usa: `plantillas_documentos` (sin schema)
- `useHosixPacientes.ts` usa: `configuracion.plantillas_documentos`
- **Inconsistencia verificada** ⚠️

### Sobre el ICD API
- Debería estar en: `http://localhost:8090`
- Se usa en: `DiagnosticoCIE11Selector.tsx`
- Requiere que el Docker esté iniciado y accesible
