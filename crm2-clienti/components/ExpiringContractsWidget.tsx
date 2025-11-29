
import React from 'react';
import type { Client, Contract } from '../types';
import { ExclamationIcon, PencilIcon, TrashIcon, MailIcon, CheckCircleIcon, ChatIcon, WhatsAppIcon } from './Icons';

interface ExpiringContractsWidgetProps {
  contracts: Contract[];
  clients: Client[];
  onEdit: (contract: Contract) => void;
  onDelete: (contractId: string) => void;
}

const ExpiringContractsWidget: React.FC<ExpiringContractsWidgetProps> = ({ contracts, clients, onEdit, onDelete }) => {
  // Se non ci sono contratti in scadenza, mostriamo comunque il widget ma con un messaggio positivo
  if (contracts.length === 0) {
    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg shadow-md animate-fade-in mb-6">
          <div className="flex items-center">
              <div className="py-1">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 mr-4" />
              </div>
              <div>
                  <p className="font-bold text-green-800">Tutto in ordine!</p>
                  <p className="text-sm text-green-700">Nessun contratto in scadenza o scaduto.</p>
              </div>
          </div>
      </div>
    );
  }
  
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : 'N/D';
  };
  
  const getDaysRemaining = (endDateStr: string) => {
    const endDate = new Date(endDateStr);
    const now = new Date();
    // Imposta l'ora a mezzanotte per entrambi per confrontare solo le date
    endDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Scaduto';
    if (diffDays === 0) return 'Scade oggi';
    if (diffDays === 1) return 'Scade domani';
    return `Scade tra ${diffDays} giorni`;
  };

  const createReminderMessage = (contract: Contract, client: Client, isHtml: boolean = false) => {
    const endDate = contract.endDate ? new Date(contract.endDate).toLocaleDateString('it-IT') : 'N/D';
    let addressStr = '';
    if (contract.supplyAddress) {
        addressStr = `${contract.supplyAddress.street || ''} ${contract.supplyAddress.city || ''}`;
    }

    if (isHtml) {
        // Per Email
        return `Gentile ${client.firstName} ${client.lastName},

Ti ricordiamo che il tuo contratto ${contract.provider} (Codice: ${contract.contractCode || 'N/D'})
${addressStr ? `relativo alla fornitura in ${addressStr}` : ''}
è in scadenza il ${endDate}.

Contattaci al più presto per valutare le migliori opzioni di rinnovo.
Puoi inviarmi la documentazione anche tramite mail all'indirizzo carchia1980@gmail.com

Cordiali saluti,
Michele Carchia
cell. 3292445561
email: carchia1980@gmail.com`;
    } else {
        // Per SMS / WhatsApp
        return `Gentile ${client.firstName}, ti ricordo che il tuo contratto ${contract.provider} (Cod. ${contract.contractCode || ''}) scade il ${endDate}.
Contattami per il rinnovo.
Puoi inviarmi la documentazione anche tramite mail a carchia1980@gmail.com

Saluti, Michele Carchia.`;
    }
  };

  const handleSendEmail = (contract: Contract) => {
    const client = clients.find(c => c.id === contract.clientId);
    if (!client || !client.email) {
        alert("Impossibile inviare email: indirizzo email cliente non trovato.");
        return;
    }

    const subject = encodeURIComponent(`Promemoria Scadenza Contratto: ${contract.provider}`);
    const body = encodeURIComponent(createReminderMessage(contract, client, true));

    window.open(`mailto:${client.email}?subject=${subject}&body=${body}`);
  };

  const handleSendWhatsApp = (contract: Contract) => {
      const client = clients.find(c => c.id === contract.clientId);
      if (!client || !client.mobilePhone) {
          alert("Impossibile inviare WhatsApp: numero di cellulare non trovato.");
          return;
      }
      
      const message = encodeURIComponent(createReminderMessage(contract, client, false));
      // Semplice pulizia del numero: rimuove tutto tranne le cifre
      let phone = client.mobilePhone.replace(/[^0-9]/g, '');
      
      // Se manca il prefisso internazionale (39 per Italia), proviamo ad aggiungerlo se sembra un numero italiano
      if (!phone.startsWith('39') && phone.startsWith('3') && phone.length === 10) {
          phone = '39' + phone;
      }

      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleSendSMS = (contract: Contract) => {
      const client = clients.find(c => c.id === contract.clientId);
      if (!client || !client.mobilePhone) {
          alert("Impossibile inviare SMS: numero di cellulare non trovato.");
          return;
      }
      const message = encodeURIComponent(createReminderMessage(contract, client, false));
      const phone = client.mobilePhone.replace(/[^0-9]/g, ''); // Pulizia base
      
      // La sintassi sms: varia leggermente tra iOS e Android, ma questa è la più standard
      // Su iOS moderni e Android, ?body= funziona generalmente bene per il pre-fill
      window.open(`sms:${phone}?body=${message}`, '_self');
  };

  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg shadow-md animate-fade-in mb-6">
      <div className="flex">
        <div className="py-1">
          <ExclamationIcon className="h-6 w-6 text-amber-500 mr-4" />
        </div>
        <div className="flex-grow">
          <p className="font-bold text-amber-800">Contratti in Scadenza / Scaduti</p>
          <div className="mt-2 text-sm text-amber-700">
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {contracts.sort((a,b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime()).map(contract => (
                <li key={contract.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-amber-200/50 last:border-b-0">
                  <div className="mb-2 sm:mb-0">
                    <span className="font-medium text-amber-900">{contract.provider}</span> - {getClientName(contract.clientId)}
                    <span className="ml-2 font-bold px-2 py-0.5 rounded bg-white/50 text-amber-800 text-xs uppercase">
                      {getDaysRemaining(contract.endDate!)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0 sm:ml-4">
                     <button 
                      onClick={() => handleSendWhatsApp(contract)} 
                      className="p-1.5 text-green-600 rounded-full hover:bg-green-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 focus:ring-green-500"
                      aria-label={`Invia WhatsApp a ${getClientName(contract.clientId)}`}
                      title="Invia WhatsApp"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleSendSMS(contract)} 
                      className="p-1.5 text-blue-600 rounded-full hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 focus:ring-blue-500"
                      aria-label={`Invia SMS a ${getClientName(contract.clientId)}`}
                      title="Invia SMS"
                    >
                      <ChatIcon className="h-4 w-4" />
                    </button>
                     <button 
                      onClick={() => handleSendEmail(contract)} 
                      className="p-1.5 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 focus:ring-indigo-500"
                      aria-label={`Invia email di promemoria a ${getClientName(contract.clientId)}`}
                      title="Invia Email"
                    >
                      <MailIcon className="h-4 w-4" />
                    </button>
                     <button 
                      onClick={() => onEdit(contract)} 
                      className="p-1.5 text-sky-600 rounded-full hover:bg-sky-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 focus:ring-sky-500"
                      aria-label={`Modifica contratto ${contract.provider} per ${getClientName(contract.clientId)}`}
                      title="Modifica"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(contract.id)} 
                      className="p-1.5 text-red-600 rounded-full hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 focus:ring-red-500"
                      aria-label={`Elimina contratto ${contract.provider} per ${getClientName(contract.clientId)}`}
                      title="Elimina"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpiringContractsWidget;
