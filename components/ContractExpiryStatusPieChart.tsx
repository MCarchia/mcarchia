
import React, { useMemo } from 'react';
import type { Contract } from '../types';
import { CalendarIcon } from './Icons';

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

interface ContractExpiryStatusPieChartProps {
  contracts: Contract[];
}

const ContractExpiryStatusPieChart: React.FC<ContractExpiryStatusPieChartProps> = ({ contracts }) => {
  const chartData = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const sixtyDaysFromNow = new Date(now);
    sixtyDaysFromNow.setDate(now.getDate() + 60);

    let activeCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;

    contracts.forEach(c => {
        if (!c.endDate) {
            activeCount++; // Senza data di fine è considerato attivo a tempo indeterminato
            return;
        }
        
        const endDate = new Date(c.endDate);
        endDate.setHours(0, 0, 0, 0);

        if (endDate < now) {
            expiredCount++;
        } else if (endDate <= sixtyDaysFromNow) {
            expiringCount++;
        } else {
            activeCount++;
        }
    });

    const total = contracts.length;

    if (total === 0) {
      return { segments: [], total: 0 };
    }

    const activePercentage = (activeCount / total) * 100;
    const expiringPercentage = (expiringCount / total) * 100;
    const expiredPercentage = (expiredCount / total) * 100;

    // Calculate angles
    const activeAngle = (activePercentage / 100) * (2 * Math.PI);
    const expiringAngle = (expiringPercentage / 100) * (2 * Math.PI);
    const expiredAngle = (expiredPercentage / 100) * (2 * Math.PI);

    const segments = [];
    let currentAngle = 0;

    if (activeCount > 0) {
      segments.push({
        name: 'Attivi',
        count: activeCount,
        percentage: activePercentage.toFixed(1),
        color: '#22c55e', // green-500
        path: getArcPath(50, 50, 50, currentAngle, currentAngle + activeAngle),
      });
      currentAngle += activeAngle;
    }

    if (expiringCount > 0) {
      segments.push({
        name: 'In Scadenza',
        count: expiringCount,
        percentage: expiringPercentage.toFixed(1),
        color: '#f59e0b', // amber-500
        path: getArcPath(50, 50, 50, currentAngle, currentAngle + expiringAngle),
      });
      currentAngle += expiringAngle;
    }

    if (expiredCount > 0) {
      segments.push({
        name: 'Scaduti',
        count: expiredCount,
        percentage: expiredPercentage.toFixed(1),
        color: '#ef4444', // red-500
        path: getArcPath(50, 50, 50, currentAngle, currentAngle + expiredAngle),
      });
      currentAngle += expiredAngle;
    }

    return { segments, total };
  }, [contracts]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 flex flex-col items-center justify-between h-full relative">
      <div className="flex items-center mb-4 w-full justify-center text-center">
        <CalendarIcon className="h-6 w-6 text-indigo-500 mr-2" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">Stato Scadenze</h2>
      </div>
      {chartData.total > 0 ? (
        <div className="flex flex-col items-center w-full flex-grow">
          {/* Pie Chart SVG */}
          <div className="relative w-full aspect-square max-w-[180px] mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {chartData.segments.map((segment) => (
                <path key={segment.name} d={segment.path} fill={segment.color}>
                  <title>{`${segment.name}: ${segment.count} (${segment.percentage}%)`}</title>
                </path>
              ))}
            </svg>
          </div>
          {/* Legend */}
          <div className="w-full">
            <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
              {chartData.segments.map(segment => (
                <li key={segment.name} className="flex items-center justify-between p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center overflow-hidden">
                    <span className="h-2.5 w-2.5 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: segment.color }} aria-hidden="true"></span>
                    <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{segment.name}</span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 whitespace-nowrap ml-1 flex-shrink-0">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{segment.count}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 h-full flex flex-col justify-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Nessun contratto.</p>
        </div>
      )}
    </div>
  );
};

export default ContractExpiryStatusPieChart;
