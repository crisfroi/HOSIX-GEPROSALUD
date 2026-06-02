#!/bin/bash
# Script para generar tipos TypeScript desde Supabase
# Uso: npx supabase gen types typescript --linked > src/types/database.ts

# Este script requiere que tengas:
# 1. Supabase CLI instalado: npm install -g supabase
# 2. Configuración en supabase/config.toml
# 3. Variable de entorno SUPABASE_DB_PASSWORD

echo "📦 Generando tipos TypeScript desde Supabase..."

# Generar tipos de la BD
npx supabase gen types typescript --linked > src/types/database.ts

# Generar tipos de usuario (custom types para la aplicación)
echo "✅ Tipos generados en src/types/database.ts"

# Crear archivo de re-exportaciones
cat > src/types/index.ts << 'EOF'
// Re-exportar todos los tipos generados
export type * from './database'
export type * from './custom'
EOF

echo "✅ Archivo de índice de tipos creado"
echo "✨ Generación completada"
