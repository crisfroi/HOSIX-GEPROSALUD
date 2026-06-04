import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/hosixClient'

export interface UnidadFuncional {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  tipo?: string
  ubicacion?: string
  responsable_id?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export function useHosixUnidadesFuncionales() {
  const [unidades, setUnidades] = useState<UnidadFuncional[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = async () => {
    setCargando(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('hosix_unidades_funcionales')
        .select('*')
        .order('nombre')

      if (err) throw err
      setUnidades(data || [])
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al cargar'
      setError(mensaje)
    } finally {
      setCargando(false)
    }
  }

  const crear = async (datos: Omit<UnidadFuncional, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: err } = await supabase
        .from('hosix_unidades_funcionales')
        .insert([datos])
        .select()
        .single()

      if (err) throw err
      setUnidades([...unidades, data])
      return data
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al crear'
      setError(mensaje)
      throw err
    }
  }

  const actualizar = async (id: string, datos: Partial<UnidadFuncional>) => {
    try {
      const { data, error: err } = await supabase
        .from('hosix_unidades_funcionales')
        .update(datos)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      setUnidades(unidades.map(u => u.id === id ? data : u))
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
        .from('hosix_unidades_funcionales')
        .delete()
        .eq('id', id)

      if (err) throw err
      setUnidades(unidades.filter(u => u.id !== id))
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al eliminar'
      setError(mensaje)
      throw err
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  return { unidades, cargando, error, cargar, crear, actualizar, eliminar }
}
