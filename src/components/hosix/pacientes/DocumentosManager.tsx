import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useHosixPacientes } from '@/hooks/useHosixPacientes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUp, Download, Trash2, AlertCircle } from 'lucide-react';

const tipoDocumentoOptions = [
  { value: 'cédula', label: 'Cédula de Identidad' },
  { value: 'pasaporte', label: 'Pasaporte' },
  { value: 'licencia', label: 'Licencia de Conducir' },
  { value: 'comprobante_domicilio', label: 'Comprobante de Domicilio' },
  { value: 'seguro', label: 'Documento de Seguro' },
  { value: 'otro', label: 'Otro' },
] as const;

const DocumentosManager: React.FC = () => {
  const {
    pacientes,
    isLoadingPacientes,
    listarDocumentosPaciente,
    agregarDocumento,
    isAddingDocumento,
    eliminarDocumento,
    isDeletingDocumento,
  } = useHosixPacientes();
  const [selectedPacienteId, setSelectedPacienteId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'otro' as typeof tipoDocumentoOptions[number]['value'],
  });

  const pacienteSeleccionado = pacientes?.find((p: any) => p.id === selectedPacienteId);

  const { data: documentosPaciente = [], isLoading: loadingDocumentos } = useQuery({
    queryKey: ['paciente-documentos', selectedPacienteId],
    enabled: !!selectedPacienteId,
    queryFn: async () => listarDocumentosPaciente(selectedPacienteId),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPacienteId || !formData.nombre.trim()) {
      alert('Por favor selecciona un paciente y proporciona nombre del documento');
      return;
    }

    try {
      await agregarDocumento({
        paciente_id: selectedPacienteId,
        nombre_documento: formData.nombre,
        tipo_documento: formData.tipo,
        url_documento: '#',
      });

      setShowForm(false);
      setFormData({
        nombre: '',
        tipo: 'otro',
      });
    } catch (error) {
      console.error('Error al agregar documento:', error);
    }
  };

  const handleDeleteDocumento = async (id: string) => {
    try {
      await eliminarDocumento(id);
    } catch (error) {
      console.error('Error al eliminar documento:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Paciente</CardTitle>
          <CardDescription>
            Selecciona un paciente para administrar sus documentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedPacienteId} onValueChange={setSelectedPacienteId}>
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
        </CardContent>
      </Card>

      {pacienteSeleccionado ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Documentos</CardTitle>
                <CardDescription>
                  {pacienteSeleccionado.primer_nombre} {pacienteSeleccionado.primer_apellido}
                </CardDescription>
              </div>
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                  <Button>
                    <FileUp className="w-4 h-4 mr-2" />
                    Agregar Documento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agregar Documento</DialogTitle>
                    <CardDescription>
                      Carga un nuevo documento para el paciente
                    </CardDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre del Documento *</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Ej: Cédula de identidad, Comprobante de domicilio"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tipoDocumentoOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isAddingDocumento}>
                        {isAddingDocumento ? 'Agregando...' : 'Agregar'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            {loadingDocumentos ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
                Cargando documentos...
              </div>
            ) : documentosPaciente.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No hay documentos cargados para este paciente
                </AlertDescription>
              </Alert>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documentosPaciente.map((doc: any) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.nombre_documento}</TableCell>
                        <TableCell>{doc.tipo_documento || '-'}</TableCell>
                        <TableCell className="text-sm text-slate-600">
                          <a href={doc.url_documento} target="_blank" rel="noreferrer" className="underline">
                            Ver archivo
                          </a>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(doc.created_at || '').toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <a href={doc.url_documento} target="_blank" rel="noreferrer">
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteDocumento(doc.id)}
                            disabled={isDeletingDocumento}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Selecciona un paciente para administrar sus documentos
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentosManager;
