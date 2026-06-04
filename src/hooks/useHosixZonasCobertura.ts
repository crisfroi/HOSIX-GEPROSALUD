import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/hosixClient'

export interface ZonaCobertura {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  provincia_id?: string
  distrito_id?: string
  limites_geograficos?: string
  población_cobertura?: number
  responsable_id?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export function useHosixZonasCobertura() {
  const [zonas, setZonas] = useState<ZonaCobertura[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = async () => {
    setCargando(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('hosix_zonas_cobertura')
        .select('*')
        .order('nombre')

      if (err) throw err
      setZonas(data || [])
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al cargar'
      setError(mensaje)
    } finally {
      setCargando(false)
    }
  }

  const crear = async (datos: Omit<ZonaCobertura, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: err } = await supabase
        .from('hosix_zonas_cobertura')
        .insert([datos])
        .select()
        .single()

      if (err) throw err
      setZonas([...zonas, data])
      return data
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al crear'
      setError(mensaje)
      throw err
    }
  }

  const actualizar = async (id: string, datos: Partial<ZonaCobertura>) => {
    try {
      const { data, error: err } = await supabase
        .from('hosix_zonas_cobertura')
        .update(datos)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      setZonas(zonas.map(z => z.id === id ? data : z))
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
        .from('hosix_zonas_cobertura')
        .delete()
        .eq('id', id)

      if (err) throw err
      setZonas(zonas.filter(z => z.id !== id))
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al eliminar'
      setError(mensaje)
      throw err
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  return { zonas, cargando, error, cargar, crear, actualizar, eliminar }
}
