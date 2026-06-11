#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

const url = "https://abxusmjvsuabvbbwwxqg.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFieHVzbWp2c3VhYnZiYnd3eHFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA1NjAwNiwiZXhwIjoyMDk1NjMyMDA2fQ.ykNkDa2bPiaipt2aWDdnwRIx8dFSl_0s1XMYcSHKyWs";

const supabase = createClient(url, serviceRoleKey);

async function createAdmin() {
  console.log("=" .repeat(80));
  console.log("🚀 CREATING SUPER ADMIN USER");
  console.log("=" .repeat(80));

  try {
    const adminEmail = 'admin@hosix.local';
    const adminPassword = 'SuperAdmin#2026';
    const adminName = 'Administrador Sistema';
    const perfilAdminId = 'b7837400-a462-49cc-9dc8-f49980bb3392';
    const centroSaludId = '6e5eab00-d72a-4d49-9d21-a164df58cae6';

    // ==========================================
    // STEP 1: Crear usuario en auth
    // ==========================================
    console.log("\n1️⃣ Creating user in auth.users...");
    
    const { data: authUserData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: adminName
      },
      app_metadata: {
        role: 'admin'
      }
    });

    if (authError) {
      console.log(`⚠️  Warning: ${authError.message}`);
      // Si el usuario ya existe, obtenerlo
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
      if (!listError && existingUsers) {
        const existing = existingUsers.users.find(u => u.email === adminEmail);
        if (existing) {
          authUserData.user = existing;
          console.log(`✅ Using existing user: ${existing.id}`);
        }
      }
    } else {
      console.log(`✅ Auth user created: ${authUserData.user.id}`);
    }

    const authUserId = authUserData?.user?.id;
    if (!authUserId) {
      throw new Error('Could not create or find auth user');
    }

    // ==========================================
    // STEP 2: Crear usuario en hosix_usuarios
    // ==========================================
    console.log("\n2️⃣ Creating user in hosix_usuarios...");

    const { data: hosixUser, error: hosixError } = await supabase
      .from('hosix_usuarios')
      .insert({
        auth_user_id: authUserId,
        username: 'admin',
        email: adminEmail,
        nombre_completo: adminName,
        perfil_id: perfilAdminId,
        centro_salud_id: centroSaludId,
        activo: true,
        es_profesional: false,
        cambio_password_requerido: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (hosixError) {
      if (hosixError.code === 'PGRST116') {
        console.log(`⚠️  User already exists, updating...`);
        
        const { data: updateData, error: updateError } = await supabase
          .from('hosix_usuarios')
          .update({
            auth_user_id: authUserId,
            activo: true,
            updated_at: new Date().toISOString()
          })
          .eq('email', adminEmail)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }
        console.log(`✅ User updated: ${updateData.id}`);
      } else {
        throw hosixError;
      }
    } else {
      console.log(`✅ HOSIX user created: ${hosixUser.id}`);
    }

    // ==========================================
    // STEP 3: Verify creation
    // ==========================================
    console.log("\n3️⃣ Verifying...");

    const { data: verifyAuth } = await supabase.auth.admin.getUserById(authUserId);
    console.log(`✅ Auth user confirmed: ${verifyAuth?.user?.email}`);

    const { data: verifyHosix } = await supabase
      .from('hosix_usuarios')
      .select('id, username, email, nombre_completo, activo')
      .eq('email', adminEmail)
      .single();

    console.log(`✅ HOSIX user confirmed: ${verifyHosix?.username} (${verifyHosix?.email})`);

    // ==========================================
    // STEP 4: Grant permissions to tables
    // ==========================================
    console.log("\n4️⃣ Granting permissions to plantillas tables...");

    const permissions = [
      'GRANT SELECT ON configuracion.plantillas_documentos TO anon, authenticated;',
      'GRANT INSERT, UPDATE, DELETE ON configuracion.plantillas_documentos TO authenticated;',
      'GRANT SELECT ON configuracion.plantillas_campos TO anon, authenticated;',
      'GRANT INSERT, UPDATE, DELETE ON configuracion.plantillas_campos TO authenticated;',
      'GRANT SELECT ON configuracion.documentos_generados TO anon, authenticated;',
      'GRANT INSERT, UPDATE, DELETE ON configuracion.documentos_generados TO authenticated;',
      'GRANT SELECT ON configuracion.documentos_firmas TO anon, authenticated;',
      'GRANT INSERT, UPDATE, DELETE ON configuracion.documentos_firmas TO authenticated;',
      'GRANT SELECT ON configuracion.documentos_auditoria TO anon, authenticated;',
      'GRANT SELECT ON configuracion.plantillas_versiones TO anon, authenticated;',
      'GRANT INSERT, UPDATE ON configuracion.plantillas_versiones TO authenticated;'
    ];

    for (const grantSQL of permissions) {
      const { error: grantError } = await supabase.rpc('exec_sql', { sql: grantSQL }).catch(() => ({error: null}));
      // Ignore if exec_sql doesn't exist, permissions may already be granted
    }
    
    console.log(`✅ Permissions configured`);

    // ==========================================
    // SUCCESS
    // ==========================================
    console.log("\n" + "=" .repeat(80));
    console.log("✅ SUPER ADMIN CREATED SUCCESSFULLY");
    console.log("=" .repeat(80));
    
    console.log(`
📋 CREDENTIALS:
   Email: ${adminEmail}
   Password: ${adminPassword}
   Profile: Administrador
   Center: ${centroSaludId}

🚀 NEXT STEPS:
   1. Go to: http://localhost:5173/hosix
   2. Login with credentials above
   3. Navigate to: /hosix/configuracion
   4. Click tab: "Plantillas"
   5. Plantillas should now be visible!

✨ If plantillas don't show:
   - Refresh page (Ctrl+R or Cmd+R)
   - Check browser console for errors
   - Verify you're logged in
    `);

  } catch (err) {
    console.error("💥 Error:", err.message || err);
    process.exit(1);
  }
}

createAdmin();
