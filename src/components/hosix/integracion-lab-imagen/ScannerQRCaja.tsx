import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/hosixClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Scan, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProcesadorPagoCaja } from '@/components/hosix/cajas/ProcesadorPagoCaja'
import { toast } from 'sonner'

interface ScannerQRCajaProps {
  onDocumentScanned?: (data: any) => void
  cajaId?: string
  turnoId?: string
  usuarioId?: string
}

export const ScannerQRCaja: React.FC<ScannerQRCajaProps> = ({
  onDocumentScanned,
  cajaId,
  turnoId,
  usuarioId,
}) => {
  const [codigoQR, setCodigoQR] = useState('')
  const [numeroDocumento, setNumeroDocumento] = useState('')
  const [documentoData, setDocumentoData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('scanner')

  const escanearMutation = useMutation({
    mutationFn: async () => {
      if (!codigoQR && !numeroDocumento) {
        throw new Error('Ingresa QR o número de documento')
      }

      setLoading(true)

      // Buscar en hosix_codigos_documentos
      let query = supabase
        .from('hosix_codigos_documentos')
        .select('*')

      if (codigoQR) {
        query = query.eq('codigo_qr', codigoQR)
      } else {
        query = query.eq('numero_documento', numeroDocumento)
      }

      const { data: codigoData, error: errorBusqueda } = await query.single()

      if (errorBusqueda || !codigoData) {
        throw new Error('Documento no encontrado')
      }

      // Obtener detalles según tipo
      let solicitudData = null
      let servicios: any[] = []

      if (codigoData.tipo_documento === 'solicitud_lab') {
        const { data } = await supabase
          .from('hosix_laboratorio_solicitudes')
          .select(
            `
            id,
            paciente_id,
            diagnostico_clinico,
            prioridad,
            estado,
            estado_pago,
            monto_total,
            fecha_solicitud,
            solicitudes_items:hosix_laboratorio_solicitudes_items(
              id,
              prueba_id,
              prueba:hosix_laboratorio_pruebas_catalogo(id, codigo, nombre)
            )
          `
          )
          .eq('id', codigoData.documento_id)
          .single()

        solicitudData = data
        if (data?.solicitudes_items) {
          servicios = data.solicitudes_items.map((item: any) => ({
            tipo: 'laboratorio',
            item_id: item.prueba_id,
            codigo: item.prueba?.codigo,
            nombre: item.prueba?.nombre,
            precio: 0,
            estado_pago: data.estado_pago,
          }))
        }
      } else if (codigoData.tipo_documento === 'solicitud_imagen') {
        const { data } = await supabase
          .from('hosix_imagenologia_solicitudes')
          .select(
            `
            id,
            paciente_id,
            diagnostico_clinico,
            prioridad,
            estado,
            estado_pago,
            monto_total,
            fecha_solicitud,
            modalidad:hosix_imagenologia_modalidades(id, codigo, nombre)
          `
          )
          .eq('id', codigoData.documento_id)
          .single()

        solicitudData = data
        if (data?.modalidad) {
          servicios = [
            {
              tipo: 'imagenologia',
              item_id: data.modalidad.id,
              codigo: data.modalidad.codigo,
              nombre: data.modalidad.nombre,
              precio: 0,
              estado_pago: data.estado_pago,
            },
          ]
        }
      }

      // Obtener datos del paciente
      const { data: paciente } = await supabase
        .from('hosix_pacientes')
        .select('id, numero_cedula, nombre_completo')
        .eq('id', solicitudData?.paciente_id)
        .single()

      return {
        documento: {
          tipo: codigoData.tipo_documento,
          numero: codigoData.numero_documento,
          codigo_qr: codigoData.codigo_qr,
          generado_en: codigoData.generado_en,
        },
        solicitud: solicitudData,
        paciente,
        servicios,
        resumen: {
          total_servicios: servicios.length,
          estado_pago: solicitudData?.estado_pago,
          monto_total: solicitudData?.monto_total || 0,
          requiere_pago: solicitudData?.estado_pago === 'pendiente',
        },
      }
    },
    onSuccess: (data) => {
      setDocumentoData(data)
      onDocumentScanned?.(data)
      toast.success('Documento escaneado correctamente')
      setCodigoQR('')
      setNumeroDocumento('')
      setActiveTab('pago')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al escanear documento')
    },
  })

  const handleEscanear = () => {
    escanearMutation.mutate()
  }

  const handleLimpiar = () => {
    setCodigoQR('')
    setNumeroDocumento('')
    setDocumentoData(null)
    setActiveTab('scanner')
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scanner">Escanear Documento</TabsTrigger>
          <TabsTrigger value="pago" disabled={!documentoData}>
            Procesar Pago
          </TabsTrigger>
        </TabsList>

        {/* Scanner Tab */}
        <TabsContent value="scanner" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="w-5 h-5" />
                Escanear Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Código QR</label>
                  <Input
                    placeholder="Escanea o ingresa código QR"
                    value={codigoQR}
                    onChange={(e) => setCodigoQR(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleEscanear()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">O Número Documento</label>
                  <Input
                    placeholder="Ej: LAB2026000001"
                    value={numeroDocumento}
                    onChange={(e) => setNumeroDocumento(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleEscanear()}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleEscanear}
                  disabled={escanearMutation.isPending || (!codigoQR && !numeroDocumento)}
                  className="flex-1"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {escanearMutation.isPending ? 'Buscando...' : 'Escanear'}
                </Button>
                <Button variant="outline" onClick={handleLimpiar}>
                  Limpiar
                </Button>
              </div>
            </CardContent>
          </Card>

          {documentoData && (
            <Card>
              <CardHeader>
                <CardTitle>Documento Escaneado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Número Documento</p>
                    <p className="font-semibold">{documentoData.documento.numero}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tipo</p>
                    <Badge variant="outline">
                      {documentoData.documento.tipo === 'solicitud_lab' ? 'Laboratorio' : 'Imagenología'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Paciente</p>
                    <p className="font-semibold">{documentoData.paciente?.nombre_completo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cédula</p>
                    <p className="font-semibold">{documentoData.paciente?.numero_cedula}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Servicios ({documentoData.servicios.length})</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado Pago</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documentoData.servicios.map((s: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-sm">{s.codigo}</TableCell>
                          <TableCell>{s.nombre}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {s.tipo === 'laboratorio' ? 'Lab' : 'Imagen'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                s.estado_pago === 'pagado'
                                  ? 'default'
                                  : s.estado_pago === 'eximido'
                                    ? 'secondary'
                                    : 'destructive'
                              }
                            >
                              {s.estado_pago}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="border-t pt-4 bg-gray-50 p-4 rounded">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Servicios</p>
                      <p className="text-2xl font-bold">{documentoData.resumen.total_servicios}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Monto Total</p>
                      <p className="text-2xl font-bold">
                        ${documentoData.resumen.monto_total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Pago Tab */}
        <TabsContent value="pago" className="space-y-4">
          {documentoData ? (
            <ProcesadorPagoCaja
              documentoData={documentoData}
              cajaId={cajaId}
              turnoId={turnoId}
              usuarioId={usuarioId}
            />
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                <p>Escanea un documento primero para procesar pago</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ScannerQRCaja
