import React, { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/hosixClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { QrCode, CheckCircle, AlertCircle, Printer, Loader2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

interface KioskoAutofacturacionProps {
  onBack?: () => void
}

export const KioskoAutofacturacion: React.FC<KioskoAutofacturacionProps> = ({ onBack }) => {
  const [codigoQR, setCodigoQR] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [montoRecibido, setMontoRecibido] = useState('0')
  const [documentoData, setDocumentoData] = useState<any>(null)
  const [pagoProcesado, setPagoProcesado] = useState<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const escanearMutation = useMutation({
    mutationFn: async () => {
      if (!codigoQR.trim()) {
        throw new Error('Por favor escanea un código QR')
      }

      const { data: codigoData, error } = await supabase
        .from('hosix_codigos_documentos')
        .select('*')
        .eq('codigo_qr', codigoQR)
        .single()

      if (error || !codigoData) {
        throw new Error('Código QR no encontrado')
      }

      let solicitudData = null
      let servicios: any[] = []
      let paciente = null

      if (codigoData.tipo_documento === 'solicitud_lab') {
        const { data } = await supabase
          .from('hosix_laboratorio_solicitudes')
          .select(`
            id, paciente_id, diagnostico_clinico, monto_total, estado_pago,
            solicitudes_items:hosix_laboratorio_solicitudes_items(
              id, prueba_id,
              prueba:hosix_laboratorio_pruebas_catalogo(id, codigo, nombre)
            )
          `)
          .eq('id', codigoData.documento_id)
          .single()

        solicitudData = data
        if (data?.solicitudes_items) {
          servicios = data.solicitudes_items.map((item: any) => ({
            tipo: 'laboratorio',
            nombre: item.prueba?.nombre,
            codigo: item.prueba?.codigo,
          }))
        }
      } else if (codigoData.tipo_documento === 'solicitud_imagen') {
        const { data } = await supabase
          .from('hosix_imagenologia_solicitudes')
          .select(`
            id, paciente_id, diagnostico_clinico, monto_total, estado_pago,
            modalidad:hosix_imagenologia_modalidades(id, codigo, nombre)
          `)
          .eq('id', codigoData.documento_id)
          .single()

        solicitudData = data
        if (data?.modalidad) {
          servicios = [
            {
              tipo: 'imagenologia',
              nombre: data.modalidad.nombre,
              codigo: data.modalidad.codigo,
            },
          ]
        }
      }

      const { data: pacienteData } = await supabase
        .from('hosix_pacientes')
        .select('id, nombre_completo, numero_cedula')
        .eq('id', solicitudData?.paciente_id)
        .single()

      paciente = pacienteData

      return {
        documento: codigoData,
        solicitud: solicitudData,
        paciente,
        servicios,
      }
    },
    onSuccess: (data) => {
      setDocumentoData(data)
      setCodigoQR('')
      setMontoRecibido(data.solicitud?.monto_total?.toString() || '0')
      toast.success('Código QR válido')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al escanear')
      setCodigoQR('')
    },
  })

  const procesarPagoMutation = useMutation({
    mutationFn: async () => {
      const monto = parseFloat(montoRecibido)
      const montoTotal = documentoData?.solicitud?.monto_total || 0

      if (isNaN(monto) || monto < montoTotal) {
        throw new Error(`Monto insuficiente. Mínimo requerido: $${montoTotal.toFixed(2)}`)
      }

      const tipoSolicitud =
        documentoData.documento.tipo_documento === 'solicitud_lab'
          ? 'hosix_laboratorio_solicitudes'
          : 'hosix_imagenologia_solicitudes'

      // Actualizar estado de pago
      await supabase
        .from(tipoSolicitud)
        .update({ estado_pago: 'pagado' })
        .eq('id', documentoData.solicitud.id)

      // Crear recibo
      const { data: recibo } = await supabase
        .from('hosix_recibos_pagos')
        .insert({
          numero_recibo: `REC${new Date().getFullYear()}${String(documentoData.documento.id).slice(0, 8)}`,
          tipo_documento: documentoData.documento.tipo_documento,
          documento_referencia: documentoData.documento.numero_documento,
          paciente_id: documentoData.paciente.id,
          monto_total: montoTotal,
          metodo_pago: metodoPago,
          estado_pago: 'pagado',
          usuario_id: null,
          caja_id: null,
          fecha_pago: new Date().toISOString(),
          observaciones: 'Pago automático desde kiosko',
        })
        .select()
        .single()

      return {
        recibo,
        monto: montoTotal,
        vuelto: monto - montoTotal,
      }
    },
    onSuccess: (data) => {
      setPagoProcesado(data)
      toast.success('¡Pago procesado exitosamente!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al procesar pago')
    },
  })

  if (pagoProcesado) {
    return (
      <Card className="w-full border-green-300 bg-green-50">
        <CardHeader className="bg-green-600 text-white">
          <CardTitle className="flex items-center justify-center gap-3 text-3xl">
            <CheckCircle className="h-10 w-10" />
            ¡PAGO EXITOSO!
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xl font-semibold border-b pb-2">
              <span>Monto Pagado:</span>
              <span className="text-green-600">${pagoProcesado.monto.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xl font-semibold border-b pb-2">
              <span>Vuelto:</span>
              <span className="text-green-600">${pagoProcesado.vuelto.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-lg">
              <span className="text-gray-600">Número Recibo:</span>
              <span className="font-mono font-bold">{pagoProcesado.recibo.numero_recibo}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600 text-center">
              Tu recibo ha sido generado. Por favor toma nota del número de recibo.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => window.print()}
              className="flex-1 gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimir Recibo
            </Button>
            <Button
              onClick={() => {
                setDocumentoData(null)
                setPagoProcesado(null)
                setMetodoPago('efectivo')
                inputRef.current?.focus()
              }}
              variant="outline"
              className="flex-1"
            >
              Nuevo Pago
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (documentoData) {
    const montoTotal = documentoData.solicitud?.monto_total || 0
    const monto = parseFloat(montoRecibido) || 0
    const vuelto = monto - montoTotal

    return (
      <Card className="w-full">
        <CardHeader className="bg-blue-600 text-white">
          <CardTitle className="text-2xl">Confirmar Pago</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Datos del paciente */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div>
              <p className="text-sm text-gray-600">Paciente</p>
              <p className="text-xl font-bold">{documentoData.paciente.nombre_completo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Cédula</p>
              <p className="text-lg font-semibold">{documentoData.paciente.numero_cedula}</p>
            </div>
          </div>

          {/* Servicios */}
          <div>
            <p className="font-semibold mb-2">Servicios ({documentoData.servicios.length})</p>
            <div className="space-y-1">
              {documentoData.servicios.map((s: any, idx: number) => (
                <div key={idx} className="text-sm p-2 bg-gray-100 rounded">
                  {s.nombre} <Badge className="ml-2">{s.tipo}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Monto */}
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
            <p className="text-sm text-blue-700 mb-1">Monto a Pagar</p>
            <p className="text-4xl font-bold text-blue-600">${montoTotal.toFixed(2)}</p>
          </div>

          {/* Método de pago */}
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
              </SelectContent>
            </Select>
          </div>

          {/* Monto recibido (si efectivo) */}
          {metodoPago === 'efectivo' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Monto Recibido</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-xl">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(e.target.value)}
                    className="text-2xl pl-8"
                    min={montoTotal}
                  />
                </div>
              </div>

              {/* Vuelto */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-300">
                <p className="text-sm text-green-700 mb-1">Vuelto</p>
                <p className={`text-3xl font-bold ${vuelto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.max(0, vuelto).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Validación */}
          {metodoPago === 'efectivo' && monto < montoTotal && (
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded border border-red-300">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <span className="text-red-700 font-semibold">Monto insuficiente</span>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => {
                setDocumentoData(null)
                inputRef.current?.focus()
              }}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => procesarPagoMutation.mutate()}
              disabled={
                procesarPagoMutation.isPending ||
                (metodoPago === 'efectivo' && monto < montoTotal)
              }
              className="flex-1 bg-green-600 hover:bg-green-700 text-lg py-6"
            >
              {procesarPagoMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                `Pagar $${montoTotal.toFixed(2)}`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <CardTitle className="flex items-center justify-center gap-3 text-3xl">
          <QrCode className="h-8 w-8" />
          Escanea tu Código QR
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-12 space-y-8">
        <div className="text-center space-y-4">
          <p className="text-lg text-gray-600">Por favor escanea tu código QR para proceder con el pago</p>

          <Input
            ref={inputRef}
            type="text"
            value={codigoQR}
            onChange={(e) => setCodigoQR(e.target.value)}
            placeholder="Escanea aquí..."
            onKeyPress={(e) => e.key === 'Enter' && escanearMutation.mutate()}
            className="text-center text-2xl py-6"
            autoComplete="off"
          />

          <Button
            onClick={() => escanearMutation.mutate()}
            disabled={escanearMutation.isPending || !codigoQR.trim()}
            className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg"
          >
            {escanearMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Buscando...
              </>
            ) : (
              'Buscar'
            )}
          </Button>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 text-center">
          <p className="text-blue-900 text-sm leading-relaxed">
            El código QR fue generado cuando se solicitó el servicio. Si no lo tienes, contacta a recepción.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default KioskoAutofacturacion
