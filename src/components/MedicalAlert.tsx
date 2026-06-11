import React from 'react';
import { AlertCircle, CheckCircle, Info, Bell } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type AlertType = 'critical' | 'warning' | 'info' | 'success';

interface MedicalAlertProps {
  type: AlertType;
  title: string;
  description: string;
  onDismiss?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

const alertConfig = {
  critical: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    titleColor: 'text-red-900',
    iconColor: 'text-red-600',
  },
  warning: {
    icon: Bell,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    titleColor: 'text-yellow-900',
    iconColor: 'text-yellow-600',
  },
  info: {
    icon: Info,
    bgColor: 'bg-sermed-blue/5',
    borderColor: 'border-sermed-blue/20',
    textColor: 'text-sermed-blue',
    titleColor: 'text-sermed-blue',
    iconColor: 'text-sermed-blue',
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-sermed-green/5',
    borderColor: 'border-sermed-green/20',
    textColor: 'text-sermed-green',
    titleColor: 'text-sermed-green',
    iconColor: 'text-sermed-green',
  },
};

export const MedicalAlert: React.FC<MedicalAlertProps> = ({
  type,
  title,
  description,
  onDismiss,
  actionLabel,
  onAction,
}) => {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4`}>
      <div className="flex gap-4">
        <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h4 className={`font-semibold ${config.titleColor}`}>{title}</h4>
          <p className={`text-sm ${config.textColor} mt-1`}>{description}</p>
          {(actionLabel || onDismiss) && (
            <div className="flex gap-2 mt-3">
              {actionLabel && onAction && (
                <button
                  onClick={onAction}
                  className={`text-sm font-medium px-3 py-1 rounded transition-colors ${
                    type === 'critical'
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : type === 'warning'
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : type === 'info'
                      ? 'bg-sermed-blue/10 text-sermed-blue hover:bg-sermed-blue/20'
                      : 'bg-sermed-green/10 text-sermed-green hover:bg-sermed-green/20'
                  }`}
                >
                  {actionLabel}
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 px-3 py-1"
                >
                  Descartar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
