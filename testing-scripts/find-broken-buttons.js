// ============================================================================
// SCRIPT: ENCONTRAR BOTONES COLGADOS/ROTOS
// Copia y pega esto en DevTools Console (F12)
// ============================================================================

async function findBrokenButtons() {
  console.clear();
  console.log('🔍 BUSCANDO BOTONES COLGADOS/ROTOS');
  console.log('=' .repeat(80));

  const results = {
    buttonsSinHandler: [],
    buttonsDisabled: [],
    buttonsConError: [],
    buttonsTimeout: [],
    totalBotones: 0
  };

  try {
    // Test 1: Todos los botones
    console.log('\n1️⃣ Analizando todos los botones...');
    const allButtons = document.querySelectorAll('button');
    results.totalBotones = allButtons.length;
    console.log(`Total de botones encontrados: ${allButtons.length}`);

    // Test 2: Botones sin handler
    console.log('\n2️⃣ Botones sin onClick/handler...');
    allButtons.forEach((btn, idx) => {
      const hasOnClick = btn.onclick || btn.hasAttribute('onclick');
      const hasClickListener = btn.getAttribute('data-click') !== null;
      const ariaDisabled = btn.getAttribute('aria-disabled') === 'true';
      const isDisabled = btn.disabled;
      
      if (!hasOnClick && !hasClickListener && !ariaDisabled && !isDisabled) {
        const text = btn.textContent.trim().substring(0, 50);
        const id = btn.id || 'sin-id';
        const parent = btn.parentElement?.className || 'sin-parent';
        
        results.buttonsSinHandler.push({
          texto: text,
          id: id,
          padre: parent,
          visible: btn.offsetParent !== null
        });
      }
    });

    if (results.buttonsSinHandler.length > 0) {
      console.log(`⚠️ ${results.buttonsSinHandler.length} botones sin handler:`);
      results.buttonsSinHandler.slice(0, 5).forEach(b => {
        console.log(`   ❌ "${b.texto}" (id: ${b.id})`);
      });
    } else {
      console.log('✅ Todos los botones tienen handlers');
    }

    // Test 3: Botones deshabilitados
    console.log('\n3️⃣ Botones deshabilitados...');
    allButtons.forEach((btn) => {
      if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') {
        const text = btn.textContent.trim().substring(0, 40);
        const reason = btn.disabled ? 'disabled' : 'aria-disabled';
        
        results.buttonsDisabled.push({
          texto: text,
          razon: reason
        });
      }
    });

    if (results.buttonsDisabled.length > 0) {
      console.log(`⚠️ ${results.buttonsDisabled.length} botones deshabilitados:`);
      results.buttonsDisabled.slice(0, 5).forEach(b => {
        console.log(`   ⏸️ "${b.texto}" (${b.razon})`);
      });
    }

    // Test 4: Monitorear clics con error
    console.log('\n4️⃣ Monitoreando errores en clics...');
    let clickErrors = 0;
    const originalAddEventListener = Element.prototype.addEventListener;
    
    Element.prototype.addEventListener = function(type, listener, options) {
      if (type === 'click' && this.tagName === 'BUTTON') {
        const wrappedListener = function(event) {
          try {
            return listener.call(this, event);
          } catch (err) {
            clickErrors++;
            results.buttonsConError.push({
              texto: this.textContent.trim().substring(0, 40),
              error: err.message
            });
            console.error(`❌ Error en botón: ${err.message}`);
          }
        };
        return originalAddEventListener.call(this, type, wrappedListener, options);
      }
      return originalAddEventListener.call(this, type, listener, options);
    };

    console.log('✅ Monitor de clics activado');

    // Test 5: Buscar botones "loading" indefinidamente
    console.log('\n5️⃣ Buscando botones en estado "loading" indefinido...');
    const loadingButtons = Array.from(allButtons).filter(btn => {
      const hasSpinner = btn.querySelector('.spinner, .loader, [role="status"]');
      const hasLoadingClass = btn.className.includes('loading');
      const hasLoadingAttr = btn.getAttribute('data-loading') === 'true';
      
      return hasSpinner || hasLoadingClass || hasLoadingAttr;
    });

    if (loadingButtons.length > 0) {
      console.log(`⚠️ ${loadingButtons.length} botones en estado "loading":`);
      loadingButtons.forEach(b => {
        console.log(`   ⏳ "${b.textContent.trim().substring(0, 40)}"`);
        results.buttonsTimeout.push({
          texto: b.textContent.trim().substring(0, 40)
        });
      });
    }

    // Test 6: Errores en consola
    console.log('\n6️⃣ Errores globales detectados...');
    const hasErrors = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.errors?.length > 0;
    const consoleErrors = window._consoleErrors || 0;
    
    console.log(`${consoleErrors === 0 ? '✅' : '❌'} Errores en consola: ${consoleErrors}`);

  } catch (err) {
    console.error('❌ Error durante scanning:', err);
    results.error = err.message;
  }

  // Resumen
  console.log('\n' + '=' .repeat(80));
  console.log('📊 RESUMEN DE BOTONES:');
  console.log(`Total botones: ${results.totalBotones}`);
  console.log(`Sin handler: ${results.buttonsSinHandler.length} ⚠️`);
  console.log(`Deshabilitados: ${results.buttonsDisabled.length}`);
  console.log(`Con errores: ${results.buttonsConError.length} ❌`);
  console.log(`En loading: ${results.buttonsTimeout.length} ⏳`);
  
  console.log('\n📋 BOTONES COLGADOS:');
  const botonesProblematicos = [
    ...results.buttonsSinHandler,
    ...results.buttonsConError,
    ...results.buttonsTimeout
  ];
  
  if (botonesProblematicos.length === 0) {
    console.log('✅ No hay botones colgados detectados');
  } else {
    botonesProblematicos.forEach((b, i) => {
      console.log(`${i + 1}. "${b.texto}"`);
    });
  }

  return results;
}

// Ejecutar
findBrokenButtons();
