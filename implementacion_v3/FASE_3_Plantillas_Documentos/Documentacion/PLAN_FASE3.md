# FASE 3 - PLANTILLAS Y DOCUMENTOS CLÍNICOS - PLAN DETALLADO

**Fecha Inicio:** 5 de Junio 2026  
**Estado:** 🟡 PLANIFICADA  
**Duración Estimada:** 5-7 días  
**Responsable:** Dev Team  
**Complejidad:** ALTA - Arquitectura Enterprise de Plantillas  

---

## 📋 OBJETIVO FASE 3

Implementar arquitectura profesional de plantillas documentales con validaciones estrictas, generación PDF/DOCX impecable y 24 plantillas estándar para cubrir ciclo clínico completo + administrativo.

---

## 🏗️ ARQUITECTURA TÉCNICA RECOMENDADA

### Stack Tecnológico

**Frontend (React + Validaciones):**
- `react-hook-form` - Gestión eficiente de formularios
- `zod` - Validaciones de esquemas JSON dinámicos
- `Tailwind CSS` + CSS Paginado (break-inside, orphans, widows)
- `@react-pdf/renderer` (opcional para preview en cliente)

**Backend (Generación de Documentos):**
- `Playwright` o `WeasyPrint` - HTML-to-PDF con CSS Paginado
- `docx` (Node.js) - Generación de DOCX con control OpenXML
- `Supabase Edge Functions` - Procesamiento serverless

**Base de Datos:**
- Tabla `hosix_plantillas_esquemas` - Definición de campos
- Tabla `hosix_plantillas_instancias` - Documentos generados
- Tabla `hosix_plantillas_versiones` - Historial de cambios

---

## 🎯 COMPONENTES A ENTREGAR

### 3.1 Editor de Plantillas Mejorado (Arquitectura Enterprise)

**Objetivo:** Permitir creación/edición de plantillas sin código

**Funcionalidades Core:**
- ✅ Drag-drop de campos (Text, Number, Date, Select, Signature, etc.)
- ✅ Vista previa en tiempo real con paginación CSS
- ✅ Guardado versiones (auditoría completa)
- ✅ Validaciones via Zod schemas
- ✅ Condicionales dinámicos (si campo X = valor Y)
- ✅ Heredación de campos de otras plantillas
- ✅ Exportación template a JSON (para versionado)

**Archivos a crear:**
- `src/components/hosix/PlantillasEditor.tsx` (450 líneas)
- `src/components/hosix/CampoDinamico.tsx` (250 líneas)
- `src/hooks/useHosixPlantillas.ts` (350 líneas)
- `src/schemas/plantillasSchema.ts` (200 líneas)
- `supabase/migrations/20260605_plantillas_arquitectura.sql` (400 líneas)
- `supabase/functions/generate-document-pdf.ts` (500 líneas)
- `supabase/functions/generate-document-docx.ts` (500 líneas)

**Timeline:** 2-3 días

**Aceptación:**
- [ ] Editor visual 100% funcional sin código
- [ ] Campos dinámicos insertables con validaciones
- [ ] Vista previa paginada CSS correcta
- [ ] Versiones guardadas con timestamps
- [ ] Sin re-renders innecesarios (React.memo)

---

### 3.2 Plantillas Clínicas (12 plantillas)

#### GRUPO 1: DOCUMENTOS MÉDICOS PRINCIPALES

**1. Informe de Alta Hospitalaria**
- Campos: 28 (paciente, diagnósticos CIE-11, procedimientos, medicinas, recomendaciones)
- Secciones: Resumen clínico, Comorbilidades, Restricciones físicas, Seguimiento
- Export: PDF + DOCX (editable)
- Validación: Certificado digital obligatorio

**2. Informe Urgencias**
- Campos: 22 (triaje, antecedentes rápidos, exploración, diagnóstico)
- Secciones: Historial mínimo, Exploración, Destino (alta/remisión/ingreso)
- Export: PDF inmediato (para entregar paciente)
- Validación: Hora de llegada ≤ Hora de salida

**3. Informe Consulta Externa**
- Campos: 25 (antecedentes, revisión sistemas, SOAP note, plan)
- Secciones: Antecedentes, Exploración, Impresión diagnóstica, Plan terapéutico
- Export: PDF + DOCX
- Validación: Al menos 1 diagnóstico CIE-11

**4. Informe Quirúrgico**
- Campos: 35 (técnica detallada, hallazgos, complicaciones, cierre)
- Secciones: Diagnóstico pre-op, Técnica, Hallazgos, Cierre, Complicaciones
- Export: PDF + DOCX
- Validación: Tiempos de incisión ≤ cierre

**5. Receta Médica**
- Campos: 16 (medicamento, dosis, frecuencia, duración, RNM)
- Secciones: Cabecera médico, Listado medicinas, Instrucciones especiales
- Export: PDF (formato estándar farmacia)
- Validación: RNM del médico único

**6. Pruebas de Laboratorio**
- Campos: 30 (tipo prueba, resultados, valores referencia, interpretación)
- Secciones: Datos muestra, Metodología, Resultados tabulados, Interpretación médica
- Export: PDF
- Validación: Rango referencia obligatorio para cada analito

**7. Certificado Médico**
- Campos: 18 (diagnóstico, restricciones, duración reposo)
- Secciones: Diagnóstico, Restricciones laborales, Duración, Firma
- Export: PDF (formato legal)
- Validación: Fecha vencimiento > hoy

**8. Hoja de Consentimiento Informado (Procedimiento Invasivo/Quirúrgico)**
- Campos: 40 (tipo procedimiento, riesgos explicados, alternativas, firma paciente + testigos)
- Secciones: Descripción procedimiento, Riesgos específicos, Beneficios, Alternativas, Derechos
- Export: PDF (doble faz para archivo + paciente)
- Validación: Firma electrónica del paciente obligatoria

**9. Revocación de Consentimiento Informado**
- Campos: 12 (referencia consentimiento previo, motivo, fecha, firma)
- Secciones: Antecedente, Declaración de revocación, Firma
- Export: PDF
- Validación: FK a documento original de consentimiento

**10. Autorización de Entrega de Cadáver y Pertenencias**
- Campos: 25 (familiar autorizado, beneficiario funeraria, inventario pertenencias)
- Secciones: Datos fallecido, Familiar autorizado, Funeraria, Listado objetos, Firmas
- Export: PDF (3 copias: archivo + familiar + funeraria)
- Validación: RNM o cédula del familiar

**11. Consentimiento para Investigación / Ensayos Clínicos**
- Campos: 32 (protocolo, riesgos, derechos, remuneración, derecho retiro)
- Secciones: Descripción estudio, Riesgos específicos, Protección datos (GDPR/LOPD), Derecho retiro
- Export: PDF (archivo permanente)
- Validación: CIF investigador verificable

**12. Informe de Custodia de Objetos de Valor**
- Campos: 28 (inventario detallado, foto, custodiante, paciente/familia)
- Secciones: Descripción objeto, Foto (QR linkable), Custodio, Receptor al alta, Firma triple
- Export: PDF
- Validación: Foto obligatoria para objetos > 500€

---

#### GRUPO 2: DOCUMENTOS ADMINISTRATIVOS Y FINANCIEROS

**13. Presupuesto Clínico Estimado**
- Campos: 45 (servicios, honorarios, materiales, anestesia, farmacia, total)
- Secciones: Desglose por rubro, Condiciones pago, Vigencia presupuesto, Observaciones
- Export: PDF (para paciente) + DOCX (editable para negociar)
- Validación: Total = SUM(rubros), IVA automático

**14. Pagaré / Reconocimiento de Obligación de Pago**
- Campos: 22 (acreedor, deudor, monto, plazo, tasas, garantías)
- Secciones: Cláusulas legales, Firma deudor, Testigos
- Export: PDF (legal)
- Validación: Monto > 0, plazo futuro

**15. Hoja de Cargo Quirúrgico (Pre-facturación)**
- Campos: 50+ (materiales consumidos, medicinas, implantes, cantidad, valor unitario)
- Secciones: Datos intervención, Listado detallado consumos, Total, Autorización
- Export: PDF
- Validación: Código artículo verificado vs almacén, cantidad ≤ stock

**16. Factura Detallada Hospitalaria**
- Campos: 60+ (servicios, estancias, honorarios, impuestos, descuentos)
- Secciones: Encabezado fiscal, Desglose servicios, IVA/Impuestos, Forma pago
- Export: PDF + XML (para SAT/Hacienda)
- Validación: CIF/RUC hospital, secuencial fiscal

**17. Informe de Cobertura de Aseguradora / Mutua**
- Campos: 35 (póliza, servicios autorizados, copago, límites, excepciones)
- Secciones: Datos aseguradora, Autorización servicios, Copagos, Excepciones
- Export: PDF
- Validación: Número póliza válido en BD

---

#### GRUPO 3: DOCUMENTOS DE CONTROL Y SEGURIDAD

**18. Formulario de Registro de Eventos Adversos (Centinela)**
- Campos: 40 (tipo evento, severidad, causas, correcciones, responsable)
- Secciones: Descripción evento, Factores causales, Medidas correctivas, Plan mejora
- Export: PDF (anónimo para análisis)
- Validación: Categoría evento requerida, nivel severidad automático

**19. Hoja de Reclamaciones, Quejas y Sugerencias**
- Campos: 28 (tipo, descripción, área afectada, solicitante, prioridad)
- Secciones: Detalle queja, Datos solicitante, Categoría, Acción correctiva
- Export: PDF (para archivo)
- Validación: Datos solicitante o anónimo validado

**20. Bitácora de Control de Stock y Farmacia de Planta**
- Campos: 32 (medicamento, cantidad, responsable, autorización, destino)
- Secciones: Medicamentos disponibles, Reposiciones solicitadas, Autorización, Firma
- Export: PDF + CSV (para inventario)
- Validación: Cantidad ≤ stock máximo, autorización obligatoria

**21. Ficha de Mantenimiento Correctivo/Preventivo de Equipos Médicos**
- Campos: 38 (equipo, tipo mantenimiento, técnico, estado pre/post, calibración)
- Secciones: Datos equipo, Tipo servicio, Trabajo realizado, Estado final, Próx. mantenimiento
- Export: PDF
- Validación: Fecha próx. revisión > hoy, fotografía antes/después

**22. Notificación Obligatoria de Enfermedades de Declaración Obligatoria (EDO)**
- Campos: 35 (enfermedad, paciente, brote?, contactos, autoridad notificada)
- Secciones: Caso confirmado, Contactos expuestos, Medidas de aislamiento, Notificación a Ministerio
- Export: PDF + XML (para Ministerio de Salud)
- Validación: Enfermedad en lista EDO validada, notificación timestamped

---

#### GRUPO 4: DOCUMENTOS DE INDICADORES Y AUDITORÍA

**23. Informe de Indicadores de Gestión Hospitalaria (Dashboard)**
- Campos: 50+ (giro camas, estancia promedio, mortalidad, infecciones, readmisiones)
- Secciones: Período reportado, Indicadores clínicos, Indicadores financieros, Análisis tendencias
- Export: PDF (ejecutivo) + DOCX (detallado) + CSV (datos brutos)
- Validación: Período > 1 mes, cálculos automáticos

**24. Checklist de Auditoría Interna de Historia Clínica**
- Campos: 45 (verificación completitud, legibilidad, firmas, consentimientos, códigos)
- Secciones: Datos demográficos OK?, Notas médicas completas?, Consentimientos presentes?, Codificación CIE-11?
- Export: PDF (informe) + CSV (dataset)
- Validación: Evaluador certificado, muestreo estratificado

---

## 📊 MATRIZ COMPLETA DE PLANTILLAS

| # | Nombre | Tipo | Campos | Export | Validación | Estado |
|----|--------|------|--------|--------|-----------|--------|
| 1 | Alta Hospitalaria | Médico | 28 | PDF+DOCX | Firma digital | ⏳ |
| 2 | Informe Urgencias | Médico | 22 | PDF | Horas validas | ⏳ |
| 3 | Consulta Externa | Médico | 25 | PDF+DOCX | ≥1 diagnóstico | ⏳ |
| 4 | Informe Quirúrgico | Médico | 35 | PDF+DOCX | Tiempos válidos | ⏳ |
| 5 | Receta | Médico | 16 | PDF | RNM único | ⏳ |
| 6 | Pruebas Laboratorio | Médico | 30 | PDF | Rango referencia | ⏳ |
| 7 | Certificado Médico | Médico | 18 | PDF | Vencimiento futuro | ⏳ |
| 8 | Consentimiento Proc. | Legal | 40 | PDF | Firma paciente | ⏳ |
| 9 | Revocación Consent. | Legal | 12 | PDF | FK referencia | ⏳ |
| 10 | Autorización Cadáver | Legal | 25 | PDF | Cédula familiar | ⏳ |
| 11 | Consentimiento Invest. | Legal | 32 | PDF | CIF investigador | ⏳ |
| 12 | Custodia Objetos | Legal | 28 | PDF | Foto obligatoria | ⏳ |
| 13 | Presupuesto Clínico | Financiero | 45 | PDF+DOCX | Total correcto | ⏳ |
| 14 | Pagaré | Financiero | 22 | PDF | Monto > 0 | ⏳ |
| 15 | Cargo Quirúrgico | Financiero | 50 | PDF | Stock verificado | ⏳ |
| 16 | Factura Hospitalaria | Financiero | 60 | PDF+XML | Fiscal válido | ⏳ |
| 17 | Cobertura Aseguradora | Financiero | 35 | PDF | Póliza válida | ⏳ |
| 18 | Eventos Adversos | Control | 40 | PDF | Categoría req. | ⏳ |
| 19 | Reclamaciones | Control | 28 | PDF | Tipo requerido | ⏳ |
| 20 | Stock Farmacia | Control | 32 | PDF+CSV | Auth. obligatoria | ⏳ |
| 21 | Mant. Equipos | Control | 38 | PDF | Próx. fecha valid | ⏳ |
| 22 | Notificación EDO | Control | 35 | PDF+XML | En lista EDO | ⏳ |
| 23 | Indicadores Gestión | BI | 50 | PDF+DOCX+CSV | Período > 1 mes | ⏳ |
| 24 | Auditoría Historia | BI | 45 | PDF+CSV | Auditor cert. | ⏳ |

---

## 🛠️ CONFIGURACIÓN CSS PARA PAGINACIÓN PERFECTA

```css
/* Estilos para generación PDF/impresión */
@media print {
  /* Evita que párrafos se corten */
  p, .field-group {
    break-inside: avoid;
    orphans: 3;
    widows: 3;
  }
  
  /* Tablas no se dividen */
  table, tr, td {
    break-inside: avoid;
  }
  
  /* Secciones en página nueva */
  .section-header {
    break-after: always;
  }
  
  /* Márgenes máquina */
  body {
    margin: 2cm;
    page-break-margin: 2cm;
  }
}
```

---

## 💾 ESTRUCTURA BASE DE DATOS

```sql
-- Esquemas de plantillas (definición campos)
CREATE TABLE hosix_plantillas_esquemas (
  id UUID PRIMARY KEY,
  nombre VARCHAR(100),
  tipo ENUM('medico','legal','financiero','control','bi'),
  descripcion TEXT,
  campos JSONB, -- Arreglo de definiciones de campo
  versión INT,
  activo BOOLEAN,
  created_at TIMESTAMPTZ
);

-- Instancias generadas (documentos)
CREATE TABLE hosix_plantillas_instancias (
  id UUID PRIMARY KEY,
  esquema_id UUID REFERENCES hosix_plantillas_esquemas,
  datos JSONB, -- Datos llenados
  generado_por UUID REFERENCES hosix_usuarios,
  estado ENUM('borrador','firmado','archivado'),
  created_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ
);

-- Historial versiones
CREATE TABLE hosix_plantillas_versiones (
  id UUID PRIMARY KEY,
  esquema_id UUID,
  cambios JSONB,
  autor_id UUID,
  timestamp TIMESTAMPTZ
);
```

---

## 🚀 TIMELINE REALISTA

- **Días 1-2:** Arquitectura editor + BD + Edge Functions
- **Días 3-4:** Plantillas médicas (1-7)
- **Días 5-6:** Plantillas administrativas + control (8-22)
- **Día 7:** BI + auditoría + testing + documentación

**Total:** 7 días de desarrollo intensivo

---

## ✅ CRITERIOS DE ACEPTACIÓN FINAL

- [ ] 24 plantillas 100% funcionales
- [ ] Generación PDF sin saltos de página rotos
- [ ] Generación DOCX editable
- [ ] Validaciones Zod en cada campo
- [ ] Versionado completo de plantillas
- [ ] Sin re-renders innecesarios (React performance)
- [ ] Documentación técnica de cada plantilla
- [ ] Testing unitario de validaciones

---

**Última actualización:** 5 JUN 2026  
**Versión:** 2.0 (Arquitectura Enterprise)  
**Responsable:** Dev Team HOSIX
