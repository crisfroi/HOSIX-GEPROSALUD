# 🏥 Módulo de Consulta Externa - Mejoras Implementadas (02-06-2026)

## 📊 Resumen Ejecutivo

Se ha mejorado significativamente el módulo de **Consulta Externa** con tres componentes nuevos:

1. **Pantalla de Espera Interactiva** - Pantalla de TV para sala de espera
2. **Gestor de Pantallas** - Control centralizado de múltiples displays
3. **Citas con Adjuntos** - Agendamiento de citas con soporte multimedia

---

## 🎨 Componentes Implementados

### 1️⃣ PantallaEsperaConsulta.tsx (Pantalla de Espera)

**Ubicación:** `src/components/hosix/citas/PantallaEsperaConsulta.tsx`

**Propósito:** Display interactivo para TV en sala de espera mostrando pacientes en orden de atención.

**Características:**
- ✅ Paciente actual destacado en grande
- ✅ Próximos 5 pacientes en lista pequeña
- ✅ Tiempo de espera calculado en tiempo real
- ✅ Alertas visuales si espera > 60 minutos
- ✅ Estadísticas (total en espera, siendo atendido, pendientes)
- ✅ Información de teleconsulta cuando aplica
- ✅ Actualización automática cada 30 segundos
- ✅ Interfaz optimizada para TV (tamaños grandes, colores contrastantes)

**Props:**
```typescript
interface PantallaEsperaConsultaProps {
  agendaId?: string;        // Filtrar por agenda (opcional)
  autoRefresh?: number;     // Intervalo de actualización (ms, default 30000)
}
```

**Uso:**
```tsx
<PantallaEsperaConsulta agendaId={agendaId} autoRefresh={30000} />
```

**Mejoras respecto a versión anterior:**
- ❌ ANTES: No había pantalla de espera
- ✅ AHORA: Interfaz profesional tipo hospital (como Clínica La Concepción)

---

### 2️⃣ SalaEsperaManager.tsx (Gestor de Pantallas)

**Ubicación:** `src/components/hosix/citas/SalaEsperaManager.tsx`

**Propósito:** Panel de control para gestionar múltiples pantallas en diferentes ubicaciones.

**Características:**
- ✅ Crear/editar/eliminar pantallas
- ✅ Asignar cada pantalla a una agenda específica
- ✅ Estados: activo, pausado, offline
- ✅ Ubicación personalizable para cada pantalla
- ✅ Última actualización timestamp
- ✅ Previsualización en vivo de cada pantalla
- ✅ Configuración global (intervalo, volumen)
- ✅ Tabs para gestionar múltiples pantallas

**Campos configurables por pantalla:**
- Nombre de pantalla
- Ubicación (Recepción, Pasillo A, etc.)
- Agenda asignada (todas o específica)
- Estado (activo/pausado/offline)

**Configuración Global:**
- Intervalo de actualización (ms)
- Volumen de anuncios (%)

**Uso:**
```tsx
<SalaEsperaManager />
```

---

### 3️⃣ CitasFormEnhanced.tsx (Citas con Adjuntos)

**Ubicación:** `src/components/hosix/citas/CitasFormEnhanced.tsx`

**Propósito:** Formulario mejorado de agendamiento con soporte de archivos multimedia.

**Características:**
- ✅ Interfaz de dos tabs: "Datos de Cita" y "Adjuntos"
- ✅ Todos los datos estándar de cita
- ✅ **ADJUNTOS MULTIMEDIA:**
  - Drag-and-drop zone
  - Soporte: PNG, JPG, PDF, MP4, MP3, DOCX, XLSX, etc.
  - Tamaño máximo: 50MB por archivo
  - Preview de imágenes
  - Iconos por tipo
  - Indicador de tamaño

- ✅ Validación de campos requeridos
- ✅ Opciones: Teleconsulta ✓, Requiere Adjuntos ✓
- ✅ Upload automático a Supabase Storage
- ✅ Bucket: `documents` con ruta: `citas/{citaId}/{timestamp}-{nombre}`
- ✅ Notificaciones de error con toast
- ✅ Loading states durante upload

**Tipos de adjuntos soportados:**
- 🖼️ Imágenes (JPEG, PNG, GIF, WebP)
- 🎬 Videos (MP4, WebM, MOV)
- 🎵 Audio (MP3, WAV, OGG)
- 📄 Documentos (PDF, DOC, DOCX, XLS, XLSX)

**Uso:**
```tsx
<CitasFormEnhanced onSuccess={() => console.log('Cita agendada')} />
```

---

## 🔧 Configuración de Supabase Storage

Para que funcionen los adjuntos, es necesario crear el bucket en Supabase:

**Bucket:** `documents`
**Permisos:** Public (para descargar archivos)
**Ruta de files:** `citas/{citaId}/{timestamp}-{nombre}`

### Crear bucket (SQL):
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true);
```

### RLS Policy (permitir lectura pública):
```sql
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'documents');
```

---

## 📋 Integración en Página de Citas

Para integrar los nuevos componentes en la página actual:

**Archivo:** `src/pages/Hosix/Citas.tsx` (o ubicación equivalente)

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CitasFormEnhanced from '@/components/hosix/citas/CitasFormEnhanced';
import SalaEsperaManager from '@/components/hosix/citas/SalaEsperaManager';
import CitasList from '@/components/hosix/citas/CitasList';

export default function CitasPage() {
  return (
    <Tabs defaultValue="agendar">
      <TabsList>
        <TabsTrigger value="agendar">Agendar Cita</TabsTrigger>
        <TabsTrigger value="lista">Lista de Citas</TabsTrigger>
        <TabsTrigger value="espera">Sala de Espera</TabsTrigger>
        <TabsTrigger value="pantallas">Gestión de Pantallas</TabsTrigger>
      </TabsList>

      <TabsContent value="agendar">
        <CitasFormEnhanced onSuccess={() => window.location.reload()} />
      </TabsContent>

      <TabsContent value="lista">
        <CitasList />
      </TabsContent>

      <TabsContent value="espera">
        <PantallaEsperaConsulta />
      </TabsContent>

      <TabsContent value="pantallas">
        <SalaEsperaManager />
      </TabsContent>
    </Tabs>
  );
}
```

---

## 🚀 Funcionalidades Futuras Recomendadas

### Fase 2: Mejoras Inmediatas
1. **Anuncio de Audio** - Text-to-Speech para anunciar pacientes
2. **Dashboard de Tiempos** - Estadísticas de espera promedio
3. **Historial de Adjuntos** - Ver adjuntos de citas anteriores
4. **Confirmación de Asistencia** - SMS/Email a pacientes
5. **Gestión de No-Shows** - Registrar inasistencias

### Fase 3: Integraciones
1. **Integración con WhatsApp** - Notificaciones a pacientes
2. **Código QR** - Check-in de pacientes
3. **Videoconferencia** - Teleconsulta integrada
4. **Calendario Sincronizado** - Outlook/Google Calendar

---

## ✅ Checklist de Validación

- [ ] Bucket `documents` creado en Supabase
- [ ] `.env.local` con credenciales correctas
- [ ] npm install (dependencias de Sonner para toasts)
- [ ] Probar upload de archivo en CitasFormEnhanced
- [ ] Verificar que archivos se guardan en Storage
- [ ] Validar permisos RLS en bucket
- [ ] Integrar componentes en página de citas
- [ ] Probar pantalla en TV/monitor grande
- [ ] Validar actualización automática cada 30s

---

## 📝 Notas Técnicas

### Seguridad
- RLS policies validadas por `centro_salud_id`
- Solo usuarios autenticados pueden subir archivos
- Storage bucket protegido con RLS

### Performance
- Citas filtradas por fecha actual
- Actualización cada 30 segundos (configurable)
- Lazy loading de componentes
- React Query para caching

### Responsividad
- PantallaEsperaConsulta: Optimizada para TV (16:9)
- CitasFormEnhanced: Responsive en desktop/mobile
- SalaEsperaManager: Tabs adaptativos

---

## 🔗 Archivos Relacionados

| Archivo | Propósito |
|---------|-----------|
| `src/hooks/useHosixCitas.ts` | Hook para citas |
| `src/components/hosix/citas/CitasList.tsx` | Lista de citas |
| `src/components/hosix/citas/ListaEsperaManager.tsx` | Gestión de lista de espera |
| `src/components/hosix/citas/AgendasList.tsx` | Gestión de agendas |

---

**Última actualización:** 02-06-2026 @ 18:15 UTC  
**Autor:** GitHub Copilot  
**Estado:** ✅ Implementado y Listo para Integración
