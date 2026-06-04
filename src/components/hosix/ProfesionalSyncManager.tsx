import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, Users, Check, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useHosixAuth } from '@/hooks/useHosixAuth'
import { useProfesionalesSync } from '@/hooks/useProfesionalesSync'
import { supabase } from '@/integrations/supabase/hosixClient'

const ProfesionalSyncManager: React.FC = () => {
  const { user } = useHosixAuth()
  const { syncProfesionalesCentro, syncing, syncProgress } = useProfesionalesSync()
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [syncResult, setSyncResult] = useState<any>(null)

  // Obtener profesionales sincronizados del centro actual
  const { data: profesionalesSincronizados = [], isLoading: loadingProfesionales } = useQuery({
    queryKey: ['profesionales-sincronizados', user?.centro_salud_id],
    queryFn: async () => {
      if (!user?.centro_salud_id) return []

      const { data, error } = await supabase
        .from('hosix_usuarios')
        .select('*')
        .eq('centro_salud_id', user.centro_salud_id)
        .eq('es_profesional', true)
        .order('nombre_completo', { ascending: true })

      if (error) {
        console.error('Error obteniendo profesionales:', error)
        return []
      }

      return data || []
    },
    enabled: !!user?.centro_salud_id,
  })

  // Obtener última sincronización
  const { data: ultimaSincronizacion } = useQuery({
    queryKey: ['ultima-sincronizacion', user?.id],
    queryFn: async () => {
      if (!user?.id) return null

      const { data, error } = await supabase
        .from('hosix_sincronizacion_profesionales')
        .select('*')
        .eq('director_id', user.id)
        .order('fecha_inicio', { ascending: false })
        .limit(1)
        .single()

      if (error) return null
      return data
    },
    enabled: !!user?.id,
  })

  const handleSync = async () => {
    if (!user?.id || !user?.centro_salud_id) {
      return
    }

    const result = await syncProfesionalesCentro(user.centro_salud_id, user.id)
    setLastSync(new Date())
    setSyncResult(result)
  }

  if (!user || user.rol !== 'DIRECTOR') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Solo los directores pueden sincronizar profesionales
        </AlertDescription>
      </Alert>
    )
  }

  const progressPercent = syncProgress
    ? (syncProgress.procesados / syncProgress.total) * 100
    : 0

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Profesionales Sincronizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{profesionalesSincronizados.length}</div>
            <p className="text-xs text-gray-500 mt-2">En su centro</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Última Sincronización
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {ultimaSincronizacion
                ? new Date(ultimaSincronizacion.fecha_inicio).toLocaleDateString('es-ES')
                : 'Nunca'}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {ultimaSincronizacion
                ? `${ultimaSincronizacion.nuevos_insertados} nuevos, ${ultimaSincronizacion.actualizados} actualizados`
                : 'Ninguna sincronización realizada aún'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Profesionales Pendientes Cambio Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {profesionalesSincronizados.filter((p) => p.cambio_password_requerido).length}
            </div>
            <p className="text-xs text-gray-500 mt-2">Deben cambiar en primer login</p>
          </CardContent>
        </Card>
      </div>

      {/* Panel de sincronización */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Sincronizar Profesionales
          </CardTitle>
          <CardDescription>
            Descargue los profesionales aprobados del registro centralizado para su centro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {syncing && syncProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  Sincronizando: {syncProgress.procesados} de {syncProgress.total}
                </span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}

          {syncResult && (
            <Alert
              variant={syncResult.errores.length === 0 ? 'default' : 'destructive'}
              className="mt-4"
            >
              <Check className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">
                  {syncResult.nuevos + syncResult.actualizados} profesionales procesados
                </p>
                <p className="text-sm mt-1">
                  {syncResult.nuevos} nuevos • {syncResult.actualizados} actualizados
                </p>
                {syncResult.errores.length > 0 && (
                  <div className="mt-3 text-sm">
                    <p className="font-medium text-red-700">Errores:</p>
                    <ul className="list-disc list-inside mt-1">
                      {syncResult.errores.slice(0, 5).map((err: string, i: number) => (
                        <li key={i} className="text-red-600">
                          {err}
                        </li>
                      ))}
                      {syncResult.errores.length > 5 && (
                        <li className="text-red-600">
                          +{syncResult.errores.length - 5} errores más
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSync}
            disabled={syncing}
            className="w-full gap-2"
            size="lg"
          >
            {syncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Sincronizar Ahora
              </>
            )}
          </Button>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
            <p className="font-medium mb-2">Información importante:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Se sincronizarán todos los profesionales aprobados de su centro</li>
              <li>Los nuevos profesionales recibirán una contraseña temporal</li>
              <li>Deberán cambiar su contraseña en el primer acceso</li>
              <li>Los datos existentes se actualizarán automáticamente</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de profesionales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Profesionales de su Centro
          </CardTitle>
          <CardDescription>
            {profesionalesSincronizados.length} profesionales registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingProfesionales ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : profesionalesSincronizados.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No hay profesionales sincronizados aún</p>
              <p className="text-sm">Realice una sincronización para comenzar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4">ID Profesional</th>
                    <th className="text-left py-3 px-4">Nombre</th>
                    <th className="text-left py-3 px-4">Especialidad</th>
                    <th className="text-center py-3 px-4">Cambio Password</th>
                    <th className="text-center py-3 px-4">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {profesionalesSincronizados.map((prof) => (
                    <tr key={prof.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-xs">
                        {prof.id_profesional_unico}
                      </td>
                      <td className="py-3 px-4">{prof.nombre_completo}</td>
                      <td className="py-3 px-4 text-gray-600">{prof.especialidad || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        {prof.cambio_password_requerido ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                            <AlertCircle className="w-3 h-3" />
                            Requerido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            <Check className="w-3 h-3" />
                            Completado
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {prof.activo ? (
                          <span className="text-green-600 font-medium">Activo</span>
                        ) : (
                          <span className="text-gray-400 font-medium">Inactivo</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfesionalSyncManager
