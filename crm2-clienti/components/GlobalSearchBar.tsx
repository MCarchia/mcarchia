
import React from 'react';
import { SearchIcon, XIcon } from './Icons';

interface GlobalSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onClear: () => void;
  onFocus?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  placeholder?: string;
  helperText?: string;
}

const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({ 
    query, 
    onQueryChange, 
    onClear, 
    onFocus,
    onKeyDown,
    autoFocus = false,
    placeholder = "Cerca clienti, contratti, fornitori...",
    helperText,
}) => {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <SearchIcon className="h-5 w-5 text-slate-400" />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
        className="block w-full bg-white border border-slate-300 rounded-md py-3 pl-12 pr-10 text-base placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
        aria-label="Ricerca globale"
      />
      {query ? (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button
            onClick={onClear}
            className="p-1 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label="Pulisci ricerca"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      ) : helperText ? (
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <kbd className="inline-flex items-center px-2 py-1 text-xs font-sans font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-md">
                {helperText}
            </kbd>
        </div>
      ) : null}
    </div>
  );
};

export default GlobalSearchBar;
