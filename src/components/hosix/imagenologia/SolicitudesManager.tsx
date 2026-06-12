import React, { useState } from 'react'
import { useHosixImagenologia } from '@/hooks/useHosixImagenologia'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Eye } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

export const SolicitudesManager: React.FC = () => {
  const { solicitudes = [], modalidades = [], crearSolicitud } = useHosixImagenologia()
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    modalidad_id: '',
    diagnostico_clinico: '',
    zona_interes: '',
    prioridad: 'normal',
    requiere_contraste: false,
    tipo_contraste: '',
    observaciones: ''
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!formData.modalidad_id) {
        toast.error('Selecciona una modalidad')
        return
      }
      await crearSolicitud(formData)
      toast.success('Solicitud creada exitosamente')
      setIsOpen(false)
      setFormData({
        modalidad_id: '',
        diagnostico_clinico: '',
        zona_interes: '',
        prioridad: 'normal',
        requiere_contraste: false,
        tipo_contraste: '',
        observaciones: ''
      })
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    }
  }

  const filtered = solicitudes.filter(s => {
    const matchSearch = searchTerm === '' || 
      s.diagnostico_clinico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.zona_interes?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchEstado = filtroEstado === 'todos' || 
      s.estado === filtroEstado
    return matchSearch && matchEstado
  })

  const stats = {
    pendientes: solicitudes.filter(s => s.estado === 'pendiente').length,
    programadas: solicitudes.filter(s => s.estado === 'programada').length,
    realizadas: solicitudes.filter(s => s.estado === 'realizada').length
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Programadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.programadas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Realizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.realizadas}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Solicitudes de Imagenología</CardTitle>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Solicitud
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nueva Solicitud de Imagenología</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Modalidad</label>
                    <select
                      value={formData.modalidad_id}
                      onChange={(e) => setFormData({...formData, modalidad_id: e.target.value})}
                      className="w-full px-3 py-2 border rounded"
                      required
                    >
                      <option value="">Selecciona una modalidad</option>
                      {modalidades.map((m: any) => (
                        <option key={m.id} value={m.id}>{m.nombre} ({m.categoria})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Diagnóstico Clínico</label>
                    <textarea
                      value={formData.diagnostico_clinico}
                      onChange={(e) => setFormData({...formData, diagnostico_clinico: e.target.value})}
                      className="w-full px-3 py-2 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Zona de Interés</label>
                    <Input
                      value={formData.zona_interes}
                      onChange={(e) => setFormData({...formData, zona_interes: e.target.value})}
                      placeholder="Ej: pulmón derecho, abdomen, etc."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Prioridad</label>
                      <select
                        value={formData.prioridad}
                        onChange={(e) => setFormData({...formData, prioridad: e.target.value})}
                        className="w-full px-3 py-2 border rounded"
                      >
                        <option value="normal">Normal</option>
                        <option value="urgente">Urgente</option>
                        <option value="diferida">Diferida</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.requiere_contraste}
                          onChange={(e) => setFormData({...formData, requiere_contraste: e.target.checked})}
                        />
                        <span className="text-sm">Requiere contraste</span>
                      </label>
                    </div>
                  </div>
                  {formData.requiere_contraste && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Tipo de Contraste</label>
                      <Input
                        value={formData.tipo_contraste}
                        onChange={(e) => setFormData({...formData, tipo_contraste: e.target.value})}
                        placeholder="Ej: contraste iodado IV, bario, etc."
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1">Observaciones</label>
                    <textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <Button type="submit" className="w-full">Crear Solicitud</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Buscar solicitud..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="todos">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="programada">Programada</option>
              <option value="realizada">Realizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Diagnóstico</TableHead>
                <TableHead>Zona</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Solicitud</TableHead>
                <TableHead>Fecha Programada</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="max-w-xs truncate">{s.diagnostico_clinico}</TableCell>
                  <TableCell>{s.zona_interes}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      s.prioridad === 'urgente' ? 'bg-red-100 text-red-800' :
                      s.prioridad === 'diferida' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {s.prioridad}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      s.estado === 'realizada' ? 'bg-green-100 text-green-800' :
                      s.estado === 'programada' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {s.estado}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(s.fecha_solicitud).toLocaleDateString()}</TableCell>
                  <TableCell>{s.fecha_programada ? new Date(s.fecha_programada).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay solicitudes con los filtros aplicados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default SolicitudesManager
