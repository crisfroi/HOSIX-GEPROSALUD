import { useEffect, useState } from 'react'
import { supabase } from '@/app/supabase'

export interface UsePortalDataOptions {
  hcu?: string
  enabled?: boolean
}

export interface PortalClinicalData {
  citas: any[]
  resultados: any[]
  recetas: any[]
  historial: any[]
  isLoading: boolean
  error: string | null
}

/**
 * Hook reutilizable para cargar datos clínicos del paciente
 * 
 * Carga en paralelo:
 * - Citas próximas
 * - Resultados de laboratorio e imágenes
 * - Recetas activas
 * - Historial clínico
 */
export function usePortalData(options: UsePortalDataOptions = {}): PortalClinicalData {
  const { hcu, enabled = true } = options
  const [data, setData] = useState<PortalClinicalData>({
    citas: [],
    resultados: [],
    recetas: [],
    historial: [],
    isLoading: true,
    error: null
  })

  useEffect(() => {
    if (!enabled || !hcu) {
      setData(prev => ({ ...prev, isLoading: false }))
      return
    }

    loadClinicalData()
  }, [hcu, enabled])

  const loadClinicalData = async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }))

      // Cargar todos los datos en paralelo
      const [citasRes, resultadosRes, recetasRes, historialRes] = await Promise.all([
        // Citas próximas
        supabase
          .from('hosix_citas')
          .select('id, fecha, hora, especialidad, estado, profesional, centro')
          .eq('hcu_paciente', hcu)
          .gt('fecha', new Date().toISOString())
          .order('fecha', { ascending: true })
          .limit(20),

        // Resultados (laboratorio + imagenología)
        Promise.all([
          supabase
            .from('laboratorio_resultados')
            .select('id, fecha_resultado, tipo_prueba, valor, referencia, unidad, estado')
            .eq('hcu_paciente', hcu)
            .order('fecha_resultado', { ascending: false })
            .limit(50),

          supabase
            .from('imagenologia_resultados')
            .select('id, fecha_resultado, tipo_estudio, hallazgos, estado')
            .eq('hcu_paciente', hcu)
            .order('fecha_resultado', { ascending: false })
            .limit(50)
        ]),

        // Recetas activas
        supabase
          .from('hosix_dispensario')
          .select('id, medicamento, presentacion, dosis, fecha_dispensacion, duracion, estado')
          .eq('hcu_paciente', hcu)
          .gte('fecha_dispensacion', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString())
          .order('fecha_dispensacion', { ascending: false })
          .limit(50),

        // Historial clínico
        supabase
          .from('hosix_historia_clinica')
          .select('id, fecha_consulta, diagnostico, tratamiento, profesional_id, especialidad')
          .eq('hcu_paciente', hcu)
          .order('fecha_consulta', { ascending: false })
          .limit(100)
      ])

      // Procesar resultados
      const resultados = [
        ...(citasRes.data?.map(r => ({ ...r, tipo: 'laboratorio' })) || []),
        ...(resultadosRes[1].data?.map(r => ({ ...r, tipo: 'imagenologia' })) || [])
      ]

      setData({
        citas: citasRes.data || [],
        resultados,
        recetas: recetasRes.data || [],
        historial: historialRes.data || [],
        isLoading: false,
        error: null
      })
    } catch (err: any) {
      console.error('Error cargando datos clínicos:', err)
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || 'Error al cargar datos'
      }))
    }
  }

  return data
}
