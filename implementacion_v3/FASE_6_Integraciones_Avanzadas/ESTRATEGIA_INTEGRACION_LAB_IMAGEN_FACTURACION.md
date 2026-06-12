# ESTRATEGIA INTEGRACIÓN: Laboratorio + Imagenología + Facturación + Kiosko

## 🎯 VISIÓN GENERAL

Crear un flujo de negocio completo donde:
1. **Médico evaluando paciente** → Solicita Lab/Imagenología inline (sin navegar)
2. **Cada solicitud** → QR automático + código + relación con tarifas
3. **Validación stock** → Mostrarizomedicamente en tiempo real en formulario
4. **Caja** → Escanea QR y carga automáticamente servicios pendientes
5. **Kiosko** → Paciente paga directamente o ve cuentas pendientes
6. **Impresión** → Resultados de laboratorio en formato estándar con QR

---

## 📐 ARQUITECTURA DE INTEGRACIÓN

### 1. MODELO DE DATOS - RELACIONES NUEVAS

```sql
-- Ya existe: hosix_laboratorio_solicitudes, hosix_imagenologia_solicitudes
-- NUEVO: enlace a facturación

ALTER TABLE hosix_laboratorio_solicitudes ADD COLUMN (
  tarifa_id UUID REFERENCES hosix_tarifas(id),
  estado_pago VARCHAR(20) DEFAULT 'pendiente', -- pendiente, pagado, eximido
  monto_total DECIMAL(10, 2),
  codigo_qr VARCHAR(255) UNIQUE,
  numero_documento VARCHAR(50) UNIQUE
);

ALTER TABLE hosix_imagenologia_solicitudes ADD COLUMN (
  tarifa_id UUID REFERENCES hosix_tarifas(id),
  estado_pago VARCHAR(20) DEFAULT 'pendiente',
  monto_total DECIMAL(10, 2),
  codigo_qr VARCHAR(255) UNIQUE,
  numero_documento VARCHAR(50) UNIQUE
);

-- NUEVO: tabla para rastrear disponibilidad de items en solicitudes
CREATE TABLE hosix_disponibilidad_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_solicitud VARCHAR(50), -- 'laboratorio', 'imagenologia', 'prescripcion', 'hospitalizacion'
  solicitud_id UUID NOT NULL,
  item_id UUID NOT NULL, -- prueba_id, modalidad_id, medicamento_id, etc.
  disponible BOOLEAN DEFAULT true,
  centro_alterno VARCHAR(255), -- si no hay, dónde se puede hacer
  nota TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- NUEVO: tabla para código QR de solicitudes
CREATE TABLE hosix_codigos_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_documento VARCHAR(50), -- 'solicitud_lab', 'solicitud_imagen', 'prescripcion', 'hospitalizacion'
  documento_id UUID NOT NULL,
  numero_documento VARCHAR(50) UNIQUE,
  codigo_qr VARCHAR(255) UNIQUE,
  datos_json JSONB, -- contiene todo lo necesario para caja
  generado_en TIMESTAMPTZ DEFAULT now()
);
```

### 2. FLUJOS POR CONTEXTO

#### 2.1 EVALUACIÓN CLÍNICA (ConsultaMedicaForm)
```
Médico evaluando paciente
  ↓
[TAB] Prescripciones | Laboratorio | Imagenología
  ↓
Laboratorio:
  - Select modal: "Agregar Prueba"
  - Tabla inline: pruebas seleccionadas + estado pago + stock
  - Validación: ¿Paciente pagó? ¿Hay pruebas disponibles?
  ↓
Imagenología:
  - Select modal: "Agregar Estudio"
  - Tabla inline: estudios seleccionados + estado pago
  ↓
[GENERAR QR] → Crea código, lo guarda en BD, genera documento de referencia
```

#### 2.2 CAJA (Cajas.tsx)
```
Cajero escanea QR o ingresa código documento
  ↓
API `/hosix-caja-scan` → busca documento
  ↓
Carga servicios pendientes de pago:
  - Laboratorio: pruebas
  - Imagenología: estudios
  - Farmacia: medicamentos
  - Consulta: tarifa consulta
  ↓
Cajero selecciona items a pagar
  ↓
Genera recibo/ticket
  ↓
Actualiza estado_pago en BD
```

#### 2.3 KIOSKO DE AUTOFACTURACIÓN
```
Paciente escanea su cédula o ingresa ID
  ↓
Muestra:
  - Cuentas pendientes (laboratorio, imagenología, farmacia, etc.)
  - Botón: "Pagar ahora"
  - Botón: "Ver resultados de laboratorio"
  ↓
Si elige "Pagar":
  - Selecciona items a pagar
  - Elige método (efectivo, tarjeta - futuro)
  - Emite ticket
  ↓
Si elige "Ver resultados":
  - Muestra resultados laboratorio con QR
  - Opción imprimir
```

---

## 🔧 CAMBIOS IMPLEMENTACIÓN

### PASO 1: Extender Modelos BD (Migración)
- Agregar campos a solicitudes (código_qr, numero_documento, estado_pago, tarifa_id, monto_total)
- Crear tabla `hosix_disponibilidad_items`
- Crear tabla `hosix_codigos_documentos`

### PASO 2: Crear Edge Functions Nuevas
1. **`/hosix-generar-qr-solicitud`**
   - Input: tipo (lab/imagen), solicitud_id
   - Output: código QR, numero_documento, JSON con datos
   - Guarda en `hosix_codigos_documentos`

2. **`/hosix-caja-scan`**
   - Input: codigo_qr o numero_documento
   - Output: tipo_documento, solicitud_data, servicios_pendientes
   - Lista items disponibles/no disponibles

3. **`/hosix-obtener-disponibilidad-items`**
   - Input: tipo_solicitud, lista de item_ids
   - Output: para cada item, booleano disponible + centro alterno si aplica

4. **`/hosix-procesar-pago-kiosko`**
   - Input: documento_id, items_seleccionados, monto
   - Output: ticket_id, numero_recibo
   - Actualiza estado_pago

### PASO 3: Componentes Nuevos

#### 3.1 `SelectorSolicitudesInline.tsx`
Componente reutilizable que:
- Muestra modal para agregar solicitud (lab o imagen)
- Tabla con solicitudes agregadas
- Valida stock en tiempo real
- Muestra ícono rojo si no disponible
- Permite eliminar antes de guardar

#### 3.2 `VerificadorDisponibilidad.tsx`
- Badge verde/rojo por item
- Link a centro alterno si aplica
- Actualizable en tiempo real desde hook

#### 3.3 `KioskoAutofacturacion.tsx`
- Input: cédula del paciente o escaneo
- Tabs: "Cuentas Pendientes" | "Resultados Laboratorio"
- Tabla de items con checkbox + precio
- Botón pagar
- Emite ticket

#### 3.4 `ScannerQRCaja.tsx` (para Cajas.tsx)
- Input QR o código manual
- Carga documento automáticamente
- Muestra servicios desglosados

### PASO 4: Integración en Páginas Existentes

#### 4.1 ConsultaMedicaForm.tsx
```tsx
<Tabs>
  <TabsContent value="prescripciones">
    <PrescripcionesManager ... />
  </TabsContent>
  <TabsContent value="laboratorio">
    <SelectorSolicitudesInline 
      tipo="laboratorio"
      onSave={(solicitudes) => { /* agrega a evaluacion */ }}
    />
  </TabsContent>
  <TabsContent value="imagenologia">
    <SelectorSolicitudesInline 
      tipo="imagenologia"
      onSave={(solicitudes) => { /* agrega a evaluacion */ }}
    />
  </TabsContent>
</Tabs>
```

#### 4.2 Cajas.tsx
```tsx
<ScannerQRCaja 
  onDocumentScanned={(data) => {
    // Carga servicios pendientes
    // Muestra tabla para seleccionar items
  }}
/>
```

#### 4.3 Nueva Ruta: /hosix/kiosko-autofacturacion
```tsx
<KioskoAutofacturacion />
```

---

## 📊 TABLAS NECESARIAS (NUEVAS/MODIFICADAS)

### Modificar (migraciones):
- `hosix_laboratorio_solicitudes` - agregar código_qr, numero_documento, estado_pago, tarifa_id, monto_total
- `hosix_imagenologia_solicitudes` - agregar código_qr, numero_documento, estado_pago, tarifa_id, monto_total

### Crear:
- `hosix_disponibilidad_items` - stock en tiempo real por item
- `hosix_codigos_documentos` - registro central de códigos QR

### Verificar conexión:
- `hosix_tarifas` debe tener relación con laboratorio (pruebas catálogo) e imagenología (modalidades)
  - `hosix_laboratorio_pruebas_catalogo.tarifa_id` → `hosix_tarifas.id`
  - `hosix_imagenologia_modalidades.tarifa_id` → `hosix_tarifas.id`

---

## 🎬 PLAN DE IMPLEMENTACIÓN (PRIORIZADO)

### Fase 6.3+ (Próxima)
1. **[CRÍTICO]** Migración BD para agregar código_qr, numero_documento, estado_pago, tarifa_id
2. **[CRÍTICO]** Edge function `/hosix-generar-qr-solicitud`
3. **[CRÍTICO]** Edge function `/hosix-obtener-disponibilidad-items`
4. **[ALTO]** Componente `SelectorSolicitudesInline.tsx`
5. **[ALTO]** Componente `VerificadorDisponibilidad.tsx`
6. **[ALTO]** Integración en `ConsultaMedicaForm.tsx`
7. **[MEDIO]** Edge function `/hosix-caja-scan`
8. **[MEDIO]** Componente `ScannerQRCaja.tsx`
9. **[MEDIO]** Integración en `Cajas.tsx`
10. **[BAJO]** Kiosko de autofacturación (ruta nueva + componente)

---

## 🔐 SEGURIDAD Y AUDITORÍA

- Cada código_qr único, con timestamp
- RLS: solo paciente ve sus documentos
- Auditoría: quién generó, cuándo, qué cambios
- Validación: tarifa debe estar activa cuando se genera solicitud

---

## 📋 BENEFICIOS DEL DISEÑO

✅ Médico no abandona la evaluación clínica
✅ Stock visible en tiempo real durante prescripción
✅ Items no disponibles marcados en rojo
✅ Código QR automático, sin manual
✅ Flujo caja optimizado (solo escanear)
✅ Paciente autonomía con kiosko
✅ Auditoría completa de solicitudes → pago
✅ Relación clara Lab-Imagen-Facturación-Stock

---

**Propuesto:** Empezar con PASO 1 (migración BD) y PASO 2 edge functions en paralelo.
**Luego:** Componentes + integraciones.
**Kiosko:** Última prioridad (funcionalidad secundaria).
