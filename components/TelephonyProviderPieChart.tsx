
import React from 'react';
import type { Contract } from '../types';
import { DeviceMobileIcon } from './Icons';
import GenericPieChart from './GenericPieChart';

interface TelephonyProviderPieChartProps {
  contracts: Contract[];
  onProviderClick?: (provider: string) => void;
}

const TelephonyProviderPieChart: React.FC<TelephonyProviderPieChartProps> = ({ contracts, onProviderClick }) => {
  const chartTitle = "Telefonia";
  const chartIcon = <DeviceMobileIcon className="h-5 w-5 text-sky-500" />;
  const colors = [
    '#ef4444', '#f97316', '#0ea5e9', '#22c55e', '#8b5cf6',
    '#14b8a6', '#ec4899', '#78716c', '#06b6d4', '#eab308'
  ];

  return (
    <GenericPieChart
      contracts={contracts}
      title={chartTitle}
      icon={chartIcon}
      colors={colors}
      noDataMessage="Nessun contratto telefonia."
      onSliceClick={onProviderClick}
    />
  );
};

export default TelephonyProviderPieChart;
