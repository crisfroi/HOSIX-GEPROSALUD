# TESTING FASE 3: PLANTILLAS & DOCUMENTOS

**Fecha:** 5-6 de Junio 2026  
**Migraciones Aplicadas:**
- ✅ `20260605_plantillas_mejoradas.sql`
- ✅ `20260606_seed_24_plantillas.sql`

**Edge Functions Desplegadas:**
- ✅ `generate-pdf`
- ✅ `generate-docx`

---

## 1. VERIFICACIÓN DE MIGRACIONES

### 1.1 Tablas Creadas

```sql
-- Verificar todas las tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'plantillas_%' OR table_name = 'documentos_%';
```

**Esperado:**
- [ ] `plantillas_documentos`
- [ ] `plantillas_campos`
- [ ] `plantillas_versiones`
- [ ] `documentos_generados`
- [ ] `documentos_firmas`
- [ ] `documentos_auditoria`

### 1.2 Columnas Verificadas

```sql
-- Verificar plantillas_documentos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'plantillas_documentos';
```

**Campos críticos:**
- [ ] `id` (uuid)
- [ ] `codigo` (text)
- [ ] `nombre` (text)
- [ ] `tipo` (text)
- [ ] `grupo` (text: medico|administrativo|control|bi)
- [ ] `campos` (jsonb)
- [ ] `validaciones` (jsonb)
- [ ] `contenido_html` (text)
- [ ] `export_pdf` (boolean)
- [ ] `export_docx` (boolean)
- [ ] `requiere_firma` (boolean)
- [ ] `activo` (boolean)
- [ ] `created_at` (timestamp)
- [ ] `updated_at` (timestamp)

```sql
-- Verificar plantillas_campos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'plantillas_campos';
```

**Campos críticos:**
- [ ] `id` (uuid)
- [ ] `plantilla_id` (uuid, FK)
- [ ] `codigo` (text)
- [ ] `nombre` (text)
- [ ] `tipo` (enum)
- [ ] `requerido` (boolean)
- [ ] `ancho` (text: full|half|third)
- [ ] `visible_en_exportacion` (boolean)

### 1.3 Seed Data Verificación

```sql
-- Contar plantillas cargadas
SELECT COUNT(*) as total_plantillas FROM plantillas_documentos;
```

**Esperado:** 24 plantillas distribuidas así:
- [ ] Médicas: 7 (alta, urgencia, consulta, quirúrgico, receta, laboratorio, certificado)
- [ ] Administrativas: 7 (consentimiento, revocación, cadáver, investigación, custodia, presupuesto, pagaré)
- [ ] Control: 5 (cargo quirúrgico, factura, cobertura, eventos adversos, reclamaciones)
- [ ] BI: 5 (stock, mantenimiento, notificación EDO, indicadores, auditoría)

```sql
-- Verificar grupos
SELECT grupo, COUNT(*) as cantidad 
FROM plantillas_documentos 
GROUP BY grupo;
```

**Esperado:**
```
medico        | 7
administrativo| 7
control       | 5
bi            | 5
```

---

## 2. VERIFICACIÓN DE EDGE FUNCTIONS

### 2.1 PDF Generation

**Test:** Generar PDF desde plantilla

```typescript
// Endpoint: POST /functions/v1/generate-pdf
{
  "plantilla_id": "uuid-de-plantilla",
  "datos": {
    "paciente_nombre": "Juan Pérez",
    "paciente_cedula": "1234567890",
    "diagnostico": "J45.9",
    "fecha": "2026-06-05"
  }
}
```

**Esperado:**
- [ ] Respuesta 200 OK
- [ ] Content-Type: `application/pdf`
- [ ] PDF descargable
- [ ] Sin cortes de página dentro de secciones
- [ ] Headers/footers correctos

**Validación CSS:**
- [ ] `break-inside: avoid` aplicado
- [ ] `orphans: 3; widows: 3` aplicado
- [ ] Tablas no cortadas

### 2.2 DOCX Generation

**Test:** Generar DOCX desde plantilla

```typescript
// Endpoint: POST /functions/v1/generate-docx
{
  "plantilla_id": "uuid-de-plantilla",
  "datos": {
    "paciente_nombre": "María González",
    "paciente_cedula": "0987654321",
    "diagnostico": "I10",
    "fecha": "2026-06-05"
  }
}
```

**Esperado:**
- [ ] Respuesta 200 OK
- [ ] Content-Type: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- [ ] DOCX abre en Word correctamente
- [ ] Estilos aplicados (`keepNext`, `keepLines`)
- [ ] Tablas formateadas correctamente

---

## 3. TESTS DE UI

### 3.1 Pestaña Plantillas en Configuración

**Ruta:** `/hosix/configuracion` → Tab "Plantillas"

**Acciones:**
1. [ ] Cargar página de configuración
2. [ ] Hacer click en tab "Plantillas"
3. [ ] Verificar listado de 24 plantillas
4. [ ] Búsqueda por nombre funciona
5. [ ] Filtro por grupo funciona

**Validaciones:**
- [ ] No hay errores en consola
- [ ] Loading state visible mientras carga
- [ ] Datos mostrados correctamente

### 3.2 Editar Plantilla

**Acción:** Seleccionar una plantilla y editar

1. [ ] Click en plantilla
2. [ ] Tab "General" muestra campos correctos
3. [ ] Tab "Campos" lista campos dinámicos
4. [ ] Tab "Previsualización" muestra HTML rendido

**Validaciones:**
- [ ] Cambios guardados sin errores
- [ ] Toast de éxito/error visible
- [ ] Plantilla actualizada en lista

### 3.3 Crear Plantilla Nueva

**Acción:** Crear plantilla personalizada

1. [ ] Click en botón "Nueva Plantilla"
2. [ ] Formulario aparece
3. [ ] Llenar campos (código, nombre, grupo, tipo)
4. [ ] Agregar 3 campos dinámicos
5. [ ] Guardar

**Validaciones:**
- [ ] Validación de código único
- [ ] Validación de nombre requerido
- [ ] Campos guardados correctamente
- [ ] Nueva plantilla aparece en listado

### 3.4 Agregar Campo Dinámico

**Acción:** Dentro de editor, agregar campo

1. [ ] Tab "Campos"
2. [ ] Click "Agregar Campo"
3. [ ] Seleccionar tipo (text, number, date, select, checkbox, signature, table)
4. [ ] Llenar código y nombre
5. [ ] Guardar

**Validaciones:**
- [ ] Campo aparece en lista
- [ ] Se puede editar
- [ ] Se puede eliminar
- [ ] Validaciones de tipo funcionan

---

## 4. TESTS FUNCIONALES

### 4.1 Generar Documento desde Plantilla (Alta Hospitalaria)

**Precondición:** Estar en Historias Clínicas > Hospitalización

1. [ ] Buscar paciente
2. [ ] Acceder a egreso/alta
3. [ ] Botón "Generar Documento" visible
4. [ ] Seleccionar plantilla "Informe de Alta Hospitalaria"
5. [ ] Prellenar datos automáticos (paciente, fechas, diagnósticos CIE-11)
6. [ ] Editar campos si es necesario
7. [ ] Generar PDF
8. [ ] Generar DOCX
9. [ ] Previsualizar antes de descargar

**Validaciones:**
- [ ] Datos del paciente prellenados correctamente
- [ ] Diagnósticos CIE-11 integrados
- [ ] PDF y DOCX válidos
- [ ] Documento guardado en BD

### 4.2 Documento con Firma Digital

**Precondición:** Plantilla requiere firma (`requiere_firma: true`)

1. [ ] Generar documento
2. [ ] Verlo en previsualización
3. [ ] Área de firma visible (canvas)
4. [ ] Dibujar firma
5. [ ] Guardar documento con firma
6. [ ] Verificar en `documentos_firmas`

**Validaciones:**
- [ ] Firma guardada en BD
- [ ] Firma aparece en PDF/DOCX
- [ ] Auditoria registra firma
- [ ] Documento marcado como firmado

### 4.3 Auditoría de Documentos

**Test:** Verificar registro de auditoría

```sql
SELECT * FROM documentos_auditoria 
WHERE documento_id = 'xxx' 
ORDER BY created_at DESC;
```

**Esperado:**
- [ ] Creación del documento registrada
- [ ] Ediciones registradas
- [ ] Firma registrada
- [ ] Usuario que realizó acción visible
- [ ] Timestamp correcto

---

## 5. TESTS DE RENDIMIENTO

### 5.1 Carga de Plantillas

**Test:** Tiempo de carga de 24 plantillas

```typescript
console.time('plantillas-load');
// [cargar plantillas]
console.timeEnd('plantillas-load');
```

**Esperado:** < 500ms

### 5.2 Generación de PDF

**Test:** Tiempo de generación de PDF

**Esperado:** < 2 segundos

### 5.3 Generación de DOCX

**Test:** Tiempo de generación de DOCX

**Esperado:** < 1 segundo

---

## 6. TESTS DE VALIDACIÓN

### 6.1 Validaciones de Plantilla

**Test:** Crear plantilla sin código

```typescript
// Debe fallar con error: "Código requerido"
```

**Test:** Código duplicado

```typescript
// Debe fallar con error: "Código ya existe"
```

### 6.2 Validaciones de Campo

**Test:** Campo sin nombre

```typescript
// Debe fallar con error: "Nombre requerido"
```

**Test:** Campo sin tipo

```typescript
// Debe fallar con error: "Tipo requerido"
```

---

## 7. INTEGRATION TESTS

### 7.1 Con CIE-11 Integration

**Test:** Documento médico con diagnósticos CIE-11

1. [ ] Crear Alta Hospitalaria con diagnóstico CIE-11
2. [ ] Generar documento
3. [ ] Verificar que CIE-11 (ej: B90.9) aparece en documento
4. [ ] Guardar documento

**Validaciones:**
- [ ] CIE-11 integrado correctamente
- [ ] Descripción del diagnóstico visible
- [ ] Documento guardado con referencia a CIE-11

### 7.2 Con Centros de Salud

**Test:** Documentos con datos del centro

1. [ ] Header incluye nombre del centro
2. [ ] Dirección del centro
3. [ ] Teléfono del centro
4. [ ] Logo del centro (si existe)

**Validaciones:**
- [ ] Datos del centro correcto
- [ ] Formato profesional

---

## 8. BROWSER TESTING

### 8.1 Chrome/Chromium

**Tests:**
- [ ] Editor carga correctamente
- [ ] PDF generation sin errores
- [ ] DOCX generation sin errores
- [ ] Preview muestra correctamente

### 8.2 Firefox

**Tests:**
- [ ] Editor funcional
- [ ] Descargas correctas

### 8.3 Safari

**Tests:**
- [ ] Compatibilidad con Web API
- [ ] Descarga de archivos

---

## 9. ERROR HANDLING

### 9.1 Plantilla no existe

**Test:** GET plantilla inexistente

```typescript
// GET /api/plantillas/invalid-id
// Esperado: 404 Not Found
```

### 9.2 Sin permisos

**Test:** Usuario sin permiso intenta generar

```typescript
// Esperado: 403 Forbidden
```

### 9.3 Edge Function timeout

**Test:** Generar PDF de plantilla muy compleja

```typescript
// Esperado: 408 Request Timeout o manejo graceful
```

---

## 10. CHECKLIST FINAL

- [ ] Todas las 24 plantillas en BD
- [ ] Editor en Configuración → Plantillas
- [ ] CRUD plantillas funcional
- [ ] CRUD campos funcional
- [ ] PDF generation funciona
- [ ] DOCX generation funciona
- [ ] Firma digital funciona
- [ ] Auditoría registra cambios
- [ ] Validaciones funcionan
- [ ] Tests de rendimiento OK
- [ ] Browser testing OK
- [ ] Integración CIE-11 OK
- [ ] Documentación actualizada

---

**Estado:** ✅ READY FOR TESTING
