import React, { useMemo } from 'react'
import { usePortalAuth } from '@/hooks/usePortalAuth'
import { usePortalData } from '@/hooks/usePortalData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pill, Calendar, Download, AlertCircle, Loader } from 'lucide-react'
import { toast } from 'sonner'

export default function PortalRecetas() {
  const { paciente, isLoading: authLoading } = usePortalAuth()
  const { recetas, isLoading: dataLoading } = usePortalData({
    hcu: paciente?.hcu,
    enabled: !!paciente?.hcu
  })

  const isLoading = authLoading || dataLoading

  const recetasActivas = useMemo(() => {
    if (!recetas) return []
    return recetas.filter(r => r.estado === 'activa')
  }, [recetas])

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'activa':
        return <Badge className="bg-green-100 text-green-800 text-xs">✓ Activa</Badge>
      case 'expirada':
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">⚠ Expirada</Badge>
      case 'completada':
        return <Badge className="bg-gray-100 text-gray-800 text-xs">✓ Completada</Badge>
      default:
        return <Badge className="text-xs">Desconocido</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin mx-auto mb-3 text-indigo-600" />
          <p className="text-gray-600">Cargando recetas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mis Recetas</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Medicamentos activos y completados
        </p>
      </div>

      {/* Alerta recetas activas */}
      {recetasActivas.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base">Medicamentos Activos</CardTitle>
          </CardHeader>
          <CardContent className="text-xs sm:text-sm text-blue-900">
            <p>Tienes {recetasActivas.length} medicamento(s) activo(s).</p>
          </CardContent>
        </Card>
      )}

      {/* Recetas Activas */}
      {recetasActivas.length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Medicamentos Activos</h2>
          <div className="space-y-2 sm:space-y-3">
            {recetasActivas.map((receta) => (
              <Card key={receta.id} className="border-green-200 bg-green-50">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="space-y-3 sm:space-y-0 sm:flex sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-2 mb-2 flex-wrap">
                        <Pill className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                          {receta.medicamento}
                        </h3>
                        {getEstadoBadge(receta.estado)}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-3 text-xs sm:text-sm">
                        <div>
                          <p className="text-gray-600 mb-0.5">Dosis</p>
                          <p className="font-semibold text-gray-900">{receta.dosis}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-0.5">Frecuencia</p>
                          <p className="font-semibold text-gray-900">{receta.frecuencia}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-0.5">Duración</p>
                          <p className="font-semibold text-gray-900">{receta.duracion}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-0.5">Prescrito por</p>
                          <p className="font-semibold text-gray-900 truncate">{receta.profesional}</p>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="ml-0 sm:ml-4 mt-3 sm:mt-0">
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
      {(recetas || []).length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Historial de Recetas</h2>
          <div className="space-y-2 sm:space-y-3">
            {recetas?.map((receta) => (
              <Card key={receta.id}>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-2 flex-wrap">
                        <Pill className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 break-words">
                            {receta.medicamento}
                          </h3>
                        </div>
                        {getEstadoBadge(receta.estado)}
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mt-2">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        {new Date(receta.fecha).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="ml-2 flex-shrink-0">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {(!recetas || recetas.length === 0) && (
        <Card>
          <CardContent className="py-8 text-center">
            <Pill className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-gray-600 text-sm">No hay recetas registradas</p>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            Información Importante
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs sm:text-sm text-amber-900">
          <p>Si tienes preguntas sobre tus medicamentos o experimentas efectos secundarios, contacta a tu médico.</p>
        </CardContent>
      </Card>
    </div>
  )
}
