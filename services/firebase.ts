
import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

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
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// Esporta l'istanza di Firestore da usare in tutta l'app
// Utilizziamo initializeFirestore invece di getFirestore per passare opzioni aggiuntive
let db: Firestore;
try {
    if (app) {
        db = initializeFirestore(app, {
            ignoreUndefinedProperties: true
        });
    }
} catch (error) {
    console.error("Firestore initialization error:", error);
}

// Esporta l'istanza di Storage in modo sicuro
let storage: FirebaseStorage | null = null;
try {
    if (app) {
        storage = getStorage(app);
    }
} catch (error) {
    console.warn("Firebase Storage initialization failed. File upload features may be disabled.", error);
}

export { app, db, storage };
