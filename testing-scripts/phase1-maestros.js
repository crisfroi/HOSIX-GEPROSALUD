// ============================================================================
// SCRIPT DE TESTING: FASE 1 - MAESTROS
// Copia y pega esto en DevTools Console (F12)
// ============================================================================

async function testPhase1Maestros() {
  console.clear();
  console.log('🧪 TESTING FASE 1: MAESTROS');
  console.log('=' .repeat(80));

  const results = {};

  try {
    // Test 1: Verificar que estamos en /hosix/configuracion
    const isConfigPage = window.location.pathname.includes('/configuracion');
    results.configPageOK = isConfigPage;
    console.log(`✓ En página configuración: ${isConfigPage ? '✅' : '❌'}`);

    // Test 2: Buscar tabs de maestros
    const maestrosTab = document.querySelector('[value="maestros"]');
    results.maestrosTabExists = !!maestrosTab;
    console.log(`✓ Tab Maestros existe: ${maestrosTab ? '✅' : '❌'}`);

    if (maestrosTab) {
      maestrosTab.click();
      await new Promise(r => setTimeout(r, 1000));
    }

    // Test 3: Verificar sub-tabs
    const expectedTabs = [
      'departamentos', 'equipos', 'especialidades', 'unidades', 'roles',
      'cualificaciones', 'zonas', 'proveedores', 'material', 'servicios',
      'parametros', 'codificacion'
    ];

    const tabsStatus = {};
    expectedTabs.forEach(tabName => {
      const tabElement = document.querySelector(`[value="${tabName}"]`);
      tabsStatus[tabName] = !!tabElement;
      console.log(`  ${tabElement ? '✅' : '❌'} Tab "${tabName}"`);
    });
    results.subTabsStatus = tabsStatus;

    // Test 4: Verificar que al menos uno tenga contenido
    const firstTab = document.querySelector('[value="departamentos"]');
    if (firstTab) {
      firstTab.click();
      await new Promise(r => setTimeout(r, 500));
      
      const hasContent = document.querySelectorAll('table, [role="grid"], .data-list').length > 0;
      results.hasContent = hasContent;
      console.log(`\n✓ Tab "departamentos" carga contenido: ${hasContent ? '✅' : '❌'}`);
    }

    // Test 5: Check for errors in console
    const hasErrors = window.__consoleLogs?.errors?.length > 0;
    results.hasErrors = hasErrors;
    console.log(`✓ Sin errores en consola: ${!hasErrors ? '✅' : '❌'}`);

  } catch (err) {
    console.error('❌ Error durante testing:', err);
    results.error = err.message;
  }

  // Resumen
  console.log('\n' + '=' .repeat(80));
  console.log('📊 RESUMEN FASE 1:');
  console.log(results);
  return results;
}

// Ejecutar
testPhase1Maestros();
