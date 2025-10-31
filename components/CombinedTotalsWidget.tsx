import React from 'react';
import { UserGroupIcon, DocumentDuplicateIcon } from './Icons';

interface CombinedTotalsWidgetProps {
  totalClients: number;
  totalContracts: number;
  contractsSubtitle: string;
}

const CombinedTotalsWidget: React.FC<CombinedTotalsWidgetProps> = ({ 
  totalClients,
  totalContracts,
  contractsSubtitle,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 flex flex-col justify-between h-full">
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
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-start">
          <div className="flex-shrink-0 bg-sky-500 rounded-md p-3">
              <DocumentDuplicateIcon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Contratti <span className="text-xs">{contractsSubtitle}</span>
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 break-words">{totalContracts}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CombinedTotalsWidget;