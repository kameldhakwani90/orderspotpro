
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuration using user-provided details
const firebaseConfig = {
  apiKey: "AIzaSyAejtOgaERXGgkaXJFjHXfjoIV-AA2Y2bA",
  authDomain: "connecthost.firebaseapp.com",
  projectId: "connecthost",
  storageBucket: "connecthost.firebasestorage.app",
  messagingSenderId: "812170721595",
  appId: "1:812170721595:web:a1cf3f800ee375312a75f1e"
};

let app: FirebaseApp;
let db: any; // Firestore database instance

if (typeof window !== 'undefined') {
  console.log("[Firebase Setup] Attempting to initialize Firebase with config:", JSON.parse(JSON.stringify(firebaseConfig)));
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
    // Fallback or rethrow, depending on how critical Firebase is at startup
    // For now, we'll let it proceed and db might remain undefined, causing issues downstream.
  }
} else {
  app = getApp();
  if (typeof window !== 'undefined') {
    console.log("[Firebase Setup] Existing Firebase app retrieved.");
  }
}

// @ts-ignore
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

export { db }; // Export db for use in other modules

if (typeof window !== 'undefined') {
  if (db) {
    console.log("[Firebase Setup] firebase.ts module loaded. Firestore is configured.");
  } else {
    console.warn("[Firebase Setup] firebase.ts module loaded, but Firestore (db) instance is NOT available. Check initialization logs.");
  }
}
