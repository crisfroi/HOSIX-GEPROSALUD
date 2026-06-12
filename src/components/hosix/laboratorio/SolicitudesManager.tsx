import React, { useState } from 'react'
import { useHosixLaboratorio } from '@/hooks/useHosixLaboratorio'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Eye, Trash2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

export const SolicitudesManager: React.FC = () => {
  const { solicitudes = [], crearSolicitud } = useHosixLaboratorio()
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    diagnostico_clinico: '',
    observaciones: '',
    prioridad: 'normal',
    fecha_requerida: ''
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await crearSolicitud(formData)
      toast.success('Solicitud creada exitosamente')
      setIsOpen(false)
      setFormData({
        diagnostico_clinico: '',
        observaciones: '',
        prioridad: 'normal',
        fecha_requerida: ''
      })
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    }
  }

  const filtered = solicitudes.filter(s => {
    const matchSearch = searchTerm === '' ||
      s.diagnostico_clinico?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchEstado = filtroEstado === 'todos' ||
      s.estado === filtroEstado
    return matchSearch && matchEstado
  })

  const stats = {
    pendientes: solicitudes.filter(s => s.estado === 'pendiente').length,
    procesando: solicitudes.filter(s => s.estado === 'procesando').length,
    completadas: solicitudes.filter(s => s.estado === 'completada').length
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Solicitudes Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">En Procesamiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.procesando}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completadas}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Solicitudes de Laboratorio</CardTitle>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Solicitud
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva Solicitud de Laboratorio</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
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
                    <label className="block text-sm font-medium mb-1">Observaciones</label>
                    <textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Prioridad</label>
                    <select
                      value={formData.prioridad}
                      onChange={(e) => setFormData({...formData, prioridad: e.target.value})}
                      className="w-full px-3 py-2 border rounded"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Fecha Requerida</label>
                    <Input
                      type="date"
                      value={formData.fecha_requerida}
                      onChange={(e) => setFormData({...formData, fecha_requerida: e.target.value})}
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
              <option value="procesando">Procesando</option>
              <option value="completada">Completada</option>
            </select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Diagnóstico</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Solicitud</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="max-w-xs truncate">{s.diagnostico_clinico}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      s.prioridad === 'urgente' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {s.prioridad}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded text-xs bg-gray-100">{s.estado}</span>
                  </TableCell>
                  <TableCell>{new Date(s.fecha_solicitud).toLocaleDateString()}</TableCell>
                  <TableCell className="flex gap-2">
                    <button className="text-blue-500 hover:text-blue-700"><Eye className="w-4 h-4" /></button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default SolicitudesManager
