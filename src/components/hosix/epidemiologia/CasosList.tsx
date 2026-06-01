import React, { useMemo, useState } from 'react';
import { useHosixEpidemiologia } from '@/hooks/useHosixEpidemiologia';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const statusVariant = (estado: string) => {
  switch (estado) {
    case 'confirmado':
      return 'bg-emerald-100 text-emerald-800';
    case 'sospechoso':
      return 'bg-amber-100 text-amber-800';
    case 'fallecido':
      return 'bg-slate-100 text-slate-800';
    case 'recuperado':
      return 'bg-sky-100 text-sky-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const CasosList: React.FC = () => {
  const { casos, isLoadingCasos } = useHosixEpidemiologia();
  const [filtro, setFiltro] = useState('');

  const casosFiltrados = useMemo(
    () =>
      casos.filter((caso) => {
        const paciente = caso.hosix_pacientes;
        const texto = filtro.toLowerCase();

        return (
          caso.numero_caso.toLowerCase().includes(texto) ||
          caso.estado.toLowerCase().includes(texto) ||
          paciente?.primer_nombre?.toLowerCase().includes(texto) ||
          paciente?.primer_apellido?.toLowerCase().includes(texto) ||
          paciente?.numero_documento?.toLowerCase().includes(texto)
        );
      }),
    [casos, filtro]
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Casos Epidemiológicos</CardTitle>
        </div>
        <div className="max-w-xs w-full">
          <Input
            placeholder="Buscar caso, paciente o estado"
            value={filtro}
            onChange={(event) => setFiltro(event.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingCasos ? (
          <div className="text-center py-8 text-slate-500">Cargando casos...</div>
        ) : casosFiltrados.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No hay casos registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-700">Caso</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Paciente</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Enfermedad</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Estado</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Sintomas</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {casosFiltrados.map((caso) => (
                  <tr key={caso.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {caso.numero_caso}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {caso.hosix_pacientes
                        ? `${caso.hosix_pacientes.primer_nombre} ${caso.hosix_pacientes.primer_apellido}`
                        : 'Paciente desconocido'}
                      <div className="text-xs text-slate-500">
                        {caso.hosix_pacientes?.numero_documento || 'Sin documento'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {caso.hosix_enfermedades_notificables?.nombre || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`${statusVariant(caso.estado)} rounded-full px-2 py-1 text-xs font-semibold`}>
                        {caso.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {caso.tipo_caso || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(caso.fecha_sintomas).toLocaleDateString('es-ES')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
