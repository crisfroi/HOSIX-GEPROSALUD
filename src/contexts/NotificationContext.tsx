import React, { createContext, useState, useCallback, useEffect, useRef } from 'react'
import { RealtimeChannel } from '@supabase/realtime-js'
import { supabase } from '@/integrations/supabase/hosixClient'

export interface Notification {
  id: string
  usuario_id: string
  tipo: string
  titulo: string
  descripcion?: string
  datos?: Record<string, any>
  leida: boolean
  fecha_creacion: string
  prioridad: 'critical' | 'high' | 'normal' | 'low'
}

export interface NotificationContextType {
  notificaciones: Notification[]
  noLeidasCount: number
  cargando: boolean
  marcarComoLeida: (id: string) => Promise<void>
  marcarTodasComoLeidas: () => Promise<void>
  borrar: (id: string) => Promise<void>
  reproducirSonido: (tipo?: string) => void
  anunciarPorAltavoz: (texto: string) => void
  silenciarTemporal: (minutos: number) => void
  reiniciarSilencio: () => void
  estaSilenciado: boolean
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notificaciones, setNotificaciones] = useState<Notification[]>([])
  const [cargando, setCargando] = useState(true)
  const [silencioHasta, setSilencioHasta] = useState<Date | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Cargar notificaciones iniciales
  useEffect(() => {
    const cargarNotificaciones = async () => {
      try {
        const usuario = await supabase.auth.getUser()
        if (!usuario.data.user?.id) return

        const { data, error } = await supabase
          .from('hosix_notificaciones')
          .select('*')
          .eq('usuario_id', usuario.data.user.id)
          .order('fecha_creacion', { ascending: false })
          .limit(100)

        if (!error && data) {
          setNotificaciones(data as Notification[])
        }
      } catch (error) {
        console.error('Error cargando notificaciones:', error)
      } finally {
        setCargando(false)
      }
    }

    cargarNotificaciones()
  }, [])

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    const subscribirANotificaciones = async () => {
      try {
        const usuario = await supabase.auth.getUser()
        if (!usuario.data.user?.id) return

        const userId = usuario.data.user.id
        const channel = supabase
          .channel(`notif:${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'hosix_notificaciones',
              filter: `usuario_id=eq.${userId}`,
            },
            (payload) => {
              const notif = payload.new as Notification
              setNotificaciones((prev) => [notif, ...prev])

              // Reproducir sonido si no está silenciado
              if (!silencioHasta || new Date() > silencioHasta) {
                reproducirSonido()
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'hosix_notificaciones',
              filter: `usuario_id=eq.${userId}`,
            },
            (payload) => {
              const notif = payload.new as Notification
              setNotificaciones((prev) =>
                prev.map((n) => (n.id === notif.id ? notif : n))
              )
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'hosix_notificaciones',
              filter: `usuario_id=eq.${userId}`,
            },
            (payload) => {
              const deletedId = payload.old.id
              setNotificaciones((prev) => prev.filter((n) => n.id !== deletedId))
            }
          )
          .subscribe()

        channelRef.current = channel
      } catch (error) {
        console.error('Error subscribiendo a notificaciones:', error)
      }
    }

    subscribirANotificaciones()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [silencioHasta])

  // Marcar como leída
  const marcarComoLeida = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('hosix_notificaciones')
        .update({
          leida: true,
          fecha_lectura: new Date().toISOString(),
        })
        .eq('id', id)

      if (!error) {
        setNotificaciones((prev) =>
          prev.map((n) =>
            n.id === id
              ? { ...n, leida: true, fecha_lectura: new Date().toISOString() }
              : n
          )
        )
      }
    } catch (error) {
      console.error('Error marcando notificación como leída:', error)
    }
  }, [])

  // Marcar todas como leídas
  const marcarTodasComoLeidas = useCallback(async () => {
    try {
      const sinLeer = notificaciones.filter((n) => !n.leida).map((n) => n.id)
      if (sinLeer.length === 0) return

      const { error } = await supabase
        .from('hosix_notificaciones')
        .update({
          leida: true,
          fecha_lectura: new Date().toISOString(),
        })
        .in('id', sinLeer)

      if (!error) {
        setNotificaciones((prev) =>
          prev.map((n) => ({
            ...n,
            leida: true,
            fecha_lectura: new Date().toISOString(),
          }))
        )
      }
    } catch (error) {
      console.error('Error marcando notificaciones como leídas:', error)
    }
  }, [notificaciones])

  // Borrar notificación
  const borrar = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('hosix_notificaciones')
        .delete()
        .eq('id', id)

      if (!error) {
        setNotificaciones((prev) => prev.filter((n) => n.id !== id))
      }
    } catch (error) {
      console.error('Error borrando notificación:', error)
    }
  }, [])

  // Reproducir sonido
  const reproducirSonido = useCallback((tipo: string = 'chime') => {
    try {
      // Crear elemento de audio dinámicamente
      const audio = new Audio(`/sounds/notification-${tipo}.mp3`)
      audio.volume = 0.7
      audio.play().catch((err) => {
        console.log('No se pudo reproducir sonido:', err)
      })
    } catch (error) {
      console.error('Error reproduciendo sonido:', error)
    }
  }, [])

  // Anunciar por altavoz con Web Speech API
  const anunciarPorAltavoz = useCallback((texto: string) => {
    try {
      if ('speechSynthesis' in window) {
        // Cancelar cualquier síntesis previa
        speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(texto)
        utterance.lang = 'es-ES'
        utterance.rate = 0.9
        utterance.pitch = 1.0
        utterance.volume = 1.0

        speechSynthesis.speak(utterance)
      }
    } catch (error) {
      console.error('Error anunciando por altavoz:', error)
    }
  }, [])

  // Silenciar temporal
  const silenciarTemporal = useCallback((minutos: number) => {
    const fecha = new Date(Date.now() + minutos * 60000)
    setSilencioHasta(fecha)
  }, [])

  // Reiniciar silencio
  const reiniciarSilencio = useCallback(() => {
    setSilencioHasta(null)
  }, [])

  const noLeidasCount = notificaciones.filter((n) => !n.leida).length
  const estaSilenciado = silencioHasta ? new Date() < silencioHasta : false

  const value: NotificationContextType = {
    notificaciones,
    noLeidasCount,
    cargando,
    marcarComoLeida,
    marcarTodasComoLeidas,
    borrar,
    reproducirSonido,
    anunciarPorAltavoz,
    silenciarTemporal,
    reiniciarSilencio,
    estaSilenciado,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = React.useContext(NotificationContext)
  if (!context) {
    throw new Error(
      'useNotifications debe usarse dentro de NotificationProvider'
    )
  }
  return context
}
