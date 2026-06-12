import React, { useState, useEffect } from 'react'
import { supabase } from '@/app/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  estado: string
}

export default function PortalHistorial() {
  const [filtro, setFiltro] = useState('')
  const [consultas, setConsultas] = useState<ConsultaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [consultasFiltradas, setConsultasFiltradas] = useState<ConsultaItem[]>([])

  useEffect(() => {
    loadConsultas()
  }, [])

  useEffect(() => {
    // Filtrar consultas por diagnóstico o profesional
    if (!filtro) {
      setConsultasFiltradas(consultas)
    } else {
      const filtroLower = filtro.toLowerCase()
      const filtered = consultas.filter(c =>
        c.diagnostico.toLowerCase().includes(filtroLower) ||
        c.profesional.toLowerCase().includes(filtroLower) ||
        c.especialidad.toLowerCase().includes(filtroLower)
      )
      setConsultasFiltradas(filtered)
    }
  }, [filtro, consultas])

  const loadConsultas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: paciente } = await supabase
        .from('portal_pacientes')
        .select('hcu')
        .eq('id', user.id)
        .single()

      if (!paciente?.hcu) {
        setConsultas([])
        setIsLoading(false)
        return
      }

      // Cargar historial clínico
      const { data: historial, error } = await supabase
        .from('hosix_historia_clinica')
        .select('id, fecha_consulta, diagnostico, especialidad, profesional_id')
        .eq('hcu_paciente', paciente.hcu)
        .order('fecha_consulta', { ascending: false })
        .limit(100)

      if (error) throw error

      // Transformar datos
      const consultasData: ConsultaItem[] = (historial || []).map(item => ({
        id: item.id,
        fecha: item.fecha_consulta || '',
        profesional: item.profesional_id || 'No especificado',
        especialidad: item.especialidad || 'General',
        diagnostico: item.diagnostico || 'Sin diagnóstico',
        estado: 'completado'
      }))

      setConsultas(consultasData)
      setConsultasFiltradas(consultasData)
    } catch (error) {
      console.error('Error cargando consultas:', error)
      toast.error('Error al cargar historial')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadHistorial = () => {
    toast.info('Descarga de PDF disponible próximamente')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin mx-auto mb-3 text-indigo-600" />
          <p className="text-gray-600">Cargando historial...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Historial Médico</h1>
        <p className="text-gray-600 mt-2">
          Accede a tu historial médico completo y descarga documentos
        </p>
      </div>

      {/* Filtro y Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Consulta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por diagnóstico, profesional o fecha..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">Filtrar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Consultas */}
      <div className="space-y-3">
        {consultasFiltradas.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-gray-600">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay consultas registradas</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          consultasFiltradas.map((consulta) => (
            <Card key={consulta.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {/* Fecha */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-semibold text-gray-900">Fecha</p>
                    </div>
                    <p className="text-gray-700">
                      {new Date(consulta.fecha).toLocaleDateString('es-ES')}
                    </p>
                  </div>

                  {/* Profesional */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Stethoscope className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-semibold text-gray-900">Profesional</p>
                    </div>
                    <p className="text-gray-700">{consulta.profesional}</p>
                  </div>

                  {/* Especialidad */}
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">Especialidad</p>
                    <p className="text-gray-700 text-sm">{consulta.especialidad}</p>
                  </div>

                  {/* Diagnóstico */}
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">Diagnóstico</p>
                    <p className="text-gray-700 text-sm">{consulta.diagnostico}</p>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-end">
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="h-4 w-4 mr-1" />
                      Ver Detalles
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
        <div className="flex justify-end">
          <Button 
            onClick={handleDownloadHistorial}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar Historial Completo (PDF)
          </Button>
        </div>
      )}
    </div>
  )
}
