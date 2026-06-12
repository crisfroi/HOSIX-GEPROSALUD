import React, { useState } from 'react'
import { useHosixImagenologia } from '@/hooks/useHosixImagenologia'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Eye, FileText } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export const EstudiosViewer: React.FC = () => {
  const { estudios = [] } = useHosixImagenologia()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEstudio, setSelectedEstudio] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)

  const filtered = estudios.filter((e: any) => {
    const matchSearch = searchTerm === '' || 
      e.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.numero_serie?.includes(searchTerm)
    return matchSearch
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Estudios de Imagenología</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar estudio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número Serie</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Número Imágenes</TableHead>
                <TableHead>Formato</TableHead>
                <TableHead>Fecha Estudio</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-sm">{e.numero_serie}</TableCell>
                  <TableCell className="max-w-xs truncate">{e.descripcion}</TableCell>
                  <TableCell>{e.numero_imagenes}</TableCell>
                  <TableCell>{e.formato_archivo}</TableCell>
                  <TableCell>{new Date(e.fecha_estudio).toLocaleDateString()}</TableCell>
                  <TableCell className="flex gap-2">
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedEstudio(e)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detalle Estudio</DialogTitle>
                        </DialogHeader>
                        {selectedEstudio && (
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-semibold">Número Serie</p>
                              <p className="text-base font-mono">{selectedEstudio.numero_serie}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">Descripción</p>
                              <p className="text-base">{selectedEstudio.descripcion}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-semibold">Número de Imágenes</p>
                                <p className="text-base">{selectedEstudio.numero_imagenes}</p>
                              </div>
                              <div>
                                <p className="text-sm font-semibold">Formato</p>
                                <p className="text-base">{selectedEstudio.formato_archivo}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">Fecha Estudio</p>
                              <p className="text-base">{new Date(selectedEstudio.fecha_estudio).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">Ubicación DICOM</p>
                              <p className="text-base font-mono text-sm">{selectedEstudio.ubicacion_dicom || 'N/A'}</p>
                            </div>
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
              No hay estudios registrados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default EstudiosViewer
