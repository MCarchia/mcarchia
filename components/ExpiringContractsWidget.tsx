import React from 'react';
import type { Client, Contract } from '../types';
import { ExclamationIcon, PencilIcon, TrashIcon } from './Icons';

interface ExpiringContractsWidgetProps {
  contracts: Contract[];
  clients: Client[];
  onEdit: (contract: Contract) => void;
  onDelete: (contractId: string) => void;
}

const ExpiringContractsWidget: React.FC<ExpiringContractsWidgetProps> = ({ contracts, clients, onEdit, onDelete }) => {
  if (contracts.length === 0) {
    return null;
  }
  
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : 'N/D';
  };
  
  const getDaysRemaining = (endDateStr: string) => {
    const endDate = new Date(endDateStr);
    const now = new Date();
    // Imposta l'ora a mezzanotte per entrambi per confrontare solo le date
    endDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Scaduto';
    if (diffDays === 0) return 'Scade oggi';
    if (diffDays === 1) return 'Scade domani';
    return `Scade tra ${diffDays} giorni`;
  };

  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg shadow-md animate-fade-in">
      <div className="flex">
        <div className="py-1">
          <ExclamationIcon className="h-6 w-6 text-amber-500 mr-4" />
        </div>
        <div className="flex-grow">
          <p className="font-bold text-amber-800">Contratti in Scadenza</p>
          <div className="mt-2 text-sm text-amber-700">
            <ul className="space-y-2">
              {contracts.sort((a,b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime()).map(contract => (
                <li key={contract.id} className="flex items-center justify-between py-1 border-b border-amber-200/50 last:border-b-0">
                  <div>
                    Contratto <strong>{contract.provider}</strong> per <strong>{getClientName(contract.clientId)}</strong>.
                    <span className="ml-2 font-semibold">
                      ({getDaysRemaining(contract.endDate!)})
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0 ml-4">
                     <button 
                      onClick={() => onEdit(contract)} 
                      className="p-1.5 text-sky-600 rounded-full hover:bg-sky-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 focus:ring-sky-500"
                      aria-label={`Modifica contratto ${contract.provider} per ${getClientName(contract.clientId)}`}
                      title="Modifica"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(contract.id)} 
                      className="p-1.5 text-red-600 rounded-full hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 focus:ring-red-500"
                      aria-label={`Elimina contratto ${contract.provider} per ${getClientName(contract.clientId)}`}
                      title="Elimina"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpiringContractsWidget;