
import React from 'react';
import type { Client, Contract } from '../types';
import { UserGroupIcon, DocumentTextIcon, DocumentSearchIcon } from './Icons';

interface SearchResultsProps {
  results: {
    clients: Client[];
    contracts: Contract[];
  };
  query: string;
  onClientClick: (client: Client) => void;
  onContractClick: (contract: Contract) => void;
  getClientName: (clientId: string) => string;
  highlightedIndex: number;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, query, onClientClick, onContractClick, getClientName, highlightedIndex }) => {
  const hasResults = results.clients.length > 0 || results.contracts.length > 0;
  
  const flattenedResults = [
    ...results.clients.map(c => ({ type: 'client', data: c })),
    ...results.contracts.map(c => ({ type: 'contract', data: c })),
  ];

  return (
    <div className="max-h-[60vh] overflow-y-auto">
      {hasResults ? (
        <>
          {results.clients.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase text-slate-500 bg-slate-50 px-4 py-2 border-b">Clienti</h3>
              <ul>
                {results.clients.map((client, index) => (
                  <li key={client.id} id={`search-result-${index}`} role="option" aria-selected={highlightedIndex === index}>
                    <button
                      onClick={() => onClientClick(client)}
                      className={`w-full text-left flex items-center px-4 py-3 transition-colors ${highlightedIndex === index ? 'bg-sky-100' : 'hover:bg-sky-50'}`}
                    >
                      <UserGroupIcon className="h-5 w-5 text-slate-400 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{`${client.firstName} ${client.lastName}`}</p>
                        <p className="text-xs text-slate-500">{client.email}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {results.contracts.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase text-slate-500 bg-slate-50 px-4 py-2 border-t border-b">Contratti</h3>
              <ul>
                {results.contracts.map((contract, index) => {
                   const overallIndex = results.clients.length + index;
                   return (
                    <li key={contract.id} id={`search-result-${overallIndex}`} role="option" aria-selected={highlightedIndex === overallIndex}>
                      <button
                        onClick={() => onContractClick(contract)}
                        className={`w-full text-left flex items-center px-4 py-3 transition-colors ${highlightedIndex === overallIndex ? 'bg-sky-100' : 'hover:bg-sky-50'}`}
                      >
                        <DocumentTextIcon className="h-5 w-5 text-slate-400 mr-3 flex-shrink-0" />
                        <div>
                           <p className="text-sm font-medium text-slate-800">
                             {contract.provider}
                             {contract.contractCode && ` - ${contract.contractCode}`}
                           </p>
                          <p className="text-xs text-slate-500">per {getClientName(contract.clientId)}</p>
                        </div>
                      </button>
                    </li>
                   );
                })}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="p-10 text-center flex flex-col items-center">
          <DocumentSearchIcon className="h-12 w-12 text-slate-400 mb-4" />
          <p className="text-base font-medium text-slate-700">Nessun risultato trovato</p>
          <p className="text-sm text-slate-500 mt-1">
            Non ci sono risultati per "<span className="font-semibold">{query}</span>".
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
