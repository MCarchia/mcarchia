import React from 'react';
import { DocumentDuplicateIcon } from './Icons';

interface TotalContractsWidgetProps {
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

const TotalContractsWidget: React.FC<TotalContractsWidgetProps> = ({ 
  totalContracts,
  selectedYear,
  selectedMonth,
  selectedProvider,
}) => {
  const monthName = selectedMonth === 'all' ? undefined : months.find(m => m.value === parseInt(selectedMonth, 10))?.name;
  
  let title = "Contratti Totali";
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

  let subtitle = "";
  if (subtitleParts.length > 0) {
      subtitle = `(${subtitleParts.join(', ')})`;
  } else {
      subtitle = "(Complessivo)";
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between">
      <div className="flex items-start">
        <div className="flex-shrink-0 bg-sky-500 rounded-md p-3">
            <DocumentDuplicateIcon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-slate-500 truncate">
              {title} <span className="text-xs">{subtitle}</span>
            </dt>
            <dd>
              <div className="text-2xl font-bold text-slate-900">
                {totalContracts}
              </div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default TotalContractsWidget;