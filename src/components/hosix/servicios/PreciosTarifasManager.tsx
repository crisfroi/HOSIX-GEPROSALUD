import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, TrendingUp } from 'lucide-react';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { supabase } from '@/app/supabase';

interface ServicioProducto {
  id: string;
  nombre: string;
  codigo: string;
  tipo: string;
}

interface PrecioServicio {
  id: string;
  servicio_id: string;
  hospital_id: string;
  precio_base: number;
  precio_hospital: number;
  vigente_desde: string;
  vigente_hasta?: string;
  activo: boolean;
}

interface TarifaAseguradora {
  id: string;
  servicio_id: string;
  aseguradora_id: string;
  precio_tarifado: number;
  porcentaje_cobertura: number;
  vigente_desde: string;
  vigente_hasta?: string;
}

export const PreciosTarifasManager: React.FC = () => {
  const [selectedServicio, setSelectedServicio] = useState<string>('');
  const [selectedHospital, setSelectedHospital] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Queries
  const { data: servicios = [], isLoading: loadingServicios } = useQuery({
    queryKey: ['servicios-para-precios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_servicios_productos')
        .select('id, nombre, codigo, tipo')
        .eq('activo', true);
      if (error) throw error;
      return data as ServicioProducto[];
    },
  });

  const { data: hospitales = [] } = useQuery({
    queryKey: ['hospitales-para-precios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_hospitales')
        .select('id, nombre, codigo')
        .eq('activo', true);
      if (error) throw error;
      return data;
    },
  });

  const { data: precios = [] } = useQuery({
    queryKey: ['precios-servicios-detalle', selectedServicio, selectedHospital],
    queryFn: async () => {
      let query = supabase.from('hosix_precios_servicio').select('*');
      if (selectedServicio) {
        query = query.eq('servicio_id', selectedServicio);
      }
      if (selectedHospital) {
        query = query.eq('hospital_id', selectedHospital);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as PrecioServicio[];
    },
    enabled: !!selectedServicio || !!selectedHospital,
  });

  const { data: tarifas = [] } = useQuery({
    queryKey: ['tarifas-aseguradoras', selectedServicio],
    queryFn: async () => {
      if (!selectedServicio) return [];
      const { data, error } = await supabase
        .from('hosix_tarifas_aseguradora_servicio')
        .select('*')
        .eq('servicio_id', selectedServicio);
      if (error) throw error;
      return data as TarifaAseguradora[];
    },
    enabled: !!selectedServicio,
  });

  const { data: aseguradoras = [] } = useQuery({
    queryKey: ['aseguradoras-para-tarifas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_aseguradoras')
        .select('id, nombre, codigo')
        .eq('activo', true);
      if (error) throw error;
      return data;
    },
  });

  // Mutations
  const deletePrecioMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('hosix_precios_servicio')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['precios-servicios-detalle'],
      });
    },
  });

  const deleteTarifaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('hosix_tarifas_aseguradora_servicio')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tarifas-aseguradoras'],
      });
    },
  });

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <TrendingUp className="w-6 h-6" />
        Precios y Tarifas
      </h2>

      <Tabs defaultValue="precios" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="precios">Precios por Hospital</TabsTrigger>
          <TabsTrigger value="tarifas">Tarifas por Aseguradora</TabsTrigger>
        </TabsList>

        {/* =============== TAB: PRECIOS POR HOSPITAL =============== */}
        <TabsContent value="precios" className="space-y-4 mt-4">
          <div className="flex gap-3">
            <Select value={selectedServicio} onValueChange={setSelectedServicio}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Seleccionar servicio..." />
              </SelectTrigger>
              <SelectContent>
                {servicios.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nombre} ({s.codigo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedHospital} onValueChange={setSelectedHospital}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Seleccionar hospital..." />
              </SelectTrigger>
              <SelectContent>
                {hospitales.map((h: any) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Nuevo Precio
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Precio</DialogTitle>
                </DialogHeader>
                <PrecioForm
                  servicios={servicios}
                  hospitales={hospitales}
                  onClose={() => setIsDialogOpen(false)}
                  onSuccess={() => {
                    setIsDialogOpen(false);
                    queryClient.invalidateQueries({
                      queryKey: ['precios-servicios-detalle'],
                    });
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          {precios.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No hay precios registrados. Selecciona un servicio o hospital.
            </div>
          ) : (
            <div className="grid gap-3">
              {precios.map((precio) => (
                <Card key={precio.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="font-semibold">
                          Precio: {precio.precio_hospital.toFixed(2)} XAF
                        </p>
                        <p className="text-sm text-slate-600">
                          Base: {precio.precio_base.toFixed(2)} XAF
                        </p>
                        <p className="text-xs text-slate-500">
                          Vigente desde: {new Date(precio.vigente_desde).toLocaleDateString('es-ES')}
                          {precio.vigente_hasta &&
                            ` hasta ${new Date(precio.vigente_hasta).toLocaleDateString('es-ES')}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePrecioMutation.mutate(precio.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* =============== TAB: TARIFAS POR ASEGURADORA =============== */}
        <TabsContent value="tarifas" className="space-y-4 mt-4">
          <div className="flex gap-3">
            <Select value={selectedServicio} onValueChange={setSelectedServicio}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Seleccionar servicio..." />
              </SelectTrigger>
              <SelectContent>
                {servicios.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nombre} ({s.codigo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Nueva Tarifa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar Tarifa de Aseguradora</DialogTitle>
                </DialogHeader>
                <TarifaForm
                  servicioId={selectedServicio}
                  aseguradoras={aseguradoras}
                  onClose={() => setIsDialogOpen(false)}
                  onSuccess={() => {
                    setIsDialogOpen(false);
                    queryClient.invalidateQueries({
                      queryKey: ['tarifas-aseguradoras'],
                    });
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          {tarifas.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No hay tarifas registradas. Selecciona un servicio.
            </div>
          ) : (
            <div className="grid gap-3">
              {tarifas.map((tarifa) => (
                <Card key={tarifa.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-semibold">
                          Aseguradora ID: {tarifa.aseguradora_id}
                        </p>
                        <p className="text-sm">
                          Precio: {tarifa.precio_tarifado.toFixed(2)} XAF
                        </p>
                        <p className="text-sm text-slate-600">
                          Cobertura: {tarifa.porcentaje_cobertura}%
                        </p>
                        <p className="text-xs text-slate-500">
                          Vigente desde: {new Date(tarifa.vigente_desde).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTarifaMutation.mutate(tarifa.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Formularios
const PrecioForm: React.FC<{
  servicios: ServicioProducto[];
  hospitales: any[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ servicios, hospitales, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    servicio_id: '',
    hospital_id: '',
    precio_base: '',
    precio_hospital: '',
    vigente_desde: new Date().toISOString().split('T')[0],
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('hosix_precios_servicio').insert([
        {
          ...form,
          precio_base: parseFloat(form.precio_base),
          precio_hospital: parseFloat(form.precio_hospital),
          activo: true,
        },
      ]);
      if (error) throw error;
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Select value={form.servicio_id} onValueChange={(v) => setForm({ ...form, servicio_id: v })}>
        <SelectTrigger>
          <SelectValue placeholder="Servicio" />
        </SelectTrigger>
        <SelectContent>
          {servicios.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={form.hospital_id} onValueChange={(v) => setForm({ ...form, hospital_id: v })}>
        <SelectTrigger>
          <SelectValue placeholder="Hospital" />
        </SelectTrigger>
        <SelectContent>
          {hospitales.map((h: any) => (
            <SelectItem key={h.id} value={h.id}>
              {h.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="number"
        placeholder="Precio Base (XAF)"
        value={form.precio_base}
        onChange={(e) => setForm({ ...form, precio_base: e.target.value })}
      />

      <Input
        type="number"
        placeholder="Precio Hospital (XAF)"
        value={form.precio_hospital}
        onChange={(e) => setForm({ ...form, precio_hospital: e.target.value })}
      />

      <Input
        type="date"
        value={form.vigente_desde}
        onChange={(e) => setForm({ ...form, vigente_desde: e.target.value })}
      />

      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          Guardar
        </Button>
      </div>
    </div>
  );
};

const TarifaForm: React.FC<{
  servicioId: string;
  aseguradoras: any[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ servicioId, aseguradoras, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    aseguradora_id: '',
    precio_tarifado: '',
    porcentaje_cobertura: '100',
    vigente_desde: new Date().toISOString().split('T')[0],
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('hosix_tarifas_aseguradora_servicio').insert([
        {
          servicio_id: servicioId,
          ...form,
          precio_tarifado: parseFloat(form.precio_tarifado),
          porcentaje_cobertura: parseFloat(form.porcentaje_cobertura),
        },
      ]);
      if (error) throw error;
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Select value={form.aseguradora_id} onValueChange={(v) => setForm({ ...form, aseguradora_id: v })}>
        <SelectTrigger>
          <SelectValue placeholder="Aseguradora" />
        </SelectTrigger>
        <SelectContent>
          {aseguradoras.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="number"
        placeholder="Precio Tarifado (XAF)"
        value={form.precio_tarifado}
        onChange={(e) => setForm({ ...form, precio_tarifado: e.target.value })}
      />

      <Input
        type="number"
        placeholder="% Cobertura"
        value={form.porcentaje_cobertura}
        onChange={(e) => setForm({ ...form, porcentaje_cobertura: e.target.value })}
        min="0"
        max="100"
      />

      <Input
        type="date"
        value={form.vigente_desde}
        onChange={(e) => setForm({ ...form, vigente_desde: e.target.value })}
      />

      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          Guardar
        </Button>
      </div>
    </div>
  );
};

export default PreciosTarifasManager;

