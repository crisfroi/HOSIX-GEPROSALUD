## 📊 ANÁLISIS DE ADAPTACIÓN: PROMPT_DHIS2 → HOSIX EPIDEMIOLOGÍA

**Documento:** Alineación de arquitectura DHIS2 con base de datos epidemiológica HOSIX  
**Fecha:** 2026-06-02  
**Estado:** � POSTERGADO (análisis disponible, ejecución diferida)  
**Migración:** `20260602_012_epidemiologia_dhis2_rastreo_avanzado.sql`

> Nota: Esta línea de trabajo DHIS2 / epidemiología se mantiene como backlog técnico para una fase posterior. El enfoque inmediato se mantiene en la implementación del HIS central y los módulos prioritarios.

---

## 🎯 PROPÓSITO

Adaptar la propuesta de "PROMPT_DHIS2_EPIDEMIOLOGIA_HOSIX_GE.md" a la infraestructura existente de HOSIX sin duplicar trabajo, manteniendo compatibilidad hacia atrás y habilitando integración bidireccional con DHIS2.

---

## 📋 MAPEO: PROMPT_DHIS2 → HOSIX (Existente vs. Nuevo)

### ✅ YA EXISTE (Migración 20260530_010)

| Concepto DHIS2 | Tabla HOSIX | Estado |
|---|---|---|
| Catálogo de enfermedades | `hosix_enfermedades_notificables` | Básico, sin grupos OMS |
| Registro individual de casos | `hosix_casos_epidemiologicos` | Funcional, sin DHIS2 sync |
| Rastreo de contactos | `hosix_contactos_epidemiologicos` | Sin seguimiento diario |
| Alertas epidemiológicas | `hosix_alertas_epidemiologicas` | Simple, sin acciones |
| Gestión de brotes | `hosix_brotes_epidemiologicos` | Funcional pero sin DHIS2 |
| Reportes agregados | `hosix_reportes_epidemiologicos` | Básico |
| Parámetros de alerta | `hosix_parametros_alerta_epidemiologica` | Configuraciones simples |

### 🆕 NUEVO EN MIGRACIÓN 20260602_012

| Concepto DHIS2 | Tabla HOSIX Nueva | Característica |
|---|---|---|
| Seguimiento diario de contactos | `hosix_seguimiento_contactos_diario` | Vigilancia de síntomas diarios |
| Vigilancia sindrómica agregada | `hosix_vigilancia_sindromica` | Datos semanales por síndrome |
| Laboratorio epidemiológico | `hosix_muestras_epidemiologicas` | Trazabilidad de muestras y resultados |
| Análisis geoespacial | `hosix_zonas_riesgo` | Focos activos, zonas buffer, GeoJSON |
| Campañas de vacunación | `hosix_campanas_vacunacion` | Preventivas y reactivas |
| Notificación a DHIS2 | `hosix_notificaciones_dhis2` | Logs de sincronización oficial |

### 🔧 EXTENSIONES A EXISTENTES

#### 1. `hosix_enfermedades_notificables`
**Agregado:**
```sql
ALTER TABLE hosix_enfermedades_notificables
  ADD COLUMN grupo_vigilancia VARCHAR(10),  -- 'A','B','C','D' (OMS)
  ADD COLUMN dhis2_uid VARCHAR(50),         -- UID del programa DHIS2
  ADD COLUMN modo_transmision TEXT[],       -- ['contacto_directo','aerosolizado',...]
  ADD COLUMN tipo_aislamiento VARCHAR(50),  -- 'estándar','gotas','aerosolizado'
  ADD COLUMN plazo_notificacion_horas INT,  -- 24h para Grupo A
  ADD COLUMN ficha_notificacion JSONB;      -- JSON Schema de la ficha OPS
```

**Impacto:**
- Habilita notificación inmediata para Grupo A (Ébola, Marburg, Lassa, etc.)
- Sincronización automática con parámetros DHIS2
- Fichas dinámicas por enfermedad

#### 2. `hosix_casos_epidemiologicos`
**Agregado:**
```sql
ALTER TABLE hosix_casos_epidemiologicos
  ADD COLUMN coordenadas_lat/lng DECIMAL,   -- Geolocalización del caso
  ADD COLUMN embarazada BOOLEAN,            -- Dato demográfico crítico
  ADD COLUMN estado_vacunacion VARCHAR,     -- 'vacunado','no_vacunado','parcial'
  ADD COLUMN dhis2_tracked_entity_id VARCHAR, -- TEI en DHIS2
  ADD COLUMN dhis2_enrollment_id VARCHAR,   -- Enrollment en programa tracker
  ADD COLUMN dhis2_sincronizado BOOLEAN,    -- Flag de sync
  ADD COLUMN ficha_epidemiologica JSONB;    -- Datos variables por enfermedad
```

**Impacto:**
- TEI en DHIS2 permite seguimiento longitudinal
- Geolocalización para mapas de brotes
- Ficha flexible por enfermedad

#### 3. `hosix_contactos_epidemiologicos`
**Agregado:**
```sql
ALTER TABLE hosix_contactos_epidemiologicos
  ADD COLUMN subtipo_contacto VARCHAR,     -- 'conviviente','vecino','laboral'
  ADD COLUMN grado_exposicion VARCHAR,     -- 'bajo','medio','alto'
  ADD COLUMN duracion_exposicion_horas,    -- Cálculo de riesgo
  ADD COLUMN uso_epp BOOLEAN,              -- Protección durante exposición
  ADD COLUMN generacion INTEGER DEFAULT 1, -- Contacto de contacto (grafo)
  ADD COLUMN se_convirtio_en_caso BOOLEAN; -- Conversión a caso secundario
```

**Impacto:**
- Cálculo automático de riesgo
- Análisis de cadenas de transmisión (D3.js)
- Identificación de casos secundarios

#### 4. `hosix_alertas_epidemiologicas`
**Agregado:**
```sql
ALTER TABLE hosix_alertas_epidemiologicas
  ADD COLUMN nivel VARCHAR,  -- 'info','advertencia','critica','emergencia'
  ADD COLUMN acciones_requeridas TEXT[],   -- Pasos automáticos
  ADD COLUMN sms_enviado BOOLEAN,          -- Twilio integration ready
  ADD COLUMN email_enviado BOOLEAN;        -- Edge Function ready
```

**Impacto:**
- Alertas críticas con notificación en tiempo real (Supabase Realtime)
- SMS a personal de salud
- Escalamiento automático por gravedad

---

## 🏛️ ARQUITECTURA DE REPORTE

## 💾 DHIS2 LOCAL — DOCKER DEPLOYMENT

### Estado Actual
✅ **Preferencia:** Usar la imagen oficial Docker `dhis2/core` en lugar de desplegar el WAR manualmente.  
📦 **Versión sugerida:** `dhis2/core:43.0.0` (o establecer `DHIS2_IMAGE` según sea necesario)  

### Requisitos del Sistema (para Docker)
- **Docker** y **Docker Compose** instalados en la máquina de desarrollo
- **RAM:** mínimo 4GB (recomendado 8GB)
- **Disco:** 10GB+ para datos

### Usar Docker Compose (recomendado)
Se incluye un `docker-compose.dhis2.yml` de ejemplo en el repositorio que arranca PostgreSQL + DHIS2.

Ejecuta (desde la raíz del repo):

```bash
DHIS2_IMAGE=dhis2/core:43.0.0 docker compose -f docker-compose.dhis2.yml up -d
```

O simplemente:

```bash
docker compose -f docker-compose.dhis2.yml up -d
```

Accede a `http://localhost:8080/dhis2` cuando los contenedores estén listos.

### Archivos añadidos
- `docker-compose.dhis2.yml` — Compose para `postgres` + `dhis2` (imagen configurable)
- `docker/dhis2/dhis.conf` — Plantilla `dhis.conf` para montaje en el contenedor (conexión a la BD del servicio `db`)

### dhis.conf (ejemplo)
La plantilla monta la conexión a PostgreSQL del servicio `db` en Compose:

```properties
# DHIS2 configuration for Docker Compose
connection.dialect=org.hibernate.dialect.PostgreSQL13Dialect
connection.driver_class=org.postgresql.Driver
connection.url=jdbc:postgresql://db:5432/dhis2
connection.username=dhis2
connection.password=dhis2pass
connection.schema=public

server.https=false
server.port=8080
server.base_url=http://localhost:8080/dhis2

instance.default_locale=es_ES
instance.default_ui_locale=es_ES
instance.org_unit_levels=4

mail.protocol=smtp
mail.host=smtp.gmail.com
mail.port=587
mail.from=epidemiologia@minsalud.gq
```

### Mapear UIDs DHIS2 a HOSIX (siguiente paso)
Colocar UIDs reales una vez DHIS2 esté iniciado y crear `src/integrations/dhis2/config.ts` con:

```typescript
export const GE_DHIS2_CONFIG = {
  baseUrl: 'http://localhost:8080/dhis2',
  apiVersion: 'api/41',
  programs: {
    tracker_casos: 'PROGRAMA_UID_AQUI',
    events_ewars: 'EWARS_PROGRAM_UID',
    dataset_mensual: 'DATASET_MONTHLY_UID'
  },
  orgUnits: {
    nacional: 'OU_NACIONAL_UID',
    bioko_norte: 'OU_BIOKO_N_UID'
  },
  credentials: {
    username: 'api_hosix',
    password: '<token_api>'
  }
};
```

### Sincronización DHIS2 ← → HOSIX (resumen)
1. Caso notificado en HOSIX → Edge Function `sync-dhis2-case` → POST `/api/41/trackedEntityInstances` → almacenar TEI UID en `dhis2_tracked_entity_id`.
2. Laboratorio confirmado → Edge Function `update-dhis2-case` → PATCH a programStage → marcar como `confirmado`.
3. Reporte semanal → Supabase cron job → POST `/api/41/events` (EWARS) y registrar en `hosix_notificaciones_dhis2`.
### Fase 1 — Notificación y Rastreo (2-3 semanas)
- [ ] Componente `CasosEpidemiologicosForm` — Ficha dinámica por enfermedad
- [ ] Componente `RastroContactosPanel` — Identificación de contactos + asignación
- [ ] Componente `SeguimientoContactoDiario` — Evaluación diaria de síntomas
- [ ] Hook `useEpidemiologiaNotificacion` — Lógica de notificación inmediata

### Fase 2 — Análisis Geoespacial (2-3 semanas)
- [ ] Mapa con Leaflet + GeoJSON de Guinea Ecuatorial
- [ ] Visualización de casos por provincia/distrito
- [ ] Overlay de zonas de riesgo (`hosix_zonas_riesgo`)
- [ ] Clustering de casos (Turf.js)

### Fase 3 — Grafos de Transmisión (2 semanas)
- [ ] React Force Graph para visualizar red de contactos
- [ ] Colores por generación (Caso → Contacto 1 → Contacto 2)
- [ ] Hover/click para ver detalles
- [ ] Export a PNG/SVG para reportes

### Fase 4 — DHIS2 API (2 semanas)
- [ ] Cliente @dhis2/app-runtime
- [ ] Sincronización bidireccional
- [ ] Manejo de errores de sync
- [ ] Log visual en `hosix_notificaciones_dhis2`

---

## 📊 CAMPOS CLAVE POR ENFERMEDAD (JSON Schema)

Cada enfermedad tiene una `ficha_notificacion JSONB` con campos específicos:

### Ejemplo: Ébola
```jsonb
{
  "sintomas_cardinales": ["fiebre","vomitos","diarrea","hemorragia"],
  "laboratorio_requerido": ["sangre_serostatus","sangre_pcr"],
  "contactos_min_rastreo": 20,
  "dias_vigilancia": 21,
  "criterio_confirmacion": "PCR positivo o IgM positivo + clínica"
}
```

### Ejemplo: Malaria
```jsonb
{
  "sintomas_cardinales": ["fiebre","cefalea","mialgias"],
  "laboratorio_requerido": ["gota_gruesa","frotis_delgado"],
  "plasmodium_tipos": ["P.falciparum","P.vivax","P.malariae"],
  "criterio_confirmacion": "Parásito en gota/frotis"
}
```

---

## ⚡ TRIGGERS AUTOMÁTICOS

### Trigger 1: Generar número de caso
```plpgsql
-- GE-EBOLA-2026-000001
SELECT pais || '-' || enf_codigo || '-' || anio || '-' || secuencia
```

### Trigger 2: Alerta automática Grupo A
```plpgsql
IF enfermedad.grupo_vigilancia = 'A' THEN
  INSERT INTO alertas WITH nivel='emergencia', sms_enviado=TRUE
END IF
```

### Trigger 3: Crear contactos desde episodio
```plpgsql
-- Si paciente ingresa con ébola en urgencias
-- → Crear contacto para personal sanitario + acompañantes
```

---

## 🔐 SEGURIDAD Y RLS

### Políticas propuestas

| Rol | Tablas | Permisos |
|---|---|---|
| `epidemiologo` | casos, contactos, brotes | SELECT, INSERT, UPDATE |
| `medico_hospital` | solo SUS casos | SELECT |
| `laboratorio` | muestras | SELECT, UPDATE (resultado) |
| `admin_ministerio` | todo (notificaciones, reportes) | SELECT todo |
| `operador_rastreo` | contactos, seguimiento | UPDATE seguimiento diario |

---

## 🎯 METRICAS DE ÉXITO

| Métrica | Baseline | Objetivo |
|---|---|---|
| Tiempo notificación Grupo A | > 48h | < 2h |
| Contactos rastreados/caso | 0% | > 90% |
| Seguimiento diario completado | 0% | > 80% |
| Sincronización DHIS2 exitosa | N/A | 100% |
| Alertas falsas positivas | N/A | < 5% |

---

## � DHIS2 LOCAL — INSTALACIÓN Y CONFIGURACIÓN

### Estado Actual
✅ **WAR encontrado:** `dhis2-stable-43.0.0.war` (354 MB) en repositorio  
📦 **Versión:** DHIS2 43.0.0 (última estable compatible)  
📋 **Repositorio**: Contiene binario completo, listo para desplegar

### Requisitos del Sistema
- **Java:** JDK 11+ (requerido por WAR)
- **Servlet Container:** Tomcat 10+ o Jetty 12+
- **PostgreSQL:** 12+ (BD local)
- **RAM:** mínimo 4GB (recomendado 8GB)
- **Disco:** 10GB+ para datos epidemiológicos

### Pasos de Instalación

#### 1. Descomprimir y preparar DHIS2
```bash
# Crear carpeta de aplicaciones DHIS2
mkdir -p ~/dhis2-instance
cd ~/dhis2-instance

# Copiar WAR desde repositorio
cp c:/path/to/dhis2-stable-43.0.0.war .
```

#### 2. Crear BD PostgreSQL
```sql
CREATE DATABASE dhis2_ge 
  OWNER dhis2_user 
  ENCODING 'UTF8' 
  LOCALE 'es_ES.UTF-8';

GRANT ALL PRIVILEGES ON DATABASE dhis2_ge TO dhis2_user;
```

#### 3. Configurar Tomcat
**Archivo:** `CATALINA_HOME/conf/Catalina/localhost/ROOT.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Context displayName="DHIS2" 
         useHttpOnly="true" 
         sessionCookiePath="/" 
         sessionCookieName="JSESSIONID">
  <Resources cachingAllowed="true" cacheMaxSize="40000" />
</Context>
```

#### 4. Variables de entorno DHIS2
**Archivo:** `~/.dhis2/dhis.conf`
```properties
# DHIS2 Guinea Ecuatorial Configuration
connection.dialect=org.hibernate.dialect.PostgreSQL13Dialect
connection.driver_class=org.postgresql.Driver
connection.url=jdbc:postgresql:dhis2_ge
connection.username=dhis2_user
connection.password=<strong_password>
connection.schema=public

# Server
server.https=false
server.port=8080
server.base_url=http://localhost:8080/dhis2

# Instance settings
instance.default_locale=es_ES
instance.default_ui_locale=es_ES
instance.org_unit_levels=4

# Email (Twilio para SMS después)
mail.protocol=smtp
mail.host=smtp.gmail.com
mail.port=587
mail.from=epidemiologia@minsalud.gq
```

#### 5. Iniciar DHIS2
```bash
# En Windows
cd %CATALINA_HOME%/bin
catalina.bat run

# En Linux
$CATALINA_HOME/bin/catalina.sh run

# Acceder a: http://localhost:8080/dhis2
# Credenciales default: admin / district
```

### Configuración Post-Instalación

#### 1. Crear Org Unit Tree (Guinea Ecuatorial)
```
Nacional
├─ Región Insular
│  ├─ Bioko Norte
│  └─ Bioko Sur
├─ Región Continental
│  ├─ Litoral
│  ├─ Centro Sur
│  └─ Centro Norte
└─ Ciudad Autónoma de Malabo
```

#### 2. Configurar Programs

**Programa 1: Tracker - Vigilancia de Casos Individuales**
- Program Type: Tracker
- Org Units: Todos los hospitales
- Program Stages:
  - Notificación (sospecha)
  - Laboratorio (confirmación)
  - Rastreo Contactos (identificación)
  - Seguimiento (14-21 días)

**Programa 2: Event - Agregación Semanal (EWARS)**
- Program Type: Event
- Org Units: Distritos
- Data Elements: Síndromes (fébriles, respiratorios, diarreicos, neurológicos, hemorrágicos)

**Programa 3: DataSet - Reportes Mensuales**
- Período: Mensual
- Data Elements: Casos por enfermedad
- Sectores: Público, privado, farmacéutico

#### 3. Mapear UIDs DHIS2 a HOSIX
```typescript
// src/integrations/dhis2/config.ts
export const GE_DHIS2_CONFIG = {
  baseUrl: 'http://localhost:8080/dhis2',
  apiVersion: 'api/41',
  
  programs: {
    tracker_casos: 'PROGRAMA_UID_AQUI',      // Reemplazar con UID real
    events_ewars: 'EWARS_PROGRAM_UID',
    dataset_mensual: 'DATASET_MONTHLY_UID'
  },
  
  orgUnits: {
    nacional: 'OU_NACIONAL_UID',
    bioko_norte: 'OU_BIOKO_N_UID',
    // ... resto de org units
  },
  
  credentials: {
    username: 'api_hosix',
    password: '<token_api>' // Generar en DHIS2
  }
};
```

### Sincronización DHIS2 ← → HOSIX

**Flujo:**
1. Caso notificado en HOSIX
   → Edge Function `sync-dhis2-case`
   → POST a `/api/41/trackedEntityInstances`
   → Almacenar TEI UID en `dhis2_tracked_entity_id`

2. Laboratorio confirmado
   → Edge Function `update-dhis2-case`
   → PATCH a programStage (Laboratorio)
   → Cambiar estado a 'Confirmado'

3. Reporte semanal
   → Supabase cron job
   → Agregar datos por síndrome
   → POST a `/api/41/events` (EWARS)

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Crear migración 20260602_012 — **HECHO**
2. ⏳ **AHORA:** Aplicar migración a BD Supabase
3. ⏳ Instalar y configurar DHIS2 local con WAR existente
4. ⏳ Mapear UIDs de programas DHIS2 a config.ts
5. ⏳ Crear Edge Function `sync-dhis2-case`
6. ⏳ Actualizar tipos TypeScript `types.ts`
7. ⏳ Crear hooks para epidemiología avanzada
8. ⏳ Interfaces React para notificación y rastreo
9. ⏳ Integración Twilio (SMS) via Edge Functions
10. ⏳ Dashboard epidemiológico expandido

---

## 📚 REFERENCIAS

- **OMS Vigilancia Epidemiológica:** https://www.who.int/teams/disease-surveillance
- **DHIS2 Tracker Design:** https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-master/tracking.html
- **ECDC Rastreo Contactos:** https://www.ecdc.europa.eu/en/publications-data
- **Guinea Ecuatorial Protocolo:** Ministerio de Sanidad GE
