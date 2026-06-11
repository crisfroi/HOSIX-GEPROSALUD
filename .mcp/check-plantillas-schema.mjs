#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://abxusmjvsuabvbbwwxqg.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no configurada');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkSchema() {
  console.log('🔍 Verificando dónde está plantillas_documentos...\n');

  try {
    // Consultar information_schema para ver en qué schema está
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_schema, table_name')
      .filter('table_name', 'eq', 'plantillas_documentos');

    if (error) throw error;

    console.log('📋 Tablas encontradas:');
    if (tables && tables.length > 0) {
      tables.forEach(t => {
        console.log(`   • ${t.table_schema}.${t.table_name}`);
      });
    } else {
      console.log('   ❌ Tabla no encontrada en information_schema');
    }

    // Intentar leer desde diferentes schemas
    console.log('\n📊 Intentando acceder a plantillas_documentos desde diferentes ubicaciones:\n');

    // Sin schema (public)
    try {
      const { data: data1, error: error1 } = await supabase
        .from('plantillas_documentos')
        .select('COUNT(*)', { count: 'exact' });
      console.log(`   ✓ plantillas_documentos: ${error1 ? '❌ ' + error1.message : '✅ ' + (data1?.length || 'OK')}`);
    } catch (e) {
      console.log(`   ✓ plantillas_documentos: ❌ ${e.message}`);
    }

    // Con schema configuracion
    try {
      const { data: data2, error: error2 } = await supabase
        .from('configuracion.plantillas_documentos')
        .select('COUNT(*)', { count: 'exact' });
      console.log(`   ✓ configuracion.plantillas_documentos: ${error2 ? '❌ ' + error2.message : '✅ ' + (data2?.length || 'OK')}`);
    } catch (e) {
      console.log(`   ✓ configuracion.plantillas_documentos: ❌ ${e.message}`);
    }

    // Verificar RLS policies
    console.log('\n🔒 Verificando RLS policies:');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .filter('tablename', 'eq', 'plantillas_documentos');

    if (policiesError) {
      console.log(`   ❌ No se pudieron leer las policies: ${policiesError.message}`);
    } else if (policies && policies.length > 0) {
      console.log(`   ✅ Encontradas ${policies.length} policies:`);
      policies.forEach(p => {
        console.log(`      • ${p.policyname}: ${p.qual}`);
      });
    } else {
      console.log('   ⚠️  No hay policies definidas');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSchema();
