# Arquitectura: Sincronización de Profesionales Sanitarios

## 📋 Resumen Ejecutivo

El usuario quiere que cada hospital (instalación local) pueda:
1. **Sincronizar** profesionales del registro centralizado (Supabase remoto) 
2. **Extender** la tabla `hosix_usuarios` con datos de profesionales
3. **Autenticar** profesionales localmente con ID + contraseña generada automáticamente
4. **Forzar** cambio de contraseña en primer login

**Estrategia elegida**: Extender `hosix_usuarios` directamente con campos de `profesionales_sanitarios`

---

## 🗂️ Estructura Actual

### Tabla `hosix_usuarios` (actual)
```
id                          UUID
username                    VARCHAR (obligatorio)
email                       VARCHAR (obligatorio)
nombre_completo             VARCHAR
perfil_id                   UUID -> hosix_perfiles
centro_salud_id             UUID -> centros_salud
auth_user_id                UUID (Supabase Auth)
activo                      BOOLEAN
cambio_password_requerido   BOOLEAN
intentos_fallidos           INTEGER
bloqueado_hasta             TIMESTAMP
password_expira             TIMESTAMP
ultimo_acceso               TIMESTAMP
created_at                  TIMESTAMP
updated_at                  TIMESTAMP
```

### Tabla `profesionales_sanitarios` (remoto) - Campos clave
```
id                          UUID
nombre_completo             VARCHAR
primer_nombre, segundo_nombre, primer_apellido, segundo_apellido
id_profesional_unico        VARCHAR (✅ ID del profesional)
numero_funcionario          VARCHAR
centro_salud_id             UUID
especialidad                VARCHAR
area_profesional            VARCHAR
estado_solicitud            VARCHAR (Aprobado, etc.)
email                       VARCHAR
telefono                    VARCHAR
fecha_nacimiento            VARCHAR
genero                       VARCHAR
activo                      BOOLEAN
```

---

## 🔧 Cambios Propuestos

### PASO 1: Extender `hosix_usuarios` con columnas de profesionales

**Agregar estas columnas:**
```sql
-- Datos de profesional (copia local)
id_profesional_unico        VARCHAR (único, nullable)
numero_funcionario          VARCHAR (nullable)
especialidad                VARCHAR (nullable)
area_profesional            VARCHAR (nullable)
estado_solicitud            VARCHAR (nullable, def: 'Aprobado')
telefono                    VARCHAR (nullable)
fecha_nacimiento            DATE (nullable)
genero                       VARCHAR (nullable)

-- Metadata de sincronización
es_profesional              BOOLEAN (default: false)
fecha_sincronizacion        TIMESTAMP (cuándo se sincronizó)
profesional_remoto_id       UUID (referencia al ID en sistema remoto)
contrasena_hasheada         VARCHAR (solo para profesionales)
contrasena_default_usada    BOOLEAN (true = contraseña generada automaticamente)
```

### PASO 2: Crear función de hash de contraseña

Se usará **bcrypt** (existente en Supabase) o función similar:
```
contraseña_inicial = id_profesional_unico + "123456"
contraseña_hasheada = HASH(contraseña_inicial)
cambio_password_requerido = true
```

### PASO 3: Crear funciones de sincronización

**Edge Function: `sync-profesionales-centro`**
- Input: `centro_salud_id` del director
- Output: Lista de profesionales sincronizados
- Proceso:
  1. Obtiene profesionales del remoto donde `centro_salud_id` = X
  2. Para cada profesional:
     - Si NO existe en local: 
       - Inserta en `hosix_usuarios` con `es_profesional = true`
       - Genera `contrasena = id_profesional + '123456'`
       - Hashea y guarda
       - `cambio_password_requerido = true`
     - Si EXISTE:
       - Actualiza datos (excepto contraseña si ya fue cambiada)
  3. Registra en auditoría

---

## 🔐 Flujos de Autenticación

### FLUJO 1: Director (sistema actual - no cambia)
```
Login HOSIX existente
  → useHosixAuth.ts
  → hosix-auth-login edge function
  → Valida contra hosix_usuarios (admin, director)
  → Crea sesión normal
```

### FLUJO 2: Profesional (NUEVO)
```
Login Profesional
  → ProfesionalLogin.tsx (componente nuevo)
  → Valida: id_profesional_unico + contraseña
  → Busca en hosix_usuarios donde:
     - es_profesional = true
     - id_profesional_unico = <input>
     - activo = true
  → Compara contraseña con contrasena_hasheada
  → SI cambio_password_requerido = true:
     → Fuerza pantalla de cambio antes de acceso
  → Crea sesión local (localStorage)
  → Nota: NO usa Supabase Auth
```

---

## 📊 Modelos de Datos Actualizados

### Tipo TypeScript: `HosixUsuarioProfesional`
```typescript
interface HosixUsuarioProfesional {
  // Campos originales
  id: string
  username: string
  email: string
  nombre_completo: string
  perfil_id: string
  centro_salud_id: string
  activo: boolean
  cambio_password_requerido: boolean
  
  // Nuevos campos de profesional
  es_profesional: boolean
  id_profesional_unico?: string
  numero_funcionario?: string
  especialidad?: string
  area_profesional?: string
  estado_solicitud?: string
  telefono?: string
  fecha_nacimiento?: string
  genero?: string
  
  // Metadata de sincronización
  fecha_sincronizacion?: string
  profesional_remoto_id?: string
  contrasena_default_usada?: boolean
}
```

---

## 🛠️ Componentes a Crear/Modificar

### 1. **Migración SQL** (`20250129_001_extend_hosix_usuarios_profesionales.sql`)
   - Agregar columnas a `hosix_usuarios`
   - Crear índices en `id_profesional_unico`
   - Crear constraint UNIQUE

### 2. **Hook: `useProfesionalesSync.ts`** (para director)
   - Función `syncProfesionalesCentro(centroId)`
   - Obtiene profesionales del remoto
   - Inserta/actualiza en local
   - Genera contraseñas automáticas

### 3. **Hook: `useProfesionalAuth.ts`** (para profesional)
   - Función `loginProfesional(idProfesional, password)`
   - Valida contra tabla local
   - Maneja cambio de contraseña forzado

### 4. **Componente: `ProfesionalSyncManager.tsx`** (panel director)
   - Interfaz para que director sincronice profesionales
   - Muestra lista de profesionales sincronizados
   - Opciones de actualizar/eliminar

### 5. **Página: `ProfesionalLogin.tsx`** (login alternativo)
   - Interfaz para que profesional ingrese ID + contraseña
   - Maneja cambio de contraseña forzado
   - Crea sesión local

### 6. **Hook: `useProfesionalSession.ts`** (sesión local)
   - Maneja sesión de profesional en localStorage
   - Similar a `useAuthStore` pero para profesionales

---

## 🔑 Consideraciones de Seguridad

1. **Hashing de contraseña**: Usar bcrypt (disponible en Supabase)
2. **RLS (Row Level Security)**: 
   - Profesionales solo ven su propio registro
   - Director ve profesionales de su centro
3. **Auditoría**: Registrar quién sincronizó y cuándo
4. **Expiración de contraseña**: `password_expira` TIMESTAMP
5. **Bloqueo temporal**: `bloqueado_hasta` tras intentos fallidos

---

## 📈 Ejemplo: Sincronización Step-by-Step

**Escenario**: Director del Hospital X sincroniza profesionales

### Datos remotos (del registro centralizado)
```json
[
  {
    "id": "2c1734ed-352d-4502-896f-748a5de9d9fb",
    "id_profesional_unico": "MED-2025-001",
    "nombre_completo": "DR. SILIÓ MBA ESONO",
    "especialidad": "Medicina General",
    "centro_salud_id": "5727583a-a8a3-4793-b4d6-ade6..."
  },
  {
    "id": "d9558abf-d313-4950-83b2-cb2a597c83fc",
    "id_profesional_unico": "ENF-2025-002",
    "nombre_completo": "ENFERMERA MONIQUE OBOAMA",
    "especialidad": "Enfermería",
    "centro_salud_id": "5727583a-a8a3-4793-b4d6-ade6..."
  }
]
```

### Proceso de sincronización

**1. Director click en "Sincronizar Profesionales"**
   ```
   Director vé: "Sincronizando 2 profesionales..."
   ```

**2. Sistema baja datos del remoto**
   ```sql
   SELECT * FROM profesionales_sanitarios 
   WHERE centro_salud_id = 'hospital-x-id' 
   AND estado_solicitud = 'Aprobado'
   ```

**3. Para cada profesional nuevo**
   ```sql
   INSERT INTO hosix_usuarios (
     username,                  -- 'med_2025_001' (lowercase id_profesional)
     nombre_completo,          -- 'DR. SILIÓ MBA ESONO'
     email,                     -- de profesional
     centro_salud_id,          -- 'hospital-x-id'
     es_profesional,           -- true
     id_profesional_unico,     -- 'MED-2025-001'
     especialidad,             -- 'Medicina General'
     contrasena_hasheada,      -- HASH('MED-2025-001' + '123456')
     cambio_password_requerido,-- true
     activo,                    -- true
     fecha_sincronizacion      -- NOW()
   ) VALUES (...)
   ```

**4. Resultado local**
   ```
   ✅ MED-2025-001 (Dr. Silió) - nuevo usuario creado
   ✅ ENF-2025-002 (Enfermera Monique) - nuevo usuario creado
   
   Próximo login:
   - ID: MED-2025-001
   - Contraseña: MED-2025-001123456 (solo esta primera vez)
   - Sistema: "Debe cambiar contraseña"
   ```

---

## 📋 Plan de Implementación

1. ✅ Crear migración SQL (extender tabla)
2. ✅ Crear funciones de hash/validación
3. ✅ Crear hook `useProfesionalesSync.ts`
4. ✅ Crear hook `useProfesionalAuth.ts`
5. ✅ Crear componente `ProfesionalSyncManager.tsx`
6. ✅ Crear página `ProfesionalLogin.tsx`
7. ✅ Actualizar tipos TypeScript
8. ✅ Agregar ruta en router
9. ✅ Actualizar navbar con opción de login alternativo

---

## 🚀 Próximos Pasos

¿Empiezo con la **migración SQL**?
