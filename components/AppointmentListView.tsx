
import React, { useMemo, useState } from 'react';
import type { Appointment } from '../types';
import { PencilIcon, TrashIcon, PlusIcon, CalendarIcon, SearchIcon, ClockIcon, MapIcon } from './Icons';

interface AppointmentListViewProps {
  appointments: Appointment[];
  onAdd: () => void;
  onEdit: (appt: Appointment) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (appt: Appointment, newStatus: string) => void;
  statuses: string[];
}

export const AppointmentListView: React.FC<AppointmentListViewProps> = ({ 
    appointments, onAdd, onEdit, onDelete, onUpdateStatus, statuses 
}) => {
    const [filter, setFilter] = useState('');

    const sortedAppointments = useMemo(() => {
        let items = [...appointments];
        if (filter) {
            const q = filter.toLowerCase();
            items = items.filter(a => 
                a.clientName.toLowerCase().includes(q) || 
                a.provider.toLowerCase().includes(q) ||
                (a.notes || '').toLowerCase().includes(q)
            );
        }
        // Sort by date (ascending)
        return items.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
            const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
            return dateA - dateB;
        });
    }, [appointments, filter]);

    const getStatusColor = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'completato' || s === 'completed') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        if (s === 'annullato' || s === 'cancelled') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        if (s === 'da fare' || s === 'pending') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    };

    return (
        <div className="animate-fade-in">
             <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Gestione Appuntamenti</h1>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <input 
                            type="text" 
                            value={filter} 
                            onChange={(e) => setFilter(e.target.value)} 
                            placeholder="Cerca appuntamento..." 
                            className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500"
                        />
                    </div>
                    <button onClick={onAdd} className="flex-shrink-0 flex items-center justify-center bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nuovo
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    {sortedAppointments.length === 0 ? (
                        <div className="text-center py-10 px-6">
                            <CalendarIcon className="mx-auto h-12 w-12 text-slate-400" />
                            <h3 className="mt-2 text-lg font-medium text-slate-800 dark:text-slate-100">Nessun appuntamento</h3>
                            <p className="mt-1 text-sm text-slate-500">Pianifica le tue future visite per i contratti.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-3">Stato</th>
                                    <th className="px-6 py-3">Data & Ora</th>
                                    <th className="px-6 py-3">Cliente / Prospect</th>
                                    <th className="px-6 py-3">Compagnia</th>
                                    <th className="px-6 py-3">Luogo</th>
                                    <th className="px-6 py-3">Note</th>
                                    <th className="px-6 py-3 text-right">Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAppointments.map(appt => {
                                    const apptDate = new Date(appt.date);
                                    const isToday = new Date().toDateString() === apptDate.toDateString();
                                    const statusClass = getStatusColor(appt.status);
                                    const isDone = appt.status.toLowerCase() === 'completato' || appt.status.toLowerCase() === 'annullato';
                                    
                                    const mapUrl = appt.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appt.location)}` : undefined;

                                    return (
                                        <tr key={appt.id} className={`border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 ${isDone ? 'opacity-60 bg-slate-50 dark:bg-slate-800/50' : ''}`}>
                                            <td className="px-6 py-4">
                                                {/* Select "camuffato" da badge */}
                                                <div className="relative inline-block">
                                                    <select
                                                        value={appt.status}
                                                        onChange={(e) => onUpdateStatus(appt, e.target.value)}
                                                        className={`appearance-none cursor-pointer pl-2.5 pr-8 py-0.5 rounded-full text-xs font-medium border-none focus:ring-0 ${statusClass}`}
                                                    >
                                                        {statuses.map(s => (
                                                            <option key={s} value={s} className="bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                                                {s}
                                                            </option>
                                                        ))}
                                                        {!statuses.includes(appt.status) && (
                                                            <option value={appt.status} className="bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-200">{appt.status}</option>
                                                        )}
                                                    </select>
                                                    {/* Custom Arrow */}
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-60">
                                                        <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={`flex items-center font-medium ${isToday && !isDone ? 'text-amber-600' : ''}`}>
                                                    <CalendarIcon className="h-4 w-4 mr-2 opacity-70" />
                                                    {apptDate.toLocaleDateString('it-IT')}
                                                </div>
                                                {appt.time && (
                                                    <div className="flex items-center text-xs text-slate-400 mt-1">
                                                        <ClockIcon className="h-3 w-3 mr-2 opacity-70" />
                                                        {appt.time}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                                                {appt.clientName}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-sky-100 text-sky-800 text-xs px-2 py-1 rounded-full dark:bg-sky-900/50 dark:text-sky-300">
                                                    {appt.provider}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {appt.location ? (
                                                    <a 
                                                        href={mapUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="flex items-center text-sky-600 hover:text-sky-800 transition-colors text-xs font-medium"
                                                        title="Apri in Google Maps"
                                                    >
                                                        <MapIcon className="h-4 w-4 mr-1" />
                                                        {appt.location}
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 max-w-xs truncate" title={appt.notes}>
                                                {appt.notes || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end space-x-2">
                                                    <button onClick={() => onEdit(appt)} className="p-2 text-sky-600 rounded-full hover:bg-sky-100 transition">
                                                        <PencilIcon className="h-5 w-5" />
                                                    </button>
                                                    <button onClick={() => onDelete(appt.id)} className="p-2 text-red-600 rounded-full hover:bg-red-100 transition">
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