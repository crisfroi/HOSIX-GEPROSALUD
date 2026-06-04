import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { Edit2 } from 'lucide-react'
import { useHosixParametrosSistema, ParametroSistema } from '@/hooks/useHosixParametrosSistema'

export function ParametrosSistemaManager() {
  const { parametros, cargando, actualizar } = useHosixParametrosSistema()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<ParametroSistema | null>(null)
  const [formValue, setFormValue] = useState('')

  const handleEdit = (param: ParametroSistema) => {
    setEditando(param)
    if (param.tipo_parametro === 'numero') {
      setFormValue(String(param.valor_numero || ''))
    } else if (param.tipo_parametro === 'booleano') {
      setFormValue(String(param.valor_booleano || 'false'))
    } else if (param.tipo_parametro === 'json') {
      setFormValue(JSON.stringify(param.valor_json, null, 2))
    } else {
      setFormValue(param.valor_texto || '')
    }
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editando) return

    try {
      const updateData: Partial<ParametroSistema> = {}
      
      if (editando.tipo_parametro === 'numero') {
        updateData.valor_numero = parseFloat(formValue)
      } else if (editando.tipo_parametro === 'booleano') {
        updateData.valor_booleano = formValue === 'true'
      } else if (editando.tipo_parametro === 'json') {
        updateData.valor_json = JSON.parse(formValue)
      } else {
        updateData.valor_texto = formValue
      }

      await actualizar(editando.id, updateData)
      toast({ title: 'Parámetro actualizado' })
      setOpen(false)
      setEditando(null)
      setFormValue('')
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      })
    }
  }

  const renderValue = (param: ParametroSistema) => {
    if (param.tipo_parametro === 'numero') return param.valor_numero?.toString() || '-'
    if (param.tipo_parametro === 'booleano') return param.valor_booleano ? 'Sí' : 'No'
    if (param.tipo_parametro === 'json') return JSON.stringify(param.valor_json)
    return param.valor_texto || '-'
  }

  const getInputType = () => {
    if (!editando) return 'text'
    if (editando.tipo_parametro === 'numero') return 'number'
    if (editando.tipo_parametro === 'fecha') return 'date'
    return 'text'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parámetros del Sistema</CardTitle>
      </CardHeader>
      <CardContent>
        {cargando ? (
          <p className="text-center py-4">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parametros.map((param) => (
                  <TableRow key={param.id}>
                    <TableCell className="font-mono text-sm">{param.codigo}</TableCell>
                    <TableCell>{param.nombre}</TableCell>
                    <TableCell className="text-sm">{param.categoría || '-'}</TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{renderValue(param)}</TableCell>
                    <TableCell className="text-sm">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {param.tipo_parametro}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Dialog open={open && editando?.id === param.id} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(param)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar: {editando?.nombre}</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Valor</label>
                              {editando?.tipo_parametro === 'booleano' ? (
                                <select
                                  value={formValue}
                                  onChange={(e) => setFormValue(e.target.value)}
                                  className="w-full px-3 py-2 border rounded-md"
                                >
                                  <option value="true">Sí</option>
                                  <option value="false">No</option>
                                </select>
                              ) : (
                                <Input
                                  type={getInputType()}
                                  value={formValue}
                                  onChange={(e) => setFormValue(e.target.value)}
                                  required
                                />
                              )}
                            </div>
                            {editando?.descripcion && (
                              <div className="text-sm text-gray-600">
                                {editando.descripcion}
                              </div>
                            )}
                            <Button type="submit" className="w-full">Guardar</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
