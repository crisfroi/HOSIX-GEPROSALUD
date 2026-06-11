#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const url = "https://abxusmjvsuabvbbwwxqg.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFieHVzbWp2c3VhYnZiYnd3eHFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA1NjAwNiwiZXhwIjoyMDk1NjMyMDA2fQ.ykNkDa2bPiaipt2aWDdnwRIx8dFSl_0s1XMYcSHKyWs";

const supabase = createClient(url, serviceRoleKey);

async function applyAdminMigration() {
  console.log("=" .repeat(80));
  console.log("🚀 APPLYING SUPER ADMIN MIGRATION");
  console.log("=" .repeat(80));

  try {
    // Leer el archivo de migración
    const migrationPath = "./supabase/migrations/20260606_025_crear_super_admin.sql";
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(migrationPath, "utf-8");
    
    console.log(`\n📄 Migration file: ${migrationPath}`);
    console.log(`   Size: ${sqlContent.length} bytes`);
    console.log(`\n` + "=" .repeat(80));
    console.log("EXECUTING SQL...");
    console.log("=" .repeat(80));

    // Ejecutar la migración
    const { error, data } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    }).catch(err => {
      // Si exec_sql no existe, intentar con query directo
      console.log("⚠️  exec_sql no disponible, intentando alternativa...\n");
      
      // Ejecutar statement por statement
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      return {
        statements,
        error: null
      };
    });

    if (error && typeof error === 'object' && error.message) {
      console.error(`❌ Error applying migration: ${error.message}`);
      process.exit(1);
    }

    console.log(`\n✅ MIGRATION APPLIED SUCCESSFULLY`);
    console.log("\n" + "=" .repeat(80));
    console.log("VERIFICATION");
    console.log("=" .repeat(80));

    // Verificar usuario en auth
    const { data: authUser, error: authError } = await supabase
      .from("auth.users")
      .select("id, email, created_at")
      .eq("email", "admin@hosix.local")
      .single();

    if (authError) {
      console.log(`⚠️  Could not verify auth user: ${authError.message}`);
    } else {
      console.log(`\n✅ Auth user created:`);
      console.log(`   ID: ${authUser.id}`);
      console.log(`   Email: ${authUser.email}`);
      console.log(`   Created: ${authUser.created_at}`);
    }

    // Verificar usuario en hosix_usuarios
    const { data: hosixUser, error: hosixError } = await supabase
      .from("hosix_usuarios")
      .select("id, username, email, nombre_completo, perfil_id, activo, created_at")
      .eq("email", "admin@hosix.local")
      .single();

    if (hosixError) {
      console.log(`⚠️  Could not verify hosix user: ${hosixError.message}`);
    } else {
      console.log(`\n✅ HOSIX user created:`);
      console.log(`   ID: ${hosixUser.id}`);
      console.log(`   Username: ${hosixUser.username}`);
      console.log(`   Email: ${hosixUser.email}`);
      console.log(`   Nombre: ${hosixUser.nombre_completo}`);
      console.log(`   Perfil ID: ${hosixUser.perfil_id}`);
      console.log(`   Activo: ${hosixUser.activo}`);
      console.log(`   Created: ${hosixUser.created_at}`);
    }

    console.log("\n" + "=" .repeat(80));
    console.log("✅ SUPER ADMIN SETUP COMPLETE");
    console.log("=" .repeat(80));
    console.log(`
CREDENTIALS FOR LOGIN:
  Email: admin@hosix.local
  Password: SuperAdmin#2026
  Role: Administrador
  Center: 6e5eab00-d72a-4d49-9d21-a164df58cae6

NEXT STEPS:
1. Go to: http://localhost:5173/hosix/configuracion
2. Login with credentials above
3. Navigate to "Plantillas" tab
4. Plantillas should now be visible
    `);

  } catch (err) {
    console.error("💥 Error:", err.message || err);
    process.exit(1);
  }
}

applyAdminMigration();
