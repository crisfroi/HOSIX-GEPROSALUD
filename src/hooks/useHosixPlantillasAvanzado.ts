import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/hosixClient';
import { z } from 'zod';
import { toast } from 'sonner';

// ============================================================================
// ESQUEMAS ZOD
// ============================================================================

export const CampoSchema = z.object({
  id: z.string().optional(),
  plantilla_id: z.string(),
  codigo: z.string().min(3, 'Código requerido'),
  nombre: z.string().min(3, 'Nombre requerido'),
  tipo: z.enum(['text', 'number', 'date', 'select', 'checkbox', 'signature', 'table']),
  requerido: z.boolean().default(false),
  valor_defecto: z.string().optional(),
  ayuda_texto: z.string().optional(),
  validacion_regex: z.string().optional(),
  valores_select: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  ancho: z.enum(['full', 'half', 'third']).default('full'),
  visible_en_exportacion: z.boolean().default(true),
  posicion: z.number().default(0),
});

export const PlantillaSchema = z.object({
  id: z.string().optional(),
  codigo: z.string().min(5, 'Código requerido'),
  nombre: z.string().min(10, 'Nombre requerido'),
  tipo: z.enum(['informe_alta', 'urgencias', 'consulta', 'quirurgico', 'receta', 'laboratorio', 'certificado', 'consentimiento', 'administrativo', 'control', 'bi']),
  grupo: z.enum(['medico', 'legal', 'financiero', 'control', 'bi']),
  descripcion: z.string().optional(),
  contenido_html: z.string().min(20, 'Contenido requerido'),
  campos: z.array(CampoSchema).optional(),
  export_pdf: z.boolean().default(true),
  export_docx: z.boolean().default(false),
  export_xml: z.boolean().default(false),
  requiere_firma: z.boolean().default(false),
  activo: z.boolean().default(true),
});

export const DocumentoSchema = z.object({
  id: z.string().optional(),
  plantilla_id: z.string(),
  paciente_id: z.string().optional(),
  episodio_id: z.string().optional(),
  nombre_documento: z.string(),
  tipo_documento: z.enum(['pdf', 'docx', 'xml']).default('pdf'),
  datos_json: z.record(z.any()).optional(),
  estado: z.enum(['borrador', 'generado', 'firmado', 'archivado']).default('borrador'),
});

// ============================================================================
// INTERFACES
// ============================================================================

export interface Campo {
  id?: string;
  plantilla_id: string;
  codigo: string;
  nombre: string;
  tipo: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'signature' | 'table';
  requerido: boolean;
  valor_defecto?: string;
  ayuda_texto?: string;
  validacion_regex?: string;
  valores_select?: { label: string; value: string }[];
  ancho: 'full' | 'half' | 'third';
  visible_en_exportacion: boolean;
  posicion: number;
}

export interface Plantilla {
  id?: string;
  codigo: string;
  nombre: string;
  tipo: string;
  grupo: 'medico' | 'legal' | 'financiero' | 'control' | 'bi';
  descripcion?: string;
  contenido_html: string;
  campos?: Campo[];
  export_pdf: boolean;
  export_docx: boolean;
  export_xml: boolean;
  requiere_firma: boolean;
  version: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Documento {
  id?: string;
  plantilla_id: string;
  paciente_id?: string;
  episodio_id?: string;
  nombre_documento: string;
  tipo_documento: 'pdf' | 'docx' | 'xml';
  contenido_final?: string;
  datos_json?: Record<string, any>;
  estado: 'borrador' | 'generado' | 'firmado' | 'archivado';
  pdf_url?: string;
  hash_documento?: string;
  created_at?: string;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useHosixPlantillasAvanzado() {
  const queryClient = useQueryClient();
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // ========== PLANTILLAS ==========

  const { data: plantillas = [], isLoading: isLoadingPlantillas } = useQuery({
    queryKey: ['plantillas', 'completas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plantillas_documentos')
        .select(`
          *,
          campos:plantillas_campos(*)
        `)
        .eq('activo', true)
        .order('nombre');
      
      if (error) throw error;
      return data as Plantilla[];
    },
  });

  const crearPlantilla = useMutation({
    mutationFn: async (plantilla: z.infer<typeof PlantillaSchema>) => {
      // Validar
      const validation = PlantillaSchema.safeParse(plantilla);
      if (!validation.success) {
        const errors: Record<string, string> = {};
        validation.error.errors.forEach((err) => {
          errors[err.path.join('.')] = err.message;
        });
        setValidationErrors(errors);
        throw new Error('Validación fallida');
      }

      const { data, error } = await supabase
        .from('plantillas_documentos')
        .insert([validation.data])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantillas'] });
      setValidationErrors({});
      toast.success('Plantilla creada');
    },
    onError: (error) => {
      toast.error('Error al crear plantilla');
      console.error(error);
    },
  });

  const actualizarPlantilla = useMutation({
    mutationFn: async (plantilla: Plantilla) => {
      const validation = PlantillaSchema.safeParse(plantilla);
      if (!validation.success) {
        const errors: Record<string, string> = {};
        validation.error.errors.forEach((err) => {
          errors[err.path.join('.')] = err.message;
        });
        setValidationErrors(errors);
        throw new Error('Validación fallida');
      }

      const { data, error } = await supabase
        .from('plantillas_documentos')
        .update(validation.data)
        .eq('id', plantilla.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantillas'] });
      setValidationErrors({});
      toast.success('Plantilla actualizada');
    },
    onError: (error) => {
      toast.error('Error al actualizar plantilla');
      console.error(error);
    },
  });

  // ========== CAMPOS ==========

  const agregarCampo = useMutation({
    mutationFn: async (campo: Campo) => {
      const validation = CampoSchema.safeParse(campo);
      if (!validation.success) {
        throw new Error('Validación de campo fallida');
      }

      const { data, error } = await supabase
        .from('plantillas_campos')
        .insert([validation.data])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantillas'] });
      toast.success('Campo agregado');
    },
  });

  const actualizarCampo = useMutation({
    mutationFn: async (campo: Campo) => {
      const validation = CampoSchema.safeParse(campo);
      if (!validation.success) throw new Error('Validación fallida');

      const { data, error } = await supabase
        .from('plantillas_campos')
        .update(validation.data)
        .eq('id', campo.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantillas'] });
      toast.success('Campo actualizado');
    },
  });

  const eliminarCampo = useMutation({
    mutationFn: async (campoId: string) => {
      const { error } = await supabase
        .from('plantillas_campos')
        .delete()
        .eq('id', campoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantillas'] });
      toast.success('Campo eliminado');
    },
  });

  // ========== DOCUMENTOS ==========

  const { data: documentos = [], isLoading: isLoadingDocumentos } = useQuery({
    queryKey: ['documentos', 'generados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documentos_generados')
        .select(`
          *,
          plantilla:plantillas_documentos(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Documento[];
    },
  });

  const generarDocumento = useMutation({
    mutationFn: async (documento: Documento) => {
      const validation = DocumentoSchema.safeParse(documento);
      if (!validation.success) throw new Error('Validación fallida');

      const { data, error } = await supabase
        .from('documentos_generados')
        .insert([validation.data])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      toast.success('Documento generado');
    },
  });

  const actualizarEstadoDocumento = useMutation({
    mutationFn: async ({ documentoId, estado }: { documentoId: string; estado: string }) => {
      const { data, error } = await supabase
        .from('documentos_generados')
        .update({ estado })
        .eq('id', documentoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      toast.success('Estado actualizado');
    },
  });

  // ========== VERSIONADO ==========

  const registrarVersion = useMutation({
    mutationFn: async ({
      plantillaId,
      descripcion,
    }: {
      plantillaId: string;
      descripcion: string;
    }) => {
      const { data, error } = await supabase
        .rpc('registrar_version_plantilla', {
          p_plantilla_id: plantillaId,
          p_contenido_anterior: null,
          p_contenido_nuevo: null,
          p_campos_anterior: null,
          p_campos_nuevo: null,
          p_descripcion: descripcion,
          p_usuario_id: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantillas'] });
      toast.success('Versión registrada');
    },
  });

  // ========== UTILIDADES ==========

  const validarPlantilla = (plantilla: Plantilla): boolean => {
    const validation = PlantillaSchema.safeParse(plantilla);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        errors[err.path.join('.')] = err.message;
      });
      setValidationErrors(errors);
      return false;
    }
    setValidationErrors({});
    return true;
  };

  const reemplazarVariables = (
    contenido: string,
    datos: Record<string, any>
  ): string => {
    let resultado = contenido;
    Object.entries(datos).forEach(([clave, valor]) => {
      const regex = new RegExp(`{{${clave}}}`, 'g');
      resultado = resultado.replace(regex, String(valor || ''));
    });
    return resultado;
  };

  return {
    // Plantillas
    plantillas,
    isLoadingPlantillas,
    crearPlantilla,
    actualizarPlantilla,

    // Campos
    agregarCampo,
    actualizarCampo,
    eliminarCampo,

    // Documentos
    documentos,
    isLoadingDocumentos,
    generarDocumento,
    actualizarEstadoDocumento,

    // Versionado
    registrarVersion,

    // Utilidades
    validarPlantilla,
    reemplazarVariables,
    validationErrors,
  };
}
