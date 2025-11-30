
export enum ContractType {
  Electricity = 'electricity',
  Gas = 'gas',
  Telephony = 'telephony',
}

export interface Contract {
  id: string;
  clientId: string;
  type: string; // 'electricity' | 'gas' | 'telephony'
  operationType?: string; // Nuova Attivazione, Switch, Voltura, Subentro
  customerType?: 'residential' | 'business';
  provider: string;
  contractCode: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  supplyAddress?: Address;
  commission?: number;
  isPaid?: boolean;
  // Campi specifici per l'energia
  pod?: string;
  kw?: number;   // Potenza impegnata
  volt?: string; // Voltaggio
  // Campi specifici per il gas
  pdr?: string;
  remi?: string; // Codice Remi
  // Campi comuni energia/gas
  meterSerial?: string; // Matricola Contatore
  // Campi specifici per la telefonia
  fiberType?: string;
}

export interface Address {
  street?: string; // Via e Civico
  zipCode?: string; // CAP
  city?: string; // Comune
  state?: string; // Provincia
  country?: string; // Nazione
}

export interface Iban {
  value: string;
  type: 'personal' | 'business';
}

export interface ClientDocument {
  name: string;
  url: string;
  type: string; // mime type
  uploadedAt: string;
  path: string; // Storage path for deletion
}

export interface Client {
  id: string;
  firstName: string;
  lastName:string;
  ragioneSociale?: string;
  email: string;
  codiceFiscale?: string;
  pIva?: string;
  mobilePhone?: string;
  ibans?: Iban[];
  legalAddress?: Address;
  residentialAddress?: Address;
  notes?: string;
  documents?: ClientDocument[];
  createdAt: string;
}

export interface Appointment {
  id: string;
  clientName: string; // Nome libero (prospect o cliente esistente)
  provider: string;   // Compagnia proposta
  date: string;       // Data visita (ISO string YYYY-MM-DD o datetime)
  time?: string;      // Ora opzionale
  location?: string;  // Luogo dell'appuntamento (indirizzo)
  notes?: string;
  status: string;     // Dynamic status (e.g., 'Da Fare', 'Completato', 'Annullato')
  createdAt: string;
}

export interface OfficeTask {
  id: string;
  title: string; // Es. "Voltura Mario Rossi"
  isCompleted: boolean;
  createdAt: string;
}
