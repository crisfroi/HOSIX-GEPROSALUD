import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHosixPacientes } from '@/hooks/useHosixPacientes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Plus } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { supabase } from '@/integrations/supabase/hosixClient';

interface Plantilla {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  descripcion?: string;
  contenidoHtml: string;
  variablesDisponibles: Array<{ var: string; descripcion: string }>;
  version: number;
  activo: boolean;
  createdAt: string;
}

interface DocumentoGenerado {
  id: string;
  plantillaId: string;
  nombre: string;
  pacienteId: string;
  fecha: string;
  contenidoFinal: string;
  pdfUrl: string;
}

const defaultVariables = [
  { var: '{{paciente.nombre}}', descripcion: 'Nombre completo del paciente' },
  { var: '{{paciente.nhc}}', descripcion: 'Número de Historia Clínica' },
  { var: '{{paciente.numero_documento}}', descripcion: 'Documento de identidad' },
  { var: '{{episodio.diagnostico}}', descripcion: 'Diagnóstico principal del episodio' },
  { var: '{{usuario.nombre}}', descripcion: 'Nombre del médico' },
];

const defaultPlantillas: Plantilla[] = [
  {
    id: 'plantilla-alta',
    codigo: 'ALTA_INDEPENDIENTE',
    nombre: 'Informe de Alta',
    tipo: 'informe_alta',
    descripcion: 'Plantilla básica para informe de alta con variables de paciente y episodio.',
    contenidoHtml:
      '<h3>Informe de Alta</h3><p>Paciente: <strong>{{paciente.nombre}}</strong></p><p>Historia Clínica: {{paciente.nhc}}</p><p>Documento: {{paciente.numero_documento}}</p><p>Diagnóstico principal: <strong>{{episodio.diagnostico}}</strong></p><p>El médico responsable es: {{usuario.nombre}}</p>',
    variablesDisponibles: defaultVariables,
    version: 1,
    activo: true,
    createdAt: new Date().toISOString(),
  },
];

const sampleEpisodio = {
  diagnostico: 'Hipertensión arterial esencial',
};

const sampleUsuario = {
  nombre: 'Dr. Ana Pérez',
};

const PlantillasManager: React.FC = () => {
  const {
    pacientes,
    isLoadingPacientes,
    listarPlantillasDocumentos,
    crearPlantillaDocumento,
    listarDocumentosGeneradosPaciente,
    generarDocumentoDesdePlantilla,
  } = useHosixPacientes();
  const queryClient = useQueryClient();
  const [selectedPacienteId, setSelectedPacienteId] = useState('');
  const [selectedPlantillaId, setSelectedPlantillaId] = useState(defaultPlantillas[0].id);
  const [formState, setFormState] = useState({
    codigo: '',
    nombre: '',
    tipo: 'informe_alta',
    descripcion: '',
    contenidoHtml: '',
  });

  const {
    data: plantillasData = [],
    isLoading: isLoadingPlantillas,
  } = useQuery(['configuracion', 'plantillas_documentos'], listarPlantillasDocumentos, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const plantillas = useMemo<Plantilla[]>(() => {
    if (!plantillasData || plantillasData.length === 0) {
      return defaultPlantillas;
    }
    return plantillasData.map((plantilla) => ({
      id: plantilla.id,
      codigo: plantilla.codigo,
      nombre: plantilla.nombre,
      tipo: plantilla.tipo,
      descripcion: plantilla.descripcion || '',
      contenidoHtml: plantilla.contenido_html,
      variablesDisponibles: defaultVariables,
      version: plantilla.version || 1,
      activo: plantilla.activo ?? true,
      createdAt: plantilla.created_at || new Date().toISOString(),
    }));
  }, [plantillasData]);

  const {
    data: generatedDocsData = [],
    isLoading: isLoadingGeneratedDocs,
  } = useQuery(
    ['configuracion', 'documentos_generados', selectedPacienteId],
    () => listarDocumentosGeneradosPaciente(selectedPacienteId),
    {
      enabled: Boolean(selectedPacienteId),
      staleTime: 1000 * 60 * 2,
      retry: false,
    }
  );

  const generatedDocs = useMemo<DocumentoGenerado[]>(
    () =>
      generatedDocsData.map((doc) => ({
        id: doc.id,
        plantillaId: doc.plantilla_id,
        nombre: doc.nombre_documento,
        pacienteId: doc.paciente_id,
        fecha: doc.created_at || new Date().toISOString(),
        contenidoFinal: doc.contenido_final,
        pdfUrl: doc.pdf_url || '',
      })) || [],
    [generatedDocsData]
  );

  useEffect(() => {
    if (!selectedPacienteId && pacientes?.length > 0) {
      setSelectedPacienteId(pacientes[0].id);
    }
  }, [pacientes, selectedPacienteId]);

  useEffect(() => {
    if (!selectedPlantillaId && plantillas.length > 0) {
      setSelectedPlantillaId(plantillas[0].id);
    }
  }, [plantillas, selectedPlantillaId]);

  const selectedPaciente = useMemo(
    () => pacientes?.find((paciente: any) => paciente.id === selectedPacienteId),
    [pacientes, selectedPacienteId]
  );

  const selectedPlantilla = useMemo(
    () => plantillas.find((plantilla) => plantilla.id === selectedPlantillaId) || plantillas[0],
    [plantillas, selectedPlantillaId]
  );

  const renderTemplate = (content: string) => {
    const pacienteNombre = selectedPaciente
      ? `${selectedPaciente.primer_nombre} ${selectedPaciente.primer_apellido}`
      : '[[Paciente]]';
    const pacienteNHC = selectedPaciente?.ppi ?? '[[NHC]]';
    const pacienteDocumento = selectedPaciente?.numero_documento ?? '[[Documento]]';

    return content
      .replace(/{{paciente\.nombre}}/g, pacienteNombre)
      .replace(/{{paciente\.nhc}}/g, pacienteNHC)
      .replace(/{{paciente\.numero_documento}}/g, pacienteDocumento)
      .replace(/{{episodio\.diagnostico}}/g, sampleEpisodio.diagnostico)
      .replace(/{{usuario\.nombre}}/g, sampleUsuario.nombre);
  };

  const previewHtml = useMemo(
    () => (selectedPlantilla ? renderTemplate(selectedPlantilla.contenidoHtml) : ''),
    [selectedPlantilla, selectedPacienteId]
  );

  const previewRef = useRef<HTMLDivElement | null>(null);

  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      // Calculate image size to fit page width
      const imgProps = (pdf as any).getImageProperties(imgData);
      const imgWidth = pageWidth - 40; // margins
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
      const filename = `${selectedPlantilla?.codigo || 'document'}-${selectedPaciente?.id || 'anon'}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('Error generando PDF:', err);
    }
  };

  const crearPlantillaMutation = useMutation(
    (payload: {
      codigo: string;
      nombre: string;
      tipo: string;
      descripcion?: string;
      contenido_html: string;
    }) => crearPlantillaDocumento(payload),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['configuracion', 'plantillas_documentos'] });
        setSelectedPlantillaId(data.id);
        setFormState({ codigo: '', nombre: '', tipo: 'informe_alta', descripcion: '', contenidoHtml: '' });
      },
    }
  );

  const generarDocumentoMutation = useMutation(
    (payload: {
      plantilla_id: string;
      paciente_id: string;
      nombre_documento: string;
      contenido_final: string;
      pdf_url?: string | null;
    }) => generarDocumentoDesdePlantilla(payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['configuracion', 'documentos_generados', selectedPacienteId] });
      },
    }
  );

  const handleCreatePlantilla = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.codigo.trim() || !formState.nombre.trim() || !formState.contenidoHtml.trim()) {
      return;
    }

    crearPlantillaMutation.mutate({
      codigo: formState.codigo.trim().toUpperCase(),
      nombre: formState.nombre.trim(),
      tipo: formState.tipo,
      descripcion: formState.descripcion.trim(),
      contenido_html: formState.contenidoHtml.trim(),
    });
  };

  const handleInsertVariable = (variable: string) => {
    setFormState((prev) => ({ ...prev, contenidoHtml: `${prev.contenidoHtml}${variable}` }));
  };

  const handleGenerateDocumento = () => {
    if (!selectedPaciente || !selectedPlantilla) return;
    const contenidoFinal = renderTemplate(selectedPlantilla.contenidoHtml);
    generarDocumentoMutation.mutate({
      plantilla_id: selectedPlantilla.id,
      paciente_id: selectedPaciente.id,
      nombre_documento: `${selectedPlantilla.nombre} - ${selectedPaciente.primer_nombre}`,
      contenido_final: contenidoFinal,
      pdf_url: `https://example.com/docs/${selectedPlantilla.codigo.toLowerCase()}-${selectedPaciente.id}.pdf`,
    });
  };

  const handleSignAndSave = async () => {
    if (!previewRef.current || !selectedPaciente || !selectedPlantilla) return;

    try {
      // Generate PDF blob
      const canvas = await html2canvas(previewRef.current, { scale: 2 });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b)));
      if (!blob) throw new Error('No se pudo generar el PDF');

      // Upload to Supabase Storage 'documents' bucket
      const filename = `${selectedPlantilla.codigo.toLowerCase()}-${selectedPaciente.id}-${Date.now()}.pdf`;
      const uploadPath = `documents/${filename}`;

      let publicUrl = '';
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(uploadPath, blob, { contentType: 'application/pdf' });

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(uploadPath);
          publicUrl = publicUrlData?.publicUrl || '';
        } else {
          console.warn('Advertencia: No se pudo subir PDF a Storage. Se guardará sin URL de almacenamiento.');
        }
      } catch (storageErr) {
        console.warn('Storage error (continuando sin URL):', storageErr);
      }

      // Persist document record
      const contenidoFinal = renderTemplate(selectedPlantilla.contenidoHtml);
      const created = await generarDocumentoDesdePlantilla({
        plantilla_id: selectedPlantilla.id,
        paciente_id: selectedPaciente.id,
        nombre_documento: `${selectedPlantilla.nombre} - ${selectedPaciente.primer_nombre}`,
        contenido_final: contenidoFinal,
        pdf_url: publicUrl || undefined,
      });

      // Call Supabase Edge Function to sign the document
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;

      if (!token) {
        console.warn('No hay sesión activa para firmar');
      } else {
        const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sign-document`;
        try {
          await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ document_id: created.id }),
          });
        } catch (signErr) {
          console.error('Error llamando a función de firma:', signErr);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['configuracion', 'documentos_generados', selectedPaciente.id] });
    } catch (err) {
      console.error('Error al firmar y guardar documento:', err);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Plantillas de Documentos</CardTitle>
          <CardDescription>
            Crea y genera documentos basados en plantillas con variables dinámicas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="space-y-3">
              <Label htmlFor="paciente-select">Paciente</Label>
              <Select
                id="paciente-select"
                value={selectedPacienteId}
                onValueChange={setSelectedPacienteId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingPacientes ? 'Cargando pacientes...' : 'Selecciona un paciente'} />
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

            <div className="space-y-3">
              <Label htmlFor="plantilla-select">Plantilla</Label>
              <Select
                id="plantilla-select"
                value={selectedPlantillaId}
                onValueChange={setSelectedPlantillaId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una plantilla" />
                </SelectTrigger>
                <SelectContent>
                  {plantillas.map((plantilla) => (
                    <SelectItem key={plantilla.id} value={plantilla.id}>
                      {plantilla.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle>Editor de Plantilla</CardTitle>
                <CardDescription>
                  Modifica la plantilla en HTML y usa variables para insertar datos del paciente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código</Label>
                    <Input
                      id="codigo"
                      value={formState.codigo}
                      onChange={(event) => setFormState((prev) => ({ ...prev, codigo: event.target.value }))}
                      placeholder="EJ: ALTA_INDEPENDIENTE"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      value={formState.nombre}
                      onChange={(event) => setFormState((prev) => ({ ...prev, nombre: event.target.value }))}
                      placeholder="Nombre de la plantilla"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select
                      id="tipo"
                      value={formState.tipo}
                      onValueChange={(value: any) => setFormState((prev) => ({ ...prev, tipo: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="informe_alta">Informe de Alta</SelectItem>
                        <SelectItem value="receta">Receta</SelectItem>
                        <SelectItem value="referencia">Referencia</SelectItem>
                        <SelectItem value="consentimiento">Consentimiento</SelectItem>
                        <SelectItem value="boletin_quirurgico">Boletín Quirúrgico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Input
                      id="descripcion"
                      value={formState.descripcion}
                      onChange={(event) => setFormState((prev) => ({ ...prev, descripcion: event.target.value }))}
                      placeholder="Descripción breve"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contenidoHtml">Contenido HTML</Label>
                  <Textarea
                    id="contenidoHtml"
                    value={formState.contenidoHtml}
                    onChange={(event) => setFormState((prev) => ({ ...prev, contenidoHtml: event.target.value }))}
                    placeholder="Escriba el contenido de la plantilla..."
                    className="min-h-[220px]"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {defaultVariables.map((variable) => (
                    <Badge
                      key={variable.var}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => handleInsertVariable(variable.var)}
                    >
                      {variable.var}
                    </Badge>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button onClick={() => setFormState({ codigo: '', nombre: '', tipo: 'informe_alta', descripcion: '', contenidoHtml: '' })} variant="outline">
                    Limpiar
                  </Button>
                  <Button type="button" onClick={handleCreatePlantilla} disabled={crearPlantillaMutation.isPending}>
                    {crearPlantillaMutation.isPending ? 'Creando...' : 'Crear Plantilla'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle>Preview de la plantilla</CardTitle>
                <CardDescription>
                  Vista previa generada con datos del paciente seleccionado.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="mb-3 flex items-center gap-2 text-slate-900">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">Variables disponibles</span>
                  </div>
                  <div className="grid gap-2">
                    {defaultVariables.map((variable) => (
                      <div key={variable.var} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                        <strong>{variable.var}</strong> — {variable.descripcion}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Contenido renderizado</p>
                      <p className="text-xs text-slate-500">Los marcadores se sustituirán automáticamente.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" onClick={handleGenerateDocumento}>
                        Generar documento
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleDownloadPdf}>
                        Descargar PDF
                      </Button>                      <Button size="sm" variant="ghost" onClick={handleSignAndSave}>
                        Firmar y Guardar
                      </Button>                    </div>
                  </div>
                  <div
                    ref={previewRef}
                    className="prose prose-sm max-w-none overflow-x-auto rounded-md border border-slate-200 bg-slate-50 p-4 text-slate-800"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle>Plantillas creadas</CardTitle>
                <CardDescription>Administra todas las plantillas de documentos disponibles.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ScrollArea className="max-h-[280px] rounded-xl border border-slate-200 p-3">
                  <div className="space-y-3">
                    {plantillas.map((plantilla) => (
                      <button
                        key={plantilla.id}
                        type="button"
                        className={`w-full rounded-lg border p-3 text-left transition ${selectedPlantillaId === plantilla.id ? 'border-slate-900 bg-slate-100' : 'border-slate-200 bg-white hover:border-slate-400'}`}
                        onClick={() => setSelectedPlantillaId(plantilla.id)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold">{plantilla.nombre}</p>
                            <p className="text-xs text-slate-500">{plantilla.codigo} · {plantilla.tipo}</p>
                          </div>
                          <Badge>{plantilla.version}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{plantilla.descripcion}</p>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle>Documentos generados</CardTitle>
                <CardDescription>Historial local de documentos generados desde plantillas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {generatedDocs.length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
                    Genera un documento para verlo aquí.
                  </div>
                ) : (
                  <ScrollArea className="max-h-[280px] rounded-xl border border-slate-200 p-3">
                    <div className="space-y-3">
                      {generatedDocs.map((doc) => (
                        <div key={doc.id} className="rounded-lg border border-slate-200 bg-white p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold">{doc.nombre}</p>
                              <p className="text-xs text-slate-500">{new Date(doc.fecha).toLocaleString('es-ES')}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(doc.pdfUrl, '_blank')}
                            >
                              Ver PDF
                            </Button>
                          </div>
                          <div className="mt-3 rounded-md border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700">
                            {doc.pdfUrl}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlantillasManager;
