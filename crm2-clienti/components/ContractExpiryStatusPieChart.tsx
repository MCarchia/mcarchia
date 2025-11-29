
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
        name: 'In Scadenza (60gg)',
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
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-4">
        <CalendarIcon className="h-6 w-6 text-indigo-500 mr-3" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Stato Scadenza Contratti</h2>
      </div>
      {chartData.total > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          <div className="relative w-full aspect-square max-w-[200px] mx-auto">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {chartData.segments.map((segment) => (
                <path key={segment.name} d={segment.path} fill={segment.color}>
                  <title>{`${segment.name}: ${segment.count} (${segment.percentage}%)`}</title>
                </path>
              ))}
            </svg>
          </div>
          <div className="text-sm">
            <ul className="space-y-2">
              {chartData.segments.map(segment => (
                <li key={segment.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="h-3 w-3 rounded-full mr-3" style={{ backgroundColor: segment.color }} aria-hidden="true"></span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{segment.name}</span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{segment.count}</span>
                    <span className="ml-2 text-xs">({segment.percentage}%)</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 h-full flex flex-col justify-center">
          <p className="text-slate-500 dark:text-slate-400">Nessun contratto da visualizzare.</p>
        </div>
      )}
    </div>
  );
};

export default ContractExpiryStatusPieChart;
