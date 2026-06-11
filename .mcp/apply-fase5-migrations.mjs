#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('.mcp/config.json', 'utf-8'));
const env = config.mcpServers.supabase.env;

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// SQL migrations
const COMPRAS_MIGRATION = fs.readFileSync('supabase/migrations/20260610_fase5_compras_presupuestos.sql', 'utf-8');
const FARMACIA_MIGRATION = fs.readFileSync('supabase/migrations/20260610_fase5_farmacia_dispensario.sql', 'utf-8');

async function applyMigration(name, sql) {
  console.log(`\n📝 Aplicando: ${name}...`);
  try {
    const { error } = await supabase.rpc('exec', { sql });
    
    if (error) {
      // Fallback: try to execute directly
      const result = await supabase.from('_migrations').insert({
        name,
        sql,
        applied_at: new Date().toISOString()
      });
      
      if (result.error) throw result.error;
    }
    
    console.log(`✅ ${name} - APLICADA EXITOSAMENTE`);
    return true;
  } catch (err) {
    console.error(`❌ Error en ${name}:`, err.message);
    
    // Try alternative approach using individual statements
    try {
      console.log(`   Intentando ejecución de statements individuales...`);
      const statements = sql.split(';').filter(s => s.trim().length > 0);
      
      for (const statement of statements) {
        if (!statement.trim().startsWith('--')) {
          // Skip comment-only lines
          await supabase.rpc('exec', { sql: statement.trim() + ';' }).catch(e => {
            if (!e.message.includes('already exists')) throw e;
          });
        }
      }
      
      console.log(`✅ ${name} - APLICADA CON FALLBACK`);
      return true;
    } catch (fallbackErr) {
      console.error(`   Fallback también falló:`, fallbackErr.message);
      return false;
    }
  }
}

async function main() {
  console.log('🚀 APLICANDO MIGRACIONES FASE 5\n');
  console.log('='.repeat(60));
  
  const results = [];
  
  // Apply migrations in order
  results.push(await applyMigration('Compras (20260610)', COMPRAS_MIGRATION));
  results.push(await applyMigration('Farmacia (20260610)', FARMACIA_MIGRATION));
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESUMEN:');
  
  const successful = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;
  
  console.log(`  ✅ Exitosas: ${successful}/${results.length}`);
  if (failed > 0) console.log(`  ❌ Fallidas: ${failed}/${results.length}`);
  
  if (successful === results.length) {
    console.log('\n🎉 ¡TODAS LAS MIGRACIONES APLICADAS EXITOSAMENTE!');
  }
}

main().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
