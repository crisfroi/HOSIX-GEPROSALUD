import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, MapPin, Phone } from 'lucide-react';

interface PatientCardProps {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  status: 'active' | 'pending' | 'critical' | 'discharged';
  department?: string;
  doctor?: string;
  phone?: string;
  location?: string;
  lastVisit?: string;
  onClick?: () => void;
}

const statusColors = {
  active: 'bg-sermed-green text-white',
  pending: 'bg-yellow-500 text-white',
  critical: 'bg-red-500 text-white',
  discharged: 'bg-gray-500 text-white',
};

const statusLabels = {
  active: 'Activo',
  pending: 'Pendiente',
  critical: 'Crítico',
  discharged: 'Alta',
};

export const PatientCard: React.FC<PatientCardProps> = ({
  id,
  name,
  age,
  gender,
  status,
  department,
  doctor,
  phone,
  location,
  lastVisit,
  onClick,
}) => {
  return (
    <Card 
      className="border-sermed-blue/10 hover:shadow-lg transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
        <div>
          <h3 className="font-semibold text-sermed-blue">{name}</h3>
          <p className="text-xs text-gray-500 mt-1">ID: {id}</p>
        </div>
        <Badge className={statusColors[status]}>
          {statusLabels[status]}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-gray-500">Edad</p>
            <p className="font-semibold text-gray-900">{age} años</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Género</p>
            <p className="font-semibold text-gray-900">{gender === 'M' ? 'Masculino' : 'Femenino'}</p>
          </div>
        </div>

        {department && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Departamento</p>
            <p className="text-sm font-medium text-sermed-blue">{department}</p>
          </div>
        )}

        {doctor && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Médico Asignado</p>
            <p className="text-sm font-medium text-gray-900">{doctor}</p>
          </div>
        )}

        <div className="pt-2 border-t border-gray-100 space-y-2">
          {phone && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Phone className="w-3 h-3 text-sermed-blue" />
              <span>{phone}</span>
            </div>
          )}
          {location && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <MapPin className="w-3 h-3 text-sermed-blue" />
              <span>{location}</span>
            </div>
          )}
          {lastVisit && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="w-3 h-3 text-sermed-blue" />
              <span>Última visita: {lastVisit}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
