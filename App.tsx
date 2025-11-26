
import React, { useState, useEffect, useMemo } from 'react';
import * as api from './services/api';
import { Client, Contract, ContractType } from './types';
import Sidebar from './components/Sidebar';
import { ClientListView } from './components/ClientListView';
import { ContractListView } from './components/ContractListView';
import { ClientFormModal, ContractFormModal } from './components/ClientFormModal';
import ConfirmationModal from './components/ConfirmationModal';
import SearchModal from './components/SearchModal';
import GlobalSearchBar from './components/GlobalSearchBar';
import { MenuIcon, SearchIcon, EyeIcon, EyeOffIcon } from './components/Icons';
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
import ExpiringContractsWidget from './components/ExpiringContractsWidget';
import { Spinner } from './components/Spinner';

// Simple Toast Component (internal)
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
    <div className={`fixed bottom-4 right-4 px-6 py-3 rounded shadow-lg text-white z-50 flex items-center ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 font-bold">×</button>
    </div>
);

// Settings Component (internal for simplicity)
const SettingsView = ({ providers, onAddProvider, onDeleteProvider }: { providers: string[], onAddProvider: (p: string) => Promise<void>, onDeleteProvider: (p: string) => Promise<void> }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [newProvider, setNewProvider] = useState('');
    const [msg, setMsg] = useState('');

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

    return (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Impostazioni</h2>
            
            <div className="mb-8">
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

            <div>
                 <h3 className="text-lg font-semibold mb-2 text-slate-700 dark:text-slate-200">Gestione Fornitori</h3>
                 <form onSubmit={handleAdd} className="flex gap-2 mb-4 max-w-md">
                     <input type="text" value={newProvider} onChange={e => setNewProvider(e.target.value)} placeholder="Nuovo fornitore" className="flex-1 border p-2 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                     <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Aggiungi</button>
                 </form>
                 <ul className="max-w-md border rounded divide-y dark:border-slate-700 dark:divide-slate-700">
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
    const [providers, setProviders] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'dashboard' | 'clients' | 'contracts' | 'settings'>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    
    // Modals & Toast State
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'client' | 'contract' | 'provider' } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);
    const [editingContract, setEditingContract] = useState<Contract | null>(null);
    
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [isClientSuccess, setIsClientSuccess] = useState(false);
    const [isContractSuccess, setIsContractSuccess] = useState(false);

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
    const [dashboardMonth, setDashboardMonth] = useState((new Date().getMonth() + 1).toString());
    const [dashboardProvider, setDashboardProvider] = useState('all');

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
        setProviders([]);
    };

    // Data Loading (Only if Authenticated)
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [clientsData, contractsData, providersData] = await Promise.all([
                    api.getAllClients(),
                    api.getAllContracts(),
                    api.getAllProviders()
                ]);
                setClients(clientsData || []);
                setContracts(contractsData || []);
                setProviders(providersData || []);
            } catch (error) {
                console.error("Failed to load data", error);
                setToast({ message: "Errore caricamento dati. Verifica la console.", type: 'error' });
                // Initialize with empty arrays to prevent crashes
                setClients([]);
                setContracts([]);
                setProviders([]);
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
            } else if (type === 'provider') {
                const updatedProviders = await api.deleteProvider(idString);
                setProviders(updatedProviders);
                setToast({ message: "Fornitore eliminato con successo!", type: 'success' });
            }
        } catch (e: any) {
            let errorMessage = "Eliminazione fallita.";
            if (type === 'client') errorMessage = "Impossibile eliminare il cliente.";
            else if (type === 'contract') errorMessage = "Impossibile eliminare il contratto.";
            else if (type === 'provider') errorMessage = "Impossibile eliminare il fornitore.";

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

    const togglePaidStatus = async (contract: Contract) => {
        try {
            const updated = await api.updateContract({ ...contract, isPaid: !contract.isPaid });
            setContracts(prev => prev.map(c => c.id === updated.id ? updated : c));
        } catch(e) {
            console.error("Update paid status error:", e);
            setToast({ message: "Errore aggiornamento stato", type: 'error' });
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
    const energyCommission = useMemo(() => filteredDashboardContracts.filter(c => c.type !== ContractType.Telephony).reduce((sum, c) => sum + (c.commission || 0), 0), [filteredDashboardContracts]);
    const telephonyCommission = useMemo(() => filteredDashboardContracts.filter(c => c.type === ContractType.Telephony).reduce((sum, c) => sum + (c.commission || 0), 0), [filteredDashboardContracts]);
    
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
        const energy = currentMonthContracts.filter(c => c.type !== ContractType.Telephony).reduce((sum, c) => sum + (c.commission || 0), 0);
        const telephony = currentMonthContracts.filter(c => c.type === ContractType.Telephony).reduce((sum, c) => sum + (c.commission || 0), 0);

        return { total, energy, telephony };
    }, [contracts]);

    const energyProvidersCount = useMemo(() => new Set(contracts.filter(c => c.type !== ContractType.Telephony).map(c => c.provider)).size, [contracts]);
    const telephonyProvidersCount = useMemo(() => new Set(contracts.filter(c => c.type === ContractType.Telephony).map(c => c.provider)).size, [contracts]);

    
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
                onNavigate={(v) => { setView(v); setIsSidebarOpen(false); }}
                expiringContractsCount={contracts.filter(c => {
                     if (!c.endDate) return false;
                     const end = new Date(c.endDate);
                     const now = new Date();
                     const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                     return diff >= 0 && diff <= 30;
                }).length}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onLogout={handleLogout}
                theme={theme}
                onThemeSwitch={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header for Mobile */}
                <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400">
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <span className="font-bold text-lg">Mio CRM</span>
                    <button onClick={() => setIsSearchModalOpen(true)} className="p-2 -mr-2 text-slate-500">
                        <SearchIcon className="h-6 w-6" />
                    </button>
                </div>
                
                {/* Desktop Search Bar Area */}
                <div className="hidden lg:flex items-center justify-between py-4 px-8 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                     <div className="w-full max-w-2xl">
                         <GlobalSearchBar 
                            query={searchQuery}
                            onQueryChange={setSearchQuery}
                            onClear={() => setSearchQuery('')}
                            onFocus={() => setIsSearchModalOpen(true)}
                            placeholder="Cerca velocemente..."
                         />
                     </div>
                </div>

                <main className="flex-1 overflow-y-auto p-4 sm:p-8 scroll-smooth">
                    {view === 'dashboard' && (
                        <div className="space-y-6 animate-fade-in">
                            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
                            
                            {/* Dashboard Filters */}
                            <div className="flex flex-wrap gap-4 mb-6 bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                                <select value={dashboardYear} onChange={e => setDashboardYear(e.target.value)} className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600">
                                    <option value="all">Tutti gli anni</option>
                                    {Array.from(new Set(contracts.map(c => c.startDate ? new Date(c.startDate).getFullYear() : new Date().getFullYear()))).sort().map(y => (
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

                            <ExpiringContractsWidget 
                                contracts={contracts.filter(c => {
                                     if (!c.endDate) return false;
                                     const end = new Date(c.endDate);
                                     const now = new Date();
                                     now.setHours(0,0,0,0);
                                     const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                     return diff >= 0 && diff <= 30;
                                })} 
                                clients={clients}
                                onEdit={(c) => { setEditingContract(c); setIsContractModalOpen(true); }}
                                onDelete={(id) => setItemToDelete({ id, type: 'contract' })}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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

                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                                    <h3 className="text-xl font-bold mb-4">Andamento Clienti</h3>
                                    <ClientChart clients={clients} selectedYear={dashboardYear === 'all' ? new Date().getFullYear().toString() : dashboardYear} />
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                                    <h3 className="text-xl font-bold mb-4">Andamento Contratti</h3>
                                    <ContractChart contracts={contracts} selectedYear={dashboardYear} />
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                                    <h3 className="text-xl font-bold mb-4">Andamento Provvigioni</h3>
                                    <CommissionChart contracts={contracts} selectedYear={dashboardYear === 'all' ? new Date().getFullYear().toString() : dashboardYear} />
                                </div>
                            </div>
                            
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <EnergyProviderPieChart contracts={filteredDashboardContracts.filter(c => c.type !== ContractType.Telephony)} />
                                <TelephonyProviderPieChart contracts={filteredDashboardContracts.filter(c => c.type === ContractType.Telephony)} />
                                <PaidStatusPieChart contracts={filteredDashboardContracts} />
                            </div>
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

                    {view === 'settings' && (
                        <SettingsView 
                            providers={providers}
                            onAddProvider={handleAddProvider}
                            onDeleteProvider={handleDeleteProvider}
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
            />

            <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={confirmDelete}
                title="Conferma eliminazione"
                message={`Sei sicuro di voler eliminare questo ${itemToDelete?.type === 'client' ? 'cliente' : itemToDelete?.type === 'contract' ? 'contratto' : 'fornitore'}? Questa azione è irreversibile.`}
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
