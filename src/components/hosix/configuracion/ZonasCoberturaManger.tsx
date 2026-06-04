import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { Trash2, Edit2, Plus } from 'lucide-react'
import { useHosixZonasCobertura, ZonaCobertura } from '@/hooks/useHosixZonasCobertura'
import { Checkbox } from '@/components/ui/checkbox'

export function ZonasCoberturaManger() {
  const { zonas, cargando, crear, actualizar, eliminar } = useHosixZonasCobertura()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<ZonaCobertura | null>(null)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    población_cobertura: 0,
    limites_geograficos: '',
    activo: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editando) {
        await actualizar(editando.id, formData)
        toast({ title: 'Zona actualizada' })
      } else {
        await crear(formData as any)
        toast({ title: 'Zona creada' })
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
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      población_cobertura: 0,
      limites_geograficos: '',
      activo: true,
    })
    setEditando(null)
  }

  const handleEdit = (zona: ZonaCobertura) => {
    setEditando(zona)
    setFormData({
      codigo: zona.codigo,
      nombre: zona.nombre,
      descripcion: zona.descripcion || '',
      población_cobertura: zona.población_cobertura || 0,
      limites_geograficos: zona.limites_geograficos || '',
      activo: zona.activo,
    })
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Confirmar eliminación?')) {
      try {
        await eliminar(id)
        toast({ title: 'Zona eliminada' })
      } catch (error) {
        toast({ title: 'Error al eliminar', variant: 'destructive' })
      }
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Zonas de Cobertura</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { setEditando(null); resetForm() }}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar' : 'Nueva'} Zona de Cobertura</DialogTitle>
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
                <label className="text-sm font-medium">Población de Cobertura</label>
                <Input
                  type="number"
                  value={formData.población_cobertura}
                  onChange={(e) => setFormData({ ...formData, población_cobertura: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Límites Geográficos</label>
                <Input
                  value={formData.limites_geograficos}
                  onChange={(e) => setFormData({ ...formData, limites_geograficos: e.target.value })}
                  placeholder="Descripción de límites"
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
                <TableHead>Población</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zonas.map((zona) => (
                <TableRow key={zona.id}>
                  <TableCell className="font-mono text-sm">{zona.codigo}</TableCell>
                  <TableCell>{zona.nombre}</TableCell>
                  <TableCell>{zona.población_cobertura?.toLocaleString() || '-'}</TableCell>
                  <TableCell>{zona.activo ? '✓ Activo' : 'Inactivo'}</TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(zona)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(zona.id)}>
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
