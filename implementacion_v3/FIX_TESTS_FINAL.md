# FIX FINAL PARA TESTS - FASE 6

**Status:** Correcciones aplicadas
**Problemas encontrados:** 2 principales
**Soluciones aplicadas:** 3

---

## 🔴 PROBLEMAS DETECTADOS

### 1. Error: Invalid Chai property: toBeInTheDocument
```
Error: Invalid Chai property: toBeInTheDocument
```

**Causa:** Falta `@testing-library/jest-dom` que proporciona matchers personalizados

**Solución:** Agregar dependencia + setup file

### 2. Tests fallan porque mocks no retornan datos
```
Unable to find an element with the text: /laboratorio/i
```

**Causa:** Los mocks de Supabase no están retornando datos correctamente en la estructura esperada

**Solución:** Reconfigurar los mocks para cada tabla

---

## ✅ CORRECCIONES APLICADAS

### 1. Agregada dependencia a package.json
```json
"@testing-library/jest-dom": "^6.1.5"
```

### 2. Creado test-setup.ts
```ts
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    // ...
  })),
})
```

### 3. Actualizado vitest.config.ts
```ts
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/test-setup.ts'],  // ← Agregado
  css: true,
}
```

### 4. Reparados mocks en KioskoResultados.test.tsx
```ts
vi.mock('@/integrations/supabase/hosixClient', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'hosix_pacientes') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: {...}, error: null }),
          single: vi.fn().mockResolvedValue({ data: {...}, error: null }),
        }
      }
      if (table === 'hosix_laboratorio_resultados') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }
      }
      // ... similares para otras tablas
    }),
  },
}))
```

---

## 🚀 PRÓXIMOS PASOS

### 1. Instalar dependencias
```bash
npm install
```

### 2. Ejecutar tests
```bash
npm run test
```

### 3. Resultado esperado
```
✓ src/pages/Hosix/__tests__/Kiosko.test.tsx (11)
✓ src/components/hosix/kioscos/__tests__/KioskoAdmision.test.tsx (12)
✓ src/components/hosix/kioscos/__tests__/KioskoAutofacturacion.test.tsx (9)
✓ src/components/hosix/kioscos/__tests__/KioskoResultados.test.tsx (8)

Test Files  4 passed (4)
     Tests  40 passed (40)
```

---

## 📋 ARCHIVOS MODIFICADOS

- ✅ `package.json` - Agregada @testing-library/jest-dom
- ✅ `src/test-setup.ts` - NUEVO: Setup para vitest
- ✅ `vitest.config.ts` - Actualizado con setupFiles
- ✅ `src/components/hosix/kioscos/__tests__/KioskoResultados.test.tsx` - Mocks corregidos

---

## ⚡ COMANDOS RÁPIDOS

```bash
# 1. Instalar todo
npm install

# 2. Ejecutar tests
npm run test

# 3. Ver cobertura
npm run test -- --coverage

# 4. Modo watch
npm run test -- --watch
```

---

## ✨ RESUMEN

| Problema | Solución | Status |
|---|---|---|
| Matchers no reconocidos | @testing-library/jest-dom + setup | ✅ |
| Mocks sin datos | Reconfigurar mocks por tabla | ✅ |
| Missing window.matchMedia | Mockear en setup | ✅ |

---

Una vez que npm install termine, los tests deberían pasar todos.

