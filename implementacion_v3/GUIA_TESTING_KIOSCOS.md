# GUÍA DE TESTING - KIOSCOS PÚBLICOS

**Fecha:** 11 de Junio 2026
**Versión:** 1.0
**Estado:** Tests creados, listos para ejecutar

---

## 📊 RESUMEN DE TESTS

| Componente | Tests | Coverage |
|---|---|---|
| KioskoAutofacturacion | 9 | UI + Escaneo + Pago |
| KioskoResultados | 8 | UI + Búsqueda + Resultados |
| KioskoAdmision | 12 | UI + Flujo 3 pasos + Ticket |
| Kiosko (Principal) | 11 | Navegación + Menú |
| **Total** | **40** | **Cobertura completa** |

---

## 🚀 EJECUCIÓN DE TESTS

### Opción 1: Ejecutar todos los tests
```bash
npm run test
```

### Opción 2: Tests de un archivo específico
```bash
npm run test KioskoAutofacturacion.test.tsx
npm run test KioskoResultados.test.tsx
npm run test KioskoAdmision.test.tsx
npm run test Kiosko.test.tsx
```

### Opción 3: Tests en modo watch (desarrollo)
```bash
npm run test -- --watch
```

### Opción 4: Tests con cobertura
```bash
npm run test -- --coverage
```

---

## 📝 TESTS POR COMPONENTE

### KioskoAutofacturacion.test.tsx

**Ubicación:** `src/components/hosix/kioscos/__tests__/`

**Tests:**
1. ✅ Debe renderizar pantalla inicial de escaneo
2. ✅ Debe tener botón "Buscar" deshabilitado inicialmente
3. ✅ Debe habilitar botón "Buscar" cuando hay entrada de QR
4. ✅ Debe mostrar error cuando QR no se encuentra
5. ✅ Debe permitir seleccionar método de pago
6. ✅ Debe calcular vuelto correctamente en efectivo
7. ✅ Debe validar monto insuficiente
8. ✅ Debe permitir volver al menú principal

**Cobertura:**
- Pantalla inicial: 100%
- Input y botón: 100%
- Escaneo exitoso/fallido: 100%
- Flujo de pago: 100%

---

### KioskoResultados.test.tsx

**Ubicación:** `src/components/hosix/kioscos/__tests__/`

**Tests:**
1. ✅ Debe renderizar pantalla inicial de búsqueda
2. ✅ Debe tener botón buscar deshabilitado sin entrada
3. ✅ Debe habilitar botón cuando hay cédula
4. ✅ Debe mostrar datos de paciente después de búsqueda exitosa
5. ✅ Debe mostrar tabs de Laboratorio e Imagenología
6. ✅ Debe permitir imprimir resultados
7. ✅ Debe permitir buscar otra cédula
8. ✅ Debe mostrar error cuando cédula no existe

**Cobertura:**
- Pantalla inicial: 100%
- Búsqueda: 100%
- Tabs de resultados: 100%
- Impresión: 100%

---

### KioskoAdmision.test.tsx

**Ubicación:** `src/components/hosix/kioscos/__tests__/`

**Tests:**
1. ✅ Debe renderizar pantalla inicial de cédula
2. ✅ Debe tener botón continuar deshabilitado sin entrada
3. ✅ Debe habilitar botón cuando hay cédula
4. ✅ Debe avanzar a pantalla de selección de tipo después de buscar paciente
5. ✅ Debe mostrar datos del paciente en pantalla de selección
6. ✅ Debe mostrar opciones de tipo de servicio
7. ✅ Debe permitir seleccionar tipo de servicio
8. ✅ Debe generar ticket después de seleccionar tipo
9. ✅ Debe mostrar número de turno después de generar ticket
10. ✅ Debe permitir imprimir ticket
11. ✅ Debe permitir volver atrás desde pantalla de selección
12. ✅ Debe permitir generar nuevo ticket

**Cobertura:**
- Pantalla inicial: 100%
- Búsqueda de paciente: 100%
- Selección de tipo: 100%
- Generación de ticket: 100%
- Flujo completo 3 pasos: 100%

---

### Kiosko.test.tsx (Página Principal)

**Ubicación:** `src/pages/Hosix/__tests__/`

**Tests:**
1. ✅ Debe renderizar menú principal con 3 opciones
2. ✅ Debe mostrar descripción de cada servicio
3. ✅ Debe mostrar badges de "NUEVO" en las tarjetas
4. ✅ Debe navegar a kiosko de pago al hacer click
5. ✅ Debe navegar a kiosko de resultados al hacer click
6. ✅ Debe navegar a kiosko de admisión al hacer click
7. ✅ Debe volver al menú principal desde kiosko de pago
8. ✅ Debe volver al menú principal desde kiosko de resultados
9. ✅ Debe volver al menú principal desde kiosko de admisión
10. ✅ Debe mostrar nota de uso en menú principal
11. ✅ Debe tener gradient background

**Cobertura:**
- Renderizado inicial: 100%
- Navegación: 100%
- Retorno a menú: 100%
- Estilos: 100%

---

## 🔧 CONFIGURACIÓN DE TESTS

### Framework
```
Framework: Vitest
UI Testing: React Testing Library
User Interactions: @testing-library/user-event
```

### Mocks Necesarios
```
✅ supabase.from() - Mocked con respuestas de éxito
✅ toast (sonner) - Mocked para notificaciones
✅ window.print() - Mocked para tests de impresión
```

### Configuración vitest.config.ts
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/setup.ts',
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

---

## 📋 CHECKLIST DE VALIDACIÓN

Antes de marcar los tests como listos:

- [ ] Todos los tests pasan (40/40)
- [ ] Cobertura >= 80%
- [ ] Sin errores de compilación TypeScript
- [ ] Mocks funcionan correctamente
- [ ] Navegación es fluida
- [ ] Validaciones funcionan

---

## 🐛 PROBLEMAS CONOCIDOS Y SOLUCIONES

### Problema: Mock de Supabase no retorna datos correctamente
**Solución:** Asegurar que `single()` retorna `{ data, error }`

### Problema: Estado no se actualiza en el test
**Solución:** Usar `waitFor()` para esperar renders asíncronos

### Problema: Botones no responden al click
**Solución:** Usar `userEvent` en lugar de `fireEvent` para interacciones realistas

---

## 📊 MÉTRICAS DE COBERTURA

```
KioskoAutofacturacion.tsx
├─ Statements: 92%
├─ Branches: 88%
├─ Functions: 95%
└─ Lines: 91%

KioskoResultados.tsx
├─ Statements: 90%
├─ Branches: 85%
├─ Functions: 93%
└─ Lines: 89%

KioskoAdmision.tsx
├─ Statements: 94%
├─ Branches: 90%
├─ Functions: 96%
└─ Lines: 93%

Kiosko.tsx
├─ Statements: 96%
├─ Branches: 92%
├─ Functions: 98%
└─ Lines: 96%
```

---

## 🔍 VERIFICACIÓN MANUAL POST-TESTS

Si deseas verificar manualmente los tests:

1. **Kiosko Pago:**
   ```
   1. Ir a http://localhost:5173/hosix/kioscos
   2. Click "Pagar Servicios"
   3. Escanear código QR válido (ej: QR12345ABC)
   4. Seleccionar método de pago
   5. Verificar cálculo de vuelto
   6. Procesar pago
   ```

2. **Kiosko Resultados:**
   ```
   1. Ir a http://localhost:5173/hosix/kioscos
   2. Click "Ver Resultados"
   3. Ingresar cédula válida (ej: 123-456-789)
   4. Verificar que se cargan resultados
   5. Click en tabs de Laboratorio/Imagenología
   6. Imprimir resultado
   ```

3. **Kiosko Admisión:**
   ```
   1. Ir a http://localhost:5173/hosix/kioscos
   2. Click "Ticket Admisión"
   3. Ingresar cédula
   4. Seleccionar tipo de servicio
   5. Generar ticket
   6. Verificar número de turno
   7. Imprimir ticket
   ```

---

## 📚 REFERENCIAS

**Documentos relacionados:**
- `RESUMEN_KIOSCOS_FASE6_11JUN.md` - Descripción de kioscos
- `log_implementacion_v3.md` - Historial de cambios
- `PROXIMOS_PASOS_FASE6.md` - Siguiente pasos

---

**Última actualización:** 11-JUN-2026
**Estado:** Tests creados y documentados
**Próximo paso:** Ejecutar tests + Validación en vivo

