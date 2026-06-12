import React, { useState, useEffect } from 'react'
import { supabase } from '@/app/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Clock, MapPin, User, X, AlertCircle, Loader } from 'lucide-react'
import { toast } from 'sonner'

interface Cita {
  id: string
  fecha: string
  hora: string
  profesional: string
  especialidad: string
  centro: string
  estado: 'confirmada' | 'pendiente' | 'completada' | 'cancelada'
}

export default function PortalCitas() {
  const [filtro, setFiltro] = useState<'proximas' | 'pasadas' | 'todas'>('proximas')
  const [citas, setCitas] = useState<Cita[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCitas()
  }, [])

  const loadCitas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: paciente } = await supabase
        .from('portal_pacientes')
        .select('hcu')
        .eq('id', user.id)
        .single()

      if (!paciente?.hcu) {
        setCitas([])
        setIsLoading(false)
        return
      }

      // Cargar citas
      const { data: citasData, error } = await supabase
        .from('hosix_citas')
        .select('id, fecha, hora, profesional_id, especialidad, centro_salud_id, estado')
        .eq('hcu_paciente', paciente.hcu)
        .order('fecha', { ascending: false })
        .limit(100)

      if (error) throw error

      const citasFormatted: Cita[] = (citasData || []).map(item => ({
        id: item.id,
        fecha: item.fecha || '',
        hora: item.hora || '',
        profesional: item.profesional_id || 'No especificado',
        especialidad: item.especialidad || 'General',
        centro: item.centro_salud_id || 'Centro desconocido',
        estado: (item.estado || 'pendiente') as Cita['estado']
      }))

      setCitas(citasFormatted)
    } catch (error) {
      console.error('Error cargando citas:', error)
      toast.error('Error al cargar citas')
    } finally {
      setIsLoading(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'confirmada':
        return <Badge className="bg-green-100 text-green-800">✓ Confirmada</Badge>
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pendiente</Badge>
      case 'completada':
        return <Badge className="bg-blue-100 text-blue-800">✓ Completada</Badge>
      case 'cancelada':
        return <Badge className="bg-red-100 text-red-800">✗ Cancelada</Badge>
      default:
        return <Badge>Desconocido</Badge>
    }
  }

  const citasFiltradas = citas.filter(c => {
    if (filtro === 'proximas') return new Date(c.fecha) > new Date()
    if (filtro === 'pasadas') return new Date(c.fecha) <= new Date()
    return true
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin mx-auto mb-3 text-indigo-600" />
          <p className="text-gray-600">Cargando citas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mis Citas</h1>
        <p className="text-gray-600 mt-2">
          Gestiona tus citas médicas
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrar Citas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(['proximas', 'pasadas', 'todas'] as const).map((tipo) => (
              <Button
                key={tipo}
                variant={filtro === tipo ? 'default' : 'outline'}
                onClick={() => setFiltro(tipo)}
                className={filtro === tipo ? 'bg-indigo-600' : ''}
              >
                {tipo === 'proximas' && 'Próximas'}
                {tipo === 'pasadas' && 'Pasadas'}
                {tipo === 'todas' && 'Todas'}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerta de citas próximas */}
      {citas.filter(c => new Date(c.fecha) > new Date() && c.estado === 'confirmada').length > 0 && (
        <Alert className="bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Tienes {citas.filter(c => new Date(c.fecha) > new Date() && c.estado === 'confirmada').length} cita(s) confirmada(s) próxima(s).
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de Citas */}
      <div className="space-y-3">
        {citasFiltradas.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-gray-600">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay citas para mostrar</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          citasFiltradas.map((cita) => (
            <Card key={cita.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {cita.especialidad}
                      </h3>
                      {getEstadoBadge(cita.estado)}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        {new Date(cita.fecha).toLocaleDateString('es-ES')}
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="h-4 w-4 text-purple-600" />
                        {cita.hora}
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <User className="h-4 w-4 text-green-600" />
                        {cita.profesional}
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="h-4 w-4 text-red-600" />
                        {cita.centro}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {cita.estado === 'confirmada' && new Date(cita.fecha) > new Date() && (
                      <>
                        <Button variant="outline" size="sm">
                          Reprogramar
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {cita.estado === 'completada' && (
                      <Button variant="outline" size="sm">
                        Ver Informe
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Botón Nueva Cita */}
      {filtro !== 'pasadas' && (
        <div className="flex justify-end">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Calendar className="h-4 w-4 mr-2" />
            Programar Nueva Cita
          </Button>
        </div>
      )}
    </div>
  )
}
