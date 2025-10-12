

import React from 'react';
import type { Contract } from '../types';
import { DeviceMobileIcon } from './Icons';
import GenericPieChart from './GenericPieChart';

interface TelephonyProviderPieChartProps {
  contracts: Contract[];
}

const TelephonyProviderPieChart: React.FC<TelephonyProviderPieChartProps> = ({ contracts }) => {
  const chartTitle = "Ripartizione Contratti Telefonia";
  const chartIcon = <DeviceMobileIcon className="h-6 w-6 text-sky-500 mr-3" />;
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
      noDataMessage="Nessun contratto di telefonia da visualizzare."
    />
  );
};

export default TelephonyProviderPieChart;