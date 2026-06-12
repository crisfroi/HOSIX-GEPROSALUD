# RESUMEN KIOSCOS PÚBLICOS - FASE 6 (11 JUNIO 2026)

**Hora:** 11-JUN (continuación)
**Status:** ✅ COMPLETADO
**Componentes:** 3 Kioscos Públicos Operativos

---

## 📱 DESCRIPCIÓN GENERAL

Se implementaron 3 kioscos públicos independientes sin necesidad de login, diseñados para autoservicio del paciente:

1. **Kiosko de Autofacturación** - Pagar servicios escaneando QR
2. **Kiosko de Resultados** - Consultar resultados por cédula
3. **Kiosko de Admisión** - Generar ticket de lista de espera automáticamente

Todos accesibles desde: `/hosix/kioscos`

---

## 🏗️ ARQUITECTURA

```
/hosix/kioscos
├─ Página Principal (Menú)
│  ├─ KioskoAutofacturacion.tsx
│  ├─ KioskoResultados.tsx
│  └─ KioskoAdmision.tsx
└─ Navegación:
   ├─ Tab → Pago
   ├─ Tab → Resultados
   └─ Tab → Admisión
```

---

## 🛒 KIOSKO 1: AUTOFACTURACIÓN

### Funcionalidad:
```
1. Pantalla inicial: "Escanea tu código QR"
2. Input oculto acepta código automáticamente
3. Busca en: hosix_codigos_documentos
4. Carga solicitud (lab/imagen) con monto
5. Selecciona método de pago
6. Si efectivo: calcula vuelto
7. Procesa pago:
   - Actualiza estado_pago en solicitud
   - Crea recibo_pago
   - Crea movimiento_caja
8. Muestra confirmación
9. Opción imprimir recibo
```

### Componente: `KioskoAutofacturacion.tsx`
- **Props:** `onBack?: () => void`
- **Estados:** cedula → documentoData → pagoProcesado
- **Mutations:**
  - `escanearMutation` - Busca código QR
  - `procesarPagoMutation` - Procesa pago
- **Tablas usadas:**
  - `hosix_codigos_documentos` (lectura)
  - `hosix_laboratorio_solicitudes` (lectura/actualización)
  - `hosix_imagenologia_solicitudes` (lectura/actualización)
  - `hosix_recibos_pagos` (inserción)

### Flujo Visual:
```
┌─────────────────────────┐
│ Escanea tu código QR    │
│ [INPUT INVISIBLE]       │
│ [Buscar]                │
└─────────────────────────┘
           ↓
┌─────────────────────────┐
│ Confirmar Pago          │
│ Paciente: JUAN          │
│ Monto: $125.00          │
│ Método: [Efectivo   ]   │
│ Recibido: [$125.00 ]    │
│ Vuelto: $0.00           │
│ [Procesar Pago]         │
└─────────────────────────┘
           ↓
┌─────────────────────────┐
│ ✓ PAGO EXITOSO         │
│ Recibo: REC202600001234 │
│ [Imprimir] [Nuevo]      │
└─────────────────────────┘
```

---

## 📋 KIOSKO 2: RESULTADOS

### Funcionalidad:
```
1. Pantalla: "Ingresa tu cédula"
2. Busca en: hosix_pacientes
3. Si existe:
   - Busca resultados de laboratorio
   - Busca estudios de imagenología
4. Tabs para ver:
   - Laboratorio: valor, rango normal, fecha, diagnóstico
   - Imagenología: series, cantidad de imágenes, diagnóstico
5. Opción imprimir
6. Buscar otra cédula
```

### Componente: `KioskoResultados.tsx`
- **Props:** `onBack?: () => void`
- **Estados:** cedula → pacienteData → resultados + estudios
- **Mutations:**
  - `buscarMutation` - Busca por cédula
- **Tablas usadas:**
  - `hosix_pacientes` (lectura)
  - `hosix_laboratorio_resultados` (lectura)
  - `hosix_imagenologia_estudios` (lectura)

### Flujo Visual:
```
┌─────────────────────────┐
│ Consulta tus Resultados │
│ [Cédula: 123-456-789]   │
│ [Buscar Resultados]     │
└─────────────────────────┘
           ↓
┌─────────────────────────┐
│ JUAN PÉREZ - 123-456    │
│ [Laboratorio] [Imagen]  │
│                         │
│ Análisis Sangre         │
│ Valor: 5.2 mg/dL        │
│ Rango: 3.5 - 7.0        │
│ Fecha: 11-JUN-2026      │
└─────────────────────────┘
```

---

## 🎫 KIOSKO 3: ADMISIÓN (CON LISTA DE ESPERA)

### Funcionalidad:
```
PASO 1: Ingresa cédula
1. Busca en: hosix_pacientes
2. Valida existencia

PASO 2: Selecciona servicio
1. Opciones:
   - Consulta Ambulatoria
   - Hospitalización
   - Cirugía
   - Examen Diagnóstico
2. Selecciona uno

PASO 3: Genera ticket
1. Cuenta solicitudes activas del tipo seleccionado
2. Calcula: numeroTicket = count + 1
3. Crea registro en hosix_lista_espera:
   - paciente_id: del paso 1
   - tipo_solicitud: del paso 2
   - estado: 'activa'
   - prioridad: 'media'
4. Genera número de turno inmediato
5. Muestra ticket imprimible
```

### Componente: `KioskoAdmision.tsx`
- **Props:** `onBack?: () => void`
- **Estados:** cedula → pacienteData → tipoSolicitud → ticketGenerado
- **Mutations:**
  - `buscarPacienteMutation` - Busca por cédula
  - `generarTicketMutation` - Crea en lista de espera
- **Tablas usadas:**
  - `hosix_pacientes` (lectura)
  - `hosix_lista_espera` (inserción/conteo)

### Flujo Visual:
```
┌─────────────────────────┐
│ Generar Ticket Admisión │
│ [Cédula: 123-456-789]   │
│ [Continuar]             │
└─────────────────────────┘
           ↓
┌─────────────────────────┐
│ ¿Qué servicio necesitas?│
│ □ Consulta Ambulatoria  │
│ □ Hospitalización       │
│ □ Cirugía               │
│ □ Examen Diagnóstico    │
│ [Generar Ticket]        │
└─────────────────────────┘
           ↓
┌─────────────────────────┐
│ ¡TICKET GENERADO!       │
│                         │
│  TU NÚMERO DE TURNO     │
│                         │
│      # 0027             │
│                         │
│ Tipo: Consulta Ambulat. │
│ Paciente: JUAN PÉREZ    │
│                         │
│ [Imprimir] [Nuevo]      │
└─────────────────────────┘
```

### Clave: Generación Automática de Número en Lista de Espera

El ticket es **automático** porque:
1. No requiere confirmación de administrador
2. Se asigna posición basada en contador de solicitudes activas del tipo
3. El paciente obtiene su número instantáneamente
4. Se registra automáticamente en BD para que recepción vea la lista

**Ejemplo:**
- Si hay 26 solicitudes "Consulta Ambulatoria" activas
- El siguiente paciente obtiene número: **0027**

---

## 📄 PÁGINA PRINCIPAL: Kiosko.tsx

Menú con 3 tarjetas grandes que permiten seleccionar el servicio:

```tsx
<Kiosko.tsx>
  ├─ Estado: activeKiosko ('menu' | 'pago' | 'resultados' | 'admision')
  ├─ Card 1: "Pagar Servicios" → setActiveKiosko('pago')
  ├─ Card 2: "Ver Resultados" → setActiveKiosko('resultados')
  ├─ Card 3: "Ticket Admisión" → setActiveKiosko('admision')
  └─ Botón "Atrás" en cada subpágina → setActiveKiosko('menu')
```

---

## 🛠️ CAMBIOS EN RUTAS

**App.tsx:**
```tsx
// Agregado:
import Kiosko from '@/pages/Hosix/Kiosko'

// En rutas:
<Route path="kioscos" element={<Kiosko />} />
```

---

## 🎨 CARACTERÍSTICAS DE UX

1. **Sin requiere login**
   - Accesible directamente desde URL
   - No necesita autenticación

2. **Interfaz simplificada**
   - Sin sidebar
   - Textos grandes
   - Botones grandes
   - Colores llamativos

3. **Fullscreen**
   - Diseño responsive
   - Centrado en pantalla
   - Gradientes de fondo

4. **Accesibilidad**
   - Input autofocus en Scanner
   - Validaciones claras
   - Mensajes de error descriptivos

5. **Impresión**
   - Botón "Imprimir" en cada resultado
   - Recibos formateados para papel

---

## 📊 ESTADÍSTICAS DE IMPLEMENTACIÓN

| Componente | Líneas | Funciones | Queries |
|---|---|---|---|
| Kiosko.tsx | 176 | 1 | 0 |
| KioskoAutofacturacion.tsx | 414 | 4 | 4 |
| KioskoResultados.tsx | 318 | 2 | 2 |
| KioskoAdmision.tsx | 327 | 3 | 2 |
| **Total** | **1,235** | **10** | **8** |

---

## ✅ VALIDACIÓN NECESARIA

Antes de producción, validar:

1. **Kiosko Pago:**
   - [ ] Escanear código QR real
   - [ ] Métodos de pago funcionan
   - [ ] Recibo se crea en BD
   - [ ] Estado_pago se actualiza

2. **Kiosko Resultados:**
   - [ ] Búsqueda por cédula funciona
   - [ ] Resultados se cargan correctamente
   - [ ] Formato de datos es legible

3. **Kiosko Admisión:**
   - [ ] Contador de lista espera funciona
   - [ ] Número de turno es único
   - [ ] Registro se crea en hosix_lista_espera
   - [ ] Recepción ve el ticket en lista

---

## 🚀 PRÓXIMOS PASOS

1. **Migraciones SQL pendientes:**
   - `20260611_fase6_triggers_qr_automatico.sql`
   - `20260611_fase6_recibos_pagos.sql`

2. **Testing en vivo:**
   - Prueba de punta a punta
   - Validar integraciones

3. **Futuras mejoras:**
   - Pantalla de espera entre transacciones
   - Sonidos de confirmación
   - Integración con pantalla de pizarra (mostrar próximo número)
   - Reportes de uso de kioscos

---

## 📍 ACCESO

**URL:** `http://localhost:5173/hosix/kioscos`

**Menu:** Sistema de Kioscos
- Pagar Servicios
- Ver Resultados
- Ticket de Admisión

---

**Fecha:** 11 de Junio 2026
**Status:** ✅ COMPLETADO
**Fase:** 6 (70% progreso)
**Siguiente:** Aplicar migraciones + testing + reportes

