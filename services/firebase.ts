import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";

// Configurazione dell'app web da Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyCA0RLA9AOXt-98TTLopnYpBKzxI-cM7Y4",
  authDomain: "crm-clienti-2fec8.firebaseapp.com",
  projectId: "crm-clienti-2fec8",
  storageBucket: "crm-clienti-2fec8.appspot.com",
  messagingSenderId: "427382088643",
  appId: "1:427382088643:web:cfbf1800ff48e07a665376"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Esporta l'istanza di Firestore da usare in tutta l'app
// Utilizziamo initializeFirestore invece di getFirestore per passare opzioni aggiuntive
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true
});