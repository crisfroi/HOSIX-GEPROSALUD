#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

const url = "https://abxusmjvsuabvbbwwxqg.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFieHVzbWp2c3VhYnZiYnd3eHFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA1NjAwNiwiZXhwIjoyMDk1NjMyMDA2fQ.ykNkDa2bPiaipt2aWDdnwRIx8dFSl_0s1XMYcSHKyWs";

const supabase = createClient(url, serviceRoleKey);

async function testPlantillas() {
  console.log("🔍 TEST: Checking plantillas tables...\n");

  try {
    // Test 1: Check if schema exists
    console.log("1️⃣ Checking if 'configuracion' schema exists...");
    const { data: schemas, error: schemaError } = await supabase.rpc("get_schemas");
    if (schemaError) {
      console.log("   ❌ Error checking schemas:", schemaError.message);
    } else {
      console.log("   ✅ Schema query worked");
    }

    // Test 2: List all tables in configuracion schema
    console.log("\n2️⃣ Listing tables in 'configuracion' schema...");
    const { data: tables, error: tablesError } = await supabase.from(
      "information_schema.tables"
    ).select("table_name").eq("table_schema", "configuracion");

    if (tablesError) {
      console.log("   ❌ Error:", tablesError.message);
    } else {
      console.log(`   ✅ Found ${tables?.length || 0} tables:`);
      tables?.forEach((t) => console.log(`      - ${t.table_name}`));
    }

    // Test 3: Check plantillas_documentos specifically
    console.log("\n3️⃣ Checking if 'plantillas_documentos' exists and has data...");
    const { data: plantillas, count, error: plantillasError } = await supabase
      .from("configuracion.plantillas_documentos")
      .select("id, codigo, nombre", { count: "exact" })
      .limit(5);

    if (plantillasError) {
      console.log("   ❌ Error:", plantillasError.message);
      console.log(`      Message: ${plantillasError.message}`);
      console.log(`      Details: ${JSON.stringify(plantillasError)}`);
    } else {
      console.log(`   ✅ Table exists! Found ${count} total plantillas`);
      console.log("   Sample plantillas:");
      plantillas?.forEach((p) => console.log(`      - ${p.codigo}: ${p.nombre}`));
    }

    // Test 4: Check plantillas_campos
    console.log("\n4️⃣ Checking if 'plantillas_campos' exists...");
    const { data: campos, error: camposError } = await supabase
      .from("configuracion.plantillas_campos")
      .select("id, plantilla_id, codigo")
      .limit(5);

    if (camposError) {
      console.log("   ❌ Error:", camposError.message);
    } else {
      console.log("   ✅ Table exists!");
    }

    // Test 5: Check documentos_generados
    console.log("\n5️⃣ Checking if 'documentos_generados' exists...");
    const { data: docs, error: docsError } = await supabase
      .from("configuracion.documentos_generados")
      .select("id, plantilla_id")
      .limit(5);

    if (docsError) {
      console.log("   ❌ Error:", docsError.message);
    } else {
      console.log("   ✅ Table exists!");
    }

    console.log("\n✅ TEST COMPLETE\n");
  } catch (err) {
    console.error("💥 Unexpected error:", err);
  }
}

testPlantillas();
