import { useState, useCallback } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/integrations/supabase/hosixClient'

// ─── Constantes de configuración ────────────────────────────────────────────
const SESSION_KEY = 'profesional_session'
const MAX_INTENTOS_FALLIDOS = 5
const BLOQUEO_MINUTOS = 15
const SESION_HORAS = 8

// ─── Tipos ───────────────────────────────────────────────────────────────────
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Devuelve la sesión almacenada en localStorage si aún es válida,
 * o null si expiró o no existe.
 */
function cargarSesionAlmacenada(): ProfesionalSession | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) return null

    const session = JSON.parse(stored) as ProfesionalSession
    if (new Date(session.expiresAt) > new Date()) return session

    localStorage.removeItem(SESSION_KEY)
  } catch (err) {
    console.error('Error al leer la sesión de profesional:', err)
  }
  return null
}

/**
 * Hash mínimo de contraseña (Base64).
 * ⚠️ NOTA DE SEGURIDAD: Base64 NO es un hash seguro.
 * Migrar a bcrypt mediante una Supabase Edge Function antes de producción.
 */
function hashPassword(password: string): string {
  return btoa(password)
}

/**
 * Calcula la fecha de expiración sumando `horas` a la fecha actual.
 */
function calcularExpiracion(horas: number): Date {
  const fecha = new Date()
  fecha.setHours(fecha.getHours() + horas)
  return fecha
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Hook para autenticación local de profesionales sanitarios.
 * Los profesionales se autentican con ID único + contraseña.
 * (NO usan Supabase Auth — es autenticación local con tabla propia.)
 */
export const useProfesionalAuth = () => {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profesionalSession, setProfesionalSession] =
    useState<ProfesionalSession | null>(cargarSesionAlmacenada)

  // ── Utilidades internas ──────────────────────────────────────────────────

  /** Persiste la sesión en estado y localStorage. */
  const guardarSesion = useCallback((session: ProfesionalSession) => {
    setProfesionalSession(session)
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }, [])

  /** Elimina la sesión del estado y localStorage. */
  const eliminarSesion = useCallback(() => {
    setProfesionalSession(null)
    localStorage.removeItem(SESSION_KEY)
  }, [])

  /** Muestra un toast de error y actualiza el estado de error. */
  const manejarError = useCallback(
    (msg: string, mostrarToast = false) => {
      setError(msg)
      if (mostrarToast) {
        toast({ title: 'Error', description: msg, variant: 'destructive' })
      }
    },
    [toast]
  )

  // ── loginProfesional ─────────────────────────────────────────────────────

  /**
   * Autentica a un profesional con su ID único y contraseña.
   */
  const loginProfesional = useCallback(
    async (idProfesional: string, password: string): Promise<LoginResponse> => {
      setIsLoading(true)
      setError(null)

      try {
        // Validación de entrada
        const idTrimmed = idProfesional.trim()
        if (!idTrimmed || !password) {
          const msg = 'ID de profesional y contraseña requeridos'
          manejarError(msg)
          return { success: false, error: msg }
        }

        // 1. Buscar usuario activo y profesional
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
            bloqueado_hasta,
            intentos_fallidos`
          )
          .eq('id_profesional_unico', idTrimmed)
          .eq('es_profesional', true)
          .eq('activo', true)
          .maybeSingle()   // evita excepción cuando no hay filas

        if (queryError) {
          console.error('Error al consultar usuario:', queryError)
          const msg = 'Error al verificar credenciales'
          manejarError(msg, true)
          return { success: false, error: msg }
        }

        if (!usuario) {
          const msg = 'ID de profesional no encontrado'
          manejarError(msg, true)
          return { success: false, error: msg }
        }

        // 2. Verificar bloqueo temporal
        if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
          const msg = 'Cuenta bloqueada temporalmente por intentos fallidos'
          manejarError(msg)
          return { success: false, error: msg }
        }

        // 3. Validar contraseña
        const passwordMatches = usuario.contrasena_hasheada === hashPassword(password)

        if (!passwordMatches) {
          const intentosFallidos = (usuario.intentos_fallidos ?? 0) + 1
          const bloqueado = intentosFallidos >= MAX_INTENTOS_FALLIDOS

          const updatePayload = bloqueado
            ? {
                intentos_fallidos: intentosFallidos,
                bloqueado_hasta: (() => {
                  const t = new Date()
                  t.setMinutes(t.getMinutes() + BLOQUEO_MINUTOS)
                  return t.toISOString()
                })(),
              }
            : { intentos_fallidos: intentosFallidos }

          await supabase
            .from('hosix_usuarios')
            .update(updatePayload)
            .eq('id', usuario.id)

          const msg = bloqueado
            ? `Demasiados intentos fallidos. Cuenta bloqueada ${BLOQUEO_MINUTOS} minutos.`
            : `Contraseña incorrecta (${intentosFallidos}/${MAX_INTENTOS_FALLIDOS} intentos)`

          manejarError(msg, !bloqueado)
          return { success: false, error: msg }
        }

        // 4. Login exitoso — resetear contadores y registrar acceso
        await supabase
          .from('hosix_usuarios')
          .update({
            intentos_fallidos: 0,
            bloqueado_hasta: null,
            ultimo_acceso: new Date().toISOString(),
          })
          .eq('id', usuario.id)

        // 5. Obtener nombre del centro (en paralelo con la actualización anterior)
        const { data: centro } = await supabase
          .from('centros_salud')
          .select('nombre')
          .eq('id', usuario.centro_salud_id)
          .maybeSingle()

        // 6. Crear y persistir sesión
        const session: ProfesionalSession = {
          usuario_id: usuario.id,
          id_profesional: usuario.id_profesional_unico ?? '',
          nombre_completo: usuario.nombre_completo,
          centro_salud_id: usuario.centro_salud_id,
          centro_salud_nombre: centro?.nombre ?? undefined,
          especialidad: usuario.especialidad ?? undefined,
          cambio_password_requerido: usuario.cambio_password_requerido ?? false,
          expiresAt: calcularExpiracion(SESION_HORAS).toISOString(),
        }

        guardarSesion(session)

        toast({
          title: 'Bienvenido',
          description: `Bienvenido, ${usuario.nombre_completo}`,
        })

        return {
          success: true,
          requiresPasswordChange: session.cambio_password_requerido,
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido'
        manejarError(msg)
        console.error('Error en login de profesional:', err)
        return { success: false, error: msg }
      } finally {
        setIsLoading(false)
      }
    },
    [guardarSesion, manejarError, toast]
  )

  // ── cambiarContrasena ────────────────────────────────────────────────────

  /**
   * Cambia la contraseña del profesional autenticado.
   * Registra el cambio en la tabla de auditoría.
   */
  const cambiarContrasena = useCallback(
    async (
      usuarioId: string,
      passwordAnterior: string,
      passwordNueva: string
    ): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        if (passwordAnterior === passwordNueva) {
          manejarError('La nueva contraseña debe ser diferente a la anterior')
          return false
        }

        // Obtener hash actual para validación
        const { data: usuario, error: queryError } = await supabase
          .from('hosix_usuarios')
          .select('contrasena_hasheada')
          .eq('id', usuarioId)
          .single()

        if (queryError || !usuario) {
          throw new Error('Usuario no encontrado')
        }

        if (usuario.contrasena_hasheada !== hashPassword(passwordAnterior)) {
          manejarError('Contraseña actual incorrecta')
          return false
        }

        // Actualizar contraseña
        const { error: updateError } = await supabase
          .from('hosix_usuarios')
          .update({
            contrasena_hasheada: hashPassword(passwordNueva),
            cambio_password_requerido: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', usuarioId)

        if (updateError) throw updateError

        // Auditoría (sin bloquear el flujo si falla)
        await supabase
          .from('hosix_profesionales_cambios_password')
          .insert({
            usuario_id: usuarioId,
            password_anterior_hash: usuario.contrasena_hasheada,
            cambio_tipo: 'obligatorio',
            motivo: 'Primer login - cambio obligatorio',
          })
          .then(({ error }) => {
            if (error) console.warn('No se pudo registrar auditoría de contraseña:', error)
          })

        toast({ title: 'Éxito', description: 'Contraseña cambiada correctamente' })

        // Actualizar sesión en memoria y localStorage
        if (profesionalSession) {
          guardarSesion({ ...profesionalSession, cambio_password_requerido: false })
        }

        return true
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al cambiar contraseña'
        manejarError(msg)
        console.error('Error cambiando contraseña:', err)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [guardarSesion, manejarError, profesionalSession, toast]
  )

  // ── logoutProfesional ────────────────────────────────────────────────────

  /** Cierra la sesión del profesional. */
  const logoutProfesional = useCallback(() => {
    eliminarSesion()
    setError(null)
    toast({ title: 'Sesión cerrada', description: 'Ha cerrado sesión correctamente' })
  }, [eliminarSesion, toast])

  // ── API pública ──────────────────────────────────────────────────────────

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
