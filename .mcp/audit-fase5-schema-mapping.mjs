#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('.mcp/config.json', 'utf-8'));
const env = config.mcpServers.supabase.env;

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// Fase 5 modules with their expected tables
const fase5Modules = {
  'Admisión Central': [
    'hosix_admision_central',
    'hosix_admision_historia_clinica',
    'hosix_admision_vital_signs'
  ],
  'CRED': [
    'hosix_cred_programa',
    'hosix_cred_seguimiento',
    'hosix_cred_reportes'
  ],
  'Cajas': [
    'hosix_cajas',
    'hosix_cajas_movimientos',
    'hosix_cajas_cuadres'
  ],
  'Compras': [
    'hosix_presupuestos',
    'hosix_licitaciones',
    'hosix_licitaciones_ofertas',
    'hosix_adjudicaciones'
  ],
  'Quirófanos': [
    'hosix_quirofanos',
    'hosix_quirofanos_programaciones',
    'hosix_quirofanos_diario'
  ],
  'Obstetricia': [
    'hosix_obstetricia',
    'hosix_obstetricia_controles',
    'hosix_obstetricia_partos'
  ],
  'Recobros': [
    'hosix_recobros',
    'hosix_recobros_solicitudes',
    'hosix_recobros_detalles'
  ],
  'Suministros': [
    'hosix_suministros',
    'hosix_suministros_stock',
    'hosix_suministros_movimientos'
  ]
};

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('1')
      .limit(1);

    if (error && error.code === 'PGRST116') {
      return { exists: false, error: error.message };
    }
    return { exists: true, error: null };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function getTableColumns(tableName) {
  try {
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: tableName });

    if (error) {
      // Fallback: try to query and introspect
      const { data: sample, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (sample && sample.length > 0) {
        return Object.keys(sample[0]);
      }
      return [];
    }
    return data;
  } catch (err) {
    return [];
  }
}

async function auditFase5() {
  console.log('🔍 AUDITORÍA FASE 5: MAPPING DE SCHEMAS Y CÓDIGO\n');
  console.log('='.repeat(60));

  const results = {
    modules: {},
    summary: {
      totalModules: Object.keys(fase5Modules).length,
      modulesComplete: 0,
      tablesExist: 0,
      tablesMissing: 0,
      totalTables: 0,
      issues: []
    }
  };

  for (const [moduleName, tables] of Object.entries(fase5Modules)) {
    console.log(`\n📦 ${moduleName}`);
    console.log('-'.repeat(40));

    results.modules[moduleName] = {
      tables: {}
    };

    let moduleComplete = true;

    for (const tableName of tables) {
      const { exists, error } = await checkTableExists(tableName);

      if (exists) {
        const columns = await getTableColumns(tableName);
        console.log(`  ✓ ${tableName} (${columns.length} columnas)`);
        results.modules[moduleName].tables[tableName] = {
          exists: true,
          columns: columns
        };
        results.summary.tablesExist++;
      } else {
        console.log(`  ✗ ${tableName} NO EXISTE`);
        results.modules[moduleName].tables[tableName] = {
          exists: false,
          error: error
        };
        results.summary.tablesMissing++;
        moduleComplete = false;
        results.summary.issues.push(`[${moduleName}] Tabla faltante: ${tableName}`);
      }

      results.summary.totalTables++;
    }

    if (moduleComplete) {
      results.summary.modulesComplete++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 RESUMEN:`);
  console.log(`  Módulos completos: ${results.summary.modulesComplete}/${results.summary.totalModules}`);
  console.log(`  Tablas existentes: ${results.summary.tablesExist}/${results.summary.totalTables}`);
  console.log(`  Tablas faltantes: ${results.summary.tablesMissing}`);

  if (results.summary.issues.length > 0) {
    console.log(`\n⚠️  PROBLEMAS ENCONTRADOS:`);
    results.summary.issues.forEach(issue => {
      console.log(`  - ${issue}`);
    });
  }

  // Save results
  fs.writeFileSync(
    '.mcp/audit-fase5-results.json',
    JSON.stringify(results, null, 2)
  );

  console.log('\n✅ Resultados guardados en: .mcp/audit-fase5-results.json');

  return results;
}

auditFase5().catch(err => {
  console.error('❌ Error durante auditoría:', err);
  process.exit(1);
});
