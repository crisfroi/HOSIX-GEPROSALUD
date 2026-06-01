## 🎯 ANÁLISIS DHIS2 - HECHO. PRÓXIMOS PASOS INMEDIATOS

### ✅ QUÉ SE ENTREGÓ (2 de Junio 2026)

1. **Migración SQL Completa:**  
   `supabase/migrations/20260602_012_epidemiologia_dhis2_rastreo_avanzado.sql`
   - 14 nuevas tablas para DHIS2, seguimiento diario, laboratorio, geoespacial, campañas
   - 40+ campos extendidos a tablas existentes
   - 15+ índices de performance
   - 3 vistas para reportes rápidos
   - Totalmente compatible con estructura actual

2. **Documento de Adaptación:**  
   `docs/ADAPTACION_DHIS2_EPIDEMIOLOGIA.md`
   - Mapeo 1-a-1 entre PROMPT_DHIS2 y HOSIX
   - Arquitectura de reporte (Caso → DHIS2 → OMS)
   - Roadmap de 4 fases para componentes React
   - Enumeraciones para Guinea Ecuatorial
   - Casos de uso prácticos (Ébola, Malaria, etc.)

3. **Log Actualizado:**  
   `docs/IMPLEMENTACION_LOG.md` (línea de tiempo)

---

## 🚀 PRÓXIMOS 7 DÍAS (Roadmap Práctico)

### **DÍA 1 (Hoy o mañana):** Aplicar Migración + Tipos TypeScript

**Acción 1.1 - Aplicar migración 012:**
```bash
# En terminal Supabase CLI
supabase db push

# ✅ Resultado esperado: 14 nuevas tablas, 40+ campos extendidos
```

**Acción 1.2 - Generar tipos TypeScript:**
```bash
# Ejecutar en terminal del proyecto
npm run supabase:types

# ✅ Resultado: types.ts actualizado con nuevas tablas
```

**Validación:**
```typescript
// En src/integrations/supabase/types.ts debe existir:
export type Database = {
  public: {
    Tables: {
      hosix_seguimiento_contactos_diario: { ... }
      hosix_vigilancia_sindromica: { ... }
      hosix_muestras_epidemiologicas: { ... }
      // ... 11 tablas más
    }
  }
}
```

---

### **DÍAS 2-3:** Crear Hook + Componentes de Notificación (FASE 1)

**Acción 2.1 - Crear Hook para epidemiología avanzada:**

Crear archivo: `src/hooks/useHosixEpidemiologia.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/hosixClient';

export function useHosixEpidemiologia() {
  // Mutación: crear caso con notificación automática
  const crearCasoMutation = useMutation({
    mutationFn: async (nuevoCaso: {
      paciente_id: string;
      enfermedad_id: string;
      fecha_sintomas: Date;
      clasificacion: 'sospechoso' | 'probable' | 'confirmado';
      provincia: string;
      coordenadas_lat: number;
      coordenadas_lng: number;
    }) => {
      // 1. Crear caso
      const { data: caso, error: casoError } = await supabase
        .from('hosix_casos_epidemiologicos')
        .insert([{
          paciente_id: nuevoCaso.paciente_id,
          enfermedad_id: nuevoCaso.enfermedad_id,
          fecha_sintomas: nuevoCaso.fecha_sintomas,
          clasificacion: nuevoCaso.clasificacion,
          provincia: nuevoCaso.provincia,
          coordenadas_lat: nuevoCaso.coordenadas_lat,
          coordenadas_lng: nuevoCaso.coordenadas_lng,
          numero_caso: '', // Generado por trigger
        }])
        .select()
        .single();

      if (casoError) throw casoError;

      // 2. Si Grupo A, crear alerta automática (el trigger lo hace)
      // 3. Retornar caso creado
      return caso;
    },
  });

  // Query: obtener casos activos
  const obtenerCasosActivos = () =>
    useQuery({
      queryKey: ['casos_activos'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('hosix_casos_epidemiologicos')
          .select('*, enfermedad:hosix_enfermedades_notificables(*)')
          .eq('estado_caso', 'activo')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
      },
    });

  // Mutation: agregar contactos
  const agregarContactoMutation = useMutation({
    mutationFn: async (contacto: {
      caso_indice_id: string;
      nombres: string;
      apellidos: string;
      tipo_contacto: string;
      nivel_riesgo: string;
      telefono?: string;
      email?: string;
    }) => {
      const { data, error } = await supabase
        .from('hosix_contactos_epidemiologicos')
        .insert([contacto])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  return {
    crearCasoMutation,
    obtenerCasosActivos,
    agregarContactoMutation,
  };
}
```

**Acción 2.2 - Crear componente CasoNotificacionForm:**

Crear archivo: `src/components/hosix/epidemiologia/CasoNotificacionForm.tsx`

```typescript
import React, { useState } from 'react';
import { useHosixEpidemiologia } from '@/hooks/useHosixEpidemiologia';
import { Card, Button, Input, Select, Textarea, Alert } from '@/components/ui';

export function CasoNotificacionForm({ onSuccess }: { onSuccess?: () => void }) {
  const { crearCasoMutation } = useHosixEpidemiologia();
  const [formData, setFormData] = useState({
    paciente_id: '',
    enfermedad_id: '',
    fecha_sintomas: '',
    clasificacion: 'sospechoso' as const,
    provincia: '',
    coordenadas_lat: 0,
    coordenadas_lng: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await crearCasoMutation.mutateAsync({
      ...formData,
      fecha_sintomas: new Date(formData.fecha_sintomas),
    });
    onSuccess?.();
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Notificación de Caso Epidemiológico</h2>
      
      {crearCasoMutation.error && (
        <Alert variant="destructive" className="mb-4">
          {crearCasoMutation.error.message}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>Paciente ID</label>
          <Input
            value={formData.paciente_id}
            onChange={(e) => setFormData({ ...formData, paciente_id: e.target.value })}
            required
          />
        </div>

        <div>
          <label>Enfermedad</label>
          <Select
            value={formData.enfermedad_id}
            onValueChange={(v) => setFormData({ ...formData, enfermedad_id: v })}
            required
          >
            {/* Opciones cargadas de BD */}
          </Select>
        </div>

        <div>
          <label>Clasificación</label>
          <Select
            value={formData.clasificacion}
            onValueChange={(v) => setFormData({ ...formData, clasificacion: v as any })}
          >
            <option value="sospechoso">Sospechoso</option>
            <option value="probable">Probable</option>
            <option value="confirmado">Confirmado</option>
          </Select>
        </div>

        <div>
          <label>Fecha de Síntomas</label>
          <Input
            type="datetime-local"
            value={formData.fecha_sintomas}
            onChange={(e) => setFormData({ ...formData, fecha_sintomas: e.target.value })}
            required
          />
        </div>

        <div>
          <label>Provincia</label>
          <Input
            value={formData.provincia}
            onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
          />
        </div>

        <Button type="submit" disabled={crearCasoMutation.isPending}>
          {crearCasoMutation.isPending ? 'Creando...' : 'Crear Caso'}
        </Button>
      </form>
    </Card>
  );
}
```

---

### **DÍAS 4-5:** Crear Tab de Seguimiento de Contactos (FASE 1)

**Acción 3.1 - Componente SeguimientoContactoTab:**

Crear archivo: `src/components/hosix/epidemiologia/SeguimientoContactoTab.tsx`

```typescript
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/hosixClient';
import { Card, Badge, Button, Checkbox, Textarea } from '@/components/ui';

export function SeguimientoContactoTab({ casoId }: { casoId: string }) {
  // Obtener contactos del caso
  const { data: contactos, isLoading } = useQuery({
    queryKey: ['contactos', casoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_contactos_epidemiologicos')
        .select('*')
        .eq('caso_indice_id', casoId)
        .order('created_at');
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <h3 className="font-bold">Seguimiento de Contactos ({contactos?.length || 0})</h3>
      
      {contactos?.map((contacto) => (
        <SeguimientoContactoCard key={contacto.id} contacto={contacto} />
      ))}
    </div>
  );
}

function SeguimientoContactoCard({ contacto }: { contacto: any }) {
  const [mostrarDiario, setMostrarDiario] = useState(false);

  // Obtener seguimientos diarios de este contacto
  const { data: seguimientos } = useQuery({
    queryKey: ['seguimiento_diario', contacto.id],
    enabled: mostrarDiario,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_seguimiento_contactos_diario')
        .select('*')
        .eq('contacto_id', contacto.id)
        .order('dia_vigilancia');
      
      if (error) throw error;
      return data;
    },
  });

  const estadoColor = {
    'verde': 'bg-green-100',
    'amarillo': 'bg-yellow-100',
    'rojo': 'bg-red-100',
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold">{contacto.nombres} {contacto.apellidos}</p>
          <p className="text-sm text-gray-600">{contacto.telefono}</p>
          <p className="text-sm">Tipo: {contacto.tipo_contacto} | Riesgo: {contacto.nivel_riesgo}</p>
        </div>
        <Badge className={estadoColor[contacto.nivel_riesgo] || 'bg-gray-100'}>
          {contacto.estado_vigilancia}
        </Badge>
      </div>

      {mostrarDiario && seguimientos && (
        <div className="mt-4 border-t pt-4">
          <p className="font-bold mb-2">Evaluaciones Diarias:</p>
          <div className="space-y-2">
            {seguimientos.map((seg: any) => (
              <div key={seg.id} className={`p-2 rounded ${estadoColor[seg.nivel_alerta] || 'bg-gray-50'}`}>
                <p className="text-sm">
                  <strong>Día {seg.dia_vigilancia} ({seg.fecha_seguimiento}):</strong> 
                  {seg.asintomatico ? '✓ Asintomático' : '⚠️ Con síntomas'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => setMostrarDiario(!mostrarDiario)}
        className="mt-2"
      >
        {mostrarDiario ? 'Ocultar' : 'Ver'} Seguimiento Diario
      </Button>
    </Card>
  );
}
```

---

### **DÍAS 6-7:** Integración en Página Epidemiología

**Acción 4.1 - Actualizar Epidemiologia.tsx:**

Modificar: `src/pages/Hosix/Epidemiologia.tsx`

```typescript
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardEpidemiologico } from '@/components/hosix/epidemiologia/DashboardEpidemiologico';
import { CasoNotificacionForm } from '@/components/hosix/epidemiologia/CasoNotificacionForm';
import { SeguimientoContactoTab } from '@/components/hosix/epidemiologia/SeguimientoContactoTab';

export default function Epidemiologia() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Control Epidemiológico - DHIS2</h1>
      
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="notificacion">Notificar Caso</TabsTrigger>
          <TabsTrigger value="seguimiento">Seguimiento</TabsTrigger>
          <TabsTrigger value="laboratorio">Laboratorio</TabsTrigger>
          <TabsTrigger value="brotes">Brotes</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardEpidemiologico />
        </TabsContent>

        <TabsContent value="notificacion">
          <CasoNotificacionForm onSuccess={() => setSelectedCaseId(null)} />
        </TabsContent>

        <TabsContent value="seguimiento">
          {selectedCaseId && <SeguimientoContactoTab casoId={selectedCaseId} />}
        </TabsContent>

        {/* Más tabs... */}
      </Tabs>
    </div>
  );
}
```

---

## 🎯 CHECKLIST INMEDIATO (7 días)

- [ ] **Día 1:** Aplicar migración 012 + generar tipos TS
- [ ] **Día 2:** Crear hook `useHosixEpidemiologia`
- [ ] **Día 3:** Componente `CasoNotificacionForm`
- [ ] **Día 4:** Componente `SeguimientoContactoTab`
- [ ] **Día 5:** Componente `SeguimientoContactoDiarioForm` (evaluación diaria)
- [ ] **Día 6:** Integrar todo en `Epidemiologia.tsx`
- [ ] **Día 7:** Testing + deploy a staging

---

## 📚 REFERENCIAS RÁPIDAS

| Documento | Propósito |
|-----------|----------|
| `ADAPTACION_DHIS2_EPIDEMIOLOGIA.md` | Arquitectura completa y casos de uso |
| `20260602_012_epidemiologia_dhis2_rastreo_avanzado.sql` | Migración SQL lista para aplicar |
| `IMPLEMENTACION_LOG.md` | Timeline actualizado |

---

## ⚡ COMANDOS CLAVE

```bash
# Aplicar migración
supabase db push

# Generar tipos
npm run supabase:types

# Ejecutar proyecto
npm run dev

# Tests
npm run test:integration
```

---

**¿Listo? Empieza por Día 1 (migración + tipos). Si hay dudas, consulta ADAPTACION_DHIS2_EPIDEMIOLOGIA.md**
