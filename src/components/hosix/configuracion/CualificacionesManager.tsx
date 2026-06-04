import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { Trash2, Edit2, Plus, Award } from 'lucide-react'
import { useHosixCualificaciones, Cualificacion } from '@/hooks/useHosixCualificaciones'
import { Checkbox } from '@/components/ui/checkbox'

export function CualificacionesManager() {
  const { cualificaciones, cargando, crear, actualizar, eliminar } = useHosixCualificaciones()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<Cualificacion | null>(null)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    nivel: 'intermedio' as const,
    duracion_horas: 0,
    institucion: '',
    vigencia_años: 0,
    requiere_recertificacion: false,
    activo: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editando) {
        await actualizar(editando.id, formData)
        toast({ title: 'Cualificación actualizada' })
      } else {
        await crear(formData as any)
        toast({ title: 'Cualificación creada' })
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
      nivel: 'intermedio',
      duracion_horas: 0,
      institucion: '',
      vigencia_años: 0,
      requiere_recertificacion: false,
      activo: true,
    })
    setEditando(null)
  }

  const handleEdit = (cualificacion: Cualificacion) => {
    setEditando(cualificacion)
    setFormData({
      codigo: cualificacion.codigo,
      nombre: cualificacion.nombre,
      descripcion: cualificacion.descripcion || '',
      nivel: (cualificacion.nivel as any) || 'intermedio',
      duracion_horas: cualificacion.duracion_horas || 0,
      institucion: cualificacion.institucion || '',
      vigencia_años: cualificacion.vigencia_años || 0,
      requiere_recertificacion: cualificacion.requiere_recertificacion,
      activo: cualificacion.activo,
    })
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Confirmar eliminación?')) {
      try {
        await eliminar(id)
        toast({ title: 'Cualificación eliminada' })
      } catch (error) {
        toast({ title: 'Error al eliminar', variant: 'destructive' })
      }
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-600" />
          <CardTitle>Cualificaciones Profesionales</CardTitle>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { setEditando(null); resetForm() }}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar' : 'Nueva'} Cualificación</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Código</label>
                  <Input
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    required
                    placeholder="CUA-001"
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
                  <label className="text-sm font-medium">Nivel</label>
                  <select
                    value={formData.nivel}
                    onChange={(e) => setFormData({ ...formData, nivel: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="basico">Básico</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzado">Avanzado</option>
                    <option value="experto">Experto</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Duración (horas)</label>
                  <Input
                    type="number"
                    value={formData.duracion_horas}
                    onChange={(e) => setFormData({ ...formData, duracion_horas: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Institución</label>
                  <Input
                    value={formData.institucion}
                    onChange={(e) => setFormData({ ...formData, institucion: e.target.value })}
                    placeholder="Ej: OMS, Ministerio de Salud"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Vigencia (años)</label>
                  <Input
                    type="number"
                    value={formData.vigencia_años}
                    onChange={(e) => setFormData({ ...formData, vigencia_años: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.requiere_recertificacion}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requiere_recertificacion: checked as boolean })
                    }
                  />
                  <label className="text-sm">Requiere Recertificación</label>
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
                  <TableHead>Nivel</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Recertif.</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cualificaciones.map((cualificacion) => (
                  <TableRow key={cualificacion.id}>
                    <TableCell className="font-mono text-sm font-bold">{cualificacion.codigo}</TableCell>
                    <TableCell>{cualificacion.nombre}</TableCell>
                    <TableCell className="text-sm">
                      <span className="bg-blue-100 px-2 py-1 rounded text-xs">
                        {cualificacion.nivel || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{cualificacion.duracion_horas ? `${cualificacion.duracion_horas}h` : '-'}</TableCell>
                    <TableCell className="text-sm">{cualificacion.vigencia_años ? `${cualificacion.vigencia_años} años` : '-'}</TableCell>
                    <TableCell>{cualificacion.requiere_recertificacion ? '✓' : '-'}</TableCell>
                    <TableCell>{cualificacion.activo ? '✓ Activo' : 'Inactivo'}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(cualificacion)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(cualificacion.id)}>
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
