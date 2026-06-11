// ============================================================================
// SCRIPT DE TESTING: FASE 2 - CIE-11
// Copia y pega esto en DevTools Console (F12)
// ============================================================================

async function testPhase2CIE11() {
  console.clear();
  console.log('🧪 TESTING FASE 2: CIE-11 INTEGRACIÓN');
  console.log('=' .repeat(80));

  const results = {
    icdApi: null,
    selectorVisible: false,
    ectLoaded: false,
    errores: []
  };

  try {
    // Test 1: Verificar ICD API en puerto 8090
    console.log('\n1️⃣ Verificando ICD API (puerto 8090)...');
    try {
      const icdTest = await fetch('http://localhost:8090/swagger/index.html', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      results.icdApi = 'ACTIVO';
      console.log('✅ ICD API disponible en http://localhost:8090');
    } catch (err) {
      results.icdApi = 'INACTIVO';
      results.errores.push('ICD API no responde');
      console.log('❌ ICD API NO responde en puerto 8090');
    }

    // Test 2: Buscar selector CIE-11
    console.log('\n2️⃣ Buscando selector CIE-11...');
    const selectorElements = document.querySelectorAll('[class*="CIE11"], [class*="cie11"], [id*="cie11"]');
    results.selectorVisible = selectorElements.length > 0;
    console.log(`${selectorElements.length > 0 ? '✅' : '❌'} Selector encontrado: ${selectorElements.length} elemento(s)`);

    // Test 3: Verificar si ECT está cargado
    console.log('\n3️⃣ Verificando WHO Embedded Coding Tool (ECT)...');
    const ectLoaded = window.ECT !== undefined;
    results.ectLoaded = ectLoaded;
    console.log(`${ectLoaded ? '✅' : '❌'} ECT disponible: ${ectLoaded ? 'SÍ' : 'NO'}`);

    if (ectLoaded) {
      console.log('   - window.ECT.Handler está disponible');
    }

    // Test 4: Verificar scripts CSS/JS de ICD
    console.log('\n4️⃣ Verificando recursos ICD11...');
    const links = Array.from(document.head.querySelectorAll('link'));
    const scripts = Array.from(document.head.querySelectorAll('script'));
    
    const icdLink = links.find(l => l.href && l.href.includes('ect'));
    const icdScript = scripts.find(s => s.src && s.src.includes('ect'));
    
    console.log(`${icdLink ? '✅' : '❌'} CSS de ECT: ${icdLink?.href || 'NO ENCONTRADO'}`);
    console.log(`${icdScript ? '✅' : '❌'} JS de ECT: ${icdScript?.src || 'NO ENCONTRADO'}`);

    results.icdCSSLoaded = !!icdLink;
    results.icdJSLoaded = !!icdScript;

    // Test 5: Network requests
    console.log('\n5️⃣ Errores de red...');
    const xhr = performance.getEntriesByType('resource');
    const errors = xhr.filter(r => r.name.includes('ect') || r.name.includes('8090'));
    
    if (errors.length > 0) {
      errors.forEach(e => {
        if (e.transferSize === 0) {
          console.log(`⚠️  Recurso bloqueado: ${e.name}`);
          results.errores.push(`Recurso bloqueado: ${e.name}`);
        }
      });
    } else {
      console.log('✅ Sin errores de red detectados');
    }

  } catch (err) {
    console.error('❌ Error durante testing:', err);
    results.error = err.message;
  }

  // Resumen
  console.log('\n' + '=' .repeat(80));
  console.log('📊 RESUMEN FASE 2:');
  console.log(results);
  
  if (results.errores.length > 0) {
    console.log('\n⚠️ ERRORES ENCONTRADOS:');
    results.errores.forEach(e => console.log(`  - ${e}`));
  }
  
  return results;
}

// Ejecutar
testPhase2CIE11();
