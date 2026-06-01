# Supabase Migrations

Este directorio contiene migraciones SQL para la parte HOSIX del proyecto.

Migraciones incluidas en este repo:

- `20250116_001_hosix_base_schema.sql`
- `20250116_002_hosix_pacientes_historia_clinica.sql`
- `20250116_003_hosix_urgencias_citas_agendas.sql`
- `20250116_004_hosix_hospitalizacion_quirofanos_farmacia.sql`
- `20250116_005_hosix_facturacion_reportes.sql`

## Uso

- `supabase db push` (requiere Supabase CLI)
- `npm run apply-migrations` para ver opciones interactivas
- `npm run setup-mcp` para preparar la configuración MCP

## Notas

- Las migraciones se aplican en orden alfabético.
- Asegúrate de tener `SUPABASE_SERVICE_ROLE_KEY` en tu `.env` antes de usar MCP.

## Cobertura de migraciones

Este repositorio ahora incluye la copia completa de los archivos de migración HOSIX desde el repo `SERMED2`, incluyendo el historial de migraciones SQL hasta `20251105011927_e2dcdf27-0846-4b4d-89c2-91290deef071.sql`.
