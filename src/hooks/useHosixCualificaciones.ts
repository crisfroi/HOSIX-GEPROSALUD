import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/hosixClient'

export interface Cualificacion {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  nivel?: string
  duracion_horas?: number
  institucion?: string
  vigencia_años?: number
  requiere_recertificacion: boolean
  activo: boolean
  created_at: string
  updated_at: string
}

export interface CualificacionProf {
  id: string
  usuario_id: string
  cualificacion_id: string
  fecha_obtencion?: string
  fecha_vencimiento?: string
  número_certificado?: string
  institucion_emisora?: string
  documento_url?: string
  vigente: boolean
  created_at: string
  updated_at: string
}

export function useHosixCualificaciones() {
  const [cualificaciones, setCualificaciones] = useState<Cualificacion[]>([])
  const [cualificacionesProf, setCualificacionesProf] = useState<CualificacionProf[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = async () => {
    setCargando(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('hosix_cualificaciones_profesionales')
        .select('*')
        .order('nombre')

      if (err) throw err
      setCualificaciones(data || [])
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al cargar'
      setError(mensaje)
    } finally {
      setCargando(false)
    }
  }

  const cargarProfesionales = async (usuarioId: string) => {
    try {
      const { data, error: err } = await supabase
        .from('hosix_usuarios_cualificaciones')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('fecha_obtencion', { ascending: false })

      if (err) throw err
      setCualificacionesProf(data || [])
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al cargar cualificaciones'
      setError(mensaje)
    }
  }

  const crear = async (datos: Omit<Cualificacion, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: err } = await supabase
        .from('hosix_cualificaciones_profesionales')
        .insert([datos])
        .select()
        .single()

      if (err) throw err
      setCualificaciones([...cualificaciones, data])
      return data
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al crear'
      setError(mensaje)
      throw err
    }
  }

  const actualizar = async (id: string, datos: Partial<Cualificacion>) => {
    try {
      const { data, error: err } = await supabase
        .from('hosix_cualificaciones_profesionales')
        .update(datos)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      setCualificaciones(cualificaciones.map(c => c.id === id ? data : c))
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
        .from('hosix_cualificaciones_profesionales')
        .delete()
        .eq('id', id)

      if (err) throw err
      setCualificaciones(cualificaciones.filter(c => c.id !== id))
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al eliminar'
      setError(mensaje)
      throw err
    }
  }

  const asignarCualificacion = async (usuarioId: string, cualificacionId: string, datos: Partial<CualificacionProf>) => {
    try {
      const { data, error: err } = await supabase
        .from('hosix_usuarios_cualificaciones')
        .insert([{ usuario_id: usuarioId, cualificacion_id: cualificacionId, ...datos }])
        .select()
        .single()

      if (err) throw err
      setCualificacionesProf([...cualificacionesProf, data])
      return data
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al asignar cualificación'
      setError(mensaje)
      throw err
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  return {
    cualificaciones,
    cualificacionesProf,
    cargando,
    error,
    cargar,
    cargarProfesionales,
    crear,
    actualizar,
    eliminar,
    asignarCualificacion,
  }
}
