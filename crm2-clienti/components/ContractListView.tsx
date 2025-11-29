
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Client, Contract, Address } from '../types';
import { ContractType } from '../types';
import { PencilIcon, TrashIcon, PlusIcon, LightningBoltIcon, DeviceMobileIcon, ChevronUpIcon, ChevronDownIcon, FireIcon, DocumentDuplicateIcon, ExclamationIcon, SearchIcon, FilterIcon, DocumentDownloadIcon, CheckCircleIcon, CheckCircleSolidIcon } from './Icons';

// --- CSV/Excel Export Utilities ---
const escapeCell = (cell: any, delimiter: string): string => {
    if (cell == null) {
        return '';
    }
    const str = String(cell);
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

const convertToDelimitedString = (data: any[], headers: Record<string, string>, delimiter: string): string => {
    const headerValues = Object.values(headers);
    const headerKeys = Object.keys(headers);

    const rows = data.map(item => {
        return headerKeys.map(key => {
            const keys = key.split('.');
            let value = item;
            for (const k of keys) {
                if (value == null) {
                    value = undefined;
                    break;
                }
                value = value[k];
            }
            return escapeCell(value, delimiter);
        }).join(delimiter);
    });
    return [headerValues.join(delimiter), ...rows].join('\r\n');
};

const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

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

// --- VISTA GESTIONE CONTRATTI ---
interface ContractListViewProps {
  contracts: Contract[];
  clients: Client[];
  onAdd: () => void;
  onEdit: (contract: Contract) => void;
  onDelete: (contractId: string) => void;
  onTogglePaidStatus: (contract: Contract) => void;
  availableProviders: string[];
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
  
  availableYears: string[];
  selectedYear: string;
  onYearChange: (year: string) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;

  startDateFrom: string;
  onStartDateFromChange: (date: string) => void;
  startDateTo: string;
  onStartDateToChange: (date: string) => void;
  endDateFrom: string;
  onEndDateFromChange: (date: string) => void;
  endDateTo: string;
  onEndDateToChange: (date: string) => void;
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

type SortKey = 'endDate' | 'commission' | 'clientName';
type SortDirection = 'ascending' | 'descending';
type SortConfig = { key: SortKey; direction: SortDirection } | null;


export const ContractListView: React.FC<ContractListViewProps> = ({ 
    contracts, 
    clients, 
    onAdd, 
    onEdit, 
    onDelete,
    onTogglePaidStatus,
    availableProviders,
    selectedProvider,
    onProviderChange,

    availableYears,
    selectedYear,
    onYearChange,
    selectedMonth,
    onMonthChange,

    startDateFrom,
    onStartDateFromChange,
    startDateTo,
    onStartDateToChange,
    endDateFrom,
    onEndDateFromChange,
    endDateTo,
    onEndDateToChange
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'clientName', direction: 'ascending' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return 'N/D';
    let displayName = `${client.lastName} ${client.firstName}`;
    if (client.ragioneSociale) {
      displayName += ` (${client.ragioneSociale})`;
    }
    return displayName;
  };

  const getContractTypeName = (type: string) => {
      switch (type) {
          case ContractType.Electricity: return 'Energia Elettrica';
          case ContractType.Gas: return 'Gas Naturale';
          case ContractType.Telephony: return 'Telefonia';
          default: return type;
      }
  };

  const isExpiringSoon = (endDateStr?: string): boolean => {
      if (!endDateStr) return false;
      const now = new Date();
      const sixtyDaysFromNow = new Date();
      sixtyDaysFromNow.setDate(now.getDate() + 60);
      now.setHours(0,0,0,0);
      const endDate = new Date(endDateStr);
      return endDate >= now && endDate <= sixtyDaysFromNow;
  };

  const sortedContracts = useMemo(() => {
    let sortableContracts = [...contracts];
    if (sortConfig !== null) {
      sortableContracts.sort((a, b) => {
        if (sortConfig.key === 'clientName') {
            const clientA = clients.find(c => c.id === a.clientId);
            const clientB = clients.find(c => c.id === b.clientId);
            if (!clientA) return 1;
            if (!clientB) return -1;
            
            const lastNameA = clientA.lastName || '';
            const lastNameB = clientB.lastName || '';

            let comparison = lastNameA.localeCompare(lastNameB);
            if (comparison !== 0) {
                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            }

            const firstNameA = clientA.firstName || '';
            const firstNameB = clientB.firstName || '';
            comparison = firstNameA.localeCompare(firstNameB);
            return sortConfig.direction === 'ascending' ? comparison : -comparison;
        }

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
  }, [contracts, sortConfig, clients]);

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
  
  const handleResetFilters = () => {
    onProviderChange('all');
    onYearChange('all');
    onMonthChange('all');
    onStartDateFromChange('');
    onStartDateToChange('');
    onEndDateFromChange('');
    onEndDateToChange('');
  };

  const hasActiveFilters = selectedProvider !== 'all' || selectedYear !== 'all' || selectedMonth !== 'all' || startDateFrom || startDateTo || endDateFrom || endDateTo;

  const handleExportContracts = (format: 'csv' | 'excel') => {
    const delimiter = format === 'excel' ? ';' : ',';
    const filename = `contratti.csv`;

    const dataToExport = sortedContracts.map(contract => ({
        ...contract,
        clientName: getClientName(contract.clientId),
        type: getContractTypeName(contract.type), 
        operationType: contract.operationType || '',
        customerType: contract.customerType === 'business' ? 'Business' : 'Residenziale',
        commission: contract.commission != null ? String(contract.commission).replace('.', ',') : '',
        isPaid: contract.isPaid ? 'Sì' : 'No',
        kw: contract.kw != null ? String(contract.kw).replace('.', ',') : '',
    }));

    const headers: Record<string, string> = {
        'id': 'ID Contratto',
        'clientName': 'Cliente',
        'clientId': 'ID Cliente',
        'type': 'Tipo',
        'operationType': 'Operazione',
        'customerType': 'Tipologia',
        'provider': 'Fornitore',
        'contractCode': 'Codice Contratto',
        'startDate': 'Data Inizio',
        'endDate': 'Data Scadenza',
        'commission': 'Provvigione (€)',
        'isPaid': 'Pagato',
        'pod': 'POD',
        'kw': 'Potenza Impegnata (kW)',
        'volt': 'Voltaggio (V)',
        'pdr': 'PDR',
        'remi': 'Codice Remi',
        'meterSerial': 'Matricola Contatore',
        'fiberType': 'Tipo Fibra',
        'supplyAddress.street': 'Indirizzo Fornitura - Via',
        'supplyAddress.zipCode': 'Indirizzo Fornitura - CAP',
        'supplyAddress.city': 'Indirizzo Fornitura - Comune',
        'supplyAddress.state': 'Indirizzo Fornitura - Provincia',
        'supplyAddress.country': 'Indirizzo Fornitura - Nazione',
        'notes': 'Note',
    };

    const csvString = convertToDelimitedString(dataToExport, headers, delimiter);
    downloadFile(csvString, filename);
  };

  const months = [
    { value: '1', name: 'Gennaio' }, { value: '2', name: 'Febbraio' },
    { value: '3', name: 'Marzo' }, { value: '4', name: 'Aprile' },
    { value: '5', name: 'Maggio' }, { value: '6', name: 'Giugno' },
    { value: '7', name: 'Luglio' }, { value: '8', name: 'Agosto' },
    { value: '9', name: 'Settembre' }, { value: '10', name: 'Ottobre' },
    { value: '11', name: 'Novembre' }, { value: '12', name: 'Dicembre' },
  ];

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
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="provider-filter" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                Filtra fornitore
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
            <div>
              <label htmlFor="year-filter" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                Anno Stipula
              </label>
              <select
                id="year-filter"
                value={selectedYear}
                onChange={(e) => onYearChange(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm rounded-md"
              >
                <option value="all">Tutti gli anni</option>
                {availableYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
                <label htmlFor="month-filter" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Mese Stipula
                </label>
                <select
                    id="month-filter"
                    value={selectedMonth}
                    onChange={(e) => onMonthChange(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm rounded-md"
                >
                    <option value="all">Tutti i mesi</option>
                    {months.map((m) => (
                        <option key={m.value} value={m.value}>{m.name}</option>
                    ))}
                </select>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <div className="text-sm text-slate-500 dark:text-slate-400 italic">
                {sortedContracts.length} contratti trovati
            </div>
            <div className="flex items-end space-x-4">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
              >
                <FilterIcon className="h-5 w-5 mr-2" />
                Filtri Avanzati
                {showAdvancedFilters ? <ChevronUpIcon className="h-5 w-5 ml-2" /> : <ChevronDownIcon className="h-5 w-5 ml-2" />}
              </button>
              <ExportButton onExport={handleExportContracts} title="Esporta elenco contratti filtrati" />
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-600 animate-fade-in-down">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Data Inizio Contratto (Range)</label>
                  <div className="flex items-center space-x-2">
                    <input type="date" value={startDateFrom} onChange={e => onStartDateFromChange(e.target.value)} className="block w-full text-sm px-3 py-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-sky-500 focus:border-sky-500" aria-label="Data inizio da" />
                    <span className="text-slate-500 dark:text-slate-400">→</span>
                    <input type="date" value={startDateTo} onChange={e => onStartDateToChange(e.target.value)} className="block w-full text-sm px-3 py-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-sky-500 focus:border-sky-500" aria-label="Data inizio a" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Data Scadenza Contratto (Range)</label>
                  <div className="flex items-center space-x-2">
                    <input type="date" value={endDateFrom} onChange={e => onEndDateFromChange(e.target.value)} className="block w-full text-sm px-3 py-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-sky-500 focus:border-sky-500" aria-label="Data scadenza da" />
                    <span className="text-slate-500 dark:text-slate-400">→</span>
                    <input type="date" value={endDateTo} onChange={e => onEndDateToChange(e.target.value)} className="block w-full text-sm px-3 py-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-sky-500 focus:border-sky-500" aria-label="Data scadenza a" />
                  </div>
                </div>
              </div>
              {hasActiveFilters && (
                <div className="mt-4 text-right">
                  <button onClick={handleResetFilters} className="text-sm font-medium text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300">
                    Resetta Filtri
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          {sortedContracts.length > 0 ? (
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
              <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th scope="col" className="px-6 py-3">Tipo</th>
                  <th scope="col" className="px-6 py-3">
                    <button onClick={() => requestSort('clientName')} className="flex items-center space-x-1 group">
                      <span>Cliente</span>
                      {getSortIcon('clientName')}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3">Operazione</th>
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
                  <th scope="col" className="px-6 py-3 text-center">Pagato</th>
                  <th scope="col" className="px-6 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {sortedContracts.map((contract) => {
                  const expiring = isExpiringSoon(contract.endDate);
                  const expired = contract.endDate ? new Date(contract.endDate) < new Date(new Date().toDateString()) : false;
                  
                  // Use contract.type directly now that dynamic logic is removed
                  const typeName = getContractTypeName(contract.type);

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
                    <tr key={contract.id} className={`border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all ${ 
                        expired ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500' : 
                        expiring ? 'bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-400' : 
                        contract.isPaid ? 'bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500' : 
                        'bg-white dark:bg-slate-800 border-l-4 border-transparent'
                    }`}>
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col items-center">
                            {contract.type === ContractType.Electricity ? (
                            <LightningBoltIcon className="h-5 w-5 text-yellow-500 mb-1" title={typeName} />
                            ) : contract.type === ContractType.Gas ? (
                            <FireIcon className="h-5 w-5 text-orange-500 mb-1" title={typeName} />
                            ) : (
                            <DeviceMobileIcon className="h-5 w-5 text-sky-500 mb-1" title={typeName} />
                            )}
                             <span className="text-[10px] text-center leading-tight text-slate-500 dark:text-slate-400 mb-1">{typeName}</span>

                            {/* Visualizza tipo Residenziale/Business */}
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${contract.customerType === 'business' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                {contract.customerType === 'business' ? 'Bus.' : 'Res.'}
                            </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium whitespace-nowrap align-top">
                        {(() => {
                          const client = clients.find(c => c.id === contract.clientId);
                          if (!client) {
                            return <span className={`transition-colors ${contract.isPaid ? 'text-green-600 dark:text-green-500' : 'text-slate-900 dark:text-slate-100'}`}>N/D</span>;
                          }
                          return (
                            <div>
                              <div className={`font-semibold transition-colors ${contract.isPaid ? 'text-green-600 dark:text-green-500' : 'text-slate-900 dark:text-slate-100'}`}>
                                {`${client.lastName} ${client.firstName}`}
                              </div>
                              {client.ragioneSociale && (
                                <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                  {client.ragioneSociale}
                                </div>
                              )}
                              {/* Visualizzazione CF o P.IVA in base al tipo cliente */}
                              <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
                                {contract.customerType === 'business' && client.pIva 
                                    ? `P.IVA: ${client.pIva}` 
                                    : (client.codiceFiscale ? `CF: ${client.codiceFiscale}` : '')
                                }
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      {/* NUOVA COLONNA OPERAZIONE */}
                      <td className="px-6 py-4 align-top">
                         {contract.operationType ? (
                            <span className="inline-block px-2 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-semibold border border-blue-100 dark:border-blue-800">
                                {contract.operationType}
                            </span>
                         ) : (
                             <span className="text-slate-400 text-xs">-</span>
                         )}
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col">
                            <span className="font-medium">{contract.provider}</span>
                        </div>
                        {/* Display technical details in the list if available */}
                        {(contract.kw || contract.volt) && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {contract.kw && <span>{contract.kw} kW</span>}
                                {contract.kw && contract.volt && <span> - </span>}
                                {contract.volt && <span>{contract.volt} V</span>}
                            </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs align-top">{formatAddress(contract.supplyAddress)}</td>
                      <td className={`px-6 py-4 align-top font-semibold transition-colors ${contract.isPaid ? 'text-green-600 dark:text-green-500' : 'text-slate-700 dark:text-slate-200'}`}>
                        {contract.commission != null ? contract.commission.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }) : 'N/D'}
                      </td>
                      <td className={`px-6 py-4 font-semibold align-top ${dateColor}`}>
                        <div className="flex flex-col">
                            <div className="flex items-center">
                              {expiring && !expired && <ExclamationIcon className="h-4 w-4 text-amber-500 mr-1.5 flex-shrink-0" />}
                              {expired && <ExclamationIcon className="h-4 w-4 text-red-500 mr-1.5 flex-shrink-0" />}
                              <span>{contract.endDate ? new Date(contract.endDate).toLocaleDateString('it-IT') : 'N/D'}</span>
                            </div>
                            {expiring && !expired && <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/50 dark:text-amber-400 px-1.5 py-0.5 rounded w-fit mt-1">In Scadenza</span>}
                            {expired && <span className="text-[10px] uppercase font-bold text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-400 px-1.5 py-0.5 rounded w-fit mt-1">Scaduto</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top text-center">
                        <button 
                            onClick={() => onTogglePaidStatus(contract)} 
                            className={`p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 ${contract.isPaid ? 'text-green-500 hover:text-green-700 focus:ring-green-500 dark:focus:ring-offset-slate-800' : 'text-slate-400 hover:text-slate-600 focus:ring-sky-500 dark:focus:ring-offset-slate-800'}`}
                            title={contract.isPaid ? "Segna come non pagato" : "Segna come pagato"}
                            aria-label={contract.isPaid ? "Segna contratto come non pagato" : "Segna contratto come pagato"}
                        >
                            {contract.isPaid ? <CheckCircleSolidIcon className="h-6 w-6" /> : <CheckCircleIcon className="h-6 w-6" />}
                        </button>
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
