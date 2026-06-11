import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MedicalCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  backgroundColor?: string;
  iconColor?: string;
  valueColor?: string;
  onClick?: () => void;
}

export const MedicalCard: React.FC<MedicalCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  backgroundColor = 'bg-sermed-blue',
  iconColor = 'text-white',
  valueColor = 'text-sermed-blue',
  onClick,
}) => {
  return (
    <Card 
      className="border-sermed-blue/10 hover:shadow-lg transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-sermed-blue/70">
            {title}
          </CardTitle>
          {Icon && (
            <div className={`${backgroundColor} rounded-lg p-2`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${valueColor}`}>
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
        {trend && (
          <p className={`text-xs font-medium mt-2 ${
            trendPositive ? 'text-sermed-green' : 'text-red-500'
          }`}>
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
