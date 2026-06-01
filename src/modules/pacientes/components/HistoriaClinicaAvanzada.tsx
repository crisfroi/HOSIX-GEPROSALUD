import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Phone, Mail, User, Stethoscope, Pill } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/app/supabase';
import AlergiasBanner from './AlergiasBanner';
import TimelineEpisodios from './TimelineEpisodios';
import EscalasClinicas from './EscalasClinicas';
import { mapPacienteRowToFHIR } from '@/shared/lib/fhirMapper';

interface Props {
  paciente_id: string;
}

export const HistoriaClinicaAvanzada: React.FC<Props> = ({ paciente_id }) => {
  const [expandedEpisodio, setExpandedEpisodio] = useState<string | null>(null);

  // Query: Datos del paciente
  const { data: paciente, isLoading: loadingPaciente } = useQuery({
    queryKey: ['paciente', paciente_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_pacientes')
        .select('*')
        .eq('id', paciente_id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const pacienteFHIR = paciente ? mapPacienteRowToFHIR(paciente) : null;

  // Query: Antecedentes
  const { data: antecedentes } = useQuery({
    queryKey: ['antecedentes', paciente_id],
    queryFn: async () => {
      if (paciente?.antecedentes_personales || paciente?.antecedentes_familiares) {
        return {
          personales: paciente?.antecedentes_personales || [],
          familiares: paciente?.antecedentes_familiares || [],
        };
      }
      return { personales: [], familiares: [] };
    },
    enabled: !!paciente,
  });

  // Query: Prescripciones activas
  const { data: prescripciones } = useQuery({
    queryKey: ['prescripciones-activas', paciente_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_prescripciones')
        .select('*')
        .eq('paciente_id', paciente_id)
        .eq('estado', 'activa')
        .order('fecha_prescripcion', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!paciente_id,
  });

  // Query: Familia asociada al paciente
  const { data: familia } = useQuery({
    queryKey: ['familia', paciente?.familia_id],
    queryFn: async () => {
      if (!paciente?.familia_id) return null;
      const { data, error } = await supabase
        .from('hosix_familias')
        .select('*')
        .eq('id', paciente.familia_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!paciente?.familia_id,
  });

  // Query: Contactos y relaciones familiares
  const { data: contactos } = useQuery({
    queryKey: ['contactos', paciente_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_pacientes_contactos')
        .select('*')
        .eq('paciente_id', paciente_id)
        .order('es_contacto_principal', { ascending: false })
        .order('nombre', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!paciente_id,
  });

  if (loadingPaciente) {
    return <div className="p-4 text-center">Cargando historia clínica...</div>;
  }

  if (!paciente) {
    return <div className="p-4 text-red-600">Paciente no encontrado</div>;
  }

  const pacienteNombreFHIR = pacienteFHIR?.name?.[0]
    ? [
        pacienteFHIR.name[0].given?.join(' '),
        pacienteFHIR.name[0].family,
      ]
        .filter(Boolean)
        .join(' ')
    : paciente?.nombres || paciente?.nombre || 'Paciente';

  // Calcular edad
  const edad = paciente?.fecha_nacimiento
    ? new Date().getFullYear() - new Date(paciente.fecha_nacimiento).getFullYear()
    : 'N/A';

  return (
    <div className="space-y-4 p-4">
      <AlergiasBanner pacienteId={paciente_id} />

      {/* =============== DATOS DEMOGRÁFICOS =============== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información del Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-500 font-semibold">NHC:</span>
              <p className="text-base font-bold">{paciente?.ppi}</p>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">FHIR ID:</span>
              <p className="text-base font-bold">{pacienteFHIR?.id || 'No definido'}</p>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">Edad:</span>
              <p className="text-base font-bold">{edad} años</p>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">Sexo:</span>
              <p className="text-base font-bold">{paciente?.sexo?.toUpperCase()}</p>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">Familia / Hogar:</span>
              <p className="text-base font-bold text-slate-700">
                {familia?.nombre || 'No asignada'}
              </p>
              {familia?.descripcion && (
                <p className="text-xs text-slate-500">{familia.descripcion}</p>
              )}
            </div>
            <div>
              <span className="text-slate-500 font-semibold">Grupo Sanguíneo:</span>
              <p className="text-base font-bold text-red-600">{paciente?.grupo_sanguineo}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* =============== TABS PRINCIPALES =============== */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-7 bg-slate-100">
          <TabsTrigger value="timeline" className="text-xs">
            <Calendar className="w-4 h-4 mr-1" /> Timeline
          </TabsTrigger>
          <TabsTrigger value="escalas" className="text-xs">
            📊 Escalas
          </TabsTrigger>
          <TabsTrigger value="antecedentes" className="text-xs">
            <User className="w-4 h-4 mr-1" /> Antecedentes
          </TabsTrigger>
          <TabsTrigger value="medicacion" className="text-xs">
            <Pill className="w-4 h-4 mr-1" /> Medicación
          </TabsTrigger>
          <TabsTrigger value="diagnosticos" className="text-xs">
            <Stethoscope className="w-4 h-4 mr-1" /> Diagnósticos
          </TabsTrigger>
          <TabsTrigger value="documentos" className="text-xs">
            📄 Documentos
          </TabsTrigger>
          <TabsTrigger value="contactos" className="text-xs">
            <User className="w-4 h-4 mr-1" /> Contactos
          </TabsTrigger>
        </TabsList>

        {/* =============== TAB: ESCALAS CLÍNICAS =============== */}
        <TabsContent value="escalas" className="space-y-3 mt-4">
          <EscalasClinicas pacienteId={paciente_id} />
        </TabsContent>
        {/* =============== TAB: TIMELINE =============== */}
        <TabsContent value="timeline" className="space-y-3 mt-4">
          <TimelineEpisodios pacienteId={paciente_id} />
        </TabsContent>

        {/* =============== TAB: ANTECEDENTES =============== */}
        <TabsContent value="antecedentes" className="space-y-3 mt-4">
          {antecedentes?.personales && antecedentes.personales.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Antecedentes Personales</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                {antecedentes.personales.map((ant: any, idx: number) => (
                  <div key={idx} className="py-1 border-b last:border-0">
                    • {ant.descripcion || ant}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {antecedentes?.familiares && antecedentes.familiares.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Antecedentes Familiares</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                {antecedentes.familiares.map((ant: any, idx: number) => (
                  <div key={idx} className="py-1 border-b last:border-0">
                    • {ant.descripcion || ant}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {!antecedentes?.personales?.length && !antecedentes?.familiares?.length && (
            <div className="text-center text-slate-500 py-8">
              Sin antecedentes registrados
            </div>
          )}
        </TabsContent>

        {/* =============== TAB: MEDICACIÓN ACTIVA =============== */}
        <TabsContent value="medicacion" className="space-y-3 mt-4">
          {prescripciones && prescripciones.length > 0 ? (
            prescripciones.map((presc: any) => (
              <Card key={presc.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{presc.medicamento_texto || 'Medicamento'}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <div>
                    <span className="font-semibold">Dosis:</span> {presc.dosis}
                  </div>
                  <div>
                    <span className="font-semibold">Frecuencia:</span> {presc.frecuencia}
                  </div>
                  <div>
                    <span className="font-semibold">Vía:</span> {presc.via_administracion}
                  </div>
                  {presc.duracion_dias && (
                    <div>
                      <span className="font-semibold">Duración:</span> {presc.duracion_dias} días
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center text-slate-500 py-8">
              Sin medicación activa
            </div>
          )}
        </TabsContent>

        {/* =============== TAB: DIAGNÓSTICOS =============== */}
        <TabsContent value="diagnosticos" className="space-y-3 mt-4">
          <div className="text-center text-slate-500 py-8">
            Diagnósticos CIE-10 activos serán mostrados aquí
          </div>
        </TabsContent>

        {/* =============== TAB: DOCUMENTOS =============== */}
        <TabsContent value="documentos" className="space-y-3 mt-4">
          <div className="text-center text-slate-500 py-8">
            Documentos adjuntos serán mostrados aquí
          </div>
        </TabsContent>

        {/* =============== TAB: CONTACTOS =============== */}
        <TabsContent value="contactos" className="space-y-3 mt-4">
          {contactos && contactos.length > 0 ? (
            contactos.map((contacto: any) => (
              <Card key={contacto.id} className="border-l-4 border-l-indigo-500 bg-indigo-50">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <CardTitle className="text-sm">{contacto.nombre}</CardTitle>
                      <p className="text-xs text-slate-600 mt-1">
                        {contacto.parentesco || 'Contacto'}
                      </p>
                    </div>
                    {contacto.es_contacto_principal && (
                      <Badge className="bg-indigo-600">Principal</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <span>{contacto.telefono || 'Sin teléfono'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <span>{contacto.email || 'Sin email'}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    Registrado: {contacto.created_at ? new Date(contacto.created_at).toLocaleDateString('es-ES') : 'Sin fecha'}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center text-slate-500 py-8">
              No hay contactos registrados para este paciente
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HistoriaClinicaAvanzada;

