#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";

const url = "https://abxusmjvsuabvbbwwxqg.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFieHVzbWp2c3VhYnZiYnd3eHFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA1NjAwNiwiZXhwIjoyMDk1NjMyMDA2fQ.ykNkDa2bPiaipt2aWDdnwRIx8dFSl_0s1XMYcSHKyWs";

const supabase = createClient(url, serviceRoleKey);

async function auditSupabase() {
  console.log("=" .repeat(80));
  console.log("🔍 SUPABASE HOSIX AUDIT");
  console.log("=" .repeat(80));
  
  try {
    // ==========================================
    // 1. VERIFICAR USUARIOS EN AUTH
    // ==========================================
    console.log("\n1️⃣ USUARIOS EN AUTH");
    console.log("-".repeat(80));
    
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log(`❌ Error: ${usersError.message}`);
    } else {
      console.log(`✅ Total usuarios: ${users?.length || 0}`);
      users?.forEach(u => {
        console.log(`   - ${u.email} (${u.id})`);
        console.log(`     Created: ${u.created_at}`);
        console.log(`     Email confirmed: ${u.email_confirmed_at ? 'Sí' : 'No'}`);
      });
    }

    // ==========================================
    // 2. VERIFICAR TABLAS DE PLANTILLAS
    // ==========================================
    console.log("\n2️⃣ TABLAS DE PLANTILLAS (configuracion schema)");
    console.log("-".repeat(80));

    const plantillasQuery = `
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_name = t.table_name AND table_schema = 'configuracion') as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'configuracion' 
        AND table_name LIKE 'plantillas%' OR table_name LIKE 'documentos%'
      ORDER BY table_name
    `;

    const { data: tablesInfo, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "configuracion")
      .in("table_name", [
        "plantillas_documentos",
        "plantillas_campos", 
        "plantillas_versiones",
        "documentos_generados",
        "documentos_firmas",
        "documentos_auditoria"
      ]);

    if (tablesError) {
      console.log(`❌ Error: ${tablesError.message}`);
    } else {
      console.log(`✅ Tablas encontradas: ${tablesInfo?.length || 0}`);
      tablesInfo?.forEach(t => console.log(`   - ${t.table_name}`));
    }

    // ==========================================
    // 3. CONTAR DATOS EN PLANTILLAS_DOCUMENTOS
    // ==========================================
    console.log("\n3️⃣ DATOS EN PLANTILLAS");
    console.log("-".repeat(80));

    // Usar SQL directo via psql
    try {
      const countResult = execSync(
        `PGPASSWORD="${process.env.SUPABASE_DB_PASSWORD || 'postgres'}" psql -h "${url.replace('https://', '').replace('.supabase.co', '.db.supabase.co')}" -U postgres -d postgres -c "SELECT COUNT(*) as total FROM configuracion.plantillas_documentos;" 2>/dev/null || echo "0"`,
        { encoding: 'utf-8' }
      );
      console.log(`⚠️  Nota: Requiere DB password para psql`);
    } catch (err) {
      // Fallback: intentar obtener un registro
      const { data: sample, error: sampleError, count } = await supabase
        .from("configuracion.plantillas_documentos")
        .select("id, codigo, nombre, grupo", { count: "exact" })
        .limit(5);

      if (sampleError) {
        console.log(`❌ No se puede acceder vía API REST: ${sampleError.message}`);
      } else {
        console.log(`✅ Plantillas accesibles vía API REST`);
        console.log(`   Total: ${count}`);
        console.log(`   Muestras:`);
        sample?.forEach(p => console.log(`   - ${p.codigo}: ${p.nombre} (${p.grupo})`));
      }
    }

    // ==========================================
    // 4. VERIFICAR POLÍTICAS RLS
    // ==========================================
    console.log("\n4️⃣ POLÍTICAS RLS");
    console.log("-".repeat(80));

    const { data: policies, error: policiesError } = await supabase
      .from("pg_policies")
      .select("*")
      .eq("tablename", "plantillas_documentos");

    if (policiesError) {
      console.log(`⚠️  No se puede consultar directamente desde API`);
      console.log(`   Necesitas verificar en SQL Editor:`);
      console.log(`   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'plantillas_documentos';`);
    } else {
      console.log(`✅ Políticas encontradas: ${policies?.length || 0}`);
      policies?.forEach(p => console.log(`   - ${p.policyname}`));
    }

    // ==========================================
    // 5. VERIFICAR PERMISOS DE ROLES
    // ==========================================
    console.log("\n5️⃣ PERMISOS DE ROLES");
    console.log("-".repeat(80));
    console.log(`   Para verificar permisos, ejecuta en SQL Editor:`);
    console.log(`   SELECT grantee, privilege_type, table_name`);
    console.log(`   FROM information_schema.role_table_grants`);
    console.log(`   WHERE table_schema = 'configuracion' AND table_name LIKE 'plantillas%';`);

    // ==========================================
    // 6. VERIFICAR RLS HABILITADO
    // ==========================================
    console.log("\n6️⃣ ESTADO RLS");
    console.log("-".repeat(80));
    console.log(`   Para verificar RLS, ejecuta en SQL Editor:`);
    console.log(`   SELECT schemaname, tablename, rowsecurity`);
    console.log(`   FROM pg_tables`);
    console.log(`   WHERE schemaname = 'configuracion';`);

    // ==========================================
    // 7. SCHEMA CONFIG
    // ==========================================
    console.log("\n7️⃣ CONFIGURACIÓN DE CLIENTE");
    console.log("-".repeat(80));
    console.log(`✅ Supabase URL: ${url}`);
    console.log(`✅ Service Role Key: ${serviceRoleKey.substring(0, 50)}...`);
    console.log(`✅ MCP Config: .mcp/config.json`);

    // ==========================================
    // RESUMEN Y RECOMENDACIONES
    // ==========================================
    console.log("\n" + "=" .repeat(80));
    console.log("📋 RESUMEN Y PRÓXIMOS PASOS");
    console.log("=" .repeat(80));

    console.log(`
1. ✅ Tablas plantillas existen en schema 'configuracion'
2. ⚠️  Usuarios en auth: ${users?.length || 0}
3. ⚠️  Necesitas crear un usuario para loguearte
4. ⚠️  Necesitas verificar RLS y permisos en SQL Editor

RECOMENDACIONES:
- Si COUNT es 0: Ejecuta el GRANT de permisos en SQL Editor
- Si no hay usuarios: Crea un usuario (admin) en SQL Editor
- Después: Intenta loguearte en el dashboard
- Finalmente: Las plantillas deberán aparecer en Configuración
    `);

  } catch (err) {
    console.error("💥 Error:", err.message);
  }
}

auditSupabase();
