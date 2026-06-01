# 🏥 PROMPT MAESTRO AVANZADO — SISTEMA HIS HOSIX GUINEA ECUATORIAL
### Sistema Integral de Gestión Hospitalaria · React + Supabase PostgreSQL

---

## CONTEXTO DEL PROYECTO

Eres el arquitecto principal y desarrollador senior de **HOSIX**, un Sistema de Información Hospitalaria (HIS) completo para la **Red Nacional de Hospitales de Guinea Ecuatorial**. El sistema será desarrollado con **React (frontend)** y **Supabase (PostgreSQL backend)**, con arquitectura multi-hospital, multiusuario y multirrol.

El sistema debe implementar los **4 flujos clínicos documentados** (Consulta Externa, Emergencia, Hospitalización y Quirófanos/LEQ) y los **37 módulos funcionales** agrupados en cuatro categorías: Configuración/Parametrización, Administrativos, Asistenciales y Complementarios.

> Nota: El módulo de **Epidemiología (Semana 3)** se marca como **DESACTIVADO** en esta fase del plan. No se implementará ahora; lo retomaremos más adelante.

---

## STACK TECNOLÓGICO OBLIGATORIO

```
Frontend:       React 18+ con Vite
UI Components:  shadcn/ui + Tailwind CSS
State:          Zustand (global) + React Query (server state)
Forms:          React Hook Form + Zod (validación)
Routing:        React Router v6
Charts/BI:      Recharts + Tanstack Table
PDF:            React-PDF o jsPDF
Firma Digital:  Canvas API o PDF-Lib
Real-time:      Supabase Realtime (subscriptions)
Auth:           Supabase Auth (JWT + RLS)
Backend:        Supabase (PostgreSQL + PostgREST + Edge Functions)
Storage:        Supabase Storage (imágenes, documentos)
Teleconsulta:   Jitsi Meet SDK
Notificaciones: Supabase Realtime + Web Push API
```

---

## ARQUITECTURA DE BASE DE DATOS (PostgreSQL / Supabase)

### ESQUEMAS PRINCIPALES

```sql
-- Esquemas a crear en Supabase
CREATE SCHEMA configuracion;   -- Maestros, parámetros, seguridad
CREATE SCHEMA pacientes;       -- HC, MPI, datos demográficos
CREATE SCHEMA clinico;         -- Episodios, diagnósticos, evolución
CREATE SCHEMA administrativo;  -- Citas, hospitalizacion, urgencias
CREATE SCHEMA quirurgico;      -- LEQ, quirofanos, programaciones
CREATE SCHEMA farmacia;        -- Medicamentos, prescripciones, stock
CREATE SCHEMA logistica;       -- Almacenes, suministros, compras
CREATE SCHEMA facturacion;     -- Facturas, cobros, seguros, cajas
CREATE SCHEMA bi;              -- Vistas materializadas para BI/reportes
CREATE SCHEMA auditoria;       -- Logs de acceso, cambios críticos
```

### TABLAS MAESTRAS CRÍTICAS

```sql
-- =========================================================
-- ESQUEMA: configuracion
-- =========================================================

CREATE TABLE configuracion.hospitales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  tipo VARCHAR(50),          -- 'central', 'regional', 'distrito'
  provincia TEXT,
  ciudad TEXT,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE configuracion.departamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES configuracion.hospitales(id),
  codigo VARCHAR(20),
  nombre TEXT NOT NULL,
  tipo VARCHAR(50),           -- 'medico','quirurgico','administrativo','apoyo'
  piso INTEGER,
  ala TEXT,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE configuracion.servicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  departamento_id UUID REFERENCES configuracion.departamentos(id),
  codigo VARCHAR(20),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo_episodio VARCHAR(50)[] DEFAULT '{}',  -- ['consulta','urgencia','hospitalizacion']
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE configuracion.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  hospital_id UUID REFERENCES configuracion.hospitales(id),
  numero_colegiado VARCHAR(50),
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  tipo_documento VARCHAR(20),
  numero_documento VARCHAR(30) UNIQUE,
  email TEXT UNIQUE NOT NULL,
  telefono TEXT,
  categoria VARCHAR(50),      -- 'medico','enfermero','admin','farmaceutico','tecnico','directivo'
  especialidad TEXT,
  servicio_id UUID REFERENCES configuracion.servicios(id),
  activo BOOLEAN DEFAULT TRUE,
  ultimo_acceso TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE configuracion.perfiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  permisos JSONB NOT NULL DEFAULT '{}',  -- {modulo: {leer,crear,editar,eliminar,aprobar}}
  hospital_id UUID REFERENCES configuracion.hospitales(id)
);

CREATE TABLE configuracion.usuario_perfiles (
  usuario_id UUID REFERENCES configuracion.usuarios(id),
  perfil_id UUID REFERENCES configuracion.perfiles(id),
  PRIMARY KEY (usuario_id, perfil_id)
);

CREATE TABLE configuracion.camas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES configuracion.hospitales(id),
  servicio_id UUID REFERENCES configuracion.servicios(id),
  codigo VARCHAR(20) NOT NULL,
  tipo VARCHAR(30),           -- 'normal','uci','pediatria','maternidad','postoperatorio'
  genero VARCHAR(10),         -- 'masculino','femenino','mixto'
  estado VARCHAR(20) DEFAULT 'disponible',  -- 'disponible','ocupada','bloqueada','mantenimiento'
  piso INTEGER,
  habitacion TEXT,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE configuracion.cie10 (
  codigo VARCHAR(10) PRIMARY KEY,
  descripcion TEXT NOT NULL,
  categoria VARCHAR(5),
  subcategoria VARCHAR(5),
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE configuracion.procedimientos (
  codigo VARCHAR(20) PRIMARY KEY,
  descripcion TEXT NOT NULL,
  tipo VARCHAR(30),
  duracion_estimada_min INTEGER,
  requiere_quirofano BOOLEAN DEFAULT FALSE
);

-- =========================================================
-- ESQUEMA: pacientes
-- =========================================================

CREATE TABLE pacientes.pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nhc VARCHAR(20) UNIQUE NOT NULL,           -- Número Historia Clínica único
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  genero VARCHAR(10),
  tipo_documento VARCHAR(20),
  numero_documento VARCHAR(30),
  pais_nacimiento TEXT DEFAULT 'Guinea Ecuatorial',
  provincia TEXT,
  ciudad TEXT,
  direccion TEXT,
  telefono VARCHAR(20),
  telefono_emergencia VARCHAR(20),
  email TEXT,
  estado_civil VARCHAR(20),
  ocupacion TEXT,
  nivel_educacion TEXT,
  grupo_sanguineo VARCHAR(5),
  factor_rh VARCHAR(3),
  religion TEXT,
  etnia TEXT,
  idioma_principal TEXT DEFAULT 'Español',
  fallecido BOOLEAN DEFAULT FALSE,
  fecha_fallecimiento DATE,
  notas TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES configuracion.usuarios(id)
);

CREATE TABLE pacientes.contactos_emergencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES pacientes.pacientes(id),
  nombre TEXT NOT NULL,
  relacion TEXT,
  telefono TEXT,
  direccion TEXT
);

CREATE TABLE pacientes.antecedentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES pacientes.pacientes(id),
  tipo VARCHAR(30),           -- 'personal','familiar','quirurgico','alergico','habitos'
  descripcion TEXT NOT NULL,
  fecha DATE,
  activo BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES configuracion.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pacientes.alergias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES pacientes.pacientes(id),
  tipo VARCHAR(20),           -- 'medicamento','alimento','ambiental','otro'
  sustancia TEXT NOT NULL,
  reaccion TEXT,
  severidad VARCHAR(10),      -- 'leve','moderada','grave','fatal'
  verificada BOOLEAN DEFAULT FALSE,
  activa BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES configuracion.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pacientes.seguros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES pacientes.pacientes(id),
  compania_id UUID,            -- FK a facturacion.companias_seguro
  numero_poliza VARCHAR(50),
  tipo_poliza VARCHAR(30),
  fecha_vigencia_inicio DATE,
  fecha_vigencia_fin DATE,
  copago_porcentaje DECIMAL(5,2) DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE
);

-- =========================================================
-- ESQUEMA: clinico
-- =========================================================

CREATE TABLE clinico.episodios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_episodio VARCHAR(30) UNIQUE NOT NULL,
  paciente_id UUID REFERENCES pacientes.pacientes(id),
  hospital_id UUID REFERENCES configuracion.hospitales(id),
  tipo_episodio VARCHAR(30) NOT NULL,  -- 'consulta_externa','urgencia','hospitalizacion','cirugia'
  servicio_id UUID REFERENCES configuracion.servicios(id),
  medico_responsable_id UUID REFERENCES configuracion.usuarios(id),
  estado VARCHAR(20) DEFAULT 'abierto',  -- 'abierto','cerrado','transferido','alta'
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_cierre TIMESTAMPTZ,
  motivo_consulta TEXT,
  diagnostico_principal_cie10 VARCHAR(10),
  diagnosticos_secundarios VARCHAR(10)[],
  procedimientos_realizados VARCHAR(20)[],
  origen_episodio VARCHAR(30),   -- 'consulta','urgencia','programado','transferencia'
  destino_alta VARCHAR(30),      -- 'domicilio','hospitalizacion','referencia','exitus'
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES configuracion.usuarios(id)
);

CREATE TABLE clinico.signos_vitales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episodio_id UUID REFERENCES clinico.episodios(id),
  paciente_id UUID REFERENCES pacientes.pacientes(id),
  fecha_hora TIMESTAMPTZ DEFAULT NOW(),
  temperatura DECIMAL(4,1),
  presion_sistolica INTEGER,
  presion_diastolica INTEGER,
  frecuencia_cardiaca INTEGER,
  frecuencia_respiratoria INTEGER,
  saturacion_oxigeno DECIMAL(4,1),
  peso DECIMAL(5,2),
  talla DECIMAL(5,2),
  imc DECIMAL(4,2),
  glucemia DECIMAL(6,2),
  glasgow INTEGER,
  dolor_escala INTEGER CHECK (dolor_escala BETWEEN 0 AND 10),
  registrado_por UUID REFERENCES configuracion.usuarios(id)
);

CREATE TABLE clinico.notas_clinicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episodio_id UUID REFERENCES clinico.episodios(id),
  tipo VARCHAR(30),     -- 'evolucion','enfermeria','interconsulta','anestesia','quirurgica'
  contenido JSONB NOT NULL,     -- estructura flexible por tipo de nota
  borrador BOOLEAN DEFAULT TRUE,
  firmado BOOLEAN DEFAULT FALSE,
  firmado_por UUID REFERENCES configuracion.usuarios(id),
  firmado_en TIMESTAMPTZ,
  created_by UUID REFERENCES configuracion.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE clinico.solicitudes_examen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episodio_id UUID REFERENCES clinico.episodios(id),
  tipo VARCHAR(20),      -- 'laboratorio','imagen','otros'
  urgente BOOLEAN DEFAULT FALSE,
  estado VARCHAR(20) DEFAULT 'pendiente',  -- 'pendiente','proceso','completado','cancelado'
  medico_solicitante_id UUID REFERENCES configuracion.usuarios(id),
  fecha_solicitud TIMESTAMPTZ DEFAULT NOW(),
  fecha_resultado TIMESTAMPTZ,
  examenes_detalle JSONB,       -- [{codigo, descripcion, muestra}]
  resultados JSONB,             -- retorno del LIS/RIS
  archivo_resultado_url TEXT,
  observaciones TEXT
);

CREATE TABLE clinico.interconsultas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episodio_id UUID REFERENCES clinico.episodios(id),
  servicio_destino_id UUID REFERENCES configuracion.servicios(id),
  medico_solicitante_id UUID REFERENCES configuracion.usuarios(id),
  medico_respondedor_id UUID REFERENCES configuracion.usuarios(id),
  motivo TEXT NOT NULL,
  urgente BOOLEAN DEFAULT FALSE,
  estado VARCHAR(20) DEFAULT 'pendiente',  -- 'pendiente','aceptada','respondida','rechazada'
  respuesta TEXT,
  fecha_solicitud TIMESTAMPTZ DEFAULT NOW(),
  fecha_respuesta TIMESTAMPTZ
);

CREATE TABLE clinico.escalas_clinicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episodio_id UUID REFERENCES clinico.episodios(id),
  tipo_escala VARCHAR(50),   -- 'glasgow','barthel','braden','apgar','aldrete','norton','tinetti', etc.
  datos_entrada JSONB,       -- respuestas/valores por ítem
  resultado_numerico DECIMAL(6,2),
  resultado_texto TEXT,
  interpretacion TEXT,
  evaluado_por UUID REFERENCES configuracion.usuarios(id),
  fecha_evaluacion TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- ESQUEMA: administrativo
-- =========================================================

CREATE TABLE administrativo.agendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id UUID REFERENCES configuracion.servicios(id),
  medico_id UUID REFERENCES configuracion.usuarios(id),
  nombre TEXT NOT NULL,
  tipo VARCHAR(20),           -- 'consulta','teleconsulta','procedimiento'
  dias_semana INTEGER[],      -- [1,2,3,4,5] = Lun-Vie
  hora_inicio TIME,
  hora_fin TIME,
  duracion_cita_min INTEGER DEFAULT 15,
  max_citas_dia INTEGER,
  activa BOOLEAN DEFAULT TRUE
);

CREATE TABLE administrativo.citas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id UUID REFERENCES administrativo.agendas(id),
  paciente_id UUID REFERENCES pacientes.pacientes(id),
  medico_id UUID REFERENCES configuracion.usuarios(id),
  fecha_cita DATE NOT NULL,
  hora_cita TIME NOT NULL,
  tipo VARCHAR(20) DEFAULT 'presencial',  -- 'presencial','teleconsulta'
  estado VARCHAR(20) DEFAULT 'programada', -- 'programada','confirmada','en_curso','completada','cancelada','no_asistio'
  motivo TEXT,
  tipo_episodio_origen VARCHAR(30),
  episodio_origen_id UUID,
  es_urgente BOOLEAN DEFAULT FALSE,
  observaciones TEXT,
  created_by UUID REFERENCES configuracion.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE administrativo.lista_espera (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES pacientes.pacientes(id),
  tipo_lista VARCHAR(30),   -- 'hospitalizacion','consulta','diagnostico','cirugia_programada','cirugia_mayor_ambu','cirugia_menor_ambu'
  servicio_id UUID REFERENCES configuracion.servicios(id),
  medico_id UUID REFERENCES configuracion.usuarios(id),
  prioridad VARCHAR(10) DEFAULT 'normal',   -- 'urgente','alta','normal','baja'
  motivo_inclusion TEXT,
  diagnostico_cie10 VARCHAR(10),
  procedimiento_solicitado VARCHAR(20),
  fecha_inclusion TIMESTAMPTZ DEFAULT NOW(),
  fecha_resolucion TIMESTAMPTZ,
  motivo_salida TEXT,
  estado VARCHAR(20) DEFAULT 'activa',  -- 'activa','resuelta','cancelada','transferida'
  created_by UUID REFERENCES configuracion.usuarios(id)
);

CREATE TABLE administrativo.triage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episodio_id UUID REFERENCES clinico.episodios(id),
  nivel INTEGER CHECK (nivel BETWEEN 1 AND 5),   -- 1=Resucitación, 2=Emergencia, 3=Urgente, 4=Menos urgente, 5=No urgente
  color VARCHAR(15),         -- 'rojo','naranja','amarillo','verde','azul'
  motivo_consulta TEXT,
  via_entrada TEXT,
  box_asignado TEXT,
  zona_asignada TEXT,
  fecha_triage TIMESTAMPTZ DEFAULT NOW(),
  enfermera_triage_id UUID REFERENCES configuracion.usuarios(id),
  signos_vitales_id UUID REFERENCES clinico.signos_vitales(id)
);

CREATE TABLE administrativo.admisiones_hospitalizacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episodio_id UUID REFERENCES clinico.episodios(id),
  paciente_id UUID REFERENCES pacientes.pacientes(id),
  cama_id UUID REFERENCES configuracion.camas(id),
  tipo VARCHAR(20),          -- 'programada','urgente','transferencia'
  origen VARCHAR(30),        -- 'consulta','urgencia','cirugia','transferencia_externa'
  fecha_ingreso TIMESTAMPTZ DEFAULT NOW(),
  fecha_alta TIMESTAMPTZ,
  tipo_alta VARCHAR(30),     -- 'domicilio','traslado','exitus','fuga','voluntaria'
  medico_responsable_id UUID REFERENCES configuracion.usuarios(id),
  diagnostico_ingreso_cie10 VARCHAR(10),
  dias_estancia INTEGER GENERATED ALWAYS AS 
    (EXTRACT(DAY FROM fecha_alta - fecha_ingreso)::INTEGER) STORED,
  acompanante_nombre TEXT,
  acompanante_cama_id UUID REFERENCES configuracion.camas(id),
  prehospitalizacion_fecha DATE
);

CREATE TABLE administrativo.traslados_cama (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admision_id UUID REFERENCES administrativo.admisiones_hospitalizacion(id),
  cama_origen_id UUID REFERENCES configuracion.camas(id),
  cama_destino_id UUID REFERENCES configuracion.camas(id),
  servicio_origen_id UUID REFERENCES configuracion.servicios(id),
  servicio_destino_id UUID REFERENCES configuracion.servicios(id),
  motivo TEXT,
  fecha_traslado TIMESTAMPTZ DEFAULT NOW(),
  autorizado_por UUID REFERENCES configuracion.usuarios(id)
);

-- =========================================================
-- ESQUEMA: quirurgico
-- =========================================================

CREATE TABLE quirurgico.quirofanos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES configuracion.hospitales(id),
  codigo VARCHAR(20) NOT NULL,
  nombre TEXT NOT NULL,
  tipo VARCHAR(30),     -- 'general','trauma','obstetricia','cardiaca','oftalmologia','emergencia'
  capacidad INTEGER DEFAULT 1,
  estado VARCHAR(20) DEFAULT 'disponible',   -- 'disponible','ocupado','mantenimiento','bloqueado'
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE quirurgico.leq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES pacientes.pacientes(id),
  episodio_origen_id UUID REFERENCES clinico.episodios(id),
  servicio_id UUID REFERENCES configuracion.servicios(id),
  medico_solicitante_id UUID REFERENCES configuracion.usuarios(id),
  procedimiento_cie VARCHAR(20),
  descripcion_procedimiento TEXT,
  prioridad VARCHAR(10) DEFAULT 'programada',  -- 'urgente','preferente','normal','programada'
  tipo_cirugia VARCHAR(30),    -- 'programada','urgente','obstetricia','ambulatoria_mayor','ambulatoria_menor'
  diagnostico_cie10 VARCHAR(10),
  estado VARCHAR(20) DEFAULT 'activa',  -- 'activa','programada','ejecutada','cancelada','suspendida'
  fecha_inclusion TIMESTAMPTZ DEFAULT NOW(),
  fecha_programacion TIMESTAMPTZ,
  observaciones TEXT,
  examenes_preqx_completados BOOLEAN DEFAULT FALSE,
  evaluacion_anestesia BOOLEAN DEFAULT FALSE,
  apto_cirugia BOOLEAN
);

CREATE TABLE quirurgico.programaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leq_id UUID REFERENCES quirurgico.leq(id),
  quirofano_id UUID REFERENCES quirurgico.quirofanos(id),
  medico_cirujano_id UUID REFERENCES configuracion.usuarios(id),
  medico_anestesista_id UUID REFERENCES configuracion.usuarios(id),
  equipo_quirurgico JSONB,   -- [{usuario_id, rol: 'instrumentista','circulante','ayudante'}]
  fecha_programada DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  duracion_estimada_min INTEGER,
  tipo_anestesia VARCHAR(30),
  tipo_cirugia VARCHAR(30),
  procedimientos_programados JSONB,
  kits_quirurgicos JSONB,
  materiales_solicitados JSONB,
  estado VARCHAR(20) DEFAULT 'programada',  -- 'programada','en_curso','completada','cancelada','suspendida'
  motivo_cancelacion TEXT,
  created_by UUID REFERENCES configuracion.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quirurgico.ejecuciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programacion_id UUID REFERENCES quirurgico.programaciones(id),
  hora_entrada_paciente TIMESTAMPTZ,
  hora_inicio_cirugia TIMESTAMPTZ,
  hora_fin_cirugia TIMESTAMPTZ,
  hora_salida_paciente TIMESTAMPTZ,
  hallazgos TEXT,
  descripcion_tecnica TEXT,
  incidencias TEXT,
  materiales_utilizados JSONB,
  materiales_devueltos JSONB,
  diagnosticos_postop JSONB,
  destino_postop VARCHAR(30),  -- 'reanimacion','uci','hospitalizacion','domicilio'
  cama_postop_id UUID REFERENCES configuracion.camas(id),
  checklist_preop JSONB,
  checklist_postop JSONB,
  boletin_quirurgico_firmado BOOLEAN DEFAULT FALSE,
  boletin_url TEXT,
  registrado_por UUID REFERENCES configuracion.usuarios(id)
);

-- =========================================================
-- ESQUEMA: farmacia
-- =========================================================

CREATE TABLE farmacia.medicamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_nacional VARCHAR(20) UNIQUE,
  nombre_comercial TEXT NOT NULL,
  principio_activo TEXT,
  forma_farmaceutica VARCHAR(50),
  concentracion TEXT,
  via_administracion TEXT,
  familia VARCHAR(50),
  grupo_terapeutico TEXT,
  requiere_control BOOLEAN DEFAULT FALSE,   -- estupefacientes, psicotrópicos
  requiere_refrigeracion BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE farmacia.stock_almacen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicamento_id UUID REFERENCES farmacia.medicamentos(id),
  almacen_id UUID,          -- FK logistica.almacenes
  lote VARCHAR(50),
  fecha_caducidad DATE,
  cantidad_actual DECIMAL(10,2) DEFAULT 0,
  stock_minimo DECIMAL(10,2) DEFAULT 0,
  stock_maximo DECIMAL(10,2),
  precio_unitario DECIMAL(10,4),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE farmacia.prescripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episodio_id UUID REFERENCES clinico.episodios(id),
  medico_prescriptor_id UUID REFERENCES configuracion.usuarios(id),
  tipo VARCHAR(20),          -- 'receta','orden_medica','protocolo','nutricion_parenteral'
  estado VARCHAR(20) DEFAULT 'pendiente',  -- 'pendiente','validada','rechazada','dispensada','cancelada'
  fecha_prescripcion TIMESTAMPTZ DEFAULT NOW(),
  medicamentos JSONB NOT NULL,  -- [{medicamento_id, dosis, frecuencia, via, dias, cantidad}]
  observaciones TEXT,
  validada_por UUID REFERENCES configuracion.usuarios(id),
  fecha_validacion TIMESTAMPTZ,
  alerta_interaccion BOOLEAN DEFAULT FALSE,
  alerta_duplicidad BOOLEAN DEFAULT FALSE
);

CREATE TABLE farmacia.dispensaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescripcion_id UUID REFERENCES farmacia.prescripciones(id),
  episodio_id UUID REFERENCES clinico.episodios(id),
  tipo VARCHAR(20),   -- 'receta','tratamiento_interno','citotoxico'
  medicamentos_dispensados JSONB,
  dispensado_por UUID REFERENCES configuracion.usuarios(id),
  enfermera_id UUID REFERENCES configuracion.usuarios(id),
  fecha_dispensacion TIMESTAMPTZ DEFAULT NOW(),
  confirmada BOOLEAN DEFAULT FALSE,
  confirmada_por UUID REFERENCES configuracion.usuarios(id),
  confirmada_en TIMESTAMPTZ
);

-- =========================================================
-- ESQUEMA: facturacion
-- =========================================================

CREATE TABLE facturacion.companias_seguro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) UNIQUE,
  nombre TEXT NOT NULL,
  tipo VARCHAR(20),    -- 'publica','privada','mutua','convenio'
  contacto TEXT,
  email TEXT,
  telefono TEXT,
  activa BOOLEAN DEFAULT TRUE
);

CREATE TABLE facturacion.tarifas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compania_id UUID REFERENCES facturacion.companias_seguro(id),
  concepto_codigo VARCHAR(30),
  concepto_descripcion TEXT,
  tipo_concepto VARCHAR(30),   -- 'consulta','estancia','laboratorio','imagen','medicamento','cirugia'
  precio DECIMAL(12,2) NOT NULL,
  moneda VARCHAR(3) DEFAULT 'XAF',
  vigencia_desde DATE,
  vigencia_hasta DATE,
  activa BOOLEAN DEFAULT TRUE
);

CREATE TABLE facturacion.facturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_factura VARCHAR(30) UNIQUE NOT NULL,
  episodio_id UUID REFERENCES clinico.episodios(id),
  paciente_id UUID REFERENCES pacientes.pacientes(id),
  compania_seguro_id UUID REFERENCES facturacion.companias_seguro(id),
  tipo VARCHAR(20),     -- 'paciente','seguro','mixta'
  estado VARCHAR(20) DEFAULT 'borrador',  -- 'borrador','emitida','parcial','pagada','anulada'
  fecha_emision TIMESTAMPTZ DEFAULT NOW(),
  fecha_vencimiento DATE,
  subtotal DECIMAL(12,2),
  descuento DECIMAL(12,2) DEFAULT 0,
  impuestos DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2),
  monto_seguro DECIMAL(12,2) DEFAULT 0,
  monto_paciente DECIMAL(12,2),
  conceptos JSONB,           -- [{codigo, descripcion, cantidad, precio_unitario, total}]
  notas TEXT,
  created_by UUID REFERENCES configuracion.usuarios(id)
);

CREATE TABLE facturacion.cobros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id UUID REFERENCES facturacion.facturas(id),
  caja_id UUID,
  cajero_id UUID REFERENCES configuracion.usuarios(id),
  monto DECIMAL(12,2) NOT NULL,
  forma_pago VARCHAR(20),    -- 'efectivo','tarjeta','transferencia','cheque','seguro'
  referencia_pago TEXT,
  fecha_cobro TIMESTAMPTZ DEFAULT NOW(),
  anulado BOOLEAN DEFAULT FALSE,
  motivo_anulacion TEXT
);

-- =========================================================
-- ESQUEMA: logistica
-- =========================================================

CREATE TABLE logistica.almacenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES configuracion.hospitales(id),
  codigo VARCHAR(20),
  nombre TEXT NOT NULL,
  tipo VARCHAR(20),    -- 'central','farmacia','quirofano','servicio'
  responsable_id UUID REFERENCES configuracion.usuarios(id),
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE logistica.articulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_interno VARCHAR(30) UNIQUE,
  ean13 VARCHAR(13),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  familia VARCHAR(50),
  clase VARCHAR(50),
  categoria VARCHAR(50),
  unidad_medida TEXT,
  es_medicamento BOOLEAN DEFAULT FALSE,
  medicamento_id UUID REFERENCES farmacia.medicamentos(id),
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE logistica.stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  articulo_id UUID REFERENCES logistica.articulos(id),
  almacen_id UUID REFERENCES logistica.almacenes(id),
  lote VARCHAR(50),
  fecha_caducidad DATE,
  cantidad_actual DECIMAL(12,3) DEFAULT 0,
  stock_minimo DECIMAL(12,3) DEFAULT 0,
  stock_maximo DECIMAL(12,3),
  stock_critico DECIMAL(12,3),
  precio_medio DECIMAL(12,4),
  ultima_entrada TIMESTAMPTZ,
  ultima_salida TIMESTAMPTZ,
  UNIQUE (articulo_id, almacen_id, lote)
);

CREATE TABLE logistica.movimientos_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  articulo_id UUID REFERENCES logistica.articulos(id),
  almacen_origen_id UUID REFERENCES logistica.almacenes(id),
  almacen_destino_id UUID REFERENCES logistica.almacenes(id),
  tipo_movimiento VARCHAR(20),  -- 'entrada','salida','traslado','ajuste','devolucion','caducidad'
  cantidad DECIMAL(12,3) NOT NULL,
  lote VARCHAR(50),
  fecha_caducidad DATE,
  precio_unitario DECIMAL(12,4),
  motivo TEXT,
  referencia_documento UUID,   -- FK a pedido, prescripcion, etc.
  tipo_referencia VARCHAR(30),
  realizado_por UUID REFERENCES configuracion.usuarios(id),
  fecha TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- ESQUEMA: auditoria
-- =========================================================

CREATE TABLE auditoria.log_accesos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES configuracion.usuarios(id),
  accion VARCHAR(20),         -- 'login','logout','acceso_hc','modificacion'
  entidad VARCHAR(50),
  entidad_id UUID,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================================

-- Activar RLS en todas las tablas críticas
ALTER TABLE pacientes.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinico.episodios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinico.notas_clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturacion.facturas ENABLE ROW LEVEL SECURITY;

-- Política: cada hospital solo ve sus datos
CREATE POLICY hospital_isolation ON clinico.episodios
  USING (hospital_id = (
    SELECT hospital_id FROM configuracion.usuarios 
    WHERE id = auth.uid()
  ));

-- Política: notas clínicas solo visibles por el autor hasta firma
CREATE POLICY nota_clinica_autor ON clinico.notas_clinicas
  USING (
    firmado = TRUE OR 
    created_by = auth.uid()
  );

-- =========================================================
-- FUNCIONES Y TRIGGERS IMPORTANTES
-- =========================================================

-- Función: generar NHC único por hospital
CREATE OR REPLACE FUNCTION generar_nhc(hospital_codigo TEXT)
RETURNS TEXT AS $$
DECLARE
  secuencia INTEGER;
  nhc TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(RIGHT(nhc, 7) AS INTEGER)), 0) + 1
  INTO secuencia
  FROM pacientes.pacientes
  WHERE nhc LIKE hospital_codigo || '%';
  
  nhc := hospital_codigo || TO_CHAR(secuencia, 'FM0000000');
  RETURN nhc;
END;
$$ LANGUAGE plpgsql;

-- Trigger: actualizar estado de cama automáticamente
CREATE OR REPLACE FUNCTION actualizar_estado_cama()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE configuracion.camas SET estado = 'ocupada' 
    WHERE id = NEW.cama_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.fecha_alta IS NOT NULL AND OLD.fecha_alta IS NULL THEN
    UPDATE configuracion.camas SET estado = 'disponible' 
    WHERE id = OLD.cama_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_estado_cama
  AFTER INSERT OR UPDATE ON administrativo.admisiones_hospitalizacion
  FOR EACH ROW EXECUTE FUNCTION actualizar_estado_cama();

-- Función: detectar duplicidad de paciente
CREATE OR REPLACE FUNCTION detectar_paciente_duplicado(
  p_nombres TEXT, p_apellidos TEXT, p_fecha_nac DATE, p_num_doc TEXT
)
RETURNS TABLE(paciente_id UUID, similitud DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT id, 
    (SIMILARITY(nombres, p_nombres) + SIMILARITY(apellidos, p_apellidos)) / 2 AS sim
  FROM pacientes.pacientes
  WHERE 
    fecha_nacimiento = p_fecha_nac OR
    numero_documento = p_num_doc OR
    (SIMILARITY(nombres, p_nombres) > 0.7 AND SIMILARITY(apellidos, p_apellidos) > 0.7)
  ORDER BY sim DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;
```

---

## ARQUITECTURA FRONTEND REACT

### ESTRUCTURA DE CARPETAS

```
src/
├── app/                          # Configuración app-level
│   ├── router.tsx                # React Router v6 con lazy loading
│   ├── queryClient.ts            # React Query config
│   └── supabase.ts               # Cliente Supabase
│
├── modules/                      # Módulos funcionales
│   ├── auth/                     # Login, perfiles, seguridad
│   ├── pacientes/                # HC, registro, búsqueda, duplicados
│   ├── consulta-externa/         # Agendas, citas, atención ambulatoria
│   ├── urgencias/                # Triage, atención, alta
│   ├── hospitalizacion/          # Admisión, camas, traslados, alta
│   ├── quirofanos/               # LEQ, programación, ejecución
│   ├── medico/                   # Worklist, evolución, prescripción
│   ├── enfermeria/               # Worklist, kardex, notas, constantes
│   ├── farmacia/                 # Dispensación, stock, prescripciones
│   ├── laboratorio/              # Solicitudes, resultados (integración LIS)
│   ├── imagen/                   # RIS/PACS integración
│   ├── facturacion/              # Facturas, cobros, seguros, cajas
│   ├── logistica/                # Almacenes, stock, compras
│   ├── obstetricia/              # Embarazo, partograma, recién nacidos
│   ├── teleconsulta/             # Video consulta (Jitsi)
│   ├── bi/                       # Dashboard BI, reportes, estadísticas
│   └── configuracion/            # Admin sistema, maestros, parámetros
│
├── shared/                       # Componentes y utilidades compartidas
│   ├── components/
│   │   ├── ui/                   # shadcn/ui customizado
│   │   ├── layout/               # Shell, sidebar, header, breadcrumb
│   │   ├── patient/              # PatientCard, PatientSearch, PatientBanner
│   │   ├── forms/                # FormBuilder, DatePicker, Autocomplete
│   │   ├── tables/               # DataTable con Tanstack Table
│   │   ├── charts/               # ChartWrapper, KPICard, TrendLine
│   │   ├── medical/              # VitalSigns, DiagnosisSelector, DrugSearch
│   │   ├── pdf/                  # PDFViewer, PDFExporter
│   │   └── notifications/        # Toast, Badge, AlertBanner
│   │
│   ├── hooks/
│   │   ├── usePatient.ts
│   │   ├── useEpisode.ts
│   │   ├── useRealtime.ts        # Supabase Realtime subscriptions
│   │   ├── useBedStatus.ts
│   │   ├── usePermissions.ts
│   │   └── useSupabase.ts
│   │
│   ├── stores/
│   │   ├── authStore.ts          # Usuario, hospital, sesión activa
│   │   ├── patientStore.ts       # Paciente activo en sesión
│   │   └── notificationStore.ts
│   │
│   ├── lib/
│   │   ├── supabase/             # Queries, mutations por módulo
│   │   ├── validators/           # Zod schemas
│   │   ├── formatters/           # Fechas, NHC, moneda XAF
│   │   └── constants/            -- CIE10, tipos episodio, escalas
│   │
│   └── types/
│       ├── patient.types.ts
│       ├── episode.types.ts
│       ├── pharmacy.types.ts
│       └── ...
│
└── assets/                       # Logos, iconos GE, fuentes
```

### COMPONENTES CRÍTICOS A IMPLEMENTAR

#### 1. Shell Principal con Módulos

```tsx
// src/shared/components/layout/AppShell.tsx
// - Sidebar colapsable con navegación por módulo/rol
// - Header con: hospital activo, usuario, notificaciones en tiempo real
// - PatientBanner: se muestra cuando hay paciente activo en contexto
// - Breadcrumb contextual
// - Quick-search global (paciente por NHC o nombre)
```

#### 2. Worklist Médico/Enfermería

```tsx
// src/modules/medico/components/WorkList.tsx
// Requisitos:
// - Lista de pacientes por tipo de episodio con badges de estado
// - Indicadores visuales: alertas de alergias, pendientes de exámenes, 
//   prescripciones sin confirmar, constantes fuera de rango
// - Filtros por servicio, estado, fecha
// - Acceso directo al episodio con un click
// - Actualización en tiempo real con Supabase Realtime
```

#### 3. Historia Clínica Electrónica (HCE)

```tsx
// src/modules/pacientes/components/HistoriaClinica.tsx
// Vista timeline del paciente:
// - Episodios ordenados cronológicamente
// - Antecedentes, alergias (banner de alerta permanente)
// - Vacunas, medicación activa
// - Últimas constantes vitales con trend charts
// - Accesos rápidos a: laboratorios, imágenes, informes
// - Escalas clínicas realizadas
// - Panel de diagnósticos activos CIE-10
```

#### 4. Triage con Color Coding

```tsx
// src/modules/urgencias/components/TriageBoard.tsx
// - Panel de urgencias en tiempo real (Supabase Realtime)
// - Pacientes agrupados por nivel de triage (1-5 con colores)
// - Tiempo de espera en cada nivel
// - Contador de boxes disponibles/ocupados
// - Alerta si paciente nivel 1-2 lleva más de X minutos sin atender
// - Vista de mapa de boxes/zonas
```

#### 5. Gestión de Camas (Mapa Visual)

```tsx
// src/modules/hospitalizacion/components/BedMap.tsx
// - Visualización SVG/Canvas de camas por piso/servicio
// - Color coding: verde=libre, rojo=ocupada, amarillo=reservada, gris=mantenimiento
// - Click en cama para ver detalles del paciente
// - Filtros por servicio, tipo de cama, estado
// - Realtime updates con Supabase
// - Estadísticas: ocupación %, camas disponibles por servicio
```

#### 6. Prescripción Electrónica

```tsx
// src/modules/medico/components/PrescripcionElectronica.tsx
// - Búsqueda de medicamento por nombre comercial o principio activo
// - Validación: dosis máxima, contraindicaciones, alergias del paciente
// - Alerta automática de duplicidad o interacciones
// - Generación de Kardex de enfermería automático
// - Protocolos predefinidos de medicación
// - Vista Kardex horario para enfermería (administrar/confirmar)
```

#### 7. Módulo de Quirófanos

```tsx
// src/modules/quirofanos/components/QuirofanoScheduler.tsx
// - Calendario semanal/diario de quirófanos
// - Drag & drop de programaciones
// - Estado en tiempo real de cada quirófano
// - Lista de espera quirúrgica (LEQ) con semáforo de prioridades
// - CheckList pre/post operatorio digital
// - Registro de ejecución quirúrgica con materiales utilizados
// - Generación automática del Boletín Quirúrgico PDF
```

#### 8. Dashboard BI

```tsx
// src/modules/bi/components/Dashboard.tsx
// KPIs en tiempo real:
// - Ocupación hospitalaria (%)
// - Presión de urgencias hacia hospitalización
// - Tiempo medio de espera en urgencias
// - Camas disponibles por servicio
// - Intervenciones quirúrgicas del día
// - Prescripciones pendientes de validar farmacia
// 
// Reportes parametrizados:
// - Todos los reportes del sheet "BI-Cuadro Informes"
// - Exportable a PDF y Excel
// - Filtros: hospital, servicio, rango fechas, aseguradora
```

---

## FLUJOS DE NEGOCIO A IMPLEMENTAR

### FLUJO 1: CONSULTA EXTERNA
```
1. Paciente llega → Obtiene ticket (quiosco o ventanilla)
2. Admisión: ¿Tiene HC? 
   - NO: Registro + creación HC + NHC único
   - SÍ: Identificación por documento/NHC
3. ¿Requiere cita? 
   - NO: Genera cita para hoy (según disponibilidad agenda)
   - SÍ: Confirma cita existente
4. Llamado a consultorio → Inicio episodio consulta
5. Médico: Evolución, diagnóstico, solicitudes (Lab/RX), prescripción
6. Alta médica: domicilio / hospitalización / referencia
7. Si receta → Farmacia: validación, dispensación, descuento stock
8. Cierre administrativo → Facturación automática
```

### FLUJO 2: EMERGENCIA
```
1. Llegada paciente → Identificación (HC existente o creación)
2. Triage → Clasificación nivel 1-5 → Asignación box/zona
3. Si nivel 1 (Trauma Shock): atención inmediata
4. Atención enfermería: constantes vitales, diario clínico
5. Atención médica: evaluación, solicitudes, interconsultas, prescripción
6. Manejo farmacéutico dual:
   - Tratamiento interno (OM 24h) → Enfermería
   - Receta de alta → Farmacia ventanilla
7. Alta médica → tipos de destino
8. Alta administrativa → Libera box → Facturación automática
```

### FLUJO 3: HOSPITALIZACIÓN
```
1. Origen: Urgencias / Programada desde consulta
2. Admisión: Datos ingreso, asignación cama (sistema de mapa de camas)
3. Instalación: pulsera identificativa, registro constantes iniciales
4. Ciclo diario de hospitalización:
   - Visita médica → Evolución, órdenes, solicitudes
   - Enfermería → Kardex, administración medicamentos, procedimientos
   - Farmacia → Validación prescripciones, dispensación nominativa
5. Posibles traslados de cama/servicio
6. Alta médica → Informe de alta automático
7. Alta administrativa → Libera cama → Facturación global automática
```

### FLUJO 4: QUIRÓFANOS Y LEQ
```
1. Médico ingresa paciente en LEQ desde cualquier episodio
2. Admisión gestiona: citas pre-QX (Lab, RX, EKG, Anestesia)
3. Evaluación anestesiológica → APTO / NO APTO
4. Programación quirúrgica: quirófano, fecha, hora, equipo, kits
5. Farmacia: preparación materiales quirúrgicos
6. Día de cirugía:
   - Enfermería: CheckList pre-op
   - Médico: CheckList pre-op
   - Registro entrada paciente → Inicio ejecución
7. Ejecución:
   - Registro hallazgos, actuación, materiales utilizados
   - Devolución materiales no usados → actualización stock
8. Fin cirugía → Boletín quirúrgico firmado
9. Destino post-op: reanimación/UCI/hospitalización
```

---

## INTEGRACIONES EXTERNAS

### LIS (Laboratory Information System)
```typescript
// Protocolo HL7 v2 o FHIR R4
// - Envío de solicitudes de laboratorio desde HIS
// - Recepción de resultados en formato estructurado
// - Notificación push a médico solicitante (Supabase Realtime)
// - Valores críticos con alerta inmediata

interface LISResult {
  solicitud_id: string;
  paciente_nhc: string;
  examenes: Array<{
    codigo: string;
    descripcion: string;
    valor: string | number;
    unidad: string;
    rango_normal: { min: number; max: number };
    flag: 'N' | 'H' | 'L' | 'C'; // Normal/Alto/Bajo/Crítico
  }>;
  validado_por: string;
  fecha_resultado: string;
}
```

### RIS/PACS (Radiology)
```typescript
// Integración DICOM / HL7
// - Solicitudes de imágenes enviadas desde HIS
// - Resultados/informes radiológicos recibidos
// - Visor DICOM embebido (OHIF o Cornerstone.js)
```

### Jitsi Meet (Teleconsulta)
```typescript
// Integración Jitsi SDK
// - Sala única por cita de teleconsulta
// - Token JWT para autenticación segura
// - Acceso paciente por URL única enviada por email/SMS
// - Grabación opcional (con consentimiento)
// - Chat integrado y compartir documentos

const JitsiTeleconsulta = ({ citaId, role }: Props) => {
  const roomName = `HOSIX_${citaId}`;
  const jwt = generateJitsiJWT({ room: roomName, user, role });
  return <JitsiMeeting roomName={roomName} jwt={jwt} />;
};
```

---

## SEGURIDAD Y CUMPLIMIENTO

### Row Level Security (RLS) en Supabase
```sql
-- Política multi-hospital: usuarios solo ven datos de su hospital
-- Política de notas clínicas: solo visibles al autor hasta firma
-- Política de facturas: solo personal autorizado (facturación/admin)
-- Política de auditoria: solo lectura para auditores
-- Política farmacia: dispensación solo por farmacéuticos autorizados
```

### Autenticación y Autorización
```typescript
// Permisos granulares por módulo y acción:
type Permiso = {
  modulo: string;
  acciones: ('leer' | 'crear' | 'editar' | 'eliminar' | 'aprobar' | 'firmar')[];
};

// Ejemplos de perfiles:
const PERFILES = {
  MEDICO: {
    clinico: ['leer', 'crear', 'editar', 'firmar'],
    farmacia_prescripcion: ['crear'],
    laboratorio: ['crear'],
    imagen: ['crear'],
    facturacion: ['leer'],
  },
  ENFERMERIA: {
    clinico: ['leer', 'crear', 'editar'],
    farmacia_kardex: ['leer', 'editar'],  // confirmar administración
    signos_vitales: ['crear', 'editar'],
  },
  FARMACEUTICO: {
    prescripciones: ['leer', 'aprobar', 'editar'],
    stock_farmacia: ['leer', 'crear', 'editar'],
    dispensacion: ['crear'],
  },
  ADMINISTRADOR_SISTEMA: {
    configuracion: ['leer', 'crear', 'editar', 'eliminar'],
    usuarios: ['leer', 'crear', 'editar', 'eliminar'],
    maestros: ['leer', 'crear', 'editar'],
  },
};
```

### Firma Digital
```typescript
// Implementar firma digital para:
// - Notas clínicas de evolución
// - Informes médicos
// - Prescripciones electrónicas
// - Boletín quirúrgico
// - Informe de alta

// Mecanismo: 
// 1. Usuario ingresa PIN/contraseña secundaria al firmar
// 2. Se genera hash SHA-256 del documento + timestamp + usuario
// 3. Se almacena: firmado=true, firmado_por, firmado_en, hash_firma
// 4. Documento bloqueado para edición (solo adendas)
```

---

## CARACTERÍSTICAS ESPECÍFICAS GUINEA ECUATORIAL

### Localización
```typescript
const GE_CONFIG = {
  moneda: 'XAF',               // Franco CFA de África Central
  idiomas: ['es', 'fr', 'pt'], // Español (oficial), Francés, Portugués
  zonaHoraria: 'Africa/Malabo',
  pais: 'GQ',
  hospitales_red: [            // Red hospitalaria nacional
    { codigo: 'HGM', nombre: 'Hospital General de Malabo' },
    { codigo: 'HRB', nombre: 'Hospital Regional de Bata' },
    // ... hospitales distritales
  ],
  // Provincias de Guinea Ecuatorial
  provincias: [
    'Bioko Norte', 'Bioko Sur', 'Centro Sur', 
    'Kie-Ntem', 'Litoral', 'Wele-Nzas', 'Djibloho'
  ],
  grupos_etnicos: ['Fang', 'Bubi', 'Ndowe', 'Bisio', 'Annobon', 'Bujeba'],
  // Calendario de festivos GE para gestión de agendas
  dias_festivos_nacionales: ['01-01', '05-01', '06-06', '12-10', '08-12', '25-12'],
};
```

### Multi-hospital Centralizado (MPI)
```typescript
// Master Patient Index: un paciente registrado en un hospital
// puede ser identificado en cualquier hospital de la red
// Sincronización asíncrona de datos demográficos entre hospitales
// Historia clínica centralizada visible desde cualquier centro
```

---

## MÓDULOS ASISTENCIALES ESPECIALES

### Obstetricia y Partograma
```typescript
interface Partograma {
  episodio_id: string;
  datos_maternos: {
    nombre_paciente: string;
    edad_gestacional: number;
    paridad: string;  // G_P_A (Gestas_Partos_Abortos)
    membranas: 'integras' | 'rotas';
  };
  registros: Array<{
    timestamp: string;
    // Parámetros OMS del partograma
    dilatacion_cervical: number;      // 0-10 cm
    descenso_cefalico: number;        // -5 a +5 estaciones
    contracciones_10min: number;
    frecuencia_cardiaca_fetal: number;
    frecuencia_cardiaca_materna: number;
    presion_arterial_sistolica: number;
    presion_arterial_diastolica: number;
    temperatura: number;
    liquido_amniotico: 'claro' | 'meconial' | 'sanguinolento';
    oxitocina_ml_h: number;
    medicamentos_administrados: string[];
  }>;
  // Líneas de alerta y acción según normas OMS
  linea_alerta: Array<{ hora: number; dilatacion: number }>;
  linea_accion: Array<{ hora: number; dilatacion: number }>;
}
```

### CRED (Crecimiento y Desarrollo)
```typescript
// Curvas OMS integradas para:
// - Peso/Edad, Talla/Edad, Peso/Talla, IMC/Edad
// - Puntaje Z-score automático
// - Gráficas interactivas con Recharts
// - Cuestionarios psicomotores por rango de edad
// - Alertas automáticas de desnutrición o retraso del desarrollo
```

### Escalas Clínicas (todas implementadas)
```typescript
// Implementar las 40+ escalas del Excel como componentes React:
// Glasgow, Barthel, Braden, Norton, Apgar, Aldrete,
// Tinetti, Lawton, Katz, MMSE, GDS, Zarit, MNA,
// CURB-65, FINE/PSI, Wells-TVP, Wells-TEP, 
// MEWS, NIHSS, CHADS2, CHA2DS2-VASc, etc.
// Cada escala: formulario interactivo + cálculo automático + interpretación
```

---

## MÓDULO BI Y REPORTERÍA

### KPIs Principales (Dashboard en tiempo real)
```typescript
// Todos los reportes definidos en el sheet "BI-Cuadro Informes":
const BI_REPORTES = {
  portada: ['TotalIngresos', 'TotalUrgencias', 'PresionUrgencias', 
            'ConsultasExternas', 'TotalEjecuciones'],
  actividad_global: ['TotalActividadGlobal', 'NumPacientes', 'PorcentajeTipoEpisodio'],
  citas: ['TotalCitas', 'ConsultasPorProcedencia', 'ListaEspera', 'ConsultasPorAseguradora'],
  estancias: ['NumEstancias', 'EstanciaMedia', 'TasaDeOcupacion', 'TasaRotacion'],
  facturacion: ['TotalFacturadoCia', 'FacturacionPorCentroCoste'],
  laboratorio: ['TotalPeticiones', 'NumGermenesDetectados', 'SensibilidadAntibioticos'],
  quirofanos: ['TotalEjecuciones', 'EjecProgUrg', 'IntervenTipo', 'IntervenCancel',
               'AsignacionQuirofanos', 'UtilizacionQuirofanos', 'RendimientoQuir'],
  urgencias: ['TotalUrgencias', 'UrgenciasPorTipo', 'UrgenciasPorTurno', 'SalidasUrgencias'],
  partos: ['TotalPartos', 'PartosPorTipo', 'MortalidadFetal', 'MortalidadMaternal'],
  consumo: ['TotalConsumos', 'ConsumosPorArticulo'],
  prescripcion: ['TotalPrescripcion', 'PrescripDispen', 'ArtDispensados'],
};

// Vistas materializadas en PostgreSQL para rendimiento
// Actualización programada con pg_cron cada 15 minutos
// Exportación PDF y Excel desde cualquier reporte
```

---

## REGLAS DE DESARROLLO

### Convenciones de Código
```
1. TypeScript strict mode en todo el proyecto
2. Componentes funcionales React con hooks
3. React Query para todo acceso a datos (NO useEffect + fetch directo)
4. Zod para validación de formularios y datos de API
5. Supabase RPC para operaciones complejas (no llamadas directas múltiples)
6. Nomeclatura: PascalCase componentes, camelCase hooks/utils, kebab-case archivos
7. Cada módulo tiene su propio directorio con: components/, hooks/, services/, types/
8. Tests unitarios con Vitest para lógica de negocio crítica
9. Comentarios en español (equipo hispanohablante)
10. Accesibilidad WCAG 2.1 AA mínimo
```

### Performance
```
1. Code splitting por módulo (React.lazy + Suspense)
2. Vistas materializadas PostgreSQL para reportes BI
3. Paginación server-side con Tanstack Table
4. Optimistic updates con React Query para UX fluida
5. Imágenes médicas: lazy load + WebP cuando sea posible
6. Service Worker para assets estáticos (no datos médicos)
7. Connection pooling con Supabase (transacciones largas via Edge Functions)
```

### Patrones de Error y Offline
```
1. Modo degradado: operaciones críticas funcionan sin conexión (IndexedDB temporal)
2. Cola de sincronización cuando vuelve la conexión
3. Error boundaries por módulo (no colapso total de la app)
4. Retry automático en solicitudes fallidas (React Query)
5. Toast de notificación para errores y éxitos
6. Log de errores en tabla auditoria.errores_sistema
```

---

## COMANDOS DE INICIO DEL PROYECTO

```bash
# 1. Crear proyecto
npm create vite@latest hosix-frontend -- --template react-ts

# 2. Instalar dependencias principales
npm install @supabase/supabase-js @tanstack/react-query @tanstack/react-table
npm install zustand react-hook-form zod @hookform/resolvers
npm install react-router-dom recharts lucide-react
npm install react-pdf jspdf @jitsi/react-sdk
npm install date-fns clsx tailwind-merge

# 3. Instalar shadcn/ui
npx shadcn-ui@latest init

# 4. Configurar Supabase
# - Crear proyecto en supabase.com
# - Ejecutar migrations SQL del esquema arriba
# - Configurar RLS policies
# - Habilitar Realtime para tablas críticas
# - Configurar Storage buckets (documentos, imágenes)

# 5. Variables de entorno
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_JITSI_SERVER=https://meet.jit.si
VITE_HOSPITAL_CODIGO=HGM
```

---

## ENTREGABLES ESPERADOS POR FASE

### Fase 1 (Core — 3 meses)
- [ ] Autenticación y gestión de usuarios/perfiles/permisos
- [ ] Registro y gestión de pacientes (HC, MPI básico)
- [ ] Módulo de Admisión y Citas básico
- [ ] Módulo de Urgencias con Triage
- [ ] Historia Clínica Electrónica básica
- [ ] Prescripción electrónica básica
- [ ] Módulo de Hospitalización con gestión de camas

### Fase 2 (Clínico — 2 meses)
- [ ] Worklist médico y de enfermería completo
- [ ] Integración LIS (laboratorio)
- [ ] Todas las 40+ escalas clínicas
- [ ] Módulo de Quirófanos completo con LEQ
- [ ] Módulo de Farmacia completo
- [ ] Obstetricia + Partograma + CRED + Vacunas

### Fase 3 (Administrativo/Financiero — 2 meses)
- [ ] Facturación completa con múltiples seguros
- [ ] Módulo de Cajas y Cobros
- [ ] Gestión de Recobros
- [ ] Logística/Almacenes/Compras/Licitaciones
- [ ] Teleconsulta (Jitsi)
- [ ] Portal Web para pacientes

### Fase 4 (BI e Integración — 1 mes)
- [ ] Dashboard BI completo (todos los KPIs del Excel)
- [ ] Reportes exportables PDF/Excel
- [ ] Integración RIS/PACS
- [ ] MPI multi-hospital completo
- [ ] Auditoría completa
- [ ] Optimización y pruebas de carga

---

*Documento generado el 29/05/2026 para el proyecto HOSIX — Red Hospitalaria de Guinea Ecuatorial*
*Basado en análisis de: 4 diagramas de flujo Visio + Excel de funcionalidades GEPROSTEC (3 hojas, 37 módulos)*
