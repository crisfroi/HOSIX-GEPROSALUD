/**
 * Script para diagnosticar por qué las plantillas no se cargan
 * Ejecutar en DevTools Console
 */

console.clear();
console.log('╔════════════════════════════════════════════════════════════════════════════════╗');
console.log('║                 DIAGNÓSTICO: ¿Por qué NO se cargan las plantillas?            ║');
console.log('╚════════════════════════════════════════════════════════════════════════════════╝');

// 1. Verificar en local storage / session storage
console.log('\n1️⃣ Verificando almacenamiento local:');
const reactQueryCache = localStorage.getItem('REACT_QUERY_OFFLINE_CACHE');
if (reactQueryCache) {
  try {
    const parsed = JSON.parse(reactQueryCache);
    console.log('   ✅ React Query cache encontrado');
    console.log(`   Keys: ${Object.keys(parsed).length}`);
  } catch (e) {
    console.log('   ⚠️  Cache malformado');
  }
} else {
  console.log('   ❌ Sin React Query cache');
}

// 2. Intentar hacer la misma request que hace el hook
console.log('\n2️⃣ Simulando request de plantillas:');
(async () => {
  try {
    // Intento 1: Sin schema (public)
    const response1 = await fetch(
      'https://abxusmjvsuabvbbwwxqg.supabase.co/rest/v1/plantillas_documentos?select=*,campos:plantillas_campos(*)',
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')?.slice(0, 50) || 'TOKEN'}`,
          'apikey': localStorage.getItem('supabase.auth.token')?.slice(0, 50) || 'ANON_KEY'
        }
      }
    );
    console.log(`   Intento 1 (sin schema): ${response1.status}`);
    if (!response1.ok) {
      const err = await response1.text();
      console.log(`      Error: ${err.substring(0, 100)}`);
    }

    // Intento 2: Con schema configuracion
    const response2 = await fetch(
      'https://abxusmjvsuabvbbwwxqg.supabase.co/rest/v1/configuracion.plantillas_documentos?select=*,campos:plantillas_campos(*)',
      {
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        }
      }
    );
    console.log(`   Intento 2 (con schema): ${response2.status}`);
    if (!response2.ok) {
      const err = await response2.text();
      console.log(`      Error: ${err.substring(0, 100)}`);
    }

  } catch (e) {
    console.log(`   ❌ Error en request: ${e.message}`);
  }

  // 3. Verificar qué auth token tenemos
  console.log('\n3️⃣ Verificando estado de autenticación:');
  const authToken = localStorage.getItem('supabase.auth.token');
  if (authToken) {
    try {
      const parsed = JSON.parse(authToken);
      console.log(`   ✅ Auth token presente`);
      console.log(`   User: ${parsed.user?.email || 'desconocido'}`);
      console.log(`   Role: ${parsed.user?.app_metadata?.role || 'sin rol'}`);
    } catch (e) {
      console.log(`   ⚠️  Token malformado`);
    }
  } else {
    console.log(`   ❌ Sin auth token - usuario no autenticado`);
  }

  // 4. Verificar React Query state
  console.log('\n4️⃣ Verificando React Query:');
  const reactQueryDiv = document.querySelector('[data-react-query-devtools]');
  if (reactQueryDiv) {
    console.log('   ✅ React Query Devtools encontrado');
  } else {
    console.log('   ℹ️  React Query Devtools no visible');
  }

  // 5. Buscar en el DOM elementos que carguen plantillas
  console.log('\n5️⃣ Elementos de plantillas en DOM:');
  const plantillaElements = document.querySelectorAll('[class*="plantilla"], [data-plantilla], [data-testid*="plantilla"]');
  console.log(`   Elementos encontrados: ${plantillaElements.length}`);
  plantillaElements.forEach((el, i) => {
    if (i < 5) { // Mostrar solo los primeros 5
      console.log(`      ${i + 1}. ${el.tagName} (class: ${el.className.substring(0, 30)}...)`);
    }
  });

  // 6. Monitorear network requests
  console.log('\n6️⃣ Monitoreando próximas requests de plantillas:');
  const originalFetch = window.fetch;
  let requestCount = 0;

  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && url.includes('plantillas')) {
      requestCount++;
      console.log(`   📨 Request ${requestCount}: ${url.substring(url.lastIndexOf('/'))}`);
    }
    return originalFetch.apply(this, args);
  };

  console.log('   ✅ Monitor activado - próximas requests de plantillas serán registradas');

  // 7. Resumen
  console.log('\n╔════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                              DIAGNÓSTICO COMPLETADO                           ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════════╝');

  console.log('\n📋 PASOS SIGUIENTES:');
  console.log('1. ¿Está el usuario autenticado? Verifica en auth token');
  console.log('2. ¿Qué schema usa la tabla? (plantillas_documentos vs configuracion.plantillas_documentos)');
  console.log('3. ¿Hay errores 404 o RLS? Revisa Network tab');
  console.log('4. ¿La query está siendo ejecutada? Busca request en Network');

})();
