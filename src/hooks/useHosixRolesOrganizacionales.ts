import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/hosixClient'

export interface RolOrganizacional {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  nivel_jerarquico?: number
  permisos?: Record<string, boolean>
  activo: boolean
  created_at: string
  updated_at: string
}

export function useHosixRolesOrganizacionales() {
  const [roles, setRoles] = useState<RolOrganizacional[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = async () => {
    setCargando(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('hosix_roles_organizacionales')
        .select('*')
        .order('nivel_jerarquico')

      if (err) throw err
      setRoles(data || [])
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al cargar'
      setError(mensaje)
    } finally {
      setCargando(false)
    }
  }

  const crear = async (datos: Omit<RolOrganizacional, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: err } = await supabase
        .from('hosix_roles_organizacionales')
        .insert([datos])
        .select()
        .single()

      if (err) throw err
      setRoles([...roles, data])
      return data
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al crear'
      setError(mensaje)
      throw err
    }
  }

  const actualizar = async (id: string, datos: Partial<RolOrganizacional>) => {
    try {
      const { data, error: err } = await supabase
        .from('hosix_roles_organizacionales')
        .update(datos)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      setRoles(roles.map(r => r.id === id ? data : r))
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
        .from('hosix_roles_organizacionales')
        .delete()
        .eq('id', id)

      if (err) throw err
      setRoles(roles.filter(r => r.id !== id))
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al eliminar'
      setError(mensaje)
      throw err
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  return { roles, cargando, error, cargar, crear, actualizar, eliminar }
}
