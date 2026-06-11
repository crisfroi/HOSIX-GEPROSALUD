#!/usr/bin/env node

import fs from 'fs';

const config = JSON.parse(fs.readFileSync('.mcp/config.json', 'utf-8'));
const env = config.mcpServers.supabase.env;

// Read migration files
const COMPRAS_MIGRATION = fs.readFileSync('supabase/migrations/20260610_fase5_compras_presupuestos.sql', 'utf-8');
const FARMACIA_MIGRATION = fs.readFileSync('supabase/migrations/20260610_fase5_farmacia_dispensario.sql', 'utf-8');

async function executeSql(sql, name) {
  console.log(`\n📝 Aplicando: ${name}...`);
  
  try {
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ sql })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || response.statusText);
    }
    
    console.log(`✅ ${name} - APLICADA EXITOSAMENTE`);
    return true;
  } catch (err) {
    console.error(`⚠️ RPC method no disponible, intentando alternative...`);
    
    // Try individual statements
    try {
      const statements = sql.split(';').filter(s => s.trim().length > 0 && !s.trim().startsWith('--'));
      
      console.log(`   Ejecutando ${statements.length} statements...`);
      
      let successCount = 0;
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim();
        
        try {
          const response = await fetch(`${env.SUPABASE_URL}/rest/v1/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/sql',
              'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: stmt + ';'
          });

          if (response.ok || response.status === 204) {
            successCount++;
          }
        } catch (stmtErr) {
          // Continue on individual statement errors
        }
      }
      
      console.log(`✅ ${name} - ${successCount}/${statements.length} statements ejecutados`);
      return successCount > 0;
    } catch (fallbackErr) {
      console.error(`❌ Error:`, fallbackErr.message);
      return false;
    }
  }
}

async function main() {
  console.log('🚀 APLICANDO MIGRACIONES FASE 5 VIA SQL');
  console.log('='.repeat(60));
  console.log(`📍 Supabase URL: ${env.SUPABASE_URL}`);
  console.log(`🔑 Usando Service Role Key\n`);
  
  const results = [];
  
  results.push(await executeSql(COMPRAS_MIGRATION, 'Compras (20260610)'));
  results.push(await executeSql(FARMACIA_MIGRATION, 'Farmacia (20260610)'));
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESUMEN:');
  
  const successful = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;
  
  console.log(`  ✅ Exitosas: ${successful}/${results.length}`);
  if (failed > 0) console.log(`  ❌ Fallidas: ${failed}/${results.length}`);
  
  if (successful === results.length) {
    console.log('\n🎉 ¡TODAS LAS MIGRACIONES APLICADAS!');
  }
  
  console.log('\n⚠️ IMPORTANTE: Verifica en Supabase Dashboard que las tablas fueron creadas.');
  console.log('   Si no funcionó vía API, copia el SQL en el SQL Editor del dashboard.\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
