import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/app/supabase';
import { useToast } from '@/components/ui/use-toast';

export interface EquipoMedico {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  departamento_id?: string;
  jefe_equipo_id?: string;
  miembros_count?: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MiembroEquipo {
  id: string;
  equipo_id: string;
  medico_id: string;
  rol: 'jefe' | 'miembro' | 'consultor';
  desde?: string;
  hasta?: string;
  activo: boolean;
  medico?: {
    id: string;
    nombre: string;
    apellido: string;
    especialidad?: string;
  };
}

export interface EquipoMedicoDetalle extends EquipoMedico {
  miembros?: MiembroEquipo[];
  departamento?: {
    id: string;
    nombre: string;
  };
}

export const useHosixEquipos = () => {
  const [equipos, setEquipos] = useState<EquipoMedico[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Cargar todos los equipos médicos
  const loadEquipos = useCallback(async (filtroActivos = true) => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('hosix_equipos_medicos')
        .select('*')
        .order('nombre', { ascending: true });

      if (filtroActivos) {
        query = query.eq('activo', true);
      }

      const { data, error: err } = await query;

      if (err) throw err;
      setEquipos(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar equipos';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Cargar equipo con detalles y miembros
  const loadEquipoDetalle = useCallback(async (id: string): Promise<EquipoMedicoDetalle | null> => {
    try {
      const { data, error: err } = await supabase
        .from('hosix_equipos_medicos')
        .select(`
          *,
          miembros:hosix_miembros_equipo(
            id,
            equipo_id,
            medico_id,
            rol,
            desde,
            hasta,
            activo,
            medico:hosix_medicos(id, nombre, apellido, especialidad)
          ),
          departamento:hosix_departamentos(id, nombre)
        `)
        .eq('id', id)
        .single();

      if (err) throw err;
      return data as EquipoMedicoDetalle;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar detalles';
      console.error('Error:', err);
      return null;
    }
  }, []);

  // Crear nuevo equipo médico
  const crearEquipo = useCallback(async (data: Omit<EquipoMedico, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);

      // Validar que el código sea único
      const { data: existente } = await supabase
        .from('hosix_equipos_medicos')
        .select('id')
        .eq('codigo', data.codigo)
        .single();

      if (existente) {
        throw new Error('El código de equipo ya existe');
      }

      const { data: newEquipo, error: err } = await supabase
        .from('hosix_equipos_medicos')
        .insert([data])
        .select()
        .single();

      if (err) throw err;

      setEquipos(prev => [...prev, newEquipo]);
      toast({
        title: 'Éxito',
        description: `Equipo "${data.nombre}" creado`
      });

      return newEquipo as EquipoMedico;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear equipo';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
      throw err;
    }
  }, [toast]);

  // Actualizar equipo médico
  const actualizarEquipo = useCallback(async (id: string, data: Partial<EquipoMedico>) => {
    try {
      setError(null);

      const { data: updated, error: err } = await supabase
        .from('hosix_equipos_medicos')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (err) throw err;

      setEquipos(prev =>
        prev.map(e => e.id === id ? updated : e)
      );

      toast({
        title: 'Éxito',
        description: 'Equipo actualizado'
      });

      return updated as EquipoMedico;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
      throw err;
    }
  }, [toast]);

  // Eliminar (desactivar) equipo
  const eliminarEquipo = useCallback(async (id: string) => {
    try {
      setError(null);

      const { error: err } = await supabase
        .from('hosix_equipos_medicos')
        .update({ activo: false })
        .eq('id', id);

      if (err) throw err;

      setEquipos(prev => prev.filter(e => e.id !== id));
      toast({
        title: 'Éxito',
        description: 'Equipo eliminado'
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
      throw err;
    }
  }, [toast]);

  // Agregar miembro al equipo
  const agregarMiembro = useCallback(async (equipoId: string, medicoId: string, rol: 'jefe' | 'miembro' | 'consultor') => {
    try {
      setError(null);

      const { data, error: err } = await supabase
        .from('hosix_miembros_equipo')
        .insert([{
          equipo_id: equipoId,
          medico_id: medicoId,
          rol,
          activo: true
        }])
        .select()
        .single();

      if (err) throw err;

      toast({
        title: 'Éxito',
        description: `Médico agregado al equipo como ${rol}`
      });

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al agregar miembro';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
      throw err;
    }
  }, [toast]);

  // Eliminar miembro del equipo
  const eliminarMiembro = useCallback(async (miembroId: string) => {
    try {
      setError(null);

      const { error: err } = await supabase
        .from('hosix_miembros_equipo')
        .delete()
        .eq('id', miembroId);

      if (err) throw err;

      toast({
        title: 'Éxito',
        description: 'Miembro removido del equipo'
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al remover miembro';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
      throw err;
    }
  }, [toast]);

  // Cargar automáticamente al montar
  useEffect(() => {
    loadEquipos();
  }, [loadEquipos]);

  return {
    equipos,
    isLoading,
    error,
    loadEquipos,
    loadEquipoDetalle,
    crearEquipo,
    actualizarEquipo,
    eliminarEquipo,
    agregarMiembro,
    eliminarMiembro
  };
};
