import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/hosixClient'

export interface PoliticaSeguridad {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  tabla_aplicada?: string
  operacion?: string
  condicion_sql?: string
  aplica_a_roles?: string[]
  aplica_a_usuarios?: string[]
  activa: boolean
  created_at: string
  updated_at: string
}

export function useHosixPoliticasSeguridad() {
  const [politicas, setPoliticas] = useState<PoliticaSeguridad[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = async () => {
    setCargando(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('hosix_politicas_seguridad')
        .select('*')
        .order('nombre')

      if (err) throw err
      setPoliticas(data || [])
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al cargar'
      setError(mensaje)
    } finally {
      setCargando(false)
    }
  }

  const crear = async (datos: Omit<PoliticaSeguridad, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: err } = await supabase
        .from('hosix_politicas_seguridad')
        .insert([datos])
        .select()
        .single()

      if (err) throw err
      setPoliticas([...politicas, data])
      return data
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al crear'
      setError(mensaje)
      throw err
    }
  }

  const actualizar = async (id: string, datos: Partial<PoliticaSeguridad>) => {
    try {
      const { data, error: err } = await supabase
        .from('hosix_politicas_seguridad')
        .update(datos)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      setPoliticas(politicas.map(p => p.id === id ? data : p))
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
        .from('hosix_politicas_seguridad')
        .delete()
        .eq('id', id)

      if (err) throw err
      setPoliticas(politicas.filter(p => p.id !== id))
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al eliminar'
      setError(mensaje)
      throw err
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  return { politicas, cargando, error, cargar, crear, actualizar, eliminar }
}
