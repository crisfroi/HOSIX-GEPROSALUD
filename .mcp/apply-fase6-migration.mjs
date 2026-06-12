#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuración Supabase - PROYECTO HOSIX
const supabaseUrl = "https://abxusmjvsuabvbbwwxqg.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFieHVzbWp2c3VhYnZiYnd3eHFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA1NjAwNiwiZXhwIjoyMDk1NjMyMDA2fQ.ykNkDa2bPiaipt2aWDdnwRIx8dFSl_0s1XMYcSHKyWs";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSql(sql) {
  try {
    console.log("⏳ Ejecutando SQL...");
    const { data, error } = await supabase.rpc("exec_sql", { sql });
    
    if (error) {
      console.error("❌ Error ejecutando SQL:", error);
      return false;
    }
    
    console.log("✅ SQL ejecutado exitosamente");
    return true;
  } catch (err) {
    console.error("❌ Error en ejecución:", err.message);
    return false;
  }
}

async function applyMigrationStatements() {
  // Leer el archivo de migración
  const migrationPath = path.join(__dirname, "../supabase/migrations/20260611_fase6_integracion_lab_imagen_facturacion.sql");
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Archivo de migración no encontrado: ${migrationPath}`);
    process.exit(1);
  }
  
  const fullSql = fs.readFileSync(migrationPath, "utf8");
  
  // Dividir por statements y ejecutar
  const statements = fullSql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("--") && s.length > 0);
  
  console.log(`\n📋 Se encontraron ${statements.length} statements en la migración\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const stmtPreview = stmt.substring(0, 60) + (stmt.length > 60 ? "..." : "");
    
    console.log(`[${i + 1}/${statements.length}] Ejecutando: ${stmtPreview}`);
    
    try {
      const { error } = await supabase.rpc("exec_sql", { sql: stmt + ";" });
      
      if (error) {
        console.error(`    ❌ Error: ${error.message}`);
        errorCount++;
      } else {
        console.log(`    ✅ Completado`);
        successCount++;
      }
    } catch (err) {
      console.error(`    ❌ Error: ${err.message}`);
      errorCount++;
    }
    
    // Pequeña pausa entre statements
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log(`\n📊 Resultados:`);
  console.log(`  ✅ Exitosos: ${successCount}`);
  console.log(`  ❌ Errores: ${errorCount}`);
  
  if (errorCount === 0) {
    console.log(`\n🎉 ¡MIGRACIÓN APLICADA EXITOSAMENTE!\n`);
    return true;
  } else {
    console.log(`\n⚠️  Se completó con ${errorCount} errores\n`);
    return false;
  }
}

// Ejecutar
console.log("🚀 Iniciando aplicación de migración Fase 6...\n");
applyMigrationStatements()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error("❌ Error fatal:", err);
    process.exit(1);
  });
