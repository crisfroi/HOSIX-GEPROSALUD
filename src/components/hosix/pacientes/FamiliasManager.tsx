import React, { useEffect, useState } from 'react';
import { useHosixPacientes } from '@/hooks/useHosixPacientes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface FamiliasManagerProps {
  pacienteId?: string;
}

export default function FamiliasManager({ pacienteId }: FamiliasManagerProps) {
  const { listarFamilias, crearFamilia, asignarFamiliaPaciente } = useHosixPacientes();
  const [familias, setFamilias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const [familiaSeleccionada, setFamiliaSeleccionada] = useState<string>('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await listarFamilias();
      setFamilias(data || []);
      if (!data || data.length === 0) {
        toast.info('No se encontraron familias. Puede que haga falta ejecutar una migración.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al listar familias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCrear = async () => {
    if (!form.nombre) {
      toast.error('Nombre es requerido');
      return;
    }
    try {
      const newF = await crearFamilia(form as any);
      toast.success('Familia creada');
      setForm({ nombre: '', descripcion: '' });
      load();
    } catch (err: any) {
      if (err.message && err.message.includes('MIGRATION_REQUIRED')) {
        toast.error('La tabla hosix_familias no existe en la BD. Crear migración.');
      } else {
        toast.error(err.message || 'Error al crear familia');
      }
    }
  };

  const handleAsignarFamilia = async () => {
    if (!pacienteId) {
      toast.error('Seleccione un paciente antes de asignar una familia');
      return;
    }

    if (!familiaSeleccionada) {
      toast.error('Seleccione una familia válida');
      return;
    }

    try {
      await asignarFamiliaPaciente({ paciente_id: pacienteId, familia_id: familiaSeleccionada });
      toast.success('Familia asignada al paciente');
    } catch (err: any) {
      if (err.message?.includes('MIGRATION_REQUIRED')) {
        toast.error('Hace falta migración para familia_id en hosix_pacientes');
      } else {
        toast.error(err.message || 'Error al asignar familia');
      }
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Familias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Input placeholder="Nombre de la familia" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            <Input placeholder="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCrear}>Crear Familia</Button>
            <Button variant="outline" onClick={load}>Refrescar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asignar Paciente a Familia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {!pacienteId ? (
              <div className="text-sm text-slate-600">
                Seleccione un paciente primero para poder asignarlo a una familia.
              </div>
            ) : (
              <>
                <div className="text-sm text-slate-700">Paciente seleccionado: {pacienteId}</div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div>
                    <Label htmlFor="familia-select">Familia</Label>
                    <Select id="familia-select" value={familiaSeleccionada} onValueChange={setFamiliaSeleccionada}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione familia" />
                      </SelectTrigger>
                      <SelectContent>
                        {familias.map((familia) => (
                          <SelectItem key={familia.id} value={familia.id}>
                            {familia.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAsignarFamilia} disabled={!familiaSeleccionada}>
                    Asignar familia
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Familias Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Cargando...</div>
          ) : familias.length === 0 ? (
            <div>No hay familias registradas</div>
          ) : (
            <ul className="list-disc pl-6">
              {familias.map((f) => (
                <li key={f.id}>{f.nombre} - {f.descripcion}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

