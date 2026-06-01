import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/app/supabase'

type Props = {
  pacienteId: string
  episodioId?: string
  escalaCodigoInicial?: string
  onClose?: () => void
  onSuccess?: () => void
}

interface CatalogoEscala {
  codigo: string
  nombre: string
  descripcion: string
  estructura_formulario: {
    items: Array<{
      id: string
      label: string
      opciones: Array<{ valor: number; texto: string }>
    }>
  }
  rango_minimo: number
  rango_maximo: number
  interpretacion_json?: Record<string, string>
}

interface FormData {
  [key: string]: number | string
}

export default function FormularioEscala({
  pacienteId,
  episodioId,
  escalaCodigoInicial,
  onClose,
  onSuccess,
}: Props) {
  const queryClient = useQueryClient()
  const [escalaSeleccionada, setEscalaSeleccionada] = useState<CatalogoEscala | null>(null)
  const [formData, setFormData] = useState<FormData>({})
  const [observaciones, setObservaciones] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  React.useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase.auth.getUser()
      if (!error) {
        setUserId(data?.user?.id ?? null)
      }
    })()
  }, [])

  // Query: Cargar catálogo de escalas
  const { data: catalogo = [] } = useQuery({
    queryKey: ['catalogo-escalas-full'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinico.catalogo_escalas')
        .select('*')
        .eq('activa', true)
        .order('categoria,nombre')

      if (error) throw error
      return data || []
    },
  })

  // Cargar escala inicial si se proporciona
  React.useEffect(() => {
    if (escalaCodigoInicial && catalogo.length > 0) {
      const escala = catalogo.find((e) => e.codigo === escalaCodigoInicial)
      if (escala) {
        setEscalaSeleccionada(escala)
        // Inicializar form con valores por defecto
        const initialForm: FormData = {}
        escala.estructura_formulario.items.forEach((item) => {
          initialForm[item.id] = ''
        })
        setFormData(initialForm)
      }
    }
  }, [escalaCodigoInicial, catalogo])

  // Mutation: Guardar evaluación
  const { mutate: guardarEvaluacion } = useMutation({
    mutationFn: async () => {
      if (!escalaSeleccionada) throw new Error('No hay escala seleccionada')

      // Calcular resultado numérico
      const valores = Object.values(formData).filter((v) => typeof v === 'number') as number[]
      const resultadoNumerico = valores.length > 0 ? valores.reduce((a, b) => a + b, 0) : null

      // Obtener interpretación
      const interpretacionMap = escalaSeleccionada.interpretacion_json || {}
      let interpretacion = 'Resultado dentro del rango'
      Object.entries(interpretacionMap).forEach(([rango, texto]) => {
        // Parse simple de rangos (e.g., "15" o "13-14" o ">8")
        if (resultadoNumerico !== null) {
          const [min, max] = rango.split('-').map((s) => parseInt(s.trim()))
          if (rango.includes('-') && resultadoNumerico >= min && resultadoNumerico <= max) {
            interpretacion = texto as string
          } else if (!rango.includes('-') && parseInt(rango) === resultadoNumerico) {
            interpretacion = texto as string
          }
        }
      })

      const { error } = await supabase.from('clinico.escalas_clinicas').insert({
        paciente_id: pacienteId,
        episodio_id: episodioId || null,
        tipo_escala: escalaSeleccionada.codigo,
        nombre_escala: escalaSeleccionada.nombre,
        datos_entrada: formData,
        resultado_numerico: resultadoNumerico,
        resultado_texto: `${resultadoNumerico?.toFixed(1) || 'N/D'} pts`,
        interpretacion,
        rango_normal: `${escalaSeleccionada.rango_minimo}-${escalaSeleccionada.rango_maximo}`,
        observaciones: observaciones || null,
        evaluado_por: userId,
        created_by: userId,
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalas-paciente', pacienteId] })
      onSuccess?.()
      // Reset
      setFormData({})
      setObservaciones('')
      setEscalaSeleccionada(null)
    },
  })

  const handleSelectEscala = (escala: CatalogoEscala) => {
    setEscalaSeleccionada(escala)
    const initialForm: FormData = {}
    escala.estructura_formulario.items.forEach((item) => {
      initialForm[item.id] = ''
    })
    setFormData(initialForm)
  }

  const handleFormChange = (itemId: string, valor: number | string) => {
    setFormData((prev) => ({ ...prev, [itemId]: valor }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await guardarEvaluacion()
    } finally {
      setIsSubmitting(false)
    }
  }

  // Vista: Selección de escala
  if (!escalaSeleccionada) {
    return (
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="flex items-center justify-between pb-3">
          <CardTitle className="text-base">Nueva Evaluación de Escala Clínica</CardTitle>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            Seleccione una escala clínica para iniciar la evaluación:
          </p>
          <div className="grid gap-2 max-h-96 overflow-y-auto">
            {catalogo.map((escala: CatalogoEscala) => (
              <button
                key={escala.codigo}
                onClick={() => handleSelectEscala(escala)}
                className="text-left rounded-lg border border-slate-200 bg-white p-3 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <p className="font-semibold text-slate-900">{escala.nombre}</p>
                <p className="text-xs text-slate-600 mt-1">{escala.descripcion}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{escala.categoria}</Badge>
                  <span className="text-xs text-slate-500">
                    Rango: {escala.rango_minimo}-{escala.rango_maximo}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Vista: Formulario de evaluación
  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="flex items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">{escalaSeleccionada.nombre}</CardTitle>
          <p className="text-xs text-slate-600 mt-1">{escalaSeleccionada.descripcion}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Items del formulario */}
          {escalaSeleccionada.estructura_formulario.items.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <label className="text-sm font-semibold text-slate-900 block mb-2">
                {item.label}
              </label>
              <div className="space-y-1">
                {item.opciones.map((opcion) => (
                  <label key={opcion.valor} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={item.id}
                      value={opcion.valor}
                      checked={formData[item.id] === opcion.valor}
                      onChange={(e) => handleFormChange(item.id, parseInt(e.target.value))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-700">{opcion.texto}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* Observaciones */}
          <div>
            <label className="text-sm font-semibold text-slate-900 block mb-2">
              Observaciones (Opcional)
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Anotaciones relevantes sobre la evaluación..."
              className="w-full rounded border border-slate-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setEscalaSeleccionada(null)
                setFormData({})
              }}
              className="flex-1 rounded bg-slate-200 text-slate-900 px-4 py-2 hover:bg-slate-300 transition-colors text-sm font-semibold"
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !escalaSeleccionada}
              className="flex-1 rounded bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition-colors text-sm font-semibold disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Evaluación'}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

