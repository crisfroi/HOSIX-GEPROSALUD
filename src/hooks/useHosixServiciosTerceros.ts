import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/hosixClient'

export interface ServicioTercero {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  tipo_servicio?: string
  proveedor_id?: string
  aplica_a?: string[]
  fecha_inicio?: string
  fecha_vencimiento?: string
  periodicidad?: string
  costo_periodo?: number
  responsable_interno_id?: string
  contacto_externo?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export function useHosixServiciosTerceros() {
  const [servicios, setServicios] = useState<ServicioTercero[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = async () => {
    setCargando(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('hosix_servicios_terceros')
        .select('*')
        .order('nombre')

      if (err) throw err
      setServicios(data || [])
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al cargar'
      setError(mensaje)
    } finally {
      setCargando(false)
    }
  }

  const crear = async (datos: Omit<ServicioTercero, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: err } = await supabase
        .from('hosix_servicios_terceros')
        .insert([datos])
        .select()
        .single()

      if (err) throw err
      setServicios([...servicios, data])
      return data
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al crear'
      setError(mensaje)
      throw err
    }
  }

  const actualizar = async (id: string, datos: Partial<ServicioTercero>) => {
    try {
      const { data, error: err } = await supabase
        .from('hosix_servicios_terceros')
        .update(datos)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      setServicios(servicios.map(s => s.id === id ? data : s))
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
        .from('hosix_servicios_terceros')
        .delete()
        .eq('id', id)

      if (err) throw err
      setServicios(servicios.filter(s => s.id !== id))
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al eliminar'
      setError(mensaje)
      throw err
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  return { servicios, cargando, error, cargar, crear, actualizar, eliminar }
}
