
import type { Client, Contract } from '../types';
import * as firebaseApi from './firebaseApi';

// All functions now call firebaseApi, which interacts with Firestore.
// The async nature is now real, as we are making network requests.

// --- Clients API ---
export const getAllClients = async (): Promise<Client[]> => {
    return firebaseApi.getAllClients();
};

export const createClient = async (clientData: Omit<Client, 'id' | 'createdAt'>): Promise<Client> => {
    return firebaseApi.createClient(clientData);
};

export const updateClient = async (updatedClient: Client): Promise<Client> => {
    return firebaseApi.updateClient(updatedClient);
};

export const deleteClient = async (clientId: string): Promise<void> => {
    return firebaseApi.deleteClient(clientId);
};

// --- Contracts API ---
export const getAllContracts = async (): Promise<Contract[]> => {
    return firebaseApi.getAllContracts();
};

export const createContract = async (contractData: Omit<Contract, 'id'>): Promise<Contract> => {
    return firebaseApi.createContract(contractData);
};

export const updateContract = async (updatedContract: Contract): Promise<Contract> => {
    return firebaseApi.updateContract(updatedContract);
};

export const deleteContract = async (contractId: string): Promise<void> => {
    return firebaseApi.deleteContract(contractId);
};

// --- Providers API ---
export const getAllProviders = async (): Promise<string[]> => {
    return firebaseApi.getAllProviders();
};

export const addProvider = async (newProvider: string): Promise<string[]> => {
    return firebaseApi.addProvider(newProvider);
};

export const deleteProvider = async (providerToDelete: string): Promise<string[]> => {
    return firebaseApi.deleteProvider(providerToDelete);
};

// --- Operation Types API (Switch, Voltura...) ---
export const getAllOperationTypes = async (): Promise<string[]> => {
    return firebaseApi.getAllOperationTypes();
};

export const addOperationType = async (newType: string): Promise<string[]> => {
    return firebaseApi.addOperationType(newType);
};

export const deleteOperationType = async (typeToDelete: string): Promise<string[]> => {
    return firebaseApi.deleteOperationType(typeToDelete);
};


// --- Credentials API ---
export const getCredentials = async (): Promise<{username: string, password: string}> => {
    return firebaseApi.getCredentials();
};

export const updateCredentials = async (newCreds: {username: string, password: string}): Promise<void> => {
    return firebaseApi.updateCredentials(newCreds);
};
