

import React, { useMemo } from 'react';
import type { Client } from '../types';

interface ClientChartProps {
  clients: Client[];
  selectedYear: string;
}

const ClientChart: React.FC<ClientChartProps> = ({ clients, selectedYear }) => {
  const chartData = useMemo(() => {
    const year = parseInt(selectedYear, 10);
    const data: { month: string; count: number }[] = [];

    // Inizializza 12 mesi per l'anno selezionato
    for (let i = 0; i < 12; i++) {
      const d = new Date(year, i, 1);
      data.push({
        month: d.toLocaleString('it-IT', { month: 'short' }).replace('.', '').replace(/^\w/, (c) => c.toUpperCase()),
        count: 0,
      });
    }

    // Filtra i clienti per l'anno selezionato e li conta per mese
    clients.forEach(client => {
      const clientDate = new Date(client.createdAt);
      if (clientDate.getFullYear() === year) {
        const monthIndex = clientDate.getMonth();
        if (data[monthIndex]) {
          data[monthIndex].count++;
        }
      }
    });

    return data;
  }, [clients, selectedYear]);

  const maxCount = useMemo(() => {
    const count = Math.max(...chartData.map(d => d.count));
    return count === 0 ? 1 : count;
  }, [chartData]);
  
  const totalClientsForYear = useMemo(() => chartData.reduce((sum, item) => sum + item.count, 0), [chartData]);

  return (
    <>
      <div className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Totale nuovi clienti per l'anno {selectedYear}: <span className="font-bold text-slate-700 dark:text-slate-200">{totalClientsForYear}</span>
      </div>
      <div className="flex justify-around items-end h-64 space-x-2 text-center pb-6" aria-label={`Grafico a barre dei nuovi clienti per l'anno ${selectedYear}`}>
        {chartData.map(({ month, count }) => (
          <div key={`${month}-${selectedYear}`} className="flex flex-col items-center justify-end w-full h-full group relative">
            <div
              className="w-3/4 bg-sky-300 hover:bg-sky-500 dark:bg-sky-700 dark:hover:bg-sky-500 rounded-t-lg transition-all duration-300 ease-out cursor-pointer relative"
              style={{ height: `${(count / maxCount) * 100}%` }}
              role="img"
              aria-label={`Barra per ${month}: ${count} clienti`}
            >
               {/* Tooltip */}
               <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs font-semibold rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  {count} Clienti
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
               </div>
            </div>
            <div className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase [writing-mode:vertical-rl] [transform:rotate(180deg)] absolute -bottom-6">{month}</div>
          </div>
        ))}
      </div>
    </>
  );
};

export default ClientChart;