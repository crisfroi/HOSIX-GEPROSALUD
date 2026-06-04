import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { AlertCircle, Edit2, Plus, Trash2 } from 'lucide-react'
import { useHosixPoliticasSeguridad, PoliticaSeguridad } from '@/hooks/useHosixPoliticasSeguridad'
import { Checkbox } from '@/components/ui/checkbox'

export function PoliticasSeguridadManager() {
  const { politicas, cargando, crear, actualizar, eliminar } = useHosixPoliticasSeguridad()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<PoliticaSeguridad | null>(null)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    tabla_aplicada: '',
    operacion: 'SELECT' as const,
    condicion_sql: '',
    activa: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editando) {
        await actualizar(editando.id, formData)
        toast({ title: 'Política actualizada' })
      } else {
        await crear(formData as any)
        toast({ title: 'Política creada' })
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
      tabla_aplicada: '',
      operacion: 'SELECT',
      condicion_sql: '',
      activa: true,
    })
    setEditando(null)
  }

  const handleEdit = (politica: PoliticaSeguridad) => {
    setEditando(politica)
    setFormData({
      codigo: politica.codigo,
      nombre: politica.nombre,
      descripcion: politica.descripcion || '',
      tabla_aplicada: politica.tabla_aplicada || '',
      operacion: (politica.operacion as any) || 'SELECT',
      condicion_sql: politica.condicion_sql || '',
      activa: politica.activa,
    })
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('⚠️ Esto afectará seguridad. ¿Confirmar eliminación?')) {
      try {
        await eliminar(id)
        toast({ title: 'Política eliminada' })
      } catch (error) {
        toast({ title: 'Error al eliminar', variant: 'destructive' })
      }
    }
  }

  return (
    <Card className="border-amber-200">
      <CardHeader className="flex flex-row items-center justify-between bg-amber-50">
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Políticas de Seguridad (RLS)
          </CardTitle>
          <p className="text-sm text-amber-600 mt-1">⚠️ Cambios aquí afectan directamente a seguridad</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { setEditando(null); resetForm() }}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar' : 'Nueva'} Política de Seguridad</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Código</label>
                  <Input
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    required
                    placeholder="POL-XXX"
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
                  <label className="text-sm font-medium">Tabla Aplicada</label>
                  <Input
                    value={formData.tabla_aplicada}
                    onChange={(e) => setFormData({ ...formData, tabla_aplicada: e.target.value })}
                    placeholder="ej: hosix_pacientes"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Operación</label>
                  <select
                    value={formData.operacion}
                    onChange={(e) => setFormData({ ...formData, operacion: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="SELECT">SELECT (Lectura)</option>
                    <option value="INSERT">INSERT (Crear)</option>
                    <option value="UPDATE">UPDATE (Editar)</option>
                    <option value="DELETE">DELETE (Eliminar)</option>
                    <option value="ALL">ALL (Todas)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Condición SQL (WHERE)</label>
                <textarea
                  value={formData.condicion_sql}
                  onChange={(e) => setFormData({ ...formData, condicion_sql: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md font-mono text-xs"
                  rows={4}
                  placeholder="ej: centro_salud_id = auth.uid()"
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
                  checked={formData.activa}
                  onCheckedChange={(checked) => setFormData({ ...formData, activa: checked as boolean })}
                />
                <label className="text-sm">Activa</label>
              </div>
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
                Guardar Política
              </Button>
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
                  <TableHead>Tabla</TableHead>
                  <TableHead>Operación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {politicas.map((politica) => (
                  <TableRow key={politica.id} className={!politica.activa ? 'bg-gray-50' : ''}>
                    <TableCell className="font-mono text-sm font-bold">{politica.codigo}</TableCell>
                    <TableCell className="font-medium">{politica.nombre}</TableCell>
                    <TableCell className="text-sm font-mono text-xs">{politica.tabla_aplicada || '-'}</TableCell>
                    <TableCell className="text-sm">
                      <span className="bg-blue-100 px-2 py-1 rounded text-xs font-mono">
                        {politica.operacion || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {politica.activa ? (
                        <span className="text-green-600 font-bold">✓ Activa</span>
                      ) : (
                        <span className="text-gray-400">Inactiva</span>
                      )}
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(politica)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(politica.id)}
                        className="hover:text-red-600"
                      >
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
