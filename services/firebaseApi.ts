
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
    setDoc,
    orderBy
} from "firebase/firestore";
import { db } from './firebase';
import type { Client, Contract, Appointment, OfficeTask } from '../types';

const initialProviders: string[] = [
  'Enel', 'Duferco', 'Edison', 'Lenergia', 'A2A', 
  'TIM', 'Vodafone', 'WindTre', 'Iliad', 'Fastweb'
];

const initialOperationTypes: string[] = [
    'Nuova Attivazione', 'Switch', 'Voltura', 'Subentro'
];

const initialAppointmentStatuses: string[] = [
    'Da Fare', 'Completato', 'Annullato'
];

const clientsCollection = collection(db, "clients");
const contractsCollection = collection(db, "contracts");
const appointmentsCollection = collection(db, "appointments");
const officeTasksCollection = collection(db, "office_tasks");

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

// --- Appointments (Appuntamenti) ---

export const getAllAppointments = async (): Promise<Appointment[]> => {
    // Ordina per data, se possibile. Altrimenti ordiniamo lato client.
    const querySnapshot = await getDocs(appointmentsCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
};

export const createAppointment = async (apptData: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> => {
    const newAppt = {
        ...apptData,
        createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(appointmentsCollection, newAppt);
    return { id: docRef.id, ...newAppt };
};

export const updateAppointment = async (updatedAppt: Appointment): Promise<Appointment> => {
    const { id, ...data } = updatedAppt;
    const apptDoc = doc(db, "appointments", id);
    await updateDoc(apptDoc, data);
    return updatedAppt;
};

export const deleteAppointment = async (apptId: string): Promise<void> => {
    await deleteDoc(doc(db, "appointments", apptId));
};

// --- Office Tasks (Attività Ufficio) ---

export const getAllOfficeTasks = async (): Promise<OfficeTask[]> => {
    const querySnapshot = await getDocs(officeTasksCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OfficeTask));
};

export const createOfficeTask = async (title: string): Promise<OfficeTask> => {
    const newTask = {
        title,
        isCompleted: false,
        createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(officeTasksCollection, newTask);
    return { id: docRef.id, ...newTask };
};

export const updateOfficeTask = async (task: OfficeTask): Promise<OfficeTask> => {
    const { id, ...data } = task;
    const taskDoc = doc(db, "office_tasks", id);
    await updateDoc(taskDoc, data);
    return task;
};

export const deleteOfficeTask = async (taskId: string): Promise<void> => {
    await deleteDoc(doc(db, "office_tasks", taskId));
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

// --- Appointment Statuses (Da Fare, Completato...) ---

const appointmentStatusesDocRef = doc(db, 'config', 'appointment_statuses');

export const getAllAppointmentStatuses = async (): Promise<string[]> => {
    const docSnap = await getDoc(appointmentStatusesDocRef);
    if (docSnap.exists() && docSnap.data().names) {
        return docSnap.data().names;
    } else {
        await setDoc(appointmentStatusesDocRef, { names: initialAppointmentStatuses });
        return initialAppointmentStatuses;
    }
};

export const addAppointmentStatus = async (newStatus: string): Promise<string[]> => {
    const statuses = await getAllAppointmentStatuses();
    const trimmedStatus = newStatus.trim();
    if (trimmedStatus && !statuses.some(s => s.toLowerCase() === trimmedStatus.toLowerCase())) {
        // Keep "Da Fare" generally first if possible, but simplest is just append
        const updatedStatuses = [...statuses, trimmedStatus]; 
        await setDoc(appointmentStatusesDocRef, { names: updatedStatuses });
        return updatedStatuses;
    }
    return statuses;
};

export const deleteAppointmentStatus = async (statusToDelete: string): Promise<string[]> => {
    const statuses = await getAllAppointmentStatuses();
    const updatedStatuses = statuses.filter(s => s !== statusToDelete);
    
    if (statuses.length !== updatedStatuses.length) {
        await setDoc(appointmentStatusesDocRef, { names: updatedStatuses });
        return updatedStatuses;
    }
    return statuses;
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
