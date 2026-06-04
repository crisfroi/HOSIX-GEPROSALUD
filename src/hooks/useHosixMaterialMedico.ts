import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/hosixClient'

export interface MaterialMedico {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  categoria?: string
  subcategoria?: string
  tipo_material?: string
  especificaciones?: Record<string, any>
  presentacion?: string
  unidad_medida?: string
  requiere_refrigeracion: boolean
  es_estéril: boolean
  fecha_vencimiento: boolean
  proveedor_id?: string
  almacen_id?: string
  precio_unitario?: number
  precio_actualizado?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export function useHosixMaterialMedico() {
  const [materiales, setMateriales] = useState<MaterialMedico[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = async () => {
    setCargando(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('hosix_material_medico')
        .select('*')
        .order('nombre')

      if (err) throw err
      setMateriales(data || [])
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al cargar'
      setError(mensaje)
    } finally {
      setCargando(false)
    }
  }

  const crear = async (datos: Omit<MaterialMedico, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: err } = await supabase
        .from('hosix_material_medico')
        .insert([datos])
        .select()
        .single()

      if (err) throw err
      setMateriales([...materiales, data])
      return data
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al crear'
      setError(mensaje)
      throw err
    }
  }

  const actualizar = async (id: string, datos: Partial<MaterialMedico>) => {
    try {
      const { data, error: err } = await supabase
        .from('hosix_material_medico')
        .update(datos)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      setMateriales(materiales.map(m => m.id === id ? data : m))
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
        .from('hosix_material_medico')
        .delete()
        .eq('id', id)

      if (err) throw err
      setMateriales(materiales.filter(m => m.id !== id))
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al eliminar'
      setError(mensaje)
      throw err
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  return { materiales, cargando, error, cargar, crear, actualizar, eliminar }
}
