import React, { useState } from 'react';
import { useHosixCitas } from '@/hooks/useHosixCitas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Monitor, RefreshCw, Settings } from 'lucide-react';
import PantallaEsperaConsulta from './PantallaEsperaConsulta';

interface SalaEsperaDisplay {
  id: string;
  nombre: string;
  agendaId?: string;
  ubicacion: string;
  estado: 'activo' | 'pausado' | 'offline';
  ultimaActualizacion: Date;
}

export const SalaEsperaManager: React.FC = () => {
  const { agendas } = useHosixCitas();
  const [displays, setDisplays] = useState<SalaEsperaDisplay[]>([
    {
      id: '1',
      nombre: 'Pantalla 1',
      agendaId: undefined,
      ubicacion: 'Recepción',
      estado: 'activo',
      ultimaActualizacion: new Date(),
    },
    {
      id: '2',
      nombre: 'Pantalla 2',
      agendaId: undefined,
      ubicacion: 'Pasillo A',
      estado: 'activo',
      ultimaActualizacion: new Date(),
    },
  ]);
  const [selectedDisplay, setSelectedDisplay] = useState<string>('1');
  const [showSettings, setShowSettings] = useState(false);
  const [displaySettings, setDisplaySettings] = useState({ autoRefresh: 30000, volumen: 50 });

  const updateDisplay = (id: string, updates: Partial<SalaEsperaDisplay>) => {
    setDisplays(d => d.map(display => display.id === id ? { ...display, ...updates, ultimaActualizacion: new Date() } : display));
  };

  const addDisplay = () => {
    const newId = String(Math.max(...displays.map(d => parseInt(d.id)), 0) + 1);
    setDisplays([...displays, {
      id: newId,
      nombre: `Pantalla ${newId}`,
      agendaId: undefined,
      ubicacion: 'Nueva ubicación',
      estado: 'activo',
      ultimaActualizacion: new Date(),
    }]);
    setSelectedDisplay(newId);
  };

  const removeDisplay = (id: string) => {
    setDisplays(d => d.filter(display => display.id !== id));
    if (selectedDisplay === id) setSelectedDisplay(displays[0]?.id || '1');
  };

  const currentDisplay = displays.find(d => d.id === selectedDisplay);

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, any> = {
      activo: { variant: 'default', color: 'bg-green-100 text-green-800' },
      pausado: { variant: 'secondary', color: 'bg-yellow-100 text-yellow-800' },
      offline: { variant: 'destructive', color: 'bg-red-100 text-red-800' },
    };
    return variants[estado] || variants.activo;
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Sala de Espera</h1>
          <p className="text-slate-600 mt-1">Controla múltiples pantallas de espera y displays</p>
        </div>
        <div className="space-x-2">
          <Button onClick={addDisplay} variant="outline">+ Agregar Pantalla</Button>
          <Button onClick={() => setShowSettings(true)} variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Tabs de vistas */}
      <Tabs value={selectedDisplay} onValueChange={setSelectedDisplay} className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(displays.length, 5)}, 1fr)` }}>
          {displays.map(display => (
            <TabsTrigger key={display.id} value={display.id} className="relative">
              <Monitor className="h-4 w-4 mr-2" />
              {display.nombre}
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {display.estado === 'activo' ? '●' : '○'}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Contenido de pantalla */}
        {displays.map(display => (
          <TabsContent key={display.id} value={display.id} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{display.nombre}</CardTitle>
                    <CardDescription>{display.ubicacion}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getEstadoBadge(display.estado).color}>
                      {display.estado}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newEstado = display.estado === 'activo' ? 'pausado' : display.estado === 'pausado' ? 'offline' : 'activo';
                        updateDisplay(display.id, { estado: newEstado as any });
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Cambiar Estado
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateDisplay(display.id, { ultimaActualizacion: new Date() })}
                    >
                      Refrescar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeDisplay(display.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`agenda-${display.id}`}>Agenda Asignada</Label>
                    <Select value={display.agendaId || ''} onValueChange={(value) => updateDisplay(display.id, { agendaId: value || undefined })}>
                      <SelectTrigger id={`agenda-${display.id}`}>
                        <SelectValue placeholder="Seleccionar agenda" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas las agendas</SelectItem>
                        {(agendas.data || []).map(agenda => (
                          <SelectItem key={agenda.id} value={agenda.id}>
                            {agenda.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor={`ubicacion-${display.id}`}>Ubicación</Label>
                    <Input
                      id={`ubicacion-${display.id}`}
                      value={display.ubicacion}
                      onChange={(e) => updateDisplay(display.id, { ubicacion: e.target.value })}
                    />
                  </div>
                </div>
                <div className="text-sm text-slate-600">
                  Última actualización: {display.ultimaActualizacion.toLocaleTimeString('es-ES')}
                </div>
              </CardContent>
            </Card>

            {/* Previsualización de pantalla si está activa */}
            {display.estado === 'activo' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Previsualización en Vivo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-black rounded-lg overflow-hidden shadow-lg" style={{ aspectRatio: '16/9' }}>
                    <PantallaEsperaConsulta 
                      agendaId={display.agendaId} 
                      autoRefresh={displaySettings.autoRefresh}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Diálogo de configuración global */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuración Global de Pantallas</DialogTitle>
            <DialogDescription>Ajusta los parámetros de todas las pantallas de espera</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="autoRefresh">Intervalo de actualización (ms)</Label>
              <Input
                id="autoRefresh"
                type="number"
                value={displaySettings.autoRefresh}
                onChange={(e) => setDisplaySettings({ ...displaySettings, autoRefresh: parseInt(e.target.value) })}
                min="5000"
                step="5000"
              />
              <p className="text-xs text-slate-600 mt-1">Recomendado: 30000ms (30 segundos)</p>
            </div>
            <div>
              <Label htmlFor="volumen">Volumen de anuncios (%)</Label>
              <Input
                id="volumen"
                type="range"
                value={displaySettings.volumen}
                onChange={(e) => setDisplaySettings({ ...displaySettings, volumen: parseInt(e.target.value) })}
                min="0"
                max="100"
              />
              <p className="text-xs text-slate-600 mt-1">{displaySettings.volumen}%</p>
            </div>
          </div>
          <Button onClick={() => setShowSettings(false)} className="w-full">Guardar Cambios</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalaEsperaManager;
