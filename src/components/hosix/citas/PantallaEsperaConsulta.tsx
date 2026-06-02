import React, { useEffect, useState } from 'react';
import { useHosixCitas } from '@/hooks/useHosixCitas';
import { useHosixPacientes } from '@/hooks/useHosixPacientes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Users, AlertCircle, CheckCircle, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PantallaEsperaConsultaProps {
  agendaId?: string;
  autoRefresh?: number; // ms, default 30000
}

export const PantallaEsperaConsulta: React.FC<PantallaEsperaConsultaProps> = ({ 
  agendaId, 
  autoRefresh = 30000 
}) => {
  const { citas } = useHosixCitas();
  const { pacientes } = useHosixPacientes();
  const [ahora, setAhora] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  // Refrescar vista cada N ms
  useEffect(() => {
    const interval = setInterval(() => {
      setAhora(new Date());
      setRefreshKey(prev => prev + 1);
    }, autoRefresh);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Filtrar citas en espera (confirmada, en_proceso)
  const citasEnEspera = (citas.data || []).filter(cita => {
    const matchesAgenda = !agendaId || cita.agenda_id === agendaId;
    const matchesEstado = ['confirmada', 'en_proceso'].includes(cita.estado);
    const citaFecha = new Date(cita.fecha_hora);
    const hoy = new Date();
    const matchesHoy = 
      citaFecha.getFullYear() === hoy.getFullYear() &&
      citaFecha.getMonth() === hoy.getMonth() &&
      citaFecha.getDate() === hoy.getDate();
    return matchesAgenda && matchesEstado && matchesHoy;
  }).sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime());

  const citasProximas = citasEnEspera.slice(0, 5);
  const totalEnEspera = citasEnEspera.length;

  const calcularTiempoEspera = (fechaHora: string): string => {
    const cita = new Date(fechaHora);
    const minutos = Math.floor((ahora.getTime() - cita.getTime()) / 60000);
    if (minutos < 1) return 'Próximamente';
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    return `${horas}h ${minutos % 60}min`;
  };

  const getAlertaEspera = (minutos: number) => {
    if (minutos > 60) return { tipo: 'urgente', label: 'Alerta - Espera prolongada' };
    if (minutos > 30) return { tipo: 'warning', label: 'Tiempo de espera elevado' };
    return { tipo: 'normal', label: 'Tiempo de espera normal' };
  };

  const getPacienteNombre = (pacienteId: string) => {
    const p = pacientes.data?.find(pac => pac.id === pacienteId);
    return p ? `${p.primer_nombre} ${p.primer_apellido}` : 'Desconocido';
  };

  return (
    <div className="space-y-6 p-4 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Encabezado con hora actual y total en espera */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">Sala de Espera</h1>
          <p className="text-lg text-slate-600 mt-1">
            {ahora.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold text-blue-600">{totalEnEspera}</div>
          <p className="text-lg text-slate-600">Pacientes en espera</p>
          <p className="text-2xl font-mono text-slate-700 mt-2">
            {ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Alertas de espera prolongada */}
      {citasEnEspera.some(c => {
        const minutos = Math.floor((ahora.getTime() - new Date(c.fecha_hora).getTime()) / 60000);
        return minutos > 60;
      }) && (
        <Alert className="border-2 border-red-500 bg-red-50">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-700 font-semibold ml-2">
            ⚠️ Hay pacientes esperando más de 1 hora. Considere revisar si se requiere atención adicional.
          </AlertDescription>
        </Alert>
      )}

      {/* Vista principal - Paciente actual y próximos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Paciente Actual / Próximo */}
        <div className="lg:col-span-2">
          <Card className="border-4 border-green-500 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardTitle className="text-2xl flex items-center gap-2">
                <CheckCircle className="h-8 w-8" />
                PRÓXIMO PACIENTE
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              {citasProximas.length > 0 ? (
                <div className="space-y-6">
                  {/* Paciente principal */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border-2 border-blue-300">
                    <h2 className="text-4xl font-bold text-blue-900">
                      {getPacienteNombre(citasProximas[0].paciente_id)}
                    </h2>
                    <div className="mt-4 space-y-2 text-lg">
                      <p><span className="font-semibold text-slate-700">Hora de cita:</span> {new Date(citasProximas[0].fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                      <p><span className="font-semibold text-slate-700">Tiempo esperando:</span> <span className="text-2xl font-bold text-orange-600">{calcularTiempoEspera(citasProximas[0].fecha_hora)}</span></p>
                      <p><span className="font-semibold text-slate-700">Motivo:</span> {citasProximas[0].motivo || 'No especificado'}</p>
                      {citasProximas[0].es_teleconsulta && (
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-base">
                          🎥 Teleconsulta
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Siguientes pacientes (lista resumida) */}
                  {citasProximas.length > 1 && (
                    <div className="mt-6 border-t-2 border-slate-300 pt-4">
                      <h3 className="font-semibold text-slate-700 mb-3">Siguientes en la fila:</h3>
                      <div className="space-y-2">
                        {citasProximas.slice(1, 4).map((cita, idx) => (
                          <div key={cita.id} className="flex items-center gap-4 p-3 bg-slate-100 rounded-lg">
                            <span className="text-xl font-bold text-slate-500 w-8">{idx + 2}.</span>
                            <span className="flex-1 font-semibold text-slate-800">{getPacienteNombre(cita.paciente_id)}</span>
                            <Badge variant="secondary">{new Date(cita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-600">
                  <Users className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                  <p className="text-xl">No hay pacientes en espera</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel de estadísticas */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="bg-slate-100">
              <CardTitle className="text-lg">Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{totalEnEspera}</div>
                <p className="text-sm text-slate-600 mt-1">Total en espera</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{Math.min(1, citasProximas.length)}</div>
                <p className="text-sm text-slate-600 mt-1">Siendo atendido</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">{Math.max(0, totalEnEspera - 1)}</div>
                <p className="text-sm text-slate-600 mt-1">Pendientes</p>
              </div>
            </CardContent>
          </Card>

          {/* Control de volumen para anuncios */}
          <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
            <Volume2 className="h-4 w-4 mr-2" />
            Anunciar Paciente
          </Button>
        </div>
      </div>

      {/* Footer con actualización automática */}
      <div className="text-center text-sm text-slate-600 mt-8 pt-4 border-t border-slate-300">
        <p>Pantalla de espera - Se actualiza automáticamente cada 30 segundos</p>
      </div>
    </div>
  );
};

export default PantallaEsperaConsulta;
