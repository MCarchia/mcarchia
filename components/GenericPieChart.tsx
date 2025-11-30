import React, { useMemo, useState } from 'react';
import type { Contract } from '../types';

interface PieSegment {
    name: string;
    count: number;
    percentage: string;
    color: string;
    path: string;
}

interface GenericPieChartProps {
  contracts?: Contract[];
  customSegments?: { name: string, count: number, color: string }[];
  title: string;
  icon?: React.ReactNode;
  noDataMessage?: string;
  colors?: string[];
  onSliceClick?: (name: string) => void;
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
  customSegments,
  title,
  icon,
  noDataMessage = "Nessun dato disponibile.",
  colors = defaultColors,
  onSliceClick
}) => {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    name: string;
    count: number;
    percentage: string;
  } | null>(null);

  const chartData = useMemo(() => {
    let rawSegments: { name: string, count: number, color?: string }[] = [];
    let total = 0;

    // Mode 1: Use provided custom segments
    if (customSegments && customSegments.length > 0) {
        rawSegments = customSegments;
        total = customSegments.reduce((sum, item) => sum + item.count, 0);
    } 
    // Mode 2: Aggregate from contracts (by provider)
    else if (contracts && contracts.length > 0) {
        total = contracts.length;
        const providerCounts = contracts.reduce((acc, contract) => {
            acc[contract.provider] = (acc[contract.provider] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        rawSegments = Object.entries(providerCounts)
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .map(([name, count]) => ({ name, count: count as number }));
    }

    if (total === 0) {
        return { total: 0, providers: [] };
    }

    // Calculate angles and paths
    const initialState = {
        providers: [] as PieSegment[],
        cumulativeAngle: 0
    };

    const result = rawSegments.reduce((acc, item, index) => {
      const percentage = (item.count / total) * 100;
      const angle = (percentage / 100) * (2 * Math.PI);
      const startAngle = acc.cumulativeAngle;
      const endAngle = startAngle + angle;
      
      const newProvider: PieSegment = {
          name: item.name,
          count: item.count,
          percentage: percentage.toFixed(1),
          color: item.color || colors[index % colors.length],
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
  }, [contracts, customSegments, colors]);

  const handleMouseMove = (e: React.MouseEvent, provider: { name: string, count: number, percentage: string }) => {
    const svgRect = e.currentTarget.closest('svg')?.getBoundingClientRect();
    const containerRect = e.currentTarget.closest('.pie-container')?.getBoundingClientRect();
    
    if (containerRect) {
        // Calculate position relative to the container div
        const x = e.clientX - containerRect.left;
        const y = e.clientY - containerRect.top;

        setTooltip({
            visible: true,
            x,
            y,
            name: provider.name,
            count: provider.count,
            percentage: provider.percentage
        });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 flex flex-col items-center justify-between h-full relative">
      <div className="flex items-center mb-4 w-full justify-center text-center">
        {icon && <div className="mr-2">{icon}</div>}
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">{title}</h2>
      </div>
      
      {chartData.providers.length > 0 ? (
        <div className="flex flex-col items-center w-full flex-grow">
            {/* Pie Chart SVG */}
            <div className="relative w-full aspect-square max-w-[180px] mb-6 pie-container">
                 <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-md overflow-visible">
                    {chartData.providers.map((provider) => (
                        <path
                            key={provider.name}
                            d={provider.path}
                            fill={provider.color}
                            className={`transition-all duration-300 ${onSliceClick ? 'cursor-pointer hover:opacity-90 hover:scale-105 origin-center' : ''}`}
                            onClick={() => onSliceClick && onSliceClick(provider.name)}
                            onMouseMove={(e) => handleMouseMove(e, provider)}
                            onMouseLeave={handleMouseLeave}
                        />
                    ))}
                </svg>
                
                {/* Tooltip */}
                {tooltip && tooltip.visible && (
                    <div 
                        className="absolute z-50 px-2 py-1 bg-slate-800 text-white text-xs font-semibold rounded shadow-lg pointer-events-none whitespace-nowrap transform -translate-x-1/2 -translate-y-full mb-2"
                        style={{ left: tooltip.x, top: tooltip.y - 10 }}
                    >
                        <div className="text-center">
                            <div>{tooltip.name}</div>
                            <div className="font-normal opacity-90">{tooltip.count} ({tooltip.percentage}%)</div>
                        </div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                    </div>
                )}
            </div>
          
            {/* Legend Grid */}
            <div className="w-full">
                <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                    {chartData.providers.map(provider => (
                        <li 
                          key={provider.name} 
                          className={`flex items-center justify-between p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${onSliceClick ? 'cursor-pointer' : ''}`}
                          onClick={() => onSliceClick && onSliceClick(provider.name)}
                        >
                            <div className="flex items-center overflow-hidden">
                                <span className="h-2.5 w-2.5 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: provider.color }} aria-hidden="true"></span>
                                <span className="font-medium text-slate-700 dark:text-slate-200 truncate" title={provider.name}>{provider.name}</span>
                            </div>
                            <div className="text-slate-500 dark:text-slate-400 whitespace-nowrap ml-1 flex-shrink-0">
                                <span className="font-semibold text-slate-800 dark:text-slate-100">{provider.count}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      ) : (
        <div className="text-center py-10 h-full flex flex-col justify-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">{noDataMessage}</p>
        </div>
      )}
    </div>
  );
};

export default GenericPieChart;