# REFERENCIA DOCUMENTOS - IMPLEMENTACIÓN V3

## 📋 Documentos Base

### 1. FUNCIONALIDADES DE MÓDULOS
**Ubicación Original:** `.../HOSIX-GEPROSALUD/funcionalidades modulos HOSIX GEPROSTEC.pdf`

**Contenido:**
- Catálogo completo de funcionalidades requeridas
- Descripción detallada por módulo
- Casos de uso y flujos de proceso
- Requisitos técnicos y de integración

**Módulos Documentados:**
- Configuración de Datos Maestros
- Configuración de Maestros Locales
- Usuarios/Perfiles/Seguridad
- MPI (Master Patient Index)
- Historia Clínica Electrónica
- Portal WEB
- BI (Business Intelligence)
- Módulos Administrativos
- Módulos Asistenciales
- Módulos Complementarios

---

### 2. AUDITORÍA FUNCIONAL (3 JUN 2026)
**Ubicación Original:** `.../HOSIX-GEPROSALUD/HOSIX_Auditoria_Funcional_03jun2026.docx`

**Contenido:**
- Estado actual de implementación por módulo (COMPLETO/PARCIAL)
- Brechas identificadas
- Detalles sobre qué falta o cómo implementarlo
- Recomendaciones de acción

**Estados Registrados:**
- ✅ COMPLETO: 14 módulos
- ⚠️ PARCIAL: 7 módulos + 1 grupo
- ❌ NO ACCESIBLE: 8 módulos (rutas no registradas)

---

## 🔗 Vinculación con Plan V3

| Auditoría | Plan V3 | Acción |
|-----------|---------|--------|
| Datos Maestros (PARCIAL) | FASE 1 | Completar departamentos, RRHH, equipos |
| Codificación (PARCIAL) | FASE 2 | Migración CIE-11, procedimientos |
| Plantillas (PARCIAL) | FASE 3 | Editor mejorado + catálogo estándar |
| Material Médico (PARCIAL) | FASE 4 | Catálogos OMS, proveedores |
| Módulos No Accesibles | FASE 5 | Registrar rutas + funcionalidades básicas |
| Integraciones | FASE 6 | Laboratorio, Imagenología, Portal |

---

## 📝 Uso del Log

El archivo `log_implementacion_v3.md` contiene:
1. **Resumen Ejecutivo** - Estado actual consolidado
2. **Plan por Fases** - Desglose de trabajo
3. **Matriz de Priorización** - Orden de ejecución
4. **Seguimiento** - Progreso semanal

**Cada item completado:**
- Se marca con ✅ en el log
- Se documenta fecha de finalización
- Se actualiza porcentaje de fase

---

## 📊 Estructura de Carpeta

```
implementacion_v3/
├── log_implementacion_v3.md          ← PLAN MAESTRO (este archivo)
├── referencia_documentos.md          ← ÍNDICE (este archivo)
├── funcionalidades_modulos_HOSIX.pdf ← [MANUAL DE REFERENCIA]
└── HOSIX_Auditoria_Funcional.docx    ← [ESTADO ACTUAL]
```

---

## 🚀 Inicio Rápido

1. **Leer:** `log_implementacion_v3.md` - Entender el plan
2. **Consultar:** Documentos PDF/DOCX - Validar requisitos
3. **Ejecutar:** Fase por fase
4. **Actualizar:** Log conforme se completa cada item

## 🐳 ICD-API en Docker (puerto 8090)

- Archivo de referencia: `docker-compose.icd-api.yml`
- Servicio expuesto en: `http://localhost:8090`
- Endpoints útiles:
  - Swagger: `http://localhost:8090/swagger/index.html`
  - Coding Tool: `http://localhost:8090/ct`
  - Browser: `http://localhost:8090/browse`

Comando para iniciar:

```bash
docker compose -f docker-compose.icd-api.yml up -d
```

Comando para detener:

```bash
docker compose -f docker-compose.icd-api.yml down
```

---

**Creado:** 3 de Junio 2026  
**Versión:** 1.0  
**Estado:** Activo
