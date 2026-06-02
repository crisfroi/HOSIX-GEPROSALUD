import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/hosixClient'

export interface Profesional {
  id: string
  nombre_completo?: string
  primer_nombre?: string
  segundo_nombre?: string | null
  primer_apellido?: string
  segundo_apellido?: string | null
  area_profesional?: string | null
  especialidad?: string | null
  servicio_id?: string | null
  activo: boolean
}

export const useProfesionales = () => {
  return useQuery<Profesional[]>({
    queryKey: ['profesionales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .select(
          `id,nombre_completo,primer_nombre,segundo_nombre,primer_apellido,segundo_apellido,area_profesional,especialidad,servicio_id,activo`
        )
        .eq('activo', true)
        .order('primer_apellido', { ascending: true })

      if (error) {
        throw error
      }

      return (data || []) as Profesional[]
    },
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
  })
}
