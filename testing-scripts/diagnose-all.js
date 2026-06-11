/**
 * DIAGNÓSTICO COMPLETO: Fases 1, 2, 3
 */

console.clear();
console.log('╔════════════════════════════════════════════════════════════════════════════════╗');
console.log('║                    DIAGNÓSTICO COMPLETO HOSIX                                  ║');
console.log('╚════════════════════════════════════════════════════════════════════════════════╝');

const diagnostics = {
  fase1: {},
  fase2: {},
  fase3: {},
  buttons: {}
};

// ============================================================================
// FASE 1: MAESTROS
// ============================================================================
console.log('\n📋 FASE 1: MAESTROS');
console.log('─'.repeat(80));

// Verificar página
const isConfigPage = window.location.pathname.includes('configuracion');
diagnostics.fase1.configPageOK = isConfigPage;
console.log(`✓ En página Configuración: ${isConfigPage ? '✅' : '❌'}`);

// Buscar tab "maestros" en el DOM
const maestrosTab = document.querySelector('[value="maestros"]');
diagnostics.fase1.maestrosTabExists = !!maestrosTab;
console.log(`✓ Tab "Maestros" existe: ${maestrosTab ? '✅' : '❌'}`);

if (maestrosTab) {
  // Buscar subtabs
  const subTabs = [
    'departamentos', 'equipos', 'especialidades', 'unidades',
    'roles', 'cualificaciones', 'zonas', 'proveedores',
    'material', 'servicios', 'parametros', 'codificacion'
  ];
  
  diagnostics.fase1.subTabs = {};
  console.log('  Subtabs:');
  
  // Primero, encontrar el TabsContent de maestros
  const maestrosPanel = maestrosTab.getAttribute('aria-controls');
  if (maestrosPanel) {
    const tabsRoot = maestrosTab.closest('[role="tablist"]')?.parentElement;
    if (tabsRoot) {
      const nestedTabsList = tabsRoot.querySelector('[role="tablist"]:not(:first-of-type)');
      if (nestedTabsList) {
        subTabs.forEach(subTab => {
          const subElement = nestedTabsList.querySelector(`[value="${subTab}"]`);
          diagnostics.fase1.subTabs[subTab] = !!subElement;
          console.log(`    - ${subTab}: ${subElement ? '✅' : '❌'}`);
        });
      }
    }
  }
}

// Buscar todos los tabs de nivel principal
console.log('  Tabs principales en la página:');
const allMainTabs = document.querySelectorAll('[role="tablist"]:first-of-type [role="tab"]');
diagnostics.fase1.mainTabs = Array.from(allMainTabs).map(t => t.textContent.trim());
allMainTabs.forEach(tab => {
  console.log(`    - ${tab.textContent.trim()}`);
});

// ============================================================================
// FASE 2: CIE-11 / ICD API
// ============================================================================
console.log('\n📋 FASE 2: CIE-11 INTEGRACIÓN');
console.log('─'.repeat(80));

// Verificar ICD API
(async () => {
  try {
    const icdResponse = await fetch('http://localhost:8090/swagger/index.html', { method: 'HEAD' });
    diagnostics.fase2.icdApiReachable = icdResponse.ok;
    console.log(`✓ ICD API en 8090: ${icdResponse.ok ? '✅' : '❌'}`);
  } catch (e) {
    diagnostics.fase2.icdApiReachable = false;
    console.log(`✓ ICD API en 8090: ❌ (${e.message})`);
  }

  // Buscar selector CIE-11
  const cieSelector = document.querySelector('[data-testid*="cie"], [class*="CIE"], [class*="cie"]');
  diagnostics.fase2.cieSelectorFound = !!cieSelector;
  console.log(`✓ Selector CIE-11: ${cieSelector ? '✅' : '❌'}`);

  // Verificar ECT
  diagnostics.fase2.ectAvailable = !!window.ECT;
  console.log(`✓ WHO ECT disponible: ${window.ECT ? '✅' : '❌'}`);

  // Buscar recursos ICD
  const resources = window.performance.getEntriesByType('resource');
  const icdResources = resources.filter(r => r.name.includes('icd') || r.name.includes('ect'));
  diagnostics.fase2.icdResources = icdResources.length;
  console.log(`✓ Recursos ICD/ECT cargados: ${icdResources.length}`);

  // ============================================================================
  // FASE 3: PLANTILLAS
  // ============================================================================
  console.log('\n📋 FASE 3: PLANTILLAS');
  console.log('─'.repeat(80));

  // Buscar tab plantillas
  const plantillasTab = document.querySelector('[value="plantillas"]');
  diagnostics.fase3.plantillasTabExists = !!plantillasTab;
  console.log(`✓ Tab "Plantillas" existe: ${plantillasTab ? '✅' : '❌'}`);

  // Buscar plantillas en la UI
  const plantillasInDOM = document.querySelectorAll('[class*="plantilla"], [data-plantilla]');
  diagnostics.fase3.plantillasCount = plantillasInDOM.length;
  console.log(`✓ Plantillas en DOM: ${plantillasInDOM.length}`);

  // Buscar errores de red en las plantillas
  const plantillasResources = resources.filter(r => 
    r.name.includes('plantillas') || r.name.includes('documentos')
  );
  const failedRequests = plantillasResources.filter(r => r.transferSize === 0);
  diagnostics.fase3.failedRequests = failedRequests.length;
  console.log(`✓ Requests fallidas (plantillas/documentos): ${failedRequests.length}`);

  if (failedRequests.length > 0) {
    failedRequests.forEach(r => {
      console.log(`    - ${r.name.split('/').pop()}`);
    });
  }

  // ============================================================================
  // BOTONES COLGADOS
  // ============================================================================
  console.log('\n📋 BOTONES COLGADOS');
  console.log('─'.repeat(80));

  const allButtons = document.querySelectorAll('button');
  diagnostics.buttons.total = allButtons.length;
  console.log(`✓ Total botones: ${allButtons.length}`);

  let noHandler = 0;
  let disabled = 0;
  let loading = 0;

  allButtons.forEach(btn => {
    if (!btn.onclick && !btn.getAttribute('onclick')) noHandler++;
    if (btn.disabled) disabled++;
    if (btn.getAttribute('data-loading') === 'true' || btn.classList.contains('loading')) loading++;
  });

  diagnostics.buttons.noHandler = noHandler;
  diagnostics.buttons.disabled = disabled;
  diagnostics.buttons.loading = loading;

  console.log(`✓ Sin handler: ${noHandler}`);
  console.log(`✓ Deshabilitados: ${disabled}`);
  console.log(`✓ En estado loading: ${loading}`);

  // ============================================================================
  // RESUMEN FINAL
  // ============================================================================
  console.log('\n╔════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                            RESUMEN FINAL                                       ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════════╝');

  console.log('\n📊 FASE 1 (MAESTROS):');
  console.log(`   Config page: ${diagnostics.fase1.configPageOK ? '✅' : '❌'}`);
  console.log(`   Tab Maestros: ${diagnostics.fase1.maestrosTabExists ? '✅' : '❌'}`);
  console.log(`   Subtabs visibles: ${Object.values(diagnostics.fase1.subTabs || {}).filter(Boolean).length}`);

  console.log('\n📊 FASE 2 (CIE-11):');
  console.log(`   ICD API disponible: ${diagnostics.fase2.icdApiReachable ? '✅' : '❌'}`);
  console.log(`   Selector CIE-11: ${diagnostics.fase2.cieSelectorFound ? '✅' : '❌'}`);
  console.log(`   ECT disponible: ${diagnostics.fase2.ectAvailable ? '✅' : '❌'}`);

  console.log('\n📊 FASE 3 (PLANTILLAS):');
  console.log(`   Tab Plantillas: ${diagnostics.fase3.plantillasTabExists ? '✅' : '❌'}`);
  console.log(`   Plantillas en DOM: ${diagnostics.fase3.plantillasCount}`);
  console.log(`   Requests fallidas: ${diagnostics.fase3.failedRequests}`);

  console.log('\n📊 BOTONES:');
  console.log(`   Total: ${diagnostics.buttons.total}`);
  console.log(`   Sin handler: ${diagnostics.buttons.noHandler}`);
  console.log(`   Deshabilitados: ${diagnostics.buttons.disabled}`);

  console.log('\n' + '═'.repeat(80));

  // Retornar objeto para inspección
  return diagnostics;
})();
