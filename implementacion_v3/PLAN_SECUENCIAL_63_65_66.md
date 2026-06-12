# Plan Secuencial: Fase 6.3, 6.5 y 6.6

## Resumen Ejecutivo

- **Fase 6.3:** Portal Web Pacientes (acceso público a historial, citas, resultados)
- **Fase 6.5:** MPI Centralizado (consolidación de identidades de pacientes)
- **Fase 6.6:** Seguridad Avanzada con Supabase Auth + MFA (en lugar de Azure)

**Enfoque:** Hacer las fases de forma incremental, sin reescrituras innecesarias. Cada fase agrega funcionalidad sin romper lo anterior.

---

## FASE 6.3: Portal Web Pacientes

**Duración estimada:** 10-12 días  
**Objetivo:** Pacientes pueden acceder a su historial, citas, resultados de lab/imagen y comunicarse con el equipo médico.

### 6.3.1 - Autenticación de Pacientes
**Tiempo:** 2 días

**Tareas:**
1. Crear rutas públicas sin auth:
   - `/login` (email/cédula + contraseña)
   - `/registro` (auto-registro con verificación de email)
   - `/recuperar-password`

2. Crear tabla `pacientes_web_login` vinculada a `mpi_pacientes`:
   ```sql
   CREATE TABLE pacientes_web_login (
     id UUID PRIMARY KEY REFERENCES auth.users(id),
     mpi_id UUID UNIQUE REFERENCES mpi.mpi_pacientes(id),
     cedula TEXT UNIQUE,
     email TEXT UNIQUE,
     telefono TEXT,
     fecha_creacion TIMESTAMP DEFAULT now()
   );
   ```

3. Usar Supabase Auth (`auth.users`) como single source of truth
   - El `signup` de Supabase Auth + email verification

4. RLS Policy:
   ```sql
   CREATE POLICY "pacientes_ven_su_perfil"
   ON pacientes_web_login FOR SELECT
   USING (id = auth.uid());
   ```

**Entregables:**
- Componentes React: `PacienteLogin.tsx`, `PacienteRegistro.tsx`
- Validación: cédula, email único, contraseña fuerte
- Tests: login exitoso, registro con email verification

---

### 6.3.2 - Dashboard Paciente Base
**Tiempo:** 2 días

**Tareas:**
1. Crear layout `/portal/dashboard` accesible solo a pacientes autenticados

2. Mostrar:
   - Datos personales (nombre, cédula, edad, teléfono)
   - Citas programadas y pasadas
   - Resumen: próximas consultas, resultados pendientes
   - Notificaciones del sistema (ej. "tu resultado está listo")

3. Componentes:
   - `PacienteDashboard.tsx` (main)
   - `TarjetaProximas CItas.tsx`
   - `CardResumenResultados.tsx`

4. Queries React Query:
   ```ts
   const { data: paciente } = useQuery(['paciente', userId], fetchPaciente)
   const { data: citas } = useQuery(['citas', userId], fetchCitas)
   const { data: notificaciones } = useQuery(['notificaciones', userId], fetchNotificaciones)
   ```

**Entregables:**
- Dashboard con datos reales del paciente
- RLS applied: paciente solo ve sus datos
- Tests: dashboard carga, citas se muestran

---

### 6.3.3 - Historial Clínico Unificado
**Tiempo:** 3 días

**Tareas:**
1. Crear vista unificada de:
   - Consultas médicas (fecha, médico, diagnóstico, medicamentos)
   - Resultados de lab (tabla con valores, referencias)
   - Imágenes (thumbnails + link a visualizador)
   - Prescripciones activas

2. Queries a ejecutar:
   ```sql
   -- Historial completo del paciente
   SELECT 
     'consulta' as tipo, c.fecha, c.diagnostico, NULL as resultado
   FROM hosix_consultas c
   WHERE c.paciente_id = mpi_id
   UNION ALL
   SELECT 
     'lab' as tipo, r.fecha_resultado as fecha, NULL, r.valores
   FROM hosix_laboratorio_resultados r
   WHERE r.paciente_id = mpi_id
   UNION ALL
   SELECT 
     'imagen' as tipo, e.fecha_estudio as fecha, NULL, e.tipo_estudio
   FROM hosix_imagenologia_estudios e
   WHERE e.paciente_id = mpi_id
   ORDER BY fecha DESC;
   ```

3. Componentes:
   - `HistorialUnificado.tsx` (timeline)
   - `CardConsulta.tsx`
   - `CardResultadoLab.tsx`
   - `CardImagenologia.tsx`

4. Búsqueda/filtros: por rango fecha, tipo (consulta/lab/imagen)

**Entregables:**
- Timeline histórico completo
- Datos accesibles y legibles para el paciente
- Tests: timeline carga, filtros funcionan

---

### 6.3.4 - Citas Online y Mensajería
**Tiempo:** 3 días

**Tareas:**
1. Paciente puede:
   - Ver citas programadas y cancelar/reprogramar
   - Solicitar nueva cita (con disponibilidad de médicos)
   - Dejar mensajes al equipo médico

2. Crear tablas:
   ```sql
   CREATE TABLE portal_pacientes.solicitud_cita (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     paciente_id UUID REFERENCES mpi.mpi_pacientes(id),
     medico_id UUID REFERENCES medicos(id),
     fecha_solicitada DATE,
     motivo TEXT,
     estado TEXT DEFAULT 'pendiente', -- pendiente, confirmada, rechazada
     creada_en TIMESTAMP DEFAULT now()
   );

   CREATE TABLE portal_pacientes.mensajes (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     remitente_id UUID REFERENCES auth.users(id),
     paciente_id UUID REFERENCES mpi.mpi_pacientes(id),
     contenido TEXT,
     leido BOOLEAN DEFAULT false,
     creado_en TIMESTAMP DEFAULT now()
   );
   ```

3. Realtime: cuando médico responde, paciente recibe notificación en tiempo real

4. Componentes:
   - `SolicitudCita.tsx`
   - `MensajeriaChat.tsx`
   - Notificaciones push (opcional)

**Entregables:**
- Solicitud de citas funcional
- Chat bidireccional paciente-médico
- Notificaciones en tiempo real
- Tests: cita creada, mensaje enviado

---

### 6.3.5 - Descarga de Documentos
**Tiempo:** 2 días

**Tareas:**
1. Paciente puede descargar:
   - Recibos de pago (PDF)
   - Resultados de laboratorio (PDF con firma digital)
   - Informes de imágenes (PDF)
   - Certificados médicos

2. Generar PDFs con Supabase Storage + Function:
   ```ts
   const { data } = await supabase.functions.invoke('generar-pdf-resultado', {
     body: { resultado_id: id }
   })
   ```

3. Edge Function: `supabase/functions/generar-pdf-resultado/`
   - Acceso a datos del paciente via RLS
   - Genera PDF con logo Sermed
   - Sube a Storage en carpeta privada

4. RLS para Storage:
   ```sql
   -- Solo el paciente puede descargar sus documentos
   CREATE POLICY "pacientes_descargan_propios_docs"
   ON storage.objects FOR SELECT
   USING (
     bucket_id = 'documentos-pacientes' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

**Entregables:**
- PDFs generados automáticamente
- Descarga segura (RLS)
- Tests: PDF generado correctamente

---

## FASE 6.5: MPI Centralizado

**Duración estimada:** 8-10 días  
**Objetivo:** Consolidar todas las identidades de pacientes en un registro maestro único.

### 6.5.1 - Crear Schema MPI
**Tiempo:** 2 días

**Tareas:**
1. Ejecutar migración:
   ```sql
   CREATE SCHEMA IF NOT EXISTS mpi;

   CREATE TABLE mpi.mpi_pacientes (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     cedula TEXT UNIQUE NOT NULL,
     nombre TEXT NOT NULL,
     apellido TEXT NOT NULL,
     fecha_nacimiento DATE,
     genero TEXT,
     telefono TEXT,
     email TEXT,
     direccion TEXT,
     ciudad TEXT,
     pais TEXT,
     estado TEXT DEFAULT 'activo', -- activo, inactivo, fallecido
     sede_primaria_id UUID REFERENCES sedes(id),
     creado_en TIMESTAMP DEFAULT now(),
     actualizado_en TIMESTAMP DEFAULT now(),
     creado_por UUID REFERENCES auth.users(id),
     CONSTRAINT cedula_valida CHECK (cedula ~ '^\d{6,12}$')
   );

   CREATE TABLE mpi.mpi_identificadores_externos (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     mpi_id UUID NOT NULL REFERENCES mpi.mpi_pacientes(id) ON DELETE CASCADE,
     sistema TEXT NOT NULL, -- 'hosix_local', 'lab_externo', 'seguro_salud'
     identificador TEXT NOT NULL,
     UNIQUE(sistema, identificador)
   );

   CREATE INDEX idx_mpi_cedula ON mpi.mpi_pacientes(cedula);
   CREATE INDEX idx_mpi_apellido_nombre ON mpi.mpi_pacientes(apellido, nombre);
   ```

2. RLS Policies:
   ```sql
   ALTER TABLE mpi.mpi_pacientes ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "usuarios_ven_pacientes_su_sede"
   ON mpi.mpi_pacientes FOR SELECT
   USING (
     sede_primaria_id = (
       SELECT sede_id FROM seguridad.roles_sanitarios
       WHERE usuario_id = auth.uid() LIMIT 1
     )
   );

   CREATE POLICY "pacientes_ven_su_registro"
   ON mpi.mpi_pacientes FOR SELECT
   USING (
     id = (SELECT mpi_id FROM pacientes_web_login WHERE id = auth.uid())
   );
   ```

**Entregables:**
- Schema `mpi` creado y RLS activo
- Índices para búsqueda rápida
- Tests: inserción y consulta con RLS

---

### 6.5.2 - Migración de Datos Existentes
**Tiempo:** 3 días

**Tareas:**
1. Consolidar pacientes existentes:
   - Leer de `hosix_pacientes`
   - Comparar mediante matching algorithm (nombre, cédula, fecha nacimiento)
   - Detectar duplicados (mismo paciente registrado múltiples veces)
   - Insertar en `mpi_pacientes` sin duplicar

2. Algoritmo de matching (SQL):
   ```sql
   WITH candidatos AS (
     SELECT h1.id, h2.id as duplicate_id
     FROM hosix_pacientes h1
     JOIN hosix_pacientes h2 ON 
       h1.cedula = h2.cedula AND 
       h1.id < h2.id
   )
   SELECT * FROM candidatos;
   ```

3. Crear `mpi_identificadores_externos` para cada paciente antiguo:
   ```sql
   INSERT INTO mpi.mpi_identificadores_externos (mpi_id, sistema, identificador)
   SELECT 
     mp.id,
     'hosix_pacientes_legacy',
     hp.id::text
   FROM mpi.mpi_pacientes mp
   JOIN hosix_pacientes hp ON mp.cedula = hp.cedula;
   ```

4. Script de validación:
   ```ts
   // Contar duplicados detectados, confirmar manualmente
   const duplicados = await supabase
     .from('mpi_pacientes')
     .select('cedula')
     .then(data => {
       // agrupar y contar
     })
   ```

**Entregables:**
- Todos los pacientes en `mpi_pacientes`
- Sin duplicados (validado manualmente si hay dudas)
- Trazabilidad de origen en `mpi_identificadores_externos`

---

### 6.5.3 - Trigger de Sincronización
**Tiempo:** 2 días

**Tareas:**
1. Crear trigger: al insertar paciente en cualquier módulo, sincronizar con MPI:
   ```sql
   CREATE OR REPLACE FUNCTION sincronizar_mpi_paciente()
   RETURNS TRIGGER AS $$
   BEGIN
     -- Si el paciente no existe en MPI, crearlo
     INSERT INTO mpi.mpi_pacientes (cedula, nombre, apellido, creado_en)
     VALUES (NEW.cedula, NEW.nombre, NEW.apellido, now())
     ON CONFLICT(cedula) DO NOTHING;
     
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER trigger_sync_mpi_pacientes
   BEFORE INSERT ON hosix_pacientes
   FOR EACH ROW
   EXECUTE FUNCTION sincronizar_mpi_paciente();
   ```

2. Trigger similar en `hosix_laboratorio_pacientes`, `hosix_imagenologia_pacientes`

3. Logs de sincronización en tabla `mpi.mpi_auditoria_sync`

**Entregables:**
- Triggers activos
- Logs de sincronización verificados
- Tests: inserción en hosix_pacientes → aparece en MPI

---

### 6.5.4 - Vista Unificada en Dashboard
**Tiempo:** 2 días

**Tareas:**
1. Cambiar Dashboard médico para consumir MPI en lugar de pacientes locales:
   ```ts
   // Antes
   const pacientes = await supabase
     .from('hosix_pacientes')
     .select()
   
   // Después
   const pacientes = await supabase
     .from('mpi.mpi_pacientes')
     .select()
     .eq('sede_primaria_id', sedeActual.id)
   ```

2. Búsqueda global:
   ```sql
   SELECT * FROM mpi.mpi_pacientes
   WHERE cedula ILIKE $1 OR 
         (apellido || ' ' || nombre) ILIKE $2
   LIMIT 20;
   ```

3. Componentes: `BuscadorPacientesGlobal.tsx`

**Entregables:**
- Dashboard consume MPI
- Búsqueda global por cédula/nombre
- Tests: búsqueda devuelve resultados correctos

---

## FASE 6.6: Seguridad Avanzada (Supabase Auth + MFA)

**Duración estimada:** 6-8 días  
**Objetivo:** Implementar MFA obligatorio para roles sensibles, auditoría centralizada, control de acceso basado en roles.

### 6.6.1 - Configurar MFA en Supabase Auth
**Tiempo:** 2 días

**Tareas:**
1. Habilitar en Supabase:
   - MFA: TOTP, SMS
   - Session settings: max duration 24h, inactivity timeout 1h

2. Crear tabla de niveles MFA requeridos:
   ```sql
   CREATE TABLE seguridad.mfa_requerido_por_rol (
     rol TEXT PRIMARY KEY,
     nivel_aal TEXT NOT NULL, -- AAL1, AAL2, AAL3
     descripcion TEXT
   );

   INSERT INTO seguridad.mfa_requerido_por_rol VALUES
   ('medico', 'AAL2', 'MFA recomendado (email + TOTP)'),
   ('farmaceutico', 'AAL2', 'MFA obligatorio'),
   ('admin', 'AAL3', 'MFA obligatorio + WebAuthn'),
   ('enfermera', 'AAL1', 'Sin MFA requerido');
   ```

3. Middleware en App.tsx: verificar AAL después de login
   ```ts
   useEffect(() => {
     const checkMFA = async () => {
       const session = await supabase.auth.getSession()
       const { user } = session.data
       
       const { data: rol } = await supabase
         .from('seguridad.roles_sanitarios')
         .select('mfa_nivel')
         .eq('usuario_id', user.id)
         .single()
       
       // Si rol requiere AAL2 pero usuario tiene AAL1, ir a setup MFA
       if (rol.mfa_nivel === 'AAL2' && user.user_metadata.aal === 'aal1') {
         navigate('/setup-mfa')
       }
     }
     checkMFA()
   }, [])
   ```

**Entregables:**
- MFA settings en Supabase (desde dashboard)
- Middleware de verificación AAL
- Tests: login requerido MFA para roles sensibles

---

### 6.6.2 - Setup MFA para Usuarios
**Tiempo:** 2 días

**Tareas:**
1. Componente `SetupMFA.tsx`:
   - Opción 1: TOTP (Google Authenticator, Authy)
   - Opción 2: SMS (si Supabase SMS está configurado)
   - Display QR code para TOTP
   - Backup codes

2. Flow:
   ```ts
   const { data, error } = await supabase.auth.mfa.enroll({
     factorType: 'totp'
   })
   // data.totp.qr_code → mostrar al usuario
   // data.totp.secret → usar para verificar
   ```

3. Verificación de factores:
   ```ts
   const { data, error } = await supabase.auth.mfa.verify({
     factorId: enrolledFactor.id,
     code: userEnteredCode
   })
   ```

4. Tabla de auditoría:
   ```sql
   CREATE TABLE seguridad.auditoria_mfa (
     id BIGSERIAL PRIMARY KEY,
     usuario_id UUID REFERENCES auth.users(id),
     accion TEXT, -- 'enrolled_totp', 'enrolled_sms', 'verified', 'removed'
     detalles JSONB,
     timestamp TIMESTAMP DEFAULT now()
   );
   ```

**Entregables:**
- UI para enrolling en MFA
- QR code scanning
- Backup codes
- Tests: TOTP enrollment y verification

---

### 6.6.3 - RLS Policies Completas
**Tiempo:** 2 días

**Tareas:**
1. Actualizar todas las policies para incluir validación de rol + sede:
   ```sql
   CREATE POLICY "medicos_acceden_pacientes_su_sede"
   ON mpi.mpi_pacientes FOR SELECT
   USING (
     -- Usuario debe tener rol 'medico' en esta sede
     EXISTS (
       SELECT 1 FROM seguridad.roles_sanitarios rs
       WHERE rs.usuario_id = auth.uid()
       AND rs.rol = 'medico'
       AND rs.sede_id = mpi.mpi_pacientes.sede_primaria_id
     )
   );
   ```

2. Policies especiales:
   - Farmacéuticos: solo leen prescripciones (no diagnósticos)
   - Administrativos: solo leen datos de facturación
   - Pacientes: solo leen sus propios datos

3. Auditoría de acceso:
   ```sql
   CREATE TABLE seguridad.auditoria_acceso (
     id BIGSERIAL PRIMARY KEY,
     usuario_id UUID REFERENCES auth.users(id),
     tabla TEXT,
     accion TEXT, -- SELECT, INSERT, UPDATE, DELETE
     registros_accedidos INT,
     timestamp TIMESTAMP DEFAULT now()
   );
   
   -- Trigger automático (o via log_denials = true)
   ```

4. Dashboard de auditoría para admins

**Entregables:**
- RLS completo por rol/sede
- Auditoría de accesos
- Tests: paciente no puede ver otros pacientes, farmacéutico no ve diagnósticos

---

### 6.6.4 - Dashboard de Sesiones y Seguridad
**Tiempo:** 1 día

**Tareas:**
1. Crear `SegurityDashboard.tsx` (para admins):
   - Sesiones activas (quién está logueado)
   - Últimas autenticaciones
   - Intentos fallidos
   - Cambios recientes de permisos

2. Query:
   ```sql
   SELECT 
     u.email,
     rs.rol,
     s.created_at,
     s.expires_at,
     CASE WHEN s.expires_at < now() THEN 'expirada' ELSE 'activa' END as estado
   FROM auth.sessions s
   JOIN auth.users u ON s.user_id = u.id
   LEFT JOIN seguridad.roles_sanitarios rs ON rs.usuario_id = u.id
   ORDER BY s.created_at DESC;
   ```

3. Acciones: forzar cierre de sesión, cambiar MFA nivel, deshabilitar usuario

**Entregables:**
- Dashboard con sesiones activas
- Logs de autenticación
- Control remoto de sesiones

---

## Timeline Total

```
Semana 1 (6.3 inicio):    6.3.1 + 6.3.2 → Login + Dashboard base
Semana 2 (6.3 continuación): 6.3.3 + 6.3.4 → Historial + Citas
Semana 3 (6.3 final + 6.5 inicio): 6.3.5 + 6.5.1 → Documentos + Schema MPI
Semana 4 (6.5): 6.5.2 + 6.5.3 → Migración + Triggers
Semana 5 (6.5 final + 6.6 inicio): 6.5.4 + 6.6.1 → Dashboard MPI + MFA setup
Semana 6 (6.6 final): 6.6.2 + 6.6.3 + 6.6.4 → Completo
```

**Total:** ~6 semanas (si trabajo full-time)

---

## Notas Importantes

1. **Cada fase es incremental:** 6.3 no rompe lo que existe, 6.5 integra sobre 6.3, 6.6 securiza todo.

2. **Tests desde el inicio:** cada componente + cada migración SQL

3. **No reescribir:** usar lo existente (Supabase Auth ya está, Realtime ya funciona)

4. **Documentación viva:** actualizar plan conforme aprendas

5. **Security-first:** RLS desde Fase 6.3, no como afterthought
