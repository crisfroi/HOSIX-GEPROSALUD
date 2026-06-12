import { useEffect, useRef } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'
import { toast } from 'sonner'

/**
 * Componente que muestra un toast cuando llega una nueva notificación
 * Debe ser incluido en el layout principal
 */
export function NotificationToast() {
  const { notificaciones, estaSilenciado } = useNotifications()
  const ultimaNotifRef = useRef<string | null>(null)

  useEffect(() => {
    const ultimaNotif = notificaciones[0]

    // Solo mostrar si es nueva y no está silenciado
    if (
      ultimaNotif &&
      !ultimaNotif.leida &&
      ultimaNotif.id !== ultimaNotifRef.current &&
      !estaSilenciado
    ) {
      ultimaNotifRef.current = ultimaNotif.id

      // Mostrar toast según la prioridad
      const showToast = () => {
        if (ultimaNotif.prioridad === 'critical') {
          toast.error(ultimaNotif.titulo, {
            description: ultimaNotif.descripcion || '',
            duration: 8000,
          })
        } else if (ultimaNotif.prioridad === 'high') {
          toast.warning(ultimaNotif.titulo, {
            description: ultimaNotif.descripcion || '',
            duration: 6000,
          })
        } else {
          toast.success(ultimaNotif.titulo, {
            description: ultimaNotif.descripcion || '',
            duration: 4000,
          })
        }
      }

      showToast()
    }
  }, [notificaciones, estaSilenciado])

  return null
}
