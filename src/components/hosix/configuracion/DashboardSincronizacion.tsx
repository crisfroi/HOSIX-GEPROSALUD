import React, { useState, useEffect } from 'react';
import { useSyncService } from '@/services/syncService';
import { useSupabase } from '@/hooks/useSupabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Upload,
  Database,
  Users,
  Building2,
  Stethoscope,
  Wifi,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface EstadoSync {
  centros_locales: number;
  profesionales_locales: number;
  pacientes_con_hcu: number;
  pacientes_pendientes: number;
  cambios_en_cola: number;
  ultima_sincronizacion: string | null;
}

export default function DashboardSincronizacion() {
  const { supabase } = useSupabase();
  const syncService = useSyncService(supabase);
  
  const [estado, setEstado] = useState<EstadoSync | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Cargar estado inicial
  useEffect(() => {
    loadEstado();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Recargar cada 30 segundos
  useEffect(() => {
    const interval = setInterval(loadEstado, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadEstado = async () => {
    try {
      const estadoActual = await syncService.obtenerEstadoSync();
      setEstado(estadoActual || {
        centros_locales: 0,
        profesionales_locales: 0,
        pacientes_con_hcu: 0,
        pacientes_pendientes: 0,
        cambios_en_cola: 0,
        ultima_sincronizacion: null
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Error cargando estado:', error);
      setEstado({
        centros_locales: 0,
        profesionales_locales: 0,
        pacientes_con_hcu: 0,
        pacientes_pendientes: 0,
        cambios_en_cola: 0,
        ultima_sincronizacion: null
      });
      setIsLoading(false);
    }
  };

  const handleInicializar = async () => {
    setIsInitializing(true);
    try {
      const resultado = await syncService.inicializarHospitalLocal();
      
      if (resultado.exitoso) {
        toast.success(
          `Hospital inicializado: ${resultado.distritos} distritos, ${resultado.centros} centros, ${resultado.profesionales} profesionales, ${resultado.pacientes} pacientes`
        );
        await loadEstado();
      } else {
        toast.error(`Error: ${resultado.error}`);
      }
    } catch (error: any) {
      toast.error(`Error al inicializar: ${error.message}`);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSincronizar = async () => {
    if (!isOnline) {
      toast.error('Sin conexión a internet. Espere a que se restaure la conexión.');
      return;
    }

    setIsSyncing(true);
    try {
      const resultado = await syncService.sincronizar();
      
      if (resultado.exitoso) {
        toast.success(`Sincronización completada: ${resultado.sincronizados} cambios procesados`);
        setLastSync(new Date().toLocaleString());
        await loadEstado();
      } else {
        toast.error(`Error en sincronización: ${resultado.error}`);
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-sm text-gray-600">Cargando estado de sincronización...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estado de Conexión */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              <CardTitle>Estado de Conexión</CardTitle>
            </div>
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? '🟢 En línea' : '🔴 Offline'}
            </Badge>
          </div>
          <CardDescription>
            {isOnline
              ? 'Hospital conectado a Nodo Central (RENAPROSA)'
              : 'Modo offline: operando con copia local'}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Info: Si no hay datos */}
      {estado && estado.centros_locales === 0 && estado.profesionales_locales === 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            <strong>Nota:</strong> Las tablas locales de sincronización aún no están inicializadas.
            Haz clic en "Descargar Referencias" para crear la copia local de datos maestros.
          </AlertDescription>
        </Alert>
      )}

      {/* Acciones Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          onClick={handleInicializar} 
          disabled={isInitializing || !isOnline}
          className="gap-2"
          size="lg"
        >
          <Download className="h-4 w-4" />
          {isInitializing ? 'Inicializando...' : 'Descargar Referencias'}
        </Button>
        
        <Button 
          onClick={handleSincronizar} 
          disabled={isSyncing || !isOnline}
          className="gap-2"
          size="lg"
          variant={isOnline ? 'default' : 'secondary'}
        >
          <Upload className="h-4 w-4" />
          {isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
        </Button>
      </div>

      {!isOnline && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            Sin conexión a internet. Las acciones de sincronización no están disponibles. Los cambios se guardarán localmente.
          </AlertDescription>
        </Alert>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Centros de Salud */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                <Building2 className="h-4 w-4 inline mr-2" />
                Centros de Salud
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estado?.centros_locales || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Sincronizados localmente</p>
          </CardContent>
        </Card>

        {/* Profesionales */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                <Stethoscope className="h-4 w-4 inline mr-2" />
                Profesionales
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estado?.profesionales_locales || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Activos en hospital</p>
          </CardContent>
        </Card>

        {/* Pacientes con HCU */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                <Users className="h-4 w-4 inline mr-2" />
                Pacientes (HCU Real)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estado?.pacientes_con_hcu || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Con HCU sincronizado</p>
          </CardContent>
        </Card>

        {/* Pacientes Pendientes */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                <Clock className="h-4 w-4 inline mr-2" />
                Pacientes (Temporal)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{estado?.pacientes_pendientes || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Con HCU temporal (offline)</p>
          </CardContent>
        </Card>

        {/* Cambios en Cola */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                <Database className="h-4 w-4 inline mr-2" />
                Cambios Pendientes
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(estado?.cambios_en_cola || 0) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {estado?.cambios_en_cola || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">En cola de sincronización</p>
          </CardContent>
        </Card>

        {/* Última Sincronización */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                <RefreshCw className="h-4 w-4 inline mr-2" />
                Última Sincronización
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono">
              {lastSync || estado?.ultima_sincronizacion 
                ? new Date(lastSync || estado?.ultima_sincronizacion || '').toLocaleString() 
                : 'Nunca'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Con Nodo Central</p>
          </CardContent>
        </Card>
      </div>

      {/* Resumen Operativo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen Operativo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="text-sm font-medium">Base de datos local:</span>
            <Badge variant="outline">
              {(estado?.centros_locales || 0) + (estado?.profesionales_locales || 0) + (estado?.pacientes_con_hcu || 0)} registros maestro
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="text-sm font-medium">Pacientes offline:</span>
            <Badge variant={estado?.pacientes_pendientes ? 'secondary' : 'outline'}>
              {estado?.pacientes_pendientes || 0} (HCU temporal)
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="text-sm font-medium">Estado de sincronización:</span>
            <div className="flex items-center gap-1">
              {estado?.cambios_en_cola === 0 ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-600" />
              )}
              <Badge variant={estado?.cambios_en_cola === 0 ? 'outline' : 'secondary'}>
                {estado?.cambios_en_cola === 0 ? 'Sincronizado' : `${estado?.cambios_en_cola} cambios pendientes`}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700 text-sm">
          <strong>Nota:</strong> La sincronización automática se ejecuta cuando la conexión se restaura después de estar offline. 
          Puede forzar una sincronización manual usando el botón "Sincronizar Ahora".
        </AlertDescription>
      </Alert>
    </div>
  );
}
