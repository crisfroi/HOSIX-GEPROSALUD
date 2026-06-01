import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Clock, ShieldCheck, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/app/supabase'
import { FHIREncounter } from '@/shared/types/fhir'

type Props = {
  pacienteId: string
}

function mapEpisodioToFHIREncounter(episodio: any): FHIREncounter {
  return {
    id: episodio.id,
    status: episodio.estado || 'unknown',
    class: { code: episodio.tipo_encuentro || 'emergency' },
    period: {
      start: episodio.fecha_entrada,
      end: episodio.fecha_salida,
    },
  }
}

export default function TimelineEpisodios({ pacienteId }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: episodios = [], isLoading } = useQuery({
    queryKey: ['hc-episodios', pacienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_urgencias_episodios')
        .select(
          'id,fecha_entrada,fecha_salida,diagnostico_inicial,diagnostico_final,estado,lugar_entrada,procedencia,nivel_triage,tipo_encuentro'
        )
        .eq('paciente_id', pacienteId)
        .order('fecha_entrada', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!pacienteId,
  })

  if (isLoading) {
    return <div className="p-4 text-sm text-slate-600">Cargando episodios clínicos...</div>
  }

  if (!episodios.length) {
    return <div className="p-4 text-slate-500">No se encontraron episodios para este paciente.</div>
  }

  return (
    <div className="space-y-3">
      {episodios.map((episodio: any) => {
        const encounter = mapEpisodioToFHIREncounter(episodio)
        const isOpen = expandedId === episodio.id

        return (
          <Card
            key={episodio.id}
            className="border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <CardHeader className="cursor-pointer" onClick={() => setExpandedId(isOpen ? null : episodio.id)}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">{episodio.diagnostico_inicial || 'Episodio sin diagnóstico'}</CardTitle>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(episodio.fecha_entrada).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {episodio.nivel_triage ? `Triage ${episodio.nivel_triage}` : 'Triage no definido'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {encounter.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="uppercase tracking-[0.08em] text-[10px]">
                  {episodio.tipo_encuentro || 'GENERAL'}
                </Badge>
              </div>
            </CardHeader>

            {isOpen && (
              <CardContent className="space-y-3 border-t border-slate-200 pt-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 uppercase">Lugar de ingreso</p>
                    <p className="text-sm text-slate-800">{episodio.lugar_entrada || 'No definido'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 uppercase">Procedencia</p>
                    <p className="text-sm text-slate-800">{episodio.procedencia || 'No definido'}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 uppercase">Diagnóstico final</p>
                    <p className="text-sm text-slate-800">{episodio.diagnostico_final || 'Pendiente'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 uppercase">Periodo clínico</p>
                    <p className="text-sm text-slate-800">
                      {encounter.period?.start ? new Date(encounter.period.start).toLocaleString('es-ES') : 'Sin inicio'}
                      {' — '}
                      {encounter.period?.end ? new Date(encounter.period.end).toLocaleString('es-ES') : 'En curso'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ChevronDown className="h-4 w-4" />
                  <span>Toque para colapsar / expandir detalles del encuentro</span>
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}

