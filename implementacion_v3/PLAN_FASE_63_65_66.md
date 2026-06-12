# Plan Detallado Fases 6.3, 6.5 y 6.6

## Resumen Ejecutivo

Tras completar Fase 6 (Integraciones Lab-Imagen-Caja-Kioscos-Notificaciones), procederemos con:

1. **Fase 6.3 - Portal Web Pacientes** (2-3 días)
2. **Fase 6.5 - MPI Centralizado** (2-3 días)
3. **Fase 6.6 - Seguridad Azure** (2-3 días)

**Tiempo Total Estimado:** 6-9 días de trabajo

---

# 📋 FASE 6.3: PORTAL WEB PACIENTES

## 🎯 Objetivo

Crear un portal web para que **pacientes y sanitarios** accedan a sus datos, resultados, turnos y notificaciones sin entrar al sistema administrativo completo.

## 📊 Requisitos

### Acceso Pacientes
- ✅ Registrarse o auto-registrarse con cédula
- ✅ Ver perfil médico (alergias, enfermedades crónicas)
- ✅ Consultar historial de citas
- ✅ Ver resultados de laboratorio/imagenología
- ✅ Descargar resultados en PDF
- ✅ Ver próximas citas
- ✅ Recibir y gestionar notificaciones
- ✅ Cambiar contraseña

### Acceso Sanitarios (Médicos/Enfermeras)
- ✅ Acceso rápido a pacientes sin entrar a full admin
- ✅ Ver nota clínica resumida
- ✅ Acceso rápido a ordenes pendientes
- ✅ Notificaciones de resultados
- ✅ Acceso a documentos

### Seguridad
- ✅ Autenticación con cédula + contraseña (inicialmente)
- ✅ RLS en BD para sanitarios
- ✅ Sesiones con timeout
- ✅ Logs de acceso

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────┐
│         PORTAL WEB PACIENTES                │
├─────────────────────────────────────────────┤
│                                             │
│  URL: /portal  (sin autenticación HOSIX)    │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ AUTH PORTADA                          │ │
│  │ - Login con cédula                    │ │
│  │ - Registro nuevo paciente             │ │
│  │ - Recuperar contraseña                │ │
│  └───────────────────────────────────────┘ │
│                 ↓ Auth                      │
│  ┌───────────────────────────────────────┐ │
│  │ DASHBOARD PACIENTE                    │ │
│  │ - Perfil                              │ │
│  │ - Citas próximas                      │ │
│  │ - Historial resultados                │ │
│  │ - Descargas PDF                       │ │
│  │ - Notificaciones                      │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  RUTAS:                                     │
│  /portal/login                              │
│  /portal/register                           │
│  /portal/dashboard                          │
│  /portal/resultados                         │
│  /portal/citas                              │
│  /portal/perfil                             │
│                                             │
└─────────────────────────────────────────────┘
```

## 📋 Tareas (Estimado: 16 horas)

### 1. BD y Auth (3h)
- [ ] Tabla `hosix_portal_acceso` (usuario, cédula, hashed_password, rol, activo)
- [ ] Tabla `hosix_portal_tokens` (para sesiones)
- [ ] Función `autenticar_portal_paciente(cedula, contraseña)`
- [ ] Edge Function `POST /auth/portal/login` 
- [ ] Edge Function `POST /auth/portal/logout`
- [ ] Edge Function `POST /auth/portal/register` (auto-registro con cédula)
- [ ] RLS para acceso portada

### 2. Componentes Portada (2h)
- [ ] `PortalLogin.tsx` - Form de login
- [ ] `PortalRegister.tsx` - Auto-registro
- [ ] `PortalLayout.tsx` - Layout público
- [ ] `PortalNavbar.tsx` - Navbar con logout
- [ ] Autenticación con JWT en localStorage

### 3. Dashboard Paciente (5h)
- [ ] `PortalDashboard.tsx` - Página principal
- [ ] `PortalPerfil.tsx` - Datos paciente
- [ ] `PortalCitas.tsx` - Próximas citas
- [ ] `PortalResultados.tsx` - Lab + Imagen
- [ ] `PortalNotificaciones.tsx` - Centro notificaciones
- [ ] `PortalDescargas.tsx` - PDF generator
- [ ] Hooks: `usePortalAuth()`, `usePortalPaciente()`

### 4. PDF Export (3h)
- [ ] Integración con `jspdf` + `html2canvas`
- [ ] Template para recibo de resultados
- [ ] Template para historial
- [ ] Botón descargar en cada sección

### 5. Testing (2h)
- [ ] Tests de login/register
- [ ] Tests de acceso a datos
- [ ] Tests de descarga
- [ ] Cobertura: 80%+

### 6. Documentación (1h)
- [ ] Guide de uso para pacientes
- [ ] API docs para portada
- [ ] Instrucciones despliegue

## 📦 Archivos a Crear

```
src/
├── contexts/
│   └── PortalAuthContext.tsx (nuevo)
├── pages/
│   └── Portal/
│       ├── PortalLogin.tsx
│       ├── PortalRegister.tsx
│       ├── PortalLayout.tsx
│       ├── PortalDashboard.tsx
│       ├── PortalPerfil.tsx
│       ├── PortalCitas.tsx
│       ├── PortalResultados.tsx
│       ├── PortalNotificaciones.tsx
│       └── PortalDescargas.tsx
├── components/
│   └── Portal/
│       ├── PortalNavbar.tsx
│       ├── PortalCard.tsx
│       ├── PDFResultados.tsx
│       └── PDFHistorial.tsx
├── hooks/
│   ├── usePortalAuth.ts
│   └── usePortalPaciente.ts
└── types/
    └── portal.ts

supabase/migrations/
├── 20260612_fase63_portal_auth.sql
├── 20260612_fase63_portal_tokens.sql
└── 20260612_fase63_portal_rls.sql

supabase/functions/
├── auth/
│   └── portal/
│       ├── login.ts
│       ├── logout.ts
│       └── register.ts

tests/
└── Portal/
    ├── Login.test.tsx
    ├── Register.test.tsx
    └── Dashboard.test.tsx
```

## ✅ Acceptance Criteria

- [ ] Paciente puede registrarse con cédula
- [ ] Paciente puede loguearse
- [ ] Dashboard muestra datos correctos
- [ ] Resultados son descargables en PDF
- [ ] Citas próximas se muestran
- [ ] Notificaciones aparecen en tiempo real
- [ ] RLS impide ver datos de otros pacientes
- [ ] Tests pasan al 80%+ cobertura

---

# 📋 FASE 6.5: MPI CENTRALIZADO

## 🎯 Objetivo

Implementar **Master Patient Index (MPI)** para:
- Detectar pacientes duplicados
- Sincronizar datos entre sedes
- Consolidar historial único

## 📊 Requisitos

### Búsqueda de Duplicados
- ✅ Búsqueda por nombre + fecha nacimiento
- ✅ Búsqueda por cédula
- ✅ Algoritmo de similitud (Levenshtein)
- ✅ Mostrar coincidencias en % (90%+, 70-90%, <70%)

### Consolidación
- ✅ Unificar registros duplicados
- ✅ Mantener historial de mergeos
- ✅ Redirigir citas a registro maestro
- ✅ Preservar datos de ambos

### Sincronización
- ✅ Cola de cambios entre sedes
- ✅ Sincronización asíncrona
- ✅ Retry automático
- ✅ Log de sincronización

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────┐
│       SISTEMA MPI CENTRALIZADO           │
├──────────────────────────────────────────┤
│                                          │
│  SEDES:                                  │
│  Sede A ──┐                              │
│  Sede B ──┼─→ [MPI Central]              │
│  Sede C ──┘        ↓                     │
│              Búsqueda Duplicados         │
│              ↓                           │
│              ┌──────────────────┐        │
│              │ Detección        │        │
│              │ - Similitud 90%+ │        │
│              │ - Unificar?      │        │
│              └──────────────────┘        │
│              ↓                           │
│              ┌──────────────────┐        │
│              │ Consolidación    │        │
│              │ - Merge datos    │        │
│              │ - Redirect refs  │        │
│              │ - Log cambios    │        │
│              └──────────────────┘        │
│              ↓                           │
│              ┌──────────────────┐        │
│              │ Sincronización   │        │
│              │ - Cambios → Cola │        │
│              │ - Propagar sedes │        │
│              │ - Confirmación   │        │
│              └──────────────────┘        │
│                                          │
└──────────────────────────────────────────┘
```

## 📋 Tareas (Estimado: 18 horas)

### 1. BD y Estructura (4h)
- [ ] Tabla `hosix_mpi_maestro` (registro único por paciente)
- [ ] Tabla `hosix_mpi_duplicados` (detecciones)
- [ ] Tabla `hosix_mpi_consolidaciones` (mergeos realizados)
- [ ] Tabla `hosix_mpi_sincronizaciones` (log de cambios)
- [ ] Función `buscar_duplicados_similitud(nombre, apellido, fecha_nac)`
- [ ] Función `consolidar_pacientes(id_maestro, id_duplicado)`
- [ ] RLS para sedes

### 2. API Edge Functions (4h)
- [ ] `POST /mpi/buscar-duplicados` - Busca por similitud
- [ ] `POST /mpi/consolidar` - Unifica registros
- [ ] `GET /mpi/cambios` - Obtiene cambios pendientes
- [ ] `POST /mpi/sincronizar` - Propaga a otras sedes
- [ ] `GET /mpi/log` - Historial de operaciones

### 3. Componentes UI (5h)
- [ ] `MPIDuplicadosManager.tsx` - Lista y detección
- [ ] `MPISimilaridadVisor.tsx` - Muestra % similitud
- [ ] `MPIConsolidacion.tsx` - Confirma merge
- [ ] `MPISincronizacion.tsx` - Estado de sync
- [ ] `MPIHistorial.tsx` - Log de operaciones
- [ ] Hooks: `useMPIDuplicados()`, `useMPISincronizacion()`

### 4. Algoritmo de Similitud (3h)
- [ ] Implementar Levenshtein distance
- [ ] Normalizar nombres (quitar acentos, mayúsculas)
- [ ] Búsqueda por fecha nacimiento ± 1 año
- [ ] Búsqueda por cédula exacta
- [ ] Scoring combinado

### 5. Testing (2h)
- [ ] Tests de búsqueda
- [ ] Tests de consolidación
- [ ] Tests de sincronización
- [ ] Cobertura: 80%+

### 6. Documentación (1h)
- [ ] Guía de uso MPI
- [ ] API docs
- [ ] Procedimiento consolidación

## 📦 Archivos a Crear

```
src/
├── pages/
│   └── Hosix/
│       ├── MPI.tsx
│       ├── MPIDuplicados.tsx
│       ├── MPIConsolidacion.tsx
│       └── MPISincronizacion.tsx
├── components/
│   └── MPI/
│       ├── MPIDuplicadosManager.tsx
│       ├── MPISimilaridadVisor.tsx
│       ├── MPIConsolidacionDialog.tsx
│       ├── MPISincronizacionStatus.tsx
│       └── MPIHistorialLog.tsx
├── hooks/
│   ├── useMPIDuplicados.ts
│   ├── useMPIConsolidacion.ts
│   └── useMPISincronizacion.ts
├── lib/
│   └── similitud.ts (algoritmo Levenshtein)
└── types/
    └── mpi.ts

supabase/migrations/
├── 20260613_fase65_mpi_maestro.sql
├── 20260613_fase65_mpi_consolidaciones.sql
└── 20260613_fase65_mpi_sincronizacion.sql

supabase/functions/
└── mpi/
    ├── buscar-duplicados.ts
    ├── consolidar.ts
    └── sincronizar.ts

tests/
└── MPI/
    ├── Duplicados.test.tsx
    └── Sincronizacion.test.tsx
```

## ✅ Acceptance Criteria

- [ ] Sistema detecta pacientes con 90%+ similitud
- [ ] Consolidación preserva datos de ambos registros
- [ ] Sincronización propaga a todas las sedes
- [ ] Log registra todos los cambios
- [ ] RLS impide acceso no autorizado
- [ ] Tests pasan al 80%+ cobertura

---

# 📋 FASE 6.6: SEGURIDAD AZURE

## 🎯 Objetivo

Integrar **Azure AD** para:
- Single Sign-On (SSO) centralizado
- Multi-Factor Authentication (MFA)
- Auditoría avanzada y compliance

## 📊 Requisitos

### SSO Azure
- ✅ Login vía Azure AD
- ✅ Auto-creación de usuarios en BD
- ✅ Mapeo de roles (médico, enfermera, admin)
- ✅ Sincronización de atributos

### MFA
- ✅ TOTP (Authenticator app)
- ✅ SMS
- ✅ Email
- ✅ Biometría (opcional)

### Auditoría
- ✅ Log de todos los accesos
- ✅ Log de cambios en datos sensibles
- ✅ Reportes de compliance
- ✅ Alertas de actividad sospechosa

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────────────┐
│        SEGURIDAD AVANZADA AZURE                  │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────────────┐                             │
│  │  Azure AD       │                             │
│  │  - Usuarios     │────┐                        │
│  │  - Roles        │    │                        │
│  │  - Grupos       │    │ SSO                    │
│  └─────────────────┘    │                        │
│                         ↓                        │
│                    ┌─────────────────────┐       │
│                    │ Supabase Auth       │       │
│                    │ - JWT               │       │
│                    │ - Session           │       │
│                    └─────────────────────┘       │
│                         ↓                        │
│  ┌──────────────────────────────────────┐       │
│  │ MFA (múltiples métodos)              │       │
│  │  - TOTP (Google Authenticator)       │       │
│  │  - SMS (Twilio/AWS SNS)              │       │
│  │  - Email                             │       │
│  └──────────────────────────────────────┘       │
│                         ↓                        │
│  ┌──────────────────────────────────────┐       │
│  │ Auditoría y Compliance               │       │
│  │  - Log de accesos                    │       │
│  │  - Log de cambios                    │       │
│  │  - Alertas de seguridad              │       │
│  │  - Reportes ISO 27001                │       │
│  └──────────────────────────────────────┘       │
│                                                  │
└──────────────────────────────────────────────────┘
```

## 📋 Tareas (Estimado: 20 horas)

### 1. Integración Azure AD (6h)
- [ ] Registrar aplicación en Azure Portal
- [ ] Configurar OAuth 2.0 / OIDC
- [ ] Edge Function para intercambio de tokens
- [ ] Mapeo de roles Azure → HOSIX
- [ ] Auto-crear usuario en `hosix_usuarios` si no existe
- [ ] Sincronizar atributos (nombre, email, foto)

### 2. MFA (6h)
- [ ] Tabla `hosix_mfa_configuracion` (user, tipo, secreto, activo)
- [ ] Biblioteca `speakeasy` para TOTP
- [ ] Integración SMS (Twilio o AWS SNS)
- [ ] Email OTP
- [ ] Componente `MFASetup.tsx`
- [ ] Componente `MFAVerify.tsx`
- [ ] Edge Functions para validación

### 3. Auditoría (5h)
- [ ] Tabla `hosix_auditoria_accesos` (usuario, ip, timestamp, recurso, acción)
- [ ] Tabla `hosix_auditoria_cambios` (usuario, tabla, id, cambios_anteriores, cambios_nuevos)
- [ ] Middleware para loggear accesos
- [ ] Triggers para loggear cambios en tablas sensibles
- [ ] Dashboard de auditoría
- [ ] Reportes compliance

### 4. Componentes UI (2h)
- [ ] `SecuritySettings.tsx` - Configuración seguridad
- [ ] `MFASetup.tsx` - Activar MFA
- [ ] `AuditLog.tsx` - Ver historial de accesos
- [ ] `ComplianceReport.tsx` - Reportes

### 5. Testing (1h)
- [ ] Tests de SSO
- [ ] Tests de MFA
- [ ] Tests de auditoría
- [ ] Cobertura: 80%+

### 6. Documentación (1h)
- [ ] Guía de configuración Azure
- [ ] Guía de usuarios para MFA
- [ ] Procedimientos compliance

## 📦 Archivos a Crear

```
src/
├── pages/
│   └── Hosix/
│       ├── Security.tsx
│       └── Compliance.tsx
├── components/
│   └── Security/
│       ├── MFASetup.tsx
│       ├── MFAVerify.tsx
│       ├── AuditLog.tsx
│       └── ComplianceReport.tsx
├── hooks/
│   ├── useAzureAuth.ts
│   ├── useMFA.ts
│   └── useAuditLog.ts
└── lib/
    ├── azure.ts (integración OAuth)
    ├── mfa.ts (TOTP + SMS)
    └── audit.ts (logging)

supabase/migrations/
├── 20260614_fase66_mfa_config.sql
├── 20260614_fase66_auditoria_accesos.sql
└── 20260614_fase66_auditoria_cambios.sql

supabase/functions/
├── auth/
│   ├── azure-callback.ts
│   ├── mfa-setup.ts
│   └── mfa-verify.ts
└── audit/
    ├── log-acceso.ts
    └── log-cambio.ts

tests/
└── Security/
    ├── SSO.test.tsx
    └── MFA.test.tsx
```

## ✅ Acceptance Criteria

- [ ] Usuario puede loguearse vía Azure AD
- [ ] MFA se puede activar
- [ ] Códigos TOTP/SMS funcionan
- [ ] Todos los accesos se registran
- [ ] Cambios en datos sensibles se auditan
- [ ] Reportes compliance se generan
- [ ] Tests pasan al 80%+ cobertura

---

# 📊 Timeline Consolidado

```
SEMANA 1:
- Lunes-Martes:    Fase 6.3 Portal Web (16h)
- Miércoles:       Fase 6.3 Testing + Deploy (4h)

SEMANA 2:
- Jueves-Viernes:  Fase 6.5 MPI (18h)
- Lunes:           Fase 6.5 Testing + Deploy (4h)

SEMANA 3:
- Martes-Miércoles: Fase 6.6 Seguridad (20h)
- Jueves:          Fase 6.6 Testing + Deploy (4h)

TOTAL: 3 semanas, ~68-72 horas de trabajo
```

---

# 🚀 Orden de Ejecución

1. **Fase 6.3** - Prioritario (usuarios pacientes necesitan acceso)
2. **Fase 6.5** - Intermedio (calidad de datos)
3. **Fase 6.6** - Crítico (seguridad/compliance)

Todas las fases son **independientes** y pueden ejecutarse en paralelo con diferentes equipos.

---

**Documento creado:** 11 Junio 2026  
**Estado:** 📋 PLANIFICADO  
**Próximo:** Kickoff Fase 6.3
