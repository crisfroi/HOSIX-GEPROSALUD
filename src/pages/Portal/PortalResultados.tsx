import React, { useState, useMemo } from 'react'
import { usePortalAuth } from '@/hooks/usePortalAuth'
import { usePortalData } from '@/hooks/usePortalData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  TestTube,
  Download,
  Eye,
  Calendar,
  AlertCircle,
  Loader
} from 'lucide-react'
import { toast } from 'sonner'

export default function PortalResultados() {
  const { paciente, isLoading: authLoading } = usePortalAuth()
  const { resultados, isLoading: dataLoading } = usePortalData({
    hcu: paciente?.hcu,
    enabled: !!paciente?.hcu
  })
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'laboratorio' | 'imagen'>('todos')

  const isLoading = authLoading || dataLoading

  const resultadosFiltrados = useMemo(() => {
    if (!resultados) return []
    return tipoFiltro === 'todos'
      ? resultados
      : resultados.filter(r => r.tipo === tipoFiltro)
  }, [resultados, tipoFiltro])

  const handleDescargarPDF = async (resultado: any) => {
    toast.info(`Generando PDF para ${resultado.nombre}...`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin mx-auto mb-3 text-indigo-600" />
          <p className="text-gray-600">Cargando resultados...</p>
        </div>
      </div>
    )
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'listo':
        return <Badge className="bg-green-100 text-green-800 text-xs">✓ Listo</Badge>
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">⏳ Pendiente</Badge>
      case 'anormal':
        return <Badge className="bg-red-100 text-red-800 text-xs">⚠ Anormal</Badge>
      default:
        return <Badge className="text-xs">Desconocido</Badge>
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Resultados Médicos</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Laboratorio e imagenología
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Filtrar Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap text-sm">
            {(['todos', 'laboratorio', 'imagen'] as const).map((tipo) => (
              <Button
                key={tipo}
                variant={tipoFiltro === tipo ? 'default' : 'outline'}
                onClick={() => setTipoFiltro(tipo)}
                className={`text-xs sm:text-sm ${tipoFiltro === tipo ? 'bg-indigo-600' : ''}`}
              >
                {tipo === 'todos' && 'Todos'}
                {tipo === 'laboratorio' && 'Laboratorio'}
                {tipo === 'imagen' && 'Imagenología'}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerta de Resultados Anormales */}
      {resultadosFiltrados.some(r => r.estado === 'anormal') && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 text-sm">Resultados Anormales</h3>
            <p className="text-xs sm:text-sm text-red-700 mt-1">
              Contacta a tu médico para más información.
            </p>
          </div>
        </div>
      )}

      {/* Lista de Resultados */}
      <div className="space-y-2 sm:space-y-3">
        {resultadosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <TestTube className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-gray-600 text-sm">No hay resultados para mostrar</p>
            </CardContent>
          </Card>
        ) : (
          resultadosFiltrados.map((resultado) => (
            <Card key={resultado.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 sm:pt-6">
                <div className="space-y-3 sm:space-y-0 sm:flex sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2 flex-wrap">
                      {resultado.tipo === 'laboratorio' ? (
                        <TestTube className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 break-words">
                          {resultado.nombre}
                        </h3>
                      </div>
                      {getEstadoBadge(resultado.estado)}
                    </div>

                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-3">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      {new Date(resultado.fecha).toLocaleDateString('es-ES')}
                    </div>

                    {/* Resultados de Laboratorio */}
                    {resultado.tipo === 'laboratorio' && resultado.valor && (
                      <div className="mt-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                          <div>
                            <p className="text-gray-600 mb-0.5">Valor</p>
                            <p className="font-semibold text-gray-900">{resultado.valor} {resultado.unidad}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 mb-0.5">Referencia</p>
                            <p className="font-semibold text-gray-900 truncate">{resultado.referencia}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 mb-0.5">Estado</p>
                            <p className={`font-semibold text-xs ${
                              resultado.estado === 'anormal' ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {resultado.estado === 'anormal' ? 'Anormal' : 'Normal'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1 sm:gap-2 ml-0 sm:ml-4 flex-shrink-0">
                    {resultado.estado === 'listo' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDescargarPDF(resultado)}
                          className="text-xs sm:text-sm"
                        >
                          <Download className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Descargar</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs sm:text-sm"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Ver</span>
                        </Button>
                      </>
                    )}
                    {resultado.estado === 'pendiente' && (
                      <span className="text-xs sm:text-sm text-gray-600">Pendiente</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
