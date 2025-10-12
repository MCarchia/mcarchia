# CRM Clienti

Questa è un'applicazione CRM (Customer Relationship Management) semplice e potente per gestire i dati dei clienti. Utilizza Firebase Firestore come database cloud, garantendo che i tuoi dati siano sicuri, persistenti e accessibili da qualsiasi luogo.

## Come Funziona

L'applicazione si connette a un progetto Firebase per archiviare tutte le informazioni. Questo significa che:

-   **Configurazione Richiesta**: Per far funzionare l'app, devi configurare un progetto Firebase e inserire le tue chiavi di configurazione nel file `services/firebase.ts`.
-   **Dati nel Cloud**: I dati sono salvati su Firestore, quindi puoi accedervi da diversi dispositivi e browser.
-   **Scalabilità**: Sfrutta la potenza e la sicurezza di Google Cloud Platform.

## Avvio Rapido

1.  **Crea un Progetto Firebase**: Vai sulla [Console di Firebase](https://console.firebase.google.com/), crea un nuovo progetto e aggiungi un'applicazione web.
2.  **Configura Firestore**: All'interno del tuo progetto, attiva il database Firestore in modalità produzione.
3.  **Ottieni le Chiavi**: Copia l'oggetto di configurazione `firebaseConfig` fornito da Firebase.
4.  **Configura l'App**: Incolla l'oggetto `firebaseConfig` nel file `services/firebase.ts` di questo progetto.
5.  **Regole di Sicurezza**: Imposta le [Regole di Sicurezza di Firestore](https://firebase.google.com/docs/firestore/security/get-started) per proteggere i tuoi dati. Per iniziare, puoi usare `allow read, write: if true;`, ma **ricorda di configurare regole più sicure per la produzione** (es. basate sull'autenticazione).
6.  Apri il file `index.html` in un browser web moderno o fai il deploy del progetto.

Una volta configurato, puoi iniziare ad aggiungere e gestire i tuoi clienti e contratti!