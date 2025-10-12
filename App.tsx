


import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Client, Contract } from './types';
import { ContractType } from './types';
import * as api from './services/api';

// Components
import Sidebar from './components/Sidebar';
import { ClientListView, ContractListView } from './components/ClientListView';
import { ClientFormModal, ContractFormModal } from './components/ClientFormModal';
import ConfirmationModal from './components/ConfirmationModal';
import { Spinner } from './components/Spinner';
import ExpiringContractsWidget from './components/ExpiringContractsWidget';
import TotalClientsWidget from './components/TotalClientsWidget';
import TotalContractsWidget from './components/TotalContractsWidget';
import CommissionSummaryWidget from './components/CommissionSummaryWidget';
import ClientChart from './components/ClientChart';
import EnergyProviderPieChart from './components/EnergyProviderPieChart';
import TelephonyProviderPieChart from './components/TelephonyProviderPieChart';
import SearchModal from './components/SearchModal';
import { MenuIcon, CheckCircleIcon, UserGroupIcon, ChartBarIcon, PlusIcon, TrashIcon, ExclamationIcon } from './components/Icons';

type View = 'dashboard' | 'contracts' | 'clients' | 'settings';
type ModalState = { type: 'client' | 'contract'; data: Client | Contract | null } | null;
type ToastState = { message: string; type: 'success' | 'error' } | null;


// --- Componente Notifica (Toast) ---
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000); // 5 seconds for better readability
        return () => clearTimeout(timer);
    }, [onClose]);

    const isSuccess = type === 'success';
    const bgColor = isSuccess ? 'bg-green-500' : 'bg-red-500';
    const icon = isSuccess ? <CheckCircleIcon className="h-5 w-5 mr-2" /> : <ExclamationIcon className="h-5 w-5 mr-2" />;

    return (
        <div className={`fixed top-5 right-5 z-50 ${bgColor} text-white py-2 px-4 rounded-lg shadow-lg flex items-center animate-fade-in-down`}>
            {icon}
            <span>{message}</span>
        </div>
    );
};

// --- Componente Schermata di Login ---
const LoginScreen: React.FC<{ onLogin: (user: string, pass: string) => void; error: string; }> = ({ onLogin, error }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(username, password);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-xl shadow-2xl animate-scale-in">
                <div className="flex flex-col items-center">
                    <div className="bg-sky-500 p-3 rounded-full mb-4">
                        <UserGroupIcon className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-center text-slate-800 dark:text-slate-100">Mio CRM</h1>
                    <p className="text-slate-500 dark:text-slate-400">Accedi al tuo pannello</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label
                            htmlFor="username"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="mt-1 block w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                            placeholder="admin"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="password"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="mt-1 block w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                            placeholder="admin"
                        />
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
                    >
                        Accedi
                    </button>
                </form>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    // --- Authentication State ---
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [loginError, setLoginError] = useState('');
    const [toast, setToast] = useState<ToastState>(null);

    // State
    const [clients, setClients] = useState<Client[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [providers, setProviders] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [modal, setModal] = useState<ModalState>(null);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'client' | 'contract' | 'provider', id: string } | null>(null);
    
    // Dashboard filters
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [selectedProvider, setSelectedProvider] = useState<string>('all');
    const [clientChartYear, setClientChartYear] = useState<string>(new Date().getFullYear().toString());

    // Contract list filter
    const [contractListProvider, setContractListProvider] = useState<string>('all');
    
    // Sidebar state for mobile
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // Search state
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Theme state
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined' && window.localStorage.theme === 'dark') {
            return 'dark';
        }
        if (typeof window !== 'undefined' && !('theme' in window.localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });
    
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        }
    }, [theme]);
    
    const handleThemeSwitch = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    // --- Authentication Handlers ---
    useEffect(() => {
        const fetchCredentials = async () => {
            try {
                const creds = await api.getCredentials();
                setCredentials(creds);
            } catch (err) {
                console.error("Failed to fetch credentials", err);
                setLoginError("Impossibile caricare le credenziali. Controlla la connessione.");
                setCredentials({ username: 'admin', password: 'admin' }); // Fallback
            } finally {
                setIsAuthLoading(false);
            }
        };
        fetchCredentials();
    }, []);

    const handleLogin = (user: string, pass: string) => {
        if (user === credentials.username && pass === credentials.password) {
            setIsAuthenticated(true);
            setLoginError('');
        } else {
            setLoginError('Credenziali non valide. Riprova.');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
    };
    
    const handleSaveCredentials = async (newCreds: {username: string, password: string}) => {
        if (newCreds.username.trim() === '' || newCreds.password.trim() === '') {
            setToast({ message: 'Username e Password non possono essere vuoti.', type: 'error' });
            return;
        }
        try {
            await api.updateCredentials(newCreds);
            setCredentials(newCreds);
            setToast({ message: "Credenziali salvate correttamente!", type: 'success' });
        } catch (err) {
            console.error("Failed to save credentials", err);
            setToast({ message: "Salvataggio credenziali fallito. Riprova.", type: 'error' });
        }
    };

    // Data fetching
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [clientsData, contractsData, providersData] = await Promise.all([
                api.getAllClients(),
                api.getAllContracts(),
                api.getAllProviders(),
            ]);
            setClients(clientsData);
            setContracts(contractsData);
            setProviders(providersData);
        } catch (e) {
            if (e instanceof Error) {
                console.error(e.message);
            } else {
                console.error(String(e));
            }
            setError("Si è verificato un errore nel caricamento dei dati. Riprova più tardi.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if(isAuthenticated) {
            fetchData();
        }
    }, [fetchData, isAuthenticated]);

    // Keyboard shortcuts for search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchModalOpen(true);
            }
            if (e.key === 'Escape' && isSearchModalOpen) {
                setIsSearchModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSearchModalOpen]);

    // Client handlers
    const handleSaveClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
        setIsSaving(true);
        try {
            if (modal?.type === 'client' && modal.data) {
                await api.updateClient({ ...clientData, id: (modal.data as Client).id, createdAt: (modal.data as Client).createdAt });
            } else {
                await api.createClient(clientData);
            }
            setModal(null);
            await fetchData();
        } catch (e) {
            if (e instanceof Error) {
                console.error(e.message);
            } else {
                console.error(String(e));
            }
            setToast({ message: "Salvataggio del cliente fallito.", type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClient = (clientId: string) => {
        setItemToDelete({ type: 'client', id: clientId });
    };
    
    // Contract handlers
    const handleSaveContract = async (contractData: Omit<Contract, 'id'>) => {
        setIsSaving(true);
        try {
            if (modal?.type === 'contract' && modal.data) {
                await api.updateContract({ ...contractData, id: (modal.data as Contract).id });
            } else {
                await api.createContract(contractData);
            }
            setModal(null);
            await fetchData();
        } catch (e) {
            if (e instanceof Error) {
                console.error(e.message);
            } else {
                console.error(String(e));
            }
            setToast({ message: "Salvataggio del contratto fallito.", type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteContract = (contractId: string) => {
        setItemToDelete({ type: 'contract', id: contractId });
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            if (itemToDelete.type === 'client') {
                await api.deleteClient(itemToDelete.id);
                setClients(prevClients => prevClients.filter(client => client.id !== itemToDelete.id));
                setContracts(prevContracts => prevContracts.filter(contract => contract.clientId !== itemToDelete.id));
                setToast({ message: "Cliente eliminato con successo!", type: 'success' });
            } else if (itemToDelete.type === 'contract') {
                await api.deleteContract(itemToDelete.id);
                setContracts(prevContracts => prevContracts.filter(contract => contract.id !== itemToDelete.id));
                setToast({ message: "Contratto eliminato con successo!", type: 'success' });
            } else if (itemToDelete.type === 'provider') {
                const updatedProviders = await api.deleteProvider(itemToDelete.id);
                setProviders(updatedProviders);
                setToast({ message: "Fornitore eliminato con successo!", type: 'success' });
            }
        } catch (e) {
            let errorMessage = "Eliminazione fallita.";
            if (itemToDelete.type === 'client') {
                errorMessage = "Eliminazione del cliente fallita.";
            } else if (itemToDelete.type === 'contract') {
                errorMessage = "Eliminazione del contratto fallita.";
            } else if (itemToDelete.type === 'provider') {
                errorMessage = "Eliminazione del fornitore fallita.";
            }
            
            if (e instanceof Error) {
                console.error(e.message);
            } else {
                console.error(String(e));
            }
            setToast({ message: errorMessage, type: 'error' });
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
        } catch (e) {
            // FIX: Safely handle the error when adding a provider fails by checking if it's an instance of Error.
            if (e instanceof Error) {
                console.error(e.message);
            } else {
                console.error(String(e));
            }
            setToast({ message: "Aggiunta del fornitore fallita.", type: 'error' });
        }
    };

    const handleDeleteProvider = (providerToDelete: string) => {
        const isProviderInUse = contracts.some(c => c.provider === providerToDelete);
        if (isProviderInUse) {
            setToast({ message: "Questo fornitore non può essere eliminato perché è utilizzato in uno o più contratti.", type: 'error' });
            return;
        }
        setItemToDelete({ type: 'provider', id: providerToDelete });
    };


    // Memos for derived data
    const expiringContracts = useMemo(() => {
        return contracts.filter(c => {
            if (!c.endDate) return false;
            const now = new Date();
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(now.getDate() + 30);
            now.setHours(0,0,0,0);
            const endDate = new Date(c.endDate);
            return endDate >= now && endDate <= thirtyDaysFromNow;
        });
    }, [contracts]);
    
    const filteredContracts = useMemo(() => {
        return contracts
            .filter(c => selectedYear === 'all' || new Date(c.startDate).getFullYear().toString() === selectedYear)
            .filter(c => selectedMonth === 'all' || (new Date(c.startDate).getMonth() + 1).toString() === selectedMonth)
            .filter(c => selectedProvider === 'all' || c.provider === selectedProvider);
    }, [contracts, selectedYear, selectedMonth, selectedProvider]);

    const totalCommission = useMemo(() => {
        return filteredContracts.reduce((sum, contract) => sum + (contract.commission || 0), 0);
    }, [filteredContracts]);
    
    const energyContracts = useMemo(() => 
        contracts.filter(c => c.type === ContractType.Electricity || c.type === ContractType.Gas), 
    [contracts]);
    
    const telephonyContracts = useMemo(() => 
        contracts.filter(c => c.type === ContractType.Telephony), 
    [contracts]);

    const availableYears = useMemo(() => {
        const years = new Set(contracts.map(c => new Date(c.startDate).getFullYear().toString()));
        return Array.from(years).sort((a,b) => parseInt(b) - parseInt(a));
    }, [contracts]);
    
    const clientAvailableYears = useMemo(() => {
        const years = new Set(clients.map(c => new Date(c.createdAt).getFullYear().toString()));
        const currentYear = new Date().getFullYear().toString();
        if (!years.has(currentYear)) {
            years.add(currentYear);
        }
        return Array.from(years).sort((a,b) => parseInt(b) - parseInt(a));
    }, [clients]);

    // Search logic
    const searchResults = useMemo(() => {
        if (searchQuery.length < 2) {
            return { clients: [], contracts: [] };
        }
        const lowerCaseQuery = searchQuery.toLowerCase();
        const foundClients = clients.filter(c =>
            c.firstName.toLowerCase().includes(lowerCaseQuery) ||
            c.lastName.toLowerCase().includes(lowerCaseQuery) ||
            c.email.toLowerCase().includes(lowerCaseQuery) ||
            c.codiceFiscale?.toLowerCase().includes(lowerCaseQuery)
        );
        const foundContracts = contracts.filter(c =>
            c.provider.toLowerCase().includes(lowerCaseQuery) ||
            c.contractCode.toLowerCase().includes(lowerCaseQuery)
        );
        return { clients: foundClients, contracts: foundContracts };
    }, [searchQuery, clients, contracts]);

    const getClientName = useCallback((clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        return client ? `${client.firstName} ${client.lastName}` : 'N/D';
    }, [clients]);

    const handleSearchClientClick = (client: Client) => {
        setIsSearchModalOpen(false);
        setSearchQuery('');
        setCurrentView('clients');
        setTimeout(() => setModal({ type: 'client', data: client }), 100);
    };

    const handleSearchContractClick = (contract: Contract) => {
        setIsSearchModalOpen(false);
        setSearchQuery('');
        setCurrentView('contracts');
        setTimeout(() => setModal({ type: 'contract', data: contract }), 100);
    };
    
    const deletionDetails = useMemo(() => {
        if (!itemToDelete) return null;

        if (itemToDelete.type === 'client') {
            const client = clients.find(c => c.id === itemToDelete.id);
            if (!client) return null;
            return {
                title: 'Conferma Eliminazione Cliente',
                message: (
                    <>
                        <p>Sei sicuro di voler eliminare definitivamente <strong>{client.firstName} {client.lastName}</strong>?</p>
                        <p className="font-semibold text-red-600 dark:text-red-400 mt-2">Questa azione è irreversibile e comporterà l'eliminazione di tutti i suoi contratti associati.</p>
                    </>
                ),
            };
        } else if (itemToDelete.type === 'contract') {
            const contract = contracts.find(c => c.id === itemToDelete.id);
            if (!contract) return null;
            const clientName = getClientName(contract.clientId);
            return {
                title: 'Conferma Eliminazione Contratto',
                message: (
                    <>
                        <p>Sei sicuro di voler eliminare definitivamente il contratto <strong>{contract.provider}</strong> ({contract.contractCode || 'N/D'}) per il cliente <strong>{clientName}</strong>?</p>
                        <p className="font-semibold text-red-600 dark:text-red-400 mt-2">Questa azione è irreversibile.</p>
                    </>
                ),
            };
        } else if (itemToDelete.type === 'provider') {
            const providerName = itemToDelete.id;
            return {
                title: 'Conferma Eliminazione Fornitore',
                message: (
                    <>
                        <p>Sei sicuro di voler eliminare definitivamente il fornitore <strong>{providerName}</strong>?</p>
                        <p className="font-semibold text-red-600 dark:text-red-400 mt-2">Questa azione è irreversibile.</p>
                    </>
                ),
            };
        }
        return null;
    }, [itemToDelete, clients, contracts, getClientName]);

    const renderContent = () => {
        if (isLoading && clients.length === 0) {
            return <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>;
        }
        if (error) {
            return <div className="text-center text-red-500 p-8">{error}</div>;
        }

        switch (currentView) {
            case 'dashboard':
                const months = [
                    { value: 'all', name: 'Tutti i Mesi' },
                    { value: '1', name: 'Gennaio' }, { value: '2', name: 'Febbraio' },
                    { value: '3', name: 'Marzo' }, { value: '4', name: 'Aprile' },
                    { value: '5', name: 'Maggio' }, { value: '6', name: 'Giugno' },
                    { value: '7', name: 'Luglio' }, { value: '8', name: 'Agosto' },
                    { value: '9', name: 'Settembre' }, { value: '10', name: 'Ottobre' },
                    { value: '11', name: 'Novembre' }, { value: '12', name: 'Dicembre' },
                ];
                return (
                    <div className="space-y-6 animate-fade-in-down">
                        {/* Filter Bar */}
                        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label htmlFor="year-filter" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Anno</label>
                              <select 
                                id="year-filter" 
                                value={selectedYear} 
                                onChange={e => setSelectedYear(e.target.value)} 
                                className="w-full text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                              >
                                <option value="all">Tutti gli Anni</option>
                                {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                              </select>
                            </div>
                             <div>
                              <label htmlFor="month-filter" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Mese</label>
                              <select 
                                id="month-filter" 
                                value={selectedMonth} 
                                onChange={e => setSelectedMonth(e.target.value)} 
                                className="w-full text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                              >
                                {months.map(month => <option key={month.value} value={month.value}>{month.name}</option>)}
                              </select>
                            </div>
                             <div>
                              <label htmlFor="provider-filter-dashboard" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Fornitore</label>
                              <select 
                                id="provider-filter-dashboard" 
                                value={selectedProvider} 
                                onChange={e => setSelectedProvider(e.target.value)} 
                                className="w-full text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                              >
                                <option value="all">Tutti i Fornitori</option>
                                {providers.sort().map(provider => <option key={provider} value={provider}>{provider}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>

                        {expiringContracts.length > 0 && 
                            <ExpiringContractsWidget 
                                contracts={expiringContracts} 
                                clients={clients} 
                                onEdit={(contract) => setModal({ type: 'contract', data: contract })}
                                onDelete={handleDeleteContract}
                            />
                        }
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <TotalClientsWidget totalClients={clients.length} />
                            <TotalContractsWidget 
                                totalContracts={filteredContracts.length}
                                selectedYear={selectedYear}
                                selectedMonth={selectedMonth}
                                selectedProvider={selectedProvider}
                            />
                            <CommissionSummaryWidget 
                                totalCommission={totalCommission}
                                selectedYear={selectedYear}
                                selectedMonth={selectedMonth}
                                selectedProvider={selectedProvider}
                             />
                        </div>
                        
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                                <div className="flex items-center">
                                    <ChartBarIcon className="h-6 w-6 text-sky-500 mr-3" />
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Andamento Clienti</h2>
                                </div>
                                <div className="mt-3 sm:mt-0">
                                    <label htmlFor="client-chart-year-filter" className="sr-only">Seleziona Anno</label>
                                    <select 
                                        id="client-chart-year-filter" 
                                        value={clientChartYear} 
                                        onChange={e => setClientChartYear(e.target.value)} 
                                        className="w-full sm:w-auto text-sm bg-slate-100 dark:bg-slate-700 border-transparent focus:border-sky-500 focus:ring-sky-500 rounded-md py-1.5 px-3 transition"
                                    >
                                        {clientAvailableYears.map(year => <option key={year} value={year}>{year}</option>)}
                                    </select>
                                </div>
                            </div>
                            <ClientChart clients={clients} selectedYear={clientChartYear} />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                           <EnergyProviderPieChart contracts={energyContracts} />
                           <TelephonyProviderPieChart contracts={telephonyContracts} />
                        </div>
                    </div>
                );
            case 'clients':
                return <ClientListView 
                            clients={clients} 
                            contracts={contracts}
                            onAdd={() => setModal({ type: 'client', data: null })} 
                            onEdit={(client) => setModal({ type: 'client', data: client })} 
                            onDelete={handleDeleteClient} 
                       />;
            case 'contracts':
                const filteredContractList = contracts.filter(c => contractListProvider === 'all' || c.provider === contractListProvider);
                return <ContractListView 
                            contracts={filteredContractList} 
                            clients={clients} 
                            onAdd={() => setModal({ type: 'contract', data: null })} 
                            onEdit={(contract) => setModal({ type: 'contract', data: contract })} 
                            onDelete={handleDeleteContract}
                            availableProviders={providers}
                            selectedProvider={contractListProvider}
                            onProviderChange={setContractListProvider}
                       />;
            case 'settings':
                return <SettingsView 
                    currentCredentials={credentials}
                    onSave={handleSaveCredentials}
                    providers={providers}
                    onAddProvider={handleAddProvider}
                    onDeleteProvider={handleDeleteProvider}
                />;
            default:
                return null;
        }
    };
    
    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <LoginScreen onLogin={handleLogin} error={loginError} />;
    }

    return (
        <div className="bg-slate-100 dark:bg-slate-900 min-h-screen">
            <Sidebar 
                currentView={currentView}
                onNavigate={(view) => {
                    setCurrentView(view);
                    setIsSidebarOpen(false);
                }}
                expiringContractsCount={expiringContracts.length}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onLogout={handleLogout}
                theme={theme}
                onThemeSwitch={handleThemeSwitch}
            />
            
            <main className="lg:pl-64 transition-all duration-300 ease-in-out">
                <header className="sticky top-0 z-20 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 border-b border-slate-200 dark:border-slate-700">
                   <div className="flex items-center">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 mr-4 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 lg:hidden"
                            aria-label="Apri menu"
                        >
                            <MenuIcon className="h-6 w-6" />
                        </button>
                        <div className="w-full max-w-lg">
                            <button
                                onClick={() => setIsSearchModalOpen(true)}
                                className="w-full text-left bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-4 text-slate-500 dark:text-slate-400 flex items-center justify-between"
                            >
                                <span>Cerca...</span>
                                <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-sans font-medium text-slate-400 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md">
                                    ⌘K
                                </kbd>
                            </button>
                        </div>
                   </div>
                </header>

                <div className="p-4 sm:p-6 lg:p-8">
                    {renderContent()}
                </div>
            </main>

            {modal?.type === 'client' && (
                <ClientFormModal 
                    isOpen={!!modal}
                    onClose={() => setModal(null)}
                    onSave={handleSaveClient}
                    client={modal.data as Client | null}
                    isSaving={isSaving}
                />
            )}
            
            {modal?.type === 'contract' && (
                <ContractFormModal 
                    isOpen={!!modal}
                    onClose={() => setModal(null)}
                    onSave={handleSaveContract}
                    contract={modal.data as Contract | null}
                    clients={clients}
                    providers={providers}
                    onAddProvider={handleAddProvider}
                    isSaving={isSaving}
                />
            )}
            
            <SearchModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                query={searchQuery}
                onQueryChange={setSearchQuery}
                results={searchResults}
                onClientClick={handleSearchClientClick}
                onContractClick={handleSearchContractClick}
                getClientName={getClientName}
            />
            
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {deletionDetails && (
                <ConfirmationModal
                    isOpen={!!itemToDelete}
                    onClose={() => setItemToDelete(null)}
                    onConfirm={confirmDelete}
                    title={deletionDetails.title}
                    message={deletionDetails.message}
                    isConfirming={isDeleting}
                />
            )}
        </div>
    );
};

// --- Componente Vista Impostazioni ---
const SettingsView: React.FC<{
    currentCredentials: { username: string; password?: string };
    onSave: (creds: { username: string; password: string }) => Promise<void>;
    providers: string[];
    onAddProvider: (provider: string) => Promise<void>;
    onDeleteProvider: (provider: string) => void;
}> = ({ currentCredentials, onSave, providers, onAddProvider, onDeleteProvider }) => {
    const [username, setUsername] = useState(currentCredentials.username);
    const [password, setPassword] = useState('');
    const [newProvider, setNewProvider] = useState('');
    const [isSaving, setIsSaving] = useState(false);


    const handleCredentialsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave({ username, password });
        setIsSaving(false);
        setPassword('');
    };

    const handleAddProviderSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedProvider = newProvider.trim();
        if (trimmedProvider) {
            if (providers.some(p => p.toLowerCase() === trimmedProvider.toLowerCase())) {
                alert('Questo fornitore esiste già.');
            } else {
                await onAddProvider(trimmedProvider);
                setNewProvider('');
            }
        }
    };


    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg animate-fade-in-down">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Impostazioni Credenziali</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                    Modifica le credenziali di accesso. Le modifiche saranno sincronizzate su tutti i dispositivi.
                </p>

                <form onSubmit={handleCredentialsSubmit} className="mt-6 space-y-4">
                    <div>
                        <label
                            htmlFor="settings-username"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                            Nuovo Username
                        </label>
                        <input
                            id="settings-username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="settings-password"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                            Nuova Password
                        </label>
                        <input
                            id="settings-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Inserisci la nuova password"
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                        />
                    </div>
                    <div className="pt-2 text-right">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors disabled:bg-sky-400"
                        >
                            {isSaving && <Spinner size="sm" color="border-white" className="mr-2" />}
                            {isSaving ? 'Salvataggio...' : 'Salva Credenziali'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg mt-8 animate-fade-in-down">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Gestione Fornitori</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                    Aggiungi o rimuovi i fornitori disponibili per i contratti.
                </p>

                <form onSubmit={handleAddProviderSubmit} className="mt-6 flex items-center space-x-3">
                    <input
                        type="text"
                        value={newProvider}
                        onChange={(e) => setNewProvider(e.target.value)}
                        placeholder="Nome nuovo fornitore"
                        className="flex-grow block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                    />
                    <button
                        type="submit"
                        className="inline-flex items-center justify-center px-4 py-2 bg-sky-500 text-white rounded-md shadow hover:bg-sky-600 transition disabled:bg-sky-300"
                        disabled={!newProvider.trim()}
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Aggiungi
                    </button>
                </form>

                <div className="mt-6 max-h-60 overflow-y-auto pr-2">
                    <ul className="space-y-2">
                        {providers.sort((a, b) => a.localeCompare(b)).map(provider => (
                            <li key={provider} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md animate-fade-in">
                                <span className="font-medium text-slate-800 dark:text-slate-200">{provider}</span>
                                <button
                                    onClick={() => onDeleteProvider(provider)}
                                    className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors"
                                    aria-label={`Elimina ${provider}`}
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default App;