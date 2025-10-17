import React from 'react';
import { TrendingUpIcon, LightningBoltIcon, FireIcon, DeviceMobileIcon } from './Icons';

interface CurrentMonthCommissionWidgetProps {
  totalCommission: number;
  energyCommission: number;
  telephonyCommission: number;
}

const CurrentMonthCommissionWidget: React.FC<CurrentMonthCommissionWidgetProps> = ({ 
  totalCommission,
  energyCommission,
  telephonyCommission,
}) => {
  const currentMonthName = new Date().toLocaleString('it-IT', { month: 'long' });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-start">
          <div className="flex-shrink-0 bg-teal-500 rounded-md p-3">
              <TrendingUpIcon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate capitalize">
                Provvigioni {currentMonthName}
              </dt>
              <dd>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {totalCommission.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-around text-center">
          <div>
              <div className="flex items-center justify-center text-xs font-medium text-slate-500 dark:text-slate-400">
                  <LightningBoltIcon className="h-4 w-4 text-yellow-500 mr-0.5" />
                  <FireIcon className="h-4 w-4 text-orange-500 mr-1.5" />
                  <span>Energia/Gas</span>
              </div>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-200">
                {energyCommission.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
              </p>
          </div>
          <div className="w-px bg-slate-200 dark:bg-slate-700"></div> {/* Divider */}
          <div>
               <div className="flex items-center justify-center text-xs font-medium text-slate-500 dark:text-slate-400">
                   <DeviceMobileIcon className="h-4 w-4 text-sky-500 mr-1.5" />
                   <span>Telefonia</span>
               </div>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-200">
                {telephonyCommission.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
              </p>
          </div>
      </div>
    </div>
  );
};

export default CurrentMonthCommissionWidget;
