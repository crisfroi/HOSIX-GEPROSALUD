import React from 'react';
import {
  Users,
  AlertCircle,
  Calendar,
  Stethoscope,
  TrendingUp,
  Activity,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SermedLogo } from '@/components/SermedLogo';

const HosixDashboard: React.FC = () => {
  const kpis = [
    {
      title: 'Pacientes Totales',
      value: '2,847',
      icon: Users,
      trend: '+12.5%',
      color: 'bg-sermed-blue',
      trendPositive: true,
    },
    {
      title: 'Urgencias Hoy',
      value: '34',
      icon: AlertCircle,
      trend: '+5.2%',
      color: 'bg-red-500',
      trendPositive: true,
    },
    {
      title: 'Citas Programadas',
      value: '156',
      icon: Calendar,
      trend: '+2.1%',
      color: 'bg-sermed-green',
      trendPositive: true,
    },
    {
      title: 'Camas Ocupadas',
      value: '45/60',
      icon: Stethoscope,
      trend: '-3.5%',
      color: 'bg-yellow-500',
      trendPositive: false,
    },
  ];

  const chartData = [
    { name: 'Ene', pacientes: 400, urgencias: 24, citas: 240 },
    { name: 'Feb', pacientes: 450, urgencias: 30, citas: 220 },
    { name: 'Mar', pacientes: 480, urgencias: 28, citas: 250 },
    { name: 'Abr', pacientes: 520, urgencias: 35, citas: 280 },
    { name: 'May', pacientes: 550, urgencias: 40, citas: 310 },
    { name: 'Jun', pacientes: 600, urgencias: 38, citas: 340 },
  ];

  const departmentData = [
    { name: 'Medicina General', value: 35, fill: '#0066CC' },
    { name: 'Cirugía', value: 25, fill: '#00B050' },
    { name: 'Pediatría', value: 20, fill: '#FF6B6B' },
    { name: 'Cardiología', value: 20, fill: '#FFC107' },
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* Header with Logo */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SermedLogo size="md" />
          <div>
            <h1 className="text-3xl font-bold text-sermed-blue">Dashboard Sermed Logistic</h1>
            <p className="text-sermed-blue/60 mt-1">
              Sistema Integral de Gestión Sanitaria
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow border-sermed-blue/10">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-sermed-blue/70">
                    {kpi.title}
                  </CardTitle>
                  <div className={`${kpi.color} rounded-full p-2`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-sermed-blue">{kpi.value}</div>
                <div className="flex items-center gap-1 mt-2">
                  {kpi.trendPositive ? (
                    <ArrowUp className="w-3 h-3 text-sermed-green" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-red-500" />
                  )}
                  <p className={`text-xs font-medium ${kpi.trendPositive ? 'text-sermed-green' : 'text-red-500'}`}>
                    {kpi.trend} vs mes anterior
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <Card className="lg:col-span-2 border-sermed-blue/10">
          <CardHeader>
            <CardTitle className="text-sermed-blue">Tendencia de Actividad</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                  cursor={{ strokeDasharray: '3 3' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="pacientes"
                  stroke="#0066CC"
                  strokeWidth={2}
                  dot={{ fill: '#0066CC' }}
                  name="Pacientes"
                />
                <Line
                  type="monotone"
                  dataKey="urgencias"
                  stroke="#FF6B6B"
                  strokeWidth={2}
                  dot={{ fill: '#FF6B6B' }}
                  name="Urgencias"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card className="border-sermed-blue/10">
          <CardHeader>
            <CardTitle className="text-sermed-blue">Distribución por Área</CardTitle>
            <CardDescription>Pacientes activos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="lg:col-span-2 border-sermed-blue/10">
          <CardHeader>
            <CardTitle className="text-sermed-blue">Actividad Reciente</CardTitle>
            <CardDescription>Últimas acciones en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 pb-4 border-b border-sermed-blue/10">
                <div className="bg-sermed-blue/10 rounded-full p-2 mt-1">
                  <Users className="w-4 h-4 text-sermed-blue" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-sermed-blue">Nuevo paciente registrado</p>
                  <p className="text-xs text-gray-500">Juan Carlos López - Hace 2 horas</p>
                </div>
              </div>

              <div className="flex items-start gap-4 pb-4 border-b border-sermed-blue/10">
                <div className="bg-sermed-green/10 rounded-full p-2 mt-1">
                  <AlertCircle className="w-4 h-4 text-sermed-green" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-sermed-blue">Urgencia asignada a Dr. González</p>
                  <p className="text-xs text-gray-500">Triage Nivel 2 - Hace 30 minutos</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-yellow-100 rounded-full p-2 mt-1">
                  <Calendar className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-sermed-blue">Cita confirmada para mañana</p>
                  <p className="text-xs text-gray-500">María Rodríguez - 09:30 AM - Hace 15 minutos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-sermed-blue/10">
          <CardHeader>
            <CardTitle className="text-sermed-blue">Acciones Rápidas</CardTitle>
            <CardDescription>Atajos útiles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start bg-sermed-blue hover:bg-sermed-blue/90 text-white">
              <Users className="w-4 h-4 mr-2" />
              Nuevo Paciente
            </Button>
            <Button className="w-full justify-start bg-red-600 hover:bg-red-700 text-white">
              <AlertCircle className="w-4 h-4 mr-2" />
              Registrar Urgencia
            </Button>
            <Button className="w-full justify-start bg-sermed-green hover:bg-sermed-green/90 text-white">
              <Calendar className="w-4 h-4 mr-2" />
              Programar Cita
            </Button>
            <Button className="w-full justify-start bg-yellow-600 hover:bg-yellow-700 text-white">
              <Stethoscope className="w-4 h-4 mr-2" />
              Nuevo Ingreso
            </Button>
            <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              Ver Reportes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <Card className="border-sermed-blue/10">
        <CardHeader>
          <CardTitle className="text-sermed-blue">Indicadores Clave del Mes</CardTitle>
          <CardDescription>Métricas principales de desempeño</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-sermed-blue/5 rounded-lg border border-sermed-blue/10">
              <div className="text-3xl font-bold text-sermed-blue">892</div>
              <p className="text-sm text-gray-600 mt-2 font-medium">Pacientes Atendidos</p>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUp className="w-3 h-3 text-sermed-green" />
                <p className="text-xs text-sermed-green font-medium">+15% vs mes anterior</p>
              </div>
            </div>
            <div className="p-4 bg-sermed-green/5 rounded-lg border border-sermed-green/10">
              <div className="text-3xl font-bold text-sermed-green">156</div>
              <p className="text-sm text-gray-600 mt-2 font-medium">Intervenciones Quirúrgicas</p>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUp className="w-3 h-3 text-sermed-green" />
                <p className="text-xs text-sermed-green font-medium">+8% vs mes anterior</p>
              </div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-3xl font-bold text-yellow-700">4.5</div>
              <p className="text-sm text-gray-600 mt-2 font-medium">Promedio Estancia (días)</p>
              <div className="flex items-center gap-1 mt-2">
                <ArrowDown className="w-3 h-3 text-sermed-green" />
                <p className="text-xs text-sermed-green font-medium">-2% vs mes anterior</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HosixDashboard;
