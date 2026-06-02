import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import useHosixMedicos from '@/hooks/useHosixMedicos'
import { useProfesionales } from '@/hooks/useProfesionales'
import { useHosixFacturacion } from '@/hooks/useHosixFacturacion'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/hosixClient'
import { useHosixAuditoria } from '@/hooks/useHosixAuditoria'
import { Loader2, Clock, AlertCircle, CheckCircle2, Eye } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface DetalleOrdenProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ordenId: string | null
}

export const WorklistMedicos: React.FC = () => {
  const { useOrdenesMedicas, actualizarEstadoOrdenMutation } = useHosixMedicos()
  const { data: profesionales, error: profesionalesError } = useProfesionales()
  const [filtroEstado, setFiltroEstado] = useState<string>('all')
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('all')
  const [busqueda, setBusqueda] = useState<string>('')
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<string | null>(null)
  const [dialogo, setDialogo] = useState(false)

  const { data: ordenes = [], isLoading, error: ordenesError } = useOrdenesMedicas(filtroEstado === 'all' ? '' : filtroEstado)
  const { cuentas } = useHosixFacturacion()

  // Filtrar órdenes
  const ordenesFiltradas = ordenes.filter((orden) => {
    const coincideBusqueda =
      !busqueda ||
      orden.motivo_consulta.toLowerCase().includes(busqueda.toLowerCase()) ||
      orden.id.toLowerCase().includes(busqueda.toLowerCase())

    const coincidePrioridad = filtroPrioridad === 'all' || orden.prioridad === filtroPrioridad

    return coincideBusqueda && coincidePrioridad
  })

  // Estadísticas
  const estadisticas = {
    pendientes: ordenes.filter((o) => o.estado === 'pendiente').length,
    enAtencion: ordenes.filter((o) => o.estado === 'en_atención').length,
    completadas: ordenes.filter((o) => o.estado === 'completada').length,
    canceladas: ordenes.filter((o) => o.estado === 'cancelada').length,
    total: ordenes.length,
  }

  const getEstadoBadge = (estado: string) => {
    const badgeConfig = {
      pendiente: { label: 'Pendiente', variant: 'secondary' as const },
      'en_atención': { label: 'En atención', variant: 'default' as const },
      completada: { label: 'Completada', variant: 'outline' as const },
      cancelada: { label: 'Cancelada', variant: 'destructive' as const },
    }
    const config = badgeConfig[estado as keyof typeof badgeConfig]
    return config || { label: estado, variant: 'secondary' as const }
  }

  const getPrioridadColor = (prioridad: string) => {
    const colors: Record<string, string> = {
      baja: 'bg-blue-100 text-blue-800',
      normal: 'bg-green-100 text-green-800',
      alta: 'bg-yellow-100 text-yellow-800',
      urgente: 'bg-red-100 text-red-800',
    }
    return colors[prioridad] || 'bg-gray-100 text-gray-800'
  }

  // Timers para atención (cliente): si el médico olvida completar, avanzamos automáticamente
  const attendanceTimers = (globalThis as any).__hosix_attendance_timers || new Map<string, any>()
  ;(globalThis as any).__hosix_attendance_timers = attendanceTimers

  const getTiempoEspera = (fechaCreacion: string): string => {
    const ahora = new Date()
    const fecha = new Date(fechaCreacion)
    const minutos = Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 60))

    if (minutos < 60) return `${minutos} min`
    const horas = Math.floor(minutos / 60)
    if (horas < 24) return `${horas}h`
    const dias = Math.floor(horas / 24)
    return `${dias}d`
  }

  const { registrarEvento } = useHosixAuditoria()

  const handleCambiarEstado = async (ordenId: string, nuevoEstado: string, orden?: any, isAuto: boolean = false) => {
    if (nuevoEstado === 'en_atención' && orden?.tipo_orden === 'consulta') {
      const cuentaPendiente = cuentas.find(
        (cuenta: any) =>
          cuenta.paciente_id === orden.paciente_id &&
          cuenta.estado === 'abierta' &&
          cuenta.saldo_pendiente > 0
      )

      if (cuentaPendiente) {
        toast.error(
          `El paciente debe pagar la tarifa de consulta antes de entrar en atención. Cuenta: ${cuentaPendiente.numero_cuenta}`
        )
        return
      }

      try {
        // Validar que exista un ticket pendiente para el paciente
        const { data: ticketRows, error: ticketError } = await supabase
          .from('hosix_tickets')
          .select('*')
          .eq('paciente_id', orden.paciente_id)
          .in('estado', ['pendiente', 'llamado'])
          .order('orden', { ascending: true })
          .order('created_at', { ascending: true })
          .limit(1)

        if (ticketError) throw ticketError

        const ticket = ticketRows && ticketRows.length > 0 ? ticketRows[0] : null
        if (!ticket) {
          toast.error('No se encontró ticket válido para este paciente en la cola')
          return
        }

        // Marcar inicio de atención en el ticket
        const startedAt = new Date().toISOString()
        const { error: updateError } = await supabase
          .from('hosix_tickets')
          .update({ estado: 'en_atención', attendance_started_at: startedAt, asignado_a: (await supabase.auth.getUser()).data.user?.id })
          .eq('id', ticket.id)

        if (updateError) throw updateError

        // Registrar auditoría
        try {
          await registrarEvento('INICIAR_ATENCION', 'hosix_tickets', ticket.id, null, { ordenId, pacienteId: orden.paciente_id, startedAt })
        } catch (auditErr) {
          console.warn('No se pudo registrar auditoría de inicio de atención', auditErr)
        }
        } catch (err: any) {
        console.error('Error validando ticket / iniciando atención:', err)
        toast.error(err?.message || 'Error iniciando atención')
        return
      }

        // Iniciar temporizador de atención (solo si no es ejecución automática)
        if (!isAuto) {
          const timeoutMinutes = 15 // configurable
          if (attendanceTimers.has(ordenId)) {
            clearTimeout(attendanceTimers.get(ordenId))
            attendanceTimers.delete(ordenId)
          }
          const t = setTimeout(() => {
            // Intentar completar automáticamente la orden si sigue en atención
            handleCambiarEstado(ordenId, 'completada', orden, true)
          }, timeoutMinutes * 60 * 1000)
          attendanceTimers.set(ordenId, t)
        }
    }

    if (nuevoEstado === 'completada' && orden?.tipo_orden === 'consulta') {
      // Limpiar temporizador si existe
      if (attendanceTimers.has(ordenId)) {
        clearTimeout(attendanceTimers.get(ordenId))
        attendanceTimers.delete(ordenId)
      }
      try {
        // Encontrar ticket en atención para este paciente
        const { data: ticketRows, error: ticketError } = await supabase
          .from('hosix_tickets')
          .select('*')
          .eq('paciente_id', orden.paciente_id)
          .eq('estado', 'en_atención')
          .limit(1)

        if (ticketError) throw ticketError

        const ticket = ticketRows && ticketRows.length > 0 ? ticketRows[0] : null
        if (ticket) {
          const endedAt = new Date().toISOString()
          const { error: finishError } = await supabase
            .from('hosix_tickets')
            .update({ estado: 'completado', attendance_ended_at: endedAt })
            .eq('id', ticket.id)

          if (finishError) throw finishError

          try {
            await registrarEvento('FINALIZAR_ATENCION', 'hosix_tickets', ticket.id, null, { ordenId, pacienteId: orden.paciente_id, endedAt })
          } catch (auditErr) {
            console.warn('No se pudo registrar auditoría de finalización de atención', auditErr)
          }
        }

        // Llamar al siguiente paciente en cola
        const { data: nextRows, error: nextError } = await supabase
          .from('hosix_tickets')
          .select('*')
          .eq('estado', 'pendiente')
          .order('orden', { ascending: true })
          .order('created_at', { ascending: true })
          .limit(1)

        if (nextError) throw nextError

        const nextTicket = nextRows && nextRows.length > 0 ? nextRows[0] : null
        if (nextTicket) {
          const llamadoAt = new Date().toISOString()
          const { error: callError } = await supabase
            .from('hosix_tickets')
            .update({ estado: 'llamado', llamado_at: llamadoAt })
            .eq('id', nextTicket.id)

          if (callError) throw callError

          try {
            await registrarEvento('LLAMAR_SIGUIENTE', 'hosix_tickets', nextTicket.id, null, { llamadoAt })
          } catch (auditErr) {
            console.warn('No se pudo registrar auditoría de llamada al siguiente', auditErr)
          }
        }
      } catch (err: any) {
        console.error('Error finalizando atención / llamando siguiente:', err)
        toast.error(err?.message || 'Error procesando fin de atención')
        return
      }
    }

    actualizarEstadoOrdenMutation.mutate({ ordenId, nuevoEstado })
  }

  if (profesionalesError || ordenesError) {
    const errorMessage = profesionalesError ?
      `Error al cargar profesionales: ${(profesionalesError as any)?.message || 'Desconocido'}` :
      `Error al cargar órdenes: ${(ordenesError as any)?.message || 'Desconocido'}`;

    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="font-semibold text-red-800">Error de Carga</h3>
          <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado y Estadísticas */}
      <div>
        <h2 className="text-3xl font-bold mb-4">Worklist Médico</h2>

        {/* Tarjetas de Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {estadisticas.pendientes}
                </div>
                <p className="text-sm text-gray-600">Pendientes</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {estadisticas.enAtencion}
                </div>
                <p className="text-sm text-gray-600">En atención</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {estadisticas.completadas}
                </div>
                <p className="text-sm text-gray-600">Completadas</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {estadisticas.canceladas}
                </div>
                <p className="text-sm text-gray-600">Canceladas</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {estadisticas.total}
                </div>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Panel de Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <Input
                placeholder="Motivo o ID de orden"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Estado */}
            <div>
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en_atención">En atención</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prioridad */}
            <div>
              <label className="text-sm font-medium mb-2 block">Prioridad</label>
              <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Todas las prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botón Limpiar */}
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full h-10"
                onClick={() => {
                  setBusqueda('')
                  setFiltroEstado('all')
                  setFiltroPrioridad('all')
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Mostrando <strong>{ordenesFiltradas.length}</strong> de{' '}
            <strong>{ordenes.length}</strong> órdenes
          </p>
        </CardContent>
      </Card>

      {/* Tabla de Órdenes */}
      <Card>
        <CardHeader>
          <CardTitle>Órdenes Médicas</CardTitle>
          <CardDescription>Gesiona tus órdenes pendientes y en proceso</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : ordenesFiltradas.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No hay órdenes que mostrar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Tiempo</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordenesFiltradas.map((orden) => (
                    <TableRow key={orden.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">
                        {orden.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{orden.paciente_id}</TableCell>
                      <TableCell className="max-w-sm truncate">
                        {orden.motivo_consulta}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPrioridadColor(orden.prioridad)}>
                          {orden.prioridad.charAt(0).toUpperCase() + orden.prioridad.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEstadoBadge(orden.estado).variant as any}>
                          {getEstadoBadge(orden.estado).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {getTiempoEspera(orden.fecha_creacion)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setOrdenSeleccionada(orden.id)
                              setDialogo(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {orden.estado === 'pendiente' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleCambiarEstado(orden.id, 'en_atención', orden)}
                              disabled={actualizarEstadoOrdenMutation.isPending}
                            >
                              Atender
                            </Button>
                          )}

                          {orden.estado === 'en_atención' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleCambiarEstado(orden.id, 'completada')}
                              disabled={actualizarEstadoOrdenMutation.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Completar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Detalles */}
      <DetalleOrdenDialog
        open={dialogo}
        onOpenChange={setDialogo}
        ordenId={ordenSeleccionada}
      />
    </div>
  )
}

// Componente para mostrar detalles de orden
const DetalleOrdenDialog: React.FC<DetalleOrdenProps> = ({ open, onOpenChange, ordenId }) => {
  const { useOrdenesMedicas } = useHosixMedicos()
  const { data: ordenes = [] } = useOrdenesMedicas()
  const orden = ordenes.find((o) => o.id === ordenId)

  if (!orden) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalles de Orden Médica</DialogTitle>
          <DialogDescription>{orden.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Tipo de Orden</label>
              <p className="mt-1 text-sm">{orden.tipo_orden}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Prioridad</label>
              <p className="mt-1">
                <Badge className={`bg-${orden.prioridad}-100`}>{orden.prioridad}</Badge>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Estado</label>
              <p className="mt-1">
                <Badge>{orden.estado}</Badge>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Servicio</label>
              <p className="mt-1 text-sm">{orden.servicio || 'N/A'}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Motivo de Consulta</label>
            <p className="mt-1 text-sm">{orden.motivo_consulta}</p>
          </div>

          {orden.notas_previas && (
            <div>
              <label className="text-sm font-medium text-gray-600">Notas Previas</label>
              <p className="mt-1 text-sm">{orden.notas_previas}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="font-medium text-gray-600">Creada</label>
              <p>
                {format(new Date(orden.fecha_creacion), 'PPpp', { locale: es })}
              </p>
            </div>
            {orden.fecha_completacion && (
              <div>
                <label className="font-medium text-gray-600">Completada</label>
                <p>
                  {format(new Date(orden.fecha_completacion), 'PPpp', { locale: es })}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default WorklistMedicos
