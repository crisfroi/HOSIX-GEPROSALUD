#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('.mcp/config.json', 'utf-8'));
const env = config.mcpServers.supabase.env;

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function listTables() {
  try {
    const { data, error } = await supabase.rpc('list_all_tables');
    
    if (error) {
      console.log('RPC method not available, trying direct query...');
      // Fallback: try to query some common Fase 5 tables to verify existence
      const fase5Tables = [
        'hosix_admision_central',
        'hosix_cred_programa',
        'hosix_cajas',
        'hosix_presupuestos',
        'hosix_quirofanos_bloques',
        'hosix_obstetricia',
        'hosix_recobros',
        'hosix_suministros'
      ];

      console.log('\nVerifying Fase 5 tables:\n');
      for (const table of fase5Tables) {
        const { data, error } = await supabase
          .from(table)
          .select('1')
          .limit(1);
        
        if (error?.code === 'PGRST116') {
          console.log(`  ✗ ${table} - NOT FOUND`);
        } else {
          console.log(`  ✓ ${table} - EXISTS`);
        }
      }
    } else {
      console.log('All tables in public schema:\n');
      if (Array.isArray(data)) {
        data.forEach(row => {
          console.log(`  - ${row.tablename || row.table_name}`);
        });
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

listTables();
