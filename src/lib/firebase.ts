// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuration using user-provided details, with the new API key
const firebaseConfig = {
  apiKey: "AIzaSyAFc5A445t7gyhGraXM29qu69TSVmsNoRk", // New API Key
  authDomain: "connecthost.firebaseapp.com",
  projectId: "connecthost",
  storageBucket: "connecthost.firebasestorage.app",
  messagingSenderId: "812170721595",
  appId: "1:812170721595:web:bb01e08199c8fb31a75f1e"
};

let app: FirebaseApp;
let db: any; // Firestore database instance

if (typeof window !== 'undefined') {
  console.log("[Firebase Setup] Using Firebase config:", JSON.parse(JSON.stringify(firebaseConfig))); // Log the entire config for verification
  console.log("[Firebase Setup] Attempting to initialize Firebase with projectId:", firebaseConfig.projectId);

  // General placeholder check - this new key should not trigger this unless it also contains "YOUR_"
  if (!firebaseConfig.apiKey || 
      firebaseConfig.apiKey.includes("YOUR_") || 
      firebaseConfig.projectId.includes("YOUR_")) {
    console.error(
      "************************************************************************\n" +
      "CRITICAL Firebase Configuration Warning:\n" +
      "The API Key or Project ID in firebaseConfig (src/lib/firebase.ts)\n" +
      "looks like a placeholder or is missing critical information.\n" +
      "Please ensure you have replaced ALL placeholder values with your\n" +
      "ACTUAL Firebase project configuration details from the Firebase console.\n" +
      "Firestore connection WILL FAIL with incorrect or placeholder values.\n" +
      "Current API Key being used: " + firebaseConfig.apiKey + "\n" +
      "Current Project ID being used: " + firebaseConfig.projectId + "\n" +
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
