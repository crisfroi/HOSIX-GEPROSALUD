import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/hosixClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, FileText, AlertCircle, Printer, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface KioskoResultadosProps {
  onBack?: () => void
}

export const KioskoResultados: React.FC<KioskoResultadosProps> = ({ onBack }) => {
  const [cedula, setCedula] = useState('')
  const [pacienteData, setPacienteData] = useState<any>(null)
  const [resultadosLab, setResultadosLab] = useState<any[]>([])
  const [estudiosImagen, setEstudiosImagen] = useState<any[]>([])

  const buscarMutation = useMutation({
    mutationFn: async () => {
      if (!cedula.trim()) {
        throw new Error('Por favor ingresa tu número de cédula')
      }

      // Buscar paciente
      const { data: paciente, error: errorPaciente } = await supabase
        .from('hosix_pacientes')
        .select('id, nombre_completo, numero_cedula')
        .eq('numero_cedula', cedula)
        .single()

      if (errorPaciente || !paciente) {
        throw new Error('Cédula no encontrada en el sistema')
      }

      // Buscar resultados de laboratorio
      const { data: resultados } = await supabase
        .from('hosix_laboratorio_resultados')
        .select(`
          id,
          solicitud_id,
          prueba_id,
          valor_resultado,
          unidad_resultado,
          rango_referencia_minimo,
          rango_referencia_maximo,
          fecha_resultado,
          prueba:hosix_laboratorio_pruebas_catalogo(id, nombre, codigo),
          solicitud:hosix_laboratorio_solicitudes(
            id,
            diagnostico_clinico,
            estado,
            fecha_solicitud
          )
        `)
        .eq('solicitud.paciente_id', paciente.id)
        .order('fecha_resultado', { ascending: false })

      setResultadosLab(resultados || [])

      // Buscar estudios de imagenología
      const { data: estudios } = await supabase
        .from('hosix_imagenologia_estudios')
        .select(`
          id,
          solicitud_id,
          numero_series,
          cantidad_imagenes,
          fecha_estudio,
          solicitud:hosix_imagenologia_solicitudes(
            id,
            diagnostico_clinico,
            estado,
            fecha_solicitud,
            modalidad:hosix_imagenologia_modalidades(id, nombre, codigo)
          )
        `)
        .eq('solicitud.paciente_id', paciente.id)
        .order('fecha_estudio', { ascending: false })

      setEstudiosImagen(estudios || [])

      setPacienteData(paciente)
    },
    onSuccess: () => {
      toast.success('Resultados cargados')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al buscar resultados')
      setPacienteData(null)
      setResultadosLab([])
      setEstudiosImagen([])
    },
  })

  if (pacienteData) {
    return (
      <Card className="w-full">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardTitle className="text-2xl">Resultados Disponibles</CardTitle>
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

          {/* Tabs de resultados */}
          {resultadosLab.length > 0 || estudiosImagen.length > 0 ? (
            <Tabs defaultValue="laboratorio">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="laboratorio">
                  Laboratorio ({resultadosLab.length})
                </TabsTrigger>
                <TabsTrigger value="imagenologia">
                  Imagenología ({estudiosImagen.length})
                </TabsTrigger>
              </TabsList>

              {/* Laboratorio */}
              <TabsContent value="laboratorio" className="space-y-4 mt-4">
                {resultadosLab.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No hay resultados de laboratorio disponibles</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {resultadosLab.map((resultado) => (
                      <div
                        key={resultado.id}
                        className="border rounded-lg p-4 bg-blue-50"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-lg">
                              {resultado.prueba?.nombre}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(resultado.fecha_resultado).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge>{resultado.solicitud?.estado}</Badge>
                        </div>

                        <div className="bg-white p-3 rounded space-y-2 mb-3">
                          <div className="flex justify-between">
                            <span className="text-sm">Valor</span>
                            <span className="font-bold text-lg">
                              {resultado.valor_resultado} {resultado.unidad_resultado}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            Rango normal: {resultado.rango_referencia_minimo} -{' '}
                            {resultado.rango_referencia_maximo}{' '}
                            {resultado.unidad_resultado}
                          </div>
                        </div>

                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Diagnóstico:</span>{' '}
                          {resultado.solicitud?.diagnostico_clinico}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Imagenología */}
              <TabsContent value="imagenologia" className="space-y-4 mt-4">
                {estudiosImagen.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No hay estudios de imagenología disponibles</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {estudiosImagen.map((estudio) => (
                      <div
                        key={estudio.id}
                        className="border rounded-lg p-4 bg-green-50"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-lg">
                              {estudio.solicitud?.modalidad?.nombre}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(estudio.fecha_estudio).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge>{estudio.solicitud?.estado}</Badge>
                        </div>

                        <div className="bg-white p-3 rounded space-y-2 mb-3">
                          <div className="flex justify-between">
                            <span className="text-sm">Series</span>
                            <span className="font-semibold">
                              {estudio.numero_series}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Imágenes</span>
                            <span className="font-semibold">
                              {estudio.cantidad_imagenes}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Diagnóstico:</span>{' '}
                          {estudio.solicitud?.diagnostico_clinico}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <p className="text-yellow-700 font-semibold">
                No hay resultados disponibles para esta cédula
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => {
                setPacienteData(null)
                setResultadosLab([])
                setEstudiosImagen([])
                setCedula('')
              }}
              variant="outline"
              className="flex-1"
            >
              Buscar Otra Cédula
            </Button>
            <Button onClick={() => window.print()} className="flex-1 gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        <CardTitle className="flex items-center justify-center gap-3 text-3xl">
          <FileText className="h-8 w-8" />
          Consulta tus Resultados
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-12 space-y-8">
        <div className="text-center space-y-4">
          <p className="text-lg text-gray-600">
            Ingresa tu número de cédula para ver tus resultados
          </p>

          <Input
            type="text"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            placeholder="Ejemplo: 123-456-789"
            onKeyPress={(e) => e.key === 'Enter' && buscarMutation.mutate()}
            className="text-center text-2xl py-6"
          />

          <Button
            onClick={() => buscarMutation.mutate()}
            disabled={buscarMutation.isPending || !cedula.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 py-6 text-lg"
          >
            {buscarMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                Buscar Resultados
              </>
            )}
          </Button>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200 text-center">
          <p className="text-purple-900 text-sm leading-relaxed">
            Tus resultados de laboratorio e imagenología aparecerán automáticamente cuando estén listos.
            Los datos son privados y seguros.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default KioskoResultados
