import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/integrations/supabase/hosixClient'

export interface ProfesionalRemoto {
  id: string
  id_profesional_unico: string
  nombre_completo: string
  especialidad?: string | null
  area_profesional?: string | null
  email?: string | null
  telefono?: string | null
  fecha_nacimiento?: string | null
  genero?: string | null
  numero_funcionario?: string | null
  estado_solicitud?: string | null
  centro_salud_id: string
}

export interface ProfesionalLocal {
  id: string
  id_profesional_unico: string
  nombre_completo: string
  centro_salud_id: string
  especialidad?: string
  es_profesional: boolean
  activo: boolean
  fecha_sincronizacion?: string
}

interface SyncResult {
  total: number
  nuevos: number
  actualizados: number
  errores: string[]
}

/**
 * Hook para sincronizar profesionales sanitarios desde el registro centralizado
 * Solo el director de un centro puede sincronizar profesionales de su centro
 */
export const useProfesionalesSync = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [syncing, setSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState<{
    total: number
    procesados: number
  } | null>(null)

  /**
   * Obtiene profesionales del sistema remoto (Supabase registro)
   */
  const obtenerProfesionalesRemoto = useCallback(
    async (centroSaludId: string): Promise<ProfesionalRemoto[]> => {
      try {
        // Conectar al Supabase remoto (desde env de registro)
        const remoteUrl =
          import.meta.env.VITE_RENAPROSA_SUPABASE_URL ||
          'https://wdieynendfjbkbhfovrx.supabase.co'
        const remoteKey =
          import.meta.env.VITE_RENAPROSA_SUPABASE_ANON_KEY ||
          'sb_publishable_9KoyZtFgO79lLad'

        const response = await fetch(
          `${remoteUrl}/rest/v1/profesionales_sanitarios?centro_salud_id=eq.${centroSaludId}&estado_solicitud=eq.Aprobado&select=id,id_profesional_unico,nombre_completo,especialidad,area_profesional,email,telefono,fecha_nacimiento,genero,numero_funcionario,estado_solicitud,centro_salud_id`,
          {
            headers: {
              Authorization: `Bearer ${remoteKey}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!response.ok) {
          throw new Error(`Error obtieniendo profesionales: ${response.statusText}`)
        }

        const profesionales = (await response.json()) as ProfesionalRemoto[]
        return profesionales
      } catch (error) {
        console.error('Error obtieniendo profesionales del remoto:', error)
        throw error
      }
    },
    []
  )

  /**
   * Genera contraseña inicial: id_profesional + "123456"
   */
  const generarContrasenaInicial = (idProfesional: string): string => {
    return `${idProfesional}123456`
  }

  /**
   * Hash simple de contraseña (en producción usar bcrypt real)
   * NOTA: Esto es un placeholder. Debería usar pgcrypto en Supabase o bcrypt en Node.js
   */
  const hashPassword = (password: string): string => {
    // En desarrollo, usar base64 (NO SEGURO EN PRODUCCIÓN)
    return btoa(password)
  }

  /**
   * Sincronizar profesionales de un centro
   */
  const syncProfesionalesCentro = useCallback(
    async (centroSaludId: string, directorId: string): Promise<SyncResult> => {
      try {
        setSyncing(true)
        setSyncProgress({ total: 0, procesados: 0 })
        const errores: string[] = []

        // 1. Obtener profesionales del remoto
        const profesionalesRemoto = await obtenerProfesionalesRemoto(centroSaludId)

        if (profesionalesRemoto.length === 0) {
          toast({
            title: 'Sin profesionales',
            description: 'No hay profesionales para sincronizar en este centro',
            variant: 'destructive',
          })
          return { total: 0, nuevos: 0, actualizados: 0, errores }
        }

        setSyncProgress({ total: profesionalesRemoto.length, procesados: 0 })

        let nuevosCount = 0
        let actualizadosCount = 0

        // 2. Procesar cada profesional
        for (let i = 0; i < profesionalesRemoto.length; i++) {
          const prof = profesionalesRemoto[i]

          try {
            // Verificar si profesional ya existe localmente
            const { data: existente } = await supabase
              .from('hosix_usuarios')
              .select('id, contrasena_default_usada')
              .eq('id_profesional_unico', prof.id_profesional_unico)
              .eq('es_profesional', true)
              .single()

            if (existente) {
              // Actualizar datos (excepto contraseña si ya fue cambiada)
              await supabase
                .from('hosix_usuarios')
                .update({
                  nombre_completo: prof.nombre_completo,
                  email: prof.email,
                  especialidad: prof.especialidad,
                  area_profesional: prof.area_profesional,
                  telefono: prof.telefono,
                  fecha_nacimiento: prof.fecha_nacimiento,
                  genero: prof.genero,
                  numero_funcionario: prof.numero_funcionario,
                  estado_solicitud: prof.estado_solicitud || 'Aprobado',
                  fecha_sincronizacion: new Date().toISOString(),
                  profesional_remoto_id: prof.id,
                  activo: true,
                })
                .eq('id', existente.id)

              actualizadosCount++
            } else {
              // Crear nuevo usuario profesional
              const contrasenaInicial = generarContrasenaInicial(prof.id_profesional_unico)
              const contrasenaHasheada = hashPassword(contrasenaInicial)

              const { error: insertError } = await supabase
                .from('hosix_usuarios')
                .insert({
                  username: prof.id_profesional_unico.toLowerCase(),
                  email: prof.email || `${prof.id_profesional_unico}@hospital.local`,
                  nombre_completo: prof.nombre_completo,
                  centro_salud_id: centroSaludId,
                  perfil_id: null, // Los profesionales no tienen perfil administrativo
                  es_profesional: true,
                  id_profesional_unico: prof.id_profesional_unico,
                  especialidad: prof.especialidad,
                  area_profesional: prof.area_profesional,
                  telefono: prof.telefono,
                  fecha_nacimiento: prof.fecha_nacimiento,
                  genero: prof.genero,
                  numero_funcionario: prof.numero_funcionario,
                  estado_solicitud: prof.estado_solicitud || 'Aprobado',
                  contrasena_hasheada: contrasenaHasheada,
                  cambio_password_requerido: true,
                  contrasena_default_usada: true,
                  activo: true,
                  fecha_sincronizacion: new Date().toISOString(),
                  profesional_remoto_id: prof.id,
                })

              if (insertError) {
                throw insertError
              }

              nuevosCount++
            }

            setSyncProgress((prev) =>
              prev ? { ...prev, procesados: prev.procesados + 1 } : null
            )
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
            errores.push(`${prof.nombre_completo}: ${errorMsg}`)
            console.error(`Error sincronizando profesional ${prof.id_profesional_unico}:`, err)
          }
        }

        // 3. Registrar sincronización en auditoría
        try {
          await supabase.from('hosix_sincronizacion_profesionales').insert({
            director_id: directorId,
            centro_salud_id: centroSaludId,
            total_profesionales: profesionalesRemoto.length,
            nuevos_insertados: nuevosCount,
            actualizados: actualizadosCount,
            fecha_fin: new Date().toISOString(),
            estado: errores.length > 0 ? 'parcial' : 'completada',
            mensaje_error: errores.length > 0 ? errores.join('; ') : null,
          })
        } catch (err) {
          console.error('Error registrando sincronización:', err)
        }

        // 4. Mostrar resultado
        const resultado: SyncResult = {
          total: profesionalesRemoto.length,
          nuevos: nuevosCount,
          actualizados: actualizadosCount,
          errores,
        }

        const mensaje =
          errores.length === 0
            ? `Sincronización completada: ${nuevosCount} nuevos, ${actualizadosCount} actualizados`
            : `Sincronización parcial: ${nuevosCount} nuevos, ${actualizadosCount} actualizados, ${errores.length} errores`

        toast({
          title: errores.length === 0 ? 'Éxito' : 'Parcialmente completado',
          description: mensaje,
          variant: errores.length === 0 ? 'default' : 'destructive',
        })

        // Invalidar cache de usuarios
        queryClient.invalidateQueries({ queryKey: ['hosix-usuarios'] })

        return resultado
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error en sincronización'
        console.error('Error sincronizando profesionales:', error)
        toast({
          title: 'Error',
          description: msg,
          variant: 'destructive',
        })
        return { total: 0, nuevos: 0, actualizados: 0, errores: [msg] }
      } finally {
        setSyncing(false)
        setSyncProgress(null)
      }
    },
    [obtenerProfesionalesRemoto, toast, queryClient]
  )

  /**
   * Mutation para sincronizar (opcional, usando React Query)
   */
  const syncMutation = useMutation({
    mutationFn: async ({ centroId, directorId }: { centroId: string; directorId: string }) => {
      return syncProfesionalesCentro(centroId, directorId)
    },
  })

  return {
    // Estado
    syncing: syncing || syncMutation.isPending,
    syncProgress,
    error: syncMutation.error,

    // Métodos
    syncProfesionalesCentro,
    obtenerProfesionalesRemoto,

    // Mutation
    syncMutation,
  }
}
