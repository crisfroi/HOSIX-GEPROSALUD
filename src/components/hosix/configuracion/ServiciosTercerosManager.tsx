import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { Trash2, Edit2, Plus } from 'lucide-react'
import { useHosixServiciosTerceros, ServicioTercero } from '@/hooks/useHosixServiciosTerceros'
import { Checkbox } from '@/components/ui/checkbox'

export function ServiciosTercerosManager() {
  const { servicios, cargando, crear, actualizar, eliminar } = useHosixServiciosTerceros()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<ServicioTercero | null>(null)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo_servicio: 'mantenimiento' as const,
    fecha_inicio: '',
    fecha_vencimiento: '',
    periodicidad: 'mensual' as const,
    costo_periodo: 0,
    contacto_externo: '',
    activo: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editando) {
        await actualizar(editando.id, formData)
        toast({ title: 'Servicio actualizado' })
      } else {
        await crear(formData as any)
        toast({ title: 'Servicio creado' })
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
      tipo_servicio: 'mantenimiento',
      fecha_inicio: '',
      fecha_vencimiento: '',
      periodicidad: 'mensual',
      costo_periodo: 0,
      contacto_externo: '',
      activo: true,
    })
    setEditando(null)
  }

  const handleEdit = (servicio: ServicioTercero) => {
    setEditando(servicio)
    setFormData({
      codigo: servicio.codigo,
      nombre: servicio.nombre,
      descripcion: servicio.descripcion || '',
      tipo_servicio: (servicio.tipo_servicio as any) || 'mantenimiento',
      fecha_inicio: servicio.fecha_inicio?.split('T')[0] || '',
      fecha_vencimiento: servicio.fecha_vencimiento?.split('T')[0] || '',
      periodicidad: (servicio.periodicidad as any) || 'mensual',
      costo_periodo: servicio.costo_periodo || 0,
      contacto_externo: servicio.contacto_externo || '',
      activo: servicio.activo,
    })
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Confirmar eliminación?')) {
      try {
        await eliminar(id)
        toast({ title: 'Servicio eliminado' })
      } catch (error) {
        toast({ title: 'Error al eliminar', variant: 'destructive' })
      }
    }
  }

  const isVigente = (servicio: ServicioTercero) => {
    if (!servicio.fecha_vencimiento) return true
    return new Date(servicio.fecha_vencimiento) > new Date()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Servicios de Terceros</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { setEditando(null); resetForm() }}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar' : 'Nuevo'} Servicio de Terceros</DialogTitle>
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
                  <label className="text-sm font-medium">Tipo de Servicio</label>
                  <select
                    value={formData.tipo_servicio}
                    onChange={(e) => setFormData({ ...formData, tipo_servicio: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="limpieza">Limpieza</option>
                    <option value="seguridad">Seguridad</option>
                    <option value="transporte">Transporte</option>
                    <option value="consultoria">Consultoría</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Periodicidad</label>
                  <select
                    value={formData.periodicidad}
                    onChange={(e) => setFormData({ ...formData, periodicidad: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="diario">Diario</option>
                    <option value="semanal">Semanal</option>
                    <option value="mensual">Mensual</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Fecha de Inicio</label>
                  <Input
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Fecha de Vencimiento</label>
                  <Input
                    type="date"
                    value={formData.fecha_vencimiento}
                    onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Costo por Período</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.costo_periodo}
                    onChange={(e) => setFormData({ ...formData, costo_periodo: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Contacto Externo</label>
                  <Input
                    value={formData.contacto_externo}
                    onChange={(e) => setFormData({ ...formData, contacto_externo: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked as boolean })}
                />
                <label className="text-sm">Activo</label>
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
                  <TableHead>Período</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servicios.map((servicio) => (
                  <TableRow key={servicio.id}>
                    <TableCell className="font-mono text-sm">{servicio.codigo}</TableCell>
                    <TableCell>{servicio.nombre}</TableCell>
                    <TableCell className="text-sm">{servicio.tipo_servicio || '-'}</TableCell>
                    <TableCell className="text-sm">{servicio.periodicidad || '-'}</TableCell>
                    <TableCell className="text-sm">
                      <span className={isVigente(servicio) ? 'text-green-600' : 'text-red-600'}>
                        {isVigente(servicio) ? '✓ Vigente' : '⚠ Vencido'}
                      </span>
                    </TableCell>
                    <TableCell>{servicio.activo ? '✓ Activo' : 'Inactivo'}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(servicio)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(servicio.id)}>
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
