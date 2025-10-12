import React from 'react';
import { ChartBarIcon, UserGroupIcon, DocumentDuplicateIcon, XIcon, SunIcon, MoonIcon, LogoutIcon, CogIcon } from './Icons';

type View = 'dashboard' | 'contracts' | 'clients' | 'settings';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  expiringContractsCount: number;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onThemeSwitch: () => void;
}

const NavButton: React.FC<{
  label: string;
  view: View;
  currentView: View;
  onClick: (view: View) => void;
  icon: React.ReactNode;
  badgeCount?: number;
}> = ({ label, view, currentView, onClick, icon, badgeCount }) => {
  const isActive = currentView === view;
  return (
    <button
      onClick={() => onClick(view)}
      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg font-semibold text-left transition-colors ${
        isActive
          ? 'bg-sky-500 text-white shadow'
          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
      }`}
    >
      <div className="flex items-center space-x-3">
        {icon}
        <span>{label}</span>
      </div>
       {badgeCount && badgeCount > 0 && (
        <span className={`flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full text-xs font-bold ${
          isActive ? 'bg-white text-sky-600' : 'bg-amber-400 text-white'
        }`}>
          {badgeCount}
        </span>
      )}
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, expiringContractsCount, isOpen, onClose, onLogout, theme, onThemeSwitch }) => {
  return (
    <>
        {/* Overlay for mobile */}
        <div
            className={`fixed inset-0 bg-black bg-opacity-40 z-30 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
            aria-hidden="true"
        />

        {/* Sidebar Panel */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-800 h-screen flex flex-col shadow-lg border-r border-slate-200 dark:border-slate-700 flex-shrink-0 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className="bg-sky-500 p-2 rounded-lg">
                    <UserGroupIcon className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Mio CRM</h1>
            </div>
             <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 lg:hidden" aria-label="Chiudi menu">
                <XIcon className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-grow p-4 space-y-2">
            <NavButton
                label="Dashboard"
                view="dashboard"
                currentView={currentView}
                onClick={onNavigate}
                icon={<ChartBarIcon className="h-5 w-5" />}
                badgeCount={expiringContractsCount}
            />
            <NavButton
                label="Contratti"
                view="contracts"
                currentView={currentView}
                onClick={onNavigate}
                icon={<DocumentDuplicateIcon className="h-5 w-5" />}
            />
            <NavButton
                label="Clienti"
                view="clients"
                currentView={currentView}
                onClick={onNavigate}
                icon={<UserGroupIcon className="h-5 w-5" />}
            />
            <NavButton
                label="Impostazioni"
                view="settings"
                currentView={currentView}
                onClick={onNavigate}
                icon={<CogIcon className="h-5 w-5" />}
            />
          </nav>
          
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
            <button
                onClick={onThemeSwitch}
                className="w-full flex items-center justify-center p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                aria-label={`Passa a modalità ${theme === 'light' ? 'scura' : 'chiara'}`}
            >
                {theme === 'light' ? (
                    <MoonIcon className="h-6 w-6 text-slate-500" />
                ) : (
                    <SunIcon className="h-6 w-6 text-amber-400" />
                )}
                <span className="ml-3 font-semibold text-sm">
                   {theme === 'light' ? 'Modalità Scura' : 'Modalità Chiara'}
                </span>
            </button>
            <button
                onClick={onLogout}
                className="w-full flex items-center justify-center p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                aria-label="Logout"
            >
                <LogoutIcon className="h-6 w-6 text-red-500" />
                <span className="ml-3 font-semibold text-sm">Logout</span>
            </button>
          </div>
        </aside>
    </>
  );
};

export default Sidebar;