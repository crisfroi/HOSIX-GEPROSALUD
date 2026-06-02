import React, { useState, useMemo } from 'react';
import { useHosixCitas } from '@/hooks/useHosixCitas';
import { useHosixPacientes } from '@/hooks/useHosixPacientes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/app/supabase';
import { Calendar, Clock, AlertCircle, CheckCircle, Upload, File, X, FileImage, FileVideo, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface CitasFormEnhancedProps {
  onSuccess?: () => void;
}

interface AdjuntoFile {
  id: string;
  file: File;
  nombre: string;
  tipo: 'imagen' | 'video' | 'documento' | 'audio';
  tamaño: number;
  urlPreview?: string;
  subiendo?: boolean;
}

export const CitasFormEnhanced: React.FC<CitasFormEnhancedProps> = ({ onSuccess }) => {
  const { agendas, createCita, isCreatingCita } = useHosixCitas();
  const { pacientes } = useHosixPacientes();

  const [formData, setFormData] = useState({
    paciente_id: '',
    agenda_id: '',
    fecha: '',
    hora: '',
    motivo: '',
    es_teleconsulta: false,
    requiereAdjuntos: false,
  });

  const [adjuntos, setAdjuntos] = useState<AdjuntoFile[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [cargandoAdjuntos, setCargandoAdjuntos] = useState(false);

  // Generar horas disponibles (8:00 AM - 6:00 PM, cada 15 minutos)
  const horasDisponibles = useMemo(() => {
    const horas = [];
    for (let h = 8; h < 18; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        horas.push(hora);
      }
    }
    return horas;
  }, []);

  // Detectar tipo de archivo
  const detectarTipoAdjunto = (file: File): AdjuntoFile['tipo'] => {
    const tipo = file.type.toLowerCase();
    if (tipo.includes('image')) return 'imagen';
    if (tipo.includes('video')) return 'video';
    if (tipo.includes('audio')) return 'audio';
    return 'documento';
  };

  // Crear preview para imágenes
  const crearPreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.includes('image')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve('');
      }
    });
  };

  // Manejar selección de archivos
  const handleAdjuntosChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      // Validar tamaño (máx 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`Archivo "${file.name}" excede 50MB`);
        continue;
      }

      const tipo = detectarTipoAdjunto(file);
      const preview = await crearPreview(file);
      
      const nuevoAdjunto: AdjuntoFile = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        nombre: file.name,
        tipo,
        tamaño: file.size,
        urlPreview: preview,
      };

      setAdjuntos(prev => [...prev, nuevoAdjunto]);
    }
  };

  // Remover adjunto
  const removerAdjunto = (id: string) => {
    setAdjuntos(prev => prev.filter(a => a.id !== id));
  };

  // Subir adjuntos a Supabase
  const subirAdjuntos = async (citaId: string): Promise<string[]> => {
    const urlsSubidas: string[] = [];

    for (const adjunto of adjuntos) {
      try {
        setAdjuntos(prev => prev.map(a => a.id === adjunto.id ? { ...a, subiendo: true } : a));

        // Subir a Storage
        const rutaArchivo = `citas/${citaId}/${Date.now()}-${adjunto.nombre}`;
        const { error: errorSubida } = await supabase.storage
          .from('documents')
          .upload(rutaArchivo, adjunto.file, {
            contentType: adjunto.file.type,
            upsert: false,
          });

        if (errorSubida) throw errorSubida;

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(rutaArchivo);

        urlsSubidas.push(publicUrl);

        setAdjuntos(prev => prev.map(a => a.id === adjunto.id ? { ...a, subiendo: false } : a));
      } catch (error) {
        console.error('Error subiendo adjunto:', error);
        toast.error(`Error al subir ${adjunto.nombre}`);
        setAdjuntos(prev => prev.map(a => a.id === adjunto.id ? { ...a, subiendo: false } : a));
      }
    }

    return urlsSubidas;
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.paciente_id || !formData.agenda_id || !formData.fecha || !formData.hora) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const fechaHora = new Date(`${formData.fecha}T${formData.hora}`);

      // Buscar la agenda seleccionada para obtener duración
      const agenda = agendas.data?.find(a => a.id === formData.agenda_id);
      if (!agenda) throw new Error('Agenda no encontrada');

      // Crear cita
      await createCita({
        agenda_id: formData.agenda_id,
        paciente_id: formData.paciente_id,
        fecha_hora: fechaHora.toISOString(),
        duracion_minutos: agenda.duracion_default_minutos,
        motivo: formData.motivo,
        estado: 'programada',
        es_teleconsulta: formData.es_teleconsulta,
      });

      // Si hay adjuntos, subirlos
      if (adjuntos.length > 0 && agenda.id) {
        setCargandoAdjuntos(true);
        const urls = await subirAdjuntos(agenda.id);
        console.log('Adjuntos subidos:', urls);
        setCargandoAdjuntos(false);
      }

      setSubmitted(true);
      toast.success('Cita agendada correctamente');
      
      setFormData({
        paciente_id: '',
        agenda_id: '',
        fecha: '',
        hora: '',
        motivo: '',
        es_teleconsulta: false,
        requiereAdjuntos: false,
      });
      setAdjuntos([]);

      setTimeout(() => {
        setSubmitted(false);
        onSuccess?.();
      }, 2000);
    } catch (error) {
      console.error('Error al agendar cita:', error);
      toast.error('Error al agendar la cita');
    }
  };

  const formatearTamaño = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getIconoTipo = (tipo: AdjuntoFile['tipo']) => {
    switch (tipo) {
      case 'imagen': return <FileImage className="h-5 w-5 text-blue-500" />;
      case 'video': return <FileVideo className="h-5 w-5 text-purple-500" />;
      case 'audio': return <File className="h-5 w-5 text-green-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Tabs defaultValue="cita" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cita">Datos de Cita</TabsTrigger>
          <TabsTrigger value="adjuntos">Adjuntos ({adjuntos.length})</TabsTrigger>
        </TabsList>

        {/* TAB: Datos de Cita */}
        <TabsContent value="cita" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agendar Nueva Cita</CardTitle>
              <CardDescription>Complete los datos del paciente y la cita</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Paciente */}
                <div>
                  <Label htmlFor="paciente">Paciente *</Label>
                  <Select value={formData.paciente_id} onValueChange={(value) => setFormData({ ...formData, paciente_id: value })}>
                    <SelectTrigger id="paciente">
                      <SelectValue placeholder="Seleccionar paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {pacientes.data?.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.primer_nombre} {p.primer_apellido} ({p.ppi})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Agenda */}
                <div>
                  <Label htmlFor="agenda">Agenda/Especialidad *</Label>
                  <Select value={formData.agenda_id} onValueChange={(value) => setFormData({ ...formData, agenda_id: value })}>
                    <SelectTrigger id="agenda">
                      <SelectValue placeholder="Seleccionar agenda" />
                    </SelectTrigger>
                    <SelectContent>
                      {agendas.data?.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Fecha y Hora */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fecha">Fecha *</Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={formData.fecha}
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hora">Hora *</Label>
                    <Select value={formData.hora} onValueChange={(value) => setFormData({ ...formData, hora: value })}>
                      <SelectTrigger id="hora">
                        <SelectValue placeholder="Seleccionar hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {horasDisponibles.map(hora => (
                          <SelectItem key={hora} value={hora}>
                            {hora}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Motivo */}
                <div>
                  <Label htmlFor="motivo">Motivo de la Cita</Label>
                  <Input
                    id="motivo"
                    placeholder="Ej: Revisión general, Seguimiento..."
                    value={formData.motivo}
                    onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  />
                </div>

                {/* Opciones */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="teleconsulta"
                      checked={formData.es_teleconsulta}
                      onCheckedChange={(checked) => setFormData({ ...formData, es_teleconsulta: checked as boolean })}
                    />
                    <Label htmlFor="teleconsulta" className="font-normal cursor-pointer">
                      Esto es una teleconsulta (consulta por video)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="adjuntos"
                      checked={formData.requiereAdjuntos}
                      onCheckedChange={(checked) => setFormData({ ...formData, requiereAdjuntos: checked as boolean })}
                    />
                    <Label htmlFor="adjuntos" className="font-normal cursor-pointer">
                      Esta cita requiere adjuntos (documentos, imágenes, etc.)
                    </Label>
                  </div>
                </div>

                {/* Botón enviar */}
                <Button
                  type="submit"
                  disabled={isCreatingCita || cargandoAdjuntos || submitted}
                  className="w-full"
                >
                  {submitted ? (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Cita Agendada
                    </>
                  ) : (
                    'Agendar Cita'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Adjuntos */}
        <TabsContent value="adjuntos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Adjuntos para la Cita</CardTitle>
              <CardDescription>Sube documentos, imágenes, videos o audios relacionados con la cita</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Zona de carga */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50 hover:bg-blue-50"
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-700 font-semibold">Arrastra archivos o haz clic para seleccionar</p>
                <p className="text-sm text-gray-500 mt-1">PNG, JPG, PDF, MP4, MP3 (máx 50MB cada uno)</p>
                <Input
                  id="fileInput"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleAdjuntosChange}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
                />
              </div>

              {/* Lista de adjuntos */}
              {adjuntos.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700">Archivos seleccionados ({adjuntos.length})</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {adjuntos.map(adjunto => (
                      <div key={adjunto.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {adjunto.urlPreview && (
                            <img
                              src={adjunto.urlPreview}
                              alt={adjunto.nombre}
                              className="h-10 w-10 rounded object-cover"
                            />
                          )}
                          {!adjunto.urlPreview && getIconoTipo(adjunto.tipo)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-gray-900">{adjunto.nombre}</p>
                            <p className="text-xs text-gray-500">{formatearTamaño(adjunto.tamaño)}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removerAdjunto(adjunto.id)}
                          disabled={adjunto.subiendo}
                          className="ml-2"
                        >
                          {adjunto.subiendo ? (
                            <span className="text-xs">Subiendo...</span>
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {adjuntos.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No hay adjuntos seleccionados. Los adjuntos se subirán automáticamente al agendar la cita.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CitasFormEnhanced;
