
// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth'; // Si tu veux activer Auth plus tard

const firebaseConfig = {
  apiKey: "AIzaSyAqZgZsgJ7zxltCx9O--m9U076mRrF_50", // EXAMPLE - REPLACE WITH YOUR ACTUAL API KEY
  authDomain: "connecthost.firebaseapp.com",      // EXAMPLE - REPLACE
  projectId: "connecthost",                     // EXAMPLE - REPLACE
  storageBucket: "connecthost.appspot.com",     // EXAMPLE - REPLACE
  messagingSenderId: "812170721595",             // EXAMPLE - REPLACE
  appId: "1:812170721595:web:bb01e08919c8fb13a75f1e", // EXAMPLE - REPLACE
  // measurementId est optionnel, tu peux l’enlever ou le laisser vide
};

// --- CRITICAL CHECK FOR PLACEHOLDER CONFIG ---
if (firebaseConfig.apiKey === "AIzaSyAqZgZsgJ7zxltCx9O--m9U076mRrF_50" || firebaseConfig.projectId === "connecthost-placeholder") {
  console.error(
    "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n" +
    "CRITICAL FIREBASE CONFIGURATION ERROR:\n" +
    "You are using placeholder Firebase credentials in src/lib/firebase.ts.\n" +
    "Your application WILL NOT connect to Firebase services (like Firestore).\n" +
    "Please replace these placeholders with your actual Firebase project configuration.\n" +
    "You can find these in your Firebase project console settings.\n" +
    "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  );
  // Optionally, you could throw an error here to halt execution if desired,
  // but a prominent console error is often sufficient for development.
  // throw new Error("Placeholder Firebase configuration detected. Update src/lib/firebase.ts.");
}

// Initialisation unique de Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);
// const auth = getAuth(app); // Pour activer l’authentification plus tard

export { db /*, auth */ };

// Force deploy - 20 mai 2025
