import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import PacientesList from '@/components/hosix/pacientes/PacientesList';
import PacienteForm from '@/components/hosix/pacientes/PacienteForm';
import { HistoriaClinicaAvanzada } from '@/modules/pacientes/components/HistoriaClinicaAvanzada';
import DocumentosManager from '@/components/hosix/pacientes/DocumentosManager';
import PlantillasManager from '@/components/hosix/pacientes/PlantillasManager';
import AvisosManager from '@/components/hosix/pacientes/AvisosManager';
import FamiliasManager from '@/components/hosix/pacientes/FamiliasManager';
import { Plus, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '@/app/supabase';

export default function PacientesPage() {
  const [activeTab, setActiveTab] = useState('listar');
  const [selectedPacienteId, setSelectedPacienteId] = useState('');

  const { data: pacientes, isLoading: loadingPacientes } = useQuery({
    queryKey: ['pacientes-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_pacientes')
        .select('id, ppi, primer_nombre, primer_apellido, numero_documento')
        .order('primer_apellido', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (!selectedPacienteId && pacientes && pacientes.length > 0) {
      setSelectedPacienteId(pacientes[0].id);
    }
  }, [pacientes, selectedPacienteId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Pacientes</h1>
        <p className="text-gray-600 mt-2">
          Administra información de pacientes, historia clínica electrónica, documentos y avisos
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="listar">Listar Pacientes</TabsTrigger>
          <TabsTrigger value="crear" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo
          </TabsTrigger>
          <TabsTrigger value="historia" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Historia Clínica
          </TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="plantillas" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Plantillas
          </TabsTrigger>
          <TabsTrigger value="avisos" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Avisos
          </TabsTrigger>
          <TabsTrigger value="familias">Familias</TabsTrigger>
        </TabsList>

        <TabsContent value="listar" className="space-y-4">
          <PacientesList />
        </TabsContent>

        <TabsContent value="crear" className="space-y-4">
          <PacienteForm />
        </TabsContent>

        <TabsContent value="historia" className="space-y-4">
          <div className="space-y-4">
            <div className="grid gap-2 md:grid-cols-[1fr_auto] items-end">
              <div>
                <Label htmlFor="paciente-select">Paciente</Label>
                <Select
                  id="paciente-select"
                  value={selectedPacienteId}
                  onValueChange={setSelectedPacienteId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingPacientes ? 'Cargando pacientes...' : 'Selecciona un paciente'} />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes?.map((paciente: any) => (
                      <SelectItem key={paciente.id} value={paciente.id}>
                        {paciente.primer_nombre} {paciente.primer_apellido} - {paciente.ppi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedPacienteId ? (
              <HistoriaClinicaAvanzada paciente_id={selectedPacienteId} />
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
                Selecciona un paciente para ver la Historia Clínica Avanzada.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-4">
          <DocumentosManager />
        </TabsContent>

        <TabsContent value="plantillas" className="space-y-4">
          <PlantillasManager />
        </TabsContent>

        <TabsContent value="avisos" className="space-y-4">
          <AvisosManager />
        </TabsContent>

        <TabsContent value="familias" className="space-y-4">
          <FamiliasManager pacienteId={selectedPacienteId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
