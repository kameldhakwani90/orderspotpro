// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth'; // Si tu veux activer Auth plus tard

const firebaseConfig = {
  apiKey: "AIzaSyAqZgZsgJ7zxltCx9O--m9U076mRrF_50",
  authDomain: "connecthost.firebaseapp.com",
  projectId: "connecthost",
  storageBucket: "connecthost.appspot.com",
  messagingSenderId: "812170721595",
  appId: "1:812170721595:web:bb01e08919c8fb13a75f1e",
  // measurementId est optionnel, tu peux l’enlever ou le laisser vide
};

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

