# DIAGNÓSTICO FASE 3: PLANTILLAS NO VISIBLES

**Problema:** Plantillas no aparecen en configuración aunque migraciones están aplicadas

---

## 🔍 PASO 1: VERIFICAR TABLA EN BD

Ejecutar en Supabase SQL Editor:

```sql
-- 1.1 ¿Existe la tabla?
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'plantillas_documentos'
) AS tabla_existe;
-- Esperado: true
```

**Resultado:** ___________

```sql
-- 1.2 ¿Hay datos en la tabla?
SELECT COUNT(*) as total FROM public.plantillas_documentos;
-- Esperado: 24 (si seeds aplicaron correctamente)
```

**Resultado:** ___________

```sql
-- 1.3 ¿Qué campos tiene la tabla?
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'plantillas_documentos'
ORDER BY ordinal_position;
```

**Resultado:** [ ] Ver columnas / [ ] Error

```sql
-- 1.4 ¿RLS habilitado?
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'plantillas_documentos';
```

**Esperado:** 
- relrowsecurity = true

**Resultado:** ___________

```sql
-- 1.5 ¿Políticas RLS correctas?
SELECT schemaname, tablename, policyname, qual 
FROM pg_policies 
WHERE tablename = 'plantillas_documentos';
```

**Esperado:** Debe haber al menos 1 política

**Resultado:** [ ] Hay políticas / [ ] No hay políticas

---

## 🔍 PASO 2: VERIFICAR SEED DATA

```sql
-- 2.1 ¿Seeds de plantillas aplicaron?
SELECT COUNT(*), grupo FROM public.plantillas_documentos 
GROUP BY grupo;
```

**Esperado:**
```
medico | 7
administrativo | 7
control | 5
bi | 5
```

**Resultado:**
```
[Pega aquí]
```

```sql
-- 2.2 ¿Plantas_campos existe?
SELECT COUNT(*) FROM public.plantillas_campos;
```

**Resultado:** ___________

---

## 🔍 PASO 3: VERIFICAR CONEXIÓN SUPABASE EN FRONTEND

**En el navegador, abre DevTools (F12) → Consola**

Copia y pega:

```typescript
import { supabase } from '@/integrations/supabase/hosixClient';

// Test 1: Fetch plantillas
const testPlantillas = async () => {
  console.log('🔍 TEST 1: Consultando plantillas_documentos...');
  try {
    const { data, error } = await supabase
      .from('plantillas_documentos')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ ERROR:', error);
      return;
    }
    console.log('✅ SUCCESS:', data);
  } catch (err) {
    console.error('❌ Exception:', err);
  }
};

testPlantillas();
```

**Resultado:** [ ] Datos retornados / [ ] Error en consola

Si hay error, anota:
```
Error message:
[Pega el error aquí]
```

---

## 🔍 PASO 4: VERIFICAR RLS POLICIES

Si los tests anteriores muestran error de permisos, el problema es RLS.

**En Supabase, revisar Policies:**

Ir a: SQL Editor → `plantillas_documentos` → Policy tab

**Policies esperadas:**
- [ ] SELECT policy (debe existir)
- [ ] INSERT policy (solo admin)
- [ ] UPDATE policy (solo admin)
- [ ] DELETE policy (solo admin)

```sql
-- Ver todas las políticas
SELECT * FROM pg_policies 
WHERE tablename = 'plantillas_documentos';
```

**Si no hay SELECT policy, crear:**

```sql
CREATE POLICY "plantillas_documentos_select" 
ON public.plantillas_documentos 
FOR SELECT 
USING (true);  -- Permitir SELECT para todos
```

---

## 🔍 PASO 5: VERIFICAR COMPONENTE EN CONFIGURACIÓN

**En el navegador:**

1. Ir a: `/hosix/configuracion`
2. Abrir DevTools (F12) → Consola
3. Ver si hay errores de import del componente

**Esperados errores a verificar:**

```
[ ] "PlantillasEditorAvanzado is not a function"
[ ] "Cannot read property 'from' of undefined"
[ ] "useHosixPlantillasAvanzado is not exported"
```

Si hay alguno, tomar screenshot del error.

---

## 🔍 PASO 6: VERIFICAR IMPORTACIONES

**Archivo:** `src/pages/Hosix/Configuracion.tsx`

Verificar línea 21:
```typescript
import { PlantillasEditorAvanzado } from '@/components/hosix/PlantillasEditorAvanzado';
```

✅ [ ] Import está presente
❌ [ ] Import NO está presente (hay que agregarlo)

**Archivo:** `src/components/hosix/PlantillasEditorAvanzado.tsx`

Verificar línea 2:
```typescript
import { useHosixPlantillasAvanzado, type Plantilla, type Campo } from '@/hooks/useHosixPlantillasAvanzado';
```

✅ [ ] Import está presente
❌ [ ] Import NO está presente

---

## 🔍 PASO 7: VERIFICAR TAB EN CONFIGURACIÓN

**En navegador:**

1. Ir a `/hosix/configuracion`
2. ¿Ves el tab "Plantillas" en la fila de tabs principales?

```
[ General ] [ Usuarios ] [ Profesionales ] [ Permisos ] [ Maestros ] [ Plantillas ] [ Seguridad ]
```

✅ [ ] Tab "Plantillas" VISIBLE
❌ [ ] Tab "Plantillas" NO VISIBLE

Si NO es visible, revisar `src/pages/Hosix/Configuracion.tsx` línea 42:
```typescript
<TabsTrigger value="plantillas">Plantillas</TabsTrigger>
```

Debe estar presente.

---

## 🔍 PASO 8: VERIFICAR TABSCONTENT

Si el tab es visible pero no muestra contenido:

**Revisar:** `src/pages/Hosix/Configuracion.tsx` línea 291+

Debe tener:
```typescript
{/* Plantillas */}
<TabsContent value="plantillas" className="space-y-4">
  <PlantillasEditorAvanzado />
</TabsContent>
```

✅ [ ] TabsContent presente
❌ [ ] TabsContent NO presente

---

## 🔧 POSIBLES SOLUCIONES

### Solución 1: RLS Policy Faltante
Si error es de permisos en paso 3:

```sql
CREATE POLICY "plantillas_documentos_select"
ON public.plantillas_documentos
FOR SELECT
USING (true);
```

### Solución 2: Tabla en Schema Incorrecto
Si tabla no existe en `public`:

```sql
-- Buscar en qué schema está
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%plantillas%';
```

Si está en otro schema (ej: `configuracion`), cambiar la query en el hook:

```typescript
const { data } = await supabase
  .from('configuracion.plantillas_documentos')  // <-- Cambiar schema
```

### Solución 3: Seeds No Aplicaron
Si `COUNT(*)` es 0:

Ejecutar manualmente seed data:
```sql
-- Ver archivo: supabase/migrations/20260606_seed_24_plantillas.sql
-- Y ejecutar manualmente en SQL Editor
```

### Solución 4: Import Faltante
Si error de import en consola:

Asegurar que archivo existe:
```
✅ src/components/hosix/PlantillasEditorAvanzado.tsx
✅ src/hooks/useHosixPlantillasAvanzado.ts
```

Si falta alguno, restaurar del repositorio o recrear.

---

## 📋 RESUMEN DIAGNÓSTICO

Completa este checklist final:

- [ ] Tabla `plantillas_documentos` existe
- [ ] COUNT(*) > 0 (hay datos)
- [ ] RLS policies están configuradas
- [ ] Frontend query retorna datos sin error
- [ ] TabsTrigger "Plantillas" es visible
- [ ] TabsContent "plantillas" existe
- [ ] PlantillasEditorAvanzado importado
- [ ] useHosixPlantillasAvanzado importado

Si todos están ✅, el problema está en el rendering del componente.

Si alguno está ❌, ejecutar la solución correspondiente arriba.

---

## 📞 PRÓXIMOS PASOS

**Si todos los checks pasan:**
- Component es renderizado pero no muestra plantas
- Revisar: ¿Hay datos pero componente no actualiza?
- Solución: Forzar refetch con `QueryClient.invalidateQueries`

**Si algún check falla:**
- Ejecutar solución correspondiente
- Repetir el diagnostic
- Confirmar que todos los checks pasan

---

**DIAGNÓSTICO LISTO PARA EJECUTAR**
