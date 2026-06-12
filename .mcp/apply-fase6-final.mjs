#!/usr/bin/env node

/**
 * Script para aplicar la migración Fase 6 - Lab-Imagen-Facturación
 * Ejecuta: node apply-fase6-final.mjs
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Credenciales HOSIX (abxusmjvsuabvbbwwxqg)
const SUPABASE_URL = "https://abxusmjvsuabvbbwwxqg.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFieHVzbWp2c3VhYnZiYnd3eHFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA1NjAwNiwiZXhwIjoyMDk1NjMyMDA2fQ.ykNkDa2bPiaipt2aWDdnwRIx8dFSl_0s1XMYcSHKyWs";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function executeSql(sql) {
  try {
    const { data, error } = await supabase.rpc("exec_sql", { 
      sql: sql,
      command: "all"
    });
    
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log("\n🚀 APLICANDO MIGRACIÓN FASE 6 - LAB-IMAGEN-FACTURACIÓN\n");
  console.log(`Proyecto: ${SUPABASE_URL}`);
  console.log(`Fecha: ${new Date().toISOString()}\n`);
  
  const migrationFile = path.join(__dirname, "../supabase/migrations/20260611_fase6_integracion_lab_imagen_facturacion.sql");
  
  if (!fs.existsSync(migrationFile)) {
    console.error(`❌ Archivo no encontrado: ${migrationFile}`);
    process.exit(1);
  }
  
  const fullSql = fs.readFileSync(migrationFile, "utf8");
  
  // Dividir por secciones (bloques separados por -- ============)
  const sections = fullSql
    .split(/^-- ={10,}/m)
    .filter(s => s.trim().length > 0)
    .map(s => s.trim());
  
  console.log(`📋 Total de secciones: ${sections.length}\n`);
  
  let totalSuccess = 0;
  let totalError = 0;
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    
    // Obtener nombre de sección (primera línea comentada)
    const firstLine = section.split("\n")[0];
    const sectionName = firstLine.replace(/^--\s*/, "").trim().substring(0, 50);
    
    console.log(`\n[${i + 1}/${sections.length}] ${sectionName}`);
    console.log("=".repeat(70));
    
    // Dividir en statements individuales
    const statements = section
      .split(";")
      .map(s => s.trim())
      .filter(s => s && !s.startsWith("--"));
    
    for (const stmt of statements) {
      if (!stmt || stmt.length < 5) continue;
      
      const preview = stmt.substring(0, 70).replace(/\n/g, " ") + (stmt.length > 70 ? "..." : "");
      process.stdout.write(`  ⏳ ${preview}`);
      
      const result = await executeSql(stmt);
      
      if (result.success) {
        console.log(" ✅");
        totalSuccess++;
      } else {
        console.log(` ❌ ${result.error}`);
        totalError++;
      }
      
      await new Promise(r => setTimeout(r, 50));
    }
  }
  
  console.log("\n\n" + "=".repeat(70));
  console.log("📊 RESUMEN FINAL");
  console.log("=".repeat(70));
  console.log(`✅ Ejecutados exitosamente: ${totalSuccess}`);
  console.log(`❌ Errores: ${totalError}`);
  
  if (totalError === 0) {
    console.log("\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE! 🎉\n");
    console.log("Próximas acciones:");
    console.log("1. Verificar que las tablas existen en Supabase dashboard");
    console.log("2. Crear componentes frontend (SelectorSolicitudesInline, etc.)");
    console.log("3. Integrar en ConsultaMedicaForm.tsx\n");
    process.exit(0);
  } else {
    console.log(`\n⚠️  Se completó con ${totalError} errores. Revisa los detalles arriba.\n`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});
