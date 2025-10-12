export enum ContractType {
  Electricity = 'electricity',
  Gas = 'gas',
  Telephony = 'telephony',
}

export interface Contract {
  id: string;
  clientId: string;
  type: ContractType;
  provider: string;
  contractCode: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  supplyAddress?: Address;
  commission?: number;
  // Campi specifici per l'energia
  pod?: string;
  pdr?: string;
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

export interface Client {
  id: string;
  firstName: string;
  lastName:string;
  email: string;
  codiceFiscale?: string;
  mobilePhone?: string;
  ibans?: Iban[];
  legalAddress?: Address;
  residentialAddress?: Address;
  notes?: string;
  createdAt: string;
}
