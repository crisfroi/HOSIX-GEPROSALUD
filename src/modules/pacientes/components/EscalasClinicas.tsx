import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/app/supabase'
import { FHIRObservation } from '@/shared/types/fhir'
import FormularioEscala from './FormularioEscala'

type Props = {
  pacienteId: string
}

interface EscalaRegistro {
  id: string
  tipo_escala: string
  nombre_escala: string
  resultado_numerico: number | null
  resultado_texto: string | null
  interpretacion: string | null
  rango_normal: string | null
  fecha_evaluacion: string
  observaciones: string | null
  validada: boolean
}

interface CatalogoEscala {
  codigo: string
  nombre: string
  categoria: string
  rango_minimo: number
  rango_maximo: number
  interpretacion_json: Record<string, string>
}

// Categorías de escalas para filtrado
const CATEGORIAS_ESCALAS = [
  'neurologia',
  'geriatria',
  'enfermeria',
  'neonatologia',
  'anestesiologia',
  'psiquiatria',
  'cardiologia',
  'neumologia',
  'cirugia',
  'medicina_interna',
  'medicina_critica',
  'hepatologia',
  'psicosocial',
  'nutricion',
  'neuropsicologia',
]

function mapEscalaToFHIR(escala: EscalaRegistro): FHIRObservation {
  return {
    id: escala.id,
    status: escala.validada ? 'final' : 'preliminary',
    code: { text: escala.nombre_escala },
    valueQuantity: escala.resultado_numerico
      ? { value: escala.resultado_numerico, unit: 'pts' }
      : undefined,
    effectiveDateTime: new Date(escala.fecha_evaluacion).toISOString(),
  }
}

export default function EscalasClinicas({ pacienteId }: Props) {
  const [expandedEscala, setExpandedEscala] = useState<string | null>(null)
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null)
  const [escalaParaEvaluar, setEscalaParaEvaluar] = useState<CatalogoEscala | null>(null)
  const [showFormulario, setShowFormulario] = useState(false)

  const handleStartEvaluation = (escala?: CatalogoEscala) => {
    setEscalaParaEvaluar(escala ?? null)
    setShowFormulario(true)
  }

  const handleCloseForm = () => {
    setEscalaParaEvaluar(null)
    setShowFormulario(false)
  }

  // Query: Obtener catálogo de escalas disponibles
  const { data: catalogo = [] } = useQuery({
    queryKey: ['catalogo-escalas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinico.catalogo_escalas')
        .select('codigo,nombre,categoria,rango_minimo,rango_maximo,interpretacion_json')
        .filter('activa', 'eq', true)
        .order('categoria,nombre')

      if (error) {
        console.error('Error cargando catálogo:', error)
        return []
      }
      return (data as CatalogoEscala[]) || []
    },
  })

  // Query: Obtener últimas evaluaciones de escalas por paciente
  const { data: evaluaciones = [], isLoading } = useQuery({
    queryKey: ['escalas-paciente', pacienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinico.escalas_clinicas')
        .select('id,tipo_escala,nombre_escala,resultado_numerico,resultado_texto,interpretacion,rango_normal,fecha_evaluacion,observaciones,validada')
        .filter('paciente_id', 'eq', pacienteId)
        .order('fecha_evaluacion', { ascending: false })

      if (error) {
        console.error('Error cargando escalas:', error)
        return []
      }
      return (data as EscalaRegistro[]) || []
    },
    enabled: !!pacienteId,
  })

  // Agrupar evaluaciones por tipo de escala (últimas 5)
  const ultimasEscalas = Array.from(
    evaluaciones
      .reduce((map, escala) => {
        const key = escala.tipo_escala
        if (!map.has(key)) {
          map.set(key, [])
        }
        if (map.get(key)!.length < 5) {
          map.get(key)!.push(escala)
        }
        return map
      }, new Map<string, EscalaRegistro[]>())
      .entries()
  )

  // Filtrar por categoría si está seleccionada
  const escalasFiltradasPorTipo = filtroCategoria
    ? catalogo.filter((e: CatalogoEscala) => e.categoria === filtroCategoria)
    : catalogo

  // Obtener categorías únicas del catálogo
  const categoriasDisponibles = Array.from(new Set(catalogo.map((e: CatalogoEscala) => e.categoria)))

  if (isLoading) {
    return <div className="p-4 text-sm text-slate-600">Cargando escalas clínicas...</div>
  }

  const fhirObservations = evaluaciones.map(mapEscalaToFHIR)

  return (
    <div className="space-y-4">
      {/* =============== PANEL: ÚLTIMAS ESCALAS EVALUADAS =============== */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Escalas Clínicas Registradas</CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            {evaluaciones.length} evaluación(es) registrada(s) · {Array.from(new Set(evaluaciones.map(e => e.tipo_escala))).length} escala(s) diferentes
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {evaluaciones.length === 0 ? (
            <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
              <p>No hay escalas clínicas registradas para este paciente.</p>
              <p className="text-xs mt-2">Inicie una evaluación desde el módulo de enfermería.</p>
            </div>
          ) : (
            ultimasEscalas.map(([tipoEscala, registros]) => {
              const ultimoRegistro = registros[0]
              const isExpanded = expandedEscala === tipoEscala

              return (
                <div
                  key={tipoEscala}
                  className="rounded-lg border border-slate-200 bg-white overflow-hidden"
                >
                  {/* Header colapsable */}
                  <button
                    onClick={() => setExpandedEscala(isExpanded ? null : tipoEscala)}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-slate-900">{ultimoRegistro.nombre_escala}</p>
                      <p className="text-xs text-slate-500">
                        Última: {new Date(ultimoRegistro.fecha_evaluacion).toLocaleString('es-ES')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-900">
                        {ultimoRegistro.resultado_numerico?.toFixed(1) || 'N/D'} pts
                      </Badge>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Contenido expandido */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-slate-50 p-3 space-y-3">
                      {/* Interpretación */}
                      {ultimoRegistro.interpretacion && (
                        <div className="rounded bg-white p-2">
                          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                            Interpretación
                          </p>
                          <p className="text-sm text-slate-700 mt-1">{ultimoRegistro.interpretacion}</p>
                        </div>
                      )}

                      {/* Rango */}
                      {ultimoRegistro.rango_normal && (
                        <div className="rounded bg-white p-2">
                          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                            Rango Normal
                          </p>
                          <p className="text-sm text-slate-700 mt-1">{ultimoRegistro.rango_normal}</p>
                        </div>
                      )}

                      {/* Observaciones */}
                      {ultimoRegistro.observaciones && (
                        <div className="rounded bg-white p-2">
                          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                            Observaciones
                          </p>
                          <p className="text-sm text-slate-700 mt-1">{ultimoRegistro.observaciones}</p>
                        </div>
                      )}

                      {/* Historial de evaluaciones */}
                      {registros.length > 1 && (
                        <details className="rounded bg-white p-2">
                          <summary className="cursor-pointer text-xs font-semibold text-slate-700 uppercase">
                            Historial ({registros.length} registros)
                          </summary>
                          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                            {registros.map((r) => (
                              <div key={r.id} className="text-xs text-slate-600 border-l-2 border-slate-300 pl-2 py-1">
                                <p className="font-mono">{r.resultado_numerico?.toFixed(1) || 'N/D'} pts</p>
                                <p className="text-slate-500">
                                  {new Date(r.fecha_evaluacion).toLocaleString('es-ES')}
                                </p>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

                      {/* Status de validación */}
                      <div className="flex gap-2 text-xs">
                        <Badge variant={ultimoRegistro.validada ? 'default' : 'outline'}>
                          {ultimoRegistro.validada ? '✓ Validada' : 'Pendiente validación'}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* =============== PANEL: CATÁLOGO DE ESCALAS DISPONIBLES =============== */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Catálogo de Escalas ({catalogo.length})</CardTitle>
            <button
              type="button"
              onClick={() => handleStartEvaluation()}
              className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
            >
              <Plus className="h-3 w-3" />
              Nueva Evaluación
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Filtro por categoría */}
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setFiltroCategoria(null)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                filtroCategoria === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              Todas
            </button>
            {categoriasDisponibles.map((cat) => (
              <button
                key={cat}
                onClick={() => setFiltroCategoria(cat)}
                className={`text-xs px-2 py-1 rounded transition-colors capitalize ${
                  filtroCategoria === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Grid de escalas */}
          <div className="grid gap-2 sm:grid-cols-2">
            {escalasFiltradasPorTipo.map((escala: CatalogoEscala) => {
              const yaEvaluada = evaluaciones.some((e) => e.tipo_escala === escala.codigo)

              return (
                <div
                  key={escala.codigo}
                  className={`rounded-lg border p-2 text-xs transition-colors ${
                    yaEvaluada
                      ? 'border-green-300 bg-green-50 hover:bg-green-100'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{escala.nombre}</p>
                      <p className="text-slate-600 capitalize">{escala.categoria.replace('_', ' ')}</p>
                      <p className="text-slate-500 mt-1">
                        Rango: {escala.rango_minimo}-{escala.rango_maximo}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      {yaEvaluada ? (
                        <p className="text-green-700 text-[11px] font-semibold">✓ Evaluada</p>
                      ) : (
                        <span className="text-slate-500 text-[11px]">No evaluada</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleStartEvaluation(escala)}
                        className="rounded bg-blue-600 px-2 py-1 text-white text-[11px] font-semibold hover:bg-blue-700 transition-colors"
                      >
                        {yaEvaluada ? 'Reevaluar' : 'Evaluar'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {escalasFiltradasPorTipo.length === 0 && (
            <div className="text-center text-sm text-slate-500 py-4">
              No hay escalas en esta categoría.
            </div>
          )}
        </CardContent>
      </Card>

      {showFormulario && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Formulario de evaluación</p>
              <p className="text-xs text-slate-500">
                {escalaParaEvaluar
                  ? `Evaluando ${escalaParaEvaluar.nombre}`
                  : 'Seleccione la escala a evaluar en el catálogo o inicie una nueva evaluación.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseForm}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Cerrar
            </button>
          </div>
          <FormularioEscala
            pacienteId={pacienteId}
            escalaCodigoInicial={escalaParaEvaluar?.codigo}
            onClose={handleCloseForm}
            onSuccess={handleCloseForm}
          />
        </div>
      )}

      {/* =============== PANEL: VISTA FHIR (DEBUG) =============== */}
      <details className="rounded border border-slate-200 bg-white p-3">
        <summary className="cursor-pointer font-medium text-sm text-slate-600">
          Ver objetos FHIR Observations ({fhirObservations.length})
        </summary>
        <pre className="mt-3 overflow-x-auto text-xs text-slate-700 bg-slate-50 p-2 rounded">
          {JSON.stringify(fhirObservations, null, 2)}
        </pre>
      </details>
    </div>
  )
}
