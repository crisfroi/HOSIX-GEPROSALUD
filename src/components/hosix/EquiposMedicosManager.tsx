import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, User, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useHosixEquipos, EquipoMedico } from '@/hooks/useHosixEquipos';

const EquiposMedicosManager: React.FC = () => {
  const {
    equipos,
    isLoading,
    error,
    crearEquipo,
    actualizarEquipo,
    eliminarEquipo,
    loadEquipos,
    loadEquipoDetalle,
    agregarMiembro,
    eliminarMiembro
  } = useHosixEquipos();

  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showMiembrosDialog, setShowMiembrosDialog] = useState(false);
  const [selectedEquipoId, setSelectedEquipoId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [equipoDetalles, setEquipoDetalles] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    departamento_id: '',
    jefe_equipo_id: '',
  });
  const [miembroForm, setMiembroForm] = useState({
    medico_id: '',
    rol: 'miembro' as 'jefe' | 'miembro' | 'consultor'
  });

  const filteredEquipos = equipos.filter(e =>
    e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (equipo?: EquipoMedico) => {
    if (equipo) {
      setEditingId(equipo.id);
      setFormData({
        codigo: equipo.codigo,
        nombre: equipo.nombre,
        descripcion: equipo.descripcion || '',
        departamento_id: equipo.departamento_id || '',
        jefe_equipo_id: equipo.jefe_equipo_id || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        departamento_id: '',
        jefe_equipo_id: '',
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.nombre || !formData.codigo) {
        alert('Nombre y código son requeridos');
        return;
      }

      if (editingId) {
        await actualizarEquipo(editingId, {
          codigo: formData.codigo,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          departamento_id: formData.departamento_id || null,
          jefe_equipo_id: formData.jefe_equipo_id || null,
        });
      } else {
        await crearEquipo({
          codigo: formData.codigo,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          departamento_id: formData.departamento_id || null,
          jefe_equipo_id: formData.jefe_equipo_id || null,
          activo: true,
        });
      }

      setShowDialog(false);
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        departamento_id: '',
        jefe_equipo_id: '',
      });
      loadEquipos();
    } catch (err) {
      console.error('Error guardando equipo:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de que desea eliminar este equipo?')) {
      try {
        await eliminarEquipo(id);
        loadEquipos();
      } catch (err) {
        console.error('Error eliminando equipo:', err);
      }
    }
  };

  const handleAgregarMiembro = async () => {
    try {
      if (!selectedEquipoId || !miembroForm.medico_id) {
        alert('Seleccione un médico');
        return;
      }

      await agregarMiembro(selectedEquipoId, miembroForm.medico_id, miembroForm.rol);
      setMiembroForm({ medico_id: '', rol: 'miembro' });

      // Recargar detalles
      const detalles = await loadEquipoDetalle(selectedEquipoId);
      setEquipoDetalles(detalles);
    } catch (err) {
      console.error('Error agregando miembro:', err);
    }
  };

  const handleEliminarMiembro = async (miembroId: string) => {
    if (confirm('¿Está seguro de que desea remover este miembro?')) {
      try {
        await eliminarMiembro(miembroId);
        if (selectedEquipoId) {
          const detalles = await loadEquipoDetalle(selectedEquipoId);
          setEquipoDetalles(detalles);
        }
      } catch (err) {
        console.error('Error removiendo miembro:', err);
      }
    }
  };

  const handleVerMiembros = async (equipoId: string) => {
    try {
      setSelectedEquipoId(equipoId);
      const detalles = await loadEquipoDetalle(equipoId);
      setEquipoDetalles(detalles);
      setShowMiembrosDialog(true);
    } catch (err) {
      console.error('Error cargando detalles:', err);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Equipos Médicos</CardTitle>
              <CardDescription>Crear y gestionar equipos de médicos por departamento</CardDescription>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nuevo Equipo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? 'Editar Equipo Médico' : 'Crear Nuevo Equipo Médico'}
                  </DialogTitle>
                  <DialogDescription>
                    Ingrese los detalles del equipo médico
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Código *</label>
                    <Input
                      placeholder="Ej: EQUIP-CARDIO-001"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nombre *</label>
                    <Input
                      placeholder="Ej: Equipo de Cardiología"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descripción</label>
                    <Input
                      placeholder="Descripción opcional"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Departamento</label>
                    <Input
                      placeholder="ID del departamento"
                      value={formData.departamento_id}
                      onChange={(e) => setFormData({ ...formData, departamento_id: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Jefe del Equipo</label>
                    <Input
                      placeholder="ID del médico jefe"
                      value={formData.jefe_equipo_id}
                      onChange={(e) => setFormData({ ...formData, jefe_equipo_id: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <Button variant="outline" onClick={() => setShowDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSave}>
                      {editingId ? 'Actualizar' : 'Crear'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
              <span className="text-sm text-gray-500">
                {filteredEquipos.length} equipos
              </span>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-[120px]">Miembros</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        Cargando equipos...
                      </TableCell>
                    </TableRow>
                  ) : filteredEquipos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                        No hay equipos disponibles
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEquipos.map((equipo) => (
                      <React.Fragment key={equipo.id}>
                        <TableRow className="hover:bg-gray-50">
                          <TableCell className="font-medium">{equipo.codigo}</TableCell>
                          <TableCell>{equipo.nombre}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {equipo.descripcion || '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerMiembros(equipo.id)}
                              className="gap-1"
                            >
                              <User className="w-3 h-3" />
                              {equipo.miembros_count || 0}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenDialog(equipo)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(equipo.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de Miembros */}
      <Dialog open={showMiembrosDialog} onOpenChange={setShowMiembrosDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Miembros de {equipoDetalles?.nombre}
            </DialogTitle>
            <DialogDescription>
              Gestionar miembros del equipo médico
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Agregar miembro */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Agregar Miembro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="ID del médico"
                    value={miembroForm.medico_id}
                    onChange={(e) => setMiembroForm({ ...miembroForm, medico_id: e.target.value })}
                  />
                  <Select value={miembroForm.rol} onValueChange={(val) => setMiembroForm({ ...miembroForm, rol: val as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jefe">Jefe</SelectItem>
                      <SelectItem value="miembro">Miembro</SelectItem>
                      <SelectItem value="consultor">Consultor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAgregarMiembro} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </CardContent>
            </Card>

            {/* Listado de miembros */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {equipoDetalles?.miembros && equipoDetalles.miembros.length > 0 ? (
                equipoDetalles.miembros.map((miembro: any) => (
                  <div key={miembro.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {miembro.medico?.nombre} {miembro.medico?.apellido}
                      </p>
                      <p className="text-xs text-gray-500">
                        Rol: {miembro.rol} | {miembro.medico?.especialidad}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEliminarMiembro(miembro.id)}
                    >
                      <Minus className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay miembros en este equipo
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowMiembrosDialog(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EquiposMedicosManager;
