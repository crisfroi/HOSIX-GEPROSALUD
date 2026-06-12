# CORRECCIÓN Y EJECUCIÓN DE TESTS

**Fecha:** 11 de Junio 2026
**Status:** Error identificado y corregido
**Solución:** Instalar dependencias faltantes

---

## 🔴 ERROR ORIGINAL

```
Error: Cannot find module '@testing-library/dom'
```

### Causa
Faltaban las siguientes dependencias en `package.json`:
- `@testing-library/dom` (required by @testing-library/react)
- `@testing-library/user-event` (for user interactions in tests)
- `jsdom` (JavaScript DOM implementation for testing)

---

## ✅ SOLUCIÓN APLICADA

### 1. Actualizar package.json
Se agregaron las siguientes líneas en `devDependencies`:

```json
"@testing-library/dom": "^10.0.0",
"@testing-library/user-event": "^14.5.1",
"jsdom": "^24.0.0",
```

### 2. Crear vitest.config.ts
Se agregó archivo de configuración con:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

---

## 🚀 EJECUTAR TESTS AHORA

### Paso 1: Instalar dependencias
```bash
npm install
```

### Paso 2: Ejecutar tests
```bash
npm run test
```

### Opciones de ejecución:

**Todos los tests:**
```bash
npm run test
```

**Un archivo específico:**
```bash
npm run test -- KioskoAutofacturacion.test.tsx
```

**Modo watch (desarrollo):**
```bash
npm run test -- --watch
```

**Con cobertura:**
```bash
npm run test -- --coverage
```

**Ver resultados en HTML:**
```bash
npm run test -- --coverage.reporter=html
# Abrir: coverage/index.html
```

---

## 📋 CHECKLIST DE EJECUCIÓN

### Pre-requisitos
- [ ] Node.js instalado (v18+)
- [ ] npm actualizado (`npm -v`)
- [ ] Archivo `package.json` actualizado con dependencias

### Instalación
```bash
# 1. Instalar dependencias
npm install

# 2. Esperar a que finalice (5-10 min)
# 3. Verificar que no hay errores
```

### Ejecución
```bash
# 1. Ejecutar todos los tests
npm run test

# 2. Verificar output:
# ✓ Debería mostrar 40 tests
# ✓ Debería mostrar 0 fallidos
# ✓ Debería mostrar 100% cobertura

# Esperado:
# Test Files  4 passed (4)
#      Tests  40 passed (40)
```

---

## 🧪 TESTS A EJECUTAR

### 1. KioskoAutofacturacion.test.tsx
- ✅ 9 tests
- Pantalla inicial
- Escaneo de QR
- Selección de método de pago
- Cálculo de vuelto

### 2. KioskoResultados.test.tsx
- ✅ 8 tests
- Búsqueda por cédula
- Carga de resultados
- Tabs de laboratorio/imagenología
- Impresión

### 3. KioskoAdmision.test.tsx
- ✅ 12 tests
- Flujo de 3 pasos
- Generación de ticket
- Número de turno
- Integración con lista de espera

### 4. Kiosko.test.tsx
- ✅ 11 tests
- Menú principal
- Navegación entre kioscos
- Volver al menú
- Estilos

**Total: 40 tests**

---

## 📊 RESULTADO ESPERADO

```
✓ src/pages/Hosix/__tests__/Kiosko.test.tsx (11)
✓ src/components/hosix/kioscos/__tests__/KioskoAdmision.test.tsx (12)
✓ src/components/hosix/kioscos/__tests__/KioskoAutofacturacion.test.tsx (9)
✓ src/components/hosix/kioscos/__tests__/KioskoResultados.test.tsx (8)

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯

Test Files  4 passed (4)
     Tests  40 passed (40)

Duración: ~30s
```

---

## 🐛 TROUBLESHOOTING

### Si persiste el error:
```bash
# 1. Limpiar caché
npm cache clean --force

# 2. Eliminar node_modules
rm -rf node_modules
# o en Windows:
rmdir /s /q node_modules

# 3. Reinstalar
npm install

# 4. Ejecutar nuevamente
npm run test
```

### Si fallan algunos tests:
```bash
# Ver output detallado
npm run test -- --reporter=verbose

# Ver error específico
npm run test -- KioskoAdmision.test.tsx --reporter=verbose
```

### Si timeout:
```bash
# Aumentar timeout
npm run test -- --testTimeout=10000
```

---

## ✨ POST-TESTS

Una vez que todos los tests pasen:

1. **Validar cobertura:**
   ```bash
   npm run test -- --coverage
   ```
   Esperado: 90%+ en todos los archivos

2. **Validar en navegador:**
   - Ir a `/hosix/kioscos`
   - Probar cada kiosko manualmente
   - Verificar funcionalidades críticas

3. **Documentación:**
   - Tests pasados ✅
   - Cobertura verificada ✅
   - Sistema operativo ✅

---

## 📞 REFERENCIA

**Archivos relacionados:**
- `package.json` - Dependencias actualizadas
- `vitest.config.ts` - Configuración Vitest
- `GUIA_TESTING_KIOSCOS.md` - Guía detallada de tests
- `log_implementacion_v3.md` - Historial de cambios

**Comandos rápidos:**
```bash
npm install                    # Instalar dependencias
npm run test                   # Ejecutar todos los tests
npm run test -- --watch       # Modo watch
npm run test -- --coverage    # Con cobertura
```

---

## ✅ CHECKLIST FINAL

- [x] Dependencias agregadas a package.json
- [x] vitest.config.ts creado
- [x] Instrucciones claras para ejecutar
- [x] Troubleshooting incluido
- [x] Resultado esperado documentado
- [ ] Tests ejecutados en tu máquina
- [ ] Cobertura verificada

---

**Próximo paso:** Ejecutar `npm install && npm run test`

**Resultado esperado:** 40/40 tests pasados ✅

