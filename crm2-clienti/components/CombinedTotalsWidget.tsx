import React from 'react';
import { UserGroupIcon, DocumentDuplicateIcon } from './Icons';

interface CombinedTotalsWidgetProps {
  totalClients: number;
  totalContracts: number;
  selectedYear: string;
  selectedMonth: string;
  selectedProvider: string;
}

const months = [
    { value: 1, name: 'Gennaio' }, { value: 2, name: 'Febbraio' },
    { value: 3, name: 'Marzo' }, { value: 4, name: 'Aprile' },
    { value: 5, name: 'Maggio' }, { value: 6, name: 'Giugno' },
    { value: 7, name: 'Luglio' }, { value: 8, name: 'Agosto' },
    { value: 9, name: 'Settembre' }, { value: 10, name: 'Ottobre' },
    { value: 11, name: 'Novembre' }, { value: 12, name: 'Dicembre' },
];

const CombinedTotalsWidget: React.FC<CombinedTotalsWidgetProps> = ({ 
  totalClients,
  totalContracts,
  selectedYear,
  selectedMonth,
  selectedProvider,
}) => {
  const monthName = selectedMonth === 'all' ? undefined : months.find(m => m.value === parseInt(selectedMonth, 10))?.name;
  
  const subtitleParts: string[] = [];
  if (selectedProvider !== 'all') {
      subtitleParts.push(selectedProvider);
  }
  if (selectedMonth !== 'all' && monthName) {
      subtitleParts.push(monthName);
  }
  if (selectedYear !== 'all') {
      subtitleParts.push(selectedYear);
  }

  let contractsSubtitle = "";
  if (subtitleParts.length > 0) {
      contractsSubtitle = `(${subtitleParts.join(', ')})`;
  } else {
      contractsSubtitle = "(Complessivo)";
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 flex flex-col justify-between h-full animate-fade-in">
      {/* Sezione Clienti */}
      <div>
        <div className="flex items-start">
          <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <UserGroupIcon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Clienti Totali</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 break-words">{totalClients}</p>
          </div>
        </div>
      </div>

      {/* Divisore */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        {/* Sezione Contratti */}
        <div className="flex items-start">
          <div className="flex-shrink-0 bg-sky-500 rounded-md p-3">
              <DocumentDuplicateIcon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Contratti <span className="text-xs text-slate-400 block sm:inline sm:ml-1">{contractsSubtitle}</span>
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 break-words">{totalContracts}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CombinedTotalsWidget;