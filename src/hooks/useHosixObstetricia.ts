import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/hosixClient'
import { toast } from 'sonner'

export const useHosixObstetricia = () => {
  const queryClient = useQueryClient()

  const gestacionesQuery = useQuery({
    queryKey: ['obstetricia_gestaciones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obstetricia.gestaciones')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  const controlesQuery = useQuery({
    queryKey: ['obstetricia_controles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obstetricia.controles_prenatales')
        .select('*')
        .order('fecha_control', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  const partosQuery = useQuery({
    queryKey: ['obstetricia_partos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obstetricia.partos')
        .select('*')
        .order('fecha_inicio_parto', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  const crearGestacionMutation = useMutation({
    mutationFn: async (gestacion: any) => {
      const { data, error } = await supabase
        .from('obstetricia.gestaciones')
        .insert([gestacion])
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obstetricia_gestaciones'] })
      toast.success('Gestación registrada')
    },
    onError: (error: any) => toast.error(`Error: ${error.message}`)
  })

  const crearControlMutation = useMutation({
    mutationFn: async (control: any) => {
      const { data, error } = await supabase
        .from('obstetricia.controles_prenatales')
        .insert([control])
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obstetricia_controles'] })
      toast.success('Control prenatal registrado')
    },
    onError: (error: any) => toast.error(`Error: ${error.message}`)
  })

  const registrarPartoMutation = useMutation({
    mutationFn: async (parto: any) => {
      const { data, error } = await supabase
        .from('obstetricia.partos')
        .insert([parto])
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obstetricia_partos'] })
      queryClient.invalidateQueries({ queryKey: ['obstetricia_gestaciones'] })
      toast.success('Parto registrado')
    },
    onError: (error: any) => toast.error(`Error: ${error.message}`)
  })

  return {
    gestaciones: gestacionesQuery.data || [],
    gestacionesLoading: gestacionesQuery.isLoading,
    controles: controlesQuery.data || [],
    controlesLoading: controlesQuery.isLoading,
    partos: partosQuery.data || [],
    partosLoading: partosQuery.isLoading,
    crearGestacion: crearGestacionMutation.mutate,
    crearControl: crearControlMutation.mutate,
    registrarParto: registrarPartoMutation.mutate
  }
}
