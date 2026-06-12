# Plan de Cierre Fase 6 - Sistema de Notificaciones Bidireccional

## 🎯 Objetivo

Implementar un **sistema de notificaciones bidireccional completo** para completar Fase 6 antes de avanzar a Fase 7 (Portal Web, MPI, Azure Security).

---

## 📊 Estado Actual

### ✅ Implementado
- `sonner` - Toasts simples (sin sonido, sin persistencia)
- Mensajes de éxito/error en componentes
- Notificaciones inline en formularios

### ❌ Faltante (CRÍTICO)
1. **Notificaciones en Tiempo Real** (WebSocket/Realtime)
   - Laboratorio solicita resultados → Médico recibe notificación
   - Médico aprueba resultados → Paciente puede ver en kiosko
   - Sistema cambia de estado → Todos los interesados se enteras

2. **Sonido e Iconografía**
   - Campanita con badge de contador
   - Sonido configurable
   - Silenciar temporal

3. **Altavoz/PA System**
   - Notificación de lista de espera
   - "Llamada de paciente X al consultorio Y"
   - Soporte TTS (Text-to-Speech)

4. **Persistencia y Centro de Notificaciones**
   - Historial de notificaciones
   - Marcar como leída
   - Filtrar por tipo

---

## 🏗️ Arquitectura Propuesta

```
┌─────────────────────────────────────────────────────────────┐
│               SISTEMA DE NOTIFICACIONES HOSIX               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         SUPABASE REALTIME (WebSocket)               │  │
│  │  - hosix_notificaciones (tabla)                     │  │
│  │  - hosix_preferencias_notificacion (sonido, etc)    │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ↓↑                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      NotificationContext + useNotifications Hook    │  │
│  │  - Suscripción a cambios en BD                      │  │
│  │  - Emisión de eventos                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ↓↑                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Presentación de Notificaciones            │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │ NotificationBell (Campanita + Dropdown)        │ │  │
│  │  │ - Badge contador                               │ │  │
│  │  │ - Centro de notificaciones                      │ │  │
│  │  │ - Marcar como leída                             │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │ NotificationToast (Sonido + Componente)        │ │  │
│  │  │ - Toast de sonner + audio                       │ │  │
│  │  │ - Ejecutar sonidos                              │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │ NotificationSpeaker (Altavoz PA)               │ │  │
│  │  │ - TTS en navegador (Web Speech API)             │ │  │
│  │  │ - Reproducir anuncios vía altavoz               │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Tareas Implementación

### **Fase 6.6.1: BD y Triggers (3 horas)**

#### 1. Crear tabla `hosix_notificaciones`
```sql
CREATE TABLE hosix_notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users,
  tipo VARCHAR NOT NULL,           -- laboratorio, imagenologia, admision, etc
  titulo VARCHAR NOT NULL,
  descripcion TEXT,
  datos JSONB,                     -- info contextual
  leida BOOLEAN DEFAULT FALSE,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_lectura TIMESTAMP,
  prioridad VARCHAR DEFAULT 'normal' -- critical, high, normal, low
);

CREATE INDEX idx_notif_usuario ON hosix_notificaciones(usuario_id);
CREATE INDEX idx_notif_leida ON hosix_notificaciones(leida);
CREATE INDEX idx_notif_tipo ON hosix_notificaciones(tipo);
```

#### 2. Crear tabla `hosix_preferencias_notificacion`
```sql
CREATE TABLE hosix_preferencias_notificacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users UNIQUE,
  sonido_habilitado BOOLEAN DEFAULT TRUE,
  tipo_sonido VARCHAR DEFAULT 'chime',    -- chime, bell, alert
  volumen INTEGER DEFAULT 100,
  altavoz_habilitado BOOLEAN DEFAULT FALSE,
  altavoz_velocidad NUMERIC DEFAULT 1.0,
  notif_laboratorio BOOLEAN DEFAULT TRUE,
  notif_imagenologia BOOLEAN DEFAULT TRUE,
  notif_admision BOOLEAN DEFAULT TRUE,
  notif_recaudacion BOOLEAN DEFAULT FALSE,
  silencio_temporal_hasta TIMESTAMP,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);
```

#### 3. Trigger para insertar notificación cuando se finalizan resultados
```sql
CREATE OR REPLACE FUNCTION notificar_resultados_laboratorio()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar notificación para el médico solicitante
  INSERT INTO hosix_notificaciones 
  (usuario_id, tipo, titulo, descripcion, datos, prioridad)
  SELECT 
    sol.medico_id,
    'laboratorio',
    'Resultados de Laboratorio Disponibles',
    'Los resultados solicitados están listos para revisión',
    jsonb_build_object(
      'solicitud_id', NEW.solicitud_id,
      'paciente_nombre', pac.nombre_completo
    ),
    'high'
  FROM hosix_laboratorio_solicitudes sol
  JOIN hosix_pacientes pac ON sol.paciente_id = pac.id
  WHERE sol.id = NEW.solicitud_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_notif_resultados_lab
AFTER UPDATE ON hosix_laboratorio_resultados
FOR EACH ROW
WHEN (NEW.valor_resultado IS NOT NULL AND OLD.valor_resultado IS NULL)
EXECUTE FUNCTION notificar_resultados_laboratorio();
```

#### 4. Triggers similares para imagenología y lista de espera

---

### **Fase 6.6.2: Context + Hook (2 horas)**

#### 1. Crear `NotificationContext.tsx`
```typescript
// src/contexts/NotificationContext.tsx
import React, { createContext, useState, useCallback, useEffect } from 'react'
import { RealtimeChannel } from '@supabase/realtime-js'
import { supabase } from '@/integrations/supabase/hosixClient'

export interface Notification {
  id: string
  usuario_id: string
  tipo: string
  titulo: string
  descripcion?: string
  datos?: Record<string, any>
  leida: boolean
  fecha_creacion: string
  prioridad: 'critical' | 'high' | 'normal' | 'low'
}

interface NotificationContextType {
  notificaciones: Notification[]
  noLeidasCount: number
  marcarComoLeida: (id: string) => Promise<void>
  borrar: (id: string) => Promise<void>
  reproducirSonido: (tipo?: string) => void
  anunciarPorAltavoz: (texto: string) => void
  silenciarTemporal: (minutos: number) => void
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notificaciones, setNotificaciones] = useState<Notification[]>([])
  const [silencioHasta, setSilencioHasta] = useState<Date | null>(null)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  // Suscribirse a cambios en Realtime
  useEffect(() => {
    const userId = supabase.auth.user()?.id
    if (!userId) return

    const ch = supabase
      .channel(`notif:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'hosix_notificaciones',
          filter: `usuario_id=eq.${userId}`
        },
        (payload) => {
          const notif = payload.new as Notification
          setNotificaciones(prev => [notif, ...prev])
          
          // Reproducir sonido si no está en silencio
          if (!silencioHasta || new Date() > silencioHasta) {
            reproducirSonido()
          }
        }
      )
      .subscribe()

    setChannel(ch)
    return () => {
      ch.unsubscribe()
    }
  }, [silencioHasta])

  const marcarComoLeida = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('hosix_notificaciones')
      .update({ leida: true, fecha_lectura: new Date().toISOString() })
      .eq('id', id)
    
    if (!error) {
      setNotificaciones(prev =>
        prev.map(n => n.id === id ? { ...n, leida: true } : n)
      )
    }
  }, [])

  const reproducirSonido = useCallback(async (tipo: string = 'chime') => {
    const audio = new Audio(`/sounds/notification-${tipo}.mp3`)
    audio.play().catch(err => console.log('Error reproduciendo sonido:', err))
  }, [])

  const anunciarPorAltavoz = useCallback((texto: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(texto)
      utterance.lang = 'es-ES'
      speechSynthesis.speak(utterance)
    }
  }, [])

  const silenciarTemporal = useCallback((minutos: number) => {
    const fecha = new Date(Date.now() + minutos * 60000)
    setSilencioHasta(fecha)
  }, [])

  const borrar = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('hosix_notificaciones')
      .delete()
      .eq('id', id)
    
    if (!error) {
      setNotificaciones(prev => prev.filter(n => n.id !== id))
    }
  }, [])

  const noLeidasCount = notificaciones.filter(n => !n.leida).length

  const value = {
    notificaciones,
    noLeidasCount,
    marcarComoLeida,
    borrar,
    reproducirSonido,
    anunciarPorAltavoz,
    silenciarTemporal
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = React.useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications debe estar dentro de NotificationProvider')
  }
  return context
}
```

#### 2. Crear hook `useNotifications.ts`
```typescript
// src/hooks/useNotifications.ts
import { useContext } from 'react'
import { NotificationContext } from '@/contexts/NotificationContext'

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications debe estar dentro de NotificationProvider')
  }
  return context
}
```

---

### **Fase 6.6.3: Componentes UI (2 horas)**

#### 1. `NotificationBell.tsx`
```typescript
// src/components/NotificationBell.tsx
import React from 'react'
import { Bell, Trash2, Volume2, VolumeX } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

export function NotificationBell() {
  const { notificaciones, noLeidasCount, marcarComoLeida, borrar, silenciarTemporal } = useNotifications()
  const [abierto, setAbierto] = React.useState(false)

  return (
    <DropdownMenu open={abierto} onOpenChange={setAbierto}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {noLeidasCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0"
            >
              {noLeidasCount > 99 ? '99+' : noLeidasCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96">
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Notificaciones</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => silenciarTemporal(15)}
            >
              <VolumeX className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-2">
            {notificaciones.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Sin notificaciones</p>
            ) : (
              notificaciones.map(n => (
                <div
                  key={n.id}
                  className={`p-3 rounded-lg border cursor-pointer ${
                    n.leida ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                  }`}
                  onClick={() => marcarComoLeida(n.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{n.titulo}</p>
                      <p className="text-xs text-gray-600">{n.descripcion}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(n.fecha_creacion).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        borrar(n.id)
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

#### 2. `NotificationToast.tsx` (Integración con sonner)
```typescript
// src/components/NotificationToast.tsx
import { useEffect } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { toast } from 'sonner'

export function NotificationToast() {
  const { notificaciones } = useNotifications()

  useEffect(() => {
    const lastNotif = notificaciones[0]
    if (lastNotif && !lastNotif.leida) {
      toast.success(lastNotif.titulo, {
        description: lastNotif.descripcion,
        duration: 5000,
      })
    }
  }, [notificaciones])

  return null
}
```

#### 3. `AnunciadorAltavoz.tsx`
```typescript
// src/components/AnunciadorAltavoz.tsx
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/hooks/useNotifications'

export function AnunciadorAltavoz() {
  const { anunciarPorAltavoz } = useNotifications()

  return (
    <Button
      variant="outline"
      onClick={() => anunciarPorAltavoz('Llamando a paciente, acérquese a consulta')}
    >
      Anunciar
    </Button>
  )
}
```

---

### **Fase 6.6.4: Integración en App (1 hora)**

1. Envolver App con `NotificationProvider`
2. Agregar `NotificationBell` en header
3. Agregar `NotificationToast` en layout global

---

### **Fase 6.6.5: Casos de Uso por Módulo (3 horas)**

| Módulo | Evento | Notificación | Sonido | Altavoz |
|--------|--------|--------------|--------|---------|
| **Laboratorio** | Resultados listos | ✅ | ✅ | ❌ |
| **Laboratorio** | Solicitud rechazada | ✅ | ✅ | ❌ |
| **Imagenología** | Estudio finalizado | ✅ | ✅ | ❌ |
| **Admisión** | Tu turno es ahora | ✅ | ✅ | ✅ Altavoz |
| **Caja** | Pago recibido | ✅ | ✅ | ❌ |
| **Recaudación** | Meta alcanzada | ✅ | ❌ | ❌ |

---

## 📦 Archivos a Crear

```
src/
├── contexts/
│   └── NotificationContext.tsx
├── components/
│   ├── NotificationBell.tsx
│   ├── NotificationToast.tsx
│   └── AnunciadorAltavoz.tsx
├── hooks/
│   └── useNotifications.ts (ya existe, refactorizar)
└── sounds/
    ├── notification-chime.mp3
    ├── notification-bell.mp3
    └── notification-alert.mp3

supabase/migrations/
├── 20260611_fase6_notificaciones.sql
└── 20260611_fase6_preferencias_notificacion.sql
```

---

## ⏱️ Estimado de Tiempo

| Tarea | Tiempo |
|-------|--------|
| BD + Triggers | 3h |
| Context + Hook | 2h |
| Componentes UI | 2h |
| Integración | 1h |
| Casos de uso | 3h |
| Testing | 2h |
| **TOTAL** | **13h** |

---

## 🔄 Flujo de Ejemplo: Laboratorio

```
1. Médico ordena prueba (ConsultaMedicaForm)
   ↓
2. Sistema crea hosix_laboratorio_solicitudes
   ↓
3. Laboratorio procesa y carga resultado
   ↓
4. Trigger: INSERT EN hosix_laboratorio_resultados
   ↓
5. Automáticamente: INSERT EN hosix_notificaciones
   {
     usuario_id: medico_id,
     tipo: 'laboratorio',
     titulo: 'Resultados de Laboratorio Disponibles',
     prioridad: 'high'
   }
   ↓
6. Realtime notifica al médico
   ↓
7. Cliente reproduce sonido + muestra campanita
   ↓
8. Médico revisa en "Centro de Notificaciones"
```

---

## ✅ Checklist Implementación

- [ ] Crear tablas en BD
- [ ] Crear triggers para cada módulo
- [ ] Implementar NotificationContext
- [ ] Implementar NotificationBell
- [ ] Implementar NotificationToast
- [ ] Implementar AnunciadorAltavoz
- [ ] Integrar en App.tsx
- [ ] Crear archivos de sonido
- [ ] Configurar preferencias usuario
- [ ] Testing unitario
- [ ] Testing integración
- [ ] Documentación de uso

---

## 🚀 Post-Implementación

Después de completar este sistema, Fase 6 estará **100% completa**:

- ✅ 6.0 - Consulta Médica
- ✅ 6.1 - Laboratorio
- ✅ 6.2 - Imagenología
- ✅ 6.3 - Lab-Imagen-Caja Integration
- ✅ 6.4 - Kioscos Públicos
- ✅ 6.5 - Testing
- ✅ 6.6 - Notificaciones (NUEVO)

Entonces se puede proceder a **Fase 7**:
- **7.1**: Portal Web Pacientes
- **7.2**: MPI Centralizado
- **7.3**: Azure Security

---

**Responsable**: Equipo Backend  
**Prioridad**: CRÍTICA (Cierre Fase 6)  
**Estado**: 📋 PLANIFICADO  
**Fecha Inicio Estimada**: Inmediata
