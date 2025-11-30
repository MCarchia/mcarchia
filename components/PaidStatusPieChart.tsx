
import React, { useMemo } from 'react';
import type { Contract } from '../types';
import { CheckCircleIcon } from './Icons';
import GenericPieChart from './GenericPieChart';

interface PaidStatusPieChartProps {
  contracts: Contract[];
}

const PaidStatusPieChart: React.FC<PaidStatusPieChartProps> = ({ contracts }) => {
  const customSegments = useMemo(() => {
    const paidCount = contracts.filter(c => c.isPaid).length;
    const unpaidCount = contracts.length - paidCount;

    const segments = [];

    if (paidCount > 0) {
      segments.push({
        name: 'Pagati',
        count: paidCount,
        color: '#22c55e', // green-500
      });
    }

    if (unpaidCount > 0) {
      segments.push({
        name: 'Non Pagati',
        count: unpaidCount,
        color: '#f97316', // orange-500
      });
    }

    return segments;
  }, [contracts]);

  const chartIcon = <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />;

  return (
    <GenericPieChart
      title="Stato Pagamenti"
      icon={chartIcon}
      customSegments={customSegments}
      noDataMessage="Nessun contratto."
    />
  );
};

export default PaidStatusPieChart;
