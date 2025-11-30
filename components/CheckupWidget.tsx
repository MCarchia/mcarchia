
import React from 'react';
import type { Client, Contract, CheckupItem } from '../types';
import { PencilIcon, MailIcon, ChatIcon, WhatsAppIcon, DocumentSearchIcon, CheckCircleIcon, TrashIcon } from './Icons';

interface CheckupWidgetProps {
  items: CheckupItem[];
  clients: Client[];
  onEdit: (contract: Contract) => void;
  onDismiss: (item: CheckupItem) => void;
}

const CheckupWidget: React.FC<CheckupWidgetProps> = ({ items, clients, onEdit, onDismiss }) => {
  // Se non ci sono checkup, mostriamo il widget con un messaggio di "Nessuna attività" per tenerlo visibile
  if (items.length === 0) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg shadow-md animate-fade-in mb-6">
          <div className="flex items-center">
              <div className="py-1">
                  <CheckCircleIcon className="h-6 w-6 text-blue-500 mr-4" />
              </div>
              <div>
                  <p className="font-bold text-blue-800">Check-up Periodici (T4: 6 mesi / T8: 10 mesi)</p>
                  <p className="text-sm text-blue-700">Nessun controllo da effettuare nei prossimi giorni (Finestra +/- 10gg).</p>
              </div>
          </div>
      </div>
    );
  }

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : 'N/D';
  };

  const createMessage = (item: CheckupItem, client: Client, isHtml: boolean = false) => {
    const { contract, type } = item;
    // T4 (6 mesi dalla stipula) -> "4 mesi circa dall'attivazione" (considerando 2 mesi di switch)
    // T8 (10 mesi dalla stipula) -> "8 mesi circa dall'attivazione"
    const timeDescription = type === 'T4' ? "4 mesi circa" : "8 mesi circa";
    const provider = contract.provider;
    
    if (isHtml) {
        // --- TESTO FORMALE PER EMAIL ---
        return `Gentile ${client.firstName} ${client.lastName},

sono passati ${timeDescription} dall'attivazione del tuo contratto ${provider}.
Come da prassi, vorrei effettuare un controllo gratuito sulla fatturazione per assicurarmi che tutto proceda come previsto.
Ti chiedo gentilmente di inviarmi l'ultima bolletta ricevuta (basta una foto o il PDF).
Puoi inviarmi la fattura, se preferisci, anche tramite mail all'indirizzo carchia1980@gmail.com
Resto a tua completa disposizione per qualsiasi necessità.

Cordiali saluti,
Michele Carchia
cell. 3292445561
email: carchia1980@gmail.com`;
    } else {
        // --- TESTO INFORMALE PER WHATSAPP / SMS ---
        return `Ciao ${client.firstName},

sono passati ${timeDescription} dall'attivazione del tuo contratto ${provider}.
Volevo fare un controllo sulla fattura per assicurarmi che sia tutto a posto.
Riesci a mandarmela? Basta una foto o il PDF.
Puoi inviarmi la fattura, se preferisci, anche tramite mail all'indirizzo carchia1980@gmail.com

A disposizione,
Michele Carchia`;
    }
  };

  const handleSendEmail = (item: CheckupItem) => {
    const client = clients.find(c => c.id === item.contract.clientId);
    if (!client || !client.email) {
        alert("Email cliente non trovata.");
        return;
    }
    const subject = encodeURIComponent(`Check-up Contratto ${item.contract.provider} - Controllo Fattura (${item.type})`);
    const body = encodeURIComponent(createMessage(item, client, true));
    window.open(`mailto:${client.email}?subject=${subject}&body=${body}`);
  };

  const handleSendWhatsApp = (item: CheckupItem) => {
      const client = clients.find(c => c.id === item.contract.clientId);
      if (!client || !client.mobilePhone) {
          alert("Cellulare cliente non trovato.");
          return;
      }
      const messageText = createMessage(item, client, false);
      const message = encodeURIComponent(messageText);
      
      let phone = client.mobilePhone.replace(/[^0-9]/g, '');
      if (!phone.startsWith('39') && phone.startsWith('3') && phone.length === 10) {
          phone = '39' + phone;
      }
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleSendSMS = (item: CheckupItem) => {
      const client = clients.find(c => c.id === item.contract.clientId);
      if (!client || !client.mobilePhone) {
          alert("Cellulare cliente non trovato.");
          return;
      }
      const messageText = createMessage(item, client, false);
      const message = encodeURIComponent(messageText);
      const phone = client.mobilePhone.replace(/[^0-9]/g, '');
      window.open(`sms:${phone}?body=${message}`, '_self');
  };

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg shadow-md animate-fade-in mb-6">
      <div className="flex">
        <div className="py-1">
          <DocumentSearchIcon className="h-6 w-6 text-blue-500 mr-4" />
        </div>
        <div className="flex-grow">
          <p className="font-bold text-blue-800">Check-up Periodici (T4: 6 mesi / T8: 10 mesi)</p>
          <p className="text-xs text-blue-600 mb-2">Controlli fattura calcolati dalla data stipula.</p>
          
          <div className="mt-2 text-sm text-blue-900">
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {items.sort((a,b) => a.daysDiff - b.daysDiff).map((item, idx) => (
                <li key={`${item.contract.id}-${idx}`} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-blue-200/50 last:border-b-0">
                  <div className="mb-2 sm:mb-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-2 ${item.type === 'T4' ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'}`}>
                        {item.type}
                    </span>
                    <span className="font-medium">{item.contract.provider}</span> - {getClientName(item.contract.clientId)}
                    <span className="ml-2 text-xs text-blue-600 block sm:inline">
                      {item.daysDiff === 0 ? 'Oggi' : item.daysDiff < 0 ? `Passato da ${Math.abs(item.daysDiff)} gg` : `Tra ${item.daysDiff} gg`}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1 flex-shrink-0 sm:ml-4">
                     <button 
                      onClick={() => handleSendWhatsApp(item)} 
                      className="p-1.5 text-green-600 rounded-full hover:bg-green-100 transition-colors"
                      title="WhatsApp Check-up"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleSendSMS(item)} 
                      className="p-1.5 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                      title="SMS Check-up"
                    >
                      <ChatIcon className="h-4 w-4" />
                    </button>
                     <button 
                      onClick={() => handleSendEmail(item)} 
                      className="p-1.5 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors"
                      title="Email Check-up"
                    >
                      <MailIcon className="h-4 w-4" />
                    </button>
                     <button 
                      onClick={() => onEdit(item.contract)} 
                      className="p-1.5 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"
                      title="Vedi Contratto"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => onDismiss(item)} 
                      className="p-1.5 text-red-500 rounded-full hover:bg-red-100 transition-colors"
                      title="Elimina notifica"
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

export default CheckupWidget;
