
import React, { useState, useEffect, useMemo } from 'react';
import type { Client, Contract } from '../types';
import { ContractType } from '../types';
import { XIcon, CheckCircleSolidIcon, PlusIcon } from './Icons';
import { Spinner } from './Spinner';

interface ContractFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contractData: Omit<Contract, 'id'>) => void;
  contract: Contract | null;
  clients: Client[];
  providers: string[];
  operationTypes?: string[]; // New prop for dynamic operations
  onAddProvider: (provider: string) => void;
  isSaving: boolean;
  isSuccess?: boolean;
}

export const ContractFormModal: React.FC<ContractFormModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    contract, 
    clients, 
    providers, 
    operationTypes = [], // Default empty array if not passed yet
    onAddProvider, 
    isSaving, 
    isSuccess 
}) => {
  const getInitialFormData = () => ({
    clientId: '',
    type: ContractType.Electricity, 
    operationType: '', // Default empty
    customerType: 'residential', 
    provider: '',
    contractCode: '',
    startDate: '',
    endDate: '',
    notes: '',
    pod: '',
    kw: '',
    volt: '',
    pdr: '',
    remi: '', 
    meterSerial: '', 
    commission: '',
    isPaid: false,
    fiberType: '',
    supplyAddress: { street: '', zipCode: '', city: '', state: '', country: 'Italia' },
  });

  const [formData, setFormData] = useState(getInitialFormData());
  const [showNewProviderInput, setShowNewProviderInput] = useState(false);
  const [showNewVoltInput, setShowNewVoltInput] = useState(false);

  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => {
        const lastNameComparison = (a.lastName || '').localeCompare(b.lastName || '');
        if (lastNameComparison !== 0) {
            return lastNameComparison;
        }
        return (a.firstName || '').localeCompare(b.firstName || '');
    });
  }, [clients]);

  const standardVolts = ['230', '400', '20.000'];

  useEffect(() => {
    if (isOpen) {
      if (contract) {
        const providerExists = providers.some(p => p.toLowerCase() === contract.provider.toLowerCase());
        setFormData({
            clientId: contract.clientId,
            type: contract.type as ContractType,
            operationType: contract.operationType || '',
            customerType: contract.customerType || 'residential',
            provider: contract.provider,
            contractCode: contract.contractCode,
            startDate: contract.startDate || '',
            endDate: contract.endDate || '',
            notes: contract.notes || '',
            pod: contract.pod || '',
            kw: contract.kw != null ? String(contract.kw) : '',
            volt: contract.volt || '',
            pdr: contract.pdr || '',
            remi: contract.remi || '',
            meterSerial: contract.meterSerial || '',
            commission: contract.commission != null ? String(contract.commission) : '',
            isPaid: contract.isPaid || false,
            fiberType: contract.fiberType || '',
            supplyAddress: { ...getInitialFormData().supplyAddress, ...(contract.supplyAddress || {}) },
        });

        if (!providerExists && contract.provider) {
            setShowNewProviderInput(true);
        } else {
            setShowNewProviderInput(false);
        }

        if (contract.volt && !standardVolts.includes(contract.volt)) {
            setShowNewVoltInput(true);
        } else {
            setShowNewVoltInput(false);
        }

      } else {
        const initialData = getInitialFormData();
        initialData.clientId = sortedClients[0]?.id || '';
        // Set default operation type if available
        if (operationTypes.length > 0) {
            initialData.operationType = operationTypes[0];
        }
        setFormData(initialData);
        setShowNewProviderInput(false);
        setShowNewVoltInput(false);
      }
    }
  }, [contract, isOpen, providers, sortedClients, operationTypes]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('supplyAddress.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        supplyAddress: {
          ...prev.supplyAddress,
          [field]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProviderSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'add_new') {
        setShowNewProviderInput(true);
        setFormData(prev => ({ ...prev, provider: '' }));
    } else {
        setShowNewProviderInput(false);
        setFormData(prev => ({ ...prev, provider: value }));
    }
  };

  const handleVoltSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value === 'add_new') {
          setShowNewVoltInput(true);
          setFormData(prev => ({ ...prev, volt: '' }));
      } else {
          setShowNewVoltInput(false);
          setFormData(prev => ({ ...prev, volt: value }));
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(isSaving || isSuccess) return;

    const trimmedProvider = formData.provider.trim();
    const isNewProvider = trimmedProvider && !providers.some(p => p.toLowerCase() === trimmedProvider.toLowerCase());
    if (isNewProvider) {
      onAddProvider(trimmedProvider);
    }
    
    if (formData.clientId && trimmedProvider) {
      const { commission, kw, customerType, ...rest } = formData;
      onSave({
        ...rest,
        customerType: customerType as 'residential' | 'business',
        provider: trimmedProvider,
        commission: commission ? parseFloat(commission) : undefined,
        kw: kw ? parseFloat(kw) : undefined,
      });
    } else {
      alert("Cliente e Fornitore sono campi obbligatori.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start p-4 overflow-y-auto" onClick={!isSaving && !isSuccess ? onClose : undefined}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl relative transform transition-all my-8" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">{contract ? 'Modifica Contratto' : 'Nuovo Contratto'}</h2>
          <button onClick={onClose} disabled={isSaving || isSuccess} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition disabled:opacity-50">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 max-h-[75vh] overflow-y-auto">
          <div className="space-y-6">
            <div className="pointer-events-none-if-success" style={isSaving || isSuccess ? { pointerEvents: 'none', opacity: 0.7 } : {}}>
                <div>
                <label htmlFor="clientId" className="block text-sm font-medium text-slate-700">Cliente *</label>
                <select id="clientId" name="clientId" value={formData.clientId} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm">
                    <option value="" disabled>Seleziona un cliente</option>
                    {sortedClients.map(c => (
                        <option key={c.id} value={c.id}>
                            {`${c.lastName} ${c.firstName}${c.ragioneSociale ? ` (${c.ragioneSociale})` : ''}`}
                        </option>
                    ))}
                </select>
                </div>
                
                <fieldset className="p-4 border border-slate-200 rounded-lg space-y-4 bg-slate-50 mt-4">
                    <legend className="text-md font-semibold text-slate-700 px-2 -mb-2">Dettagli Contratto</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="customerType" className="block text-sm font-medium text-slate-600">Tipologia Cliente</label>
                        <select id="customerType" name="customerType" value={formData.customerType} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm">
                            <option value="residential">Residenziale / Domestico</option>
                            <option value="business">Business / Azienda</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-slate-600">Tipo Contratto</label>
                        <select 
                            id="type" 
                            name="type" 
                            value={formData.type} 
                            onChange={handleChange} 
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                        >
                            <option value={ContractType.Electricity}>Energia Elettrica</option>
                            <option value={ContractType.Gas}>Gas Naturale</option>
                            <option value={ContractType.Telephony}>Telefonia</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="provider-select" className="block text-sm font-medium text-slate-600">Fornitore *</label>
                        <div className="mt-1">
                        <select
                            id="provider-select"
                            name="provider-select"
                            value={showNewProviderInput ? 'add_new' : formData.provider}
                            onChange={handleProviderSelectChange}
                            className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                        >
                            <option value="" disabled>Seleziona un fornitore</option>
                            {providers.sort().map(p => <option key={p} value={p}>{p}</option>)}
                            <option value="add_new">-- Altro (Aggiungi nuovo) --</option>
                        </select>
                        {showNewProviderInput && (
                            <div className="mt-2 animate-fade-in">
                            <input
                                type="text"
                                name="provider"
                                value={formData.provider}
                                onChange={handleChange}
                                required
                                className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                                placeholder="Nome nuovo fornitore"
                                autoFocus
                            />
                            </div>
                        )}
                        </div>
                    </div>

                    {/* NEW: Operation Type Dropdown - Moved here to be next to Provider in the grid */}
                    <div>
                        <label htmlFor="operationType" className="block text-sm font-medium text-slate-600">Tipo Operazione</label>
                        <select 
                            id="operationType" 
                            name="operationType" 
                            value={formData.operationType} 
                            onChange={handleChange} 
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                        >
                            <option value="">-- Seleziona (Opzionale) --</option>
                            {operationTypes.map(op => (
                                <option key={op} value={op}>{op}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="contractCode" className="block text-sm font-medium text-slate-600">Codice Contratto</label>
                        <input type="text" id="contractCode" name="contractCode" value={formData.contractCode} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="commission" className="block text-sm font-medium text-slate-600">Provvigione (€)</label>
                        <input type="number" id="commission" name="commission" value={formData.commission} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" min="0" step="0.01" placeholder="Es. 150.00" />
                    </div>
                    
                    {formData.type === ContractType.Electricity && (
                        <>
                            <div>
                                <label htmlFor="pod" className="block text-sm font-medium text-slate-600">Codice POD</label>
                                <input type="text" id="pod" name="pod" value={formData.pod || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="kw" className="block text-sm font-medium text-slate-600">Potenza Impegnata (kW)</label>
                                <input type="number" id="kw" name="kw" value={formData.kw || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" step="0.01" min="0" />
                            </div>
                            <div>
                                <label htmlFor="volt-select" className="block text-sm font-medium text-slate-600">Voltaggio (V)</label>
                                <div className="mt-1">
                                    <select
                                        id="volt-select"
                                        name="volt-select"
                                        value={showNewVoltInput ? 'add_new' : formData.volt}
                                        onChange={handleVoltSelectChange}
                                        className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                                    >
                                        <option value="">Seleziona voltaggio</option>
                                        {standardVolts.map(v => <option key={v} value={v}>{v}</option>)}
                                        <option value="add_new">-- Altro --</option>
                                    </select>
                                    {showNewVoltInput && (
                                        <div className="mt-2 animate-fade-in">
                                            <input
                                                type="text"
                                                name="volt"
                                                value={formData.volt}
                                                onChange={handleChange}
                                                className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                                                placeholder="Specifica voltaggio"
                                                autoFocus
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="meterSerial" className="block text-sm font-medium text-slate-600">Matricola Contatore</label>
                                <input type="text" id="meterSerial" name="meterSerial" value={formData.meterSerial || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                            </div>
                        </>
                    )}

                    {formData.type === ContractType.Gas && (
                        <>
                            <div>
                            <label htmlFor="pdr" className="block text-sm font-medium text-slate-600">Codice PDR</label>
                            <input type="text" id="pdr" name="pdr" value={formData.pdr || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="remi" className="block text-sm font-medium text-slate-600">Codice Remi</label>
                                <input type="text" id="remi" name="remi" value={formData.remi || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="meterSerial" className="block text-sm font-medium text-slate-600">Matricola Contatore</label>
                                <input type="text" id="meterSerial" name="meterSerial" value={formData.meterSerial || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                            </div>
                        </>
                    )}

                    {formData.type === ContractType.Telephony && (
                        <div className="md:col-span-2">
                        <label htmlFor="fiberType" className="block text-sm font-medium text-slate-600">Tipo Fibra</label>
                        <input type="text" id="fiberType" name="fiberType" value={formData.fiberType || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                        </div>
                    )}
                    
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-slate-600">Data Inizio</label>
                        <input type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-slate-600">Data Scadenza (Opzionale)</label>
                        <input type="date" id="endDate" name="endDate" value={formData.endDate || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                    </div>
                    <div className="md:col-span-2 flex items-center pt-2">
                        <input
                        type="checkbox"
                        id="isPaid"
                        name="isPaid"
                        checked={!!formData.isPaid}
                        onChange={(e) => setFormData(prev => ({ ...prev, isPaid: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        <label htmlFor="isPaid" className="ml-3 block text-sm font-medium text-slate-700">
                        Provvigione Pagata
                        </label>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="contract-notes" className="block text-sm font-medium text-slate-600">Note Contratto</label>
                        <textarea id="contract-notes" name="notes" value={formData.notes || ''} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"></textarea>
                    </div>
                </div>
                </fieldset>

                <fieldset className="mt-4">
                <legend className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">Indirizzo di Fornitura</legend>
                <div className="grid grid-cols-6 gap-4">
                    <div className="col-span-6 sm:col-span-4">
                        <label htmlFor="supplyAddress.street" className="block text-sm font-medium text-slate-700">Via e Civico</label>
                        <input type="text" id="supplyAddress.street" name="supplyAddress.street" value={formData.supplyAddress?.street || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" />
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                        <label htmlFor="supplyAddress.zipCode" className="block text-sm font-medium text-slate-700">CAP</label>
                        <input type="text" id="supplyAddress.zipCode" name="supplyAddress.zipCode" value={formData.supplyAddress?.zipCode || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" />
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                        <label htmlFor="supplyAddress.city" className="block text-sm font-medium text-slate-700">Comune</label>
                        <input type="text" id="supplyAddress.city" name="supplyAddress.city" value={formData.supplyAddress?.city || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" />
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                        <label htmlFor="supplyAddress.state" className="block text-sm font-medium text-slate-700">Provincia (es. MI)</label>
                        <input type="text" id="supplyAddress.state" name="supplyAddress.state" value={formData.supplyAddress?.state || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" />
                    </div>
                    <div className="col-span-6">
                        <label htmlFor="supplyAddress.country" className="block text-sm font-medium text-slate-700">Nazione</label>
                        <input type="text" id="supplyAddress.country" name="supplyAddress.country" value={formData.supplyAddress?.country || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" />
                    </div>
                </div>
                </fieldset>
            </div>

          </div>

          <div className="flex justify-end pt-6 mt-6 border-t border-slate-200 space-x-3">
            <button type="button" onClick={onClose} disabled={isSaving || isSuccess} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition disabled:opacity-50 disabled:cursor-not-allowed">Annulla</button>
            <button 
                type="submit" 
                disabled={isSaving || isSuccess}
                className={`inline-flex items-center justify-center px-6 py-2 rounded-md shadow transition disabled:cursor-not-allowed ${
                    isSuccess 
                        ? 'bg-green-500 text-white hover:bg-green-600' 
                        : 'bg-sky-500 text-white hover:bg-sky-600 disabled:bg-sky-300'
                }`}
            >
                {isSaving && <Spinner size="sm" color="border-white" className="mr-2" />}
                {isSuccess && <CheckCircleSolidIcon className="h-5 w-5 mr-2" />}
                {isSuccess ? 'Salvato!' : (isSaving ? 'Salvataggio...' : 'Salva Contratto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
