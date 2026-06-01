import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ChevronDown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/app/supabase'

interface Gestacion {
  id: string
  numero_gesta: number
  numero_para: number
  edad_gestacional_semanas: number
  fecha_probable_parto: string
  estado: string
  factores_riesgo: string[]
  proxima_cita: string
}

interface Parto {
  id: string
  gestacion_id: string
  tipo_parto: string
  fecha_inicio_parto: string
  duracion_parto_horas: number
  resultado: string
  complicaciones: string[]
}

interface PartogramaRegistro {
  id: string
  timestamp: string
  horas_desde_inicio: number
  dilatacion_cervical_cm: number
  descenso_cefalico: number
  frecuencia_cardiaca_fetal: number
  frecuencia_cardiaca_materna: number
  contracciones_cada_10min: number
  temperatura_celsius: number
  presion_sistolica: number
  presion_diastolica: number
}

type Props = {
  pacienteId: string
}

export default function PartogramaManager({ pacienteId }: Props) {
  const queryClient = useQueryClient()
  const [gestacionSeleccionada, setGestacionSeleccionada] = useState<Gestacion | null>(null)
  const [partoActual, setPartoActual] = useState<Parto | null>(null)
  const [expandedParto, setExpandedParto] = useState<string | null>(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  React.useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase.auth.getUser()
      if (!error) {
        setUserId(data?.user?.id ?? null)
      }
    })()
  }, [])

  // Query: Gestaciones activas
  const { data: gestaciones = [] } = useQuery({
    queryKey: ['gestaciones-activas', pacienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obstetricia.gestaciones')
        .select('*')
        .eq('paciente_id', pacienteId)
        .eq('estado', 'en_curso')
        .order('fecha_probable_parto', { ascending: false })

      if (error) throw error
      return (data as Gestacion[]) || []
    },
    enabled: !!pacienteId,
  })

  // Query: Partos de gestación seleccionada
  const { data: partos = [] } = useQuery({
    queryKey: ['partos-gestacion', gestacionSeleccionada?.id],
    queryFn: async () => {
      if (!gestacionSeleccionada) return []

      const { data, error } = await supabase
        .from('obstetricia.partos')
        .select('*')
        .eq('gestacion_id', gestacionSeleccionada.id)
        .order('fecha_inicio_parto', { ascending: false })

      if (error) throw error
      return (data as Parto[]) || []
    },
    enabled: !!gestacionSeleccionada,
  })

  // Query: Registros del partograma
  const { data: registrosPartograma = [] } = useQuery({
    queryKey: ['partograma-registros', partoActual?.id],
    queryFn: async () => {
      if (!partoActual) return []

      const { data, error } = await supabase
        .from('obstetricia.partograma_registros')
        .select('*')
        .eq('parto_id', partoActual.id)
        .order('timestamp', { ascending: true })

      if (error) throw error
      return (data as PartogramaRegistro[]) || []
    },
    enabled: !!partoActual,
  })

  // Mutation: Crear gestación
  const { mutate: crearGestacion } = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase
        .from('obstetricia.gestaciones')
        .insert([
          {
            paciente_id: pacienteId,
            numero_gesta: formData.numeroGesta,
            numero_para: formData.numeroPara,
            numero_abortos: formData.numeroAbortos,
            fecha_ultima_menstruacion: formData.fechaFUM,
            edad_gestacional_semanas: Math.floor(
              (new Date().getTime() - new Date(formData.fechaFUM).getTime()) / (1000 * 60 * 60 * 24 * 7)
            ),
            fecha_probable_parto: new Date(new Date(formData.fechaFUM).getTime() + 40 * 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            tipo_embarazo: formData.tipoEmbarazo,
            factores_riesgo: formData.factoresRiesgo || [],
            estado: 'en_curso',
            evaluado_por: userId,
            created_by: userId,
          },
        ])

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestaciones-activas', pacienteId] })
      setMostrarFormulario(false)
    },
  })

  // Mutation: Registrar evento del partograma
  const { mutate: registrarPartograma } = useMutation({
    mutationFn: async (datosRegistro: any) => {
      if (!partoActual) throw new Error('No hay parto activo')

      const { error } = await supabase
        .from('obstetricia.partograma_registros')
        .insert([
          {
            parto_id: partoActual.id,
            timestamp: new Date().toISOString(),
            horas_desde_inicio: datosRegistro.horasDesdeInicio,
            dilatacion_cervical_cm: datosRegistro.dilatacionCervical,
            descenso_cefalico: datosRegistro.descendoCefalico,
            frecuencia_cardiaca_fetal: datosRegistro.frecuenciaCardiacaFetal,
            frecuencia_cardiaca_materna: datosRegistro.frecuenciaCardiacaMaterna,
            contracciones_cada_10min: datosRegistro.contracciones,
            temperatura_celsius: datosRegistro.temperatura,
            presion_sistolica: datosRegistro.presionSistolica,
            presion_diastolica: datosRegistro.presionDiastolica,
            liquido_amniotico: datosRegistro.liquidoAmniotico,
            oxitocina_ml_h: datosRegistro.oxitocina,
            observaciones: datosRegistro.observaciones,
            registrado_por: userId,
          },
        ])

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partograma-registros', partoActual?.id] })
    },
  })

  return (
    <div className="space-y-4">
      {/* ============== SELECTOR DE GESTACIÓN ============== */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Gestaciones</CardTitle>
          <p className="text-xs text-slate-500 mt-1">Embarazos activos del paciente</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {gestaciones.length === 0 ? (
            <div className="text-sm text-slate-600 text-center py-4">
              <p>No hay gestaciones activas</p>
              <button
                onClick={() => setMostrarFormulario(true)}
                className="mt-2 text-blue-600 text-xs hover:underline"
              >
                Registrar nueva gestación
              </button>
            </div>
          ) : (
            gestaciones.map((g) => (
              <button
                key={g.id}
                onClick={() => setGestacionSeleccionada(g)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  gestacionSeleccionada?.id === g.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      Gestación {g.numero_gesta} - {g.edad_gestacional_semanas} sem
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Probable parto: {new Date(g.fecha_probable_parto).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {g.estado}
                  </Badge>
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {/* ============== PARTOS DE GESTACIÓN ============== */}
      {gestacionSeleccionada && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Partos Registrados</CardTitle>
              <button
                onClick={() => setMostrarFormulario(true)}
                className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
              >
                <Plus className="h-3 w-3" />
                Nuevo Parto
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {partos.length === 0 ? (
              <div className="text-sm text-slate-600 text-center py-4">
                <p>No hay partos registrados para esta gestación</p>
              </div>
            ) : (
              partos.map((p) => (
                <div key={p.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                  <button
                    onClick={() => {
                      setPartoActual(p)
                      setExpandedParto(expandedParto === p.id ? null : p.id)
                    }}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-slate-900 capitalize">{p.tipo_parto}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(p.fecha_inicio_parto).toLocaleString('es-ES')}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-900 ml-2">{p.resultado}</Badge>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform ${
                        expandedParto === p.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Expandible: Partograma */}
                  {expandedParto === p.id && (
                    <div className="border-t border-slate-200 bg-slate-50 p-3 space-y-3">
                      {/* Gráfica de dilatación cervical */}
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                          Progresión de Dilatación (Partograma)
                        </p>
                        <div className="flex gap-1 items-end h-20 bg-slate-50 p-2 rounded">
                          {registrosPartograma.length === 0 ? (
                            <p className="text-xs text-slate-500 py-8">No hay registros del partograma</p>
                          ) : (
                            registrosPartograma.map((r, idx) => (
                              <div
                                key={r.id}
                                title={`${r.horas_desde_inicio}h: ${r.dilatacion_cervical_cm} cm`}
                                className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                                style={{
                                  height: `${(r.dilatacion_cervical_cm / 10) * 100}%`,
                                  minHeight: '4px',
                                }}
                              />
                            ))
                          )}
                        </div>
                      </div>

                      {/* Tabla de registros */}
                      <div className="bg-white p-2 rounded border border-slate-200 overflow-x-auto">
                        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                          Registros Horarios
                        </p>
                        <table className="w-full text-xs">
                          <thead className="bg-slate-100">
                            <tr>
                              <th className="px-2 py-1 text-left">Hora</th>
                              <th className="px-2 py-1 text-left">Dilatación</th>
                              <th className="px-2 py-1 text-left">FCF</th>
                              <th className="px-2 py-1 text-left">Contracciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {registrosPartograma.map((r) => (
                              <tr key={r.id} className="border-t border-slate-200">
                                <td className="px-2 py-1">{r.horas_desde_inicio}h</td>
                                <td className="px-2 py-1 font-semibold">{r.dilatacion_cervical_cm} cm</td>
                                <td className="px-2 py-1">{r.frecuencia_cardiaca_fetal} lpm</td>
                                <td className="px-2 py-1">{r.contracciones_cada_10min}/10min</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Botón para agregar nuevo registro */}
                      <button
                        onClick={() => {
                          // Aquí iría un modal para agregar nuevo registro
                          console.log('Agregar nuevo registro de partograma')
                        }}
                        className="w-full text-xs bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors"
                      >
                        <TrendingUp className="inline h-3 w-3 mr-1" />
                        Nuevo Registro del Partograma
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
