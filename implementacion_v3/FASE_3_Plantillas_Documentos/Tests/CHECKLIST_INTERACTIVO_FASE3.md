# CHECKLIST INTERACTIVO FASE 3

## 1. VERIFICACIÓN DE BD ✓

```bash
# Ejecutar en Supabase SQL Editor:

-- 1.1 Contar plantillas
SELECT COUNT(*) FROM plantillas_documentos;
-- Esperado: 24

-- 1.2 Contar por grupo
SELECT grupo, COUNT(*) FROM plantillas_documentos GROUP BY grupo;
-- Esperado: medico=7, administrativo=7, control=5, bi=5

-- 1.3 Verificar campos en primera plantilla
SELECT id, codigo, nombre, grupo FROM plantillas_documentos LIMIT 1;

-- 1.4 Contar campos de una plantilla
SELECT COUNT(*) FROM plantillas_campos WHERE plantilla_id = '<id>';
```

**Estado:** [ ]

---

## 2. VERIFICACIÓN DE UI ✓

### 2.1 Acceder a Configuración

```
Ruta: http://localhost:5173/hosix/configuracion
Tab: "Plantillas"
```

**Esperado:**
- [ ] Página carga sin errores
- [ ] Listado de 24 plantillas visible
- [ ] Buscador funciona
- [ ] Filtro por grupo funciona

**Estado:** [ ]

### 2.2 Editar Plantilla

1. [ ] Seleccionar "Informe de Alta Hospitalaria"
2. [ ] Tab "General" muestra datos
3. [ ] Tab "Campos" lista campos
4. [ ] Tab "Preview" muestra HTML

**Estado:** [ ]

### 2.3 Crear Nueva Plantilla

1. [ ] Clic "Nueva Plantilla"
2. [ ] Código: `TEST_001`
3. [ ] Nombre: `Test Template`
4. [ ] Tipo: `informe_alta`
5. [ ] Grupo: `medico`
6. [ ] Guardar

**Esperado:** Plantilla aparece en listado

**Estado:** [ ]

### 2.4 Agregar Campo Dinámico

1. [ ] Tab "Campos"
2. [ ] Clic "Agregar Campo"
3. [ ] Código: `campo_prueba`
4. [ ] Nombre: `Campo de Prueba`
5. [ ] Tipo: `text`
6. [ ] Guardar

**Esperado:** Campo aparece en lista

**Estado:** [ ]

---

## 3. VERIFICACIÓN DE GENERACIÓN ✓

### 3.1 PDF Generation

```typescript
// En consola del navegador (F12)
fetch('/functions/v1/generate-pdf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    plantilla_id: 'xxx',
    datos: { paciente_nombre: 'Test' }
  })
})
.then(r => r.blob())
.then(b => {
  const url = URL.createObjectURL(b);
  window.open(url);
});
```

**Esperado:**
- [ ] Respuesta 200 OK
- [ ] PDF se abre en navegador
- [ ] PDF válido (no corrupto)

**Estado:** [ ]

### 3.2 DOCX Generation

```typescript
fetch('/functions/v1/generate-docx', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    plantilla_id: 'xxx',
    datos: { paciente_nombre: 'Test' }
  })
})
.then(r => r.blob())
.then(b => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = 'test.docx';
  a.click();
});
```

**Esperado:**
- [ ] DOCX descargado
- [ ] Se abre en Word correctamente
- [ ] Estilos aplicados

**Estado:** [ ]

---

## 4. VERIFICACIÓN DE INTEGRACIÓN ✓

### 4.1 Alta Hospitalaria con CIE-11

1. [ ] Ir a Historias Clínicas → Paciente → Hospitalización
2. [ ] Acceder a egreso/alta
3. [ ] Ver botón "Generar Documento"
4. [ ] Seleccionar "Informe de Alta"
5. [ ] Diagnósticos CIE-11 prellenados
6. [ ] Generar PDF
7. [ ] Verificar en documento

**Esperado:**
- [ ] Diagnósticos CIE-11 visible en PDF
- [ ] Datos del paciente correcto
- [ ] Centro de salud correcto

**Estado:** [ ]

### 4.2 Firma Digital

1. [ ] Generar documento que requiere firma
2. [ ] Area de firma visible
3. [ ] Dibujar firma
4. [ ] Guardar documento

**Esperado:**
- [ ] Firma guardada
- [ ] Firma aparece en PDF
- [ ] Auditoria registra firma

**Estado:** [ ]

---

## 5. VERIFICACIÓN DE AUDITORÍA ✓

```sql
-- En Supabase
SELECT * FROM documentos_auditoria 
ORDER BY created_at DESC 
LIMIT 10;

-- Debe mostrar:
-- - creacion
-- - edicion
-- - firma
-- - usuario_id
-- - timestamp
```

**Esperado:** [ ] Auditoría registra correctamente

**Estado:** [ ]

---

## 6. CONSOLE CHECKS ✓

**Abrir DevTools (F12) → Consola**

- [ ] No hay errores rojos
- [ ] No hay warnings críticos
- [ ] Network: todas las llamadas exitosas (200/201)
- [ ] Edge Functions responden correctamente

**Estado:** [ ]

---

## 7. PERFORMANCE ✓

**En DevTools → Performance**

1. [ ] Carga de plantillas: < 500ms
2. [ ] Generación de PDF: < 2s
3. [ ] Generación de DOCX: < 1s
4. [ ] Edición de plantilla: responde inmediatamente

**Estado:** [ ]

---

## ✅ RESUMEN

| Aspecto | Estado | Notas |
|---------|--------|-------|
| BD Plantillas | [ ] | 24 plantillas cargadas |
| UI Plantillas | [ ] | Editor funcional |
| PDF Generation | [ ] | Documentos válidos |
| DOCX Generation | [ ] | Descarga correcta |
| CIE-11 Integration | [ ] | Diagnósticos integrados |
| Firma Digital | [ ] | Guardada y visible |
| Auditoría | [ ] | Registra cambios |
| Console Clean | [ ] | Sin errores |
| Performance OK | [ ] | Tiempos aceptables |

---

**READY FOR PHASE 4:** [ ]
