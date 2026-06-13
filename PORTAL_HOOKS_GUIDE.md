# Portal de Pacientes - Guía de Hooks Reutilizables

## Hooks Disponibles

### 1. `usePortalAuth()` - Autenticación y Datos del Paciente

**Ubicación:** `src/hooks/usePortalAuth.ts`

**Uso:**
```typescript
import { usePortalAuth } from '@/hooks/usePortalAuth'

export default function PortalPage() {
  const { paciente, isLoading, error, logout } = usePortalAuth()
  
  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} />
  
  return (
    <div>
      <h1>Bienvenido, {paciente?.nombre_completo}</h1>
      <p>HCU: {paciente?.hcu}</p>
    </div>
  )
}
```

**Retorna:**
- `paciente` - Datos completos del paciente (PortalPaciente)
- `isLoading` - boolean
- `error` - string | null
- `logout` - async function para cerrar sesión

**Maneja automáticamente:**
- Verificación de sesión
- Redirección a login si no autenticado
- Carga de datos del paciente desde `portal_pacientes`

---

### 2. `usePortalData()` - Datos Clínicos del Paciente

**Ubicación:** `src/hooks/usePortalData.ts`

**Uso:**
```typescript
import { usePortalData } from '@/hooks/usePortalData'
import { usePortalAuth } from '@/hooks/usePortalAuth'

export default function PortalPage() {
  const { paciente } = usePortalAuth()
  const { citas, resultados, recetas, historial, isLoading } = usePortalData({
    hcu: paciente?.hcu,
    enabled: !!paciente?.hcu
  })
  
  return (
    <div>
      <h2>Citas Próximas: {citas.length}</h2>
      <h2>Resultados: {resultados.length}</h2>
    </div>
  )
}
```

**Parámetros:**
- `hcu` - HCU del paciente (requerido para cargar datos)
- `enabled` - boolean para controlar si deben cargarse los datos

**Retorna:**
- `citas` - array de citas próximas
- `resultados` - array de resultados (laboratorio + imagenología)
- `recetas` - array de recetas activas
- `historial` - array de consultas clínicas
- `isLoading` - boolean
- `error` - string | null

**Carga automáticamente en paralelo:**
- Citas próximas desde `hosix_citas`
- Resultados de laboratorio desde `laboratorio_resultados`
- Resultados de imagenología desde `imagenologia_resultados`
- Historial clínico desde `hosix_historia_clinica`

---

## Template Estándar para Páginas del Portal

```typescript
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortalAuth } from '@/hooks/usePortalAuth'
import { usePortalData } from '@/hooks/usePortalData'
import { Card, CardContent } from '@/components/ui/card'

export default function PortalPage() {
  const navigate = useNavigate()
  const { paciente, isLoading: authLoading } = usePortalAuth()
  const { citas, resultados, recetas, historial, isLoading: dataLoading } = usePortalData({
    hcu: paciente?.hcu,
    enabled: !!paciente?.hcu
  })

  const isLoading = authLoading || dataLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tu Página</h1>
        <p className="text-gray-600 mt-2">
          Bienvenido, {paciente?.nombre_completo}
        </p>
      </div>

      {/* Tu contenido aquí */}
    </div>
  )
}
```

---

## Checklist para Nuevas Páginas del Portal

- [ ] Importar `usePortalAuth`
- [ ] Importar `usePortalData` (si necesitas datos clínicos)
- [ ] Usar el template estándar
- [ ] Mostrar loading spinner mientras `isLoading`
- [ ] Mostrar error si existe
- [ ] Usar `paciente` para datos del usuario
- [ ] Usar `citas`, `resultados`, `recetas`, `historial` según sea necesario
- [ ] Implementar navegación con `useNavigate()`

---

## Tipos Disponibles

```typescript
// De usePortalAuth
interface PortalPaciente {
  id: string
  nombre_completo: string
  hcu: string
  telefono: string
  genero?: string
  fecha_nacimiento?: string
  centro_salud_id?: string
  alergias?: any
  condiciones_cronicas?: any
  tipo_sangre?: string
  contacto_emergencia?: string
  estado?: string
}

// De usePortalData
interface PortalClinicalData {
  citas: any[]
  resultados: any[]
  recetas: any[]
  historial: any[]
  isLoading: boolean
  error: string | null
}
```

---

## Páginas Actualizadas

✅ PortalDashboard.tsx - Usa ambos hooks

## Páginas Pendientes de Actualizar

- [ ] PortalHistorial.tsx
- [ ] PortalResultados.tsx
- [ ] PortalCitas.tsx
- [ ] PortalRecetas.tsx
- [ ] PortalPerfil.tsx

**Próximo paso:** Actualizar las demás páginas del portal para usar estos hooks reutilizables.
