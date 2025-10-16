import React, { useMemo } from 'react';
import type { Contract } from '../types';

interface GenericPieChartProps {
  contracts: Contract[];
  title: string;
  icon: React.ReactNode;
  noDataMessage: string;
  colors?: string[];
}

// Default color palette
const defaultColors = [
  '#38bdf8', '#fbbf24', '#4ade80', '#f87171', '#a78bfa',
  '#2dd4bf', '#f472b6', '#a3e635', '#60a5fa', '#fb923c'
];

// Helper to calculate SVG path for a pie slice
const getArcPath = (
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string => {
  const start = {
    x: x + radius * Math.cos(startAngle),
    y: y + radius * Math.sin(startAngle),
  };
  const end = {
    x: x + radius * Math.cos(endAngle),
    y: y + radius * Math.sin(endAngle),
  };

  if (endAngle - startAngle >= 2 * Math.PI - 0.001) {
    const midPoint = {
        x: x + radius * Math.cos(startAngle + Math.PI),
        y: y + radius * Math.sin(startAngle + Math.PI)
    }
    return [
        'M', start.x, start.y,
        'A', radius, radius, 0, 1, 1, midPoint.x, midPoint.y,
        'A', radius, radius, 0, 1, 1, start.x, start.y
    ].join(' ');
  }

  const largeArcFlag = endAngle - startAngle <= Math.PI ? '0' : '1';

  const d = [
    'M', x, y,
    'L', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y,
    'Z',
  ].join(' ');

  return d;
};

const GenericPieChart: React.FC<GenericPieChartProps> = ({ 
  contracts,
  title,
  icon,
  noDataMessage,
  colors = defaultColors 
}) => {
  
  const chartData = useMemo(() => {
    if (contracts.length === 0) {
      return { total: 0, providers: [] };
    }

    // FIX: By explicitly typing the accumulator (`acc`), we ensure correct type inference for `providerCounts`. This resolves downstream arithmetic errors where `count` was being inferred as a non-numeric type.
    const providerCounts = contracts.reduce<Record<string, number>>((acc, contract) => {
      acc[contract.provider] = (acc[contract.provider] || 0) + 1;
      return acc;
    }, {});

    const sortedProviders = Object.entries(providerCounts).sort(([, countA], [, countB]) => countB - countA);
    
    const total = contracts.length;
    
    const initialState = {
        providers: [] as {name: string, count: number, percentage: string, color: string, path: string}[],
        cumulativeAngle: 0
    };

    const result = sortedProviders.reduce((acc, [name, count], index) => {
      const percentage = (count / total) * 100;
      const angle = (percentage / 100) * (2 * Math.PI);
      const startAngle = acc.cumulativeAngle;
      const endAngle = startAngle + angle;
      
      const newProvider = {
          name,
          count,
          percentage: percentage.toFixed(1),
          color: colors[index % colors.length],
          path: getArcPath(50, 50, 50, startAngle, endAngle),
      };

      return {
          providers: [...acc.providers, newProvider],
          cumulativeAngle: endAngle
      };
    }, initialState);

    return {
      total,
      providers: result.providers,
    };
  }, [contracts, colors]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-4">
        {icon}
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
      </div>
      {chartData.providers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div className="relative w-full aspect-square max-w-[200px] mx-auto">
                 <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {chartData.providers.map((provider) => (
                        <path
                            key={provider.name}
                            d={provider.path}
                            fill={provider.color}
                        >
                           <title>{`${provider.name}: ${provider.count} (${provider.percentage}%)`}</title>
                        </path>
                    ))}
                </svg>
            </div>
          
            <div className="text-sm">
                <ul className="space-y-2">
                    {chartData.providers.map(provider => (
                        <li key={provider.name} className="flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="h-3 w-3 rounded-full mr-3" style={{ backgroundColor: provider.color }} aria-hidden="true"></span>
                                <span className="font-medium text-slate-700 dark:text-slate-200">{provider.name}</span>
                            </div>
                            <div className="text-slate-500 dark:text-slate-400">
                                <span className="font-semibold text-slate-800 dark:text-slate-100">{provider.count}</span>
                                <span className="ml-2 text-xs">({provider.percentage}%)</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      ) : (
        <div className="text-center py-10 h-full flex flex-col justify-center">
          <p className="text-slate-500 dark:text-slate-400">{noDataMessage}</p>
        </div>
      )}
    </div>
  );
};

export default GenericPieChart;