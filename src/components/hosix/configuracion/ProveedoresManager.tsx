import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { Trash2, Edit2, Plus } from 'lucide-react'
import { useHosixProveedores, Proveedor } from '@/hooks/useHosixProveedores'
import { Checkbox } from '@/components/ui/checkbox'

export function ProveedoresManager() {
  const { proveedores, cargando, crear, actualizar, eliminar } = useHosixProveedores()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<Proveedor | null>(null)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    tipo_proveedor: 'farmaceutico' as const,
    email: '',
    telefono: '',
    sitio_web: '',
    nif_ruc: '',
    plazo_entrega_dias: 0,
    es_autorizado: false,
    es_preferente: false,
    activo: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editando) {
        await actualizar(editando.id, formData)
        toast({ title: 'Proveedor actualizado' })
      } else {
        await crear(formData as any)
        toast({ title: 'Proveedor creado' })
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
      tipo_proveedor: 'farmaceutico',
      email: '',
      telefono: '',
      sitio_web: '',
      nif_ruc: '',
      plazo_entrega_dias: 0,
      es_autorizado: false,
      es_preferente: false,
      activo: true,
    })
    setEditando(null)
  }

  const handleEdit = (proveedor: Proveedor) => {
    setEditando(proveedor)
    setFormData({
      codigo: proveedor.codigo,
      nombre: proveedor.nombre,
      tipo_proveedor: (proveedor.tipo_proveedor as any) || 'farmaceutico',
      email: proveedor.email || '',
      telefono: proveedor.telefono || '',
      sitio_web: proveedor.sitio_web || '',
      nif_ruc: proveedor.nif_ruc || '',
      plazo_entrega_dias: proveedor.plazo_entrega_dias || 0,
      es_autorizado: proveedor.es_autorizado,
      es_preferente: proveedor.es_preferente,
      activo: proveedor.activo,
    })
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Confirmar eliminación?')) {
      try {
        await eliminar(id)
        toast({ title: 'Proveedor eliminado' })
      } catch (error) {
        toast({ title: 'Error al eliminar', variant: 'destructive' })
      }
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Proveedores</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { setEditando(null); resetForm() }}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar' : 'Nuevo'} Proveedor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
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
                  <select
                    value={formData.tipo_proveedor}
                    onChange={(e) => setFormData({ ...formData, tipo_proveedor: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="farmaceutico">Farmacéutico</option>
                    <option value="medico_quirurgico">Médico Quirúrgico</option>
                    <option value="laboratorio">Laboratorio</option>
                    <option value="servicios">Servicios</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Teléfono</label>
                  <Input
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Plazo Entrega (días)</label>
                  <Input
                    type="number"
                    value={formData.plazo_entrega_dias}
                    onChange={(e) => setFormData({ ...formData, plazo_entrega_dias: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.es_autorizado}
                    onCheckedChange={(checked) => setFormData({ ...formData, es_autorizado: checked as boolean })}
                  />
                  <label className="text-sm">Autorizado</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.es_preferente}
                    onCheckedChange={(checked) => setFormData({ ...formData, es_preferente: checked as boolean })}
                  />
                  <label className="text-sm">Preferente</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.activo}
                    onCheckedChange={(checked) => setFormData({ ...formData, activo: checked as boolean })}
                  />
                  <label className="text-sm">Activo</label>
                </div>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Autorizado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proveedores.map((prov) => (
                  <TableRow key={prov.id}>
                    <TableCell className="font-mono text-sm">{prov.codigo}</TableCell>
                    <TableCell>{prov.nombre}</TableCell>
                    <TableCell className="text-sm">{prov.tipo_proveedor || '-'}</TableCell>
                    <TableCell className="text-sm">{prov.email || '-'}</TableCell>
                    <TableCell>{prov.es_autorizado ? '✓' : '-'}</TableCell>
                    <TableCell>{prov.activo ? '✓ Activo' : 'Inactivo'}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(prov)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(prov.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
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
