
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Client, Iban, ClientDocument } from '../types';
import { XIcon, PlusIcon, TrashIcon, CheckCircleSolidIcon, PaperClipIcon, CloudUploadIcon, DocumentTextIcon, LinkIcon } from './Icons';
import { Spinner } from './Spinner';
import * as api from '../services/api';

// --- VALIDATION HELPERS ---

const validateCodiceFiscale = (cf: string) => {
    if (!cf) return true;
    const normalizedCF = cf.toUpperCase();
    // Regex che include anche i casi di omocodia (cifre sostituite da lettere L,M,N,P,Q,R,S,T,U,V)
    const cfRegex = /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/;
    if (!cfRegex.test(normalizedCF)) return false;

    const oddValues: { [key: string]: number } = {
        '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
        'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
        'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
        'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
    };
    
    const evenValues: { [key: string]: number } = {
        '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
        'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
        'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
        'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25
    };

    let s = 0;
    for (let i = 0; i < 15; i++) {
        const c = normalizedCF[i];
        if (i % 2 === 0) { // Indice pari => Posizione Dispari
             if (oddValues[c] === undefined) return false;
             s += oddValues[c];
        } else { // Indice dispari => Posizione Pari
             if (evenValues[c] === undefined) return false;
             s += evenValues[c];
        }
    }
    
    const expectedChar = String.fromCharCode((s % 26) + 'A'.charCodeAt(0));
    return expectedChar === normalizedCF[15];
};

const validatePartitaIva = (pi: string) => {
    if (!pi) return true;
    if (!/^[0-9]{11}$/.test(pi)) return false;
    
    let s = 0;
    for(let i = 0; i < 11; i++) {
        let n = parseInt(pi.charAt(i));
        if (i % 2 === 1) { // Indice dispari => posizione pari
            n *= 2;
            if (n > 9) n -= 9;
        }
        s += n;
    }
    return (s % 10 === 0);
};

// --- MODAL PER CLIENTI ---
interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: Omit<Client, 'id' | 'createdAt'>) => void;
  client: Client | null;
  isSaving: boolean;
  isSuccess?: boolean;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({ isOpen, onClose, onSave, client, isSaving, isSuccess }) => {
  const getInitialFormData = () => ({
    firstName: '',
    lastName: '',
    ragioneSociale: '',
    email: '',
    mobilePhone: '',
    codiceFiscale: '',
    pIva: '',
    ibans: [] as Iban[],
    legalAddress: { street: '', zipCode: '', city: '', state: '', country: 'Italia' },
    residentialAddress: { street: '', zipCode: '', city: '', state: '', country: 'Italia' },
    notes: '',
    documents: [] as ClientDocument[],
  });

  const [formData, setFormData] = useState(getInitialFormData());
  const [errors, setErrors] = useState<{ codiceFiscale?: string; pIva?: string; ibans?: (string | undefined)[] }>({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for External Link Input
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkName, setNewLinkName] = useState('');

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
          ragioneSociale: client.ragioneSociale || '',
          email: client.email || '',
          mobilePhone: client.mobilePhone || '',
          codiceFiscale: client.codiceFiscale || '',
          pIva: client.pIva || '',
          ibans: initialIbans,
          legalAddress: { ...getInitialFormData().legalAddress, ...(client.legalAddress || {}) },
          residentialAddress: { ...getInitialFormData().residentialAddress, ...(client.residentialAddress || {}) },
          notes: client.notes || '',
          documents: client.documents || [],
        });
      } else {
        setFormData(getInitialFormData());
      }
      setErrors({}); // Resetta gli errori all'apertura del modale
      setShowLinkInput(false);
      setNewLinkUrl('');
      setNewLinkName('');
    }
  }, [client, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'codiceFiscale') {
        newValue = value.toUpperCase();
    }

     if (name.includes('.')) {
      const [addressType, field] = name.split('.') as ['legalAddress' | 'residentialAddress', string];
      setFormData(prev => ({
        ...prev,
        [addressType]: {
          ...prev[addressType],
          [field]: newValue,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: newValue }));
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setIsUploading(true);
      try {
          const uploadedDocs: ClientDocument[] = [];
          for (let i = 0; i < files.length; i++) {
              const file = files[i];
              const uploadedDoc = await api.uploadClientDocument(file);
              uploadedDocs.push(uploadedDoc);
          }
          setFormData(prev => ({
              ...prev,
              documents: [...prev.documents, ...uploadedDocs]
          }));
      } catch (error) {
          console.error("Upload error:", error);
          alert("Errore durante il caricamento del file. Controlla la connessione e riprova.");
      } finally {
          setIsUploading(false);
          // Reset input value so same file can be selected again
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const handleAddLink = () => {
      if (!newLinkUrl) return;
      let url = newLinkUrl;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
      }
      
      const newDoc: ClientDocument = {
          name: newLinkName || 'Link Esterno',
          url: url,
          type: 'link', // Special type for links
          uploadedAt: new Date().toISOString(),
          path: '' // No storage path
      };

      setFormData(prev => ({
          ...prev,
          documents: [...prev.documents, newDoc]
      }));
      
      setShowLinkInput(false);
      setNewLinkUrl('');
      setNewLinkName('');
  };

  const handleDeleteDocument = async (docIndex: number) => {
      const docToDelete = formData.documents[docIndex];
      // Optimistic update locally
      setFormData(prev => ({
          ...prev,
          documents: prev.documents.filter((_, i) => i !== docIndex)
      }));

      // In background, try to delete from storage IF it has a path (links don't)
      try {
          if (docToDelete.path) {
              await api.deleteClientDocument(docToDelete.path);
          }
      } catch (e) {
          console.error("Error deleting file from storage", e);
          // Not strictly necessary to revert UI state as the file link is broken anyway
      }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || isSuccess || isUploading) return;
    
    const validationErrors: { codiceFiscale?: string; pIva?: string; ibans?: (string | undefined)[] } = {};

    // Validazione Codice Fiscale
    if (formData.codiceFiscale && !validateCodiceFiscale(formData.codiceFiscale)) {
        validationErrors.codiceFiscale = 'Il Codice Fiscale non è valido. Verifica il formato e il codice di controllo.';
    }
    
    // Validazione P.Iva
    if (formData.pIva && !validatePartitaIva(formData.pIva)) {
        validationErrors.pIva = 'La Partita IVA non è valida. Deve contenere 11 cifre e rispettare il codice di controllo.';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start p-4 overflow-y-auto" onClick={!isSaving && !isSuccess ? onClose : undefined}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl relative transform transition-all my-8" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">{client ? 'Modifica Cliente' : 'Nuovo Cliente'}</h2>
          <button onClick={onClose} disabled={isSaving || isSuccess} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition disabled:opacity-50">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 max-h-[75vh] overflow-y-auto">
          <div className="space-y-6">
            
            {/* Dati Anagrafici */}
            <fieldset disabled={isSaving || isSuccess}>
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
                <div>
                  <label htmlFor="ragioneSociale" className="block text-sm font-medium text-slate-700">Ragione Sociale</label>
                  <input type="text" id="ragioneSociale" name="ragioneSociale" value={formData.ragioneSociale} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        placeholder="RSSMRA80A01H501A"
                       />
                       {errors.codiceFiscale && <p id="codice-fiscale-error" className="mt-1 text-sm text-red-600">{errors.codiceFiscale}</p>}
                    </div>
                    <div>
                        <label htmlFor="pIva" className="block text-sm font-medium text-slate-700">P. Iva</label>
                        <input
                            type="text"
                            id="pIva"
                            name="pIva"
                            value={formData.pIva}
                            onChange={handleChange}
                            className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 sm:text-sm ${errors.pIva ? 'border-red-500 text-red-900 focus:border-red-500 focus:ring-red-500' : 'border-slate-300'}`}
                            aria-invalid={!!errors.pIva}
                            aria-describedby={errors.pIva ? "piva-error" : undefined}
                            placeholder="12345678901"
                        />
                        {errors.pIva && <p id="piva-error" className="mt-1 text-sm text-red-600">{errors.pIva}</p>}
                    </div>
                 </div>
              </div>
            </fieldset>

            {/* IBANs */}
            <fieldset disabled={isSaving || isSuccess}>
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
            <fieldset disabled={isSaving || isSuccess}>
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
            <fieldset disabled={isSaving || isSuccess}>
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
              <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} disabled={isSaving || isSuccess} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"></textarea>
            </div>

            {/* Documents Section */}
            <fieldset disabled={isSaving || isSuccess || isUploading}>
                <legend className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2 flex items-center">
                    <PaperClipIcon className="h-5 w-5 mr-2" />
                    Documenti e Allegati
                </legend>
                
                <div className="flex gap-4 mb-4">
                    {/* File Upload Button */}
                    <label className={`flex-1 flex flex-col items-center justify-center h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:hover:border-slate-500 dark:hover:bg-slate-600 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {isUploading ? (
                                <Spinner size="md" />
                            ) : (
                                <>
                                    <CloudUploadIcon className="w-8 h-8 mb-3 text-slate-400" />
                                    <p className="mb-2 text-sm text-slate-500 dark:text-slate-400 text-center"><span className="font-semibold">Carica File</span></p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center">PDF, Immagini (MAX. 10MB)</p>
                                </>
                            )}
                        </div>
                        <input 
                            ref={fileInputRef}
                            id="dropzone-file" 
                            type="file" 
                            className="hidden" 
                            multiple 
                            onChange={handleFileUpload} 
                            disabled={isUploading}
                        />
                    </label>

                    {/* External Link Button */}
                    <div 
                        onClick={() => setShowLinkInput(true)}
                        className="flex-1 flex flex-col items-center justify-center h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:hover:border-slate-500 dark:hover:bg-slate-600 transition-colors"
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <LinkIcon className="w-8 h-8 mb-3 text-slate-400" />
                            <p className="mb-2 text-sm text-slate-500 dark:text-slate-400 text-center"><span className="font-semibold">Collega Link Esterno</span></p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">TeraBox, Mega, Google Drive, ecc.</p>
                        </div>
                    </div>
                </div>

                {/* Link Input Form */}
                {showLinkInput && (
                    <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 animate-fade-in-down">
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">URL Link (Es. TeraBox, Mega, Drive)</label>
                                <input 
                                    type="url" 
                                    value={newLinkUrl}
                                    onChange={(e) => setNewLinkUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nome del file/cartella</label>
                                <input 
                                    type="text" 
                                    value={newLinkName}
                                    onChange={(e) => setNewLinkName(e.target.value)}
                                    placeholder="Es. Documenti Identità"
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => setShowLinkInput(false)} className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800">Annulla</button>
                                <button type="button" onClick={handleAddLink} disabled={!newLinkUrl} className="px-3 py-1 text-sm bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:opacity-50">Aggiungi Link</button>
                            </div>
                        </div>
                    </div>
                )}

                {formData.documents.length > 0 && (
                    <div className="space-y-2">
                        {formData.documents.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-md shadow-sm dark:bg-slate-800 dark:border-slate-700">
                                <div className="flex items-center overflow-hidden">
                                    {doc.type === 'link' ? (
                                        <LinkIcon className="h-5 w-5 text-indigo-400 mr-3 flex-shrink-0" />
                                    ) : (
                                        <DocumentTextIcon className="h-5 w-5 text-slate-400 mr-3 flex-shrink-0" />
                                    )}
                                    <div className="truncate">
                                        <a 
                                            href={doc.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-sm font-medium text-sky-600 hover:underline dark:text-sky-400 truncate block"
                                            title={doc.name}
                                        >
                                            {doc.name}
                                        </a>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {new Date(doc.uploadedAt).toLocaleDateString()} {doc.type === 'link' ? '(Link Esterno)' : ''}
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => handleDeleteDocument(index)} 
                                    className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors ml-2"
                                    title="Elimina documento"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </fieldset>

          </div>
          <div className="flex justify-end pt-6 mt-6 border-t border-slate-200 space-x-3">
            <button type="button" onClick={onClose} disabled={isSaving || isSuccess || isUploading} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition disabled:opacity-50 disabled:cursor-not-allowed">Annulla</button>
            <button 
                type="submit" 
                disabled={isSaving || isSuccess || isUploading}
                className={`inline-flex items-center justify-center px-6 py-2 rounded-md shadow transition disabled:cursor-not-allowed ${
                    isSuccess 
                        ? 'bg-green-500 text-white hover:bg-green-600' 
                        : 'bg-sky-500 text-white hover:bg-sky-600 disabled:bg-sky-300'
                }`}
            >
                {isSaving && <Spinner size="sm" color="border-white" className="mr-2" />}
                {isSuccess && <CheckCircleSolidIcon className="h-5 w-5 mr-2" />}
                {isSuccess ? 'Salvato!' : (isSaving ? 'Salvataggio...' : 'Salva')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
