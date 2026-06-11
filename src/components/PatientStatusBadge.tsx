import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, AlertCircle, CheckCircle } from 'lucide-react';

type PatientStatus = 'active' | 'pending' | 'critical' | 'discharged';

interface PatientStatusBadgeProps {
  status: PatientStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const statusConfig: Record<PatientStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  active: {
    label: 'Activo',
    color: 'bg-sermed-green',
    bgColor: 'bg-sermed-green/10',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  pending: {
    label: 'Pendiente',
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-50',
    icon: <Clock className="w-3 h-3" />,
  },
  critical: {
    label: 'Crítico',
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    icon: <AlertCircle className="w-3 h-3" />,
  },
  discharged: {
    label: 'Alta',
    color: 'bg-gray-500',
    bgColor: 'bg-gray-100',
    icon: <Check className="w-3 h-3" />,
  },
};

export const PatientStatusBadge: React.FC<PatientStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const config = statusConfig[status];
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-1' : size === 'lg' ? 'text-sm px-3 py-2' : 'text-sm px-2.5 py-1.5';

  return (
    <div className={`${config.bgColor} rounded-full ${sizeClass} flex items-center gap-2 font-medium text-white` + ' inline-flex'}>
      {showIcon && config.icon}
      <span style={{ color: config.color.replace('bg-', '') }}>{config.label}</span>
    </div>
  );
};
