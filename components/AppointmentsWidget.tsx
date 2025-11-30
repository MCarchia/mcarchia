
import React from 'react';
import type { Appointment } from '../types';
import { CalendarIcon, ClockIcon, BriefcaseIcon, PencilIcon, MapIcon } from './Icons';

interface AppointmentsWidgetProps {
    appointments: Appointment[];
    onEdit: (appt: Appointment) => void;
    onUpdateStatus?: (appt: Appointment, newStatus: string) => void;
    statuses?: string[];
}

const AppointmentsWidget: React.FC<AppointmentsWidgetProps> = ({ appointments, onEdit, onUpdateStatus, statuses = [] }) => {
    // Filter out completed or cancelled appointments to show only upcoming
    const upcoming = appointments
        .filter(a => {
            const s = a.status.toLowerCase();
            return s !== 'completato' && s !== 'completed' && s !== 'annullato' && s !== 'cancelled';
        })
        .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime())
        .slice(0, 4); // Show max 4 cards for a compact view

    const getStatusColor = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'completato' || s === 'completed') return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800';
        if (s === 'annullato' || s === 'cancelled') return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800';
        if (s === 'da fare' || s === 'pending') return 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600';
    };

    if (upcoming.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 h-full min-h-[250px] flex flex-col">
                 <div className="flex items-center mb-4">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg mr-3">
                        <BriefcaseIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Prossimi Appuntamenti</h3>
                </div>
                <div className="flex-grow flex flex-col items-center justify-center text-center py-4 text-slate-500">
                    <CalendarIcon className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-sm">Nessun appuntamento in programma.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg mr-3">
                        <BriefcaseIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Prossimi Appuntamenti</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Promemoria visite</p>
                    </div>
                </div>
                <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 text-xs font-bold px-2.5 py-1 rounded-full">
                    {upcoming.length}
                </span>
            </div>
            
            {/* Grid layout: 1 col on small/medium, 2 cols on very large screens if space allows, 
                but since we are often in a half-width container on desktop, 1 col might be safer or 2 compact cols.
                Let's stick to 2 columns but ensure they stack if container is narrow. */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-1 content-start">
                {upcoming.map(appt => {
                    const dateObj = new Date(appt.date);
                    const isToday = new Date().toDateString() === dateObj.toDateString();
                    const day = dateObj.getDate();
                    const month = dateObj.toLocaleString('it-IT', { month: 'short' }).toUpperCase().replace('.', '');
                    const mapUrl = appt.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appt.location)}` : undefined;
                    
                    return (
                        <div key={appt.id} className={`relative flex flex-col justify-between p-3 rounded-xl border shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-700/30 border-slate-100 dark:border-slate-700`}>
                            
                            {/* Header: Date Badge & Status */}
                            <div className="flex justify-between items-start mb-2">
                                {/* Date Badge */}
                                <div className={`flex flex-col items-center justify-center rounded-lg w-10 h-10 shrink-0 ${isToday ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-300'}`}>
                                    <span className="text-[9px] font-bold leading-none">{month}</span>
                                    <span className="text-lg font-extrabold leading-none mt-0.5">{day}</span>
                                </div>

                                {/* Status Pill */}
                                {onUpdateStatus && statuses.length > 0 ? (
                                    <div className="relative">
                                        <select
                                            value={appt.status}
                                            onChange={(e) => onUpdateStatus(appt, e.target.value)}
                                            className={`appearance-none cursor-pointer pl-2 pr-4 py-0.5 rounded-md text-[9px] uppercase font-bold border focus:ring-0 outline-none transition-colors ${getStatusColor(appt.status)}`}
                                        >
                                            {statuses.map(s => (
                                                <option key={s} value={s} className="bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                                    {s}
                                                </option>
                                            ))}
                                        </select>
                                        {/* Tiny Arrow */}
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-current opacity-60">
                                            <svg className="fill-current h-2 w-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                        </div>
                                    </div>
                                ) : (
                                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md border ${getStatusColor(appt.status)}`}>
                                        {appt.status}
                                    </span>
                                )}
                            </div>

                            {/* Main Info */}
                            <div className="flex-1 min-w-0 mb-1">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm" title={appt.clientName}>
                                        {appt.clientName}
                                    </h4>
                                    <button 
                                        onClick={() => onEdit(appt)}
                                        className="text-slate-400 hover:text-sky-500 transition-colors p-1"
                                        title="Modifica"
                                    >
                                        <PencilIcon className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <p className="text-xs text-sky-600 dark:text-sky-400 font-semibold mb-2">{appt.provider}</p>
                                
                                <div className="space-y-1">
                                    {appt.time && (
                                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                                            <ClockIcon className="h-3 w-3 mr-1.5 opacity-70" />
                                            <span>{appt.time}</span>
                                        </div>
                                    )}
                                    {appt.location ? (
                                        <a 
                                            href={mapUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="flex items-center text-xs text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors group"
                                            title={appt.location}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MapIcon className="h-3 w-3 mr-1.5 opacity-70 group-hover:text-sky-500" />
                                            <span className="truncate">{appt.location}</span>
                                        </a>
                                    ) : (
                                        <div className="flex items-center text-xs text-slate-400 dark:text-slate-500 italic">
                                            <MapIcon className="h-3 w-3 mr-1.5 opacity-50" />
                                            <span>Luogo non specificato</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AppointmentsWidget;
