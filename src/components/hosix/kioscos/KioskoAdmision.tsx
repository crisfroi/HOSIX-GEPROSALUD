import React, { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/hosixClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, Printer, Loader2, Ticket } from 'lucide-react'
import { toast } from 'sonner'

interface KioskoAdmisionProps {
  onBack?: () => void
}

export const KioskoAdmision: React.FC<KioskoAdmisionProps> = ({ onBack }) => {
  const [cedula, setCedula] = useState('')
  const [tipoSolicitud, setTipoSolicitud] = useState('')
  const [pacienteData, setPacienteData] = useState<any>(null)
  const [ticketGenerado, setTicketGenerado] = useState<any>(null)
  const [step, setStep] = useState<'cedula' | 'tipo' | 'ticket'>('cedula')

  // Cargar tipos de solicitud disponibles
  const { data: tiposSolicitud = [] } = useQuery({
    queryKey: ['tipos_solicitud_lista_espera'],
    queryFn: async () => {
      // Retorna tipos de solicitud disponibles
      return [
        { value: 'consulta_ambulatoria', label: 'Consulta Ambulatoria' },
        { value: 'hospitalizacion', label: 'Hospitalización' },
        { value: 'cirugia', label: 'Cirugía' },
        { value: 'examen_diagnostico', label: 'Examen Diagnóstico' },
      ]
    },
  })

  const buscarPacienteMutation = useMutation({
    mutationFn: async () => {
      if (!cedula.trim()) {
        throw new Error('Por favor ingresa tu número de cédula')
      }

      const { data: paciente, error } = await supabase
        .from('hosix_pacientes')
        .select('id, nombre_completo, numero_cedula, edad, sexo')
        .eq('numero_cedula', cedula)
        .single()

      if (error || !paciente) {
        throw new Error('Cédula no encontrada. Por favor intenta de nuevo.')
      }

      return paciente
    },
    onSuccess: (paciente) => {
      setPacienteData(paciente)
      setStep('tipo')
      toast.success('Paciente encontrado')
    },
    onError: (error: any) => {
      toast.error(error.message)
    },
  })

  const generarTicketMutation = useMutation({
    mutationFn: async () => {
      if (!tipoSolicitud) {
        throw new Error('Por favor selecciona un tipo de solicitud')
      }

      // Generar número único de ticket/posición en lista
      const { count } = await supabase
        .from('hosix_lista_espera')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'activa')
        .eq('tipo_solicitud', tipoSolicitud)

      const numeroTicket = (count || 0) + 1

      // Crear registro en lista de espera
      const { data: listaEspera, error } = await supabase
        .from('hosix_lista_espera')
        .insert({
          paciente_id: pacienteData.id,
          tipo_solicitud: tipoSolicitud,
          prioridad: 'media',
          motivo: `Admisión automática desde kiosko - ${new Date().toLocaleString()}`,
          estado: 'activa',
        })
        .select()
        .single()

      if (error) throw error

      return {
        ticket: listaEspera,
        numeroTicket,
        paciente: pacienteData,
      }
    },
    onSuccess: (data) => {
      setTicketGenerado(data)
      setStep('ticket')
      toast.success('¡Ticket generado exitosamente!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al generar ticket')
    },
  })

  // Paso 1: Ingreso de cédula
  if (step === 'cedula') {
    return (
      <Card className="w-full">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardTitle className="flex items-center justify-center gap-3 text-3xl">
            <Ticket className="h-8 w-8" />
            Generar Ticket de Admisión
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-12 space-y-8">
          <div className="text-center space-y-4">
            <p className="text-lg text-gray-600">
              Ingresa tu número de cédula para generar tu número de turno
            </p>

            <Input
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Ejemplo: 123-456-789"
              onKeyPress={(e) => e.key === 'Enter' && buscarPacienteMutation.mutate()}
              className="text-center text-2xl py-6"
              autoComplete="off"
            />

            <Button
              onClick={() => buscarPacienteMutation.mutate()}
              disabled={buscarPacienteMutation.isPending || !cedula.trim()}
              className="w-full bg-orange-600 hover:bg-orange-700 py-6 text-lg"
            >
              {buscarPacienteMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                'Continuar'
              )}
            </Button>
          </div>

          <div className="bg-orange-50 p-6 rounded-lg border border-orange-200 text-center">
            <p className="text-orange-900 text-sm leading-relaxed">
              Este sistema genera automáticamente tu número de turno en la lista de espera.
              No es necesario esperar en la recepción.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Paso 2: Selección de tipo de solicitud
  if (step === 'tipo' && pacienteData) {
    return (
      <Card className="w-full">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardTitle className="text-2xl">Selecciona el Tipo de Servicio</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Datos del paciente */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div>
              <p className="text-sm text-gray-600">Paciente</p>
              <p className="text-xl font-bold">{pacienteData.nombre_completo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Cédula</p>
              <p className="text-lg font-semibold">{pacienteData.numero_cedula}</p>
            </div>
          </div>

          {/* Tipos de solicitud */}
          <div>
            <label className="block text-sm font-medium mb-3">
              ¿Qué servicio necesitas?
            </label>
            <div className="space-y-3">
              {tiposSolicitud.map((tipo) => (
                <div
                  key={tipo.value}
                  onClick={() => setTipoSolicitud(tipo.value)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    tipoSolicitud === tipo.value
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 bg-white hover:border-orange-300'
                  }`}
                >
                  <p className="font-semibold text-lg">{tipo.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => {
                setStep('cedula')
                setPacienteData(null)
                setCedula('')
              }}
              variant="outline"
              className="flex-1"
            >
              Atrás
            </Button>
            <Button
              onClick={() => generarTicketMutation.mutate()}
              disabled={generarTicketMutation.isPending || !tipoSolicitud}
              className="flex-1 bg-orange-600 hover:bg-orange-700 py-6 text-lg"
            >
              {generarTicketMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                'Generar Ticket'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Paso 3: Ticket generado
  if (step === 'ticket' && ticketGenerado) {
    const tipoLabel = tiposSolicitud.find((t) => t.value === ticketGenerado.ticket.tipo_solicitud)?.label

    return (
      <Card className="w-full border-green-300 bg-green-50">
        <CardHeader className="bg-green-600 text-white">
          <CardTitle className="flex items-center justify-center gap-3 text-3xl">
            <CheckCircle className="h-10 w-10" />
            ¡TICKET GENERADO!
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8 space-y-6">
          {/* Número de ticket grande */}
          <div className="text-center bg-white p-8 rounded-lg border-4 border-green-400">
            <p className="text-gray-600 text-lg mb-2">Tu Número de Turno</p>
            <p className="text-7xl font-bold text-green-600">
              {String(ticketGenerado.numeroTicket).padStart(3, '0')}
            </p>
          </div>

          {/* Detalles */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Tipo de Servicio</p>
                <p className="font-bold">{tipoLabel}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Estado</p>
                <Badge className="bg-green-600">En Lista</Badge>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-green-200">
              <p className="text-sm text-gray-600 mb-1">Paciente</p>
              <p className="font-bold text-lg">{ticketGenerado.paciente.nombre_completo}</p>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="space-y-2">
              <p className="font-semibold text-blue-900 mb-3">Próximos Pasos:</p>
              <ol className="space-y-2 text-blue-800 text-sm">
                <li>✓ Tu número de turno: <strong>#{String(ticketGenerado.numeroTicket).padStart(3, '0')}</strong></li>
                <li>✓ Dirígete a la zona de espera correspondiente</li>
                <li>✓ Espera a que sea llamado tu número</li>
                <li>✓ Presenta tu cédula al ser llamado</li>
              </ol>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button onClick={() => window.print()} className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
              <Printer className="h-4 w-4" />
              Imprimir Ticket
            </Button>
            <Button
              onClick={() => {
                setStep('cedula')
                setPacienteData(null)
                setTicketGenerado(null)
                setCedula('')
                setTipoSolicitud('')
              }}
              variant="outline"
              className="flex-1"
            >
              Nuevo Ticket
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}

export default KioskoAdmision
