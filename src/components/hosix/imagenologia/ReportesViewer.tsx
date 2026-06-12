import React, { useState } from 'react'
import { useHosixImagenologia } from '@/hooks/useHosixImagenologia'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Eye, FileText, CheckCircle } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export const ReportesViewer: React.FC = () => {
  const { reportes = [] } = useHosixImagenologia()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReporte, setSelectedReporte] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)

  const filtered = reportes.filter((r: any) => {
    const matchSearch = searchTerm === '' || 
      r.hallazgos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.impresion_diagnostica?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchSearch
  })

  const stats = {
    pendientes: reportes.filter((r: any) => !r.fecha_firma).length,
    firmados: reportes.filter((r: any) => r.fecha_firma).length
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Reportes Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Reportes Firmados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.firmados}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reportes de Imagenología</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar reporte..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hallazgos</TableHead>
                <TableHead>Impresión Diagnóstica</TableHead>
                <TableHead>Radiólogo</TableHead>
                <TableHead>Fecha Reporte</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="max-w-xs truncate text-sm">{r.hallazgos}</TableCell>
                  <TableCell className="max-w-xs truncate">{r.impresion_diagnostica}</TableCell>
                  <TableCell className="text-sm">{r.radiologist_name || 'N/A'}</TableCell>
                  <TableCell>{new Date(r.fecha_reporte).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {r.fecha_firma ? (
                      <span className="flex items-center gap-1 text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        Firmado
                      </span>
                    ) : (
                      <span className="text-yellow-700">Pendiente</span>
                    )}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedReporte(r)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Reporte Completo</DialogTitle>
                        </DialogHeader>
                        {selectedReporte && (
                          <div className="space-y-6">
                            <div className="border-b pb-4">
                              <h3 className="font-semibold text-lg mb-2">Información del Estudio</h3>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600">Fecha Reporte</p>
                                  <p className="font-medium">{new Date(selectedReporte.fecha_reporte).toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Radiólogo</p>
                                  <p className="font-medium">{selectedReporte.radiologist_name || 'N/A'}</p>
                                </div>
                              </div>
                            </div>

                            <div className="border-b pb-4">
                              <h3 className="font-semibold text-lg mb-2">Hallazgos</h3>
                              <p className="text-base whitespace-pre-wrap">{selectedReporte.hallazgos}</p>
                            </div>

                            <div className="border-b pb-4">
                              <h3 className="font-semibold text-lg mb-2">Impresión Diagnóstica</h3>
                              <p className="text-base whitespace-pre-wrap">{selectedReporte.impresion_diagnostica}</p>
                            </div>

                            <div className="border-b pb-4">
                              <h3 className="font-semibold text-lg mb-2">Recomendaciones</h3>
                              <p className="text-base whitespace-pre-wrap">{selectedReporte.recomendaciones || 'Sin recomendaciones'}</p>
                            </div>

                            {selectedReporte.fecha_firma && (
                              <div className="bg-green-50 p-4 rounded border border-green-200">
                                <p className="text-sm text-gray-600">Firmado el</p>
                                <p className="font-semibold text-green-700">{new Date(selectedReporte.fecha_firma).toLocaleString()}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" variant="ghost">
                      <Download className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay reportes registrados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ReportesViewer
