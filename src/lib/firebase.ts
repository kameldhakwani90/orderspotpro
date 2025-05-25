
// src/lib/firebase.ts
import type { FirebaseApp } from 'firebase/app'; // Keep type import for reference if needed later
// import { initializeApp, getApps, getApp } from 'firebase/app';
// import { getFirestore } from 'firebase/firestore';

// Configuration using user-provided details - COMMENTED OUT TO USE IN-MEMORY DATA
/*
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
  console.log("[Firebase Setup] Attempting to initialize Firebase with config (CURRENTLY DISABLED FOR IN-MEMORY DATA):", JSON.parse(JSON.stringify(firebaseConfig)));
}

if (!getApps().length) {
  try {
    // app = initializeApp(firebaseConfig);
    if (typeof window !== 'undefined') {
      // console.log("[Firebase Setup] Firebase app initialization would occur here.");
    }
  } catch (error) {
    if (typeof window !== 'undefined') {
      // console.error("[Firebase Setup] Error initializing Firebase app:", error);
    }
  }
} else {
  // app = getApp();
  if (typeof window !== 'undefined') {
    // console.log("[Firebase Setup] Existing Firebase app would be retrieved here.");
  }
}

// @ts-ignore
if (app!) {
  try {
    // db = getFirestore(app);
    if (typeof window !== 'undefined') {
      // console.log("[Firebase Setup] Firestore instance would be obtained here.");
    }
  } catch (error) {
    if (typeof window !== 'undefined') {
      // console.error("[Firebase Setup] Error obtaining Firestore instance:", error);
    }
  }
} else {
  if (typeof window !== 'undefined') {
    // console.warn("[Firebase Setup] Firebase app is not initialized. Firestore cannot be accessed.");
  }
}
*/

// Export a null db when using in-memory data to satisfy imports if not removed elsewhere
export const db = null;

if (typeof window !== 'undefined') {
  console.warn("[Firebase Setup] firebase.ts is currently configured for IN-MEMORY DATA. Firebase and Firestore are NOT initialized.");
}

