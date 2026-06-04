import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/hosixClient'

export interface Proveedor {
  id: string
  codigo: string
  nombre: string
  tipo_proveedor?: string
  telefono?: string
  email?: string
  sitio_web?: string
  nif_ruc?: string
  pais_origen?: string
  terminos_pago?: string
  plazo_entrega_dias?: number
  descuento_volumen?: number
  es_autorizado: boolean
  es_preferente: boolean
  contacto_principal?: string
  telefono_contacto?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export function useHosixProveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = async () => {
    setCargando(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('hosix_proveedores')
        .select('*')
        .order('nombre')

      if (err) throw err
      setProveedores(data || [])
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al cargar'
      setError(mensaje)
    } finally {
      setCargando(false)
    }
  }

  const crear = async (datos: Omit<Proveedor, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: err } = await supabase
        .from('hosix_proveedores')
        .insert([datos])
        .select()
        .single()

      if (err) throw err
      setProveedores([...proveedores, data])
      return data
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al crear'
      setError(mensaje)
      throw err
    }
  }

  const actualizar = async (id: string, datos: Partial<Proveedor>) => {
    try {
      const { data, error: err } = await supabase
        .from('hosix_proveedores')
        .update(datos)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      setProveedores(proveedores.map(p => p.id === id ? data : p))
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
        .from('hosix_proveedores')
        .delete()
        .eq('id', id)

      if (err) throw err
      setProveedores(proveedores.filter(p => p.id !== id))
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al eliminar'
      setError(mensaje)
      throw err
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  return { proveedores, cargando, error, cargar, crear, actualizar, eliminar }
}
