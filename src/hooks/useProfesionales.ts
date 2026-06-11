import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/hosixClient'

export interface Profesional {
  id: string
  nombre?: string
  apellido?: string
  area_profesional?: string | null
  especialidad?: string | null
  centro_salud_id?: string | null
  activo: boolean
}

export const useProfesionales = () => {
  return useQuery<Profesional[]>({
    queryKey: ['profesionales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profesionales_sanitarios')
        .select(
          `id,nombre,apellido,area_profesional,especialidad,centro_salud_id,activo`
        )
        .eq('activo', true)
        .order('apellido', { ascending: true })

      if (error) {
        throw error
      }

      return (data || []) as Profesional[]
    },
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
  })
}
