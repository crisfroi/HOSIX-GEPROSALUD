import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/app/supabase';
import { useState } from 'react';

export interface EnfermedadNotificable {
  id: string;
  codigo_cie10: string;
  nombre: string;
  descripcion?: string;
  nivel_notificacion: string;
  activa: boolean;
}

export interface CasoEpidemiologico {
  id: string;
  numero_caso: string;
  paciente_id: string;
  enfermedad_id: string;
  estado: string;
  fecha_sintomas: string;
  fecha_confirmacion?: string;
  resultado_final?: string;
  tipo_caso?: string;
  lugar_contagio?: string;
  severidad?: string;
  hosix_enfermedades_notificables?: {
    nombre: string;
  };
  hosix_pacientes?: {
    primer_nombre: string;
    primer_apellido: string;
    numero_documento?: string;
  };
}

export interface BroteEpidemiologico {
  id: string;
  numero_brote: string;
  estado: string;
  enfermedad_id: string;
  total_casos: number;
  casos_confirmados: number;
  ubicacion_geografica: string;
  medida_control?: string[];
  hosix_enfermedades_notificables?: {
    nombre: string;
  };
}

export interface AlertaEpidemiologica {
  id: string;
  tipo_alerta: string;
  descripcion: string;
  severidad: string;
  estado: string;
  casos_asociados: number;
  enfermedad_id: string;
  hosix_enfermedades_notificables?: {
    nombre: string;
  };
}

export const useHosixEpidemiologia = () => {
  const queryClient = useQueryClient();

  const casosQuery = useQuery({
    queryKey: ['epidemiologia', 'casos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_casos_epidemiologicos')
        .select(
          `id, numero_caso, estado, fecha_sintomas, resultado_final, tipo_caso, lugar_contagio, severidad, hosix_enfermedades_notificables(nombre), hosix_pacientes(primer_nombre,primer_apellido,numero_documento)`
        )
        .order('fecha_sintomas', { ascending: false });

      if (error) throw error;
      return (data || []) as CasoEpidemiologico[];
    },
  });

  const brotesQuery = useQuery({
    queryKey: ['epidemiologia', 'brotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_brotes_epidemiologicos')
        .select(
          `id, numero_brote, estado, total_casos, casos_confirmados, ubicacion_geografica, medidas_control, hosix_enfermedades_notificables(nombre)`
        )
        .order('fecha_inicio', { ascending: false });

      if (error) throw error;
      return (data || []) as BroteEpidemiologico[];
    },
  });

  const alertasQuery = useQuery({
    queryKey: ['epidemiologia', 'alertas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_alertas_epidemiologicas')
        .select(
          `id, tipo_alerta, descripcion, severidad, estado, casos_asociados, hosix_enfermedades_notificables(nombre)`
        )
        .order('fecha_alerta', { ascending: false });

      if (error) throw error;
      return (data || []) as AlertaEpidemiologica[];
    },
  });

  const enfermedadesQuery = useQuery({
    queryKey: ['epidemiologia', 'enfermedades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_enfermedades_notificables')
        .select('id, codigo_cie10, nombre, nivel_notificacion, activa')
        .order('nombre', { ascending: true });

      if (error) throw error;
      return (data || []) as EnfermedadNotificable[];
    },
  });

  const crearCasoMutation = useMutation({
    mutationFn: async (payload: {
      paciente_id: string;
      enfermedad_id: string;
      numero_caso: string;
      fecha_sintomas: string;
      tipo_caso?: string;
      lugar_contagio?: string;
      sintomas?: string[];
      severidad?: string;
    }) => {
      const { data, error } = await supabase
        .from('hosix_casos_epidemiologicos')
        .insert([
          {
            ...payload,
            estado: 'sospechoso',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data as CasoEpidemiologico;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epidemiologia', 'casos'] });
    },
  });

  return {
    casos: casosQuery.data || [],
    isLoadingCasos: casosQuery.isLoading,
    brotes: brotesQuery.data || [],
    isLoadingBrotes: brotesQuery.isLoading,
    alertas: alertasQuery.data || [],
    isLoadingAlertas: alertasQuery.isLoading,
    enfermedades: enfermedadesQuery.data || [],
    isLoadingEnfermedades: enfermedadesQuery.isLoading,
    crearCaso: crearCasoMutation,
  };
};
