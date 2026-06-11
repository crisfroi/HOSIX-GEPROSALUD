# TESTING CONSOLIDADO: FASES 1, 2, 3
**Fecha:** 10-JUN-2026  
**Usuario:** superadmin@hosix.local  
**Status:** EN EJECUCIÓN

---

## 📋 TESTING PHASE 1: DATOS MAESTROS

### 1.1 Verificar Maestros Creados ✓

**Ruta:** `/hosix/configuracion` → Tab "Maestros"

**Checklist:**
- [ ] Tab "Departamentos" → Listar y filtrar
- [ ] Tab "Equipos" → Crear/editar/eliminar
- [ ] Tab "Especialidades" → Verificar cargas
- [ ] Tab "Unidades Funcionales" → CRUD funcional
- [ ] Tab "Roles Organizacionales" → Visualizar
- [ ] Tab "Cualificaciones" → Gestionar
- [ ] Tab "Zonas de Cobertura" → Búsqueda
- [ ] Tab "Proveedores" → Crear y editar
- [ ] Tab "Material Médico" → Listar
- [ ] Tab "Servicios Terceros" → Verificar activos

**Si algo falla:**
- Revisar: `implementacion_v3/FASE_1_Maestros_Datos/Documentacion/TESTING_FASE1_MAESTROS.md`
- Ejecutar: `implementacion_v3/FASE_1_Maestros_Datos/Documentacion/CHECKLIST_TESTING_INTERACTIVO.md`

---

## 📋 TESTING PHASE 2: CIE-11 INTEGRACIÓN

### 2.1 Verificar Selector CIE-11

**Rutas:**
- `/hosix/pacientes` → Buscar paciente → Editar historia
- `/hosix/consultas-medicas` → Nueva consulta → Selector diagnósticos
- `/hosix/urgencias` → Nueva atención → Diagnosticar
- `/hosix/hospitalizacion` → Nuevo ingreso → Diagnosticar alta

**Checklist:**
- [ ] Selector CIE-11 carga correctamente (WHO Embedded Coding Tool)
- [ ] Búsqueda de diagnósticos funciona
- [ ] Seleccionar múltiples diagnósticos
- [ ] Guardar diagnósticos en BD
- [ ] Diagnósticos persisten al recargar

**ICD-API Status:**
```bash
# Verificar que Docker está corriendo en puerto 8090
curl -s http://localhost:8090/swagger/index.html | head -20
```

**Si algo falla:**
- Revisar: `implementacion_v3/FASE_2_CIE11_Integracion/Documentacion/FASE_2_TESTING_DETALLADO.md`
- Logs: `/hosix/logs` o DevTools (F12) → Console

---

## 📋 TESTING PHASE 3: PLANTILLAS & DOCUMENTOS

### 3.1 Verificar Plantillas Cargadas ✓

**Ruta:** `/hosix/configuracion` → Tab "Plantillas"

**Checklist:**
- [ ] Listado de 24 plantillas visible
- [ ] Búsqueda por nombre funciona
- [ ] Filtro por grupo (médico, administrativo, control, BI)
- [ ] Click en plantilla → muestra detalles
- [ ] Tab "General" → editar propiedades
- [ ] Tab "Campos" → agregar/editar campos
- [ ] Tab "Preview" → visualizar HTML

**Esperado:**
- 7 plantillas médicas (alta, urgencias, consulta, quirúrgico, receta, laboratorio, certificado)
- 7 plantillas administrativas (consentimiento, revocación, cadáver, investigación, custodia, presupuesto, pagaré)
- 5 plantillas control (cargo quirúrgico, factura, cobertura, eventos adversos, reclamaciones)
- 5 plantillas BI (stock, mantenimiento, notificación EDO, indicadores, auditoría)

### 3.2 Crear Plantilla Nueva

**Pasos:**
1. Click "Nueva Plantilla"
2. Código: `TEST_PLANTILLA_001`
3. Nombre: `Plantilla de Prueba`
4. Tipo: `informe_alta`
5. Grupo: `medico`
6. Contenido HTML: `<h1>Prueba</h1>`
7. Tab "Campos" → Agregar campo:
   - Código: `paciente_nombre`
   - Nombre: `Nombre del Paciente`
   - Tipo: `text`
   - Requerido: ✓
8. Guardar

**Checklist:**
- [ ] Plantilla creada sin errores
- [ ] Aparece en listado
- [ ] Campo está asociado
- [ ] Se puede editar
- [ ] Se puede eliminar

### 3.3 Generar Documento PDF/DOCX

**Ruta:** `/hosix/pacientes` → Seleccionar paciente → "Generar Documento"

**Pasos:**
1. Seleccionar plantilla "Informe de Alta Hospitalaria"
2. Prellenado automático de datos:
   - [ ] Nombre del paciente
   - [ ] Fecha actual
   - [ ] Diagnósticos CIE-11 (si hay)
3. Editar si es necesario
4. Click "Generar PDF"
5. Verificar PDF se descarga
6. Click "Generar DOCX"
7. Verificar DOCX se descarga

**Checklist:**
- [ ] PDF válido (se abre en navegador)
- [ ] DOCX válido (se abre en Word/editor)
- [ ] Datos correctos en documento
- [ ] Formato profesional
- [ ] Sin errores en consola

### 3.4 Firma Digital (si es requerido)

**Pasos:**
1. Generar documento que requiere firma
2. En previsualización → área de firma
3. Dibujar firma con ratón
4. Click "Guardar con firma"
5. Verificar documento guardado

**Checklist:**
- [ ] Área de firma visible
- [ ] Se puede firmar
- [ ] Firma se guarda
- [ ] Aparece en PDF/DOCX

**Si algo falla:**
- Revisar: `implementacion_v3/FASE_3_Plantillas_Documentos/Tests/TESTING_FASE3_PLANTILLAS.md`
- Ejecutar: `implementacion_v3/FASE_3_Plantillas_Documentos/Tests/CHECKLIST_INTERACTIVO_FASE3.md`

---

## 🔴 BOTONES COLGADOS - DIAGNOSIS

El usuario menciona "muchos botones colgados". Esto puede ser:

1. **Componentes en desarrollo** → buscar elementos sin funcionalidad
2. **Llamadas a APIs faltantes** → DevTools (F12) → Network → ver 404/500
3. **Falta de permisos RLS** → Verificar que usuario tiene acceso
4. **Componentes sin finish** → Búsqueda de "TODO", "FIXME", console errors

**Cómo verificar:**

```javascript
// En DevTools Console
// 1. Ver todas las llamadas fallidas
console.log("Errores en Network:");
// Abrir DevTools → Network tab → filtrar por 404/500

// 2. Ver todos los console errors
// Abrir DevTools → Console tab → filtrar por "❌ Error"

// 3. Ver elementos sin onClick
document.querySelectorAll('button').forEach(btn => {
  if (!btn.onclick && !btn.getAttribute('onclick')) {
    console.warn('Botón sin handler:', btn.textContent);
  }
});
```

---

## 📊 ORDEN DE TESTING RECOMENDADO

1. **PRIMERO:** Phase 1 Maestros (5 min)
   - Verificar que todos los tabs funcionan
   - Si faltan: revisar la doc de testing

2. **SEGUNDO:** Phase 2 CIE-11 (10 min)
   - Verificar Docker en 8090
   - Buscar diagnóstico
   - Guardar en BD

3. **TERCERO:** Phase 3 Plantillas (10 min)
   - Listar plantillas ✓
   - Crear nueva ✓
   - Generar documento ✓

4. **CUARTO:** Investigar botones colgados (15 min)
   - DevTools Console
   - DevTools Network
   - Grep de "TODO" o "disabled"

---

## 📝 REPORTING

Después de testing, reporte:

```
✅ Phase 1: Maestros
   - Departamentos: OK
   - Especialidades: OK
   - ...

✅ Phase 2: CIE-11
   - Selector: OK
   - Persistencia: OK

✅ Phase 3: Plantillas
   - Listado 24: OK
   - Nueva plantilla: OK
   - PDF generation: OK

⚠️ Botones colgados encontrados:
   - [ruta]: [descripción del botón]
   - [ruta]: [descripción del botón]
```

---

**COMIENZA TESTING AHORA**

¿Reportas el status de Phase 1 primero?
