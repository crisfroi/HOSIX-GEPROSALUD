import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/hosixClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, CreditCard, DollarSign, Printer, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ProcesadorPagoCajaProps {
  documentoData: any
  cajaId?: string
  turnoId?: string
  usuarioId?: string
}

export const ProcesadorPagoCaja: React.FC<ProcesadorPagoCajaProps> = ({
  documentoData,
  cajaId,
  turnoId,
  usuarioId,
}) => {
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [montoRecibido, setMontoRecibido] = useState(
    documentoData?.resumen?.monto_total?.toString() || '0'
  )
  const [observaciones, setObservaciones] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [pagoProcesado, setPagoProcesado] = useState<any>(null)

  const queryClient = useQueryClient()

  const procesarPagoMutation = useMutation({
    mutationFn: async () => {
      setProcesando(true)

      const monto = parseFloat(montoRecibido)
      const montoTotal = documentoData.resumen.monto_total

      if (monto < montoTotal) {
        throw new Error(`Monto insuficiente. Mínimo: $${montoTotal.toFixed(2)}`)
      }

      const vuelto = monto - montoTotal

      // 1. Actualizar estado_pago en solicitud
      const tipoSolicitud =
        documentoData.documento.tipo === 'solicitud_lab'
          ? 'hosix_laboratorio_solicitudes'
          : 'hosix_imagenologia_solicitudes'

      const { error: errorSolicitud } = await supabase
        .from(tipoSolicitud)
        .update({
          estado_pago: 'pagado',
          monto_total: montoTotal,
        })
        .eq('id', documentoData.solicitud.id)

      if (errorSolicitud) throw errorSolicitud

      // 2. Crear movimiento de caja
      const { data: movimiento, error: errorMovimiento } = await supabase
        .from('hosix_cajas_movimientos')
        .insert({
          caja_id: cajaId,
          turno_id: turnoId,
          usuario_id: usuarioId,
          tipo_movimiento: 'cobro',
          monto: montoTotal,
          metodo_pago: metodoPago,
          documento_referencia: documentoData.documento.numero,
          concepto: `Solicitud ${documentoData.documento.tipo}: ${documentoData.solicitud.diagnostico_clinico}`,
          observaciones,
          cantidad_servicios: documentoData.servicios.length,
          cantidad_items: documentoData.servicios.length,
          paciente_id: documentoData.paciente.id,
          comprobante_numero: null,
          anulado: false,
          fecha_movimiento: new Date().toISOString(),
        })
        .select()
        .single()

      if (errorMovimiento) throw errorMovimiento

      // 3. Crear documento de pago/recibo
      const { data: recibo, error: errorRecibo } = await supabase
        .from('hosix_recibos_pagos')
        .insert({
          numero_recibo: `REC${new Date().getFullYear()}${String(movimiento.id).slice(0, 8)}`,
          tipo_documento: documentoData.documento.tipo,
          documento_referencia: documentoData.documento.numero,
          paciente_id: documentoData.paciente.id,
          monto_total: montoTotal,
          metodo_pago: metodoPago,
          estado_pago: 'pagado',
          usuario_id: usuarioId,
          caja_id: cajaId,
          fecha_pago: new Date().toISOString(),
          observaciones,
        })
        .select()
        .single()

      if (errorRecibo) throw errorRecibo

      return {
        movimiento,
        recibo,
        vuelto,
      }
    },
    onSuccess: (data) => {
      setPagoProcesado(data)
      toast.success('Pago procesado correctamente')
      queryClient.invalidateQueries({ queryKey: ['hosix_cajas_movimientos'] })
      queryClient.invalidateQueries({ queryKey: ['hosix_recibos_pagos'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al procesar pago')
    },
    onSettled: () => {
      setProcesando(false)
    },
  })

  const handleProcesarPago = async () => {
    if (!metodoPago) {
      toast.error('Selecciona un método de pago')
      return
    }
    procesarPagoMutation.mutate()
  }

  const monto = parseFloat(montoRecibido)
  const montoTotal = documentoData.resumen.monto_total || 0
  const vuelto = monto - montoTotal

  if (pagoProcesado) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-700">✓ Pago Procesado Exitosamente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Número Recibo</p>
              <p className="font-bold text-lg">{pagoProcesado.recibo.numero_recibo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Método Pago</p>
              <Badge>{metodoPago}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Monto Pagado</p>
              <p className="font-bold text-lg">${montoTotal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Vuelto</p>
              <p className="font-bold text-lg text-green-600">${vuelto.toFixed(2)}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-2">Paciente</p>
            <p className="font-semibold">{documentoData.paciente.nombre_completo}</p>
            <p className="text-sm text-gray-500">{documentoData.paciente.numero_cedula}</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir Recibo
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setPagoProcesado(null)
                setMontoRecibido(montoTotal.toString())
              }}
            >
              Nuevo Pago
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Procesar Pago
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Servicios</span>
            <span className="font-semibold">{documentoData.servicios.length}</span>
          </div>
          <div className="flex justify-between items-center border-t pt-2">
            <span className="font-semibold">Monto Total</span>
            <span className="text-2xl font-bold text-blue-600">
              ${montoTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Método de Pago */}
        <div>
          <label className="block text-sm font-medium mb-2">Método de Pago</label>
          <Select value={metodoPago} onValueChange={setMetodoPago}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="efectivo">Efectivo</SelectItem>
              <SelectItem value="tarjeta_credito">Tarjeta Crédito</SelectItem>
              <SelectItem value="tarjeta_debito">Tarjeta Débito</SelectItem>
              <SelectItem value="transferencia">Transferencia</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="bonificacion">Bonificación</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Monto Recibido (solo si es efectivo) */}
        {metodoPago === 'efectivo' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Monto Recibido</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                  className="pl-7"
                  min={montoTotal}
                />
              </div>
            </div>

            {/* Vuelto */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Vuelto</span>
                <span
                  className={`text-2xl font-bold ${vuelto >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  ${Math.max(0, vuelto).toFixed(2)}
                </span>
              </div>
              {vuelto < 0 && (
                <p className="text-xs text-red-600 mt-2">
                  Falta: ${Math.abs(vuelto).toFixed(2)}
                </p>
              )}
            </div>
          </>
        )}

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium mb-2">Observaciones (Opcional)</label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Notas adicionales..."
            className="w-full px-3 py-2 border rounded-md text-sm"
            rows={2}
          />
        </div>

        {/* Validación */}
        {metodoPago === 'efectivo' && monto < montoTotal && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm text-red-700">Monto insuficiente</span>
          </div>
        )}

        {/* Botón Procesar */}
        <Button
          onClick={handleProcesarPago}
          disabled={
            procesarPagoMutation.isPending ||
            procesando ||
            (metodoPago === 'efectivo' && monto < montoTotal)
          }
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {procesando || procesarPagoMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Procesar Pago ${montoTotal.toFixed(2)}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

export default ProcesadorPagoCaja
