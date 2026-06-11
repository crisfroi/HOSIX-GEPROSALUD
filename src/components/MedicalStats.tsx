import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';

interface StatItem {
  label: string;
  value: string | number;
  trend?: string;
  trendPositive?: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}

interface MedicalStatsProps {
  items: StatItem[];
  title?: string;
  description?: string;
}

const colorMap = {
  blue: 'bg-sermed-blue/5 text-sermed-blue',
  green: 'bg-sermed-green/5 text-sermed-green',
  red: 'bg-red-50 text-red-600',
  yellow: 'bg-yellow-50 text-yellow-600',
};

export const MedicalStats: React.FC<MedicalStatsProps> = ({
  items,
  title = 'Estadísticas',
  description = 'Indicadores clave',
}) => {
  return (
    <Card className="border-sermed-blue/10">
      <CardHeader>
        <CardTitle className="text-sermed-blue">{title}</CardTitle>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border border-gray-200 ${colorMap[item.color || 'blue']}`}
            >
              <p className="text-sm font-medium text-gray-600 mb-2">{item.label}</p>
              <div className="text-2xl font-bold mb-2">{item.value}</div>
              {item.trend && (
                <div className="flex items-center gap-1">
                  {item.trendPositive ? (
                    <ArrowUp className="w-3 h-3 text-sermed-green" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-red-500" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      item.trendPositive ? 'text-sermed-green' : 'text-red-500'
                    }`}
                  >
                    {item.trend}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
