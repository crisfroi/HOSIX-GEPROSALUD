import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { Trash2, Edit2, Plus } from 'lucide-react'
import { useHosixMaterialMedico, MaterialMedico } from '@/hooks/useHosixMaterialMedico'
import { Checkbox } from '@/components/ui/checkbox'

export function MaterialMedicoManager() {
  const { materiales, cargando, crear, actualizar, eliminar } = useHosixMaterialMedico()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<MaterialMedico | null>(null)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: '',
    tipo_material: 'insumo' as const,
    presentacion: '',
    unidad_medida: '',
    precio_unitario: 0,
    requiere_refrigeracion: false,
    es_estéril: false,
    fecha_vencimiento: false,
    activo: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editando) {
        await actualizar(editando.id, formData)
        toast({ title: 'Material actualizado' })
      } else {
        await crear(formData as any)
        toast({ title: 'Material creado' })
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
      categoria: '',
      tipo_material: 'insumo',
      presentacion: '',
      unidad_medida: '',
      precio_unitario: 0,
      requiere_refrigeracion: false,
      es_estéril: false,
      fecha_vencimiento: false,
      activo: true,
    })
    setEditando(null)
  }

  const handleEdit = (material: MaterialMedico) => {
    setEditando(material)
    setFormData({
      codigo: material.codigo,
      nombre: material.nombre,
      descripcion: material.descripcion || '',
      categoria: material.categoria || '',
      tipo_material: (material.tipo_material as any) || 'insumo',
      presentacion: material.presentacion || '',
      unidad_medida: material.unidad_medida || '',
      precio_unitario: material.precio_unitario || 0,
      requiere_refrigeracion: material.requiere_refrigeracion,
      es_estéril: material.es_estéril,
      fecha_vencimiento: material.fecha_vencimiento,
      activo: material.activo,
    })
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Confirmar eliminación?')) {
      try {
        await eliminar(id)
        toast({ title: 'Material eliminado' })
      } catch (error) {
        toast({ title: 'Error al eliminar', variant: 'destructive' })
      }
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Material Médico</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { setEditando(null); resetForm() }}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar' : 'Nuevo'} Material Médico</DialogTitle>
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
                  <label className="text-sm font-medium">Categoría</label>
                  <Input
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo de Material</label>
                  <select
                    value={formData.tipo_material}
                    onChange={(e) => setFormData({ ...formData, tipo_material: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="insumo">Insumo</option>
                    <option value="equipo">Equipo</option>
                    <option value="reactivo">Reactivo</option>
                    <option value="suministro">Suministro</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Presentación</label>
                  <Input
                    value={formData.presentacion}
                    onChange={(e) => setFormData({ ...formData, presentacion: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Unidad de Medida</label>
                  <Input
                    value={formData.unidad_medida}
                    onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Precio Unitario</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.precio_unitario}
                    onChange={(e) => setFormData({ ...formData, precio_unitario: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.requiere_refrigeracion}
                    onCheckedChange={(checked) => setFormData({ ...formData, requiere_refrigeracion: checked as boolean })}
                  />
                  <label className="text-sm">Requiere Refrigeración</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.es_estéril}
                    onCheckedChange={(checked) => setFormData({ ...formData, es_estéril: checked as boolean })}
                  />
                  <label className="text-sm">Es Estéril</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.fecha_vencimiento}
                    onCheckedChange={(checked) => setFormData({ ...formData, fecha_vencimiento: checked as boolean })}
                  />
                  <label className="text-sm">Tiene Vencimiento</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.activo}
                    onCheckedChange={(checked) => setFormData({ ...formData, activo: checked as boolean })}
                  />
                  <label className="text-sm">Activo</label>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <Input
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
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
                  <TableHead>Precio</TableHead>
                  <TableHead>Propiedades</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materiales.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-mono text-sm">{material.codigo}</TableCell>
                    <TableCell>{material.nombre}</TableCell>
                    <TableCell className="text-sm">{material.tipo_material || '-'}</TableCell>
                    <TableCell className="text-sm">{material.precio_unitario || '-'}</TableCell>
                    <TableCell className="text-xs">
                      {[
                        material.requiere_refrigeracion && '🧊',
                        material.es_estéril && '✓Estéril',
                        material.fecha_vencimiento && '⏰Vence',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    </TableCell>
                    <TableCell>{material.activo ? '✓ Activo' : 'Inactivo'}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(material)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(material.id)}>
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
