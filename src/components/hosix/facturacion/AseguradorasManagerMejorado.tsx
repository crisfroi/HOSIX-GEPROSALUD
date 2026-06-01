import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Search, Shield, TrendingDown } from 'lucide-react';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/app/supabase';

interface Aseguradora {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  created_at: string;
}

interface TarifaAseguradora {
  id: string;
  aseguradora_id: string;
  servicio_id: string;
  precio_tarifado: number;
  porcentaje_cobertura: number;
  vigente_desde: string;
  vigente_hasta?: string;
}

export const AseguradorasManagerMejorado: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAseguradora, setSelectedAseguradora] = useState<Aseguradora | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Query: Aseguradoras
  const { data: aseguradoras = [], isLoading } = useQuery({
    queryKey: ['aseguradoras-mejorado'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_aseguradoras')
        .select('*')
        .order('nombre');
      if (error) throw error;
      return data as Aseguradora[];
    },
  });

  // Query: Tarifas por aseguradora
  const { data: tarifas = [] } = useQuery({
    queryKey: ['tarifas-aseguradora', selectedAseguradora?.id],
    queryFn: async () => {
      if (!selectedAseguradora) return [];
      const { data, error } = await supabase
        .from('hosix_tarifas_aseguradora_servicio')
        .select('*')
        .eq('aseguradora_id', selectedAseguradora.id);
      if (error) throw error;
      return data as TarifaAseguradora[];
    },
    enabled: !!selectedAseguradora,
  });

  // Mutation: Guardar aseguradora
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Aseguradora>) => {
      if (selectedAseguradora?.id) {
        const { error } = await supabase
          .from('hosix_aseguradoras')
          .update(data)
          .eq('id', selectedAseguradora.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hosix_aseguradoras')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aseguradoras-mejorado'] });
      setIsDialogOpen(false);
      setSelectedAseguradora(null);
    },
  });

  // Mutation: Eliminar aseguradora
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('hosix_aseguradoras')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aseguradoras-mejorado'] });
    },
  });

  const aseguradorasFiltradas = aseguradoras.filter((a) =>
    a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Aseguradoras
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2"
              onClick={() => setSelectedAseguradora(null)}
            >
              <Plus className="w-4 h-4" /> Nueva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedAseguradora ? 'Editar Aseguradora' : 'Nueva Aseguradora'}
              </DialogTitle>
            </DialogHeader>
            <AseguradoraForm
              aseguradora={selectedAseguradora}
              onSave={(data) => saveMutation.mutate(data)}
              onClose={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar por nombre o código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="lista" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lista">Listado</TabsTrigger>
          <TabsTrigger value="tarifas">
            Tarifas Vigentes
            {selectedAseguradora && ` - ${selectedAseguradora.nombre}`}
          </TabsTrigger>
        </TabsList>

        {/* TAB: LISTA */}
        <TabsContent value="lista" className="space-y-3 mt-4">
          {isLoading ? (
            <div className="text-center py-8">Cargando aseguradoras...</div>
          ) : aseguradorasFiltradas.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No hay aseguradoras
            </div>
          ) : (
            <div className="grid gap-3">
              {aseguradorasFiltradas.map((aseg) => (
                <Card
                  key={aseg.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    selectedAseguradora?.id === aseg.id
                      ? 'border-blue-500 bg-blue-50'
                      : ''
                  }`}
                  onClick={() => setSelectedAseguradora(aseg)}
                >
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{aseg.nombre}</h3>
                          <Badge
                            variant={aseg.activo ? 'default' : 'secondary'}
                          >
                            {aseg.activo ? 'Activa' : 'Inactiva'}
                          </Badge>
                          <Badge variant="outline">{aseg.tipo}</Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">
                          Código: <span className="font-mono">{aseg.codigo}</span>
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 mt-2">
                          {aseg.email && <span>Email: {aseg.email}</span>}
                          {aseg.telefono && <span>Tel: {aseg.telefono}</span>}
                        </div>
                        {aseg.direccion && (
                          <p className="text-sm text-slate-500 mt-2">
                            {aseg.direccion}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAseguradora(aseg);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(aseg.id);
                          }}
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
        </TabsContent>

        {/* TAB: TARIFAS */}
        <TabsContent value="tarifas" className="space-y-4 mt-4">
          {!selectedAseguradora ? (
            <div className="text-center py-8 text-slate-500">
              Selecciona una aseguradora para ver sus tarifas
            </div>
          ) : tarifas.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Sin tarifas registradas
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servicio ID</TableHead>
                    <TableHead>Precio Tarifado</TableHead>
                    <TableHead>% Cobertura</TableHead>
                    <TableHead>Vigente desde</TableHead>
                    <TableHead>Vigente hasta</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tarifas.map((tarifa) => {
                    const esVigente =
                      new Date(tarifa.vigente_desde) <= new Date() &&
                      (!tarifa.vigente_hasta || new Date(tarifa.vigente_hasta) >= new Date());
                    return (
                      <TableRow key={tarifa.id}>
                        <TableCell className="font-mono text-sm">
                          {tarifa.servicio_id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {tarifa.precio_tarifado.toFixed(2)} XAF
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {tarifa.porcentaje_cobertura}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(tarifa.vigente_desde).toLocaleDateString(
                            'es-ES'
                          )}
                        </TableCell>
                        <TableCell>
                          {tarifa.vigente_hasta
                            ? new Date(tarifa.vigente_hasta).toLocaleDateString(
                                'es-ES'
                              )
                            : 'Indefinido'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={esVigente ? 'default' : 'secondary'}
                          >
                            {esVigente ? 'Vigente' : 'Vencida'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Formulario
const AseguradoraForm: React.FC<{
  aseguradora: Aseguradora | null;
  onSave: (data: Partial<Aseguradora>) => void;
  onClose: () => void;
}> = ({ aseguradora, onSave, onClose }) => {
  const [form, setForm] = useState<Partial<Aseguradora>>(
    aseguradora || {
      codigo: '',
      nombre: '',
      tipo: 'privada',
      activo: true,
    }
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Código</label>
        <Input
          value={form.codigo || ''}
          onChange={(e) => setForm({ ...form, codigo: e.target.value })}
          placeholder="p.ej. IESS"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Nombre</label>
        <Input
          value={form.nombre || ''}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          placeholder="Nombre completo de la aseguradora"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Tipo</label>
        <Select
          value={form.tipo || 'privada'}
          onValueChange={(value) => setForm({ ...form, tipo: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="publica">Pública</SelectItem>
            <SelectItem value="privada">Privada</SelectItem>
            <SelectItem value="mutual">Mutual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium">Email</label>
        <Input
          type="email"
          value={form.email || ''}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="contacto@aseguradora.com"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Teléfono</label>
        <Input
          value={form.telefono || ''}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          placeholder="+240-XXX-XXX-XXX"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Dirección</label>
        <Input
          value={form.direccion || ''}
          onChange={(e) => setForm({ ...form, direccion: e.target.value })}
          placeholder="Dirección física"
        />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={() => onSave(form)}>Guardar</Button>
      </div>
    </div>
  );
};

export default AseguradorasManagerMejorado;

