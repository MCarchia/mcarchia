import React, { useState } from 'react';
import * as api from '../services/api';
import { Spinner } from './Spinner';
import { UserGroupIcon } from './Icons';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const creds = await api.getCredentials();
      // Verifica semplice (in produzione si userebbe l'auth di Firebase nativa o hash)
      if (username === creds.username && password === creds.password) {
        onLogin();
      } else {
        setError('Credenziali non valide');
      }
    } catch (err) {
      console.error(err);
      setError('Errore durante il login. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="bg-sky-500 p-6 flex flex-col items-center">
          <div className="bg-white p-3 rounded-full shadow-lg mb-4">
             <UserGroupIcon className="h-10 w-10 text-sky-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">CRM Clienti</h1>
          <p className="text-sky-100 text-sm">Accedi per gestire il tuo business</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all"
                placeholder="Inserisci username"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all"
                placeholder="Inserisci password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center font-medium animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-lg shadow transition-colors flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Spinner size="sm" color="border-white" /> : 'Accedi'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-xs text-slate-400">
            &copy; {new Date().getFullYear()} CRM Gestionale. Tutti i diritti riservati.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;