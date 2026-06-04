import { useState, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/hosixClient'
import { toast } from 'sonner'

const ICD_API = import.meta.env.VITE_ICD_API_URL ?? 'http://localhost:80'
const ICD_RELEASE = '2026-01'
const ICD_LANG = 'es'

// ============================================================================
// TIPOS
// ============================================================================

export interface ECTEntidad {
  code: string
  title: string
  linearizationUri: string
  foundationUri: string
  uri?: string
  postcoordinationCode?: string
}

export interface CIE11CacheRow {
  id: string
  codigo_cie11: string
  linearization_uri: string
  foundation_uri: string | null
  titulo_es: string
  descripcion_es: string | null
  capitulo_codigo: string | null
  capitulo_titulo_es: string | null
  bloque_codigo: string | null
  bloque_titulo_es: string | null
  class_kind: string | null
  cie10_equivalente: string | null
  release_id: string
}

export interface DiagnosticoCIE11Seleccionado {
  codigo_cie11: string
  titulo_cie11: string
  foundation_uri: string
  linearization_uri: string
  capitulo_cie11: string | null
  capitulo_titulo_es: string | null
  bloque_cie11: string | null
  bloque_titulo_es: string | null
  cie10_equivalente: string | null
  tipo_diagnostico: 'principal' | 'secundario' | 'complicacion' | 'comorbilidad'
  certeza: 'presuntivo' | 'confirmado' | 'diferencial'
  observaciones?: string
  postcoordinacion?: Record<string, string>
  cie11_cache_id?: string
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function uriLocal(uriOMS: string): string {
  return uriOMS.replace('http://id.who.int/icd', ICD_API + '/icd')
}

const ICD_HEADERS = {
  Accept: 'application/json',
  'API-Version': 'v2',
  'Accept-Language': ICD_LANG,
}

async function obtenerJerarquia(linearizationUri: string): Promise<{
  capitulo_codigo: string | null
  capitulo_titulo_es: string | null
  bloque_codigo: string | null
  bloque_titulo_es: string | null
  cie10_equivalente: string | null
}> {
  try {
    const res = await fetch(uriLocal(linearizationUri), { headers: ICD_HEADERS })
    if (!res.ok) return {
      capitulo_codigo: null,
      capitulo_titulo_es: null,
      bloque_codigo: null,
      bloque_titulo_es: null,
      cie10_equivalente: null,
    }
    const data = await res.json()

    const ancestorUris: string[] = data.ancestor ?? []
    const ancestros = await Promise.all(
      ancestorUris.map(async (uri: string) => {
        const r = await fetch(uriLocal(uri), { headers: ICD_HEADERS })
        return r.ok ? r.json() : null
      })
    )

    const validos = ancestros.filter(Boolean)
    const capitulo = validos.find((a: any) => a.classKind === 'chapter')
    const bloque = validos.find((a: any) => a.classKind === 'block')

    const cie10 = data.mappedTo?.find((m: any) => m?.['@id']?.includes('icd10'))
    const cie10Codigo = cie10?.code ?? null

    return {
      capitulo_codigo: capitulo?.code ?? null,
      capitulo_titulo_es: capitulo?.title?.['@value'] ?? null,
      bloque_codigo: bloque?.code ?? null,
      bloque_titulo_es: bloque?.title?.['@value'] ?? null,
      cie10_equivalente: cie10Codigo,
    }
  } catch {
    return {
      capitulo_codigo: null,
      capitulo_titulo_es: null,
      bloque_codigo: null,
      bloque_titulo_es: null,
      cie10_equivalente: null,
    }
  }
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useHosixCIE11() {
  const queryClient = useQueryClient()
  const [procesando, setProcesando] = useState(false)

  const buscarEnCache = useCallback(async (termino: string): Promise<CIE11CacheRow[]> => {
    if (!termino || termino.length < 2) return []
    const { data } = await supabase
      .from('hosix_cie11_cache')
      .select('*')
      .or(`titulo_es.ilike.%${termino}%,codigo_cie11.ilike.%${termino}%`)
      .limit(10)
    return (data ?? []) as CIE11CacheRow[]
  }, [])

  const persistirEnCache = useCallback(async (
    entidad: ECTEntidad,
    jerarquia: Awaited<ReturnType<typeof obtenerJerarquia>>
  ): Promise<string | null> => {
    const fila = {
      codigo_cie11: entidad.code,
      linearization_uri: entidad.linearizationUri ?? entidad.uri ?? '',
      foundation_uri: entidad.foundationUri ?? null,
      titulo_es: entidad.title,
      capitulo_codigo: jerarquia.capitulo_codigo,
      capitulo_titulo_es: jerarquia.capitulo_titulo_es,
      bloque_codigo: jerarquia.bloque_codigo,
      bloque_titulo_es: jerarquia.bloque_titulo_es,
      cie10_equivalente: jerarquia.cie10_equivalente,
      release_id: ICD_RELEASE,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('hosix_cie11_cache')
      .upsert(fila, { onConflict: 'linearization_uri' })
      .select('id')
      .single()

    if (error) {
      console.error('[CIE-11 cache] upsert error:', error)
      return null
    }
    return data?.id ?? null
  }, [])

  const procesarSeleccionECT = useCallback(async (
    entidad: ECTEntidad
  ): Promise<DiagnosticoCIE11Seleccionado | null> => {
    setProcesando(true)
    try {
      const jerarquia = await obtenerJerarquia(entidad.linearizationUri ?? entidad.uri ?? '')
      const cacheId = await persistirEnCache(entidad, jerarquia)

      return {
        codigo_cie11: entidad.code,
        titulo_cie11: entidad.title,
        foundation_uri: entidad.foundationUri ?? '',
        linearization_uri: entidad.linearizationUri ?? entidad.uri ?? '',
        capitulo_cie11: jerarquia.capitulo_codigo,
        capitulo_titulo_es: jerarquia.capitulo_titulo_es,
        bloque_cie11: jerarquia.bloque_codigo,
        bloque_titulo_es: jerarquia.bloque_titulo_es,
        cie10_equivalente: jerarquia.cie10_equivalente,
        tipo_diagnostico: 'principal',
        certeza: 'presuntivo',
        cie11_cache_id: cacheId ?? undefined,
      }
    } finally {
      setProcesando(false)
    }
  }, [persistirEnCache])

  const guardarDiagnosticoMutation = useMutation({
    mutationFn: async ({
      pacienteId,
      episodioId,
      tipoEpisodio,
      consultaId,
      medicoId,
      diagnostico,
    }: {
      pacienteId: string
      episodioId?: string
      tipoEpisodio?: string
      consultaId?: string
      medicoId?: string
      diagnostico: DiagnosticoCIE11Seleccionado
    }) => {
      const { data, error } = await supabase
        .from('hosix_diagnosticos')
        .insert({
          paciente_id: pacienteId,
          episodio_id: episodioId ?? null,
          tipo_episodio: tipoEpisodio ?? null,
          consulta_id: consultaId ?? null,
          medico_id: medicoId ?? null,
          codigo_cie10: diagnostico.cie10_equivalente ?? diagnostico.codigo_cie11,
          descripcion_diagnostico: diagnostico.titulo_cie11,
          tipo_diagnostico: diagnostico.tipo_diagnostico,
          certeza: diagnostico.certeza,
          observaciones: diagnostico.observaciones ?? null,
          fecha_diagnostico: new Date().toISOString(),
          cie11_cache_id: diagnostico.cie11_cache_id ?? null,
          codigo_cie11: diagnostico.codigo_cie11,
          titulo_cie11: diagnostico.titulo_cie11,
          foundation_uri: diagnostico.foundation_uri,
          capitulo_cie11: diagnostico.capitulo_cie11,
          bloque_cie11: diagnostico.bloque_cie11,
          postcoordinacion: diagnostico.postcoordinacion ?? null,
        })
        .select('id')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnosticos_paciente'] })
      queryClient.invalidateQueries({ queryKey: ['diagnosticos_catalogo'] })
    },
    onError: (error: any) => {
      toast.error('Error al guardar el diagnóstico: ' + error.message)
    },
  })

  const guardarDiagnosticosConsultaMutation = useMutation({
    mutationFn: async ({
      consultaId,
      diagnosticos,
    }: {
      consultaId: string
      diagnosticos: DiagnosticoCIE11Seleccionado[]
    }) => {
      const cie11Json = diagnosticos.map(d => ({
        codigo: d.codigo_cie11,
        titulo_es: d.titulo_cie11,
        tipo: d.tipo_diagnostico,
        certeza: d.certeza,
        foundation_uri: d.foundation_uri,
        capitulo_codigo: d.capitulo_cie11,
        capitulo_titulo: d.capitulo_titulo_es,
        bloque_codigo: d.bloque_cie11,
        cie10_equivalente: d.cie10_equivalente,
        postcoordinacion: d.postcoordinacion ?? null,
      }))

      const principales = diagnosticos
        .filter(d => d.tipo_diagnostico === 'principal')
        .map(d => d.titulo_cie11)
      const secundarios = diagnosticos
        .filter(d => d.tipo_diagnostico !== 'principal')
        .map(d => d.titulo_cie11)

      const { error } = await supabase
        .from('hosix_consultas_medicas')
        .update({
          diagnosticos_cie11: cie11Json,
          diagnosticos_principales: principales,
          diagnosticos_secundarios: secundarios,
          updated_at: new Date().toISOString(),
        })
        .eq('id', consultaId)

      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consultas_medicas'] }),
    onError: (e: any) => toast.error('Error al guardar diagnósticos: ' + e.message),
  })

  const useDiagnosticosCIE11Paciente = (pacienteId: string) =>
    useQuery({
      queryKey: ['diagnosticos_cie11_paciente', pacienteId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('hosix_diagnosticos')
          .select(`
            id, codigo_cie10, codigo_cie11, titulo_cie11,
            capitulo_cie11, bloque_cie11, tipo_diagnostico,
            certeza, fecha_diagnostico, observaciones
          `)
          .eq('paciente_id', pacienteId)
          .not('codigo_cie11', 'is', null)
          .order('fecha_diagnostico', { ascending: false })

        if (error) throw error
        return data ?? []
      },
      enabled: !!pacienteId,
    })

  return {
    procesando,
    procesarSeleccionECT,
    buscarEnCache,
    guardarDiagnosticoMutation,
    guardarDiagnosticosConsultaMutation,
    useDiagnosticosCIE11Paciente,
  }
}
