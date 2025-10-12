import React from 'react';
import { UserGroupIcon } from './Icons';

interface TotalClientsWidgetProps {
  totalClients: number;
}

const TotalClientsWidget: React.FC<TotalClientsWidgetProps> = ({ 
  totalClients,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 flex flex-col justify-between">
      <div className="flex items-start">
        <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
            <UserGroupIcon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
              Clienti Totali
            </dt>
            <dd>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {totalClients}
              </div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default TotalClientsWidget;