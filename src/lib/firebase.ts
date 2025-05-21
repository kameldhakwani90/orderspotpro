// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration (FROM USER INPUT)
// IMPORTANT: If the apiKey below is a placeholder, Firebase connection WILL FAIL.
const firebaseConfig = {
  apiKey: "AIzaSyAZgZ95qTjzzXtICx9O--m9U706mrFR_50",
  authDomain: "connecthost.firebaseapp.com",
  projectId: "connecthost",
  storageBucket: "connecthost.firebasestorage.app",
  messagingSenderId: "812170721595",
  appId: "1:812170721595:web:bb01e08199c8fb31a75f1e"
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  if (typeof window !== 'undefined') {
    console.log("[Firebase Setup] Firebase app initialized.");
  }
} else {
  app = getApp();
  if (typeof window !== 'undefined') {
    console.log("[Firebase Setup] Existing Firebase app retrieved.");
  }
}

// Export Firestore database instance
const db = getFirestore(app);
export { db };
