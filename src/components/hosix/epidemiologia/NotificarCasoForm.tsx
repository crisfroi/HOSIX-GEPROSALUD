import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useHosixEpidemiologia } from '@/hooks/useHosixEpidemiologia';

interface FormValues {
  paciente_id: string;
  enfermedad_id: string;
  numero_caso: string;
  fecha_sintomas: string;
  tipo_caso: string;
  lugar_contagio: string;
  sintomas: string;
  severidad: string;
}

export const NotificarCasoForm: React.FC = () => {
  const { enfermedades, isLoadingEnfermedades, crearCaso } = useHosixEpidemiologia();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    defaultValues: {
      numero_caso: `CASO-${Date.now()}`,
      fecha_sintomas: new Date().toISOString().slice(0, 10),
      tipo_caso: 'autoctono',
      lugar_contagio: '',
      sintomas: '',
      severidad: 'moderada',
      paciente_id: '',
      enfermedad_id: '',
    },
  });

  const enfermedadSeleccionada = watch('enfermedad_id');

  useEffect(() => {
    if (!enfermedadSeleccionada && enfermedades.length > 0) {
      reset((values) => ({ ...values, enfermedad_id: enfermedades[0].id }));
    }
  }, [enfermedadSeleccionada, enfermedades, reset]);

  const onSubmit = async (formData: FormValues) => {
    try {
      await crearCaso.mutateAsync({
        paciente_id: formData.paciente_id,
        enfermedad_id: formData.enfermedad_id,
        numero_caso: formData.numero_caso,
        fecha_sintomas: new Date(formData.fecha_sintomas).toISOString(),
        tipo_caso: formData.tipo_caso,
        lugar_contagio: formData.lugar_contagio,
        sintomas: formData.sintomas
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        severidad: formData.severidad,
      });

      toast({
        title: 'Caso notificado',
        description: 'El caso epidemiológico se ha registrado correctamente.',
      });
      reset();
    } catch (error: any) {
      toast({
        title: 'Error al notificar caso',
        description: error?.message || 'Revisa los datos y vuelve a intentar.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificar Caso Epidemiológico</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <Label htmlFor="numero_caso">Número de caso</Label>
              <Input id="numero_caso" {...register('numero_caso', { required: true })} />
              {errors.numero_caso && <p className="text-sm text-red-600">Campo requerido</p>}
            </div>
            <div>
              <Label htmlFor="fecha_sintomas">Fecha de síntomas</Label>
              <Input id="fecha_sintomas" type="date" {...register('fecha_sintomas', { required: true })} />
              {errors.fecha_sintomas && <p className="text-sm text-red-600">Campo requerido</p>}
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <Label htmlFor="paciente_id">Paciente ID</Label>
              <Input id="paciente_id" {...register('paciente_id', { required: true })} />
              {errors.paciente_id && <p className="text-sm text-red-600">Campo requerido</p>}
            </div>
            <div>
              <Label htmlFor="enfermedad_id">Enfermedad</Label>
              <select
                id="enfermedad_id"
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                {...register('enfermedad_id', { required: true })}
              >
                {isLoadingEnfermedades ? (
                  <option value="">Cargando...</option>
                ) : (
                  enfermedades.map((enfermedad) => (
                    <option key={enfermedad.id} value={enfermedad.id}>
                      {enfermedad.nombre} ({enfermedad.codigo_cie10})
                    </option>
                  ))
                )}
              </select>
              {errors.enfermedad_id && <p className="text-sm text-red-600">Campo requerido</p>}
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <Label htmlFor="tipo_caso">Tipo de caso</Label>
              <select
                id="tipo_caso"
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                {...register('tipo_caso', { required: true })}
              >
                <option value="autoctono">Autóctono</option>
                <option value="importado">Importado</option>
                <option value="asociado_viaje">Asociado a viaje</option>
              </select>
            </div>
            <div>
              <Label htmlFor="severidad">Severidad</Label>
              <select
                id="severidad"
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                {...register('severidad', { required: true })}
              >
                <option value="leve">Leve</option>
                <option value="moderada">Moderada</option>
                <option value="severa">Severa</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="lugar_contagio">Lugar de contagio</Label>
            <Input id="lugar_contagio" {...register('lugar_contagio')} />
          </div>

          <div>
            <Label htmlFor="sintomas">Síntomas (separados por coma)</Label>
            <Textarea id="sintomas" rows={4} {...register('sintomas')} />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Registrar caso'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
