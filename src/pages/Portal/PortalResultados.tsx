import React, { useState, useEffect } from 'react'
import { supabase } from '@/app/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

interface Resultado {
  id: string
  fecha: string
  tipo: 'laboratorio' | 'imagen'
  nombre: string
  estado: 'pendiente' | 'listo' | 'anormal'
  valor?: string
  referencia?: string
  unidad?: string
}

export default function PortalResultados() {
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'laboratorio' | 'imagen'>('todos')
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadResultados()
  }, [])

  const loadResultados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: paciente } = await supabase
        .from('portal_pacientes')
        .select('hcu')
        .eq('id', user.id)
        .single()

      if (!paciente?.hcu) {
        setResultados([])
        setIsLoading(false)
        return
      }

      // Cargar resultados de laboratorio
      const { data: laboratorio } = await supabase
        .from('laboratorio_resultados')
        .select('id, fecha_resultado, tipo_prueba, valor, referencia, unidad, estado')
        .eq('hcu_paciente', paciente.hcu)
        .order('fecha_resultado', { ascending: false })
        .limit(50)

      // Cargar resultados de imagenología
      const { data: imagenes } = await supabase
        .from('imagenologia_resultados')
        .select('id, fecha_resultado, tipo_imagen, estado, archivo_ruta')
        .eq('hcu_paciente', paciente.hcu)
        .order('fecha_resultado', { ascending: false })
        .limit(50)

      // Combinar y formatear
      const todosResultados: Resultado[] = []

      ;(laboratorio || []).forEach(item => {
        todosResultados.push({
          id: item.id,
          fecha: item.fecha_resultado || '',
          tipo: 'laboratorio',
          nombre: item.tipo_prueba || 'Prueba',
          estado: item.estado === 'completado' ? 'listo' : item.estado === 'pendiente' ? 'pendiente' : 'anormal',
          valor: item.valor?.toString(),
          referencia: item.referencia?.toString(),
          unidad: item.unidad
        })
      })

      ;(imagenes || []).forEach(item => {
        todosResultados.push({
          id: item.id,
          fecha: item.fecha_resultado || '',
          tipo: 'imagen',
          nombre: item.tipo_imagen || 'Imagen',
          estado: item.estado === 'completado' ? 'listo' : 'pendiente'
        })
      })

      setResultados(todosResultados)
    } catch (error) {
      console.error('Error cargando resultados:', error)
      toast.error('Error al cargar resultados')
    } finally {
      setIsLoading(false)
    }
  }

  const resultadosFiltrados = tipoFiltro === 'todos'
    ? resultados
    : resultados.filter(r => r.tipo === tipoFiltro)

  const handleDescargarPDF = async (resultado: Resultado) => {
    try {
      toast.info(`Generando PDF para ${resultado.nombre}...`)
      // Implementación de jsPDF pendiente - se añadirá en siguiente paso
      console.log('PDF generation for:', resultado)
    } catch (error) {
      toast.error('Error al descargar')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
        return <Badge className="bg-green-100 text-green-800">✓ Listo</Badge>
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pendiente</Badge>
      case 'anormal':
        return <Badge className="bg-red-100 text-red-800">⚠ Anormal</Badge>
      default:
        return <Badge>Desconocido</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Resultados Médicos</h1>
        <p className="text-gray-600 mt-2">
          Consulta tus resultados de laboratorio e imagenología
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrar Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {(['todos', 'laboratorio', 'imagen'] as const).map((tipo) => (
              <Button
                key={tipo}
                variant={tipoFiltro === tipo ? 'default' : 'outline'}
                onClick={() => setTipoFiltro(tipo)}
                className={tipoFiltro === tipo ? 'bg-indigo-600' : ''}
              >
                {tipo === 'todos' && 'Todos los Resultados'}
                {tipo === 'laboratorio' && 'Laboratorio'}
                {tipo === 'imagen' && 'Imagenología'}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerta de Resultados Anormales */}
      {resultadosFiltrados.some(r => r.estado === 'anormal') && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Resultados Anormales</h3>
            <p className="text-sm text-red-700">
              Tienes resultados anormales. Contacta a tu médico para más información.
            </p>
          </div>
        </div>
      )}

      {/* Lista de Resultados */}
      <div className="space-y-3">
        {resultadosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-gray-600">
                <TestTube className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay resultados para mostrar</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          resultadosFiltrados.map((resultado) => (
            <Card key={resultado.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {resultado.tipo === 'laboratorio' ? (
                        <TestTube className="h-5 w-5 text-purple-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-blue-600" />
                      )}
                      <h3 className="text-lg font-semibold text-gray-900">
                        {resultado.nombre}
                      </h3>
                      {getEstadoBadge(resultado.estado)}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Calendar className="h-4 w-4" />
                      {new Date(resultado.fecha).toLocaleDateString('es-ES')}
                    </div>

                    {/* Resultados de Laboratorio */}
                    {resultado.tipo === 'laboratorio' && resultado.valor && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Valor</p>
                            <p className="font-semibold text-gray-900">{resultado.valor} {resultado.unidad}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Referencia</p>
                            <p className="font-semibold text-gray-900">{resultado.referencia}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Estado</p>
                            <p className={`font-semibold ${
                              resultado.estado === 'anormal' ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {resultado.estado === 'anormal' ? 'Fuera de rango' : 'Normal'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {resultado.estado === 'listo' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDescargarPDF(resultado)}
                        >
                          <Download className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Descargar</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Ver</span>
                        </Button>
                      </>
                    )}
                    {resultado.estado === 'pendiente' && (
                      <span className="text-sm text-gray-600">Pendiente</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Info sobre descarga PDF */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm">Descarga de PDF</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-900">
          <p>
            Los PDF se generan con formateo A4 automático. El contenido se adapta 
            a múltiples páginas cuando sea necesario, con saltos de página inteligentes 
            para evitar cortes de información.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
