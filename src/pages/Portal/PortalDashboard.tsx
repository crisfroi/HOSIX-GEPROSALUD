import React, { useEffect, useState } from 'react'
import { supabase } from '@/app/supabase'
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
import { useNavigate } from 'react-router-dom'

interface DashboardData {
  paciente: any
  citas_proximas: number
  resultados_pendientes: number
  recetas_activas: number
  consultasRecientes: any[]
}

export default function PortalDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        navigate('/portal/login')
        return
      }

      // Cargar perfil del paciente
      const { data: paciente } = await supabase
        .from('portal_pacientes')
        .select('*')
        .eq('id', user.id)
        .single()

      // Obtener HCU del paciente para buscar en tablas clínicas
      const hcu = paciente?.hcu

      if (!hcu) {
        setData({
          paciente,
          citas_proximas: 0,
          resultados_pendientes: 0,
          recetas_activas: 0,
          consultasRecientes: []
        })
        setIsLoading(false)
        return
      }

      // Cargar datos reales en paralelo
      const [citasRes, resultadosRes, recetasRes, consultasRes] = await Promise.all([
        // Citas próximas
        supabase
          .from('hosix_citas')
          .select('id, fecha, hora, especialidad, estado')
          .eq('hcu_paciente', hcu)
          .gt('fecha', new Date().toISOString())
          .eq('estado', 'confirmada')
          .limit(10),
        // Resultados pendientes
        supabase
          .from('laboratorio_resultados')
          .select('id, fecha_resultado, tipo_prueba')
          .eq('hcu_paciente', hcu)
          .eq('estado', 'pendiente')
          .limit(10),
        // Recetas activas (farmacia)
        supabase
          .from('hosix_dispensario')
          .select('id, medicamento, fecha_dispensacion, duracion')
          .eq('hcu_paciente', hcu)
          .gte('fecha_dispensacion', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString())
          .limit(10),
        // Consultas recientes (últimas 5)
        supabase
          .from('hosix_historia_clinica')
          .select('id, fecha_consulta, diagnostico, profesional_id')
          .eq('hcu_paciente', hcu)
          .order('fecha_consulta', { ascending: false })
          .limit(5)
      ])

      setData({
        paciente,
        citas_proximas: citasRes.data?.length || 0,
        resultados_pendientes: resultadosRes.data?.length || 0,
        recetas_activas: recetasRes.data?.length || 0,
        consultasRecientes: consultasRes.data || []
      })
    } catch (error) {
      console.error('Error cargando dashboard:', error)
      // No fallar silenciosamente, mostrar datos básicos
      setData({
        paciente: null,
        citas_proximas: 0,
        resultados_pendientes: 0,
        recetas_activas: 0,
        consultasRecientes: []
      })
    } finally {
      setIsLoading(false)
    }
  }

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
    <div className="space-y-6">
      {/* Bienvenida */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido, {data?.paciente?.nombre_completo}
        </h1>
        <p className="text-gray-600 mt-2">
          HCU: {data?.paciente?.hcu} | Centro: {data?.paciente?.centro_salud_id || 'No asignado'}
        </p>
      </div>

      {/* Alertas importantes */}
      {data?.paciente?.alergias && JSON.stringify(data.paciente.alergias) !== '[]' && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700">
            Tienes alergias registradas. Revisa tu perfil para ver los detalles.
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de acceso rápido */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Citas */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/portal/citas')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              Citas Próximas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{data?.citas_proximas}</div>
            <p className="text-xs text-gray-500 mt-1">Próximas 30 días</p>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/portal/resultados')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TestTube size={18} className="text-purple-600" />
              Resultados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{data?.resultados_pendientes}</div>
            <p className="text-xs text-gray-500 mt-1">Pendientes de consultar</p>
          </CardContent>
        </Card>

        {/* Recetas */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/portal/recetas')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Pill size={18} className="text-green-600" />
              Recetas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{data?.recetas_activas}</div>
            <p className="text-xs text-gray-500 mt-1">Medicamentos activos</p>
          </CardContent>
        </Card>

        {/* Historial */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/portal/historial')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <FileText size={18} className="text-amber-600" />
              Historial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">Ver</div>
            <p className="text-xs text-gray-500 mt-1">Todo tu historial médico</p>
          </CardContent>
        </Card>
      </div>

      {/* Secciones adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos de Salud */}
        <Card>
          <CardHeader>
            <CardTitle>Datos de Salud</CardTitle>
            <CardDescription>Información médica importante</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Tipo de Sangre</p>
              <p className="text-lg font-semibold text-gray-900">
                {data?.paciente?.tipo_sangre || 'No registrado'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Género</p>
              <p className="text-lg font-semibold text-gray-900">
                {data?.paciente?.genero === 'M' ? 'Masculino' : data?.paciente?.genero === 'F' ? 'Femenino' : 'No registrado'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Centro de Salud</p>
              <p className="text-lg font-semibold text-gray-900">
                {data?.paciente?.centro_salud_id ? 'Asignado' : 'No asignado'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Acciones Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Acceso directo a funciones comunes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/portal/citas')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Programar cita médica
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/portal/resultados')}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Descargar resultados
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/portal/contacto')}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Contactar centro de salud
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/portal/perfil')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Actualizar perfil
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Última actualización */}
      <div className="text-right text-sm text-gray-500">
        <p>Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
      </div>
    </div>
  )
}
