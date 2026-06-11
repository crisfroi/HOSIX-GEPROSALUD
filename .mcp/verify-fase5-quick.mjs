#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('.mcp/config.json', 'utf-8'));
const env = config.mcpServers.supabase.env;

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// Known problematic table references from audit findings
const problematicReferences = [
  {
    module: 'Prescripciones',
    codeUses: 'hosix_cpoe_prescripciones',
    dbActual: 'hosix_prescripciones',
    file: 'src/components/hosix/prescripcion/PrescripcionesListado.tsx'
  },
  {
    module: 'Médicos',
    codeUses: 'profesionales_sanitarios.user_id',
    dbActual: 'profesionales_sanitarios (sin user_id)',
    file: 'src/hooks/useHosixMedicos.ts'
  },
  {
    module: 'Turno',
    codeUses: 'profesionales_sanitarios.esta_en_turno',
    dbActual: 'profesionales_sanitarios (sin esta_en_turno)',
    file: 'src/components/hosix/turnos/TurnoActivationButton.tsx'
  },
  {
    module: 'Quirófanos',
    codeUses: 'hosix_quirofanos_programaciones',
    dbActual: '¿Existe con este nombre?',
    file: 'src/hooks/useHosixQuirofanos.ts'
  },
  {
    module: 'Obstetricia',
    codeUses: 'hosix_obstetricia_controles',
    dbActual: '¿Existe con este nombre?',
    file: 'src/hooks/useHosixObstetricia.ts'
  },
  {
    module: 'Laboratorio',
    codeUses: 'hosix_laboratorio_solicitudes',
    dbActual: '¿Existe con este nombre?',
    file: 'src/hooks/useHosixLaboratorio.ts'
  },
  {
    module: 'Imagenología',
    codeUses: 'hosix_imagenologia_modalidades',
    dbActual: '¿Existe con este nombre?',
    file: 'src/hooks/useHosixImagenologia.ts'
  }
];

async function verifyTable(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error?.code === 'PGRST116') {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

async function verify() {
  console.log('🔍 VERIFICANDO REFERENCIAS PROBLEMÁTICAS FASE 5\n');

  for (const ref of problematicReferences) {
    const exists = await verifyTable(ref.codeUses);
    const status = exists ? '✓' : '✗';
    console.log(`${status} ${ref.module}`);
    console.log(`   Código usa: ${ref.codeUses}`);
    console.log(`   DB tiene: ${ref.dbActual}`);
    console.log(`   Archivo: ${ref.file}`);
    console.log();
  }
}

verify();
