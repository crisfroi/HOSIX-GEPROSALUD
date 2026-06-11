/**
 * Verificar token y hacer request directa a Supabase
 */

console.clear();
console.log('🔍 VERIFICACIÓN DE TOKEN Y REQUEST...\n');

// 1. Obtener el token
const tokenData = localStorage.getItem('hosix.supabase.auth.token');
const token = tokenData ? JSON.parse(tokenData).access_token : null;

console.log('1️⃣ Token obtenido:');
console.log(`   Existe: ${token ? '✅' : '❌'}`);
if (token) {
  console.log(`   Primeros 50 caracteres: ${token.substring(0, 50)}...`);
  console.log(`   Longitud: ${token.length}`);
}

// 2. Obtener la session de Supabase auth
if (window.supabase) {
  console.log('\n2️⃣ Supabase session:');
  window.supabase.auth.getSession().then(({ data: { session } }) => {
    console.log(`   Sesión activa: ${session ? '✅' : '❌'}`);
    if (session) {
      console.log(`   User: ${session.user.email}`);
      console.log(`   Token en session: ${session.access_token.substring(0, 50)}...`);
    }
  });
}

// 3. Hacer request directa a plantillas_documentos
console.log('\n3️⃣ Probando request directa a Supabase REST API:');

const makeRequest = async () => {
  const url = 'https://abxusmjvsuabvbbwwxqg.supabase.co/rest/v1/configuracion.plantillas_documentos?limit=5';
  
  const options = {
    method: 'GET',
    headers: {
      'apikey': 'sb_publishable_zPejyYzMYhoQ6Q4mTwPcFQ_pP_GxnC2',
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  };

  console.log(`   URL: ${url}`);
  console.log(`   Headers: Authorization: Bearer ${token ? token.substring(0, 30) + '...' : 'VACIO'}`);
  
  try {
    const response = await fetch(url, options);
    console.log(`   Status: ${response.status}`);
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ SUCCESS - Plantillas encontradas: ${data.length}`);
      console.log(`   Primeras 2 plantillas:`, data.slice(0, 2).map(p => ({ id: p.id, nombre: p.nombre })));
    } else {
      console.log(`   ❌ ERROR - ${data.message}`);
      console.log(`   Detalle:`, data);
    }
  } catch (err) {
    console.log(`   ❌ EXCEPTION:`, err.message);
  }
};

makeRequest();

// 4. Verificar que React Query está usando el token
console.log('\n4️⃣ Estado de React Query:');
console.log('   (React Query Devtools debería mostrar queries en caché)');

// 5. Intentar usar directamente el cliente supabase del hook
console.log('\n5️⃣ Usando cliente Supabase directamente:');

if (window.supabase) {
  window.supabase
    .from('configuracion.plantillas_documentos')
    .select('id, nombre, codigo')
    .eq('activo', true)
    .limit(5)
    .then(({ data, error }) => {
      if (error) {
        console.log(`   ❌ Error:`, error.message);
      } else {
        console.log(`   ✅ Success - Plantillas: ${data?.length}`);
        data?.forEach((p, i) => console.log(`      ${i+1}. ${p.nombre}`));
      }
    });
}
