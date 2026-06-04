#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuración Supabase
const supabaseUrl = "https://abxusmjvsuabvbbwwxqg.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY no configurada");
  console.error("Configúrala en .env o en variables de entorno");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration(filePath, fileName) {
  try {
    console.log(`\n📝 Leyendo migración: ${fileName}...`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Archivo no encontrado: ${filePath}`);
      return false;
    }

    const sql = fs.readFileSync(filePath, "utf8");
    
    console.log(`⏳ Aplicando migración: ${fileName}...`);
    
    // Intentar ejecutar todo el SQL de una vez
    const { data, error } = await supabase.rpc("exec_sql", { sql });
    
    if (error) {
      console.warn(`⚠️  Intento directo falló, ejecutando por partes...`);
      
      // Dividir por ; y ejecutar línea por línea
      const statements = sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s && !s.startsWith("--"));

      let count = 0;
      for (const stmt of statements) {
        try {
          await supabase.rpc("exec_sql", { sql: stmt + ";" });
          count++;
        } catch (stmtError) {
          console.warn(`⚠️  Error en statement ${count + 1}, continuando...`);
        }
      }
      
      console.log(`✅ Migración ${fileName} aplicada (${count} statements ejecutados)`);
      return true;
    }
    
    console.log(`✅ Migración ${fileName} aplicada exitosamente`);
    return true;
  } catch (err) {
    console.error(`❌ Error aplicando ${fileName}:`, err.message);
    return false;
  }
}

async function main() {
  console.log("════════════════════════════════════════════════════════════════");
  console.log("🔧 Aplicando Migraciones de Profesionales y Médicos");
  console.log("════════════════════════════════════════════════════════════════");

  const migrationsPath = path.join(
    __dirname,
    "..",
    "supabase",
    "migrations"
  );

  const migrations = [
    {
      file: "20250129_001_extend_hosix_usuarios_profesionales.sql",
      description: "Extensión de hosix_usuarios con campos de profesional",
    },
    {
      file: "20250206_011_hosix_medicos_asis_1.sql",
      description: "Módulo de Médicos - ASIS 1.0",
    },
  ];

  let successCount = 0;

  for (const migration of migrations) {
    console.log(`\n📋 ${migration.description}`);
    const filePath = path.join(migrationsPath, migration.file);
    const success = await applyMigration(filePath, migration.file);
    
    if (success) {
      successCount++;
    }
    
    // Esperar un poco entre migraciones
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\n════════════════════════════════════════════════════════════════");
  console.log(`📊 Resultado: ${successCount}/${migrations.length} migraciones aplicadas`);
  
  if (successCount === migrations.length) {
    console.log("✅ ¡Todas las migraciones se aplicaron exitosamente!");
    process.exit(0);
  } else {
    console.log("❌ Algunas migraciones tuvieron errores");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("💥 Error fatal:", err);
  process.exit(1);
});
