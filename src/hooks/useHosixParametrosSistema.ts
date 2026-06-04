import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/hosixClient'

export interface ParametroSistema {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  valor_texto?: string
  valor_numero?: number
  valor_booleano?: boolean
  valor_json?: Record<string, any>
  tipo_parametro: 'texto' | 'numero' | 'booleano' | 'json' | 'fecha'
  categoría?: string
  requiere_admin: boolean
  es_confidencial: boolean
  modified_by?: string
  fecha_modificacion?: string
  created_at: string
  updated_at: string
}

export function useHosixParametrosSistema() {
  const [parametros, setParametros] = useState<ParametroSistema[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = async () => {
    setCargando(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('hosix_parametros_sistema')
        .select('*')
        .order('categoría, nombre')

      if (err) throw err
      setParametros(data || [])
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al cargar'
      setError(mensaje)
    } finally {
      setCargando(false)
    }
  }

  const actualizar = async (id: string, datos: Partial<ParametroSistema>) => {
    try {
      const { data, error: err } = await supabase
        .from('hosix_parametros_sistema')
        .update({
          ...datos,
          fecha_modificacion: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      setParametros(parametros.map(p => p.id === id ? data : p))
      return data
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al actualizar'
      setError(mensaje)
      throw err
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  return { parametros, cargando, error, cargar, actualizar }
}
