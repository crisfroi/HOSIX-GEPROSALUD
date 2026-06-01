# HOSIX-GEPROSALUD

Repositorio separado para la interfaz HOSIX extraída de `SERMED2`.

## Objetivo
Esta app contiene la capa de UI HOSIX independiente que usa un cliente Supabase dedicado en `src/integrations/supabase/hosixClient.ts`.

## Archivos clave
- `src/main.tsx`
- `src/App.tsx`
- `src/pages/Hosix/HosixLogin.tsx`
- `src/components/hosix/HosixLayout.tsx`
- `src/integrations/supabase/hosixClient.ts`
- `.env.example`
- `vite.config.ts`
- `tsconfig.json`
- `tsconfig.app.json`

## Instalación

```bash
cd "c:\Users\HP\Desktop\Proyectos y Empresas\geprostec\RENAPROSA\Renaprosa2\HOSIX-GEPROSALUD"
npm install
```

## Variables de entorno
Copiar `.env.example` a `.env` y completar:

```env
VITE_HOSIX_SUPABASE_URL=https://your-hosix-supabase-url.supabase.co
VITE_HOSIX_SUPABASE_ANON_KEY=your-hosix-anon-key
VITE_PUBLIC_BASE_URL=http://localhost:8080
```

## Comandos

```bash
npm run dev
npm run build
npm run setup-mcp
npm run install-mcp-migrations
npm run apply-migrations
```

## Migraciones Supabase

Este repositorio ahora incluye soporte de migraciones para HOSIX en `supabase/migrations/` y MCP helpers en `.mcp/`.

1. Copia `.env.example` a `.env`.
2. Completa `SUPABASE_SERVICE_ROLE_KEY` y URL/ANON keys.
3. Ejecuta `npm run setup-mcp`.
4. Aplica migraciones con `npm run apply-migrations` o `npm run apply-migrations:cli`.

## Nota
Se ha añadido `tsconfig.app.json` para que el proyecto Vite/TS arranque correctamente desde el nuevo repositorio.
