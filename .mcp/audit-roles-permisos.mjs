#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

const url = "https://abxusmjvsuabvbbwwxqg.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFieHVzbWp2c3VhYnZiYnd3eHFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA1NjAwNiwiZXhwIjoyMDk1NjMyMDA2fQ.ykNkDa2bPiaipt2aWDdnwRIx8dFSl_0s1XMYcSHKyWs";

const supabase = createClient(url, serviceRoleKey);

async function auditRolesPermisos() {
  console.log("=" .repeat(80));
  console.log("🔐 AUDIT: ROLES Y PERMISOS EN HOSIX");
  console.log("=" .repeat(80));

  try {
    // ==========================================
    // 1. ESTRUCTURA DE hosix_perfiles
    // ==========================================
    console.log("\n1️⃣ TABLA hosix_perfiles");
    console.log("-".repeat(80));
    
    const { data: perfiles, error: perfilesError } = await supabase
      .from("hosix_perfiles")
      .select("*");

    if (perfilesError) {
      console.log(`❌ Error: ${perfilesError.message}`);
    } else {
      console.log(`✅ Total perfiles: ${perfiles?.length || 0}`);
      perfiles?.forEach(p => {
        console.log(`\n   📋 ${p.nombre} (${p.codigo})`);
        console.log(`      ID: ${p.id}`);
        console.log(`      Descripción: ${p.descripcion || 'N/A'}`);
        console.log(`      Activo: ${p.activo}`);
      });
    }

    // ==========================================
    // 2. ESTRUCTURA DE hosix_usuarios
    // ==========================================
    console.log("\n\n2️⃣ TABLA hosix_usuarios (columnas y sample)");
    console.log("-".repeat(80));
    
    const { data: usuarios, error: usuariosError } = await supabase
      .from("hosix_usuarios")
      .select("*")
      .limit(3);

    if (usuariosError) {
      console.log(`❌ Error: ${usuariosError.message}`);
    } else {
      console.log(`✅ Total usuarios: ${usuarios?.length || 0}`);
      if (usuarios && usuarios.length > 0) {
        console.log("\n   Columnas encontradas:");
        Object.keys(usuarios[0]).forEach(key => {
          console.log(`   - ${key}: ${typeof usuarios[0][key]}`);
        });
        
        console.log("\n   Sample usuarios:");
        usuarios.forEach(u => {
          console.log(`   - ${u.username || u.email} (${u.perfil_id})`);
        });
      }
    }

    // ==========================================
    // 3. RELACIÓN hosix_usuarios <-> hosix_perfiles
    // ==========================================
    console.log("\n\n3️⃣ USUARIOS CON PERFILES");
    console.log("-".repeat(80));
    
    const { data: usuariosPerfiles, error: upError } = await supabase
      .from("hosix_usuarios")
      .select(`
        id,
        username,
        email,
        nombre_completo,
        perfil_id,
        perfil:hosix_perfiles(id, nombre, codigo),
        centro_salud_id,
        activo
      `)
      .limit(5);

    if (upError) {
      console.log(`⚠️  Error en JOIN: ${upError.message}`);
      console.log(`   Los perfiles podrían no estar vinculados correctamente`);
    } else {
      console.log(`✅ Relación usuarios-perfiles:`);
      usuariosPerfiles?.forEach(u => {
        const perfil = Array.isArray(u.perfil) ? u.perfil[0] : u.perfil;
        console.log(`   - ${u.username}: ${perfil?.nombre || 'SIN PERFIL'}`);
      });
    }

    // ==========================================
    // 4. PERMISOS ASOCIADOS A PERFILES
    // ==========================================
    console.log("\n\n4️⃣ PERMISOS DE MÓDULOS POR PERFIL");
    console.log("-".repeat(80));
    
    const { data: permisos, error: permisosError } = await supabase
      .from("hosix_permisos_modulos")
      .select(`
        id,
        perfil_id,
        perfil:hosix_perfiles(nombre),
        modulo,
        crear,
        leer,
        actualizar,
        eliminar,
        activo
      `)
      .limit(10);

    if (permisosError) {
      console.log(`❌ Error: ${permisosError.message}`);
    } else {
      console.log(`✅ Total registros de permisos: ${permisos?.length || 0}`);
      
      if (permisos && permisos.length > 0) {
        console.log("\n   Sample de permisos:");
        const grouped = {};
        permisos.forEach(p => {
          const perfil = Array.isArray(p.perfil) ? p.perfil[0]?.nombre : p.perfil?.nombre;
          if (!grouped[perfil]) grouped[perfil] = [];
          grouped[perfil].push(p.modulo);
        });
        
        Object.entries(grouped).forEach(([perfil, modulos]) => {
          console.log(`\n   👤 ${perfil}:`);
          modulos.forEach(m => console.log(`      • ${m}`));
        });
      }
    }

    // ==========================================
    // 5. RECOMENDACIÓN PARA SUPER ADMIN
    // ==========================================
    console.log("\n\n5️⃣ CONFIGURACIÓN RECOMENDADA PARA SUPER ADMINISTRADOR");
    console.log("-".repeat(80));
    
    console.log(`
✅ El sistema espera:

FRONTEND (authStore.ts):
   • rol: 'SUPER_ADMINISTRADOR'
   • email: 'admin@hosix.local'
   • nombre, apellido, centro_salud_id

BACKEND (hosix_usuarios):
   • username: 'admin'
   • email: 'admin@hosix.local'
   • nombre_completo: 'Administrador Sistema'
   • perfil_id: (ID del perfil super admin, si existe)
   • centro_salud_id: '6e5eab00-d72a-4d49-9d21-a164df58cae6'
   • activo: true

SUPABASE AUTH (auth.users):
   • email: 'admin@hosix.local'
   • password: (hasheada)
   • raw_app_meta_data: {"role": "admin"}

PERMISOS:
   • hosix_permisos_modulos: Todos los módulos con CRUD = true
    `);

  } catch (err) {
    console.error("💥 Error:", err.message);
  }
}

auditRolesPermisos();
