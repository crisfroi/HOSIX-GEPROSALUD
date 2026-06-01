import React from 'react';
import { useHosixEpidemiologia } from '@/hooks/useHosixEpidemiologia';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const estadoVariant = (estado: string) => {
  switch (estado) {
    case 'activo':
      return 'bg-emerald-100 text-emerald-800';
    case 'controlado':
      return 'bg-amber-100 text-amber-800';
    case 'cerrado':
      return 'bg-slate-100 text-slate-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const BrotesList: React.FC = () => {
  const { brotes, isLoadingBrotes } = useHosixEpidemiologia();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brotes Activos y Monitoreados</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoadingBrotes ? (
          <div className="text-center py-8 text-slate-500">Cargando brotes...</div>
        ) : brotes.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No hay brotes en seguimiento.</div>
        ) : (
          <div className="space-y-3">
            {brotes.map((brote) => (
              <div key={brote.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Brote</p>
                    <h3 className="text-lg font-semibold text-slate-900">{brote.numero_brote}</h3>
                    <p className="text-sm text-slate-600">
                      {brote.hosix_enfermedades_notificables?.nombre || 'Enfermedad desconocida'}
                    </p>
                  </div>
                  <span className={`${estadoVariant(brote.estado)} rounded-full px-3 py-1 text-xs font-semibold`}>
                    {brote.estado}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs uppercase text-slate-500">Casos totales</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{brote.total_casos}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs uppercase text-slate-500">Confirmados</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{brote.casos_confirmados}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs uppercase text-slate-500">Ubicación</p>
                    <p className="mt-1 text-sm text-slate-700">{brote.ubicacion_geografica || 'N/A'}</p>
                  </div>
                </div>
                {brote.medidas_control?.length ? (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-700">Medidas de control</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {brote.medidas_control.map((medida) => (
                        <Badge key={medida}>{medida}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
