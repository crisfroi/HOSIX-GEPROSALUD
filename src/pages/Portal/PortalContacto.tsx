import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/app/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function PortalContacto() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    asunto: '',
    mensaje: '',
    tipo_contacto: 'soporte'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/portal/login')
        return
      }

      const { data: paciente } = await supabase
        .from('portal_pacientes')
        .select('id, nombre_completo, telefono')
        .eq('id', user.id)
        .single()

      // Crear ticket de contacto
      const { error } = await supabase
        .from('portal_contacto')
        .insert({
          paciente_id: paciente.id,
          asunto: formData.asunto,
          mensaje: formData.mensaje,
          tipo_contacto: formData.tipo_contacto,
          estado: 'abierto',
          nombre_contactante: paciente.nombre_completo,
          telefono_contactante: paciente.telefono
        })

      if (error) throw error

      toast.success('Mensaje enviado correctamente')
      setSubmitted(true)
      setFormData({ asunto: '', mensaje: '', tipo_contacto: 'soporte' })

      // Limpiar después de 3 segundos
      setTimeout(() => setSubmitted(false), 3000)

    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al enviar mensaje')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contacto y Soporte</h1>
        <p className="text-gray-600 mt-2">
          Ponte en contacto con tu centro de salud o reporta un problema
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información de contacto */}
        <div className="space-y-4">
          {/* Teléfono */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600" />
                Teléfono
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">+240 222 100 000</p>
              <p className="text-sm text-gray-600 mt-1">Centro de Salud Principal</p>
            </CardContent>
          </Card>

          {/* Email */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Mail className="h-4 w-4 text-green-600" />
                Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-sm break-all">contacto@hosix.local</p>
              <p className="text-sm text-gray-600 mt-1">Soporte técnico</p>
            </CardContent>
          </Card>

          {/* Ubicación */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-600" />
                Centro de Salud
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold">Hospital General de Sampaka</p>
              <p className="text-sm text-gray-600 mt-2">Av. Principal, Malabo</p>
              <p className="text-sm text-gray-600">Guinea Ecuatorial</p>
            </CardContent>
          </Card>

          {/* Horario */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                Horario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p><span className="font-medium">Lunes - Viernes:</span> 08:00 - 17:00</p>
              <p><span className="font-medium">Sábados:</span> 09:00 - 13:00</p>
              <p className="text-gray-600">Domingos: Cerrado</p>
            </CardContent>
          </Card>
        </div>

        {/* Formulario de contacto */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Enviar Mensaje</CardTitle>
              <CardDescription>
                Cuéntanos cómo podemos ayudarte
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    ¡Gracias por tu mensaje! Nos pondremos en contacto pronto.
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Tipo de contacto */}
                  <div>
                    <Label htmlFor="tipo">Tipo de Contacto</Label>
                    <select
                      id="tipo"
                      value={formData.tipo_contacto}
                      onChange={(e) =>
                        setFormData({ ...formData, tipo_contacto: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      disabled={isLoading}
                    >
                      <option value="soporte">Soporte Técnico</option>
                      <option value="cita">Solicitud de Cita</option>
                      <option value="consulta">Consulta Médica</option>
                      <option value="reclamo">Reclamo</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  {/* Asunto */}
                  <div>
                    <Label htmlFor="asunto">Asunto</Label>
                    <Input
                      id="asunto"
                      placeholder="Breve descripción del motivo"
                      value={formData.asunto}
                      onChange={(e) =>
                        setFormData({ ...formData, asunto: e.target.value })
                      }
                      disabled={isLoading}
                      required
                    />
                  </div>

                  {/* Mensaje */}
                  <div>
                    <Label htmlFor="mensaje">Mensaje</Label>
                    <Textarea
                      id="mensaje"
                      placeholder="Describe tu consulta o problema en detalle..."
                      value={formData.mensaje}
                      onChange={(e) =>
                        setFormData({ ...formData, mensaje: e.target.value })
                      }
                      disabled={isLoading}
                      required
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  {/* Botón enviar */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Mensaje
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preguntas frecuentes */}
      <Card>
        <CardHeader>
          <CardTitle>Preguntas Frecuentes</CardTitle>
          <CardDescription>
            Respuestas a las preguntas más comunes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900">¿Cómo descargo mis resultados?</h3>
            <p className="text-sm text-gray-600 mt-1">
              Ve a la sección "Resultados" y busca los que necesites. Podrás verlos directamente o descargarlos en PDF.
            </p>
          </div>
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900">¿Cómo agendo una cita?</h3>
            <p className="text-sm text-gray-600 mt-1">
              En la sección "Citas" encontrarás los médicos disponibles. Elige fecha y hora según tu conveniencia.
            </p>
          </div>
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900">¿Es seguro mi información?</h3>
            <p className="text-sm text-gray-600 mt-1">
              Sí. Este portal utiliza encriptación de nivel bancario para proteger tu privacidad y datos médicos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
