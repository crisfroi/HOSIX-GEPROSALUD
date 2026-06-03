import { useState } from 'react';
import { useHosixCodificacion, CodigoCIE, ProcedimientoMedico } from '@/hooks/useHosixCodificacion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Search, AlertCircle, ArrowRight } from 'lucide-react';

export const CodificacionManager = () => {
  const {
    codigosCIE,
    procedimientos,
    mapeos,
    isLoading,
    versionActiva,
    setVersionActiva,
    buscarCodigoCIE,
    buscarProcedimiento,
    crearCodigoCIE,
    crearProcedimiento,
    crearMapeo,
    getEquivalenciaCIE11
  } = useHosixCodificacion();

  // === STATES PARA CIE-11 ===
  const [searchCIE, setSearchCIE] = useState('');
  const [codigosEncontrados, setCodigosEncontrados] = useState<CodigoCIE[]>([]);
  const [showNewCodigoDialog, setShowNewCodigoDialog] = useState(false);
  const [newCodigoForm, setNewCodigoForm] = useState({
    version: 'CIE-11' as 'CIE-10' | 'CIE-11',
    codigo: '',
    descripcion: '',
    descripcion_corta: '',
    grupo_principal: '',
    es_primaria: true,
    activo: true
  });

  // === STATES PARA PROCEDIMIENTOS ===
  const [searchProcedimiento, setSearchProcedimiento] = useState('');
  const [procedimientosEncontrados, setProcedimientosEncontrados] = useState<ProcedimientoMedico[]>([]);
  const [showNewProcedimientoDialog, setShowNewProcedimientoDialog] = useState(false);
  const [newProcedimientoForm, setNewProcedimientoForm] = useState({
    codigo_procedimiento: '',
    descripcion: '',
    especialidad: '',
    area_quirurgica: '',
    requiere_autorizacion: false,
    tiempo_estimado_min: 0,
    requiere_ayuno: false,
    requiere_acompañante: false,
    activo: true
  });

  // === STATES PARA MAPEOS ===
  const [showMapeoDialog, setShowMapeoDialog] = useState(false);
  const [newMapeoForm, setNewMapeoForm] = useState({
    codigo_cie10: '',
    codigo_cie11: '',
    descripcion_mapeo: '',
    similitud_porcentaje: 100
  });

  // Búsqueda de códigos CIE
  const handleSearchCIE = async (termino: string) => {
    setSearchCIE(termino);
    if (termino.trim()) {
      const resultados = await buscarCodigoCIE(termino);
      setCodigosEncontrados(resultados);
    } else {
      setCodigosEncontrados([]);
    }
  };

  // Búsqueda de procedimientos
  const handleSearchProcedimiento = async (termino: string) => {
    setSearchProcedimiento(termino);
    if (termino.trim()) {
      const resultados = await buscarProcedimiento(termino);
      setProcedimientosEncontrados(resultados);
    } else {
      setProcedimientosEncontrados([]);
    }
  };

  // Crear nuevo código CIE
  const handleCrearCodigoCIE = async () => {
    if (!newCodigoForm.codigo.trim() || !newCodigoForm.descripcion.trim()) {
      alert('Código y descripción son requeridos');
      return;
    }

    try {
      await crearCodigoCIE({
        ...newCodigoForm,
        mapeo_cie10: newCodigoForm.version === 'CIE-11' ? '' : undefined,
        mapeo_cie11: newCodigoForm.version === 'CIE-10' ? '' : undefined
      });

      setNewCodigoForm({
        version: 'CIE-11',
        codigo: '',
        descripcion: '',
        descripcion_corta: '',
        grupo_principal: '',
        es_primaria: true,
        activo: true
      });
      setShowNewCodigoDialog(false);
    } catch (err) {
      console.error('Error creando código:', err);
    }
  };

  // Crear nuevo procedimiento
  const handleCrearProcedimiento = async () => {
    if (!newProcedimientoForm.codigo_procedimiento.trim() || !newProcedimientoForm.descripcion.trim()) {
      alert('Código y descripción son requeridos');
      return;
    }

    try {
      await crearProcedimiento(newProcedimientoForm);

      setNewProcedimientoForm({
        codigo_procedimiento: '',
        descripcion: '',
        especialidad: '',
        area_quirurgica: '',
        requiere_autorizacion: false,
        tiempo_estimado_min: 0,
        requiere_ayuno: false,
        requiere_acompañante: false,
        activo: true
      });
      setShowNewProcedimientoDialog(false);
    } catch (err) {
      console.error('Error creando procedimiento:', err);
    }
  };

  // Crear mapeo
  const handleCrearMapeo = async () => {
    if (!newMapeoForm.codigo_cie10.trim() || !newMapeoForm.codigo_cie11.trim()) {
      alert('Ambos códigos son requeridos');
      return;
    }

    try {
      await crearMapeo({
        codigo_cie10: newMapeoForm.codigo_cie10,
        codigo_cie11: newMapeoForm.codigo_cie11,
        descripcion_mapeo: newMapeoForm.descripcion_mapeo || undefined,
        similitud_porcentaje: newMapeoForm.similitud_porcentaje
      });

      setNewMapeoForm({
        codigo_cie10: '',
        codigo_cie11: '',
        descripcion_mapeo: '',
        similitud_porcentaje: 100
      });
      setShowMapeoDialog(false);
    } catch (err) {
      console.error('Error creando mapeo:', err);
    }
  };

  return (
    <Tabs defaultValue="cie11" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="cie11">CIE-11</TabsTrigger>
        <TabsTrigger value="procedimientos">Procedimientos</TabsTrigger>
        <TabsTrigger value="mapeos">Mapeos CIE</TabsTrigger>
      </TabsList>

      {/* TAB 1: CIE-11 */}
      <TabsContent value="cie11" className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Migración activa a CIE-11. Se soporta CIE-10 para compatibilidad hacia atrás.
          </AlertDescription>
        </Alert>

        <div className="flex gap-4 items-end mb-4">
          <div className="flex-1">
            <Label className="text-sm mb-1 block">Buscar código</Label>
            <Input
              placeholder="Código o descripción (ej: A00, Cólera)"
              value={searchCIE}
              onChange={(e) => handleSearchCIE(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Select value={versionActiva} onValueChange={(v) => setVersionActiva(v as 'CIE-10' | 'CIE-11')}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CIE-11">CIE-11</SelectItem>
              <SelectItem value="CIE-10">CIE-10</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={showNewCodigoDialog} onOpenChange={setShowNewCodigoDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Código
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Código CIE</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Versión</Label>
                  <Select
                    value={newCodigoForm.version}
                    onValueChange={(v) => setNewCodigoForm({ ...newCodigoForm, version: v as 'CIE-10' | 'CIE-11' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CIE-11">CIE-11</SelectItem>
                      <SelectItem value="CIE-10">CIE-10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Código</Label>
                  <Input
                    placeholder="ej: A00"
                    value={newCodigoForm.codigo}
                    onChange={(e) => setNewCodigoForm({ ...newCodigoForm, codigo: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Descripción</Label>
                  <Input
                    placeholder="Descripción completa"
                    value={newCodigoForm.descripcion}
                    onChange={(e) => setNewCodigoForm({ ...newCodigoForm, descripcion: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Descripción Corta</Label>
                  <Input
                    placeholder="Resumen"
                    value={newCodigoForm.descripcion_corta}
                    onChange={(e) => setNewCodigoForm({ ...newCodigoForm, descripcion_corta: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Grupo Principal</Label>
                  <Input
                    placeholder="ej: Enfermedades infecciosas"
                    value={newCodigoForm.grupo_principal}
                    onChange={(e) => setNewCodigoForm({ ...newCodigoForm, grupo_principal: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="esPrimaria"
                    checked={newCodigoForm.es_primaria}
                    onCheckedChange={(checked) => setNewCodigoForm({ ...newCodigoForm, es_primaria: checked as boolean })}
                  />
                  <Label htmlFor="esPrimaria">Es diagnóstico primario</Label>
                </div>

                <Button onClick={handleCrearCodigoCIE} className="w-full">
                  Crear
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabla de resultados o códigos cargados */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Código</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Primaria</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(codigosEncontrados.length > 0 ? codigosEncontrados : codigosCIE.slice(0, 50)).map((codigo) => (
                <TableRow key={codigo.id}>
                  <TableCell className="font-mono font-semibold text-blue-600">{codigo.codigo}</TableCell>
                  <TableCell>{codigo.descripcion}</TableCell>
                  <TableCell className="text-sm text-gray-600">{codigo.grupo_principal || '—'}</TableCell>
                  <TableCell>
                    {codigo.es_primaria ? (
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Sí</span>
                    ) : (
                      <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Secundaria</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-gray-500">
          Total: {codigosCIE.length} códigos {versionActiva}
        </p>
      </TabsContent>

      {/* TAB 2: PROCEDIMIENTOS */}
      <TabsContent value="procedimientos" className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Catálogo de procedimientos médicos quirúrgicos. Vinculable a servicios y episodios.
          </AlertDescription>
        </Alert>

        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <Label className="text-sm mb-1 block">Buscar procedimiento</Label>
            <Input
              placeholder="Código o descripción"
              value={searchProcedimiento}
              onChange={(e) => handleSearchProcedimiento(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Dialog open={showNewProcedimientoDialog} onOpenChange={setShowNewProcedimientoDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Procedimiento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Procedimiento Médico</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Código Procedimiento</Label>
                    <Input
                      placeholder="ej: CPT 99213"
                      value={newProcedimientoForm.codigo_procedimiento}
                      onChange={(e) => setNewProcedimientoForm({ ...newProcedimientoForm, codigo_procedimiento: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Especialidad</Label>
                    <Select
                      value={newProcedimientoForm.especialidad}
                      onValueChange={(v) => setNewProcedimientoForm({ ...newProcedimientoForm, especialidad: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cirugía General">Cirugía General</SelectItem>
                        <SelectItem value="Ginecología">Ginecología</SelectItem>
                        <SelectItem value="Cardiología">Cardiología</SelectItem>
                        <SelectItem value="Neurología">Neurología</SelectItem>
                        <SelectItem value="Oftalmología">Oftalmología</SelectItem>
                        <SelectItem value="Otorrinolaringología">Otorrinolaringología</SelectItem>
                        <SelectItem value="Urología">Urología</SelectItem>
                        <SelectItem value="Pediatría">Pediatría</SelectItem>
                        <SelectItem value="Traumatología">Traumatología</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Descripción</Label>
                  <Input
                    placeholder="Descripción completa del procedimiento"
                    value={newProcedimientoForm.descripcion}
                    onChange={(e) => setNewProcedimientoForm({ ...newProcedimientoForm, descripcion: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Área Quirúrgica (opcional)</Label>
                  <Input
                    placeholder="ej: Abdomen, Extremidades, Cabeza"
                    value={newProcedimientoForm.area_quirurgica || ''}
                    onChange={(e) => setNewProcedimientoForm({ ...newProcedimientoForm, area_quirurgica: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tiempo Estimado (minutos)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={newProcedimientoForm.tiempo_estimado_min || ''}
                      onChange={(e) => setNewProcedimientoForm({ ...newProcedimientoForm, tiempo_estimado_min: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requiereAutorizacion"
                      checked={newProcedimientoForm.requiere_autorizacion}
                      onCheckedChange={(checked) => setNewProcedimientoForm({ ...newProcedimientoForm, requiere_autorizacion: checked as boolean })}
                    />
                    <Label htmlFor="requiereAutorizacion">Requiere autorización previa</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requiereAyuno"
                      checked={newProcedimientoForm.requiere_ayuno}
                      onCheckedChange={(checked) => setNewProcedimientoForm({ ...newProcedimientoForm, requiere_ayuno: checked as boolean })}
                    />
                    <Label htmlFor="requiereAyuno">Requiere ayuno</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requiereAcompañante"
                      checked={newProcedimientoForm.requiere_acompañante}
                      onCheckedChange={(checked) => setNewProcedimientoForm({ ...newProcedimientoForm, requiere_acompañante: checked as boolean })}
                    />
                    <Label htmlFor="requiereAcompañante">Requiere acompañante</Label>
                  </div>
                </div>

                <Button onClick={handleCrearProcedimiento} className="w-full">
                  Crear
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabla de procedimientos */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Código</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Tiempo Est. (min)</TableHead>
                <TableHead>Autorización</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(procedimientosEncontrados.length > 0 ? procedimientosEncontrados : procedimientos.slice(0, 50)).map((proc) => (
                <TableRow key={proc.id}>
                  <TableCell className="font-mono font-semibold">{proc.codigo_procedimiento}</TableCell>
                  <TableCell className="text-sm">{proc.descripcion}</TableCell>
                  <TableCell className="text-sm text-gray-600">{proc.especialidad || '—'}</TableCell>
                  <TableCell className="text-sm">{proc.tiempo_estimado_min || '—'}</TableCell>
                  <TableCell>
                    {proc.requiere_autorizacion ? (
                      <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Sí</span>
                    ) : (
                      <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">No</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-gray-500">
          Total: {procedimientos.length} procedimientos
        </p>
      </TabsContent>

      {/* TAB 3: MAPEOS CIE-10 → CIE-11 */}
      <TabsContent value="mapeos" className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tabla de equivalencias para facilitar migración de diagnósticos existentes de CIE-10 a CIE-11.
          </AlertDescription>
        </Alert>

        <Dialog open={showMapeoDialog} onOpenChange={setShowMapeoDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear Mapeo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mapeo CIE-10 ↔ CIE-11</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Código CIE-10</Label>
                <Input
                  placeholder="ej: A00"
                  value={newMapeoForm.codigo_cie10}
                  onChange={(e) => setNewMapeoForm({ ...newMapeoForm, codigo_cie10: e.target.value })}
                />
              </div>

              <div className="flex justify-center">
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>

              <div>
                <Label>Código CIE-11</Label>
                <Input
                  placeholder="ej: 1A00"
                  value={newMapeoForm.codigo_cie11}
                  onChange={(e) => setNewMapeoForm({ ...newMapeoForm, codigo_cie11: e.target.value })}
                />
              </div>

              <div>
                <Label>Descripción del Mapeo (opcional)</Label>
                <Input
                  placeholder="Notas sobre la equivalencia"
                  value={newMapeoForm.descripcion_mapeo}
                  onChange={(e) => setNewMapeoForm({ ...newMapeoForm, descripcion_mapeo: e.target.value })}
                />
              </div>

              <div>
                <Label>Similitud (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={newMapeoForm.similitud_porcentaje}
                  onChange={(e) => setNewMapeoForm({ ...newMapeoForm, similitud_porcentaje: parseInt(e.target.value) || 100 })}
                />
              </div>

              <Button onClick={handleCrearMapeo} className="w-full">
                Crear Mapeo
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tabla de mapeos */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>CIE-10</TableHead>
                <TableHead></TableHead>
                <TableHead>CIE-11</TableHead>
                <TableHead>Similitud</TableHead>
                <TableHead>Descripción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mapeos.map((mapeo) => (
                <TableRow key={mapeo.id}>
                  <TableCell className="font-mono font-semibold">{mapeo.codigo_cie10}</TableCell>
                  <TableCell>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </TableCell>
                  <TableCell className="font-mono font-semibold text-blue-600">{mapeo.codigo_cie11}</TableCell>
                  <TableCell>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {mapeo.similitud_porcentaje || 100}%
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{mapeo.descripcion_mapeo || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-gray-500">
          Total: {mapeos.length} mapeos CIE-10 → CIE-11
        </p>
      </TabsContent>
    </Tabs>
  );
};
