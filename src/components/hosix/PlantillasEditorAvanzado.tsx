import React, { useState, useMemo } from 'react';
import { useHosixPlantillasAvanzado, type Plantilla, type Campo } from '@/hooks/useHosixPlantillasAvanzado';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Eye, FileText, Settings } from 'lucide-react';
import { toast } from 'sonner';

export const PlantillasEditorAvanzado: React.FC = () => {
  const {
    plantillas,
    isLoadingPlantillas,
    crearPlantilla,
    actualizarPlantilla,
    agregarCampo,
    actualizarCampo,
    eliminarCampo,
    validarPlantilla,
  } = useHosixPlantillasAvanzado();

  const [selectedPlantillaId, setSelectedPlantillaId] = useState<string>('');
  const [formPlantilla, setFormPlantilla] = useState<Partial<Plantilla>>({
    codigo: '',
    nombre: '',
    tipo: 'informe_alta',
    grupo: 'medico',
    descripcion: '',
    contenido_html: '',
    export_pdf: true,
    export_docx: false,
    requiere_firma: false,
    activo: true,
  });

  const [newCampo, setNewCampo] = useState<Partial<Campo>>({
    tipo: 'text',
    requerido: false,
    ancho: 'full',
    visible_en_exportacion: true,
  });

  const selectedPlantilla = useMemo(
    () => plantillas.find((p) => p.id === selectedPlantillaId),
    [plantillas, selectedPlantillaId]
  );

  const handleGuardarPlantilla = async () => {
    if (!validarPlantilla(formPlantilla as Plantilla)) {
      toast.error('Validación fallida');
      return;
    }

    if (selectedPlantillaId) {
      await actualizarPlantilla.mutateAsync({
        ...formPlantilla,
        id: selectedPlantillaId,
      } as Plantilla);
    } else {
      await crearPlantilla.mutateAsync(formPlantilla as any);
    }
  };

  const handleAgregarCampo = async () => {
    if (!selectedPlantillaId || !newCampo.codigo || !newCampo.nombre) {
      toast.error('Completa código y nombre del campo');
      return;
    }

    await agregarCampo.mutateAsync({
      plantilla_id: selectedPlantillaId,
      ...newCampo,
    } as Campo);

    setNewCampo({ tipo: 'text', requerido: false, ancho: 'full', visible_en_exportacion: true });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PANEL IZQUIERDO: Listado de Plantillas */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Plantillas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] space-y-2">
              {isLoadingPlantillas ? (
                <div className="text-sm text-muted-foreground">Cargando...</div>
              ) : (
                plantillas.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPlantillaId(p.id || '');
                      setFormPlantilla(p);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedPlantillaId === p.id
                        ? 'bg-blue-50 border-blue-300'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-sm">{p.nombre}</div>
                    <div className="text-xs text-muted-foreground">{p.codigo}</div>
                    <div className="flex gap-1 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {p.tipo}
                      </Badge>
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
            <Button className="w-full mt-4" onClick={() => setFormPlantilla({
              codigo: '',
              nombre: '',
              tipo: 'informe_alta',
              grupo: 'medico',
              descripcion: '',
              contenido_html: '',
              export_pdf: true,
              export_docx: false,
              requiere_firma: false,
              activo: true,
            })}>
              <Plus className="w-4 h-4 mr-2" /> Nueva
            </Button>
          </CardContent>
        </Card>

        {/* PANEL CENTRAL: Editor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Editor de Plantilla</CardTitle>
            <CardDescription>
              {selectedPlantillaId ? 'Editar plantilla existente' : 'Crear nueva plantilla'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="general" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="campos">Campos</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              {/* TAB: GENERAL */}
              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Código</Label>
                    <Input
                      value={formPlantilla.codigo || ''}
                      onChange={(e) =>
                        setFormPlantilla({ ...formPlantilla, codigo: e.target.value })
                      }
                      placeholder="P001"
                      disabled={!!selectedPlantillaId}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input
                      value={formPlantilla.nombre || ''}
                      onChange={(e) =>
                        setFormPlantilla({ ...formPlantilla, nombre: e.target.value })
                      }
                      placeholder="Informe de Alta"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={formPlantilla.tipo}
                      onValueChange={(value) =>
                        setFormPlantilla({ ...formPlantilla, tipo: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="informe_alta">Alta Hospitalaria</SelectItem>
                        <SelectItem value="urgencias">Urgencias</SelectItem>
                        <SelectItem value="consulta">Consulta Externa</SelectItem>
                        <SelectItem value="quirurgico">Quirúrgico</SelectItem>
                        <SelectItem value="receta">Receta</SelectItem>
                        <SelectItem value="laboratorio">Laboratorio</SelectItem>
                        <SelectItem value="certificado">Certificado</SelectItem>
                        <SelectItem value="consentimiento">Consentimiento</SelectItem>
                        <SelectItem value="administrativo">Administrativo</SelectItem>
                        <SelectItem value="control">Control</SelectItem>
                        <SelectItem value="bi">BI/Reportes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Grupo</Label>
                    <Select
                      value={formPlantilla.grupo}
                      onValueChange={(value: any) =>
                        setFormPlantilla({ ...formPlantilla, grupo: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="medico">Médico</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                        <SelectItem value="financiero">Financiero</SelectItem>
                        <SelectItem value="control">Control</SelectItem>
                        <SelectItem value="bi">BI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={formPlantilla.descripcion || ''}
                    onChange={(e) =>
                      setFormPlantilla({ ...formPlantilla, descripcion: e.target.value })
                    }
                    placeholder="Descripción de la plantilla"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contenido HTML</Label>
                  <Textarea
                    value={formPlantilla.contenido_html || ''}
                    onChange={(e) =>
                      setFormPlantilla({ ...formPlantilla, contenido_html: e.target.value })
                    }
                    placeholder="<h1>Título</h1><p>Contenido con {{variables}}</p>"
                    rows={8}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formPlantilla.export_pdf || false}
                      onCheckedChange={(checked) =>
                        setFormPlantilla({ ...formPlantilla, export_pdf: !!checked })
                      }
                    />
                    <Label className="text-sm">PDF</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formPlantilla.export_docx || false}
                      onCheckedChange={(checked) =>
                        setFormPlantilla({ ...formPlantilla, export_docx: !!checked })
                      }
                    />
                    <Label className="text-sm">DOCX</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formPlantilla.requiere_firma || false}
                      onCheckedChange={(checked) =>
                        setFormPlantilla({ ...formPlantilla, requiere_firma: !!checked })
                      }
                    />
                    <Label className="text-sm">Firma</Label>
                  </div>
                </div>

                <Button
                  onClick={handleGuardarPlantilla}
                  disabled={crearPlantilla.isPending || actualizarPlantilla.isPending}
                  className="w-full"
                >
                  {selectedPlantillaId ? 'Actualizar' : 'Crear'} Plantilla
                </Button>
              </TabsContent>

              {/* TAB: CAMPOS */}
              <TabsContent value="campos" className="space-y-4">
                {!selectedPlantillaId ? (
                  <p className="text-sm text-muted-foreground">Selecciona una plantilla primero</p>
                ) : (
                  <>
                    <div className="space-y-4 border-b pb-4">
                      <div className="font-medium text-sm">Agregar Campo</div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          placeholder="Código"
                          value={newCampo.codigo || ''}
                          onChange={(e) =>
                            setNewCampo({ ...newCampo, codigo: e.target.value })
                          }
                        />
                        <Input
                          placeholder="Nombre"
                          value={newCampo.nombre || ''}
                          onChange={(e) =>
                            setNewCampo({ ...newCampo, nombre: e.target.value })
                          }
                        />
                      </div>
                      <Select
                        value={newCampo.tipo}
                        onValueChange={(value: any) =>
                          setNewCampo({ ...newCampo, tipo: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Texto</SelectItem>
                          <SelectItem value="number">Número</SelectItem>
                          <SelectItem value="date">Fecha</SelectItem>
                          <SelectItem value="select">Selección</SelectItem>
                          <SelectItem value="checkbox">Checkbox</SelectItem>
                          <SelectItem value="signature">Firma</SelectItem>
                          <SelectItem value="table">Tabla</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={handleAgregarCampo} className="w-full">
                        <Plus className="w-4 h-4 mr-2" /> Agregar Campo
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="font-medium text-sm">Campos Existentes</div>
                      {selectedPlantilla?.campos?.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Sin campos aún</p>
                      ) : (
                        selectedPlantilla?.campos?.map((campo) => (
                          <div
                            key={campo.id}
                            className="p-3 border rounded-lg flex justify-between items-center"
                          >
                            <div>
                              <div className="font-sm text-sm">{campo.nombre}</div>
                              <div className="text-xs text-muted-foreground">
                                {campo.tipo}
                                {campo.requerido && ' • Requerido'}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                campo.id && eliminarCampo.mutateAsync(campo.id)
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </TabsContent>

              {/* TAB: PREVIEW */}
              <TabsContent value="preview" className="space-y-4">
                <div className="border rounded-lg p-4 bg-white">
                  <div
                    dangerouslySetInnerHTML={{ __html: formPlantilla.contenido_html || '' }}
                    className="prose prose-sm max-w-none"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlantillasEditorAvanzado;
