
import { 
    collection, 
    getDocs, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc,
    query,
    where,
    getDoc,
    setDoc
} from "firebase/firestore";
import { db } from './firebase';
import type { Client, Contract } from '../types';

const initialProviders: string[] = [
  'Enel', 'Duferco', 'Edison', 'Lenergia', 'A2A', 
  'TIM', 'Vodafone', 'WindTre', 'Iliad', 'Fastweb'
];

const initialOperationTypes: string[] = [
    'Nuova Attivazione', 'Switch', 'Voltura', 'Subentro'
];

const clientsCollection = collection(db, "clients");
const contractsCollection = collection(db, "contracts");

// --- Clients ---

export const getAllClients = async (): Promise<Client[]> => {
  const querySnapshot = await getDocs(clientsCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
};

export const createClient = async (clientData: Omit<Client, 'id' | 'createdAt'>): Promise<Client> => {
    const newClientData = {
        ...clientData,
        createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(clientsCollection, newClientData);
    return { id: docRef.id, ...newClientData };
};

export const updateClient = async (updatedClient: Client): Promise<Client> => {
    const { id, ...clientData } = updatedClient;
    const clientDoc = doc(db, "clients", id);
    await updateDoc(clientDoc, clientData);
    return updatedClient;
};

export const deleteClient = async (clientId: string): Promise<void> => {
    // Prima elimina i contratti associati al cliente
    const contractsQuery = query(contractsCollection, where('clientId', '==', clientId));
    const contractsSnapshot = await getDocs(contractsQuery);
    
    const deletePromises = contractsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    // Poi elimina il cliente
    await deleteDoc(doc(db, "clients", clientId));
};

// --- Contracts ---

export const getAllContracts = async (): Promise<Contract[]> => {
  const querySnapshot = await getDocs(contractsCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contract));
};

export const createContract = async (contractData: Omit<Contract, 'id'>): Promise<Contract> => {
    const docRef = await addDoc(contractsCollection, contractData);
    return { id: docRef.id, ...contractData };
};

export const updateContract = async (updatedContract: Contract): Promise<Contract> => {
    const { id, ...contractData } = updatedContract;
    const contractDoc = doc(db, "contracts", id);
    await updateDoc(contractDoc, contractData);
    return updatedContract;
};

export const deleteContract = async (contractId: string): Promise<void> => {
    await deleteDoc(doc(db, "contracts", contractId));
};

// --- Providers ---

const providersDocRef = doc(db, 'config', 'providers');

export const getAllProviders = async (): Promise<string[]> => {
    const docSnap = await getDoc(providersDocRef);
    if (docSnap.exists() && docSnap.data().names) {
        return docSnap.data().names;
    } else {
        // Se il documento non esiste o è vuoto, lo inizializziamo
        const sortedInitialProviders = initialProviders.sort();
        await setDoc(providersDocRef, { names: sortedInitialProviders });
        return sortedInitialProviders;
    }
};

export const addProvider = async (newProvider: string): Promise<string[]> => {
    const providers = await getAllProviders();
    const trimmedProvider = newProvider.trim();
    if (trimmedProvider && !providers.some(p => p.toLowerCase() === trimmedProvider.toLowerCase())) {
        const updatedProviders = [...providers, trimmedProvider].sort();
        await setDoc(providersDocRef, { names: updatedProviders });
        return updatedProviders;
    }
    return providers;
};

export const deleteProvider = async (providerToDelete: string): Promise<string[]> => {
    const providers = await getAllProviders();
    const updatedProviders = providers.filter(p => p.toLowerCase() !== providerToDelete.toLowerCase());
    
    // Controlla se qualcosa è stato effettivamente rimosso prima di scrivere nel DB
    if (providers.length !== updatedProviders.length) {
        await setDoc(providersDocRef, { names: updatedProviders });
        return updatedProviders;
    }
    
    return providers;
};

// --- Operation Types (Switch, Voltura, Subentro...) ---

const operationTypesDocRef = doc(db, 'config', 'operation_types');

export const getAllOperationTypes = async (): Promise<string[]> => {
    const docSnap = await getDoc(operationTypesDocRef);
    if (docSnap.exists() && docSnap.data().names) {
        return docSnap.data().names;
    } else {
        await setDoc(operationTypesDocRef, { names: initialOperationTypes });
        return initialOperationTypes;
    }
};

export const addOperationType = async (newType: string): Promise<string[]> => {
    const types = await getAllOperationTypes();
    const trimmedType = newType.trim();
    if (trimmedType && !types.some(t => t.toLowerCase() === trimmedType.toLowerCase())) {
        const updatedTypes = [...types, trimmedType].sort();
        await setDoc(operationTypesDocRef, { names: updatedTypes });
        return updatedTypes;
    }
    return types;
};

export const deleteOperationType = async (typeToDelete: string): Promise<string[]> => {
    const types = await getAllOperationTypes();
    const updatedTypes = types.filter(t => t !== typeToDelete);
    
    if (types.length !== updatedTypes.length) {
        await setDoc(operationTypesDocRef, { names: updatedTypes });
        return updatedTypes;
    }
    return types;
};


// --- Credentials ---

const credentialsDocRef = doc(db, 'config', 'credentials');

export const getCredentials = async (): Promise<{username: string, password: string}> => {
    const docSnap = await getDoc(credentialsDocRef);
    if (docSnap.exists() && docSnap.data().username) {
        return docSnap.data() as {username: string, password: string};
    } else {
        const defaultCredentials = { username: 'admin', password: 'admin' };
        await setDoc(credentialsDocRef, defaultCredentials);
        return defaultCredentials;
    }
};

export const updateCredentials = async (newCreds: {username: string, password: string}): Promise<void> => {
    await setDoc(credentialsDocRef, newCreds);
};
