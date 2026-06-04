import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { X, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import {
  useHosixCIE11,
  type DiagnosticoCIE11Seleccionado,
  type ECTEntidad,
} from '@/hooks/useHosixCIE11'
import { toast } from 'sonner'

declare global {
  interface Window {
    ECT: {
      Handler: {
        configure: (settings: object, callbacks?: object) => void
        clear: (instanceId: string) => void
      }
    }
  }
}

const ICD_API = import.meta.env.VITE_ICD_API_URL ?? 'http://localhost:8090'

const TIPO_LABEL: Record<string, string> = {
  principal: 'Principal',
  secundario: 'Secundario',
  complicacion: 'Complicación',
  comorbilidad: 'Comorbilidad',
}

const TIPO_COLOR: Record<string, string> = {
  principal: 'bg-blue-100 text-blue-800 border-blue-200',
  secundario: 'bg-gray-100 text-gray-700 border-gray-200',
  complicacion: 'bg-orange-100 text-orange-800 border-orange-200',
  comorbilidad: 'bg-purple-100 text-purple-700 border-purple-200',
}

const CERTEZA_COLOR: Record<string, string> = {
  confirmado: 'text-green-700',
  presuntivo: 'text-yellow-700',
  diferencial: 'text-gray-500',
}

interface Props {
  onDiagnosticosChange: (diagnosticos: DiagnosticoCIE11Seleccionado[]) => void
  diagnosticosIniciales?: DiagnosticoCIE11Seleccionado[]
  modo?: 'multiple' | 'unico'
  contextoCIE10?: string
  label?: string
  readOnly?: boolean
}

export function DiagnosticoCIE11Selector({
  onDiagnosticosChange,
  diagnosticosIniciales = [],
  modo = 'multiple',
  contextoCIE10,
  label = 'Diagnósticos CIE-11',
  readOnly = false,
}: Props) {
  const { procesarSeleccionECT, procesando } = useHosixCIE11()

  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoCIE11Seleccionado[]>(
    diagnosticosIniciales
  )
  const [expandido, setExpandido] = useState<string | null>(null)
  const ectCargado = useRef(false)

  useEffect(() => {
    if (ectCargado.current || readOnly) return
    ectCargado.current = true

    const cssId = 'ect-css-hosix'
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link')
      link.id = cssId
      link.rel = 'stylesheet'
      link.href = `${ICD_API}/ct/icd11ect-1.8.css`
      document.head.appendChild(link)
    }

    const jsId = 'ect-js-hosix'
    if (!document.getElementById(jsId)) {
      const script = document.createElement('script')
      script.id = jsId
      script.src = `${ICD_API}/ct/icd11ect-1.8.js`
      script.onload = configurarECT
      document.body.appendChild(script)
    } else {
      configurarECT()
    }
  }, [readOnly])

  const configurarECT = () => {
    if (!window.ECT) {
      setTimeout(configurarECT, 300)
      return
    }

    window.ECT.Handler.configure(
      {
        apiServerUrl: ICD_API,
        apiSecured: false,
        minorVersion: '2026-01',
        source: 'mms',
        language: 'es',
        sourceApp: 'HOSIX',
        wordsAvailable: true,
        chaptersAvailable: true,
        flexisearchAvailable: true,
        height: '380px',
      },
      {
        selectedEntityFunction: handleSeleccion,
      }
    )
  }

  const handleSeleccion = async (entidad: ECTEntidad) => {
    if (modo === 'unico' && diagnosticos.length > 0) {
      const confirmar = window.confirm(
        `Ya existe un diagnóstico (${diagnosticos[0].codigo_cie11}). ¿Sustituir por ${entidad.code}?`
      )
      if (!confirmar) {
        window.ECT.Handler.clear('1')
        return
      }
    }

    if (diagnosticos.some(d => d.codigo_cie11 === entidad.code)) {
      toast.warning(`${entidad.code} ya está en la lista`)
      window.ECT.Handler.clear('1')
      return
    }

    const dx = await procesarSeleccionECT(entidad)
    if (!dx) {
      toast.error('Error al procesar el diagnóstico')
      return
    }

    if (diagnosticos.length === 0) dx.tipo_diagnostico = 'principal'

    if (modo === 'unico') {
      actualizar([{ ...dx, tipo_diagnostico: 'principal', certeza: 'confirmado' }])
    } else {
      actualizar([...diagnosticos, dx])
    }

    window.ECT.Handler.clear('1')
  }

  const actualizar = (lista: DiagnosticoCIE11Seleccionado[]) => {
    setDiagnosticos(lista)
    onDiagnosticosChange(lista)
  }

  const eliminar = (codigo: string) => {
    const nueva = diagnosticos.filter(d => d.codigo_cie11 !== codigo)
    if (nueva.length > 0 && !nueva.some(d => d.tipo_diagnostico === 'principal')) {
      nueva[0].tipo_diagnostico = 'principal'
    }
    actualizar(nueva)
  }

  const actualizarCampo = <K extends keyof DiagnosticoCIE11Seleccionado>(
    codigo: string,
    campo: K,
    valor: DiagnosticoCIE11Seleccionado[K]
  ) => {
    const nueva = diagnosticos.map(d => {
      if (d.codigo_cie11 !== codigo) return d
      return { ...d, [campo]: valor }
    })
    if (campo === 'tipo_diagnostico' && valor === 'principal') {
      nueva.forEach(d => {
        if (d.codigo_cie11 !== codigo && d.tipo_diagnostico === 'principal') {
          d.tipo_diagnostico = 'secundario'
        }
      })
    }
    actualizar(nueva)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-800">{label}</label>
        {diagnosticos.length > 0 && (
          <span className="text-xs text-gray-400">
            {diagnosticos.length} diagnóstico{diagnosticos.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {contextoCIE10 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
          Anterior: <span className="font-mono">{contextoCIE10}</span>
        </p>
      )}

      {diagnosticos.map(dx => (
        <div key={dx.codigo_cie11} className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <div className="flex items-start gap-2 p-2.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-bold text-blue-700">{dx.codigo_cie11}</span>
                <span className="text-sm text-gray-900">{dx.titulo_cie11}</span>
                {dx.cie10_equivalente && (
                  <span className="text-xs text-gray-400">(CIE-10: {dx.cie10_equivalente})</span>
                )}
              </div>

              {dx.capitulo_titulo_es && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {dx.capitulo_titulo_es}
                  {dx.bloque_titulo_es && ` › ${dx.bloque_titulo_es}`}
                </p>
              )}

              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {!readOnly ? (
                  <>
                    <select
                      value={dx.tipo_diagnostico}
                      onChange={e =>
                        actualizarCampo(
                          dx.codigo_cie11,
                          'tipo_diagnostico',
                          e.target.value as DiagnosticoCIE11Seleccionado['tipo_diagnostico']
                        )
                      }
                      className={`text-xs rounded px-1.5 py-0.5 border font-medium cursor-pointer ${TIPO_COLOR[dx.tipo_diagnostico]}`}
                    >
                      {Object.entries(TIPO_LABEL).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                    <select
                      value={dx.certeza}
                      onChange={e =>
                        actualizarCampo(
                          dx.codigo_cie11,
                          'certeza',
                          e.target.value as DiagnosticoCIE11Seleccionado['certeza']
                        )
                      }
                      className={`text-xs rounded px-1.5 py-0.5 border cursor-pointer ${CERTEZA_COLOR[dx.certeza]}`}
                    >
                      <option value="presuntivo">Presuntivo</option>
                      <option value="confirmado">Confirmado</option>
                      <option value="diferencial">Diferencial</option>
                    </select>
                  </>
                ) : (
                  <>
                    <Badge variant="outline">{TIPO_LABEL[dx.tipo_diagnostico]}</Badge>
                    <span className={`text-xs ${CERTEZA_COLOR[dx.certeza]}`}>
                      {dx.certeza.charAt(0).toUpperCase() + dx.certeza.slice(1)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {!readOnly && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setExpandido(expandido === dx.codigo_cie11 ? null : dx.codigo_cie11)}
                  className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  {expandido === dx.codigo_cie11 ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => eliminar(dx.codigo_cie11)}
                  className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {expandido === dx.codigo_cie11 && !readOnly && (
            <div className="px-3 pb-3 border-t bg-gray-50">
              <label className="text-xs text-gray-500 block mt-2 mb-1">Observaciones</label>
              <Textarea
                rows={2}
                placeholder="Notas específicas sobre este diagnóstico..."
                value={dx.observaciones ?? ''}
                onChange={e => actualizarCampo(dx.codigo_cie11, 'observaciones', e.target.value)}
                className="text-sm resize-none"
              />
            </div>
          )}
        </div>
      ))}

      {!readOnly && !(modo === 'unico' && diagnosticos.length >= 1) && (
        <div className="relative">
          {procesando && (
            <div className="absolute right-3 top-2.5 z-10">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            </div>
          )}
          <input
            type="text"
            className="ctw-input w-full border border-gray-300 rounded-md px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       placeholder-gray-400"
            autoComplete="off"
            data-ctw-ino="1"
            placeholder="Buscar diagnóstico CIE-11 en español…"
          />
          <div className="ctw-window" data-ctw-ino="1" />
        </div>
      )}

      {diagnosticos.length === 0 && !readOnly && (
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3 shrink-0" />
          Busca y selecciona. El primer diagnóstico será principal.
        </p>
      )}
    </div>
  )
}
