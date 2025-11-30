
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Client, Contract, Address } from '../types';
import { PencilIcon, TrashIcon, PlusIcon, UserGroupIcon, ChevronDownIcon, CalendarIcon, DocumentDuplicateIcon, SearchIcon, DocumentDownloadIcon } from './Icons';
import { convertToDelimitedString, downloadFile } from '../utils/dataExport';

// --- Export Button Component with Dropdown ---
const ExportButton: React.FC<{ onExport: (format: 'csv' | 'excel') => void, title: string }> = ({ onExport, title }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={wrapperRef} className="relative inline-block text-left">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex-shrink-0 inline-flex items-center justify-center bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 font-bold py-2 px-4 rounded-lg shadow-md border border-slate-300 dark:border-slate-600 transition-colors"
                title={title}
            >
                <DocumentDownloadIcon className="h-5 w-5 mr-2" />
                Esporta
                <ChevronDownIcon className={`h-5 w-5 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-slate-700 ring-1 ring-black ring-opacity-5 z-10 animate-scale-in">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <button
                            onClick={() => { onExport('csv'); setIsOpen(false); }}
                            className="w-full text-left block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                            role="menuitem"
                        >
                            Formato CSV <span className="text-xs text-slate-500">(virgola)</span>
                        </button>
                        <button
                            onClick={() => { onExport('excel'); setIsOpen(false); }}
                            className="w-full text-left block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                            role="menuitem"
                        >
                            Formato Excel <span className="text-xs text-slate-500">(punto e virgola)</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


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

  const handleExportClients = (format: 'csv' | 'excel') => {
    const delimiter = format === 'excel' ? ';' : ',';
    const filename = `clienti.csv`;
    
    const maxIbans = Math.max(0, ...sortedAndFilteredClients.map(c => c.ibans?.length || 0));

    const headers: Record<string, string> = {
        'id': 'ID',
        'firstName': 'Nome',
        'lastName': 'Cognome',
        'ragioneSociale': 'Ragione Sociale',
        'email': 'Email',
        'mobilePhone': 'Cellulare',
        'codiceFiscale': 'Codice Fiscale',
        'pIva': 'Partita IVA',
        'legalAddress.street': 'Sede Legale - Via',
        'legalAddress.zipCode': 'Sede Legale - CAP',
        'legalAddress.city': 'Sede Legale - Comune',
        'legalAddress.state': 'Sede Legale - Provincia',
        'legalAddress.country': 'Sede Legale - Nazione',
        'residentialAddress.street': 'Residenza - Via',
        'residentialAddress.zipCode': 'Residenza - CAP',
        'residentialAddress.city': 'Residenza - Comune',
        'residentialAddress.state': 'Residenza - Provincia',
        'residentialAddress.country': 'Residenza - Nazione',
        'notes': 'Note',
        'createdAt': 'Data Creazione'
    };

    for (let i = 0; i < maxIbans; i++) {
        headers[`ibans.${i}.value`] = `IBAN ${i + 1} - Valore`;
        headers[`ibans.${i}.type`] = `IBAN ${i + 1} - Tipo`;
    }

    const csvString = convertToDelimitedString(sortedAndFilteredClients, headers, delimiter);
    downloadFile(csvString, filename);
  };

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
            <ExportButton onExport={handleExportClients} title="Esporta elenco clienti" />
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
                        <th scope="col" className="px-6 py-3 text-center">Contratti (Attivi/Tot.)</th>
                        <th scope="col" className="px-6 py-3 text-right">Azioni</th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedAndFilteredClients.map(client => {
                        const clientContracts = contracts.filter(c => c.clientId === client.id);
                        const totalContractsCount = clientContracts.length;

                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        const activeContractsCount = clientContracts.filter(c => {
                          if (!c.startDate) return false;
                          
                          // Parse date string as YYYY-MM-DD to avoid timezone issues
                          const [y, m, d] = c.startDate.split('-').map(Number);
                          const startDate = new Date(y, m - 1, d);

                          if (startDate > today) return false; // Not started yet

                          if (c.endDate) {
                            const [ey, em, ed] = c.endDate.split('-').map(Number);
                            const endDate = new Date(ey, em - 1, ed);
                            if (endDate < today) return false; // Already ended
                          }
                          
                          return true;
                        }).length;

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
                                        <span className="font-medium text-slate-700 dark:text-slate-200">
                                            {activeContractsCount} / {totalContractsCount}
                                        </span>
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
