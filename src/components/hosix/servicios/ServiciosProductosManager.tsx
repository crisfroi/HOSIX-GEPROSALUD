import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
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
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/app/supabase';
import { useTabsStore } from '@/shared/stores/tabsStore';

interface ServicioProducto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria_id: string;
  tipo: 'servicio' | 'producto' | 'procedimiento';
  unidad_medida: string;
  es_facturables: boolean;
  activo: boolean;
}

interface Precio {
  id: string;
  servicio_id: string;
  hospital_id: string;
  precio_base: number;
  precio_hospital: number;
  vigente_desde: string;
  vigente_hasta?: string;
}

export const ServiciosProductosManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [selectedServicio, setSelectedServicio] = useState<ServicioProducto | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Query: Servicios/Productos
  const { data: servicios = [], isLoading } = useQuery({
    queryKey: ['servicios-productos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_servicios_productos')
        .select('*')
        .order('nombre');
      if (error) throw error;
      return data as ServicioProducto[];
    },
  });

  // Query: Precios activos
  const { data: precios = [] } = useQuery({
    queryKey: ['precios-servicios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_precios_servicio')
        .select('*')
        .eq('activo', true);
      if (error) throw error;
      return data as Precio[];
    },
  });

  // Mutation: Crear/Actualizar servicio
  const saveMutation = useMutation({
    mutationFn: async (servicio: Partial<ServicioProducto>) => {
      if (selectedServicio?.id) {
        const { error } = await supabase
          .from('hosix_servicios_productos')
          .update(servicio)
          .eq('id', selectedServicio.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hosix_servicios_productos')
          .insert([servicio]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios-productos'] });
      setIsDialogOpen(false);
      setSelectedServicio(null);
    },
  });

  // Mutation: Eliminar servicio
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('hosix_servicios_productos')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios-productos'] });
    },
  });

  const serviciosFiltrados = servicios.filter((s) => {
    const matchSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = !filtroTipo || s.tipo === filtroTipo;
    return matchSearch && matchTipo;
  });

  const obtenerPrecioPromedio = (servicioId: string) => {
    const preciosServicio = precios.filter((p) => p.servicio_id === servicioId);
    if (preciosServicio.length === 0) return 'N/A';
    const promedio =
      preciosServicio.reduce((sum, p) => sum + p.precio_hospital, 0) /
      preciosServicio.length;
    return `${promedio.toFixed(2)} XAF`;
  };

  return (
    <div className="space-y-4 p-4">
      {/* =============== ENCABEZADO Y ACCIONES =============== */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Servicios & Productos</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2"
              onClick={() => setSelectedServicio(null)}
            >
              <Plus className="w-4 h-4" /> Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedServicio ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
              </DialogTitle>
            </DialogHeader>
            <ServicioForm
              servicio={selectedServicio}
              onSave={(data) => saveMutation.mutate(data)}
              onClose={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* =============== FILTROS Y BÚSQUEDA =============== */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los tipos</SelectItem>
            <SelectItem value="servicio">Servicio</SelectItem>
            <SelectItem value="procedimiento">Procedimiento</SelectItem>
            <SelectItem value="producto">Producto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* =============== TABLA DE SERVICIOS =============== */}
      {isLoading ? (
        <div className="text-center py-8">Cargando servicios...</div>
      ) : serviciosFiltrados.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          No hay servicios que coincidan con la búsqueda
        </div>
      ) : (
        <div className="grid gap-3">
          {serviciosFiltrados.map((servicio) => (
            <Card key={servicio.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{servicio.nombre}</h3>
                      <Badge
                        variant={servicio.activo ? 'default' : 'secondary'}
                      >
                        {servicio.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <Badge variant="outline">{servicio.tipo}</Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      Código: <span className="font-mono">{servicio.codigo}</span>
                    </p>
                    {servicio.descripcion && (
                      <p className="text-sm text-slate-500 mb-2">
                        {servicio.descripcion}
                      </p>
                    )}
                    <div className="flex gap-4 text-sm text-slate-600">
                      <span>Unidad: {servicio.unidad_medida}</span>
                      <span>
                        Precio Promedio: {obtenerPrecioPromedio(servicio.id)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedServicio(servicio);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(servicio.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente del formulario
const ServicioForm: React.FC<{
  servicio: ServicioProducto | null;
  onSave: (data: Partial<ServicioProducto>) => void;
  onClose: () => void;
}> = ({ servicio, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<ServicioProducto>>(
    servicio || {
      codigo: '',
      nombre: '',
      tipo: 'servicio',
      unidad_medida: 'unidad',
      es_facturables: true,
      activo: true,
    }
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Código</label>
        <Input
          value={formData.codigo || ''}
          onChange={(e) =>
            setFormData({ ...formData, codigo: e.target.value })
          }
          placeholder="p.ej. CONS-001"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Nombre</label>
        <Input
          value={formData.nombre || ''}
          onChange={(e) =>
            setFormData({ ...formData, nombre: e.target.value })
          }
          placeholder="p.ej. Consulta Médica General"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Descripción</label>
        <Input
          value={formData.descripcion || ''}
          onChange={(e) =>
            setFormData({ ...formData, descripcion: e.target.value })
          }
          placeholder="Descripción del servicio"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Tipo</label>
          <Select
            value={formData.tipo || 'servicio'}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                tipo: value as 'servicio' | 'procedimiento' | 'producto',
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="servicio">Servicio</SelectItem>
              <SelectItem value="procedimiento">Procedimiento</SelectItem>
              <SelectItem value="producto">Producto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Unidad de Medida</label>
          <Input
            value={formData.unidad_medida || ''}
            onChange={(e) =>
              setFormData({ ...formData, unidad_medida: e.target.value })
            }
            placeholder="unidad, día, etc."
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          onClick={() => {
            onSave(formData);
          }}
        >
          Guardar
        </Button>
      </div>
    </div>
  );
};

export default ServiciosProductosManager;

