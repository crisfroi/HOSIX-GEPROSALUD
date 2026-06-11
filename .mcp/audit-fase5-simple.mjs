#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Leer config.json
const configPath = path.join(process.cwd(), 'config.json');
let SUPABASE_URL, SERVICE_ROLE_KEY;

try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  SUPABASE_URL = config.mcpServers.supabase.env.SUPABASE_URL;
  SERVICE_ROLE_KEY = config.mcpServers.supabase.env.SUPABASE_SERVICE_ROLE_KEY;
} catch (err) {
  console.error('❌ Error leyendo config.json:', err.message);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('1')
      .limit(1);
    
    return !error || error.code !== 'PGRST116'; // 404 significa tabla no existe
  } catch (e) {
    return false;
  }
}

async function auditTablas() {
  console.log('📊 AUDITORIA FASE 5: Verificando tablas existentes\n');

  const tablasEsperadas = {
    'Admisión Central': ['hosix_admisiones', 'hosix_admisiones_camas'],
    'CRED': ['hosix_cred_menores', 'hosix_cred_vacunacion', 'hosix_cred_seguimiento'],
    'Cajas': ['hosix_cajas_caja', 'hosix_cajas_transacciones', 'hosix_cajas_arqueos'],
    'Compras': ['hosix_compras_ordenes', 'hosix_compras_detalle', 'hosix_compras_recepcion'],
    'Quirófanos': ['hosix_quirofanos_salas', 'hosix_quirofanos_programaciones', 'hosix_quirofanos_diario'],
    'Obstetricia': ['hosix_obstetricia_gestaciones', 'hosix_obstetricia_controles', 'hosix_obstetricia_partos', 'hosix_obstetricia_puerperio'],
    'Recobros': ['hosix_recobros', 'hosix_recobros_notas_cargo', 'hosix_recobros_notas_credito', 'hosix_recobros_morosidad'],
    'Suministros': ['hosix_suministros_stock', 'hosix_suministros_movimientos', 'hosix_suministros_solicitudes']
  };

  console.log('🔍 RESULTADO POR MÓDULO:\n');

  let totalExistentes = 0;
  let totalFaltantes = 0;
  const modulosCompletos = [];

  for (const [modulo, tablas] of Object.entries(tablasEsperadas)) {
    const existentes = [];
    const faltantes = [];

    for (const tabla of tablas) {
      const exists = await checkTableExists(tabla);
      if (exists) {
        existentes.push(tabla);
        totalExistentes++;
      } else {
        faltantes.push(tabla);
        totalFaltantes++;
      }
    }

    const status = faltantes.length === 0 ? '✅' : '🔴';
    console.log(`${status} ${modulo}:`);
    
    existentes.forEach(t => console.log(`   ✅ ${t}`));
    faltantes.forEach(t => console.log(`   ❌ ${t}`));
    console.log();

    if (faltantes.length === 0) {
      modulosCompletos.push(modulo);
    }
  }

  console.log('='.repeat(80));
  console.log(`\n📊 TOTALES:`);
  console.log(`   ✅ Existentes: ${totalExistentes}/${totalExistentes + totalFaltantes}`);
  console.log(`   ❌ Faltantes: ${totalFaltantes}/${totalExistentes + totalFaltantes}`);
  console.log(`\n✅ Módulos COMPLETOS (${modulosCompletos.length}/8):`);
  modulosCompletos.forEach(m => console.log(`   • ${m}`));
}

auditTablas().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
