import { useQuery } from '@tanstack/react-query'
import { SupabaseClient } from '@supabase/supabase-js'

export interface PacienteUnificado {
  id: string
  hcu: string
  cedula: string
  nombre: string
  apellido: string
  fecha_nacimiento?: string
  genero?: string
  estado: 'activo' | 'pendiente' | 'sincronizado'
  origen: 'local' | 'nodo_central' | 'pendiente'
  sincronizado_desde_central?: string
  hcu_temporal?: string
}

/**
 * Hook para obtener pacientes de ambas tablas:
 * - pacientes_maestro_local: ya sincronizados desde nodo central
 * - pacientes_pendientes_sync: nuevos pacientes locales en espera de sincronización
 */
export function usePacientes(supabase: SupabaseClient) {
  return useQuery({
    queryKey: ['pacientes'],
    queryFn: async () => {
      // 1. Obtener pacientes ya sincronizados
      const { data: sincronizados, error: errorSync } = await supabase
        .from('hospital_local.pacientes_maestro_local')
        .select('*')
        .eq('estado', 'activo')

      // 2. Obtener pacientes pendientes de sincronización
      const { data: pendientes, error: errorPend } = await supabase
        .from('hospital_local.pacientes_pendientes_sync')
        .select('*')
        .in('estado', ['pendiente', 'sincronizado', 'error'])

      if (errorSync) throw errorSync
      if (errorPend) throw errorPend

      // 3. Unificar en una sola lista con metadatos de origen
      const pacientesUnificados: PacienteUnificado[] = [
        ...(sincronizados || []).map((p: any) => ({
          id: p.id,
          hcu: p.hcu,
          cedula: p.cedula,
          nombre: p.nombre,
          apellido: p.apellido,
          fecha_nacimiento: p.fecha_nacimiento,
          genero: p.genero,
          estado: 'sincronizado' as const,
          origen: 'nodo_central' as const,
          sincronizado_desde_central: p.sincronizado_desde_central
        })),
        ...(pendientes || []).map((p: any) => ({
          id: p.id,
          hcu: p.hcu_final || p.hcu_temporal,
          cedula: p.cedula,
          nombre: p.nombre,
          apellido: p.apellido,
          fecha_nacimiento: p.fecha_nacimiento,
          genero: p.genero,
          estado: p.estado as 'pendiente' | 'sincronizado' | 'error',
          origen: 'pendiente' as const,
          hcu_temporal: p.hcu_temporal
        }))
      ]

      // Ordenar por apellido + nombre
      return pacientesUnificados.sort((a, b) => {
        const apellidoA = `${a.apellido} ${a.nombre}`.toLowerCase()
        const apellidoB = `${b.apellido} ${b.nombre}`.toLowerCase()
        return apellidoA.localeCompare(apellidoB)
      })
    },
    staleTime: 30000 // Actualizar cada 30 segundos
  })
}
