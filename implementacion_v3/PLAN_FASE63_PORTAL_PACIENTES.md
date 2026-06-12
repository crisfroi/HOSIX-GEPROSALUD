# Fase 6.3 - Portal Web de Pacientes
**Período:** Junio 2026
**Estado:** PLANIFICACIÓN

---

## VISIÓN

Crear un portal web accesible para **pacientes** y **profesionales de salud** donde puedan:
- Buscar y ver su historial médico por HCU/cédula
- Ver citas programadas
- Descargar recetas y medicamentos
- Consultar resultados de laboratorio e imagenología
- Solicitar interconsultas
- Contactar al centro de salud

---

## ARQUITECTURA

```
┌────────────────────────────────────────┐
│   Portal Web de Pacientes (Frontend)   │
│   - React + TypeScript + Vite          │
│   - Rutas públicas + privadas          │
│   - Responsive design (mobile-first)   │
└────────────────┬───────────────────────┘
                 │
                 ├─ Supabase Auth
                 │   ├─ Email + Password
                 │   ├─ Magic Link
                 │   └─ MFA (Fase 6.6)
                 │
                 └─ Edge Functions
                     ├─ /functions/v1/portal-buscar-paciente
                     ├─ /functions/v1/portal-obtener-historial
                     ├─ /functions/v1/portal-obtener-citas
                     ├─ /functions/v1/portal-obtener-resultados
                     └─ /functions/v1/portal-descargar-recetas
```

---

## FUNCIONALIDADES

### 1. AUTENTICACIÓN & ACCESO
- [ ] Login con email/password
- [ ] Magic Link (sin contraseña)
- [ ] Registro de pacientes nuevos
- [ ] Recuperación de contraseña
- [ ] Perfil de usuario
- [ ] MFA (Fase 6.6)

### 2. BÚSQUEDA & VERIFICACIÓN
- [ ] Buscar por HCU (pacientes registrados)
- [ ] Buscar por cédula (con verificación)
- [ ] Información del paciente (nombre, edad, contacto)
- [ ] Centro de salud de origen

### 3. HISTORIAL MÉDICO
- [ ] Vista por fecha (cronológica)
- [ ] Filtros: diagnóstico, procedimiento, centro
- [ ] Detalles de consulta:
  - Fecha y hora
  - Profesional que atendió
  - Diagnóstico (ICD-11)
  - Síntomas
  - Tratamiento
  - Notas

### 4. CITAS MÉDICAS
- [ ] Ver citas próximas
- [ ] Ver citas pasadas
- [ ] Cancelar cita
- [ ] Reprogramar cita
- [ ] Recordatorio automático (24h antes)
- [ ] Estado de cita: confirmada, en espera, completada, cancelada

### 5. RESULTADOS DE LABORATORIO
- [ ] Listar exámenes de laboratorio
- [ ] Ver resultado por examen
- [ ] Gráficos de evolución (valores históricos)
- [ ] Descargar PDF del resultado
- [ ] Estado: pendiente, listo, anormales

### 6. RESULTADOS DE IMAGENOLOGÍA
- [ ] Listar estudios (Rx, Eco, CT, RMN)
- [ ] Ver imágenes (visor DICOM básico)
- [ ] Descarga de imágenes
- [ ] Reporte radiológico
- [ ] Estado: pendiente, listo

### 7. RECETAS & MEDICAMENTOS
- [ ] Ver recetas activas
- [ ] Ver historial de recetas
- [ ] Descargar receta (PDF)
- [ ] Estado de medicamento: activo, expirado
- [ ] Sugerencias de farmacias (futuro)

### 8. REPORTES & EXPORTACIÓN
- [ ] Descargar historial completo (PDF)
- [ ] Generar reporte para terceros
- [ ] Compartir con otro profesional (código temporal)

---

## PÁGINAS & COMPONENTES

### Layout General
```
/portal
├─ Navbar (logo, usuario, logout)
├─ Sidebar (navegación)
└─ Content (páginas dinámicas)
```

### Páginas Públicas
- [ ] `/portal/login` - Autenticación
- [ ] `/portal/register` - Registro
- [ ] `/portal/forgot-password` - Recuperación

### Páginas Privadas (Autenticadas)
- [ ] `/portal/dashboard` - Dashboard personal
- [ ] `/portal/historial` - Historial médico
- [ ] `/portal/citas` - Gestión de citas
- [ ] `/portal/resultados` - Resultados lab/imagen
- [ ] `/portal/recetas` - Recetas y medicamentos
- [ ] `/portal/documentos` - Descargas
- [ ] `/portal/perfil` - Perfil de usuario
- [ ] `/portal/contacto` - Contactar centro

---

## MODELOS DE DATOS

### User (Supabase Auth)
```sql
auth.users (extendido)
├─ id (UUID)
├─ email
├─ password_hash
├─ email_confirmed_at
├─ last_sign_in_at
└─ metadata (paciente_id, rol)
```

### Paciente Portal
```sql
CREATE TABLE public.portal_pacientes (
  id UUID PRIMARY KEY (FK auth.users.id),
  hcu VARCHAR(50) UNIQUE,
  cedula VARCHAR(20) UNIQUE,
  nombre_completo VARCHAR(255),
  fecha_nacimiento DATE,
  genero VARCHAR(10),
  telefono VARCHAR(20),
  email VARCHAR(255),
  direccion TEXT,
  centro_salud_id UUID,
  alergias JSONB,
  condiciones_cronicas JSONB,
  tipo_sangre VARCHAR(5),
  contacto_emergencia JSONB,
  foto_perfil TEXT,
  estado VARCHAR(50) DEFAULT 'activo',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Acceso Log
```sql
CREATE TABLE public.portal_acceso_log (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID,
  paciente_id UUID,
  tipo_acceso VARCHAR(50),
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMPTZ
);
```

---

## EDGE FUNCTIONS REQUERIDAS

### 1. portal-buscar-paciente
```typescript
POST /functions/v1/portal-buscar-paciente
Input: { hcu: string } | { cedula: string }
Output: { 
  id, hcu, cedula, nombre, edad, centro,
  disponible: boolean,
  requiere_verificacion: boolean
}
```

### 2. portal-obtener-historial
```typescript
POST /functions/v1/portal-obtener-historial
Input: { paciente_id: UUID, filtro?: {...} }
Output: { 
  registros: [
    { fecha, profesional, diagnostico, sintomas, tratamiento }
  ],
  total: number
}
```

### 3. portal-obtener-citas
```typescript
POST /functions/v1/portal-obtener-citas
Input: { paciente_id: UUID, filtro: 'proximas'|'pasadas'|'todas' }
Output: {
  citas: [
    { id, fecha, hora, profesional, especialidad, centro, estado }
  ]
}
```

### 4. portal-obtener-resultados
```typescript
POST /functions/v1/portal-obtener-resultados
Input: { paciente_id: UUID, tipo: 'lab'|'imagen'|'todos' }
Output: {
  resultados: [
    { id, fecha, tipo, nombre, estado, descarga_url }
  ]
}
```

### 5. portal-descargar-recetas
```typescript
POST /functions/v1/portal-descargar-recetas
Input: { paciente_id: UUID }
Output: {
  recetas: [
    { id, fecha, medicamento, dosis, duracion, estado }
  ]
}
```

---

## SEGURIDAD & RLS

```sql
-- RLS en portal_pacientes
ALTER TABLE public.portal_pacientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven solo su perfil"
  ON public.portal_pacientes
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuarios actualizan solo su perfil"
  ON public.portal_pacientes
  FOR UPDATE
  USING (auth.uid() = id);

-- RLS en portal_acceso_log (solo lectura auditada)
CREATE POLICY "Auditoria de acceso"
  ON public.portal_acceso_log
  FOR INSERT
  WITH CHECK (usuario_id = auth.uid());
```

---

## FLUJO DE USUARIO

### Nuevo Paciente
```
1. Visita /portal → Vé login
2. Click "Registrarse"
3. Completa: email, contraseña, HCU/cédula
4. Verifica email (magic link)
5. Sistema busca paciente en nodo_central
6. Si existe: rellena datos automáticamente
7. Si no existe: solicita datos manuales
8. Registra en portal_pacientes
9. Redirige a /portal/dashboard
```

### Paciente Existente
```
1. Visita /portal → Vé login
2. Ingresa email + contraseña
3. Supabase Auth valida
4. Redirige a /portal/dashboard
5. Ve historial, citas, resultados
```

### Búsqueda de Historial
```
1. En /portal/historial
2. Ve consultas cronológicas
3. Click en consulta → detalles
4. Puede filtrar por fecha/diagnóstico
5. Descarga PDF si quiere
```

---

## MIGRACIONES NECESARIAS

```sql
-- 1. Tabla de pacientes portal
CREATE TABLE public.portal_pacientes (...)

-- 2. Tabla de acceso (auditoría)
CREATE TABLE public.portal_acceso_log (...)

-- 3. Tabla de formularios de contacto (futuro)
CREATE TABLE public.portal_contacto (...)

-- 4. Función para descargar historial PDF
CREATE FUNCTION public.fn_generar_pdf_historial() ...

-- 5. Triggers para auditoría
CREATE TRIGGER ... AFTER ... ON portal_pacientes ...
```

---

## COMPONENTES REACT

### Layout
- [ ] `PortalLayout.tsx` - Layout principal
- [ ] `PortalNavbar.tsx` - Navbar con usuario
- [ ] `PortalSidebar.tsx` - Menú lateral

### Autenticación
- [ ] `PortalLogin.tsx` - Login form
- [ ] `PortalRegister.tsx` - Registro form
- [ ] `PortalForgotPassword.tsx` - Recuperación
- [ ] `ProtectedRoute.tsx` - Ruta protegida

### Páginas
- [ ] `PortalDashboard.tsx` - Dashboard principal
- [ ] `PortalHistorial.tsx` - Historial médico
- [ ] `PortalCitas.tsx` - Gestión citas
- [ ] `PortalResultados.tsx` - Resultados lab/imagen
- [ ] `PortalRecetas.tsx` - Recetas
- [ ] `PortalDocumentos.tsx` - Descargas
- [ ] `PortalPerfil.tsx` - Perfil usuario
- [ ] `PortalContacto.tsx` - Formulario contacto

### Componentes Reutilizables
- [ ] `ResultadoCard.tsx` - Tarjeta resultado
- [ ] `CitaItem.tsx` - Item de cita
- [ ] `HistorialFilter.tsx` - Filtros historial
- [ ] `DescargarPDFBtn.tsx` - Botón descargar

---

## ROUTING

```typescript
// Portal routes
const portalRoutes = [
  { path: '/portal/login', element: <PortalLogin /> },
  { path: '/portal/register', element: <PortalRegister /> },
  { path: '/portal/forgot-password', element: <PortalForgotPassword /> },
  
  // Protected routes
  {
    path: '/portal',
    element: <ProtectedRoute><PortalLayout /></ProtectedRoute>,
    children: [
      { path: 'dashboard', element: <PortalDashboard /> },
      { path: 'historial', element: <PortalHistorial /> },
      { path: 'citas', element: <PortalCitas /> },
      { path: 'resultados', element: <PortalResultados /> },
      { path: 'recetas', element: <PortalRecetas /> },
      { path: 'documentos', element: <PortalDocumentos /> },
      { path: 'perfil', element: <PortalPerfil /> },
      { path: 'contacto', element: <PortalContacto /> },
    ]
  }
]
```

---

## TIMELINE ESTIMADO

| Fase | Tarea | Días |
|------|-------|------|
| 1 | Setup rutas + autenticación | 1 |
| 2 | Migraciones + Edge Functions | 1 |
| 3 | Componentes auth (login/register) | 1 |
| 4 | Dashboard + perfil | 1 |
| 5 | Historial médico | 1 |
| 6 | Citas + resultados | 1 |
| 7 | Recetas + documentos | 1 |
| 8 | Contacto + notificaciones | 1 |
| 9 | Tests + documentación | 1 |
| 10 | Polish + bugfixes | 1 |
| **Total** | | **10 días** |

---

## PRÓXIMAS DECISIONES

1. **Magic Link o Password?**
   - Recomendado: Magic Link (más seguro, mejor UX)
   - Alternativa: Email + Password

2. **Búsqueda de paciente?**
   - Por HCU (recomendado - único)
   - Por Cédula + Verificación (2FA)
   - Ambos

3. **Visualizador DICOM?**
   - Sí (cornerstoneJS)
   - No (solo descargar)

4. **PDF generación?**
   - Server-side (Edge Function)
   - Client-side (jsPDF)

---

**Status:** LISTO PARA INICIAR
**Próximo paso:** Confirmar decisiones y crear primer componente (PortalLogin)
