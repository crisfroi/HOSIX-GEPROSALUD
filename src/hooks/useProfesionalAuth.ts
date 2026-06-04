import { useState, useCallback } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/integrations/supabase/hosixClient'
import { useAuthStore, AuthUser } from '@/stores/authStore'

export interface ProfesionalSession {
  usuario_id: string
  id_profesional: string
  nombre_completo: string
  centro_salud_id: string
  centro_salud_nombre?: string
  especialidad?: string
  cambio_password_requerido: boolean
  expiresAt: string
}

interface LoginResponse {
  success: boolean
  error?: string
  requiresPasswordChange?: boolean
}

/**
 * Hook para autenticación local de profesionales sanitarios
 * Los profesionales se autentican con ID único + contraseña
 * (NO usan Supabase Auth, es autenticación local)
 */
export const useProfesionalAuth = () => {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profesionalSession, setProfesionalSession] = useState<ProfesionalSession | null>(
    () => {
      try {
        const stored = localStorage.getItem('profesional_session')
        if (stored) {
          const session = JSON.parse(stored) as ProfesionalSession
          const expiresAt = new Date(session.expiresAt)
          if (expiresAt > new Date()) {
            return session
          }
          localStorage.removeItem('profesional_session')
        }
      } catch (err) {
        console.error('Error parsing profesional session:', err)
      }
      return null
    }
  )

  /**
   * Intenta hacer login con ID de profesional + contraseña
   */
  const loginProfesional = useCallback(
    async (idProfesional: string, password: string): Promise<LoginResponse> => {
      try {
        setIsLoading(true)
        setError(null)

        if (!idProfesional || !password) {
          const msg = 'ID de profesional y contraseña requeridos'
          setError(msg)
          return { success: false, error: msg }
        }

        // 1. Obtener usuario profesional por ID
        const { data: usuario, error: queryError } = await supabase
          .from('hosix_usuarios')
          .select(
            `id,
            id_profesional_unico,
            nombre_completo,
            centro_salud_id,
            especialidad,
            contrasena_hasheada,
            cambio_password_requerido,
            activo,
            bloqueado_hasta,
            intentos_fallidos`
          )
          .eq('id_profesional_unico', idProfesional.trim())
          .eq('es_profesional', true)
          .eq('activo', true)
          .single()

        if (queryError || !usuario) {
          const msg = 'ID de profesional no encontrado'
          setError(msg)
          toast({
            title: 'Error',
            description: msg,
            variant: 'destructive',
          })
          return { success: false, error: msg }
        }

        // 2. Verificar bloqueo temporal
        if (usuario.bloqueado_hasta) {
          const bloqueadoHasta = new Date(usuario.bloqueado_hasta)
          if (bloqueadoHasta > new Date()) {
            const msg = 'Cuenta bloqueada temporalmente por intentos fallidos'
            setError(msg)
            return { success: false, error: msg }
          }
        }

        // 3. Validar contraseña (simple comparación por ahora)
        // NOTA: En producción, usar bcrypt.compare() con pgcrypto o Edge Function
        // Por ahora, asumimos que la contraseña viene hasheada en la BD
        const passwordMatches = usuario.contrasena_hasheada === btoa(password)

        if (!passwordMatches) {
          // Incrementar intentos fallidos
          const intentosFallidos = (usuario.intentos_fallidos || 0) + 1
          let bloqueadoHasta: Date | null = null

          // Bloquear después de 5 intentos fallidos
          if (intentosFallidos >= 5) {
            bloqueadoHasta = new Date()
            bloqueadoHasta.setMinutes(bloqueadoHasta.getMinutes() + 15) // 15 minutos

            await supabase
              .from('hosix_usuarios')
              .update({
                intentos_fallidos: intentosFallidos,
                bloqueado_hasta: bloqueadoHasta.toISOString(),
              })
              .eq('id', usuario.id)

            const msg = 'Demasiados intentos fallidos. Cuenta bloqueada 15 minutos.'
            setError(msg)
            return { success: false, error: msg }
          }

          // Registrar intento fallido
          await supabase
            .from('hosix_usuarios')
            .update({ intentos_fallidos: intentosFallidos })
            .eq('id', usuario.id)

          const msg = `Contraseña incorrecta (${intentosFallidos}/5 intentos)`
          setError(msg)
          toast({
            title: 'Error',
            description: msg,
            variant: 'destructive',
          })
          return { success: false, error: msg }
        }

        // 4. Login exitoso - resetear intentos fallidos
        await supabase
          .from('hosix_usuarios')
          .update({
            intentos_fallidos: 0,
            bloqueado_hasta: null,
            ultimo_acceso: new Date().toISOString(),
          })
          .eq('id', usuario.id)

        // 5. Obtener nombre del centro
        const { data: centro } = await supabase
          .from('centros_salud')
          .select('nombre')
          .eq('id', usuario.centro_salud_id)
          .single()

        // 6. Crear sesión
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 8)

        const session: ProfesionalSession = {
          usuario_id: usuario.id,
          id_profesional: usuario.id_profesional_unico || '',
          nombre_completo: usuario.nombre_completo,
          centro_salud_id: usuario.centro_salud_id,
          centro_salud_nombre: centro?.nombre,
          especialidad: usuario.especialidad || undefined,
          cambio_password_requerido: usuario.cambio_password_requerido || false,
          expiresAt: expiresAt.toISOString(),
        }

        setProfesionalSession(session)
        localStorage.setItem('profesional_session', JSON.stringify(session))

        toast({
          title: 'Bienvenido',
          description: `Bienvenido ${usuario.nombre_completo}`,
        })

        return {
          success: true,
          requiresPasswordChange: usuario.cambio_password_requerido || false,
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido'
        setError(msg)
        console.error('Error en login de profesional:', err)
        return { success: false, error: msg }
      } finally {
        setIsLoading(false)
      }
    },
    [toast]
  )

  /**
   * Cambiar contraseña del profesional
   */
  const cambiarContrasena = useCallback(
    async (usuarioId: string, passwordAnterior: string, passwordNueva: string) => {
      try {
        setIsLoading(true)
        setError(null)

        // Validar que la nueva contraseña sea diferente
        if (passwordAnterior === passwordNueva) {
          const msg = 'La nueva contraseña debe ser diferente a la anterior'
          setError(msg)
          return false
        }

        // Obtener usuario actual para validar password anterior
        const { data: usuario, error: queryError } = await supabase
          .from('hosix_usuarios')
          .select('contrasena_hasheada')
          .eq('id', usuarioId)
          .single()

        if (queryError || !usuario) {
          throw new Error('Usuario no encontrado')
        }

        // Validar password anterior
        const passwordAnteriorMatch = usuario.contrasena_hasheada === btoa(passwordAnterior)
        if (!passwordAnteriorMatch) {
          const msg = 'Contraseña actual incorrecta'
          setError(msg)
          return false
        }

        // Hash de la nueva contraseña
        const newPasswordHash = btoa(passwordNueva)

        // Actualizar contraseña
        const { error: updateError } = await supabase
          .from('hosix_usuarios')
          .update({
            contrasena_hasheada: newPasswordHash,
            cambio_password_requerido: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', usuarioId)

        if (updateError) throw updateError

        // Registrar cambio en auditoría
        await supabase.from('hosix_profesionales_cambios_password').insert({
          usuario_id: usuarioId,
          password_anterior_hash: usuario.contrasena_hasheada,
          cambio_tipo: 'obligatorio',
          motivo: 'Primer login - cambio obligatorio',
        })

        toast({
          title: 'Éxito',
          description: 'Contraseña cambiada correctamente',
        })

        // Actualizar sesión
        if (profesionalSession) {
          const updatedSession = {
            ...profesionalSession,
            cambio_password_requerido: false,
          }
          setProfesionalSession(updatedSession)
          localStorage.setItem('profesional_session', JSON.stringify(updatedSession))
        }

        return true
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al cambiar contraseña'
        setError(msg)
        console.error('Error cambiando contraseña:', err)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [profesionalSession, toast]
  )

  /**
   * Cerrar sesión de profesional
   */
  const logoutProfesional = useCallback(() => {
    setProfesionalSession(null)
    localStorage.removeItem('profesional_session')
    setError(null)
    toast({
      title: 'Sesión cerrada',
      description: 'Ha cerrado sesión correctamente',
    })
  }, [toast])

  return {
    // Estado
    isLoading,
    error,
    profesionalSession,
    isAuthenticated: !!profesionalSession,

    // Métodos
    loginProfesional,
    cambiarContrasena,
    logoutProfesional,
  }
}
