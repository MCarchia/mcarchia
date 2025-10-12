import React, { useMemo } from 'react';
import type { Contract } from '../types';

interface ContractChartProps {
  contracts: Contract[];
  selectedYear: string;
}

const ContractChart: React.FC<ContractChartProps> = ({ contracts, selectedYear }) => {
  const chartData = useMemo(() => {
    const year = parseInt(selectedYear, 10);
    const data: { month: string; count: number }[] = [];

    // Initialize 12 months for the selected year
    for (let i = 0; i < 12; i++) {
      const d = new Date(year, i, 1);
      data.push({
        month: d.toLocaleString('it-IT', { month: 'short' }).replace('.', '').replace(/^\w/, (c) => c.toUpperCase()),
        count: 0,
      });
    }

    // Filter contracts for the selected year and count them by month
    contracts.forEach(contract => {
      if (!contract.startDate) return;
      const contractDate = new Date(contract.startDate);
      if (contractDate.getFullYear() === year) {
        const monthIndex = contractDate.getMonth();
        if (data[monthIndex]) {
          data[monthIndex].count++;
        }
      }
    });

    return data;
  }, [contracts, selectedYear]);

  const maxCount = useMemo(() => {
    const count = Math.max(...chartData.map(d => d.count));
    return count === 0 ? 1 : count; // Avoid division by zero
  }, [chartData]);
  
  const totalContractsForYear = useMemo(() => chartData.reduce((sum, item) => sum + item.count, 0), [chartData]);

  return (
    <>
      <div className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Totale nuovi contratti per l'anno {selectedYear}: <span className="font-bold text-slate-700 dark:text-slate-200">{totalContractsForYear}</span>
      </div>
      <div className="flex justify-around items-end h-48 space-x-2 text-center" aria-label={`Grafico a barre dei nuovi contratti per l'anno ${selectedYear}`}>
        {chartData.map(({ month, count }) => (
          <div key={`${month}-${selectedYear}`} className="flex flex-col items-center justify-end w-full h-full group">
             <div className="text-sm font-bold text-slate-700 dark:text-slate-100 mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true">
              {count}
            </div>
            <div
              className="w-3/4 bg-green-300 hover:bg-green-500 dark:bg-green-700 dark:hover:bg-green-500 rounded-t-lg transition-all duration-500 ease-out cursor-pointer"
              style={{ height: `${(count / maxCount) * 100}%` }}
              role="img"
              aria-label={`Barra per ${month}: ${count} contratti`}
            >
               <div className="sr-only">{`${month}: ${count} contratti`}</div>
            </div>
            <div className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">{month}</div>
          </div>
        ))}
      </div>
    </>
  );
};

export default ContractChart;