import React, { useState, useMemo } from 'react'
import { usePortalAuth } from '@/hooks/usePortalAuth'
import { usePortalData } from '@/hooks/usePortalData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FileText,
  Download,
  Search,
  Calendar,
  Stethoscope,
  Loader
} from 'lucide-react'
import { toast } from 'sonner'

interface ConsultaItem {
  id: string
  fecha: string
  profesional: string
  especialidad: string
  diagnostico: string
}

export default function PortalHistorial() {
  const { paciente, isLoading: authLoading } = usePortalAuth()
  const { historial, isLoading: dataLoading } = usePortalData({
    hcu: paciente?.hcu,
    enabled: !!paciente?.hcu
  })
  const [filtro, setFiltro] = useState('')

  const isLoading = authLoading || dataLoading

  const consultasFiltradas = useMemo(() => {
    if (!historial) return []
    if (!filtro) return historial

    const filtroLower = filtro.toLowerCase()
    return historial.filter(c =>
      c.diagnostico?.toLowerCase().includes(filtroLower) ||
      c.profesional?.toLowerCase().includes(filtroLower) ||
      c.especialidad?.toLowerCase().includes(filtroLower)
    )
  }, [filtro, historial])

  const handleDownloadHistorial = () => {
    toast.info('Descarga de PDF disponible próximamente')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin mx-auto mb-3 text-indigo-600" />
          <p className="text-gray-600">Cargando historial...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Historial Médico</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Accede a tu historial médico completo
        </p>
      </div>

      {/* Filtro y Búsqueda */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Buscar Consulta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Diagnóstico, profesional..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            <Button variant="outline" className="text-sm">Filtrar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Consultas */}
      <div className="space-y-2 sm:space-y-3">
        {consultasFiltradas.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-gray-600">No hay consultas registradas</p>
            </CardContent>
          </Card>
        ) : (
          consultasFiltradas.map((consulta) => (
            <Card key={consulta.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 sm:pt-6">
                <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-5 sm:gap-4">
                  {/* Fecha */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <p className="text-xs sm:text-sm font-semibold text-gray-600">Fecha</p>
                    </div>
                    <p className="text-sm sm:text-base text-gray-900">
                      {new Date(consulta.fecha).toLocaleDateString('es-ES')}
                    </p>
                  </div>

                  {/* Profesional */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Stethoscope className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <p className="text-xs sm:text-sm font-semibold text-gray-600">Profesional</p>
                    </div>
                    <p className="text-sm sm:text-base text-gray-900">{consulta.profesional}</p>
                  </div>

                  {/* Especialidad */}
                  <div className="hidden sm:block">
                    <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Especialidad</p>
                    <p className="text-sm text-gray-900">{consulta.especialidad}</p>
                  </div>

                  {/* Diagnóstico */}
                  <div className="hidden lg:block">
                    <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Diagnóstico</p>
                    <p className="text-sm text-gray-900 line-clamp-2">{consulta.diagnostico}</p>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 col-span-2 sm:col-span-1">
                    <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm">
                      <Download className="h-4 w-4 mr-1" />
                      <span className="hidden xs:inline">Ver</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Botón Descargar Todo */}
      {consultasFiltradas.length > 0 && (
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleDownloadHistorial}
            className="bg-indigo-600 hover:bg-indigo-700 text-sm sm:text-base"
          >
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Descargar Historial Completo (PDF)</span>
            <span className="sm:hidden">Descargar PDF</span>
          </Button>
        </div>
      )}
    </div>
  )
}
