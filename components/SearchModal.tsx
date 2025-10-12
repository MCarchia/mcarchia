
import React, { useState, useEffect, useRef } from 'react';
import type { Client, Contract } from '../types';
import GlobalSearchBar from './GlobalSearchBar';
import SearchResults from './SearchResults';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (query: string) => void;
  results: {
    clients: Client[];
    contracts: Contract[];
  };
  onClientClick: (client: Client) => void;
  onContractClick: (contract: Contract) => void;
  getClientName: (clientId: string) => string;
}

const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  query,
  onQueryChange,
  results,
  onClientClick,
  onContractClick,
  getClientName
}) => {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const flattenedResults = [
    ...results.clients,
    ...results.contracts,
  ];

  useEffect(() => {
    if (isOpen) {
      // Reset highlighted index when modal opens or query changes
      setHighlightedIndex(-1);
      // Focus input
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev < flattenedResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < flattenedResults.length) {
        const selectedItem = flattenedResults[highlightedIndex];
        // Check if the item is a client or contract by checking for a unique property
        if ('firstName' in selectedItem) {
          onClientClick(selectedItem as Client);
        } else {
          onContractClick(selectedItem as Contract);
        }
      }
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40" aria-modal="true" role="dialog">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative flex justify-center pt-[15vh]">
         <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-4 border-b border-slate-200">
                <GlobalSearchBar
                    query={query}
                    onQueryChange={onQueryChange}
                    onClear={() => onQueryChange('')}
                    onKeyDown={handleKeyDown}
                    autoFocus={true}
                    placeholder="Cerca per nome, fornitore, codice contratto..."
                    helperText="ESC per chiudere"
                />
            </div>
            
            {query.length > 1 && (
                <SearchResults
                    results={results}
                    query={query}
                    onClientClick={onClientClick}
                    onContractClick={onContractClick}
                    getClientName={getClientName}
                    highlightedIndex={highlightedIndex}
                />
            )}
         </div>
      </div>
    </div>
  );
};

export default SearchModal;
