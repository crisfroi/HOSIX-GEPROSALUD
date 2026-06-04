import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { Trash2, Edit2, Plus } from 'lucide-react'
import { useHosixUnidadesFuncionales, UnidadFuncional } from '@/hooks/useHosixUnidadesFuncionales'
import { Checkbox } from '@/components/ui/checkbox'

export function UnidadesFuncionalesManager() {
  const { unidades, cargando, crear, actualizar, eliminar } = useHosixUnidadesFuncionales()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<UnidadFuncional | null>(null)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo: '',
    ubicacion: '',
    activo: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editando) {
        await actualizar(editando.id, formData)
        toast({ title: 'Unidad actualizada' })
      } else {
        await crear(formData as any)
        toast({ title: 'Unidad creada' })
      }
      setOpen(false)
      resetForm()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      })
    }
  }

  const resetForm = () => {
    setFormData({ codigo: '', nombre: '', descripcion: '', tipo: '', ubicacion: '', activo: true })
    setEditando(null)
  }

  const handleEdit = (unidad: UnidadFuncional) => {
    setEditando(unidad)
    setFormData({
      codigo: unidad.codigo,
      nombre: unidad.nombre,
      descripcion: unidad.descripcion || '',
      tipo: unidad.tipo || '',
      ubicacion: unidad.ubicacion || '',
      activo: unidad.activo,
    })
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Confirmar eliminación?')) {
      try {
        await eliminar(id)
        toast({ title: 'Unidad eliminada' })
      } catch (error) {
        toast({ title: 'Error al eliminar', variant: 'destructive' })
      }
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Unidades Funcionales</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { setEditando(null); resetForm() }}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar' : 'Nueva'} Unidad Funcional</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Código</label>
                <Input
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nombre</label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tipo</label>
                <Input
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ubicación</label>
                <Input
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <Input
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked as boolean })}
                />
                <label className="text-sm">Activo</label>
              </div>
              <Button type="submit" className="w-full">Guardar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {cargando ? (
          <p className="text-center py-4">Cargando...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unidades.map((unidad) => (
                <TableRow key={unidad.id}>
                  <TableCell className="font-mono text-sm">{unidad.codigo}</TableCell>
                  <TableCell>{unidad.nombre}</TableCell>
                  <TableCell>{unidad.tipo || '-'}</TableCell>
                  <TableCell>{unidad.ubicacion || '-'}</TableCell>
                  <TableCell>{unidad.activo ? '✓ Activo' : 'Inactivo'}</TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(unidad)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(unidad.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
