import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/hosixClient'

export interface EspecialidadMedica {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  area?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export function useHosixEspecialidades() {
  const [especialidades, setEspecialidades] = useState<EspecialidadMedica[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = async () => {
    setCargando(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('hosix_especialidades_medicas')
        .select('*')
        .order('nombre')

      if (err) throw err
      setEspecialidades(data || [])
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al cargar'
      setError(mensaje)
    } finally {
      setCargando(false)
    }
  }

  const crear = async (datos: Omit<EspecialidadMedica, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: err } = await supabase
        .from('hosix_especialidades_medicas')
        .insert([datos])
        .select()
        .single()

      if (err) throw err
      setEspecialidades([...especialidades, data])
      return data
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al crear'
      setError(mensaje)
      throw err
    }
  }

  const actualizar = async (id: string, datos: Partial<EspecialidadMedica>) => {
    try {
      const { data, error: err } = await supabase
        .from('hosix_especialidades_medicas')
        .update(datos)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      setEspecialidades(especialidades.map(e => e.id === id ? data : e))
      return data
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al actualizar'
      setError(mensaje)
      throw err
    }
  }

  const eliminar = async (id: string) => {
    try {
      const { error: err } = await supabase
        .from('hosix_especialidades_medicas')
        .delete()
        .eq('id', id)

      if (err) throw err
      setEspecialidades(especialidades.filter(e => e.id !== id))
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al eliminar'
      setError(mensaje)
      throw err
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  return { especialidades, cargando, error, cargar, crear, actualizar, eliminar }
}
