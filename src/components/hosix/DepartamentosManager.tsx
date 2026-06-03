import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronDown } from 'lucide-react';
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
import { useHosixDepartamentos, Departamento } from '@/hooks/useHosixDepartamentos';

const DepartamentosManager: React.FC = () => {
  const {
    departamentos,
    isLoading,
    error,
    crearDepartamento,
    actualizarDepartamento,
    eliminarDepartamento,
    loadDepartamentos
  } = useHosixDepartamentos();

  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    jefe_departamento_id: '',
  });

  const filteredDepartamentos = departamentos.filter(d =>
    d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (dept?: Departamento) => {
    if (dept) {
      setEditingId(dept.id);
      setFormData({
        codigo: dept.codigo,
        nombre: dept.nombre,
        descripcion: dept.descripcion || '',
        jefe_departamento_id: dept.jefe_departamento_id || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        jefe_departamento_id: '',
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
        await actualizarDepartamento(editingId, {
          codigo: formData.codigo,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          jefe_departamento_id: formData.jefe_departamento_id || null,
        });
      } else {
        await crearDepartamento({
          codigo: formData.codigo,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          jefe_departamento_id: formData.jefe_departamento_id || null,
          activo: true,
        });
      }

      setShowDialog(false);
      setFormData({ codigo: '', nombre: '', descripcion: '', jefe_departamento_id: '' });
      loadDepartamentos();
    } catch (err) {
      console.error('Error guardando departamento:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de que desea eliminar este departamento?')) {
      try {
        await eliminarDepartamento(id);
        loadDepartamentos();
      } catch (err) {
        console.error('Error eliminando departamento:', err);
      }
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Departamentos</CardTitle>
              <CardDescription>Crear y gestionar departamentos del hospital</CardDescription>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nuevo Departamento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? 'Editar Departamento' : 'Crear Nuevo Departamento'}
                  </DialogTitle>
                  <DialogDescription>
                    Ingrese los detalles del departamento
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Código *</label>
                    <Input
                      placeholder="Ej: CARDIO-001"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nombre *</label>
                    <Input
                      placeholder="Ej: Cardiología"
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
                    <label className="text-sm font-medium">Jefe del Departamento</label>
                    <Input
                      placeholder="ID del médico responsable"
                      value={formData.jefe_departamento_id}
                      onChange={(e) => setFormData({ ...formData, jefe_departamento_id: e.target.value })}
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
                {filteredDepartamentos.length} departamentos
              </span>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        Cargando departamentos...
                      </TableCell>
                    </TableRow>
                  ) : filteredDepartamentos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                        No hay departamentos disponibles
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDepartamentos.map((dept) => (
                      <React.Fragment key={dept.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => setExpandedId(expandedId === dept.id ? null : dept.id)}
                        >
                          <TableCell className="font-medium">{dept.codigo}</TableCell>
                          <TableCell>{dept.nombre}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {dept.descripcion || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDialog(dept);
                                }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(dept.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedId(expandedId === dept.id ? null : dept.id);
                                }}
                              >
                                <ChevronDown
                                  className={`w-4 h-4 transition-transform ${
                                    expandedId === dept.id ? 'rotate-180' : ''
                                  }`}
                                />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedId === dept.id && (
                          <TableRow className="bg-gray-50">
                            <TableCell colSpan={4} className="py-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">ID: </span>
                                  {dept.id}
                                </div>
                                <div>
                                  <span className="font-medium">Jefe: </span>
                                  {dept.jefe_departamento_id || 'No asignado'}
                                </div>
                                <div>
                                  <span className="font-medium">Creado: </span>
                                  {dept.created_at ? new Date(dept.created_at).toLocaleDateString() : '-'}
                                </div>
                                <div>
                                  <span className="font-medium">Estado: </span>
                                  <span className={dept.activo ? 'text-green-600' : 'text-red-600'}>
                                    {dept.activo ? 'Activo' : 'Inactivo'}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepartamentosManager;
