# Actualización de Tipos - hosix_usuarios

## Cambios Necesarios en `src/integrations/supabase/types.ts`

Después de aplicar la migración SQL, necesitas regenerar los tipos TypeScript. Usa:

```bash
supabase gen types typescript --schema public > src/integrations/supabase/types.ts
```

O si usas el MCP de Supabase:

```bash
npm run setup-mcp
# Luego usa el MCP para regenerar tipos
```

## Campos Nuevos que se Agregarán

En la sección `hosix_usuarios` → `Row`, `Insert`, y `Update`, se agregarán:

```typescript
// Nuevos campos en Row
es_profesional: boolean | null
id_profesional_unico: string | null
numero_funcionario: string | null
especialidad: string | null
area_profesional: string | null
estado_solicitud: string | null
telefono: string | null
fecha_nacimiento: string | null
genero: string | null
fecha_sincronizacion: string | null
profesional_remoto_id: string | null
contrasena_hasheada: string | null
contrasena_default_usada: boolean | null
```

## Nuevas Tablas

Se agregarán dos tablas nuevas:

### `hosix_sincronizacion_profesionales`
- id (UUID)
- director_id (UUID)
- centro_salud_id (UUID)
- total_profesionales (integer)
- nuevos_insertados (integer)
- actualizados (integer)
- fecha_inicio (timestamp)
- fecha_fin (timestamp)
- estado (varchar)
- mensaje_error (text)
- created_at (timestamp)
- updated_at (timestamp)

### `hosix_profesionales_cambios_password`
- id (UUID)
- usuario_id (UUID)
- password_anterior_hash (varchar)
- cambio_tipo (varchar)
- motivo (varchar)
- ip_cambio (varchar)
- user_agent (text)
- created_at (timestamp)

## Variables de Entorno Necesarias

Agregar a `.env` o `.env.renaprosa`:

```
VITE_RENAPROSA_SUPABASE_URL=https://wdieynendfjbkbhfovrx.supabase.co
VITE_RENAPROSA_SUPABASE_ANON_KEY=sb_publishable_9KoyZtFgO79lLad
```

Esto permite que el hook `useProfesionalesSync.ts` conecte con el Supabase remoto del registro centralizado.
