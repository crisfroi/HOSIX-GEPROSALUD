/**
 * Debug script para verificar por qué la tab "Maestros" no se encuentra
 */

console.clear();
console.log('=' * 80);
console.log('🔍 DIAGNÓSTICO: ¿Por qué Maestros no se ve?');
console.log('=' * 80);

// 1. Verificar que estamos en la página correcta
console.log('\n1️⃣ Estado de página:');
const url = window.location.pathname;
console.log(`   Ruta actual: ${url}`);
const isConfigPage = url.includes('configuracion');
console.log(`   ¿Es página Configuración? ${isConfigPage ? '✅' : '❌'}`);

// 2. Buscar todos los TabsTrigger en la página
console.log('\n2️⃣ Buscando TODOS los TabsTrigger:');
const allTriggers = document.querySelectorAll('[role="tab"]');
console.log(`   Total tabs encontrados: ${allTriggers.length}`);
allTriggers.forEach((t, i) => {
  console.log(`   ${i + 1}. "${t.textContent.trim()}" (value: ${t.getAttribute('value')})`);
});

// 3. Buscar específicamente en la lista principal
console.log('\n3️⃣ Buscando en TabsList principal:');
const mainTabsList = document.querySelector('[role="tablist"]:first-of-type');
if (mainTabsList) {
  const triggers = mainTabsList.querySelectorAll('[role="tab"]');
  console.log(`   ✅ TabsList encontrada`);
  console.log(`   Triggers en TabsList: ${triggers.length}`);
  triggers.forEach((t, i) => {
    console.log(`      ${i + 1}. "${t.textContent.trim()}"`);
  });
} else {
  console.log(`   ❌ No se encontró TabsList principal`);
}

// 4. Buscar TabsContent de maestros
console.log('\n4️⃣ Buscando TabsContent maestros:');
const maestrosContent = document.querySelector('[role="tabpanel"][id*="maestros"]');
if (maestrosContent) {
  console.log('   ✅ TabsContent de maestros EXISTE');
} else {
  console.log('   ❌ TabsContent de maestros NO EXISTE en el DOM');
}

// 5. Buscar por atributo value
console.log('\n5️⃣ Buscando elemento con value="maestros":');
const maestrosTab = document.querySelector('[value="maestros"]');
if (maestrosTab) {
  console.log('   ✅ Elemento encontrado');
  console.log(`   Role: ${maestrosTab.getAttribute('role')}`);
  console.log(`   Display: ${window.getComputedStyle(maestrosTab).display}`);
  console.log(`   Visibilidad: ${window.getComputedStyle(maestrosTab).visibility}`);
} else {
  console.log('   ❌ Elemento NO encontrado con value="maestros"');
}

// 6. Inspeccionar estructura de Tabs
console.log('\n6️⃣ Estructura de Tabs:');
const tabsRoot = document.querySelector('[role="tablist"]');
if (tabsRoot) {
  console.log('   ✅ Raíz de Tabs encontrada');
  console.log(`   Parent: ${tabsRoot.parentElement.tagName}`);
  console.log(`   Children count: ${tabsRoot.children.length}`);
} else {
  console.log('   ❌ No se encontró raíz de Tabs');
}

// 7. Buscar errores en console (historial de errores)
console.log('\n7️⃣ Errores en consola:');
const errors = window.__consoleLogs?.errors || [];
if (errors.length > 0) {
  errors.forEach(e => console.log(`   ❌ ${e}`));
} else {
  console.log('   ✅ Sin errores registrados');
}

// 8. Comprobar si hay clase CSS que oculte la tab
console.log('\n8️⃣ Estilos CSS aplicados:');
const allTabs = document.querySelectorAll('[role="tab"]');
let hasHiddenTab = false;
allTabs.forEach(tab => {
  const computed = window.getComputedStyle(tab);
  if (computed.display === 'none' || computed.visibility === 'hidden') {
    console.log(`   ⚠️  "${tab.textContent}" está oculta`);
    hasHiddenTab = true;
  }
});
if (!hasHiddenTab) {
  console.log('   ✅ Todas las tabs son visibles');
}

console.log('\n' + '=' * 80);
console.log('📋 RESUMEN:');
console.log(`Total tabs visibles: ${allTriggers.length}`);
console.log(`¿Maestros existe? ${maestrosTab ? '✅' : '❌'}`);
console.log('=' * 80);
