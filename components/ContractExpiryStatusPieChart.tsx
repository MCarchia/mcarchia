
import React, { useMemo } from 'react';
import type { Contract } from '../types';
import { CalendarIcon } from './Icons';
import GenericPieChart from './GenericPieChart';

interface ContractExpiryStatusPieChartProps {
  contracts: Contract[];
}

const ContractExpiryStatusPieChart: React.FC<ContractExpiryStatusPieChartProps> = ({ contracts }) => {
  const customSegments = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const sixtyDaysFromNow = new Date(now);
    sixtyDaysFromNow.setDate(now.getDate() + 60);

    let activeCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;

    contracts.forEach(c => {
        if (!c.endDate) {
            activeCount++;
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

    const segments = [];

    if (activeCount > 0) {
      segments.push({
        name: 'Attivi',
        count: activeCount,
        color: '#22c55e', // green-500
      });
    }

    if (expiringCount > 0) {
      segments.push({
        name: 'In Scadenza',
        count: expiringCount,
        color: '#f59e0b', // amber-500
      });
    }

    if (expiredCount > 0) {
      segments.push({
        name: 'Scaduti',
        count: expiredCount,
        color: '#ef4444', // red-500
      });
    }

    return segments;
  }, [contracts]);

  const chartIcon = <CalendarIcon className="h-6 w-6 text-indigo-500 mr-2" />;

  return (
    <GenericPieChart
        title="Stato Scadenze"
        icon={chartIcon}
        customSegments={customSegments}
        noDataMessage="Nessun contratto."
    />
  );
};

export default ContractExpiryStatusPieChart;
