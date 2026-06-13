import React from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortalAuth } from '@/hooks/usePortalAuth'
import { usePortalData } from '@/hooks/usePortalData'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Calendar,
  TestTube,
  Pill,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react'

export default function PortalDashboard() {
  const navigate = useNavigate()
  const { paciente, isLoading: authLoading } = usePortalAuth()
  const { citas, resultados, recetas, historial, isLoading: dataLoading } = usePortalData({
    hcu: paciente?.hcu,
    enabled: !!paciente?.hcu
  })

  const isLoading = authLoading || dataLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Bienvenida */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Bienvenido, {paciente?.nombre_completo?.split(' ')[0]}
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-2 truncate">
          HCU: {paciente?.hcu}
        </p>
      </div>

      {/* Alertas importantes */}
      {paciente?.alergias && JSON.stringify(paciente.alergias) !== '[]' && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
          <AlertDescription className="text-orange-700 text-xs sm:text-sm ml-2">
            Tienes alergias registradas. Revisa tu perfil.
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de acceso rápido */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {/* Citas */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer active:scale-95 sm:active:scale-100"
          onClick={() => navigate('/portal/citas')}
        >
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-2 min-h-6">
              <Calendar size={16} className="sm:size-[18px] text-blue-600 flex-shrink-0" />
              <span className="truncate">Citas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{citas.length}</div>
            <p className="text-xs text-gray-500 mt-1">Próximas</p>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer active:scale-95 sm:active:scale-100"
          onClick={() => navigate('/portal/resultados')}
        >
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-2 min-h-6">
              <TestTube size={16} className="sm:size-[18px] text-purple-600 flex-shrink-0" />
              <span className="truncate">Resultados</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-purple-600">{resultados.length}</div>
            <p className="text-xs text-gray-500 mt-1">Nuevos</p>
          </CardContent>
        </Card>

        {/* Recetas */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer active:scale-95 sm:active:scale-100"
          onClick={() => navigate('/portal/recetas')}
        >
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-2 min-h-6">
              <Pill size={16} className="sm:size-[18px] text-green-600 flex-shrink-0" />
              <span className="truncate">Recetas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-green-600">{recetas.length}</div>
            <p className="text-xs text-gray-500 mt-1">Activas</p>
          </CardContent>
        </Card>

        {/* Historial */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer active:scale-95 sm:active:scale-100"
          onClick={() => navigate('/portal/historial')}
        >
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-2 min-h-6">
              <FileText size={16} className="sm:size-[18px] text-amber-600 flex-shrink-0" />
              <span className="truncate">Historial</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-amber-600">Ver</div>
            <p className="text-xs text-gray-500 mt-1">Médico</p>
          </CardContent>
        </Card>
      </div>

      {/* Secciones adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Datos de Salud */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Datos de Salud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Tipo de Sangre</p>
              <p className="text-base sm:text-lg font-semibold text-gray-900">
                {paciente?.tipo_sangre || 'No registrado'}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Género</p>
              <p className="text-base sm:text-lg font-semibold text-gray-900">
                {paciente?.genero === 'M' ? 'Masculino' : paciente?.genero === 'F' ? 'Femenino' : 'No registrado'}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Centro de Salud</p>
              <p className="text-base sm:text-lg font-semibold text-gray-900">
                {paciente?.centro_salud_id ? 'Asignado' : 'No asignado'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Acciones Rápidas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 sm:space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start text-xs sm:text-sm h-9 sm:h-10"
              onClick={() => navigate('/portal/citas')}
            >
              <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">Programar cita</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-xs sm:text-sm h-9 sm:h-10"
              onClick={() => navigate('/portal/resultados')}
            >
              <TestTube className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">Ver resultados</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-xs sm:text-sm h-9 sm:h-10"
              onClick={() => navigate('/portal/contacto')}
            >
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">Contactar</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-xs sm:text-sm h-9 sm:h-10"
              onClick={() => navigate('/portal/perfil')}
            >
              <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">Mi perfil</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Última actualización */}
      <div className="text-right text-xs sm:text-sm text-gray-500 pt-2">
        <p>Actualizado: {new Date().toLocaleDateString('es-ES')}</p>
      </div>
    </div>
  )
}
