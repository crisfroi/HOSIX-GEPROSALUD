import { useState } from 'react'
import { supabase } from '@/integrations/supabase/hosixClient'

export type AlertSeverity = 'critica' | 'advertencia' | 'info'
export type AlertType = 'interaccion' | 'alergia' | 'dosis' | 'duplicado' | 'otro'

export interface Alert {
  id: string
  tipo: AlertType
  severidad: AlertSeverity
  mensaje: string
  campo?: string
}

export interface CDSPrescriptionEvaluationResult {
  alertas: Alert[]
  alertasCriticas: number
  alertasAdvertencia: number
  alertasInfo: number
  resumen: string
}

export interface EvaluarPrescripcionParams {
  pacienteId: string
  medicamentoId: string
  nombreMedicamento: string
  dosis: number
  unidadDosis: string
  viasAdministracion: string
  frecuencia: string
  duracionDias: number
  indicaciones: string
  observaciones: string
  medicamentosActuales: string[]
  edadPaciente?: number
  pesoPaciente?: number
  funcionRenal?: string
}

export interface IgnorarAlertaParams {
  prescripcionId: string
  reglaId: string
  alerta: Alert
  motivo: string
  justificacionClinica: string
}

function crearResultadoCDS(alertas: Alert[]): CDSPrescriptionEvaluationResult {
  const alertasCriticas = alertas.filter(a => a.severidad === 'critica').length
  const alertasAdvertencia = alertas.filter(a => a.severidad === 'advertencia').length
  const alertasInfo = alertas.filter(a => a.severidad === 'info').length

  return {
    alertas,
    alertasCriticas,
    alertasAdvertencia,
    alertasInfo,
    resumen: `Alertas: ${alertasCriticas} críticas, ${alertasAdvertencia} advertencias, ${alertasInfo} info`
  }
}

function evaluarReglas(params: EvaluarPrescripcionParams): Alert[] {
  const alertas: Alert[] = []
  const { nombreMedicamento, dosis, unidadDosis, medicamentosActuales, funcionRenal } = params
  const nombre = nombreMedicamento.toLowerCase()

  if (nombre.includes('penicilina') && medicamentosActuales.some(m => m.toLowerCase().includes('alergia'))) {
    alertas.push({
      id: 'cds-alergia-penicilina',
      tipo: 'alergia',
      severidad: 'critica',
      mensaje: 'Posible alergia a penicilina. Revisar historia clínica antes de continuar.',
      campo: 'medicamentoId'
    })
  }

  if (unidadDosis === 'mg' && dosis > 1000) {
    alertas.push({
      id: 'cds-dosis-alta',
      tipo: 'dosis',
      severidad: 'advertencia',
      mensaje: 'La dosis ingresada excede 1000 mg. Verificar indicaciones y posible ajuste.',
      campo: 'dosis'
    })
  }

  if (medicamentosActuales.some(m => m.toLowerCase() === nombre)) {
    alertas.push({
      id: 'cds-duplicado-medicamento',
      tipo: 'duplicado',
      severidad: 'advertencia',
      mensaje: 'El paciente ya tiene una prescripción activa para este medicamento.',
      campo: 'medicamentoId'
    })
  }

  if (funcionRenal === 'disminuida' && nombre.includes('metformina')) {
    alertas.push({
      id: 'cds-metformina-funcion-renal',
      tipo: 'interaccion',
      severidad: 'advertencia',
      mensaje: 'Paciente con función renal disminuida. Ajustar dosis o considerar alternativa.',
      campo: 'medicamentoId'
    })
  }

  if (nombre.includes('warfarina')) {
    alertas.push({
      id: 'cds-warfarina-interaccion',
      tipo: 'interaccion',
      severidad: 'critica',
      mensaje: 'Warfarina requiere monitoreo estrecho y revisión de interacciones farmacológicas.',
      campo: 'medicamentoId'
    })
  }

  return alertas
}

export function agruparAlertasPorSeveridad(alertas: Alert[]) {
  return alertas.reduce<Record<string, Alert[]>>((grupo, alerta) => {
    const nivel = alerta.severidad || 'info'
    if (!grupo[nivel]) {
      grupo[nivel] = []
    }
    grupo[nivel].push(alerta)
    return grupo
  }, {})
}

export function obtenerColorSeveridad(severidad: AlertSeverity) {
  switch (severidad) {
    case 'critica':
      return 'text-red-600'
    case 'advertencia':
      return 'text-orange-600'
    case 'info':
    default:
      return 'text-blue-600'
  }
}

export function obtenerIconoSeveridad(severidad: AlertSeverity) {
  switch (severidad) {
    case 'critica':
      return '⚠️'
    case 'advertencia':
      return 'ℹ️'
    default:
      return '💡'
  }
}

export const useCDSEngine = () => {
  const [evaluandoPrescripcion, setEvaluandoPrescripcion] = useState(false)
  const [pacienteInfo, setPacienteInfo] = useState<any>(null)

  const evaluarPrescripcion = (params: EvaluarPrescripcionParams) => {
    const alertas = evaluarReglas(params)
    return crearResultadoCDS(alertas)
  }

  const evaluarPrescripcionAsync = async (params: EvaluarPrescripcionParams) => {
    setEvaluandoPrescripcion(true)
    try {
      const alertas = evaluarReglas(params)
      return crearResultadoCDS(alertas)
    } finally {
      setEvaluandoPrescripcion(false)
    }
  }

  const ignorarAlerta = async (params: IgnorarAlertaParams) => {
    console.debug('CDS alerta ignorada', params)
    return {
      ...params,
      ignoradaEn: new Date().toISOString()
    }
  }

  const obtenerMedicamentosActuales = async (pacienteId: string) => {
    try {
      const { data, error } = await supabase
        .from('hosix_prescripciones')
        .select('nombre_medicamento')
        .eq('paciente_id', pacienteId)
        .eq('estado', 'activa')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []).map((item: any) => item.nombre_medicamento || '').filter(Boolean)
    } catch (error) {
      console.error('Error obteniendo medicamentos actuales:', error)
      return []
    }
  }

  const obtenerDosisPediatrica = (pesoKg: number, mgPorKg: number) => {
    if (!pesoKg || !mgPorKg) {
      return null
    }
    return Math.round(pesoKg * mgPorKg * 10) / 10
  }

  return {
    evaluarPrescripcion,
    evaluarPrescripcionAsync,
    ignorarAlerta,
    obtenerMedicamentosActuales,
    obtenerDosisPediatrica,
    evaluandoPrescripcion,
    pacienteInfo,
    setPacienteInfo
  }
}
