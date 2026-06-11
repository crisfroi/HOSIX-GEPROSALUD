// ============================================================================
// SCRIPT DE TESTING: FASE 3 - PLANTILLAS
// Copia y pega esto en DevTools Console (F12)
// ============================================================================

async function testPhase3Plantillas() {
  console.clear();
  console.log('🧪 TESTING FASE 3: PLANTILLAS & DOCUMENTOS');
  console.log('=' .repeat(80));

  const results = {
    plantillasVisible: 0,
    plantillasExpected: 24,
    tiposEncontrados: new Set(),
    gruposEncontrados: new Set(),
    erroresRLS: [],
    erroresRed: []
  };

  try {
    // Test 1: Verificar página de configuración
    console.log('\n1️⃣ Verificando página configuración/plantillas...');
    const isPlantillasPage = window.location.pathname.includes('/configuracion') || 
                            document.body.textContent.includes('Plantillas');
    console.log(`${isPlantillasPage ? '✅' : '❌'} En página plantillas`);

    // Test 2: Buscar tab plantillas
    const plantillasTab = document.querySelector('[value="plantillas"]');
    if (plantillasTab) {
      plantillasTab.click();
      await new Promise(r => setTimeout(r, 1000));
      console.log('✅ Tab Plantillas abierto');
    }

    // Test 3: Buscar lista de plantillas
    console.log('\n2️⃣ Buscando plantillas en la UI...');
    const plantillaItems = document.querySelectorAll('[data-testid*="plantilla"], [class*="plantilla"], li');
    const plantillaRows = document.querySelectorAll('tr');
    
    results.plantillasVisible = Math.max(plantillaItems.length, plantillaRows.length);
    console.log(`✅ Plantillas encontradas en DOM: ${results.plantillasVisible}`);

    // Test 4: Verificar errores de red (404/RLS)
    console.log('\n3️⃣ Verificando errores de red...');
    const xhr = performance.getEntriesByType('resource');
    
    const notFound = xhr.filter(r => {
      const msg = r.name || '';
      return msg.includes('plantillas') && msg.includes('404');
    });
    
    const rls = xhr.filter(r => {
      const msg = r.name || '';
      return msg.includes('plantillas') && (msg.includes('403') || msg.includes('401'));
    });

    if (notFound.length > 0) {
      notFound.forEach(r => {
        results.erroresRed.push(`404: ${r.name}`);
        console.log(`❌ 404: ${r.name.substring(r.name.lastIndexOf('/'))}`);
      });
    }

    if (rls.length > 0) {
      rls.forEach(r => {
        results.erroresRLS.push(`RLS DENIED: ${r.name}`);
        console.log(`❌ RLS BLOCKED: ${r.name.substring(r.name.lastIndexOf('/'))}`);
      });
    }

    if (notFound.length === 0 && rls.length === 0) {
      console.log('✅ Sin errores 404/RLS detectados');
    }

    // Test 5: Verificar si hay datos en la tabla
    console.log('\n4️⃣ Analizando datos mostrados...');
    const textContent = document.body.textContent.toLowerCase();
    
    const plantillaNames = [
      'alta hospitalaria', 'urgencias', 'consulta', 'quirúrgico', 'receta',
      'laboratorio', 'certificado', 'consentimiento', 'revocación',
      'administrativo', 'stock', 'mantenimiento'
    ];
    
    const found = plantillaNames.filter(name => textContent.includes(name));
    console.log(`✅ Plantillas detectadas por nombre: ${found.length}`);
    found.slice(0, 5).forEach(p => console.log(`   - ${p}`));

    results.plantillasEncontradas = found;

    // Test 6: Buscar botones de acción
    console.log('\n5️⃣ Verificando botones de plantillas...');
    const editButtons = document.querySelectorAll('button[title*="edit"], button[aria-label*="edit"]');
    const deleteButtons = document.querySelectorAll('button[title*="delete"], button[aria-label*="delete"]');
    const createButton = document.querySelector('button[title*="crear"], button[title*="nueva"], button:contains("Nueva")');

    console.log(`✅ Botones editar encontrados: ${editButtons.length}`);
    console.log(`✅ Botones eliminar encontrados: ${deleteButtons.length}`);
    console.log(`${createButton ? '✅' : '❌'} Botón crear/nueva plantilla`);

    results.botonesAccion = {
      editar: editButtons.length,
      eliminar: deleteButtons.length,
      crear: !!createButton
    };

    // Test 7: Verificar status de carga
    console.log('\n6️⃣ Verificando elementos de carga...');
    const spinners = document.querySelectorAll('[role="status"], .spinner, .loading');
    const skeletons = document.querySelectorAll('.skeleton, [class*="skeleton"]');
    
    console.log(`${spinners.length === 0 ? '✅' : '⚠️'} Spinners: ${spinners.length > 0 ? 'AÚN CARGANDO' : 'COMPLETADO'}`);
    console.log(`${skeletons.length === 0 ? '✅' : '⚠️'} Skeletons: ${skeletons.length > 0 ? 'AÚN CARGANDO' : 'COMPLETADO'}`);

  } catch (err) {
    console.error('❌ Error durante testing:', err);
    results.error = err.message;
  }

  // Resumen
  console.log('\n' + '=' .repeat(80));
  console.log('📊 RESUMEN FASE 3:');
  console.log(`✅ Plantillas esperadas: ${results.plantillasExpected}`);
  console.log(`✅ Plantillas detectadas: ${results.plantillasVisible > 0 ? results.plantillasVisible : 'Cargando...'}`);
  console.log(`✅ Errores RLS: ${results.erroresRLS.length}`);
  console.log(`✅ Errores 404: ${results.erroresRed.length}`);
  console.log(`✅ Botones encontrados: ${JSON.stringify(results.botonesAccion)}`);
  
  if (results.erroresRLS.length > 0) {
    console.log('\n⚠️ ERRORES RLS:');
    results.erroresRLS.forEach(e => console.log(`  ${e}`));
  }
  
  if (results.erroresRed.length > 0) {
    console.log('\n⚠️ ERRORES RED:');
    results.erroresRed.forEach(e => console.log(`  ${e}`));
  }

  return results;
}

// Ejecutar
testPhase3Plantillas();
