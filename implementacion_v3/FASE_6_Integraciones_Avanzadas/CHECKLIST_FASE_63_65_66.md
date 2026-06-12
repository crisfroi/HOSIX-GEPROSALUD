# Checklist Fases 6.3, 6.5 y 6.6

## ✅ FASE 6.3: PORTAL WEB PACIENTES

### BD y Auth (3h)
- [ ] Crear `hosix_portal_acceso` con RLS
- [ ] Crear `hosix_portal_tokens`
- [ ] Crear función `autenticar_portal_paciente()`
- [ ] Edge Function POST `/auth/portal/login`
- [ ] Edge Function POST `/auth/portal/logout`
- [ ] Edge Function POST `/auth/portal/register`
- [ ] Ejecutar migración y verificar en Supabase

### Componentes Portada (2h)
- [ ] `PortalLogin.tsx` - Form de login
- [ ] `PortalRegister.tsx` - Auto-registro con cédula
- [ ] `PortalLayout.tsx` - Layout público
- [ ] `PortalNavbar.tsx` - Con logout
- [ ] `PortalAuthContext.tsx` - Context global
- [ ] `usePortalAuth.ts` - Hook de autenticación

### Dashboard Paciente (5h)
- [ ] `PortalDashboard.tsx` - Página principal
- [ ] `PortalPerfil.tsx` - Datos paciente
- [ ] `PortalCitas.tsx` - Próximas citas
- [ ] `PortalResultados.tsx` - Lab + Imagen
- [ ] `PortalNotificaciones.tsx` - Centro notif
- [ ] `PortalDescargas.tsx` - PDF generator
- [ ] `usePortalPaciente.ts` - Hook datos

### PDF Export (3h)
- [ ] Instalar `jspdf` + `html2canvas`
- [ ] `PDFResultados.tsx` - Template resultados
- [ ] `PDFHistorial.tsx` - Template historial
- [ ] Botón descargar en cada sección
- [ ] Probar generación de PDFs

### Testing (2h)
- [ ] `PortalLogin.test.tsx`
- [ ] `PortalRegister.test.tsx`
- [ ] `PortalDashboard.test.tsx`
- [ ] Ejecutar tests y verificar cobertura 80%+

### Documentación (1h)
- [ ] Guía de uso para pacientes
- [ ] API docs portada
- [ ] README Portal Web

### Deploy (1h)
- [ ] Desplegar a producción
- [ ] Verificar URLs funcionales
- [ ] Probar en navegadores

**TOTAL: 17 horas | ESTIMADO: 2-3 días**

---

## ✅ FASE 6.5: MPI CENTRALIZADO

### BD y Estructura (4h)
- [ ] Crear `hosix_mpi_maestro` con RLS
- [ ] Crear `hosix_mpi_duplicados`
- [ ] Crear `hosix_mpi_consolidaciones`
- [ ] Crear `hosix_mpi_sincronizaciones`
- [ ] Crear función `buscar_duplicados_similitud()`
- [ ] Crear función `consolidar_pacientes()`
- [ ] Ejecutar migración y verificar

### API Edge Functions (4h)
- [ ] `POST /mpi/buscar-duplicados` - Similitud
- [ ] `POST /mpi/consolidar` - Unificar
- [ ] `GET /mpi/cambios` - Cambios pendientes
- [ ] `POST /mpi/sincronizar` - Propagar
- [ ] `GET /mpi/log` - Historial
- [ ] Probar con Postman/Thunder Client

### Algoritmo de Similitud (3h)
- [ ] Implementar Levenshtein distance
- [ ] Normalizar nombres (acentos, mayúsculas)
- [ ] Búsqueda por fecha ± 1 año
- [ ] Búsqueda por cédula exacta
- [ ] Scoring combinado
- [ ] `similitud.ts` - Librería

### Componentes UI (5h)
- [ ] `MPIDuplicados.tsx` - Página principal
- [ ] `MPIDuplicadosManager.tsx` - Listado
- [ ] `MPISimilaridadVisor.tsx` - % similitud
- [ ] `MPIConsolidacion.tsx` - Merge dialog
- [ ] `MPISincronizacion.tsx` - Status sync
- [ ] `MPIHistorial.tsx` - Log operaciones
- [ ] Hooks: `useMPIDuplicados()`, `useMPISincronizacion()`

### Testing (2h)
- [ ] `Duplicados.test.tsx`
- [ ] `Sincronizacion.test.tsx`
- [ ] Ejecutar tests cobertura 80%+

### Documentación (1h)
- [ ] Guía de uso MPI
- [ ] API docs
- [ ] Procedimiento consolidación

### Deploy (1h)
- [ ] Desplegar a producción
- [ ] Verificar sincronización entre sedes
- [ ] Probar búsqueda de duplicados

**TOTAL: 20 horas | ESTIMADO: 2-3 días**

---

## ✅ FASE 6.6: SEGURIDAD AZURE

### Integración Azure AD (6h)
- [ ] Registrar app en Azure Portal
- [ ] Configurar OAuth 2.0 / OIDC
- [ ] `azure-callback.ts` - Edge Function
- [ ] Mapeo de roles Azure → HOSIX
- [ ] Auto-creación de usuarios
- [ ] Sincronización de atributos
- [ ] Probar flujo SSO completo

### MFA (6h)
- [ ] Crear `hosix_mfa_configuracion`
- [ ] Instalar `speakeasy` para TOTP
- [ ] Edge Function TOTP verification
- [ ] Integración SMS (Twilio)
- [ ] `MFASetup.tsx` - Setup UI
- [ ] `MFAVerify.tsx` - Verify UI
- [ ] `useMFA.ts` - Hook MFA
- [ ] Probar TOTP + SMS

### Auditoría (5h)
- [ ] Crear `hosix_auditoria_accesos`
- [ ] Crear `hosix_auditoria_cambios`
- [ ] Middleware de auditoría en requests
- [ ] Triggers para loggear cambios
- [ ] `AuditLog.tsx` - Dashboard
- [ ] `ComplianceReport.tsx` - Reportes
- [ ] `useAuditLog.ts` - Hook

### Componentes UI (2h)
- [ ] `Security.tsx` - Página seguridad
- [ ] `SecuritySettings.tsx` - Config
- [ ] `Compliance.tsx` - Compliance UI
- [ ] Links en Configuración

### Testing (1h)
- [ ] `SSO.test.tsx`
- [ ] `MFA.test.tsx`
- [ ] Cobertura 80%+

### Documentación (1h)
- [ ] Guía configuración Azure
- [ ] Guía MFA para usuarios
- [ ] Procedimientos compliance

### Deploy (1h)
- [ ] Desplegar a producción
- [ ] Verificar SSO funciona
- [ ] Probar MFA completo

**TOTAL: 22 horas | ESTIMADO: 2-3 días**

---

# 📋 Checklist Pre-Fase 6.3

Antes de comenzar 6.3, validar:

- [ ] Fase 6 completada 100% ✅
- [ ] Migraciones de Fase 6 aplicadas
- [ ] Tests de Fase 6 pasan (19/19)
- [ ] Documentación de Fase 6 actualizada
- [ ] `log_implementacion_v3.md` refleja cierre
- [ ] Rama Git limpia y sin deuda técnica
- [ ] Equipo alineado en arquitectura Portal
- [ ] Credenciales Azure preparadas (si aplica)

---

# 🎯 Prioridades por Rol

### Frontend (Prioridad Alta)
1. Componentes Portal (6.3)
2. Componentes MPI (6.5)
3. Componentes Seguridad (6.6)

### Backend (Prioridad Alta)
1. Edge Functions Auth (6.3)
2. API MPI (6.5)
3. Azure Integration (6.6)

### BD (Prioridad Alta)
1. Migraciones Portal (6.3)
2. Migraciones MPI (6.5)
3. Migraciones Auditoría (6.6)

### QA (Prioridad Alta)
1. Tests Portal (6.3)
2. Tests MPI (6.5)
3. Tests Seguridad (6.6)

---

# 📊 Matriz de Dependencias

```
6.3 Portal Web    (Independiente - Puede empezar YA)
    ↓
6.5 MPI           (Depende de: estructura base BD)
    ↓
6.6 Seguridad     (Depende de: autenticación funcional)
```

**Conclusión:** Las 3 fases pueden ejecutarse en **paralelo** con diferentes equipos sin bloqueos.

---

# 🚀 Próximo Evento

**KICKOFF FASE 6.3 - Portal Web Pacientes**
- Cuando: Inmediatamente después de este documento
- Qué: Presentación de arquitectura + Asignación de tareas
- Duración: 30 minutos
- Participantes: Frontend + Backend + BD

---

**Documento creado:** 11 Junio 2026  
**Estado:** 📋 LISTO PARA INICIAR  
**Proxim fase:** 6.3 Portal Web Pacientes
