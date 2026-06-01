import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Activity,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/app/supabase';

interface CasoResumen {
  total: number;
  confirmados: number;
  sospechosos: number;
  recuperados: number;
  fallecidos: number;
}

interface AlertaResumen {
  total_abiertas: number;
  criticas: number;
  altas: number;
  brotes_activos: number;
}

export const DashboardEpidemiologico: React.FC = () => {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('mes');

  // Query: Resumen de casos
  const { data: casosCasi = {} as CasoResumen } = useQuery({
    queryKey: ['casos-resumen'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_casos_epidemiologicos')
        .select('estado, resultado_final');

      if (error) throw error;

      const resumen = (data as any[]).reduce(
        (acc, caso) => ({
          total: acc.total + 1,
          confirmados:
            acc.confirmados + (caso.estado === 'confirmado' ? 1 : 0),
          sospechosos:
            acc.sospechosos + (caso.estado === 'sospechoso' ? 1 : 0),
          recuperados:
            acc.recuperados + (caso.resultado_final === 'recuperado' ? 1 : 0),
          fallecidos:
            acc.fallecidos + (caso.resultado_final === 'fallecido' ? 1 : 0),
        }),
        {
          total: 0,
          confirmados: 0,
          sospechosos: 0,
          recuperados: 0,
          fallecidos: 0,
        }
      );

      return resumen as CasoResumen;
    },
  });

  // Query: Alertas
  const { data: alertasResumen = {} as AlertaResumen } = useQuery({
    queryKey: ['alertas-resumen'],
    queryFn: async () => {
      const { data: alertas, error: errorAlertas } = await supabase
        .from('hosix_alertas_epidemiologicas')
        .select('estado, severidad');

      const { data: brotes, error: errorBrotes } = await supabase
        .from('hosix_brotes_epidemiologicos')
        .select('estado')
        .eq('estado', 'activo');

      if (errorAlertas || errorBrotes) throw errorAlertas || errorBrotes;

      const alertasData = alertas as any[];
      const brotesData = brotes as any[];

      return {
        total_abiertas: alertasData.filter((a) => a.estado === 'abierta').length,
        criticas: alertasData.filter((a) => a.severidad === 'crítica').length,
        altas: alertasData.filter((a) => a.severidad === 'alta').length,
        brotes_activos: brotesData.length,
      };
    },
  });

  // Query: Tendencia de casos últimos 30 días
  const { data: tendenciaCasos = [] } = useQuery({
    queryKey: ['tendencia-casos', periodoSeleccionado],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_casos_epidemiologicos')
        .select('fecha_sintomas, estado');

      if (error) throw error;

      // Agrupar por fecha
      const agrupado = (data as any[]).reduce((acc, caso) => {
        const fecha = new Date(caso.fecha_sintomas)
          .toISOString()
          .split('T')[0];
        const existing = acc.find((d) => d.fecha === fecha);

        if (existing) {
          existing.total += 1;
          if (caso.estado === 'confirmado') existing.confirmados += 1;
        } else {
          acc.push({
            fecha,
            total: 1,
            confirmados: caso.estado === 'confirmado' ? 1 : 0,
          });
        }
        return acc;
      }, [] as any[]);

      return agrupado.slice(-30);
    },
  });

  // Query: Enfermedades más notificadas
  const { data: enfermedadesTop = [] } = useQuery({
    queryKey: ['enfermedades-top'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_casos_epidemiologicos')
        .select('enfermedad_id, hosix_enfermedades_notificables(nombre)');

      if (error) throw error;

      const agrupado = (data as any[]).reduce((acc, caso) => {
        const enfermedad = caso.hosix_enfermedades_notificables?.nombre;
        const existing = acc.find((e) => e.nombre === enfermedad);

        if (existing) {
          existing.casos += 1;
        } else {
          acc.push({
            nombre: enfermedad,
            casos: 1,
          });
        }
        return acc;
      }, [] as any[]);

      return agrupado.sort((a, b) => b.casos - a.casos).slice(0, 5);
    },
  });

  // Query: Alertas críticas abiertas
  const { data: alertasCriticas = [] } = useQuery({
    queryKey: ['alertas-criticas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_alertas_epidemiologicas')
        .select(
          'id, tipo_alerta, descripcion, severidad, casos_asociados, hosix_enfermedades_notificables(nombre)'
        )
        .eq('estado', 'abierta')
        .eq('severidad', 'crítica')
        .order('fecha_alerta', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as any[];
    },
  });

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="w-6 h-6" />
          Control Epidemiológico
        </h2>
      </div>

      {/* =============== KPIs PRINCIPALES =============== */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Casos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{casosCasi.total}</p>
            <p className="text-xs text-slate-500">Notificados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Confirmados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {casosCasi.confirmados}
            </p>
            <p className="text-xs text-slate-500">
              {((casosCasi.confirmados / casosCasi.total) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recuperados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {casosCasi.recuperados}
            </p>
            <p className="text-xs text-slate-500">Recuperación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Fallecidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-800">
              {casosCasi.fallecidos}
            </p>
            <p className="text-xs text-slate-500">Mortalidad</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Brotes Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {alertasResumen.brotes_activos}
            </p>
            <p className="text-xs text-slate-500">En monitoreo</p>
          </CardContent>
        </Card>
      </div>

      {/* =============== ALERTA CRÍTICA =============== */}
      {alertasResumen.criticas > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>⚠️ ALERTAS CRÍTICAS ABIERTAS</AlertTitle>
          <AlertDescription>
            {alertasResumen.criticas} alerta(s) crítica(s) requieren atención
            inmediata
          </AlertDescription>
        </Alert>
      )}

      {/* =============== TABS =============== */}
      <Tabs defaultValue="tendencia" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tendencia">Tendencia</TabsTrigger>
          <TabsTrigger value="enfermedades">Enfermedades</TabsTrigger>
          <TabsTrigger value="alertas">Alertas Críticas</TabsTrigger>
        </TabsList>

        {/* TAB: TENDENCIA */}
        <TabsContent value="tendencia" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Casos (Últimos 30 días)</CardTitle>
            </CardHeader>
            <CardContent>
              {tendenciaCasos.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={tendenciaCasos}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#ef4444"
                      name="Total"
                    />
                    <Line
                      type="monotone"
                      dataKey="confirmados"
                      stroke="#dc2626"
                      name="Confirmados"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  Sin datos disponibles
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: ENFERMEDADES */}
        <TabsContent value="enfermedades" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Enfermedades Notificadas</CardTitle>
            </CardHeader>
            <CardContent>
              {enfermedadesTop.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={enfermedadesTop}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="casos" fill="#0ea5e9" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  Sin datos disponibles
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: ALERTAS CRÍTICAS */}
        <TabsContent value="alertas" className="mt-4">
          <div className="space-y-3">
            {alertasCriticas.length === 0 ? (
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center text-slate-500 py-8">
                    Sin alertas críticas abiertas
                  </div>
                </CardContent>
              </Card>
            ) : (
              alertasCriticas.map((alerta) => (
                <Card key={alerta.id} className="border-l-4 border-l-red-600">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="destructive">CRÍTICA</Badge>
                          <span className="font-semibold">
                            {alerta.hosix_enfermedades_notificables?.nombre}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                          {alerta.descripcion}
                        </p>
                        <div className="flex gap-4 text-xs text-slate-500">
                          <span>
                            Tipo: {alerta.tipo_alerta.replace('_', ' ')}
                          </span>
                          <span>Casos: {alerta.casos_asociados}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardEpidemiologico;
