
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration based on your screenshot
const firebaseConfig = {
  apiKey: "AIzaSyAZgZ95qTjzzXtICx9O--m9U706mrFR_50", // From your screenshot
  authDomain: "connecthost.firebaseapp.com",
  projectId: "connecthost",
  storageBucket: "connecthost.firebasestorage.app",
  messagingSenderId: "812170721595",
  appId: "1:812170721595:web:bb01e08199c8fb31a75f1e"
};

// Initialize Firebase
let app: FirebaseApp;

if (typeof window !== 'undefined') {
  console.log("[Firebase Setup] Using Firebase config:", JSON.parse(JSON.stringify(firebaseConfig)));
  console.log("[Firebase Setup] Attempting to initialize Firebase with projectId:", firebaseConfig.projectId);
  // Check if the API key is the known placeholder
  if (firebaseConfig.apiKey === "AIzaSyAZgZ95qTjzzXtICx9O--m9U706mrFR_50") {
    console.error(
      "************************************************************************\n" +
      "CRITICAL Firebase Configuration Error:\n" +
      "The API Key in firebaseConfig ('" + firebaseConfig.apiKey + "') \n" +
      "is a known placeholder value.\n" +
      "Your application WILL NOT connect to Firebase services correctly.\n" +
      "Please go to your Firebase project console (Project settings > General > Your apps > SDK setup and configuration) \n" +
      "and ensure you are using the ACTUAL, UNIQUE API key for your project.\n" +
      "If your Firebase console truly shows this placeholder as your API key,\n" +
      "there might be an issue with your Firebase project setup itself.\n" +
      "************************************************************************"
    );
  }
}

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    if (typeof window !== 'undefined') {
      console.log("[Firebase Setup] Firebase app initialized successfully.");
    }
  } catch (error) {
    if (typeof window !== 'undefined') {
      console.error("[Firebase Setup] Error initializing Firebase app:", error);
      console.error("[Firebase Setup] Used config:", JSON.parse(JSON.stringify(firebaseConfig)));
    }
  }
} else {
  app = getApp();
  if (typeof window !== 'undefined') {
    console.log("[Firebase Setup] Existing Firebase app retrieved.");
  }
}

let db: any; 
if (app!) { 
  try {
    db = getFirestore(app);
    if (typeof window !== 'undefined') {
      console.log("[Firebase Setup] Firestore instance obtained successfully.");
    }
  } catch (error) {
    if (typeof window !== 'undefined') {
      console.error("[Firebase Setup] Error obtaining Firestore instance:", error);
    }
  }
} else {
  if (typeof window !== 'undefined') {
    console.error("[Firebase Setup] Firebase app was not initialized. Firestore cannot be accessed.");
  }
}

export { db };
if (typeof window !== 'undefined') {
  console.log("[Firebase Setup] firebase.ts module loaded.");
}
