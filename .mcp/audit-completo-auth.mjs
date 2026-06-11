#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

const url = "https://abxusmjvsuabvbbwwxqg.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFieHVzbWp2c3VhYnZiYnd3eHFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA1NjAwNiwiZXhwIjoyMDk1NjMyMDA2fQ.ykNkDa2bPiaipt2aWDdnwRIx8dFSl_0s1XMYcSHKyWs";

const supabase = createClient(url, serviceRoleKey);

async function auditCompleto() {
  console.log("=" .repeat(100));
  console.log("🔍 AUDITORÍA COMPLETA: AUTH, USUARIOS Y CONFIGURACIÓN");
  console.log("=" .repeat(100));

  try {
    // ==========================================
    // 1. USUARIO EN AUTH.USERS
    // ==========================================
    console.log("\n1️⃣ VERIFICAR USUARIO EN auth.users");
    console.log("-".repeat(100));

    const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();
    
    if (authUsersError) {
      console.log(`❌ Error listando usuarios: ${authUsersError.message}`);
    } else {
      const adminUser = authUsers.users?.find(u => u.email === 'admin@hosix.local');
      
      if (!adminUser) {
        console.log(`❌ NO EXISTE usuario admin@hosix.local en auth.users`);
        console.log(`   Usuarios en auth:`);
        authUsers.users?.forEach(u => {
          console.log(`   - ${u.email} (ID: ${u.id})`);
        });
      } else {
        console.log(`✅ Usuario encontrado en auth.users:`);
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   ID: ${adminUser.id}`);
        console.log(`   Email confirmed: ${adminUser.email_confirmed_at ? 'SÍ' : 'NO'}`);
        console.log(`   Created at: ${adminUser.created_at}`);
        console.log(`   Last sign in: ${adminUser.last_sign_in_at || 'Nunca'}`);
        console.log(`   User metadata: ${JSON.stringify(adminUser.user_metadata || {})}`);
        console.log(`   App metadata: ${JSON.stringify(adminUser.app_metadata || {})}`);
      }
    }

    // ==========================================
    // 2. USUARIO EN HOSIX_USUARIOS
    // ==========================================
    console.log("\n2️⃣ VERIFICAR USUARIO EN hosix_usuarios");
    console.log("-".repeat(100));

    const { data: hosixUser, error: hosixError } = await supabase
      .from('hosix_usuarios')
      .select('*')
      .eq('email', 'admin@hosix.local')
      .single();

    if (hosixError) {
      console.log(`❌ Error: ${hosixError.message}`);
    } else if (!hosixUser) {
      console.log(`❌ NO EXISTE usuario en hosix_usuarios`);
    } else {
      console.log(`✅ Usuario encontrado en hosix_usuarios:`);
      console.log(`   ID: ${hosixUser.id}`);
      console.log(`   Username: ${hosixUser.username}`);
      console.log(`   Email: ${hosixUser.email}`);
      console.log(`   Nombre completo: ${hosixUser.nombre_completo}`);
      console.log(`   Auth user ID: ${hosixUser.auth_user_id}`);
      console.log(`   Perfil ID: ${hosixUser.perfil_id}`);
      console.log(`   Centro salud ID: ${hosixUser.centro_salud_id}`);
      console.log(`   Activo: ${hosixUser.activo}`);
      console.log(`   Created at: ${hosixUser.created_at}`);
    }

    // ==========================================
    // 3. RELACIÓN ENTRE TABLAS
    // ==========================================
    console.log("\n3️⃣ VERIFICAR RELACIÓN auth.users <-> hosix_usuarios");
    console.log("-".repeat(100));

    if (authUsers && authUsers.users && hosixUser) {
      const adminAuthUser = authUsers.users.find(u => u.email === 'admin@hosix.local');
      
      if (adminAuthUser && hosixUser.auth_user_id === adminAuthUser.id) {
        console.log(`✅ IDs COINCIDEN: Relación correcta`);
        console.log(`   auth.users.id: ${adminAuthUser.id}`);
        console.log(`   hosix_usuarios.auth_user_id: ${hosixUser.auth_user_id}`);
      } else if (adminAuthUser && hosixUser.auth_user_id !== adminAuthUser.id) {
        console.log(`❌ IDs NO COINCIDEN: La relación está rota`);
        console.log(`   auth.users.id: ${adminAuthUser.id}`);
        console.log(`   hosix_usuarios.auth_user_id: ${hosixUser.auth_user_id}`);
      }
    }

    // ==========================================
    // 4. PERFILES EN HOSIX_PERFILES
    // ==========================================
    console.log("\n4️⃣ VERIFICAR PERFIL ASIGNADO");
    console.log("-".repeat(100));

    if (hosixUser) {
      const { data: perfil, error: perfilError } = await supabase
        .from('hosix_perfiles')
        .select('*')
        .eq('id', hosixUser.perfil_id)
        .single();

      if (perfilError) {
        console.log(`❌ Error: ${perfilError.message}`);
      } else {
        console.log(`✅ Perfil encontrado:`);
        console.log(`   ID: ${perfil.id}`);
        console.log(`   Nombre: ${perfil.nombre}`);
        console.log(`   Código: ${perfil.codigo}`);
        console.log(`   Descripción: ${perfil.descripcion}`);
        console.log(`   Activo: ${perfil.activo}`);
      }
    }

    // ==========================================
    // 5. CENTRO DE SALUD
    // ==========================================
    console.log("\n5️⃣ VERIFICAR CENTRO DE SALUD");
    console.log("-".repeat(100));

    if (hosixUser) {
      const { data: centro, error: centroError } = await supabase
        .from('centros_salud')
        .select('*')
        .eq('id', hosixUser.centro_salud_id)
        .single();

      if (centroError) {
        console.log(`⚠️  Centro no encontrado: ${centroError.message}`);
      } else {
        console.log(`✅ Centro de salud encontrado:`);
        console.log(`   ID: ${centro.id}`);
        console.log(`   Nombre: ${centro.nombre}`);
      }
    }

    // ==========================================
    // 6. POLÍTICAS RLS Y PERMISOS
    // ==========================================
    console.log("\n6️⃣ POLÍTICAS RLS EN TABLAS DE PLANTILLAS");
    console.log("-".repeat(100));

    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'plantillas_documentos');

    if (policiesError) {
      console.log(`⚠️  No se pueden consultar políticas desde API`);
      console.log(`   Las políticas están configuradas (verificadas anteriormente)`);
    } else if (policies) {
      console.log(`✅ Políticas en plantillas_documentos: ${policies.length}`);
      policies.forEach(p => {
        console.log(`   - ${p.policyname}: ${p.cmd}`);
      });
    }

    // ==========================================
    // 7. TEST: INTENTAR LOGIN CON SUPABASE
    // ==========================================
    console.log("\n7️⃣ TEST: INTENTAR LOGIN CON SUPABASE");
    console.log("-".repeat(100));

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@hosix.local',
      password: 'SuperAdmin#2026'
    });

    if (signInError) {
      console.log(`❌ Login FALLÓ: ${signInError.message}`);
      console.log(`   Código de error: ${signInError.code}`);
    } else if (signInData.session) {
      console.log(`✅ Login EXITOSO`);
      console.log(`   Access token: ${signInData.session.access_token.substring(0, 50)}...`);
      console.log(`   User ID: ${signInData.user.id}`);
      console.log(`   Email: ${signInData.user.email}`);
    } else {
      console.log(`⚠️  Login retornó sin error pero sin sesión`);
    }

    // ==========================================
    // 8. RESUMEN FINAL
    // ==========================================
    console.log("\n" + "=" .repeat(100));
    console.log("📋 RESUMEN DIAGNÓSTICO");
    console.log("=" .repeat(100));

    const issues = [];
    
    if (!authUsers.users?.find(u => u.email === 'admin@hosix.local')) {
      issues.push("❌ Usuario NO existe en auth.users");
    } else {
      issues.push("✅ Usuario existe en auth.users");
    }

    if (!hosixUser) {
      issues.push("❌ Usuario NO existe en hosix_usuarios");
    } else {
      issues.push("✅ Usuario existe en hosix_usuarios");
    }

    if (authUsers && hosixUser) {
      const authU = authUsers.users?.find(u => u.email === 'admin@hosix.local');
      if (authU?.id === hosixUser.auth_user_id) {
        issues.push("✅ IDs coinciden entre auth y hosix_usuarios");
      } else {
        issues.push("❌ IDs NO coinciden - Relación rota");
      }
    }

    issues.forEach(issue => console.log(`   ${issue}`));

    console.log(`\nSOLUCIÓN RECOMENDADA:`);
    if (signInError) {
      console.log(`   1. La contraseña puede ser incorrecta`);
      console.log(`   2. Ejecuta en SQL Editor:`);
      console.log(`      UPDATE auth.users SET encrypted_password = crypt('SuperAdmin#2026', gen_salt('bf')) WHERE email = 'admin@hosix.local';`);
      console.log(`   3. Si eso no funciona, revisar si email_confirmed_at es NULL`);
      console.log(`      Si es NULL, ejecutar:`);
      console.log(`      UPDATE auth.users SET email_confirmed_at = now() WHERE email = 'admin@hosix.local';`);
    }

  } catch (err) {
    console.error("💥 Error:", err.message || err);
  }
}

auditCompleto();
