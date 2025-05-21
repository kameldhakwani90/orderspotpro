
// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth'; // à activer plus tard si besoin

// Your web app's Firebase configuration (FROM USER INPUT)
// IMPORTANT: Ensure these values are your ACTUAL Firebase project credentials.
// The apiKey below (AIzaSyAZgZ95qTjzzXtICx9O--m9U706mrFR_50) is often a placeholder.
// If it is, your app WILL NOT connect to Firebase services correctly.
const firebaseConfig = {
  apiKey: "AIzaSyAZgZ95qTjzzXtICx9O--m9U706mrFR_50",
  authDomain: "connecthost.firebaseapp.com",
  projectId: "connecthost",
  storageBucket: "connecthost.firebasestorage.app",
  messagingSenderId: "812170721595",
  appId: "1:812170721595:web:bb01e08199c8fb31a75f1e"
};

// Log the projectId being used, especially important for client-side.
if (typeof window !== 'undefined') { // Only run this client-side check in the browser
  console.log("[Firebase Setup] Attempting to initialize Firebase with projectId:", firebaseConfig.projectId);
  // The explicit check for the placeholder API key has been removed as per user request.
  // However, if the apiKey above is a placeholder, Firebase connection will still fail.
}

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  if (typeof window !== 'undefined') {
    console.log("[Firebase Setup] Firebase app initialized successfully with provided config.");
  }
} else {
  app = getApp();
  if (typeof window !== 'undefined') {
    console.log("[Firebase Setup] Existing Firebase app retrieved.");
  }
}

// Export Firestore
const db = getFirestore(app);
export { db };
