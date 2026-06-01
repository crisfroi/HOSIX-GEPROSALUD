import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  AlertTriangle,
  TrendingUp,
  FileText,
  Download,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/app/supabase';

interface Deuda {
  id: string;
  paciente_id: string;
  paciente_nombre: string;
  aseguradora_id: string;
  aseguradora_nombre: string;
  total_facturado: number;
  total_pagado: number;
  saldo_pendiente: number;
  dias_mora: number;
  porcentaje_morosidad: number;
  estado: string;
  fecha_ultima_factura: string;
}

interface ResumenDeudas {
  total_facturado: number;
  total_cobrado: number;
  total_pendiente: number;
  cantidad_cuentas_mora: number;
  porcentaje_cobranza: number;
}

export const FacturacionDeudasManager: React.FC = () => {
  const [selectedAseguradora, setSelectedAseguradora] = useState('');
  const [filtroMora, setFiltroMora] = useState('todas');

  // Query: Resumen de deudas
  const { data: resumen } = useQuery({
    queryKey: ['resumen-deudas'],
    queryFn: async () => {
      const { data: cuentas, error } = await supabase
        .from('hosix_facturacion_cuentas')
        .select('total_facturado, total_pagado, saldo_pendiente');

      if (error) throw error;

      const totales = cuentas.reduce(
        (acc, cuenta) => ({
          total_facturado: acc.total_facturado + (cuenta.total_facturado || 0),
          total_cobrado: acc.total_cobrado + (cuenta.total_pagado || 0),
          total_pendiente:
            acc.total_pendiente + (cuenta.saldo_pendiente || 0),
        }),
        {
          total_facturado: 0,
          total_cobrado: 0,
          total_pendiente: 0,
        }
      );

      return {
        ...totales,
        cantidad_cuentas_mora: cuentas.filter((c) => c.saldo_pendiente > 0)
          .length,
        porcentaje_cobranza:
          totales.total_facturado > 0
            ? ((totales.total_cobrado / totales.total_facturado) * 100).toFixed(2)
            : 0,
      } as ResumenDeudas;
    },
  });

  // Query: Deudas detalladas
  const { data: deudas = [], isLoading } = useQuery({
    queryKey: ['deudas-detalladas', selectedAseguradora, filtroMora],
    queryFn: async () => {
      let query = supabase
        .from('hosix_facturacion_cuentas')
        .select(
          `
          id,
          numero_cuenta,
          paciente_id,
          aseguradora_id,
          total_facturado,
          total_pagado,
          saldo_pendiente,
          fecha_apertura,
          estado,
          hosix_pacientes(id, nombre),
          hosix_aseguradoras(id, nombre)
        `
        );

      if (selectedAseguradora) {
        query = query.eq('aseguradora_id', selectedAseguradora);
      }

      const { data, error } = await query.order('saldo_pendiente', {
        ascending: false,
      });

      if (error) throw error;

      return (data as any[]).map((cuenta) => ({
        id: cuenta.id,
        paciente_id: cuenta.paciente_id,
        paciente_nombre: cuenta.hosix_pacientes?.nombre || 'Sin nombre',
        aseguradora_id: cuenta.aseguradora_id,
        aseguradora_nombre: cuenta.hosix_aseguradoras?.nombre || 'Sin aseguradora',
        total_facturado: cuenta.total_facturado || 0,
        total_pagado: cuenta.total_pagado || 0,
        saldo_pendiente: cuenta.saldo_pendiente || 0,
        dias_mora: Math.floor(
          (new Date().getTime() - new Date(cuenta.fecha_apertura).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
        porcentaje_morosidad:
          cuenta.total_facturado > 0
            ? ((cuenta.saldo_pendiente / cuenta.total_facturado) * 100).toFixed(2)
            : 0,
        estado: cuenta.estado,
        fecha_ultima_factura: cuenta.fecha_apertura,
      })) as Deuda[];
    },
  });

  // Query: Aseguradoras
  const { data: aseguradoras = [] } = useQuery({
    queryKey: ['aseguradoras-para-deudas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_aseguradoras')
        .select('id, nombre')
        .eq('activo', true);
      if (error) throw error;
      return data;
    },
  });

  const deudasFiltradas = deudas.filter((d) => {
    if (filtroMora === 'mora' && d.saldo_pendiente === 0) return false;
    if (filtroMora === 'sin_mora' && d.saldo_pendiente > 0) return false;
    return true;
  });

  // Datos para gráficos
  const datosCobranza = resumen
    ? [
        {
          name: 'Cobrado',
          value: Number(resumen.total_cobrado),
          fill: '#22c55e',
        },
        {
          name: 'Pendiente',
          value: Number(resumen.total_pendiente),
          fill: '#ef4444',
        },
      ]
    : [];

  const datosMorosidad = deudasFiltradas
    .slice(0, 10)
    .map((d) => ({
      paciente: d.paciente_nombre.substring(0, 15),
      deuda: Number(d.saldo_pendiente),
      dias: d.dias_mora,
    }));

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <TrendingUp className="w-6 h-6" />
        Facturación y Deudas
      </h2>

      {/* =============== RESUMEN KPI =============== */}
      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Facturado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {resumen.total_facturado.toFixed(2)}
              </p>
              <p className="text-xs text-slate-500">XAF</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Cobrado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {resumen.total_cobrado.toFixed(2)}
              </p>
              <p className="text-xs text-slate-500">XAF</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Pendiente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {resumen.total_pendiente.toFixed(2)}
              </p>
              <p className="text-xs text-slate-500">XAF</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">% Cobranza</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {resumen.porcentaje_cobranza}%
              </p>
              <p className="text-xs text-slate-500">Recuperación</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* =============== ALERTA DE MOROSIDAD =============== */}
      {resumen && resumen.cantidad_cuentas_mora > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>⚠️ ALERTA DE MOROSIDAD</AlertTitle>
          <AlertDescription>
            {resumen.cantidad_cuentas_mora} cuentas con deuda pendiente por
            cobrar
          </AlertDescription>
        </Alert>
      )}

      {/* =============== GRÁFICOS =============== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfico de Cobranza */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Cobranza</CardTitle>
          </CardHeader>
          <CardContent>
            {datosCobranza.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={datosCobranza}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value.toFixed(2)}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {datosCobranza.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(2)} XAF`}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Morosidad */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Deudas por Cobrar</CardTitle>
          </CardHeader>
          <CardContent>
            {datosMorosidad.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={datosMorosidad}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="paciente" angle={-45} textAnchor="end" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(2)} XAF`}
                  />
                  <Bar dataKey="deuda" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* =============== TABLA DE DEUDAS =============== */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Detalle de Deudas</CardTitle>
            <div className="flex gap-2">
              <Select
                value={selectedAseguradora}
                onValueChange={setSelectedAseguradora}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por aseguradora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {aseguradoras.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filtroMora} onValueChange={setFiltroMora}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="mora">Con mora</SelectItem>
                  <SelectItem value="sin_mora">Sin mora</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" /> Exportar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando deudas...</div>
          ) : deudasFiltradas.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Sin deudas registradas
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Aseguradora</TableHead>
                    <TableHead>Facturado</TableHead>
                    <TableHead>Pagado</TableHead>
                    <TableHead>Pendiente</TableHead>
                    <TableHead>% Morosidad</TableHead>
                    <TableHead>Días</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deudasFiltradas.map((deuda) => (
                    <TableRow key={deuda.id}>
                      <TableCell>{deuda.paciente_nombre}</TableCell>
                      <TableCell className="text-sm">
                        {deuda.aseguradora_nombre}
                      </TableCell>
                      <TableCell className="text-right">
                        {deuda.total_facturado.toFixed(2)} XAF
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {deuda.total_pagado.toFixed(2)} XAF
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {deuda.saldo_pendiente > 0 ? (
                          <span className="text-red-600">
                            {deuda.saldo_pendiente.toFixed(2)} XAF
                          </span>
                        ) : (
                          <span className="text-green-600">0.00 XAF</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            Number(deuda.porcentaje_morosidad) > 50
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {deuda.porcentaje_morosidad}%
                        </Badge>
                      </TableCell>
                      <TableCell>{deuda.dias_mora} días</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            deuda.saldo_pendiente > 0 ? 'destructive' : 'default'
                          }
                        >
                          {deuda.saldo_pendiente > 0 ? 'Pendiente' : 'Pagado'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FacturacionDeudasManager;

