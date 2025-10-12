import React, { useMemo } from 'react';
import type { Contract } from '../types';

interface CommissionChartProps {
  contracts: Contract[];
  selectedYear: string;
}

const CommissionChart: React.FC<CommissionChartProps> = ({ contracts, selectedYear }) => {
  const chartData = useMemo(() => {
    const year = parseInt(selectedYear, 10);
    const data: { month: string; commission: number }[] = [];

    // Initialize 12 months for the selected year
    for (let i = 0; i < 12; i++) {
      const d = new Date(year, i, 1);
      data.push({
        month: d.toLocaleString('it-IT', { month: 'short' }).replace('.', '').replace(/^\w/, (c) => c.toUpperCase()),
        commission: 0,
      });
    }

    // Filter contracts for the selected year and sum commissions by month
    contracts.forEach(contract => {
      if (!contract.startDate) return;
      const contractDate = new Date(contract.startDate);
      if (contractDate.getFullYear() === year) {
        const monthIndex = contractDate.getMonth();
        if (data[monthIndex] && contract.commission) {
          data[monthIndex].commission += contract.commission;
        }
      }
    });

    return data;
  }, [contracts, selectedYear]);

  const maxCommission = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.commission));
    return max === 0 ? 1 : max; // Avoid division by zero
  }, [chartData]);
  
  const totalCommissionForYear = useMemo(() => chartData.reduce((sum, item) => sum + item.commission, 0), [chartData]);

  return (
    <>
      <div className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Totale provvigioni per l'anno {selectedYear}: <span className="font-bold text-slate-700 dark:text-slate-200">{totalCommissionForYear.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</span>
      </div>
      <div className="flex justify-around items-end h-48 space-x-2 text-center" aria-label={`Grafico a barre delle provvigioni per l'anno ${selectedYear}`}>
        {chartData.map(({ month, commission }) => (
          <div key={`${month}-${selectedYear}`} className="flex flex-col items-center justify-end w-full h-full group">
             <div className="text-sm font-bold text-slate-700 dark:text-slate-100 mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true">
              {commission.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
            </div>
            <div
              className="w-3/4 bg-indigo-300 hover:bg-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-500 rounded-t-lg transition-all duration-500 ease-out cursor-pointer"
              style={{ height: `${(commission / maxCommission) * 100}%` }}
              role="img"
              aria-label={`Barra per ${month}: ${commission.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}`}
            >
               <div className="sr-only">{`${month}: ${commission.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}`}</div>
            </div>
            <div className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">{month}</div>
          </div>
        ))}
      </div>
    </>
  );
};

export default CommissionChart;