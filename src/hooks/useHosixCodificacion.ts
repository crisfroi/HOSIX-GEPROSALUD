import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/app/supabase';
import { useToast } from '@/components/ui/use-toast';

export interface CodigoCIE {
  id: string;
  version: 'CIE-10' | 'CIE-11';
  codigo: string;
  descripcion: string;
  descripcion_corta?: string;
  grupo_principal?: string;
  subcategoria?: string;
  letra_inicial?: string;
  es_primaria: boolean;
  mapeo_cie10?: string;
  mapeo_cie11?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProcedimientoMedico {
  id: string;
  codigo_procedimiento: string;
  descripcion: string;
  especialidad?: string;
  area_quirurgica?: string;
  requiere_autorizacion: boolean;
  tiempo_estimado_min?: number;
  requiere_preparacion?: string;
  requiere_ayuno?: boolean;
  requiere_acompañante?: boolean;
  contraindicaciones?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MapeoEquivalencia {
  id: string;
  codigo_cie10: string;
  codigo_cie11: string;
  descripcion_mapeo?: string;
  similitud_porcentaje?: number;
  validado_por?: string;
  created_at?: string;
}

export const useHosixCodificacion = () => {
  const [codigosCIE, setCodigosCIE] = useState<CodigoCIE[]>([]);
  const [procedimientos, setProcedimientos] = useState<ProcedimientoMedico[]>([]);
  const [mapeos, setMapeos] = useState<MapeoEquivalencia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [versionActiva, setVersionActiva] = useState<'CIE-10' | 'CIE-11'>('CIE-11');
  const { toast } = useToast();

  // Cargar códigos CIE por versión
  const loadCodigosCIE = useCallback(async (version?: 'CIE-10' | 'CIE-11') => {
    try {
      setIsLoading(true);
      setError(null);

      const versionFiltro = version || versionActiva;

      const { data, error: err } = await supabase
        .from('hosix_codigos_cie')
        .select('*')
        .eq('version', versionFiltro)
        .eq('activo', true)
        .order('codigo', { ascending: true });

      if (err) throw err;
      setCodigosCIE(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar códigos CIE';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [versionActiva, toast]);

  // Buscar código CIE
  const buscarCodigoCIE = useCallback(async (termino: string, version?: 'CIE-10' | 'CIE-11') => {
    try {
      setIsLoading(true);
      setError(null);

      const versionFiltro = version || versionActiva;
      const terminoLower = termino.toLowerCase();

      const { data, error: err } = await supabase
        .from('hosix_codigos_cie')
        .select('*')
        .eq('version', versionFiltro)
        .eq('activo', true)
        .or(
          `codigo.ilike.%${terminoLower}%,descripcion.ilike.%${terminoLower}%`
        )
        .limit(20);

      if (err) throw err;
      return data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al buscar código';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [versionActiva, toast]);

  // Cargar procedimientos
  const loadProcedimientos = useCallback(async (especialidad?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('hosix_procedimientos_medicos')
        .select('*')
        .eq('activo', true)
        .order('descripcion', { ascending: true });

      if (especialidad) {
        query = query.eq('especialidad', especialidad);
      }

      const { data, error: err } = await query;

      if (err) throw err;
      setProcedimientos(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar procedimientos';
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

  // Buscar procedimiento
  const buscarProcedimiento = useCallback(async (termino: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const terminoLower = termino.toLowerCase();

      const { data, error: err } = await supabase
        .from('hosix_procedimientos_medicos')
        .select('*')
        .eq('activo', true)
        .or(
          `codigo_procedimiento.ilike.%${terminoLower}%,descripcion.ilike.%${terminoLower}%`
        )
        .limit(20);

      if (err) throw err;
      return data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al buscar procedimiento';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Cargar mapeos CIE-10 a CIE-11
  const loadMapeos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('hosix_mapeos_cie')
        .select('*')
        .order('codigo_cie10', { ascending: true });

      if (err) throw err;
      setMapeos(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar mapeos';
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

  // Crear código CIE
  const crearCodigoCIE = useCallback(async (data: Omit<CodigoCIE, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);

      const { data: newCodigo, error: err } = await supabase
        .from('hosix_codigos_cie')
        .insert([data])
        .select()
        .single();

      if (err) throw err;

      setCodigosCIE(prev => [...prev, newCodigo]);
      toast({
        title: 'Éxito',
        description: `Código ${data.codigo} creado`
      });

      return newCodigo;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear código';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
      throw err;
    }
  }, [toast]);

  // Crear procedimiento
  const crearProcedimiento = useCallback(async (data: Omit<ProcedimientoMedico, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);

      const { data: newProcedimiento, error: err } = await supabase
        .from('hosix_procedimientos_medicos')
        .insert([data])
        .select()
        .single();

      if (err) throw err;

      setProcedimientos(prev => [...prev, newProcedimiento]);
      toast({
        title: 'Éxito',
        description: `Procedimiento "${data.descripcion}" creado`
      });

      return newProcedimiento;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear procedimiento';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
      throw err;
    }
  }, [toast]);

  // Crear mapeo
  const crearMapeo = useCallback(async (data: Omit<MapeoEquivalencia, 'id' | 'created_at'>) => {
    try {
      setError(null);

      const { data: newMapeo, error: err } = await supabase
        .from('hosix_mapeos_cie')
        .insert([data])
        .select()
        .single();

      if (err) throw err;

      setMapeos(prev => [...prev, newMapeo]);
      toast({
        title: 'Éxito',
        description: `Mapeo ${data.codigo_cie10} → ${data.codigo_cie11} creado`
      });

      return newMapeo;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear mapeo';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
      throw err;
    }
  }, [toast]);

  // Obtener equivalencia CIE-11 para un código CIE-10
  const getEquivalenciaCIE11 = useCallback(async (codigoCIE10: string) => {
    try {
      const { data, error: err } = await supabase
        .from('hosix_mapeos_cie')
        .select('codigo_cie11')
        .eq('codigo_cie10', codigoCIE10)
        .single();

      if (err) {
        console.warn(`No hay mapeo para ${codigoCIE10}`);
        return null;
      }

      return data?.codigo_cie11 || null;
    } catch (err) {
      console.error('Error buscando equivalencia:', err);
      return null;
    }
  }, []);

  // Cargar automáticamente al montar
  useEffect(() => {
    loadCodigosCIE();
    loadProcedimientos();
    loadMapeos();
  }, [loadCodigosCIE, loadProcedimientos, loadMapeos]);

  return {
    // Estados
    codigosCIE,
    procedimientos,
    mapeos,
    isLoading,
    error,
    versionActiva,
    
    // Funciones
    setVersionActiva,
    loadCodigosCIE,
    buscarCodigoCIE,
    loadProcedimientos,
    buscarProcedimiento,
    loadMapeos,
    crearCodigoCIE,
    crearProcedimiento,
    crearMapeo,
    getEquivalenciaCIE11
  };
};
