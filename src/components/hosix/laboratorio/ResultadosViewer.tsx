import React, { useState } from 'react'
import { useHosixLaboratorio } from '@/hooks/useHosixLaboratorio'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Eye } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export const ResultadosViewer: React.FC = () => {
  const { resultados = [] } = useHosixLaboratorio()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedResult, setSelectedResult] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)

  const filtered = resultados.filter((r: any) => {
    const matchSearch = searchTerm === '' || 
      r.prueba_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.valor_resultado?.toString().includes(searchTerm)
    return matchSearch
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Resultados de Laboratorio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar resultado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prueba</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead>Fecha Resultado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{r.prueba_id}</TableCell>
                  <TableCell className="font-semibold">{r.valor_resultado}</TableCell>
                  <TableCell>{r.unidad_resultado}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {r.rango_referencia_minimo} - {r.rango_referencia_maximo}
                  </TableCell>
                  <TableCell>{new Date(r.fecha_resultado).toLocaleDateString()}</TableCell>
                  <TableCell className="flex gap-2">
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedResult(r)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detalle Resultado</DialogTitle>
                        </DialogHeader>
                        {selectedResult && (
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-semibold">Prueba</p>
                              <p className="text-base">{selectedResult.prueba_id}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">Valor</p>
                              <p className="text-base">{selectedResult.valor_resultado} {selectedResult.unidad_resultado}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">Valores de Referencia</p>
                              <p className="text-base">{selectedResult.rango_referencia_minimo} - {selectedResult.rango_referencia_maximo}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">Observaciones</p>
                              <p className="text-base">{selectedResult.observaciones || 'Sin observaciones'}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">Fecha Resultado</p>
                              <p className="text-base">{new Date(selectedResult.fecha_resultado).toLocaleString()}</p>
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
              No hay resultados registrados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ResultadosViewer
