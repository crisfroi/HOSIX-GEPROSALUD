import React, { useState } from 'react'
import { Bell, Trash2, Volume2, VolumeX, Check } from 'lucide-react'
import { useNotifications } from '@/contexts/NotificationContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const {
    notificaciones,
    noLeidasCount,
    cargando,
    marcarComoLeida,
    marcarTodasComoLeidas,
    borrar,
    silenciarTemporal,
    reiniciarSilencio,
    estaSilenciado,
  } = useNotifications()

  const [abierto, setAbierto] = useState(false)

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'critical':
        return 'border-red-300 bg-red-50'
      case 'high':
        return 'border-orange-300 bg-orange-50'
      case 'normal':
        return 'border-blue-300 bg-blue-50'
      case 'low':
        return 'border-gray-300 bg-gray-50'
      default:
        return 'border-gray-300 bg-gray-50'
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'laboratorio':
        return '🧪'
      case 'imagenologia':
        return '🖼️'
      case 'admision':
        return '📋'
      case 'caja':
        return '💰'
      case 'recaudacion':
        return '📊'
      default:
        return '🔔'
    }
  }

  return (
    <DropdownMenu open={abierto} onOpenChange={setAbierto}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          {noLeidasCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {noLeidasCount > 99 ? '99+' : noLeidasCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96">
        {cargando ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin h-5 w-5 mx-auto mb-2">⏳</div>
            Cargando notificaciones...
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm">
                  Notificaciones {noLeidasCount > 0 && `(${noLeidasCount})`}
                </h3>
                {estaSilenciado && (
                  <Badge variant="secondary" className="text-xs">
                    🔇 Silenciado
                  </Badge>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2 text-xs">
                {noLeidasCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7"
                    onClick={marcarTodasComoLeidas}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Marcar todas
                  </Button>
                )}

                {!estaSilenciado ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7"
                    onClick={() => silenciarTemporal(15)}
                    title="Silenciar durante 15 minutos"
                  >
                    <VolumeX className="h-3 w-3 mr-1" />
                    Silenciar
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7"
                    onClick={reiniciarSilencio}
                  >
                    <Volume2 className="h-3 w-3 mr-1" />
                    Activar
                  </Button>
                )}
              </div>
            </div>

            {/* Lista de notificaciones */}
            <ScrollArea className="h-96">
              {notificaciones.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-sm">No hay notificaciones</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {notificaciones.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        'p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md',
                        getPrioridadColor(notif.prioridad),
                        !notif.leida && 'font-medium'
                      )}
                      onClick={() => marcarComoLeida(notif.id)}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <span className="text-lg">{getTipoIcon(notif.tipo)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm leading-tight">
                                {notif.titulo}
                              </p>
                              {notif.descripcion && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {notif.descripcion}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {formatearFecha(notif.fecha_creacion)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            borrar(notif.id)
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 mt-1"
                          title="Borrar notificación"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {!notif.leida && (
                        <div className="flex justify-end mt-2">
                          <Badge variant="default" className="text-xs">
                            Nueva
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Helper para formatear fecha
function formatearFecha(fechaString: string): string {
  const fecha = new Date(fechaString)
  const ahora = new Date()
  const diferencia = ahora.getTime() - fecha.getTime()
  const minutos = Math.floor(diferencia / 60000)
  const horas = Math.floor(diferencia / 3600000)
  const dias = Math.floor(diferencia / 86400000)

  if (minutos < 1) return 'Justo ahora'
  if (minutos < 60) return `Hace ${minutos}m`
  if (horas < 24) return `Hace ${horas}h`
  if (dias < 7) return `Hace ${dias}d`

  return fecha.toLocaleDateString('es-ES', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
