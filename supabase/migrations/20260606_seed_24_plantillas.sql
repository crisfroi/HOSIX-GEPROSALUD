-- ============================================================================
-- SEED DATA: 24 Plantillas Estándar para HOSIX
-- Fecha: 6 de Junio 2026
-- ============================================================================

-- LIMPIAR DATOS ANTIGUOS (opcional)
-- DELETE FROM configuracion.plantillas_documentos WHERE codigo LIKE 'P%';

-- ============================================================================
-- GRUPO 1: PLANTILLAS MÉDICAS (12)
-- ============================================================================

INSERT INTO configuracion.plantillas_documentos (
  codigo, nombre, tipo, grupo, descripcion, 
  contenido_html, export_pdf, export_docx, requiere_firma, activo
) VALUES

-- 1. INFORME DE ALTA HOSPITALARIA
('P001', 'Informe de Alta Hospitalaria', 'informe_alta', 'medico',
'Documento de alta del paciente al completar hospitalización',
'<h2>INFORME DE ALTA HOSPITALARIA</h2>
<p><strong>Paciente:</strong> {{paciente.nombre}}</p>
<p><strong>NHC:</strong> {{paciente.nhc}}</p>
<p><strong>Diagnósticos:</strong> {{diagnosticos}}</p>
<p><strong>Medicamentos al alta:</strong> {{medicamentos}}</p>
<p><strong>Recomendaciones:</strong> {{recomendaciones}}</p>
<p><strong>Próxima cita:</strong> {{proxima_cita}}</p>',
true, true, true, true),

-- 2. INFORME URGENCIAS
('P002', 'Informe Urgencias', 'urgencias', 'medico',
'Documento de urgencias con evaluación rápida',
'<h2>INFORME DE URGENCIAS</h2>
<p><strong>Paciente:</strong> {{paciente.nombre}}</p>
<p><strong>Hora llegada:</strong> {{hora_llegada}}</p>
<p><strong>Motivo:</strong> {{motivo_consulta}}</p>
<p><strong>Diagnóstico:</strong> {{diagnostico}}</p>
<p><strong>Tratamiento:</strong> {{tratamiento}}</p>
<p><strong>Destino:</strong> {{destino}}</p>',
true, false, true, true),

-- 3. INFORME CONSULTA EXTERNA
('P003', 'Informe Consulta Externa', 'consulta', 'medico',
'Documento de consulta ambulatoria',
'<h2>INFORME CONSULTA EXTERNA</h2>
<p><strong>Especialidad:</strong> {{especialidad}}</p>
<p><strong>Diagnósticos:</strong> {{diagnosticos}}</p>
<p><strong>Plan:</strong> {{plan_manejo}}</p>
<p><strong>Medicamentos:</strong> {{medicamentos}}</p>',
true, true, true, true),

-- 4. INFORME QUIRÚRGICO
('P004', 'Informe Quirúrgico', 'quirurgico', 'medico',
'Reporte detallado de intervención quirúrgica',
'<h2>INFORME QUIRÚRGICO</h2>
<p><strong>Cirujano:</strong> {{cirujano}}</p>
<p><strong>Técnica:</strong> {{tecnica}}</p>
<p><strong>Hallazgos:</strong> {{hallazgos}}</p>
<p><strong>Complicaciones:</strong> {{complicaciones}}</p>',
true, true, true, true),

-- 5. RECETA MÉDICA
('P005', 'Receta Médica', 'receta', 'medico',
'Prescripción de medicamentos',
'<h2>RECETA MÉDICA</h2>
<p><strong>Médico:</strong> {{medico}}</p>
<p><strong>Medicamentos:</strong></p>
<ul>{{#each medicamentos}}<li>{{nombre}} {{dosis}} {{frecuencia}}</li>{{/each}}</ul>
<p><strong>Duración:</strong> {{duracion}}</p>',
true, false, true, true),

-- 6. PRUEBAS DE LABORATORIO
('P006', 'Pruebas de Laboratorio', 'laboratorio', 'medico',
'Resultados de análisis de laboratorio',
'<h2>RESULTADOS LABORATORIO</h2>
<p><strong>Fecha muestra:</strong> {{fecha_muestra}}</p>
<table border="1"><tr><th>Prueba</th><th>Resultado</th><th>Referencia</th></tr>
{{#each pruebas}}<tr><td>{{prueba}}</td><td>{{resultado}}</td><td>{{referencia}}</td></tr>{{/each}}
</table>',
true, false, false, true),

-- 7. CERTIFICADO MÉDICO
('P007', 'Certificado Médico', 'certificado', 'medico',
'Certificación de estado de salud o restricciones',
'<h2>CERTIFICADO MÉDICO</h2>
<p>Certifico que el Sr(a) {{paciente.nombre}}</p>
<p>Diagnóstico: {{diagnostico}}</p>
<p>Restricciones: {{restricciones}}</p>
<p>Válido hasta: {{fecha_vencimiento}}</p>',
true, false, true, true),

-- 8. CONSENTIMIENTO INFORMADO (Procedimiento Invasivo/Quirúrgico)
('P008', 'Consentimiento Informado', 'consentimiento', 'legal',
'Documento legal de consentimiento para procedimientos',
'<h2>CONSENTIMIENTO INFORMADO</h2>
<p>Yo {{paciente.nombre}} autorizo el procedimiento de {{procedimiento}}</p>
<p>Riesgos: {{riesgos}}</p>
<p>Beneficios: {{beneficios}}</p>
<p>Alternativas: {{alternativas}}</p>
<p>Firma: __________________ Fecha: {{fecha}}</p>',
true, true, true, true),

-- 9. REVOCACIÓN DE CONSENTIMIENTO
('P009', 'Revocación de Consentimiento', 'consentimiento', 'legal',
'Documento de revocación de consentimiento previo',
'<h2>REVOCACIÓN DE CONSENTIMIENTO</h2>
<p>Yo {{paciente.nombre}} revoco el consentimiento dado</p>
<p>Referencia: {{referencia_original}}</p>
<p>Motivo: {{motivo}}</p>
<p>Firma: __________________ Fecha: {{fecha}}</p>',
true, false, true, true),

-- 10. AUTORIZACIÓN CADÁVER Y PERTENENCIAS
('P010', 'Autorización Cadáver y Pertenencias', 'administrativo', 'legal',
'Documento de entrega de cadáver y objetos personales',
'<h2>AUTORIZACIÓN ENTREGA CADÁVER</h2>
<p>Se entrega cadáver de {{fallecido.nombre}}</p>
<p>A: {{familiar.nombre}}</p>
<p>Cédula: {{familiar.cedula}}</p>
<p>Funeraria: {{funeraria}}</p>
<p>Objetos: {{objetos}}</p>',
true, true, true, true),

-- 11. CONSENTIMIENTO INVESTIGACIÓN/ENSAYOS
('P011', 'Consentimiento Investigación', 'consentimiento', 'legal',
'Documento para participación en investigación médica',
'<h2>CONSENTIMIENTO PARA INVESTIGACIÓN</h2>
<p>Protocolo: {{protocolo}}</p>
<p>Investigador: {{investigador}}</p>
<p>Riesgos: {{riesgos}}</p>
<p>Protección de datos: GDPR Compliant</p>
<p>Derechos: Derecho a retirarse en cualquier momento</p>',
true, true, true, true),

-- 12. CUSTODIA DE OBJETOS DE VALOR
('P012', 'Custodia de Objetos de Valor', 'administrativo', 'medico',
'Inventario y custodia de pertenencias del paciente',
'<h2>INFORME CUSTODIA OBJETOS</h2>
<p>Paciente: {{paciente.nombre}}</p>
<p>Objetos:</p>
<ul>{{#each objetos}}<li>{{descripcion}} - Foto: {{foto_url}}</li>{{/each}}</ul>
<p>Custodio: {{custodio}}</p>
<p>Receptor al alta: {{receptor}}</p>',
true, false, false, true),

-- ============================================================================
-- GRUPO 2: PLANTILLAS ADMINISTRATIVAS Y FINANCIERAS (5)
-- ============================================================================

('P013', 'Presupuesto Clínico Estimado', 'administrativo', 'financiero',
'Desglose de costos estimados para procedimientos',
'<h2>PRESUPUESTO CLÍNICO</h2>
<table border="1">
<tr><th>Rubro</th><th>Cantidad</th><th>Valor Unit.</th><th>Total</th></tr>
{{#each rubros}}<tr><td>{{rubro}}</td><td>{{cantidad}}</td><td>{{valor}}</td><td>{{total}}</td></tr>{{/each}}
</table>
<p><strong>TOTAL: {{total_presupuesto}}</strong></p>
<p>Vigencia: {{vigencia_dias}} días</p>',
true, true, false, true),

('P014', 'Pagaré / Reconocimiento de Obligación', 'administrativo', 'financiero',
'Documento legal de compromiso de pago',
'<h2>PAGARÉ</h2>
<p>Deudor: {{deudor}}</p>
<p>Acreedor: {{acreedor}}</p>
<p>Monto: {{monto}} {{moneda}}</p>
<p>Plazo: {{plazo_dias}} días</p>
<p>Firma deudor: __________________ Fecha: {{fecha}}</p>',
true, true, true, true),

('P015', 'Hoja Cargo Quirúrgico (Pre-facturación)', 'administrativo', 'financiero',
'Listado detallado de materiales consumidos en cirugía',
'<h2>CARGO QUIRÚRGICO</h2>
<p>Cirugía: {{tipo_cirugia}}</p>
<table border="1">
<tr><th>Código</th><th>Descripción</th><th>Cantidad</th><th>Valor</th></tr>
{{#each materiales}}<tr><td>{{codigo}}</td><td>{{descripcion}}</td><td>{{cantidad}}</td><td>{{valor}}</td></tr>{{/each}}
</table>
<p><strong>Total cargos: {{total_cargos}}</strong></p>',
true, false, false, true),

('P016', 'Factura Detallada Hospitalaria', 'administrativo', 'financiero',
'Factura fiscal con desglose completo de servicios',
'<h2>FACTURA HOSPITALARIA</h2>
<p>Factura: {{numero_factura}}</p>
<p>Paciente: {{paciente.nombre}}</p>
<table border="1">
<tr><th>Descripción</th><th>Cantidad</th><th>Valor</th><th>Total</th></tr>
{{#each servicios}}<tr><td>{{descripcion}}</td><td>{{cantidad}}</td><td>{{valor}}</td><td>{{total}}</td></tr>{{/each}}
</table>
<p><strong>TOTAL + IVA: {{total_final}}</strong></p>',
true, true, false, true),

('P017', 'Informe Cobertura Aseguradora', 'administrativo', 'financiero',
'Verificación de cobertura y autorización de servicios',
'<h2>INFORME COBERTURA</h2>
<p>Aseguradora: {{aseguradora}}</p>
<p>Póliza: {{numero_poliza}}</p>
<p>Servicios Autorizados: {{servicios_autorizados}}</p>
<p>Copago: {{copago}}%</p>
<p>Excepciones: {{excepciones}}</p>',
true, false, false, true),

-- ============================================================================
-- GRUPO 3: CONTROL Y SEGURIDAD (5)
-- ============================================================================

('P018', 'Formulario Eventos Adversos', 'control', 'control',
'Registro anónimo de eventos adversos (Centinela)',
'<h2>REPORTE EVENTO ADVERSO</h2>
<p>Tipo evento: {{tipo_evento}}</p>
<p>Severidad: {{severidad}}</p>
<p>Descripción: {{descripcion}}</p>
<p>Factores causales: {{factores_causales}}</p>
<p>Medidas correctivas: {{medidas_correctivas}}</p>',
true, false, false, true),

('P019', 'Hoja Reclamaciones y Quejas', 'control', 'control',
'Gestión de quejas y sugerencias del usuario',
'<h2>FORMULARIO DE RECLAMACIÓN</h2>
<p>Tipo: {{tipo}}</p>
<p>Descripción: {{descripcion}}</p>
<p>Área afectada: {{area}}</p>
<p>Solicitante: {{solicitante}}</p>
<p>Teléfono: {{telefono}}</p>',
true, false, false, true),

('P020', 'Bitácora Control Stock Farmacia', 'control', 'control',
'Solicitudes de reposición y control de botiquines',
'<h2>CONTROL STOCK FARMACIA</h2>
<p>Responsable: {{responsable}}</p>
<p>Medicamentos disponibles:</p>
<table border="1">
<tr><th>Medicamento</th><th>Stock Actual</th><th>Stock Mínimo</th><th>Acción</th></tr>
{{#each medicamentos}}<tr><td>{{nombre}}</td><td>{{stock_actual}}</td><td>{{stock_minimo}}</td><td>{{accion}}</td></tr>{{/each}}
</table>',
true, false, false, true),

('P021', 'Ficha Mantenimiento Equipos Médicos', 'control', 'control',
'Registro de mantenimiento preventivo y correctivo',
'<h2>MANTENIMIENTO EQUIPO MÉDICO</h2>
<p>Equipo: {{equipo}}</p>
<p>Tipo: {{tipo_mantenimiento}}</p>
<p>Técnico: {{tecnico}}</p>
<p>Trabajo realizado: {{trabajo}}</p>
<p>Próximo mantenimiento: {{proxima_fecha}}</p>',
true, false, false, true),

('P022', 'Notificación EDO', 'control', 'control',
'Notificación de Enfermedades de Declaración Obligatoria',
'<h2>NOTIFICACIÓN EDO</h2>
<p>Enfermedad: {{enfermedad}}</p>
<p>Paciente: {{paciente.nombre}}</p>
<p>Contactos expuestos: {{contactos}}</p>
<p>Medidas aislamiento: {{medidas}}</p>
<p>Autoridad notificada: {{autoridad}}</p>',
true, false, false, true),

-- ============================================================================
-- GRUPO 4: BI Y AUDITORÍA (2)
-- ============================================================================

('P023', 'Informe Indicadores Gestión', 'bi', 'bi',
'Dashboard de indicadores clínicos y financieros',
'<h2>INFORME INDICADORES GESTIÓN</h2>
<p>Período: {{periodo}}</p>
<h3>Indicadores Clínicos</h3>
<p>Giro de camas: {{giro_camas}}</p>
<p>Estancia promedio: {{estancia_promedio}} días</p>
<p>Mortalidad: {{tasa_mortalidad}}%</p>
<h3>Indicadores Financieros</h3>
<p>Ingresos: {{ingresos_totales}}</p>
<p>Gastos: {{gastos_totales}}</p>',
true, true, false, true),

('P024', 'Checklist Auditoría Historia Clínica', 'bi', 'bi',
'Verificación de completitud y legalidad de HC',
'<h2>AUDITORÍA HISTORIA CLÍNICA</h2>
<p>Paciente: {{paciente.nombre}}</p>
<p>Auditor: {{auditor}}</p>
<p>Completitud: {{completitud}}%</p>
<p>Firmas presentes: {{firmas_presentes}}</p>
<p>Consentimientos: {{consentimientos}}</p>
<p>Codificación CIE-11: {{codificacion_presente}}</p>
<p>Observaciones: {{observaciones}}</p>',
true, false, false, true);

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT COUNT(*) as total_plantillas FROM configuracion.plantillas_documentos
WHERE codigo LIKE 'P%' AND codigo >= 'P001' AND codigo <= 'P024';

-- Listar todas las plantillas creadas
SELECT codigo, nombre, tipo, grupo FROM configuracion.plantillas_documentos
WHERE codigo LIKE 'P%' ORDER BY codigo;
