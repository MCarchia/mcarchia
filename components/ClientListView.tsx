import React, { useState, useMemo } from 'react';
import type { Client, Contract, Address } from '../types';
import { ContractType } from '../types';
import { PencilIcon, TrashIcon, PlusIcon, LightningBoltIcon, DeviceMobileIcon, UserGroupIcon, ChevronUpIcon, ChevronDownIcon, FireIcon, CalendarIcon, DocumentDuplicateIcon, ExclamationIcon, SearchIcon } from './Icons';

// --- VISTA GESTIONE CLIENTI ---
interface ClientListViewProps {
  clients: Client[];
  contracts: Contract[];
  onAdd: () => void;
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => void;
}

const formatAddress = (address?: Address) => {
  if (!address || (!address.street && !address.city && !address.zipCode)) {
    return 'N/D';
  }
  const parts = [
    address.street,
    address.zipCode,
    address.city,
    address.state ? `(${address.state})` : null,
    address.country
  ];
  return parts.filter(Boolean).join(', ');
};

export const ClientListView: React.FC<ClientListViewProps> = ({ clients, contracts, onAdd, onEdit, onDelete }) => {
  const [filter, setFilter] = useState('');

  const sortedAndFilteredClients = useMemo(() => {
    const sorted = [...clients].sort((a, b) => {
        const lastNameComparison = (a.lastName || '').localeCompare(b.lastName || '');
        if (lastNameComparison !== 0) {
            return lastNameComparison;
        }
        return (a.firstName || '').localeCompare(b.firstName || '');
    });
    
    if (!filter.trim()) {
        return sorted;
    }

    const lowerCaseFilter = filter.toLowerCase().trim();
    return sorted.filter(client =>
        client.firstName.toLowerCase().includes(lowerCaseFilter) ||
        client.lastName.toLowerCase().includes(lowerCaseFilter) ||
        (client.ragioneSociale && client.ragioneSociale.toLowerCase().includes(lowerCaseFilter)) ||
        client.email.toLowerCase().includes(lowerCaseFilter) ||
        (client.codiceFiscale && client.codiceFiscale.toLowerCase().includes(lowerCaseFilter)) ||
        (client.pIva && client.pIva.toLowerCase().includes(lowerCaseFilter))
    );
  }, [clients, filter]);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Elenco Clienti</h1>
        <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Filtra per nome, CF, P.IVA..."
                    className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                />
            </div>
            <button
              onClick={onAdd}
              className="flex-shrink-0 flex items-center justify-center bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nuovo
            </button>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
            {clients.length === 0 ? (
                <div className="text-center py-20 px-6">
                    <UserGroupIcon className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-lg font-medium text-slate-800 dark:text-slate-100">Nessun cliente trovato</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Inizia aggiungendo il tuo primo cliente.</p>
                </div>
            ) : sortedAndFilteredClients.length === 0 ? (
                 <div className="text-center py-20 px-6">
                    <SearchIcon className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-lg font-medium text-slate-800 dark:text-slate-100">Nessun cliente corrisponde alla ricerca</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Prova a modificare i criteri di ricerca.</p>
                </div>
            ) : (
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Cliente</th>
                        <th scope="col" className="px-6 py-3">Contatti</th>
                        <th scope="col" className="px-6 py-3">Indirizzi</th>
                        <th scope="col" className="px-6 py-3 text-center">Contratti</th>
                        <th scope="col" className="px-6 py-3 text-right">Azioni</th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedAndFilteredClients.map(client => {
                        const contractCount = contracts.filter(c => c.clientId === client.id).length;
                        return (
                            <tr key={client.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap align-top">
                                   <div className="font-semibold">{`${client.lastName} ${client.firstName}`}</div>
                                   {client.ragioneSociale && <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">{client.ragioneSociale}</div>}
                                   {(client.codiceFiscale || client.pIva) && (
                                       <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1 space-x-4">
                                           {client.codiceFiscale && <span>CF: {client.codiceFiscale}</span>}
                                           {client.pIva && <span>P.IVA: {client.pIva}</span>}
                                       </div>
                                   )}
                                   <div className="flex items-center text-xs text-slate-400 dark:text-slate-500 mt-2">
                                     <CalendarIcon className="h-4 w-4 mr-1.5" />
                                     <span>Cliente dal: {new Date(client.createdAt).toLocaleDateString('it-IT')}</span>
                                   </div>
                                </td>
                                <td className="px-6 py-4 align-top">
                                    <div>{client.email}</div>
                                    <div className="text-xs text-slate-400 dark:text-slate-500">{client.mobilePhone}</div>
                                </td>
                                 <td className="px-6 py-4 align-top text-xs">
                                    <div className="text-slate-600 dark:text-slate-300"><span className="font-semibold">Sede Legale:</span> {formatAddress(client.legalAddress)}</div>
                                    <div className="text-slate-600 dark:text-slate-300 mt-1"><span className="font-semibold">Residenza:</span> {formatAddress(client.residentialAddress)}</div>
                                </td>
                                <td className="px-6 py-4 align-top text-center">
                                    <div className="flex items-center justify-center space-x-2">
                                        <DocumentDuplicateIcon className="h-4 w-4 text-slate-400" />
                                        <span className="font-medium text-slate-700 dark:text-slate-200">{contractCount}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right align-top">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button onClick={() => onEdit(client)} className="p-2 text-sky-600 rounded-full hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors" title="Modifica cliente" aria-label={`Modifica cliente ${client.firstName} ${client.lastName}`}>
                                            <PencilIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => onDelete(client.id)} className="p-2 text-red-600 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors" title="Elimina cliente" aria-label={`Elimina cliente ${client.firstName} ${client.lastName}`}>
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            )}
        </div>
      </div>
    </div>
  );
};

// --- VISTA GESTIONE CONTRATTI ---
interface ContractListViewProps {
  contracts: Contract[];
  clients: Client[];
  onAdd: () => void;
  onEdit: (contract: Contract) => void;
  onDelete: (contractId: string) => void;
  availableProviders: string[];
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
}

type SortKey = 'endDate' | 'commission';
type SortDirection = 'ascending' | 'descending';
type SortConfig = { key: SortKey; direction: SortDirection } | null;


export const ContractListView: React.FC<ContractListViewProps> = ({ 
    contracts, 
    clients, 
    onAdd, 
    onEdit, 
    onDelete,
    availableProviders,
    selectedProvider,
    onProviderChange
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'endDate', direction: 'ascending' });
  
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : 'N/D';
  };

  const isExpiringSoon = (endDateStr?: string): boolean => {
      if (!endDateStr) return false;
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);
      now.setHours(0,0,0,0);
      const endDate = new Date(endDateStr);
      return endDate >= now && endDate <= thirtyDaysFromNow;
  };

  const sortedContracts = useMemo(() => {
    let sortableContracts = [...contracts];
    if (sortConfig !== null) {
      sortableContracts.sort((a, b) => {
        let aValue, bValue;
        
        if (sortConfig.key === 'endDate') {
            if (!a.endDate && !b.endDate) return 0;
            if (!a.endDate) return 1; // Unset dates go to the end
            if (!b.endDate) return -1;
            aValue = new Date(a.endDate).getTime();
            bValue = new Date(b.endDate).getTime();
        } else if (sortConfig.key === 'commission') {
            aValue = a.commission || 0;
            bValue = b.commission || 0;
        } else {
            return 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableContracts;
  }, [contracts, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <span className="w-4 h-4" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ChevronUpIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />;
    }
    return <ChevronDownIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />;
  };
  
  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Gestione Contratti</h1>
        <button
          onClick={onAdd}
          disabled={clients.length === 0}
          className="flex items-center justify-center bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:transform-none"
          title={clients.length === 0 ? "Aggiungi almeno un cliente prima di creare un contratto" : ""}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuovo Contratto
        </button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
        {availableProviders.length > 0 && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
            <div className="flex items-center space-x-3 max-w-sm">
              <label htmlFor="provider-filter" className="text-sm font-medium text-slate-600 dark:text-slate-300 flex-shrink-0">
                Filtra fornitore:
              </label>
              <select
                id="provider-filter"
                value={selectedProvider}
                onChange={(e) => onProviderChange(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm rounded-md"
              >
                <option value="all">Tutti i fornitori</option>
                {[...availableProviders].sort((a, b) => a.localeCompare(b)).map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          {sortedContracts.length > 0 ? (
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
              <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th scope="col" className="px-6 py-3">Tipo</th>
                  <th scope="col" className="px-6 py-3">Cliente</th>
                  <th scope="col" className="px-6 py-3">Fornitore</th>
                  <th scope="col" className="px-6 py-3">Indirizzo Fornitura</th>
                  <th scope="col" className="px-6 py-3">
                    <button onClick={() => requestSort('commission')} className="flex items-center space-x-1 group">
                      <span>Provvigione</span>
                      {getSortIcon('commission')}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3">
                    <button onClick={() => requestSort('endDate')} className="flex items-center space-x-1 group">
                      <span>Scadenza</span>
                      {getSortIcon('endDate')}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {sortedContracts.map((contract) => {
                  const expiring = isExpiringSoon(contract.endDate);
                  const expired = contract.endDate ? new Date(contract.endDate) < new Date(new Date().toDateString()) : false;

                  let dateColor;
                   if (contract.endDate) {
                    if (expired) {
                      dateColor = 'text-red-600 dark:text-red-500';
                    } else if (expiring) {
                      dateColor = 'text-amber-600 dark:text-amber-500';
                    } else {
                      dateColor = 'text-slate-700 dark:text-slate-300';
                    }
                  } else {
                      dateColor = 'text-slate-400 dark:text-slate-500';
                  }

                  return (
                    <tr key={contract.id} className={`border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${expiring ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-white dark:bg-slate-800'}`}>
                      <td className="px-6 py-4 align-top">
                        {contract.type === ContractType.Electricity ? (
                          <LightningBoltIcon className="h-5 w-5 text-yellow-500" title="Energia Elettrica" />
                        ) : contract.type === ContractType.Gas ? (
                          <FireIcon className="h-5 w-5 text-orange-500" title="Gas Naturale" />
                        ) : (
                          <DeviceMobileIcon className="h-5 w-5 text-sky-500" title="Telefonia" />
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap align-top">{getClientName(contract.clientId)}</td>
                      <td className="px-6 py-4 align-top">{contract.provider}</td>
                      <td className="px-6 py-4 text-xs align-top">{formatAddress(contract.supplyAddress)}</td>
                      <td className="px-6 py-4 align-top font-semibold text-slate-700 dark:text-slate-200">
                        {contract.commission != null ? contract.commission.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }) : 'N/D'}
                      </td>
                      <td className={`px-6 py-4 font-semibold align-top ${dateColor}`}>
                        <div className="flex items-center">
                          {expiring && <ExclamationIcon className="h-4 w-4 text-amber-500 mr-1.5 flex-shrink-0" />}
                          <span>{contract.endDate ? new Date(contract.endDate).toLocaleDateString('it-IT') : 'N/D'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right align-top">
                          <div className="flex items-center justify-end space-x-2">
                            <button onClick={() => onEdit(contract)} className="p-2 text-sky-600 rounded-full hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors" title="Modifica contratto" aria-label={`Modifica contratto ${contract.provider} per ${getClientName(contract.clientId)}`}>
                                <PencilIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => onDelete(contract.id)} className="p-2 text-red-600 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors" title="Elimina contratto" aria-label={`Elimina contratto ${contract.provider} per ${getClientName(contract.clientId)}`}>
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-20 px-6">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-slate-800 dark:text-slate-100">Nessun contratto trovato</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {selectedProvider !== 'all'
                  ? `Nessun contratto trovato per il fornitore "${selectedProvider}".`
                  : clients.length > 0
                  ? 'Crea il tuo primo contratto.'
                  : 'Aggiungi un cliente per poter creare un contratto.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};