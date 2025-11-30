
import React, { useState, useEffect, useMemo } from 'react';
import * as api from './services/api';
import { Client, Contract, ContractType, Appointment, OfficeTask, CheckupItem } from './types';
import Sidebar from './components/Sidebar';
import { ClientListView } from './components/ClientListView';
import { ContractListView } from './components/ContractListView';
import { AppointmentListView } from './components/AppointmentListView';
import { ClientFormModal } from './components/ClientFormModal';
import { ContractFormModal } from './components/ContractFormModal';
import { AppointmentFormModal } from './components/AppointmentFormModal';
import ConfirmationModal from './components/ConfirmationModal';
import SearchModal from './components/SearchModal';
import GlobalSearchBar from './components/GlobalSearchBar';
import { MenuIcon, SearchIcon, EyeIcon, EyeOffIcon, FilterIcon, TrashIcon, AdjustmentsIcon } from './components/Icons';
import Login from './components/Login';

// Dashboard widgets
import ClientChart from './components/ClientChart';
import ContractChart from './components/ContractChart';
import CommissionChart from './components/CommissionChart';
import CommissionSummaryWidget from './components/CommissionSummaryWidget';
import CurrentMonthCommissionWidget from './components/CurrentMonthCommissionWidget';
import CombinedTotalsWidget from './components/CombinedTotalsWidget';
import TotalProvidersWidget from './components/TotalProvidersWidget';
import PaidStatusPieChart from './components/PaidStatusPieChart';
import EnergyProviderPieChart from './components/EnergyProviderPieChart';
import TelephonyProviderPieChart from './components/TelephonyProviderPieChart';
import ContractExpiryStatusPieChart from './components/ContractExpiryStatusPieChart';
import ExpiringContractsWidget from './components/ExpiringContractsWidget';
import CheckupWidget from './components/CheckupWidget';
import AppointmentsWidget from './components/AppointmentsWidget';
import OfficeTaskWidget from './components/OfficeTaskWidget';
import { Spinner } from './components/Spinner';

// Simple Toast Component (internal)
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
    <div className={`fixed bottom-4 right-4 px-6 py-3 rounded shadow-lg text-white z-50 flex items-center ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 font-bold">×</button>
    </div>
);

// Settings Component
const SettingsView = ({ 
    providers, 
    onAddProvider, 
    onDeleteProvider,
    operationTypes,
    onAddOperationType,
    onDeleteOperationType,
    appointmentStatuses,
    onAddAppointmentStatus,
    onDeleteAppointmentStatus
}: { 
    providers: string[], 
    onAddProvider: (p: string) => Promise<void>, 
    onDeleteProvider: (p: string) => Promise<void>,
    operationTypes: string[],
    onAddOperationType: (t: string) => Promise<void>,
    onDeleteOperationType: (t: string) => Promise<void>,
    appointmentStatuses: string[],
    onAddAppointmentStatus: (s: string) => Promise<void>,
    onDeleteAppointmentStatus: (s: string) => Promise<void>
}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [newProvider, setNewProvider] = useState('');
    const [msg, setMsg] = useState('');

    const [newOperationType, setNewOperationType] = useState('');
    const [newAppointmentStatus, setNewAppointmentStatus] = useState('');

    useEffect(() => {
        api.getCredentials().then(c => {
            setUsername(c.username);
            setPassword(c.password);
        }).catch(err => console.error("Error fetching credentials", err));
    }, []);

    const handleSaveCreds = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.updateCredentials({ username, password });
            setMsg('Credenziali aggiornate');
            setTimeout(() => setMsg(''), 3000);
        } catch (err) {
            setMsg('Errore aggiornamento');
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!newProvider) return;
        await onAddProvider(newProvider);
        setNewProvider('');
    }

    const handleAddOpType = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!newOperationType) return;
        await onAddOperationType(newOperationType);
        setNewOperationType('');
    }

    const handleAddAppStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!newAppointmentStatus) return;
        await onAddAppointmentStatus(newAppointmentStatus);
        setNewAppointmentStatus('');
    }

    return (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow space-y-8 animate-fade-in">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Impostazioni</h2>
            
            {/* Credenziali */}
            <div>
                <h3 className="text-lg font-semibold mb-2 text-slate-700 dark:text-slate-200">Credenziali Admin</h3>
                <form onSubmit={handleSaveCreds} className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm text-slate-600 dark:text-slate-400">Username</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full border p-2 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 dark:text-slate-400">Password</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                className="w-full border p-2 rounded pr-10 dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus:outline-none"
                                aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                            >
                                {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600">Salva</button>
                    {msg && <span className="ml-3 text-sm text-green-500">{msg}</span>}
                </form>
            </div>

            <hr className="border-slate-200 dark:border-slate-700" />

            {/* Gestione Stati Appuntamento */}
             <div>
                    <h3 className="text-lg font-semibold mb-2 text-slate-700 dark:text-slate-200">Stati Appuntamenti</h3>
                    <p className="text-sm text-slate-500 mb-4">Gestisci gli stati personalizzati per gli appuntamenti (es. Da Fare, Completato).</p>
                    
                    <form onSubmit={handleAddAppStatus} className="flex gap-2 mb-4 max-w-md">
                        <input 
                        type="text" 
                        value={newAppointmentStatus} 
                        onChange={e => setNewAppointmentStatus(e.target.value)} 
                        placeholder="Nuovo stato (es. Rinviato)" 
                        className="flex-1 border p-2 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                        required
                        />
                        <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Aggiungi</button>
                    </form>

                    <div className="border rounded divide-y dark:border-slate-700 dark:divide-slate-700 max-h-60 overflow-y-auto max-w-md">
                        {appointmentStatuses.map(status => (
                            <div key={status} className="p-2 flex justify-between items-center bg-white dark:bg-slate-800 dark:text-slate-200 text-sm">
                                <span>{status}</span>
                                <button 
                                onClick={() => onDeleteAppointmentStatus(status)} 
                                className="text-red-500 hover:text-red-700 p-1"
                                >
                                <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
            </div>

            <hr className="border-slate-200 dark:border-slate-700" />

            {/* Gestione Tipi Operazione (Switch, Voltura...) */}
            <div>
                    <h3 className="text-lg font-semibold mb-2 text-slate-700 dark:text-slate-200">Tipi Operazione</h3>
                    <p className="text-sm text-slate-500 mb-4">Etichette per il tipo di operazione (Switch, Voltura, Subentro, etc.).</p>
                    
                    <form onSubmit={handleAddOpType} className="flex gap-2 mb-4 max-w-md">
                        <input 
                        type="text" 
                        value={newOperationType} 
                        onChange={e => setNewOperationType(e.target.value)} 
                        placeholder="Es. Switch, Voltura..." 
                        className="flex-1 border p-2 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                        required
                        />
                        <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Aggiungi</button>
                    </form>

                    <div className="border rounded divide-y dark:border-slate-700 dark:divide-slate-700 max-h-60 overflow-y-auto max-w-md">
                        {operationTypes.map(type => (
                            <div key={type} className="p-2 flex justify-between items-center bg-white dark:bg-slate-800 dark:text-slate-200 text-sm">
                                <span>{type}</span>
                                <button 
                                onClick={() => onDeleteOperationType(type)} 
                                className="text-red-500 hover:text-red-700 p-1"
                                >
                                <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
            </div>

            <hr className="border-slate-200 dark:border-slate-700" />

            {/* Gestione Fornitori */}
            <div>
                 <h3 className="text-lg font-semibold mb-2 text-slate-700 dark:text-slate-200">Gestione Fornitori</h3>
                 <form onSubmit={handleAdd} className="flex gap-2 mb-4 max-w-md">
                     <input type="text" value={newProvider} onChange={e => setNewProvider(e.target.value)} placeholder="Nuovo fornitore" className="flex-1 border p-2 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                     <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Aggiungi</button>
                 </form>
                 <ul className="max-w-md border rounded divide-y dark:border-slate-700 dark:divide-slate-700 max-h-60 overflow-y-auto">
                     {providers.map(p => (
                         <li key={p} className="p-2 flex justify-between items-center bg-white dark:bg-slate-800 dark:text-slate-200">
                             {p}
                             <button onClick={() => onDeleteProvider(p)} className="text-red-500 hover:text-red-700">Elimina</button>
                         </li>
                     ))}
                 </ul>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthChecking, setIsAuthChecking] = useState(true);

    // State definitions
    const [clients, setClients] = useState<Client[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [officeTasks, setOfficeTasks] = useState<OfficeTask[]>([]);
    const [providers, setProviders] = useState<string[]>([]);
    const [operationTypes, setOperationTypes] = useState<string[]>([]);
    const [appointmentStatuses, setAppointmentStatuses] = useState<string[]>([]);

    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'dashboard' | 'clients' | 'contracts' | 'appointments' | 'office-tasks' | 'settings'>('dashboard');
    
    // Initial sidebar state: open on desktop (>= 1024px), closed on mobile
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return false;
    });

    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    
    // Modals & Toast State
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'client' | 'contract' | 'provider' | 'operationType' | 'appointmentStatus' | 'appointment' } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);
    const [editingContract, setEditingContract] = useState<Contract | null>(null);
    
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [isClientSuccess, setIsClientSuccess] = useState(false);
    const [isContractSuccess, setIsContractSuccess] = useState(false);
    const [isAppointmentSuccess, setIsAppointmentSuccess] = useState(false);

    // Contract List Filters State
    const [contractProviderFilter, setContractProviderFilter] = useState('all');
    const [contractFilterYear, setContractFilterYear] = useState('all');
    const [contractFilterMonth, setContractFilterMonth] = useState('all');
    const [contractDateFrom, setContractDateFrom] = useState('');
    const [contractDateTo, setContractDateTo] = useState('');
    const [contractEndDateFrom, setContractEndDateFrom] = useState('');
    const [contractEndDateTo, setContractEndDateTo] = useState('');

    // Dashboard Filter State
    const [dashboardYear, setDashboardYear] = useState(new Date().getFullYear().toString());
    const [dashboardMonth, setDashboardMonth] = useState('all');
    const [dashboardProvider, setDashboardProvider] = useState('all');

    // Pie Chart Specific Filter State
    const [pieChartYear, setPieChartYear] = useState(new Date().getFullYear().toString());
    const [pieChartMonth, setPieChartMonth] = useState('all');

    // Dashboard Customization State
    const [visibleWidgets, setVisibleWidgets] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('dashboardConfig');
                if (saved) {
                    return JSON.parse(saved);
                }
            } catch (e) {
                console.error("Error parsing dashboardConfig from localStorage", e);
            }
        }
        return {
            operational: true,
            checkups: true,
            expiring: true,
            stats: true,
            charts: true,
            distribution: true
        };
    });
    
    const [isDashboardConfigOpen, setIsDashboardConfigOpen] = useState(false);

    // Save dashboard config
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('dashboardConfig', JSON.stringify(visibleWidgets));
        }
    }, [visibleWidgets]);

    const toggleWidgetVisibility = (key: keyof typeof visibleWidgets) => {
        setVisibleWidgets((prev: any) => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // State for dismissed checkup items (T4/T8)
    const [dismissedCheckups, setDismissedCheckups] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('dismissedCheckups');
                return saved ? JSON.parse(saved) : [];
            } catch (e) {
                console.error("Error parsing dismissedCheckups", e);
                return [];
            }
        }
        return [];
    });

    // Save dismissed checkups to localStorage whenever changed
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('dismissedCheckups', JSON.stringify(dismissedCheckups));
        }
    }, [dismissedCheckups]);

    const handleDismissCheckup = (item: CheckupItem) => {
        // Unique ID format: ContractID_Type (e.g., abc123_T4)
        const checkupId = `${item.contract.id}_${item.type}`;
        setDismissedCheckups(prev => [...prev, checkupId]);
        setToast({ message: "Notifica rimossa", type: 'success' });
    };

    // Handle screen resize to auto-adjust sidebar if needed (optional UX enhancement)
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                 // Optional: auto-open on resize to desktop, or keep user preference?
            } else {
                setIsSidebarOpen(false); // Auto-close on resize to mobile
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- Authentication Logic ---
    useEffect(() => {
        const storedAuth = localStorage.getItem('isLoggedIn');
        if (storedAuth === 'true') {
            setIsAuthenticated(true);
        }
        setIsAuthChecking(false);
    }, []);

    const handleLogin = () => {
        localStorage.setItem('isLoggedIn', 'true');
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        setIsAuthenticated(false);
        setClients([]);
        setContracts([]);
        setAppointments([]);
        setOfficeTasks([]);
        setProviders([]);
    };

    // Data Loading (Only if Authenticated)
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [clientsData, contractsData, apptsData, officeData, providersData, opsData, apptStatusesData] = await Promise.all([
                    api.getAllClients(),
                    api.getAllContracts(),
                    api.getAllAppointments(),
                    api.getAllOfficeTasks(),
                    api.getAllProviders(),
                    api.getAllOperationTypes(),
                    api.getAllAppointmentStatuses()
                ]);
                setClients(clientsData || []);
                setContracts(contractsData || []);
                setAppointments(apptsData || []);
                setOfficeTasks(officeData || []);
                setProviders(providersData || []);
                setOperationTypes(opsData || []);
                setAppointmentStatuses(apptStatusesData || []);
            } catch (error) {
                console.error("Failed to load data", error);
                setToast({ message: "Errore caricamento dati. Verifica la console.", type: 'error' });
                setClients([]);
                setContracts([]);
                setAppointments([]);
                setOfficeTasks([]);
                setProviders([]);
                setOperationTypes([]);
                setAppointmentStatuses([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isAuthenticated]);

    // Theme Handling
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    // Toast Timer Handling (7 seconds)
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => {
                setToast(null);
            }, 7000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Search Logic
    const searchResults = useMemo(() => {
        if (!searchQuery) return { clients: [], contracts: [] };
        const q = searchQuery.toLowerCase();
        return {
            clients: clients.filter(c => 
                (c.firstName || '').toLowerCase().includes(q) || 
                (c.lastName || '').toLowerCase().includes(q) || 
                (c.email || '').toLowerCase().includes(q)
            ),
            contracts: contracts.filter(c => 
                (c.provider || '').toLowerCase().includes(q) || 
                (c.contractCode || '').toLowerCase().includes(q)
            )
        };
    }, [clients, contracts, searchQuery]);

    const getClientName = (clientId: string) => {
        const c = clients.find(cl => cl.id === clientId);
        return c ? `${c.firstName} ${c.lastName}` : 'N/D';
    };

    // Calculate Available Years for Filters
    const availableYears = useMemo(() => {
        const years = new Set<string>();
        contracts.forEach(c => {
            if (c.startDate) {
                years.add(new Date(c.startDate).getFullYear().toString());
            }
        });
        // Aggiungi anno corrente se non presente
        years.add(new Date().getFullYear().toString());
        return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
    }, [contracts]);


    // --- Deletion Logic ---
    const confirmDelete = async () => {
        if (!itemToDelete) return;
        const { id, type } = itemToDelete;

        setIsDeleting(true);
        try {
            const idString = String(id);

            if (type === 'client') {
                await api.deleteClient(idString);
                setClients(prevClients => prevClients.filter(client => client.id !== idString));
                setContracts(prevContracts => prevContracts.filter(contract => contract.clientId !== idString));
                setToast({ message: "Cliente eliminato con successo!", type: 'success' });
            } else if (type === 'contract') {
                await api.deleteContract(idString);
                setContracts(prevContracts => prevContracts.filter(contract => contract.id !== idString));
                setToast({ message: "Contratto eliminato con successo!", type: 'success' });
            } else if (type === 'appointment') {
                await api.deleteAppointment(idString);
                setAppointments(prev => prev.filter(a => a.id !== idString));
                setToast({ message: "Appuntamento eliminato!", type: 'success' });
            } else if (type === 'provider') {
                const updatedProviders = await api.deleteProvider(idString);
                setProviders(updatedProviders);
                setToast({ message: "Fornitore eliminato con successo!", type: 'success' });
            } else if (type === 'operationType') {
                const updatedOps = await api.deleteOperationType(idString);
                setOperationTypes(updatedOps);
                setToast({ message: "Tipo operazione eliminato!", type: 'success' });
            } else if (type === 'appointmentStatus') {
                const updatedStatuses = await api.deleteAppointmentStatus(idString);
                setAppointmentStatuses(updatedStatuses);
                setToast({ message: "Stato appuntamento eliminato!", type: 'success' });
            }
        } catch (e: any) {
            let errorMessage = "Eliminazione fallita.";
            const errorDetails = e instanceof Error ? e.message : String(e);
            console.error("Deletion error:", errorDetails);
            setToast({ message: `${errorMessage}: ${errorDetails}`, type: 'error' });
        } finally {
            setIsDeleting(false);
            setItemToDelete(null);
        }
    };

    const handleAddProvider = async (newProvider: string) => {
        try {
            const updatedProviders = await api.addProvider(newProvider);
            setProviders(updatedProviders);
            setToast({ message: "Fornitore aggiunto con successo!", type: 'success' });
        } catch (e: any) {
             const errorDetails = e instanceof Error ? e.message : String(e);
            console.error("Add provider error:", errorDetails);
            setToast({ message: "Aggiunta del fornitore fallita.", type: 'error' });
        }
    };

    const handleDeleteProvider = async (provider: string) => {
        setItemToDelete({ id: provider, type: 'provider' });
    };

    const handleAddOperationType = async (name: string) => {
        try {
            const updated = await api.addOperationType(name);
            setOperationTypes(updated);
            setToast({ message: "Tipo operazione aggiunto!", type: 'success' });
        } catch (e: any) {
             const errorDetails = e instanceof Error ? e.message : String(e);
            console.error("Add op type error:", errorDetails);
            setToast({ message: "Errore aggiunta tipo operazione.", type: 'error' });
        }
    };

    const handleDeleteOperationType = async (name: string) => {
        setItemToDelete({ id: name, type: 'operationType' });
    };

    const handleAddAppointmentStatus = async (name: string) => {
        try {
            const updated = await api.addAppointmentStatus(name);
            setAppointmentStatuses(updated);
            setToast({ message: "Stato appuntamento aggiunto!", type: 'success' });
        } catch (e: any) {
             const errorDetails = e instanceof Error ? e.message : String(e);
            console.error("Add app status error:", errorDetails);
            setToast({ message: "Errore aggiunta stato.", type: 'error' });
        }
    };

    const handleDeleteAppointmentStatus = async (name: string) => {
        setItemToDelete({ id: name, type: 'appointmentStatus' });
    };


    // --- Create/Update Logic ---
    const handleSaveClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
        setIsSaving(true);
        try {
            if (editingClient) {
                const updated = await api.updateClient({ ...clientData, id: editingClient.id, createdAt: editingClient.createdAt });
                setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
            } else {
                const created = await api.createClient(clientData);
                setClients(prev => [...prev, created]);
            }
            
            setIsSaving(false);
            setIsClientSuccess(true);

            setTimeout(() => {
                setIsClientSuccess(false);
                setIsClientModalOpen(false);
                setToast({ message: editingClient ? "Cliente aggiornato!" : "Cliente creato!", type: 'success' });
            }, 1000);
            
        } catch (e) {
            console.error("Save client error:", e);
            setToast({ message: "Errore salvataggio cliente", type: 'error' });
            setIsSaving(false);
        }
    };

    const handleSaveContract = async (contractData: Omit<Contract, 'id'>) => {
        setIsSaving(true);
        try {
            if (editingContract) {
                const updated = await api.updateContract({ ...contractData, id: editingContract.id });
                setContracts(prev => prev.map(c => c.id === updated.id ? updated : c));
            } else {
                const created = await api.createContract(contractData);
                setContracts(prev => [...prev, created]);
            }
            
            setIsSaving(false);
            setIsContractSuccess(true);

            setTimeout(() => {
                setIsContractSuccess(false);
                setIsContractModalOpen(false);
                setToast({ message: editingContract ? "Contratto aggiornato!" : "Contratto creato!", type: 'success' });
            }, 1000);

        } catch (e) {
             console.error("Save contract error:", e);
            setToast({ message: "Errore salvataggio contratto", type: 'error' });
            setIsSaving(false);
        }
    };

    const handleSaveAppointment = async (apptData: Omit<Appointment, 'id' | 'createdAt'>) => {
        setIsSaving(true);
        try {
            if (editingAppointment) {
                const updated = await api.updateAppointment({ ...apptData, id: editingAppointment.id, createdAt: editingAppointment.createdAt });
                setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
            } else {
                const created = await api.createAppointment(apptData);
                setAppointments(prev => [...prev, created]);
            }

            setIsSaving(false);
            setIsAppointmentSuccess(true);

            setTimeout(() => {
                setIsAppointmentSuccess(false);
                setIsAppointmentModalOpen(false);
                setToast({ message: editingAppointment ? "Appuntamento aggiornato!" : "Appuntamento creato!", type: 'success' });
            }, 1000);
        } catch (e) {
            console.error("Save appointment error:", e);
            setToast({ message: "Errore salvataggio appuntamento", type: 'error' });
            setIsSaving(false);
        }
    };

    const handleUpdateAppointmentStatus = async (appointment: Appointment, newStatus: string) => {
        try {
            const updated = await api.updateAppointment({ ...appointment, status: newStatus });
            setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
            setToast({ message: `Stato aggiornato a: ${newStatus}`, type: 'success' });
        } catch (e) {
            console.error("Error updating appointment status:", e);
            setToast({ message: "Errore aggiornamento stato", type: 'error' });
        }
    };

    const togglePaidStatus = async (contract: Contract) => {
        try {
            const updated = await api.updateContract({ ...contract, isPaid: !contract.isPaid });
            setContracts(prev => prev.map(c => c.id === updated.id ? updated : c));
        } catch(e) {
            console.error("Update paid status error:", e);
            setToast({ message: "Errore aggiornamento stato", type: 'error' });
        }
    };

    // --- Office Task Handlers ---
    const handleAddOfficeTask = async (title: string) => {
        try {
            const created = await api.createOfficeTask(title);
            setOfficeTasks(prev => [created, ...prev]);
            setToast({ message: "Attività aggiunta!", type: 'success' });
        } catch (e) {
            console.error("Add task error:", e);
            setToast({ message: "Errore aggiunta attività", type: 'error' });
        }
    };

    const handleToggleOfficeTask = async (task: OfficeTask) => {
        try {
            const updated = await api.updateOfficeTask({ ...task, isCompleted: !task.isCompleted });
            setOfficeTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        } catch (e) {
            console.error("Toggle task error:", e);
            setToast({ message: "Errore aggiornamento attività", type: 'error' });
        }
    };

    const handleDeleteOfficeTask = async (taskId: string) => {
        try {
            await api.deleteOfficeTask(taskId);
            setOfficeTasks(prev => prev.filter(t => t.id !== taskId));
            setToast({ message: "Attività eliminata", type: 'success' });
        } catch (e) {
            console.error("Delete task error:", e);
            setToast({ message: "Errore eliminazione attività", type: 'error' });
        }
    };
    
    // --- Dashboard Calculations ---
    const filteredDashboardContracts = useMemo(() => {
        return contracts.filter(c => {
            if (dashboardProvider !== 'all' && c.provider !== dashboardProvider) return false;
            
            if (!c.startDate) return false;
            const d = new Date(c.startDate);
            if (dashboardYear !== 'all' && d.getFullYear().toString() !== dashboardYear) return false;
            if (dashboardMonth !== 'all' && (d.getMonth() + 1).toString() !== dashboardMonth) return false;

            return true;
        });
    }, [contracts, dashboardProvider, dashboardYear, dashboardMonth]);

    const totalCommission = useMemo(() => filteredDashboardContracts.reduce((sum, c) => sum + (c.commission || 0), 0), [filteredDashboardContracts]);
    
    // Simplified logic: contracts.type is strictly 'electricity' | 'gas' | 'telephony'
    const energyCommission = useMemo(() => filteredDashboardContracts.filter(c => {
        return c.type !== ContractType.Telephony;
    }).reduce((sum, c) => sum + (c.commission || 0), 0), [filteredDashboardContracts]);

    const telephonyCommission = useMemo(() => filteredDashboardContracts.filter(c => {
        return c.type === ContractType.Telephony;
    }).reduce((sum, c) => sum + (c.commission || 0), 0), [filteredDashboardContracts]);
    
    // Calcolo delle provvigioni del mese corrente (indipendentemente dai filtri)
    const currentMonthStats = useMemo(() => {
        const now = new Date();
        const thisYear = now.getFullYear();
        const thisMonth = now.getMonth();

        const currentMonthContracts = contracts.filter(c => {
            if (!c.startDate) return false;
            const d = new Date(c.startDate);
            return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
        });

        const total = currentMonthContracts.reduce((sum, c) => sum + (c.commission || 0), 0);
        
        const energy = currentMonthContracts.filter(c => {
             return c.type !== ContractType.Telephony;
        }).reduce((sum, c) => sum + (c.commission || 0), 0);
        
        const telephony = currentMonthContracts.filter(c => {
             return c.type === ContractType.Telephony;
        }).reduce((sum, c) => sum + (c.commission || 0), 0);

        return { total, energy, telephony };
    }, [contracts]);

    const energyProvidersCount = useMemo(() => new Set(contracts.filter(c => {
         return c.type !== ContractType.Telephony;
    }).map(c => c.provider)).size, [contracts]);

    const telephonyProvidersCount = useMemo(() => new Set(contracts.filter(c => {
         return c.type === ContractType.Telephony;
    }).map(c => c.provider)).size, [contracts]);

    // Data for Pie Charts (Independent Filters)
    const filteredPieChartContracts = useMemo(() => {
        return contracts.filter(c => {
            if (!c.startDate) return false;
            const d = new Date(c.startDate);
            
            if (pieChartYear !== 'all' && d.getFullYear().toString() !== pieChartYear) return false;
            if (pieChartMonth !== 'all' && (d.getMonth() + 1).toString() !== pieChartMonth) return false;

            return true;
        });
    }, [contracts, pieChartYear, pieChartMonth]);

    
    // --- Checkup T4 / T8 Logic ---
    const checkupItems = useMemo<CheckupItem[]>(() => {
        const items: CheckupItem[] = [];
        const now = new Date();
        now.setHours(0,0,0,0);

        // Helper function: Add months safely handling end of month days
        const addMonths = (inputDate: Date, months: number) => {
             const date = new Date(inputDate);
             const originalDay = date.getDate();
             date.setMonth(date.getMonth() + months);
             
             // If the day changed, it means the target month has fewer days (e.g., Jan 31 + 1 mo -> Feb 28/29)
             // We want to stick to the last day of that month.
             if (date.getDate() !== originalDay) {
                 date.setDate(0); 
             }
             return date;
        };

        contracts.forEach(c => {
            if (!c.startDate) return;
            const start = new Date(c.startDate);
            
            // Safety check for invalid dates
            if (isNaN(start.getTime())) return;

            start.setHours(0,0,0,0);
            
            // Calculate T4 date (Start + 6 months)
            const t4 = addMonths(start, 6);
            t4.setHours(0,0,0,0);

            // Calculate T8 date (Start + 10 months)
            const t8 = addMonths(start, 10);
            t8.setHours(0,0,0,0);

            // Logic: Show if current date is within a window around T4 or T8
            // Modified Window: -10 days to +10 days from target date
            
            const checkDate = (target: Date, type: 'T4' | 'T8') => {
                const diffTime = target.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                // Show if within +/- 10 days window
                if (Math.abs(diffDays) <= 10) {
                    items.push({
                        contract: c,
                        type,
                        targetDate: target,
                        daysDiff: diffDays
                    });
                }
            };

            checkDate(t4, 'T4');
            checkDate(t8, 'T8');
        });

        // Filter out items that have been dismissed
        return items.filter(item => {
            const checkupId = `${item.contract.id}_${item.type}`;
            return !dismissedCheckups.includes(checkupId);
        });
    }, [contracts, dismissedCheckups]);

    const handleProviderClick = (provider: string) => {
        setContractProviderFilter(provider);
        setView('contracts');
        // Optional: show toast to confirm filter action
        setToast({ message: `Filtro applicato: ${provider}`, type: 'success' });
    };

    // --- Render Logic with Auth ---

    if (isAuthChecking) {
        return <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-900"><Spinner size="lg" /></div>;
    }

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }

    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-900"><Spinner size="lg" /></div>;
    }

    return (
        <div className={`flex h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-300 font-sans text-slate-900 dark:text-slate-100 overflow-hidden`}>
            <Sidebar
                currentView={view}
                onNavigate={(v) => { 
                    setView(v); 
                    if (window.innerWidth < 1024) setIsSidebarOpen(false); 
                }}
                expiringContractsCount={contracts.filter(c => {
                     if (!c.endDate) return false;
                     const end = new Date(c.endDate);
                     const now = new Date();
                     const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                     // Mostra count per contratti in scadenza (entro 60gg) O scaduti (diff < 0)
                     return diff <= 60;
                }).length}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onLogout={handleLogout}
                theme={theme}
                onThemeSwitch={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            />

            {/* Main Content Wrapper - Shifts when sidebar is open on desktop */}
            <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
                {/* Header for Mobile */}
                <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400">
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <span className="font-bold text-lg">CRM Michele Carchia</span>
                    <button onClick={() => setIsSearchModalOpen(true)} className="p-2 -mr-2 text-slate-500">
                        <SearchIcon className="h-6 w-6" />
                    </button>
                </div>
                
                {/* Desktop Search Bar Area */}
                <div className="hidden lg:flex items-center justify-between py-4 px-8 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 transition-all">
                     <div className="flex items-center w-full max-w-3xl">
                         {/* Desktop Sidebar Toggle Button */}
                         <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                            className="mr-4 p-2 rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
                            title={isSidebarOpen ? "Chiudi menu laterale" : "Apri menu laterale"}
                         >
                            <MenuIcon className="h-6 w-6" />
                         </button>
                         <div className="flex-1">
                             <GlobalSearchBar 
                                query={searchQuery}
                                onQueryChange={setSearchQuery}
                                onClear={() => setSearchQuery('')}
                                onFocus={() => setIsSearchModalOpen(true)}
                                placeholder="Cerca velocemente..."
                             />
                         </div>
                     </div>
                </div>

                <main className="flex-1 overflow-y-auto p-4 sm:p-8 scroll-smooth">
                    {view === 'dashboard' && (
                        <div className="space-y-6 animate-fade-in relative">
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-3xl font-bold">Dashboard</h1>
                                
                                {/* Dashboard Customization Button */}
                                <div className="relative">
                                    <button 
                                        onClick={() => setIsDashboardConfigOpen(!isDashboardConfigOpen)}
                                        className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
                                    >
                                        <AdjustmentsIcon className="h-5 w-5 mr-2 text-slate-500" />
                                        Personalizza
                                    </button>
                                    
                                    {isDashboardConfigOpen && (
                                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 animate-scale-in p-4">
                                            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3 text-sm border-b pb-2">Widget Visibili</h3>
                                            <div className="space-y-2">
                                                <label className="flex items-center space-x-2 cursor-pointer">
                                                    <input type="checkbox" checked={visibleWidgets.operational} onChange={() => toggleWidgetVisibility('operational')} className="rounded text-sky-500 focus:ring-sky-500" />
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">Appuntamenti & Attività</span>
                                                </label>
                                                <label className="flex items-center space-x-2 cursor-pointer">
                                                    <input type="checkbox" checked={visibleWidgets.checkups} onChange={() => toggleWidgetVisibility('checkups')} className="rounded text-sky-500 focus:ring-sky-500" />
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">Check-up Periodici</span>
                                                </label>
                                                <label className="flex items-center space-x-2 cursor-pointer">
                                                    <input type="checkbox" checked={visibleWidgets.expiring} onChange={() => toggleWidgetVisibility('expiring')} className="rounded text-sky-500 focus:ring-sky-500" />
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">Contratti in Scadenza</span>
                                                </label>
                                                <label className="flex items-center space-x-2 cursor-pointer">
                                                    <input type="checkbox" checked={visibleWidgets.stats} onChange={() => toggleWidgetVisibility('stats')} className="rounded text-sky-500 focus:ring-sky-500" />
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">Statistiche & Totali</span>
                                                </label>
                                                <label className="flex items-center space-x-2 cursor-pointer">
                                                    <input type="checkbox" checked={visibleWidgets.charts} onChange={() => toggleWidgetVisibility('charts')} className="rounded text-sky-500 focus:ring-sky-500" />
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">Grafici Andamento</span>
                                                </label>
                                                <label className="flex items-center space-x-2 cursor-pointer">
                                                    <input type="checkbox" checked={visibleWidgets.distribution} onChange={() => toggleWidgetVisibility('distribution')} className="rounded text-sky-500 focus:ring-sky-500" />
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">Analisi Distribuzione</span>
                                                </label>
                                            </div>
                                            <div className="mt-3 pt-2 border-t text-right">
                                                <button onClick={() => setIsDashboardConfigOpen(false)} className="text-xs text-sky-600 hover:text-sky-800 dark:text-sky-400">Chiudi</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* --- SEZIONE OPERATIVA (OPERATIONAL SECTION) --- */}

                            {/* 1. Appuntamenti e Attività Ufficio */}
                            {visibleWidgets.operational && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <AppointmentsWidget 
                                        appointments={appointments}
                                        onEdit={(appt) => { setEditingAppointment(appt); setIsAppointmentModalOpen(true); }}
                                        onUpdateStatus={handleUpdateAppointmentStatus}
                                        statuses={appointmentStatuses}
                                    />
                                    <OfficeTaskWidget 
                                        tasks={officeTasks}
                                        onAddTask={handleAddOfficeTask}
                                        onToggleTask={handleToggleOfficeTask}
                                        onDeleteTask={handleDeleteOfficeTask}
                                    />
                                </div>
                            )}

                            {/* 2. Check-up Periodico */}
                            {visibleWidgets.checkups && (
                                <CheckupWidget 
                                    items={checkupItems}
                                    clients={clients}
                                    onEdit={(c) => { setEditingContract(c); setIsContractModalOpen(true); }}
                                    onDismiss={handleDismissCheckup}
                                />
                            )}

                            {/* 3. Contratti in Scadenza */}
                            {visibleWidgets.expiring && (
                                <ExpiringContractsWidget 
                                    contracts={contracts.filter(c => {
                                        if (!c.endDate) return false;
                                        const end = new Date(c.endDate);
                                        const now = new Date();
                                        now.setHours(0,0,0,0);
                                        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                        return diff <= 60;
                                    })} 
                                    clients={clients}
                                    onEdit={(c) => { setEditingContract(c); setIsContractModalOpen(true); }}
                                    onDelete={(id) => setItemToDelete({ id, type: 'contract' })}
                                />
                            )}

                            {/* --- SEZIONE ANALITICA (ANALYTICAL SECTION) --- */}

                            {/* 4. Dashboard Filters & Stats (Grouped) */}
                            {visibleWidgets.stats && (
                                <>
                                    <div className="flex flex-wrap gap-4 mb-6 bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                                        <select value={dashboardYear} onChange={e => setDashboardYear(e.target.value)} className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600">
                                            <option value="all">Tutti gli anni</option>
                                            {availableYears.map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                        <select value={dashboardMonth} onChange={e => setDashboardMonth(e.target.value)} className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600">
                                            <option value="all">Tutti i mesi</option>
                                            {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                                                <option key={m} value={m}>{new Date(0, m-1).toLocaleString('it-IT', {month: 'long'})}</option>
                                            ))}
                                        </select>
                                        <select value={dashboardProvider} onChange={e => setDashboardProvider(e.target.value)} className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600">
                                            <option value="all">Tutti i fornitori</option>
                                            {providers.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>

                                    {/* 5. Summary Widgets */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                                        <CombinedTotalsWidget 
                                            totalClients={clients.length} 
                                            totalContracts={filteredDashboardContracts.length}
                                            selectedYear={dashboardYear}
                                            selectedMonth={dashboardMonth}
                                            selectedProvider={dashboardProvider}
                                        />
                                        <CommissionSummaryWidget 
                                            totalCommission={totalCommission} 
                                            energyCommission={energyCommission} 
                                            telephonyCommission={telephonyCommission} 
                                            selectedYear={dashboardYear} 
                                            selectedMonth={dashboardMonth} 
                                            selectedProvider={dashboardProvider} 
                                        />
                                        <CurrentMonthCommissionWidget 
                                            totalCommission={currentMonthStats.total}
                                            energyCommission={currentMonthStats.energy}
                                            telephonyCommission={currentMonthStats.telephony}
                                        />
                                        <TotalProvidersWidget totalProviders={providers.length} energyProviderCount={energyProvidersCount} telephonyProviderCount={telephonyProvidersCount} />
                                    </div>
                                </>
                            )}

                            {visibleWidgets.charts && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex flex-col">
                                        <h3 className="text-xl font-bold mb-4">Andamento Clienti</h3>
                                        <ClientChart clients={clients} selectedYear={dashboardYear === 'all' ? new Date().getFullYear().toString() : dashboardYear} />
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex flex-col">
                                        <h3 className="text-xl font-bold mb-4">Andamento Contratti</h3>
                                        <ContractChart contracts={contracts} selectedYear={dashboardYear} />
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex flex-col">
                                        <h3 className="text-xl font-bold mb-4">Andamento Provvigioni</h3>
                                        <CommissionChart contracts={contracts} selectedYear={dashboardYear === 'all' ? new Date().getFullYear().toString() : dashboardYear} />
                                    </div>
                                </div>
                            )}
                            
                            {/* Distribution Analysis Section */}
                            {visibleWidgets.distribution && (
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                                        <h2 className="text-lg font-bold flex items-center mb-2 sm:mb-0">
                                            <FilterIcon className="h-5 w-5 mr-2 text-slate-500" />
                                            Analisi Distribuzione
                                        </h2>
                                        <div className="flex gap-2">
                                            <select value={pieChartYear} onChange={e => setPieChartYear(e.target.value)} className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-sm">
                                                <option value="all">Tutti gli anni</option>
                                                {availableYears.map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                            <select value={pieChartMonth} onChange={e => setPieChartMonth(e.target.value)} className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-sm">
                                                <option value="all">Tutti i mesi</option>
                                                {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                                                    <option key={m} value={m}>{new Date(0, m-1).toLocaleString('it-IT', {month: 'long'})}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                        <EnergyProviderPieChart 
                                            contracts={filteredPieChartContracts.filter(c => c.type !== ContractType.Telephony)} 
                                            onProviderClick={handleProviderClick}
                                        />
                                        <TelephonyProviderPieChart 
                                            contracts={filteredPieChartContracts.filter(c => c.type === ContractType.Telephony)} 
                                            onProviderClick={handleProviderClick}
                                        />
                                        <PaidStatusPieChart contracts={filteredPieChartContracts} />
                                        <ContractExpiryStatusPieChart contracts={filteredPieChartContracts} />
                                    </div>
                                </div>
                            )}

                        </div>
                    )}

                    {view === 'clients' && (
                        <ClientListView
                            clients={clients}
                            contracts={contracts}
                            onAdd={() => { setEditingClient(null); setIsClientModalOpen(true); }}
                            onEdit={(c) => { setEditingClient(c); setIsClientModalOpen(true); }}
                            onDelete={(id) => setItemToDelete({ id, type: 'client' })}
                        />
                    )}

                    {view === 'contracts' && (
                        <ContractListView
                            contracts={contracts.filter(c => {
                                // Apply local filters for Contract List View
                                if(contractProviderFilter !== 'all' && c.provider !== contractProviderFilter) return false;
                                
                                if(contractFilterYear !== 'all' && c.startDate) {
                                    const y = new Date(c.startDate).getFullYear().toString();
                                    if(y !== contractFilterYear) return false;
                                }
                                
                                if(contractFilterMonth !== 'all' && c.startDate) {
                                    const m = (new Date(c.startDate).getMonth() + 1).toString();
                                    if(m !== contractFilterMonth) return false;
                                }

                                if(contractDateFrom && (!c.startDate || c.startDate < contractDateFrom)) return false;
                                if(contractDateTo && (!c.startDate || c.startDate > contractDateTo)) return false;
                                if(contractEndDateFrom && (!c.endDate || c.endDate < contractEndDateFrom)) return false;
                                if(contractEndDateTo && (!c.endDate || c.endDate > contractEndDateTo)) return false;
                                return true;
                            })}
                            clients={clients}
                            onAdd={() => { setEditingContract(null); setIsContractModalOpen(true); }}
                            onEdit={(c) => { setEditingContract(c); setIsContractModalOpen(true); }}
                            onDelete={(id) => setItemToDelete({ id, type: 'contract' })}
                            onTogglePaidStatus={togglePaidStatus}
                            availableProviders={providers}
                            selectedProvider={contractProviderFilter}
                            onProviderChange={setContractProviderFilter}
                            
                            availableYears={availableYears}
                            selectedYear={contractFilterYear}
                            onYearChange={setContractFilterYear}
                            selectedMonth={contractFilterMonth}
                            onMonthChange={setContractFilterMonth}

                            startDateFrom={contractDateFrom}
                            onStartDateFromChange={setContractDateFrom}
                            startDateTo={contractDateTo}
                            onStartDateToChange={setContractDateTo}
                            endDateFrom={contractEndDateFrom}
                            onEndDateFromChange={setContractEndDateFrom}
                            endDateTo={contractEndDateTo}
                            onEndDateToChange={setContractEndDateTo}
                        />
                    )}

                    {view === 'appointments' && (
                        <AppointmentListView 
                            appointments={appointments}
                            onAdd={() => { setEditingAppointment(null); setIsAppointmentModalOpen(true); }}
                            onEdit={(a) => { setEditingAppointment(a); setIsAppointmentModalOpen(true); }}
                            onDelete={(id) => setItemToDelete({ id, type: 'appointment' })}
                            onUpdateStatus={handleUpdateAppointmentStatus}
                            statuses={appointmentStatuses}
                        />
                    )}

                    {view === 'office-tasks' && (
                        <div className="h-full flex flex-col">
                            <h1 className="text-3xl font-bold mb-6 text-slate-800 dark:text-slate-100">Attività Ufficio</h1>
                            <div className="flex-1 max-w-4xl mx-auto w-full">
                                <OfficeTaskWidget 
                                    tasks={officeTasks}
                                    onAddTask={handleAddOfficeTask}
                                    onToggleTask={handleToggleOfficeTask}
                                    onDeleteTask={handleDeleteOfficeTask}
                                    fullView={true}
                                />
                            </div>
                        </div>
                    )}

                    {view === 'settings' && (
                        <SettingsView 
                            providers={providers}
                            onAddProvider={handleAddProvider}
                            onDeleteProvider={handleDeleteProvider}
                            operationTypes={operationTypes}
                            onAddOperationType={handleAddOperationType}
                            onDeleteOperationType={handleDeleteOperationType}
                            appointmentStatuses={appointmentStatuses}
                            onAddAppointmentStatus={handleAddAppointmentStatus}
                            onDeleteAppointmentStatus={handleDeleteAppointmentStatus}
                        />
                    )}
                </main>
            </div>

            {/* Modals */}
            <ClientFormModal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
                onSave={handleSaveClient}
                client={editingClient}
                isSaving={isSaving}
                isSuccess={isClientSuccess}
            />

            <ContractFormModal
                isOpen={isContractModalOpen}
                onClose={() => setIsContractModalOpen(false)}
                onSave={handleSaveContract}
                contract={editingContract}
                clients={clients}
                providers={providers}
                onAddProvider={handleAddProvider}
                isSaving={isSaving}
                isSuccess={isContractSuccess}
                operationTypes={operationTypes}
            />

            <AppointmentFormModal 
                isOpen={isAppointmentModalOpen}
                onClose={() => setIsAppointmentModalOpen(false)}
                onSave={handleSaveAppointment}
                appointment={editingAppointment}
                providers={providers}
                statuses={appointmentStatuses}
                isSaving={isSaving}
                isSuccess={isAppointmentSuccess}
            />

            <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={confirmDelete}
                title="Conferma eliminazione"
                message={`Sei sicuro di voler eliminare questo elemento? Questa azione è irreversibile.`}
                isConfirming={isDeleting}
            />

            <SearchModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                query={searchQuery}
                onQueryChange={setSearchQuery}
                results={searchResults}
                onClientClick={(c) => { setIsSearchModalOpen(false); setEditingClient(c); setIsClientModalOpen(true); }}
                onContractClick={(c) => { setIsSearchModalOpen(false); setEditingContract(c); setIsContractModalOpen(true); }}
                getClientName={getClientName}
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default App;
