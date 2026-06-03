import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/app/supabase';
import { useToast } from '@/components/ui/use-toast';

export interface Departamento {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  jefe_departamento_id?: string;
  servicios_count?: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DepartamentoDetalle extends Departamento {
  servicios?: Array<{
    id: string;
    nombre: string;
    codigo: string;
  }>;
}

export const useHosixDepartamentos = () => {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Cargar todos los departamentos
  const loadDepartamentos = useCallback(async (filtroActivos = true) => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('hosix_departamentos')
        .select('*')
        .order('nombre', { ascending: true });

      if (filtroActivos) {
        query = query.eq('activo', true);
      }

      const { data, error: err } = await query;

      if (err) throw err;
      setDepartamentos(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar departamentos';
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

  // Cargar departamento con detalles
  const loadDepartamentoDetalle = useCallback(async (id: string): Promise<DepartamentoDetalle | null> => {
    try {
      const { data, error: err } = await supabase
        .from('hosix_departamentos')
        .select(`
          *,
          servicios:hosix_servicios(id, nombre, codigo)
        `)
        .eq('id', id)
        .single();

      if (err) throw err;
      return data as DepartamentoDetalle;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar detalles';
      console.error('Error:', err);
      return null;
    }
  }, []);

  // Crear nuevo departamento
  const crearDepartamento = useCallback(async (data: Omit<Departamento, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);

      // Validar que el código sea único
      const { data: existente } = await supabase
        .from('hosix_departamentos')
        .select('id')
        .eq('codigo', data.codigo)
        .single();

      if (existente) {
        throw new Error('El código de departamento ya existe');
      }

      const { data: newDept, error: err } = await supabase
        .from('hosix_departamentos')
        .insert([data])
        .select()
        .single();

      if (err) throw err;

      setDepartamentos(prev => [...prev, newDept]);
      toast({
        title: 'Éxito',
        description: `Departamento "${data.nombre}" creado`
      });

      return newDept as Departamento;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear departamento';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
      throw err;
    }
  }, [toast]);

  // Actualizar departamento
  const actualizarDepartamento = useCallback(async (id: string, data: Partial<Departamento>) => {
    try {
      setError(null);

      const { data: updated, error: err } = await supabase
        .from('hosix_departamentos')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (err) throw err;

      setDepartamentos(prev =>
        prev.map(d => d.id === id ? updated : d)
      );

      toast({
        title: 'Éxito',
        description: 'Departamento actualizado'
      });

      return updated as Departamento;
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

  // Eliminar (desactivar) departamento
  const eliminarDepartamento = useCallback(async (id: string) => {
    try {
      setError(null);

      const { error: err } = await supabase
        .from('hosix_departamentos')
        .update({ activo: false })
        .eq('id', id);

      if (err) throw err;

      setDepartamentos(prev => prev.filter(d => d.id !== id));
      toast({
        title: 'Éxito',
        description: 'Departamento eliminado'
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

  // Cargar automáticamente al montar
  useEffect(() => {
    loadDepartamentos();
  }, [loadDepartamentos]);

  return {
    departamentos,
    isLoading,
    error,
    loadDepartamentos,
    loadDepartamentoDetalle,
    crearDepartamento,
    actualizarDepartamento,
    eliminarDepartamento
  };
};
