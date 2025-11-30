
import React from 'react';
import type { Contract } from '../types';
import { LightningBoltIcon, FireIcon } from './Icons';
import GenericPieChart from './GenericPieChart';

interface EnergyProviderPieChartProps {
  contracts: Contract[];
  onProviderClick?: (provider: string) => void;
}

const EnergyProviderPieChart: React.FC<EnergyProviderPieChartProps> = ({ contracts, onProviderClick }) => {
  const chartTitle = "Energia e Gas";
  const chartIcon = (
    <div className="flex">
      <LightningBoltIcon className="h-5 w-5 text-yellow-500 -mr-1" />
      <FireIcon className="h-5 w-5 text-orange-500" />
    </div>
  );

  return (
    <GenericPieChart
      contracts={contracts}
      title={chartTitle}
      icon={chartIcon}
      noDataMessage="Nessun contratto energia/gas."
      onSliceClick={onProviderClick}
    />
  );
};

export default EnergyProviderPieChart;
