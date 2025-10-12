import React, { useState, useEffect } from 'react';
import type { Client, Contract, Iban } from '../types';
import { ContractType } from '../types';
import { XIcon, PlusIcon, TrashIcon } from './Icons';
import { Spinner } from './Spinner';

// --- MODAL PER CLIENTI ---
interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: Omit<Client, 'id' | 'createdAt'>) => void;
  client: Client | null;
  isSaving: boolean;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({ isOpen, onClose, onSave, client, isSaving }) => {
  const getInitialFormData = () => ({
    firstName: '',
    lastName: '',
    email: '',
    mobilePhone: '',
    codiceFiscale: '',
    ibans: [] as Iban[],
    legalAddress: { street: '', zipCode: '', city: '', state: '', country: 'Italia' },
    residentialAddress: { street: '', zipCode: '', city: '', state: '', country: 'Italia' },
    notes: '',
  });

  const [formData, setFormData] = useState(getInitialFormData());
  const [errors, setErrors] = useState<{ codiceFiscale?: string; ibans?: (string | undefined)[] }>({});

  useEffect(() => {
    if (isOpen) {
      if (client) {
        // Data migration for old iban field
        let initialIbans: Iban[] = [];
        if (client.ibans && Array.isArray(client.ibans)) {
          initialIbans = client.ibans;
        } else if ((client as any).iban && typeof (client as any).iban === 'string') {
          initialIbans = [{ value: (client as any).iban, type: 'personal' }];
        }

        setFormData({
          firstName: client.firstName || '',
          lastName: client.lastName || '',
          email: client.email || '',
          mobilePhone: client.mobilePhone || '',
          codiceFiscale: client.codiceFiscale || '',
          ibans: initialIbans,
          legalAddress: { ...getInitialFormData().legalAddress, ...(client.legalAddress || {}) },
          residentialAddress: { ...getInitialFormData().residentialAddress, ...(client.residentialAddress || {}) },
          notes: client.notes || '',
        });
      } else {
        setFormData(getInitialFormData());
      }
      setErrors({}); // Resetta gli errori all'apertura del modale
    }
  }, [client, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
     if (name.includes('.')) {
      const [addressType, field] = name.split('.') as ['legalAddress' | 'residentialAddress', string];
      setFormData(prev => ({
        ...prev,
        [addressType]: {
          ...prev[addressType],
          [field]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleIbanChange = (index: number, field: keyof Iban, value: string) => {
    const newIbans = [...formData.ibans];
    newIbans[index] = { ...newIbans[index], [field]: value as any };
    setFormData(prev => ({ ...prev, ibans: newIbans }));
  };

  const addIban = () => {
    setFormData(prev => ({
      ...prev,
      ibans: [...prev.ibans, { value: '', type: 'personal' }]
    }));
  };

  const removeIban = (index: number) => {
    const newIbans = formData.ibans.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, ibans: newIbans }));
    
    if (errors.ibans) {
      const newIbanErrors = errors.ibans.filter((_, i) => i !== index);
      setErrors(prev => ({...prev, ibans: newIbanErrors}));
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    const validationErrors: { codiceFiscale?: string; ibans?: (string | undefined)[] } = {};

    // Validazione Codice Fiscale
    const cfRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i;
    if (formData.codiceFiscale && !cfRegex.test(formData.codiceFiscale)) {
        validationErrors.codiceFiscale = 'Il formato del Codice Fiscale non è valido. (Es. RSSMRA80A01H501A)';
    }
    
    // Validazione IBAN
    const ibanRegex = /^IT\d{2}[A-Z]\d{10}[a-zA-Z0-9]{12}$/i;
    const ibanErrors: (string | undefined)[] = [];
    let hasIbanError = false;
    formData.ibans.forEach((iban, index) => {
        if (iban.value && !ibanRegex.test(iban.value.replace(/\s/g, ''))) {
            ibanErrors[index] = "Il formato dell'IBAN non è valido. Deve iniziare con IT e avere 27 caratteri.";
            hasIbanError = true;
        } else {
            ibanErrors[index] = undefined;
        }
    });

    if (hasIbanError) {
        validationErrors.ibans = ibanErrors;
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    if (formData.firstName && formData.lastName && formData.email) {
      const finalClientData = {
          ...formData,
          ibans: formData.ibans.filter(iban => iban.value.trim() !== '')
      };
      onSave(finalClientData);
    } else {
      alert("Nome, Cognome e Email sono campi obbligatori.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl relative transform transition-all my-8" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">{client ? 'Modifica Cliente' : 'Nuovo Cliente'}</h2>
          <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 max-h-[75vh] overflow-y-auto">
          <div className="space-y-6">
            
            {/* Dati Anagrafici */}
            <fieldset>
              <legend className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">Dati Anagrafici</legend>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">Nome *</label>
                    <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">Cognome *</label>
                    <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                  </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email *</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                  </div>
                  <div>
                    <label htmlFor="mobilePhone" className="block text-sm font-medium text-slate-700">Cellulare</label>
                    <input type="tel" id="mobilePhone" name="mobilePhone" value={formData.mobilePhone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                  </div>
                </div>
                 <div>
                  <label htmlFor="codiceFiscale" className="block text-sm font-medium text-slate-700">Codice Fiscale</label>
                  <input 
                    type="text" 
                    id="codiceFiscale" 
                    name="codiceFiscale" 
                    value={formData.codiceFiscale} 
                    onChange={handleChange} 
                    className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 sm:text-sm ${errors.codiceFiscale ? 'border-red-500 text-red-900 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'}`}
                    aria-invalid={!!errors.codiceFiscale}
                    aria-describedby={errors.codiceFiscale ? "codice-fiscale-error" : undefined}
                   />
                   {errors.codiceFiscale && <p id="codice-fiscale-error" className="mt-1 text-sm text-red-600">{errors.codiceFiscale}</p>}
                </div>
              </div>
            </fieldset>

            {/* IBANs */}
            <fieldset>
                <legend className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">IBAN</legend>
                <div className="space-y-4">
                {formData.ibans.map((iban, index) => (
                    <div key={index} className="p-3 bg-slate-50 rounded-md border border-slate-200 animate-fade-in-down dark:bg-slate-800/50 dark:border-slate-700">
                    <div className="flex items-start space-x-4">
                        <div className="flex-grow">
                        <label htmlFor={`iban-${index}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">IBAN</label>
                        <input
                            type="text"
                            id={`iban-${index}`}
                            name={`iban-${index}`}
                            value={iban.value}
                            onChange={(e) => handleIbanChange(index, 'value', e.target.value)}
                            className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white ${errors.ibans?.[index] ? 'border-red-500 text-red-900 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'}`}
                            placeholder="IT60X0542811101000000123456"
                            aria-invalid={!!errors.ibans?.[index]}
                            aria-describedby={errors.ibans?.[index] ? `iban-error-${index}` : undefined}
                        />
                        {errors.ibans?.[index] && <p id={`iban-error-${index}`} className="mt-1 text-sm text-red-600">{errors.ibans[index]}</p>}
                        </div>
                        <button type="button" onClick={() => removeIban(index)} className="mt-7 p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors dark:hover:bg-red-900/50" aria-label={`Rimuovi IBAN ${index + 1}`}>
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="mt-3">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo</span>
                        <div className="flex items-center space-x-4 mt-1">
                        <label className="flex items-center">
                            <input
                            type="radio"
                            name={`iban-type-${index}`}
                            value="personal"
                            checked={iban.type === 'personal'}
                            onChange={(e) => handleIbanChange(index, 'type', e.target.value)}
                            className="focus:ring-sky-500 h-4 w-4 text-sky-600 border-slate-300 dark:bg-slate-600 dark:border-slate-500"
                            />
                            <span className="ml-2 text-sm text-slate-600 dark:text-slate-300">Personale</span>
                        </label>
                        <label className="flex items-center">
                            <input
                            type="radio"
                            name={`iban-type-${index}`}
                            value="business"
                            checked={iban.type === 'business'}
                            onChange={(e) => handleIbanChange(index, 'type', e.target.value)}
                            className="focus:ring-sky-500 h-4 w-4 text-sky-600 border-slate-300 dark:bg-slate-600 dark:border-slate-500"
                            />
                            <span className="ml-2 text-sm text-slate-600 dark:text-slate-300">Business</span>
                        </label>
                        </div>
                    </div>
                    </div>
                ))}
                <button type="button" onClick={addIban} className="mt-2 flex items-center text-sm font-semibold text-sky-600 hover:text-sky-700 transition dark:text-sky-400 dark:hover:text-sky-300">
                    <PlusIcon className="h-5 w-5 mr-1" />
                    Aggiungi IBAN
                </button>
                </div>
            </fieldset>

            {/* Sede Legale */}
            <fieldset>
              <legend className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">Indirizzo Sede Legale</legend>
              <div className="grid grid-cols-6 gap-4">
                  <div className="col-span-6 sm:col-span-4">
                      <label htmlFor="legalAddress.street" className="block text-sm font-medium text-slate-700">Via e Civico</label>
                      <input type="text" id="legalAddress.street" name="legalAddress.street" value={formData.legalAddress.street} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" />
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                      <label htmlFor="legalAddress.zipCode" className="block text-sm font-medium text-slate-700">CAP</label>
                      <input type="text" id="legalAddress.zipCode" name="legalAddress.zipCode" value={formData.legalAddress.zipCode} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" />
                  </div>
                   <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="legalAddress.city" className="block text-sm font-medium text-slate-700">Comune</label>
                      <input type="text" id="legalAddress.city" name="legalAddress.city" value={formData.legalAddress.city} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" />
                  </div>
                   <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="legalAddress.state" className="block text-sm font-medium text-slate-700">Provincia (es. MI)</label>
                      <input type="text" id="legalAddress.state" name="legalAddress.state" value={formData.legalAddress.state} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" />
                  </div>
                  <div className="col-span-6">
                      <label htmlFor="legalAddress.country" className="block text-sm font-medium text-slate-700">Nazione</label>
                      <input type="text" id="legalAddress.country" name="legalAddress.country" value={formData.legalAddress.country} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" />
                  </div>
              </div>
            </fieldset>
            
            {/* Residenza */}
            <fieldset>
              <legend className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">Indirizzo di Residenza</legend>
               <div className="grid grid-cols-6 gap-4">
                  <div className="col-span-6 sm:col-span-4">
                      <label htmlFor="residentialAddress.street" className="block text-sm font-medium text-slate-700">Via e Civico</label>
                      <input type="text" id="residentialAddress.street" name="residentialAddress.street" value={formData.residentialAddress.street} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" />
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                      <label htmlFor="residentialAddress.zipCode" className="block text-sm font-medium text-slate-700">CAP</label>
                      <input type="text" id="residentialAddress.zipCode" name="residentialAddress.zipCode" value={formData.residentialAddress.zipCode} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" />
                  </div>
                   <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="residentialAddress.city" className="block text-sm font-medium text-slate-700">Comune</label>
                      <input type="text" id="residentialAddress.city" name="residentialAddress.city" value={formData.residentialAddress.city} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" />
                  </div>
                   <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="residentialAddress.state" className="block text-sm font-medium text-slate-700">Provincia (es. MI)</label>
                      <input type="text" id="residentialAddress.state" name="residentialAddress.state" value={formData.residentialAddress.state} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" />
                  </div>
                  <div className="col-span-6">
                      <label htmlFor="residentialAddress.country" className="block text-sm font-medium text-slate-700">Nazione</label>
                      <input type="text" id="residentialAddress.country" name="residentialAddress.country" value={formData.residentialAddress.country} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" />
                  </div>
              </div>
            </fieldset>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700">Note Cliente</label>
              <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"></textarea>
            </div>
          </div>
          <div className="flex justify-end pt-6 mt-6 border-t border-slate-200 space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition">Annulla</button>
            <button 
                type="submit" 
                disabled={isSaving}
                className="inline-flex items-center justify-center px-6 py-2 bg-sky-500 text-white rounded-md shadow hover:bg-sky-600 transition disabled:bg-sky-300 disabled:cursor-not-allowed"
            >
                {isSaving && <Spinner size="sm" color="border-white" className="mr-2" />}
                {isSaving ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- MODAL PER CONTRATTI ---
interface ContractFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contractData: Omit<Contract, 'id'>) => void;
  contract: Contract | null;
  clients: Client[];
  providers: string[];
  onAddProvider: (provider: string) => void;
  isSaving: boolean;
}

export const ContractFormModal: React.FC<ContractFormModalProps> = ({ isOpen, onClose, onSave, contract, clients, providers, onAddProvider, isSaving }) => {
  const getInitialFormData = () => ({
    clientId: clients[0]?.id || '',
    type: ContractType.Electricity,
    provider: '',
    contractCode: '',
    startDate: '',
    endDate: '',
    notes: '',
    pod: '',
    pdr: '',
    commission: '',
    fiberType: '',
    supplyAddress: { street: '', zipCode: '', city: '', state: '', country: 'Italia' },
  });

  const [formData, setFormData] = useState(getInitialFormData());
  const [showNewProviderInput, setShowNewProviderInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (contract) {
        const providerExists = providers.some(p => p.toLowerCase() === contract.provider.toLowerCase());
        setFormData({
            clientId: contract.clientId,
            type: contract.type,
            provider: contract.provider,
            contractCode: contract.contractCode,
            startDate: contract.startDate || '',
            endDate: contract.endDate || '',
            notes: contract.notes || '',
            pod: contract.pod || '',
            pdr: contract.pdr || '',
            commission: contract.commission != null ? String(contract.commission) : '',
            fiberType: contract.fiberType || '',
            supplyAddress: { ...getInitialFormData().supplyAddress, ...(contract.supplyAddress || {}) },
        });

        if (!providerExists && contract.provider) {
            setShowNewProviderInput(true);
        } else {
            setShowNewProviderInput(false);
        }
      } else {
        setFormData(getInitialFormData());
        setShowNewProviderInput(false);
      }
    }
  }, [contract, isOpen, clients, providers]);
  
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(isSaving) return;

    const trimmedProvider = formData.provider.trim();
    
    const isNewProvider = trimmedProvider && !providers.some(p => p.toLowerCase() === trimmedProvider.toLowerCase());
    if (isNewProvider) {
      onAddProvider(trimmedProvider);
    }
    
    if (formData.clientId && trimmedProvider) {
      const { commission, ...rest } = formData;
      onSave({
        ...rest,
        provider: trimmedProvider,
        commission: commission ? parseFloat(commission) : undefined
      });
    } else {
      alert("Cliente e Fornitore sono campi obbligatori.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl relative transform transition-all my-8" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">{contract ? 'Modifica Contratto' : 'Nuovo Contratto'}</h2>
          <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 max-h-[75vh] overflow-y-auto">
          <div className="space-y-6">
            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-slate-700">Cliente *</label>
              <select id="clientId" name="clientId" value={formData.clientId} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm">
                <option value="" disabled>Seleziona un cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{`${c.firstName} ${c.lastName}`}</option>)}
              </select>
            </div>
            
            <fieldset className="p-4 border border-slate-200 rounded-lg space-y-4 bg-slate-50">
                <legend className="text-md font-semibold text-slate-700 px-2 -mb-2">Dettagli Contratto</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-slate-600">Tipo Contratto</label>
                    <select id="type" name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm">
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
                  <div>
                    <label htmlFor="contractCode" className="block text-sm font-medium text-slate-600">Codice Contratto</label>
                    <input type="text" id="contractCode" name="contractCode" value={formData.contractCode} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                  </div>
                   <div>
                    <label htmlFor="commission" className="block text-sm font-medium text-slate-600">Provvigione (€)</label>
                    <input type="number" id="commission" name="commission" value={formData.commission} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" min="0" step="0.01" placeholder="Es. 150.00" />
                  </div>
                  
                  {formData.type === ContractType.Electricity && (
                    <div>
                      <label htmlFor="pod" className="block text-sm font-medium text-slate-600">POD</label>
                      <input type="text" id="pod" name="pod" value={formData.pod || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                    </div>
                  )}

                  {formData.type === ContractType.Gas && (
                    <div>
                      <label htmlFor="pdr" className="block text-sm font-medium text-slate-600">PDR</label>
                      <input type="text" id="pdr" name="pdr" value={formData.pdr || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                    </div>
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
                  <div className="md:col-span-2">
                    <label htmlFor="contract-notes" className="block text-sm font-medium text-slate-600">Note Contratto</label>
                    <textarea id="contract-notes" name="notes" value={formData.notes || ''} onChange={handleChange} rows={2} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"></textarea>
                  </div>
              </div>
            </fieldset>

            <fieldset>
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

          <div className="flex justify-end pt-6 mt-6 border-t border-slate-200 space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition">Annulla</button>
            <button 
                type="submit" 
                disabled={isSaving}
                className="inline-flex items-center justify-center px-6 py-2 bg-sky-500 text-white rounded-md shadow hover:bg-sky-600 transition disabled:bg-sky-300 disabled:cursor-not-allowed"
            >
                {isSaving && <Spinner size="sm" color="border-white" className="mr-2" />}
                {isSaving ? 'Salvataggio...' : 'Salva Contratto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
