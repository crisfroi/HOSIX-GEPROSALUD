import React, { useState, useEffect } from 'react'
import { supabase } from '@/app/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pill, Calendar, Download, AlertCircle, Loader } from 'lucide-react'
import { toast } from 'sonner'

interface Receta {
  id: string
  fecha: string
  medicamento: string
  dosis: string
  duracion: string
  frecuencia: string
  estado: 'activa' | 'expirada' | 'completada'
  profesional: string
}

export default function PortalRecetas() {
  const [recetas, setRecetas] = useState<Receta[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadRecetas()
  }, [])

  const loadRecetas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: paciente } = await supabase
        .from('portal_pacientes')
        .select('hcu')
        .eq('id', user.id)
        .single()

      if (!paciente?.hcu) {
        setRecetas([])
        setIsLoading(false)
        return
      }

      // Cargar dispensaciones (recetas/medicamentos)
      const { data: dispensaciones, error } = await supabase
        .from('hosix_dispensario')
        .select('id, fecha_dispensacion, medicamento, dosis, frecuencia, duracion, profesional_id')
        .eq('hcu_paciente', paciente.hcu)
        .order('fecha_dispensacion', { ascending: false })
        .limit(100)

      if (error) throw error

      const recetasFormatted: Receta[] = (dispensaciones || []).map(item => {
        const fechaDisp = new Date(item.fecha_dispensacion)
        const fechaExpiracion = new Date(fechaDisp)
        const diasDuracion = parseInt(item.duracion?.replace(/\D/g, '') || '0') || 7
        fechaExpiracion.setDate(fechaExpiracion.getDate() + diasDuracion)
        const ahora = new Date()

        let estado: Receta['estado'] = 'completada'
        if (fechaExpiracion > ahora) {
          estado = 'activa'
        } else if (ahora > fechaExpiracion) {
          estado = 'expirada'
        }

        return {
          id: item.id,
          fecha: item.fecha_dispensacion || '',
          medicamento: item.medicamento || 'Medicamento',
          dosis: item.dosis || 'No especificada',
          duracion: item.duracion || '7 días',
          frecuencia: item.frecuencia || 'No especificada',
          estado,
          profesional: item.profesional_id || 'No especificado'
        }
      })

      setRecetas(recetasFormatted)
    } catch (error) {
      console.error('Error cargando recetas:', error)
      toast.error('Error al cargar recetas')
    } finally {
      setIsLoading(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'activa':
        return <Badge className="bg-green-100 text-green-800">✓ Activa</Badge>
      case 'expirada':
        return <Badge className="bg-yellow-100 text-yellow-800">⚠ Expirada</Badge>
      case 'completada':
        return <Badge className="bg-gray-100 text-gray-800">✓ Completada</Badge>
      default:
        return <Badge>Desconocido</Badge>
    }
  }

  const recetasActivas = recetas.filter(r => r.estado === 'activa')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin mx-auto mb-3 text-indigo-600" />
          <p className="text-gray-600">Cargando recetas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mis Recetas</h1>
        <p className="text-gray-600 mt-2">
          Accede a tus recetas médicas activas y completadas
        </p>
      </div>

      {/* Alerta recetas activas */}
      {recetasActivas.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm">Medicamentos Activos</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-900">
            <p>Tienes {recetasActivas.length} medicamento(s) activo(s). Recuerda tomar tus medicinas según lo indicado.</p>
          </CardContent>
        </Card>
      )}

      {/* Recetas Activas */}
      {recetasActivas.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Medicamentos Activos</h2>
          <div className="space-y-3">
            {recetasActivas.map((receta) => (
              <Card key={receta.id} className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Pill className="h-5 w-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {receta.medicamento}
                        </h3>
                        {getEstadoBadge(receta.estado)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-gray-600">Dosis</p>
                          <p className="font-semibold text-gray-900">{receta.dosis}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Frecuencia</p>
                          <p className="font-semibold text-gray-900">{receta.frecuencia}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Duración</p>
                          <p className="font-semibold text-gray-900">{receta.duracion}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Prescrito por</p>
                          <p className="font-semibold text-gray-900 text-sm">{receta.profesional}</p>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="ml-4">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Todas las Recetas */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Historial de Recetas</h2>
        <div className="space-y-3">
          {recetas.map((receta) => (
            <Card key={receta.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Pill className="h-5 w-5 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {receta.medicamento}
                      </h3>
                      {getEstadoBadge(receta.estado)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(receta.fecha).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="ml-4">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Info */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            Información Importante
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-900">
          <p>Si tienes preguntas sobre tus medicamentos o experimentas efectos secundarios, contacta inmediatamente a tu médico o al centro de salud.</p>
        </CardContent>
      </Card>
    </div>
  )
}
