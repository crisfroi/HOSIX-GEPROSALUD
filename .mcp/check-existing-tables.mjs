#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('.mcp/config.json', 'utf-8'));
const env = config.mcpServers.supabase.env;

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// Tables mentioned in code
const tablesToCheck = [
  // Compras
  'hosix_presupuestos',
  'hosix_licitaciones',
  'hosix_licitaciones_ofertas',
  'hosix_adjudicaciones',
  
  // Recobros
  'hosix_recobros',
  'hosix_recobros_notas_cargo',
  'hosix_recobros_notas_credito',
  'hosix_recobros_solicitudes',
  'hosix_recobros_morosidad',
  
  // Farmacia
  'hosix_farmacia_dispensario',
  'hosix_farmacia_dispensaciones',
  'hosix_farmacia_farmacovigilancia',
  
  // Interconsultas
  'hosix_interconsultas_solicitudes',
  'hosix_interconsultas_respuestas',
  
  // Prescripciones
  'hosix_prescripciones',
  
  // Quirófanos
  'hosix_quirofanos_bloques',
  'hosix_quirofanos_salas',
  'hosix_quirofanos_programaciones',
  'hosix_quirofanos_diario',
];

async function checkTable(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('1')
      .limit(1);

    if (error?.code === 'PGRST116' || error?.message?.includes('Could not find the table')) {
      return { exists: false, error: error?.code };
    }
    return { exists: true };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function main() {
  console.log('🔍 Verificando existencia de tablas Fase 5...\n');
  
  const results = [];
  let existingCount = 0;
  let missingCount = 0;

  for (const tableName of tablesToCheck) {
    const result = await checkTable(tableName);
    
    if (result.exists) {
      console.log(`✅ ${tableName}`);
      existingCount++;
    } else {
      console.log(`❌ ${tableName} - NO EXISTE`);
      missingCount++;
    }
    
    results.push({ table: tableName, exists: result.exists });
  }

  console.log(`\n📊 RESUMEN:`);
  console.log(`  Tablas existentes: ${existingCount}`);
  console.log(`  Tablas faltantes: ${missingCount}`);
  console.log(`  Total: ${tablesToCheck.length}`);

  // Save results
  fs.writeFileSync(
    '.mcp/table-check-results.json',
    JSON.stringify(results, null, 2)
  );

  console.log('\n✅ Resultados guardados en: .mcp/table-check-results.json');
}

main().catch(console.error);
