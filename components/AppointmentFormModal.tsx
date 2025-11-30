
import React, { useState, useEffect } from 'react';
import type { Appointment } from '../types';
import { XIcon, CheckCircleSolidIcon } from './Icons';
import { Spinner } from './Spinner';

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apptData: Omit<Appointment, 'id' | 'createdAt'>) => void;
  appointment: Appointment | null;
  providers: string[];
  statuses: string[];
  isSaving: boolean;
  isSuccess?: boolean;
}

export const AppointmentFormModal: React.FC<AppointmentFormModalProps> = ({ 
    isOpen, onClose, onSave, appointment, providers, statuses, isSaving, isSuccess 
}) => {
  const getInitialFormData = () => ({
    clientName: '',
    provider: '',
    date: new Date().toISOString().split('T')[0], // Default today
    time: '',
    location: '',
    notes: '',
    status: statuses.length > 0 ? statuses[0] : 'Da Fare' // Default to first available status
  });

  const [formData, setFormData] = useState(getInitialFormData());

  useEffect(() => {
    if (isOpen) {
      if (appointment) {
        setFormData({
            clientName: appointment.clientName,
            provider: appointment.provider,
            date: appointment.date,
            time: appointment.time || '',
            location: appointment.location || '',
            notes: appointment.notes || '',
            status: appointment.status
        });
      } else {
        const initial = getInitialFormData();
        if (statuses.length > 0) initial.status = statuses[0];
        setFormData(initial);
      }
    }
  }, [appointment, isOpen, statuses]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(isSaving || isSuccess) return;
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={!isSaving && !isSuccess ? onClose : undefined}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md relative animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">{appointment ? 'Modifica Appuntamento' : 'Nuovo Appuntamento'}</h2>
          <button onClick={onClose} disabled={isSaving || isSuccess} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition disabled:opacity-50">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div>
                <label className="block text-sm font-medium text-slate-700">Nome Cliente / Prospect *</label>
                <input 
                    type="text" 
                    name="clientName" 
                    value={formData.clientName} 
                    onChange={handleChange} 
                    required 
                    placeholder="Es. Mario Rossi"
                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700">Compagnia da Proporre *</label>
                <input 
                    list="providers-list"
                    name="provider" 
                    value={formData.provider} 
                    onChange={handleChange} 
                    required 
                    placeholder="Es. Enel, Tim..."
                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
                <datalist id="providers-list">
                    {providers.map(p => <option key={p} value={p} />)}
                </datalist>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-slate-700">Stato</label>
                <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                >
                    {statuses.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                    {/* Fallback for legacy data */}
                    {!statuses.includes(formData.status) && (
                        <option value={formData.status}>{formData.status}</option>
                    )}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Data *</label>
                    <input 
                        type="date" 
                        name="date" 
                        value={formData.date} 
                        onChange={handleChange} 
                        required 
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Ora</label>
                    <input 
                        type="time" 
                        name="time" 
                        value={formData.time} 
                        onChange={handleChange} 
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700">Luogo / Indirizzo</label>
                <input 
                    type="text" 
                    name="location" 
                    value={formData.location} 
                    onChange={handleChange} 
                    placeholder="Es. Via Roma 1, Milano"
                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700">Note</label>
                <textarea 
                    name="notes" 
                    value={formData.notes} 
                    onChange={handleChange} 
                    rows={3}
                    placeholder="Dettagli aggiuntivi..."
                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
            </div>

            <div className="flex justify-end pt-4 space-x-3">
                <button type="button" onClick={onClose} disabled={isSaving || isSuccess} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition">Annulla</button>
                <button 
                    type="submit" 
                    disabled={isSaving || isSuccess}
                    className={`inline-flex items-center justify-center px-6 py-2 rounded-md shadow transition ${
                        isSuccess ? 'bg-green-500 text-white' : 'bg-sky-500 text-white hover:bg-sky-600'
                    }`}
                >
                    {isSaving && <Spinner size="sm" color="border-white" className="mr-2" />}
                    {isSuccess && <CheckCircleSolidIcon className="h-5 w-5 mr-2" />}
                    {isSuccess ? 'Salvato!' : 'Salva'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};