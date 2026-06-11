/**
 * DIAGNÓSTICO COMPLETO HOSIX - POST CORRECCIONES
 * 
 * Ejecutar en: DevTools Console (F12)
 * Copiar TODO el script y pegar en la consola
 * 
 * Genará un reporte completo de:
 * - FASE 1: Maestros (layout, tabs, subtabs)
 * - FASE 2: CIE-11 (ICD API, ECT, selector)
 * - FASE 3: Plantillas (carga, cantidad, errores)
 * - GENERAL: Botones, errores de consola
 */

console.clear();

const REPORT = {
  timestamp: new Date().toISOString(),
  fase1: {},
  fase2: {},
  fase3: {},
  general: {},
  recommendations: []
};

// ============================================================================
// UTILITIES
// ============================================================================

function log(emoji, title, value) {
  const status = value === true ? '✅' : value === false ? '❌' : '⏳';
  console.log(`${emoji} ${title}: ${status}`);
  return value;
}

function section(title) {
  console.log('\n' + '═'.repeat(80));
  console.log(`  ${title}`);
  console.log('═'.repeat(80));
}

// ============================================================================
// FASE 1: MAESTROS
// ============================================================================

section('FASE 1: MAESTROS');

const isConfigPage = window.location.pathname.includes('configuracion');
log('📄', 'En página Configuración', isConfigPage);
REPORT.fase1.configPageOK = isConfigPage;

if (!isConfigPage) {
  REPORT.recommendations.push('❌ FASE 1: Navega a Configuración primero');
} else {
  // Buscar TabsList principal
  const mainTabsList = document.querySelector('[role="tablist"]');
  log('📋', 'TabsList encontrada', !!mainTabsList);
  REPORT.fase1.tabsListFound = !!mainTabsList;

  if (mainTabsList) {
    const tabs = mainTabsList.querySelectorAll('[role="tab"]');
    log('🔢', `Total tabs principales: ${tabs.length}`, tabs.length >= 7);
    REPORT.fase1.mainTabsCount = tabs.length;
    REPORT.fase1.mainTabs = Array.from(tabs).map(t => t.textContent.trim());

    // Verificar Maestros específicamente
    const maestrosTab = Array.from(tabs).find(t => 
      t.textContent.toLowerCase().includes('maestros')
    );
    log('👑', 'Tab "Maestros" visible', !!maestrosTab);
    REPORT.fase1.maestrosTabVisible = !!maestrosTab;

    if (!maestrosTab) {
      REPORT.recommendations.push('⚠️ FASE 1: Tab Maestros no visible - posible issue de responsive');
    } else {
      // Verificar subtabs
      const tabsList = mainTabsList.parentElement;
      const nestedTabsList = tabsList.querySelector('[role="tablist"]:not(:first-of-type)');
      
      if (nestedTabsList) {
        const subTabs = nestedTabsList.querySelectorAll('[role="tab"]');
        const subtabNames = Array.from(subTabs).map(t => t.textContent.trim());
        log('📑', `Subtabs encontrados: ${subTabs.length}`, subTabs.length >= 10);
        REPORT.fase1.subTabsCount = subTabs.length;
        REPORT.fase1.subTabs = subtabNames;

        if (subTabs.length < 10) {
          REPORT.recommendations.push('⚠️ FASE 1: Menos de 10 subtabs encontrados (esperados ~12)');
        }
      }
    }
  }
}

// ============================================================================
// FASE 2: CIE-11
// ============================================================================

section('FASE 2: CIE-11 INTEGRACIÓN');

(async () => {
  // Test ICD API
  let icdReachable = false;
  try {
    const response = await fetch('http://localhost:8090/swagger/index.html', {
      method: 'HEAD',
      mode: 'no-cors'
    });
    icdReachable = true;
  } catch (e) {
    icdReachable = false;
  }

  log('🌐', 'ICD API en 8090', icdReachable);
  REPORT.fase2.icdApiReachable = icdReachable;

  if (!icdReachable) {
    REPORT.recommendations.push('❌ FASE 2: Docker ICD no está corriendo en puerto 8090');
    REPORT.recommendations.push('   Ejecuta: docker-compose up -d  o  docker start icd11-server');
  }

  // Verificar ECT
  const ectAvailable = !!window.ECT;
  log('🔧', 'WHO ECT disponible', ectAvailable);
  REPORT.fase2.ectAvailable = ectAvailable;

  // Buscar selector CIE-11
  const cieSelector = document.querySelector('[class*="CIE"], [class*="cie"], [data-testid*="diagnostico"]');
  log('🔍', 'Selector CIE-11 en página', !!cieSelector);
  REPORT.fase2.cieSelectorFound = !!cieSelector;

  // Verificar recursos
  const resources = window.performance.getEntriesByType('resource');
  const ectResources = resources.filter(r => 
    r.name.includes('ect') || r.name.includes('icd')
  );
  log('📦', `Recursos ECT/ICD cargados: ${ectResources.length}`, ectResources.length > 0);
  REPORT.fase2.resourcesLoaded = ectResources.length;

  if (ectResources.length === 0 && icdReachable) {
    REPORT.recommendations.push('⚠️ FASE 2: ICD API accesible pero recursos no cargados');
  }

  // ============================================================================
  // FASE 3: PLANTILLAS
  // ============================================================================

  section('FASE 3: PLANTILLAS');

  // Buscar tab
  const plantillasTab = document.querySelector('[role="tab"][value="plantillas"]');
  log('📋', 'Tab Plantillas existe', !!plantillasTab);
  REPORT.fase3.plantillasTabExists = !!plantillasTab;

  // Verificar elementos en DOM
  const plantillaElements = document.querySelectorAll(
    '[class*="plantilla"], [data-plantilla], [data-template], [class*="template"]'
  );
  log('📄', `Elementos plantillas en DOM: ${plantillaElements.length}`, plantillaElements.length > 0);
  REPORT.fase3.plantillaElementsInDOM = plantillaElements.length;

  if (plantillaElements.length === 0) {
    REPORT.recommendations.push('⚠️ FASE 3: No hay elementos de plantillas en el DOM');
    REPORT.recommendations.push('   Verifica en Supabase si las seeds de plantillas existen');
  }

  // Verificar errores de red
  const networkRequests = resources.filter(r => 
    r.name.includes('plantillas') || r.name.includes('configuracion')
  );
  const failedRequests = networkRequests.filter(r => r.transferSize === 0);
  log('🌐', `Requests plantillas fallidos: ${failedRequests.length}`, failedRequests.length === 0);
  REPORT.fase3.failedRequests = failedRequests.length;

  if (failedRequests.length > 0) {
    REPORT.recommendations.push('❌ FASE 3: Requests de plantillas están fallando (404/RLS)');
    failedRequests.forEach(r => {
      REPORT.recommendations.push(`   - ${r.name.split('/').pop()}`);
    });
  }

  // ============================================================================
  // GENERAL
  // ============================================================================

  section('GENERAL: ESTADO DEL SISTEMA');

  // Verificar auth
  const authToken = localStorage.getItem('supabase.auth.token');
  const isAuthenticated = !!authToken;
  log('🔐', 'Usuario autenticado', isAuthenticated);
  REPORT.general.isAuthenticated = isAuthenticated;

  if (!isAuthenticated) {
    REPORT.recommendations.push('⚠️ GENERAL: No hay usuario autenticado');
    REPORT.recommendations.push('   Inicia sesión para ver todas las funcionalidades');
  }

  // Contar botones
  const allButtons = document.querySelectorAll('button');
  log('🔘', `Total botones: ${allButtons.length}`, allButtons.length > 0);
  REPORT.general.totalButtons = allButtons.length;

  // Verificar errores en console
  const consoleErrors = (window.__consoleLogs?.errors || []).length;
  log('⚠️', `Errores en consola: ${consoleErrors}`, consoleErrors === 0);
  REPORT.general.consoleErrors = consoleErrors;

  // ============================================================================
  // RESUMEN Y RECOMENDACIONES
  // ============================================================================

  section('RESUMEN Y RECOMENDACIONES');

  console.log('\n📊 ESTADO GENERAL:\n');

  console.log('✅ COMPLETADO:');
  if (REPORT.fase1.configPageOK) console.log('   ✓ Configuración accesible');
  if (REPORT.fase1.mainTabsCount >= 7) console.log('   ✓ Tabs principales visibles');
  if (REPORT.fase3.plantillaElementsInDOM > 0) console.log('   ✓ Plantillas en DOM');

  console.log('\n❌ POR REVISAR:');
  if (REPORT.recommendations.length === 0) {
    console.log('   ✓ Sin problemas detectados');
  } else {
    REPORT.recommendations.forEach(rec => console.log(`   ${rec}`));
  }

  // ============================================================================
  // EXPORTAR REPORTE
  // ============================================================================

  console.log('\n' + '═'.repeat(80));
  console.log('📋 REPORTE COMPLETO (JSON)');
  console.log('═'.repeat(80));
  console.log(JSON.stringify(REPORT, null, 2));

  // Retornar para inspección
  window.HOSIX_DIAGNOSTIC = REPORT;
  console.log('\n✅ Reporte guardado en window.HOSIX_DIAGNOSTIC');
  console.log('   Puedes inspeccionar: window.HOSIX_DIAGNOSTIC');

})();
