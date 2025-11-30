
import React, { useMemo } from 'react';
import type { Contract } from '../types';

interface ContractChartProps {
  contracts: Contract[];
  selectedYear: string;
}

const ContractChart: React.FC<ContractChartProps> = ({ contracts, selectedYear }) => {
  const chartData = useMemo(() => {
    // Caso: Tutti gli anni (aggregazione annuale)
    if (selectedYear === 'all') {
      const yearCounts: Record<string, number> = {};
      
      contracts.forEach(contract => {
        if (!contract.startDate) return;
        const year = new Date(contract.startDate).getFullYear().toString();
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      });

      // Ottieni tutti gli anni presenti e ordinali
      const years = Object.keys(yearCounts).sort((a, b) => parseInt(a) - parseInt(b));
      
      // Se non ci sono dati, ritorna array vuoto
      if (years.length === 0) return [];

      // Costruisci l'array per il grafico
      return years.map(year => ({
        label: year,
        count: yearCounts[year]
      }));
    }

    // Caso: Anno specifico (dati mensili)
    const year = parseInt(selectedYear, 10);
    const data: { label: string; count: number }[] = [];

    // Initialize 12 months for the selected year
    for (let i = 0; i < 12; i++) {
      const d = new Date(year, i, 1);
      data.push({
        label: d.toLocaleString('it-IT', { month: 'short' }).replace('.', '').replace(/^\w/, (c) => c.toUpperCase()),
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
    if (chartData.length === 0) return 1;
    const count = Math.max(...chartData.map(d => d.count));
    return count === 0 ? 1 : count; // Avoid division by zero
  }, [chartData]);
  
  const totalContractsForPeriod = useMemo(() => chartData.reduce((sum, item) => sum + item.count, 0), [chartData]);

  const summaryText = selectedYear === 'all' 
    ? `Totale contratti complessivi: ` 
    : `Totale nuovi contratti per l'anno ${selectedYear}: `;

  return (
    <div className="pb-12">
      <div className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        {summaryText}<span className="font-bold text-slate-700 dark:text-slate-200">{totalContractsForPeriod}</span>
      </div>
      <div className="flex justify-around items-end h-64 space-x-2 text-center border-b border-slate-200 dark:border-slate-700" aria-label={selectedYear === 'all' ? "Grafico a barre dei contratti per anno" : `Grafico a barre dei nuovi contratti per l'anno ${selectedYear}`}>
        {chartData.length > 0 ? (
          chartData.map(({ label, count }) => (
            <div key={`${label}-${selectedYear}`} className="flex flex-col items-center justify-end w-full h-full group relative">
              <div
                className="w-3/4 bg-green-300 hover:bg-green-500 dark:bg-green-700 dark:hover:bg-green-500 rounded-t-lg transition-all duration-300 ease-out cursor-pointer relative"
                style={{ height: `${(count / maxCount) * 100}%` }}
                role="img"
                aria-label={`Barra per ${label}: ${count} contratti`}
              >
                 {/* Tooltip */}
                 <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs font-semibold rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    {count} Contratti
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                 </div>
              </div>
              {/* Label Centrata e Distanziata */}
              <div className="absolute top-full left-0 w-full flex justify-center mt-4">
                  <span className={`text-xs font-medium text-slate-500 dark:text-slate-400 uppercase ${selectedYear === 'all' ? '' : '[writing-mode:vertical-rl] [transform:rotate(180deg)]'}`}>
                    {label}
                  </span>
              </div>
            </div>
          ))
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm italic">
            Nessun dato disponibile
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractChart;
