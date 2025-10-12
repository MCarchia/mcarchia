

import React from 'react';
import type { Contract } from '../types';
import { LightningBoltIcon, FireIcon } from './Icons';
import GenericPieChart from './GenericPieChart';

interface EnergyProviderPieChartProps {
  contracts: Contract[];
}

const EnergyProviderPieChart: React.FC<EnergyProviderPieChartProps> = ({ contracts }) => {
  const chartTitle = "Ripartizione Contratti Energia e Gas";
  const chartIcon = (
    <>
      <LightningBoltIcon className="h-6 w-6 text-yellow-500 mr-1" />
      <FireIcon className="h-6 w-6 text-orange-500 mr-3" />
    </>
  );

  return (
    <GenericPieChart
      contracts={contracts}
      title={chartTitle}
      icon={chartIcon}
      noDataMessage="Nessun contratto di energia o gas da visualizzare."
    />
  );
};

export default EnergyProviderPieChart;