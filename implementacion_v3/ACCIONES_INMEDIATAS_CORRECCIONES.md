# ACCIONES INMEDIATAS - CORRECCIONES POST-TESTS

**Fecha:** 6 de Junio 2026
**Estado:** 3 problemas críticos detectados y parcialmente corregidos
**Responsabilidad:** Aplicar 1 acción manual, 2 ya están hechas

---

## ✅ CORRECCIONES APLICADAS AUTOMÁTICAMENTE

### 1. FASE 1 - Responsive Grid Bug

**Archivo:** `src/pages/Hosix/Configuracion.tsx`

```diff
- <TabsList className="grid w-full grid-cols-7">
+ <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1">
```

**Efecto:** La tab "Maestros" ahora será visible en todos los tamaños de pantalla.

**Testing:**
- Abre Configuración
- Debería ver todas 7 tabs (General, Usuarios, Profesionales, Permisos, Maestros, Plantillas, Seguridad)
- Click en Maestros → debería mostrar 12 subtabs

---

### 2. FASE 3 - Schema Inconsistency Fix

**Archivo:** `src/hooks/useHosixPlantillasAvanzado.ts`

**Cambios aplicados:** (8 ubicaciones)

```diff
- .from('plantillas_documentos')
+ .from('configuracion.plantillas_documentos')

- .from('plantillas_campos')
+ .from('configuracion.plantillas_campos')

- .from('documentos_generados')
+ .from('configuracion.documentos_generados')
```

**Líneas modificadas:**
- L122: Query plantillas (select)
- L150: Insert plantillas
- L182: Update plantillas
- L211: Insert campos
- L230: Update campos
- L249: Delete campos
- L268: Query documentos
- L302: Update documentos

**Efecto:** Las plantillas ahora se cargarán correctamente desde Supabase.

**Testing:**
- Abre Configuración → Tab Plantillas
- Deberías ver ~24 plantillas listadas
- Podrás crear/editar plantillas sin errores

---

## 🔴 ACCIÓN MANUAL REQUERIDA

### FASE 2 - Docker ICD No Está Corriendo

**Problema:** `net::ERR_CONNECTION_REFUSED` en puerto 8090

**Solución:**

#### Opción A: Si tienes docker-compose.yml configurado
```bash
cd /ruta/al/proyecto
docker-compose up -d
```

#### Opción B: Si necesitas crear el contenedor
```bash
# Ejecutar en terminal
docker run -d -p 8090:8080 --name icd11-server <imagen-icd>

# O si lo tienes parado
docker start icd11-server
```

#### Opción C: Verificar estado actual
```bash
# En terminal:
bash testing-scripts/check-icd-docker.sh

# Esto mostrará:
# - Si docker está instalado
# - Si hay contenedor ICD
# - Si está corriendo
# - Si responde en puerto 8090
```

**Verificación post-arranque:**
```bash
# En navegador:
http://localhost:8090/swagger/index.html

# Debería mostrar el Swagger del ICD API
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

Tras aplicar las correcciones, ejecuta este checklist:

### Fase 1 - Maestros
- [ ] Abre `http://localhost:8080` (o tu URL)
- [ ] Ve a Configuración
- [ ] Verifica que ves 7 tabs (incluida Maestros) en tamaño grande
- [ ] Click en Maestros
- [ ] Verifica que ves 12 subtabs
- [ ] Click en cada subtab (Departamentos, Equipos, etc.)
- [ ] ✅ Fase 1 OK si todos funcionan

### Fase 2 - CIE-11
- [ ] Verifica ICD API: `http://localhost:8090/swagger/index.html`
- [ ] Debería cargar sin `ERR_CONNECTION_REFUSED`
- [ ] Busca un formulario con CIE-11 (ej: Consulta Médica)
- [ ] Haz click en el selector CIE-11
- [ ] Verifica que carga la interfaz ECT
- [ ] ✅ Fase 2 OK si ECT carga

### Fase 3 - Plantillas
- [ ] Abre Configuración
- [ ] Click en tab Plantillas
- [ ] Debería mostrar lista de ~24 plantillas
- [ ] Verifica que NO hay error 404 en Network
- [ ] Verifica que NO hay error de RLS
- [ ] Puedes ver plantillas agrupadas por tipo
- [ ] ✅ Fase 3 OK si plantillas se muestran

---

## 🧪 SCRIPTS DE TESTING DISPONIBLES

Para diagnóstico detallado, usa estos scripts en DevTools Console (F12):

```javascript
// DIAGNOSIS COMPLETO
// testing-scripts/diagnose-all.js
// Copia y pega en Console

// DIAGNÓSTICO MAESTROS
// testing-scripts/debug-maestros.js
// Copia y pega en Console

// DIAGNÓSTICO PLANTILLAS
// testing-scripts/fix-plantillas-loading.js
// Copia y pega en Console
```

---

## 🔍 SI TODAVÍA HAY PROBLEMAS

### Maestros sigue sin aparecer
1. Abre DevTools (F12) → Network
2. Busca requests que fallen
3. Verifica que el CSS de Shadcn está cargando
4. Comprueba que no hay JavaScript errors

### Plantillas sigue mostrando 0
1. En Supabase Dashboard, ejecuta:
```sql
SELECT COUNT(*) as total,
       COUNT(CASE WHEN activo = true THEN 1 END) as activas
FROM configuracion.plantillas_documentos;
```
2. Si retorna 0, las seeds no se aplicaron
3. Aplica la migración: `supabase/migrations/20260606_seed_24_plantillas.sql`

### ICD API sigue sin responder
1. Verifica que Docker está corriendo: `docker ps`
2. Verifica logs: `docker logs icd11-server` (o el nombre del contenedor)
3. Verifica que el puerto 8090 está libre: `lsof -i :8090` (macOS/Linux)
4. Intenta reiniciar: `docker restart icd11-server`

---

## 📝 PRÓXIMOS PASOS

Tras verificar que las 3 fases funcionan:

1. ✅ Ejecutar tests interactivos de cada fase
2. ✅ Validar que NO hay errores en console
3. ✅ Verificar permisos de usuario autenticado
4. ✅ Iniciar Fase 4 (Catálogos Farmacéuticos)

---

## 📊 RESUMEN DE CAMBIOS

| Componente | Cambio | Status | Verificado |
|-----------|--------|--------|-----------|
| Configuracion.tsx | Grid responsivo | ✅ Aplicado | ⏳ Manual |
| useHosixPlantillasAvanzado.ts | 8 schema fixes | ✅ Aplicado | ⏳ Manual |
| Docker ICD | Requiere start | 🔴 Manual | ⏳ Manual |
| Plantillas DB | Requiere seed | ✅ Ya existe | ⏳ Manual |

---

**Contacto/Ayuda:** Si persisten problemas, revisa:
- `/implementacion_v3/DIAGNOSTICO_RESULTADOS_TESTS.md` - Análisis detallado
- Network tab en DevTools - Errores HTTP
- Logs de Supabase - RLS/Query issues
