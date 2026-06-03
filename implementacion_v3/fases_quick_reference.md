# FASES DE IMPLEMENTACIÓN V3 - QUICK REFERENCE

## 📌 FASE 1: CONFIGURACIÓN MAESTROS (Semana 1-2)

### 1.1 Departamentos como Entidad
**Archivos a crear/modificar:**
- `src/pages/Hosix/Configuracion.tsx` - Agregar tab "Departamentos"
- `src/components/hosix/DepartamentosManager.tsx` - CRUD nuevo
- `src/hooks/useHosixDepartamentos.ts` - Hook de datos nuevo

**Requisitos:**
- CRUD: Crear, Listar, Editar, Eliminar
- Vinculación con Servicios existentes
- Validaciones de duplicidad

**Aceptación:**
- [ ] Manager visible en Configuración
- [ ] CRUD funcional
- [ ] Listado de servicios vinculados

---

### 1.2 Matriz de Permisos Completa
**Archivos a modificar:**
- `src/hooks/useHosixPermisos.ts` - Expandir matriz
- `src/components/hosix/PermisosManager.tsx` - Mejorar UI

**Requisitos:**
- Matriz visual (módulos vs operaciones CRUD)
- Permisos por rol
- Permisos por usuario individual

**Aceptación:**
- [ ] Matriz visual completa
- [ ] Asignación por rol
- [ ] Asignación por usuario

---

### 1.3 Equipos Médicos
**Archivos a crear:**
- `src/components/hosix/EquiposMedicosManager.tsx` - CRUD nuevo
- `src/hooks/useHosixEquipos.ts` - Hook nuevo

**Requisitos:**
- CRUD: Crear equipos, Agregar médicos, Asignar permisos
- Listado de médicos por equipo
- Permisos heredados por equipo

**Aceptación:**
- [ ] Manager creado y accesible
- [ ] Creación de equipos funcional
- [ ] Asignación de médicos funcional

---

## 📌 FASE 2: CODIFICACIÓN & TERMINOLOGÍA (Semana 2-3)

### 2.1 Migración CIE-10 → CIE-11
**Archivos a modificar:**
- `src/hooks/useHosixCodificacion.ts` - Soportar ambas versiones
- Base de datos - Scripts de migración

**Requisitos:**
- Importar catálogo CIE-11
- Mapeo de equivalencias
- Selector dual durante transición

**Aceptación:**
- [ ] CIE-11 disponible en BD
- [ ] Selector permite ambas versiones
- [ ] Datos existentes CIE-10 consultables

---

### 2.2 Procedimientos Médicos
**Archivos a modificar:**
- `src/components/hosix/SelectorProcedimientos.tsx` - Mejorar
- Base de datos - Cargar catálogo completo

**Requisitos:**
- Catálogo de procedimientos por servicio
- Búsqueda rápida
- Vinculación con episodios

**Aceptación:**
- [ ] Selector funcional en formularios
- [ ] Búsqueda por descripción
- [ ] Procedimientos vinculados correctamente

---

## 📌 FASE 3: PLANTILLAS & DOCUMENTOS (Semana 3-4)

### 3.1 Editor de Plantillas Mejorado
**Archivos a crear/modificar:**
- `src/components/hosix/PlantillasEditor.tsx` - Nuevo/Mejorado
- Soporte drag-drop, campos dinámicos

**Requisitos:**
- Arrastrar/soltar campos
- Vista previa en tiempo real
- Guardado de versiones

**Aceptación:**
- [ ] Editor visual funcional
- [ ] Campos dinámicos insertables
- [ ] Vista previa visible

---

### 3.2 Plantillas Estándar x5
**Plantillas a crear:**
1. Informe de Alta Hospitalaria
2. Informe Urgencias
3. Informe Consulta Externa
4. Informe Quirúrgico
5. Plantilla Receta

**Aceptación:**
- [ ] 5 plantillas disponibles
- [ ] Pueden usarse en generación de documentos
- [ ] Admiten personalizaciones

---

## 📌 FASE 4: CATÁLOGOS FARMACÉUTICOS (Semana 4-5)

### 4.1 Principios Activos - Catálogo OMS
**Archivos a modificar:**
- Base de datos - Cargar principios activos OMS
- `src/hooks/useHosixMedicamentos.ts` - Vinculación

**Requisitos:**
- Cargar catálogo OMS (aproximadamente 600 principios activos)
- Selector mejorado en prescripción

**Aceptación:**
- [ ] Catálogo OMS en BD
- [ ] Selector funcional
- [ ] Búsqueda rápida por nombre

---

### 4.2 OMS LME (Listado de Medicamentos Esenciales)
**Requisitos:**
- Cargar LME vigente para país
- Marcado de medicamentos "de referencia"
- Reportes de uso vs recomendado

**Aceptación:**
- [ ] LME integrada
- [ ] Medicamentos marcados correctamente
- [ ] Reportes disponibles

---

### 4.3 CRUD de Proveedores
**Archivos a crear:**
- `src/components/hosix/ProveedoresManager.tsx` - CRUD nuevo
- `src/hooks/useHosixProveedores.ts` - Hook nuevo

**Requisitos:**
- CRUD: Crear, Editar, Eliminar proveedores
- Catálogo de productos por proveedor
- Precios y términos de pago
- Historial de compras

**Aceptación:**
- [ ] Manager visible en Configuración
- [ ] CRUD completo funcional
- [ ] Historial de compras visible

---

## 📌 FASE 5: 8 MÓDULOS ACCESIBLES (Semana 5-6)

| # | Módulo | Ruta | Estado | Fecha ✅ |
|----|--------|------|--------|---------|
| 1 | AdmisionCentral | `/hosix/admision-central` | ✅ Ruta OK | 3-jun |
| 2 | CRED | `/hosix/cred` | ✅ Ruta OK | 3-jun |
| 3 | Cajas | `/hosix/cajas` | ✅ Ruta OK | 3-jun |
| 4 | Compras | `/hosix/compras` | ✅ Ruta OK | 3-jun |
| 5 | Interconsultas | `/hosix/interconsultas` | ✅ Ruta OK | 3-jun |
| 6 | Recobros | `/hosix/recobros` | ✅ Ruta OK | 3-jun |
| 7 | Suministros | `/hosix/suministros` | ✅ Ruta OK | 3-jun |
| 8 | BI | `/hosix/bi` | ✅ Ruta OK | 3-jun |

**Próximos pasos por módulo:** Implementar funcionalidades básicas según Auditoría

---

## 📌 FASE 6: INTEGRACIONES (Semana 6-8)

### 6.1 Lab-HIS
- [ ] API solicitud pruebas
- [ ] Retorno de resultados
- [ ] Notificaciones

### 6.2 Imagenología-HIS
- [ ] API solicitud estudios
- [ ] Retorno de imágenes/reportes

### 6.3 Portal Web
- [ ] Portal nacional
- [ ] Acceso pacientes/sanitarios

### 6.4 Teleconsulta Mejorada
- [ ] Videoconferencia 720p+
- [ ] Chat
- [ ] Documentos

### 6.5 MPI Centralizado
- [ ] Búsqueda duplicados
- [ ] Sincronización asíncrona
- [ ] Historial centralizado

---

## ⏱️ TIMELINE GENERAL

```
Semana 1-2:  FASE 1 (Datos Maestros)
Semana 2-3:  FASE 2 (Codificación)
Semana 3-4:  FASE 3 (Plantillas)
Semana 4-5:  FASE 4 (Catálogos)
Semana 5-6:  FASE 5 (Módulos) + Paralelo FASE 1-4
Semana 6-8:  FASE 6 (Integraciones)
```

---

**Actualizado:** 3 de Junio 2026
