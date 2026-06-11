#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('.mcp/config.json', 'utf-8'));
const env = config.mcpServers.supabase.env;

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// Simple approach: verify tables exist and inform user
async function checkTable(tableName) {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('1')
      .limit(1);
    
    if (error?.code === 'PGRST116' || error?.message?.includes('Could not find')) {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

async function main() {
  console.log('🔍 VERIFICANDO ESTADO DE TABLAS FASE 5\n');
  console.log('='.repeat(60));
  
  const tablesToCheck = [
    // Compras
    { name: 'hosix_presupuestos', module: 'Compras' },
    { name: 'hosix_licitaciones', module: 'Compras' },
    { name: 'hosix_licitaciones_ofertas', module: 'Compras' },
    { name: 'hosix_adjudicaciones', module: 'Compras' },
    
    // Farmacia
    { name: 'hosix_farmacia_dispensario', module: 'Farmacia' },
    { name: 'hosix_farmacia_dispensaciones', module: 'Farmacia' },
    { name: 'hosix_farmacia_farmacovigilancia', module: 'Farmacia' },
    
    // Recobros (should exist)
    { name: 'hosix_recobros', module: 'Recobros' },
    { name: 'hosix_recobros_notas_cargo', module: 'Recobros' },
    
    // Interconsultas (should exist)
    { name: 'hosix_interconsultas', module: 'Interconsultas' },
    { name: 'hosix_interconsultas_respuestas', module: 'Interconsultas' },
  ];
  
  const results = {};
  
  for (const table of tablesToCheck) {
    const exists = await checkTable(table.name);
    
    if (!results[table.module]) {
      results[table.module] = { exists: 0, missing: 0 };
    }
    
    if (exists) {
      console.log(`✅ ${table.name}`);
      results[table.module].exists++;
    } else {
      console.log(`❌ ${table.name}`);
      results[table.module].missing++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESUMEN POR MÓDULO:\n');
  
  for (const [module, stats] of Object.entries(results)) {
    const status = stats.missing === 0 ? '✅' : '❌';
    console.log(`${status} ${module}: ${stats.exists} existentes, ${stats.missing} faltantes`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n⚠️ IMPORTANTE:');
  console.log('Las migraciones no se pudieron aplicar vía API directamente.');
  console.log('Tienes dos opciones:\n');
  console.log('OPCIÓN 1: Supabase Dashboard');
  console.log('  1. Ve a: https://app.supabase.com');
  console.log('  2. Selecciona tu proyecto');
  console.log('  3. Ve a SQL Editor');
  console.log('  4. Copia el contenido de:');
  console.log('     - supabase/migrations/20260610_fase5_compras_presupuestos.sql');
  console.log('     - supabase/migrations/20260610_fase5_farmacia_dispensario.sql');
  console.log('  5. Ejecuta el SQL\n');
  
  console.log('OPCIÓN 2: Supabase CLI');
  console.log('  1. Instala: npm install -g supabase');
  console.log('  2. Ejecuta: supabase db push\n');
  
  console.log('Una vez aplicadas las migraciones,');
  console.log('volveremos a descomentar los hooks del código.\n');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
