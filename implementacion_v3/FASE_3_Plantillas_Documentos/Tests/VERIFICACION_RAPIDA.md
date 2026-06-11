# VERIFICACIÓN RÁPIDA - CORRECCIONES APLICADAS

**Problema Identificado:** Schema incorrecto en referencias a tablas

**Fecha Corrección:** 6-JUN-2026

---

## ✅ CORRECCIONES REALIZADAS

### 1. Hook: useHosixPlantillasAvanzado.ts

**Problema:**
- Consultaba `plantillas_documentos` (schema público)
- Las migraciones crearon en `configuracion.plantillas_documentos`

**Solución:**
- ✅ Cambié todas las referencias de `plantillas_documentos` → `configuracion.plantillas_documentos`
- ✅ Cambié todas las referencias de `plantillas_campos` → `configuracion.plantillas_campos`
- ✅ Cambié todas las referencias de `documentos_generados` → `configuracion.documentos_generados`

**Archivos afectados:**
```typescript
// Línea 122: cambio realizado
.from('configuracion.plantillas_documentos')

// Línea 150: cambio realizado
.from('configuracion.plantillas_documentos')

// Línea 182: cambio realizado
.from('configuracion.plantillas_documentos')

// Línea 211: cambio realizado
.from('configuracion.plantillas_campos')

// Línea 231: cambio realizado
.from('configuracion.plantillas_campos')

// Línea 249: cambio realizado
.from('configuracion.plantillas_campos')

// Línea 267: cambio realizado
.from('configuracion.documentos_generados')

// Línea 286: cambio realizado
.from('configuracion.documentos_generados')

// Línea 303: cambio realizado
.from('configuracion.documentos_generados')
```

### 2. Componente: PlantillasEditorAvanzado.tsx

**Problema:**
- Faltaba import de `useState` y `useMemo`

**Solución:**
- ✅ Agregué: `import React, { useState, useMemo } from 'react';`

---

## 🧪 CÓMO VERIFICAR QUE FUNCIONA

### Paso 1: Ir a Configuración
```
http://localhost:5173/hosix/configuracion
→ Tab: "Plantillas"
```

### Paso 2: Abrir DevTools
```
F12 → Consola
```

### Paso 3: Copiar y Pegar Test
```typescript
// Test de conexión
import { supabase } from '@/integrations/supabase/hosixClient';

const test = async () => {
  console.log('🔍 TEST: Consultando plantillas...');
  const { data, error } = await supabase
    .from('configuracion.plantillas_documentos')
    .select('*')
    .eq('activo', true)
    .limit(3);
  
  if (error) {
    console.error('❌ ERROR:', error);
  } else {
    console.log('✅ SUCCESS! Encontradas ' + (data?.length || 0) + ' plantillas');
    console.log(data);
  }
};

test();
```

### Paso 4: Verificar Resultado
```
✅ Esperado: "SUCCESS! Encontradas 24 plantillas"
❌ Error: Revisar mensaje de error
```

---

## 📋 CHECKLIST FINAL

- [ ] Ir a `/hosix/configuracion`
- [ ] Hacer click en tab "Plantillas"
- [ ] ¿Se ve algo cargando? (Loading state)
- [ ] ¿Aparece listado de plantillas?
- [ ] ¿Puedes hacer click en una plantilla?
- [ ] ¿Aparecen tabs: General, Campos, Preview?
- [ ] Abrir DevTools → Consola
- [ ] ¿Hay errores rojos?
- [ ] Ejecutar test anterior
- [ ] ¿Retorna datos?

Si TODO está ✅, entonces **FASE 3 ESTÁ FUNCIONANDO CORRECTAMENTE**.

---

## 🚨 SI SIGUE SIN FUNCIONAR

Si después de estas correcciones aún no ves plantillas:

1. **Hardrefresh** del navegador: `Ctrl+Shift+R` (Windows) o `Cmd+Shift+R` (Mac)
2. **Limpiar caché** de React Query: Abrir DevTools → Application → Local Storage → Buscar `react-query` y limpiar
3. **Reiniciar dev server** si tienes acceso

Si el test de consola aún da error:
- Ejecutar el diagnóstico completo: `DIAGNOSTICO_FASE3.md`

---

## 📝 NOTAS TÉCNICAS

**Por qué ocurrió el error:**

Las migraciones originales de Fase 3 (`20260605_plantillas_mejoradas.sql`) expandieron tablas en el schema `configuracion`:

```sql
ALTER TABLE configuracion.plantillas_documentos
  ADD COLUMN IF NOT EXISTS campos JSONB DEFAULT NULL,
  ...
```

Pero el nuevo hook asumió que estaban en el schema público (por defecto). Esto es un error común en Supabase cuando se usan múltiples schemas.

**Cómo evitar en el futuro:**

Siempre especificar el schema completo en los queries de Supabase:
```typescript
.from('configuracion.plantillas_documentos')  // ✅ Correcto
.from('plantillas_documentos')                 // ❌ Ambiguo
```

---

**CORRECCIONES COMPLETADAS**

Próxima acción: Verificar que funciona + ejecutar tests
