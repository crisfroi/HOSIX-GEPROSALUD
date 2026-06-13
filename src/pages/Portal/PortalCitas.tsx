import React, { useState, useMemo } from 'react'
import { usePortalAuth } from '@/hooks/usePortalAuth'
import { usePortalData } from '@/hooks/usePortalData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Clock, MapPin, User, X, AlertCircle, Loader } from 'lucide-react'
import { toast } from 'sonner'

export default function PortalCitas() {
  const { paciente, isLoading: authLoading } = usePortalAuth()
  const { citas, isLoading: dataLoading } = usePortalData({
    hcu: paciente?.hcu,
    enabled: !!paciente?.hcu
  })
  const [filtro, setFiltro] = useState<'proximas' | 'pasadas' | 'todas'>('proximas')

  const isLoading = authLoading || dataLoading

  const citasFiltradas = useMemo(() => {
    if (!citas) return []
    return citas.filter(c => {
      if (filtro === 'proximas') return new Date(c.fecha) > new Date()
      if (filtro === 'pasadas') return new Date(c.fecha) <= new Date()
      return true
    })
  }, [citas, filtro])

  const citasConfirmadas = (citas || []).filter(
    c => new Date(c.fecha) > new Date() && c.estado === 'confirmada'
  ).length

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'confirmada':
        return <Badge className="bg-green-100 text-green-800 text-xs">✓ Confirmada</Badge>
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">⏳ Pendiente</Badge>
      case 'completada':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">✓ Completada</Badge>
      case 'cancelada':
        return <Badge className="bg-red-100 text-red-800 text-xs">✗ Cancelada</Badge>
      default:
        return <Badge className="text-xs">Desconocido</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin mx-auto mb-3 text-indigo-600" />
          <p className="text-gray-600">Cargando citas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mis Citas</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Gestiona tus citas médicas
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Filtrar Citas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap text-sm">
            {(['proximas', 'pasadas', 'todas'] as const).map((tipo) => (
              <Button
                key={tipo}
                variant={filtro === tipo ? 'default' : 'outline'}
                onClick={() => setFiltro(tipo)}
                className={`text-xs sm:text-sm ${filtro === tipo ? 'bg-indigo-600' : ''}`}
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
      {citasConfirmadas > 0 && (
        <Alert className="bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 text-sm">
            Tienes {citasConfirmadas} cita(s) confirmada(s) próxima(s).
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de Citas */}
      <div className="space-y-2 sm:space-y-3">
        {citasFiltradas.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-gray-600 text-sm">No hay citas para mostrar</p>
            </CardContent>
          </Card>
        ) : (
          citasFiltradas.map((cita) => (
            <Card key={cita.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 sm:pt-6">
                <div className="space-y-3 sm:space-y-0 sm:flex sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                        {cita.especialidad}
                      </h3>
                      {getEstadoBadge(cita.estado)}
                    </div>

                    <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        {new Date(cita.fecha).toLocaleDateString('es-ES')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        {cita.hora}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="truncate">{cita.profesional}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-600 flex-shrink-0" />
                        <span className="truncate">{cita.centro}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1 sm:gap-2 ml-0 sm:ml-4 mt-3 sm:mt-0 flex-wrap sm:flex-nowrap justify-between sm:flex-col">
                    {cita.estado === 'confirmada' && new Date(cita.fecha) > new Date() && (
                      <>
                        <Button variant="outline" size="sm" className="text-xs sm:text-sm flex-1 sm:flex-none">
                          Reprogramar
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {cita.estado === 'completada' && (
                      <Button variant="outline" size="sm" className="text-xs sm:text-sm w-full sm:w-auto">
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
        <div className="flex justify-end pt-2">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-sm sm:text-base">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Programar Nueva Cita</span>
            <span className="sm:hidden">Nueva Cita</span>
          </Button>
        </div>
      )}
    </div>
  )
}
