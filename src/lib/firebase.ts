
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
// import { getFirestore } from 'firebase/firestore'; // Commented out

// Configuration using user-provided details
const firebaseConfig = {
  apiKey: "AIzaSyAejtOgaERXGgkaXJFjHXfjoIV-AA2Y2bA", // This is the last key you provided
  authDomain: "connecthost.firebaseapp.com",
  projectId: "connecthost",
  storageBucket: "connecthost.firebasestorage.app",
  messagingSenderId: "812170721595",
  appId: "1:812170721595:web:a1cf3f800ee375312a75f1e" // This is the last appId you provided
};

let app: FirebaseApp | undefined;
// let db: any; // Firestore database instance - Commented out

if (typeof window !== 'undefined') {
  console.log("[Firebase Setup] Firebase initialization is currently BYPASSED for in-memory data testing.");
  console.log("[Firebase Setup] Current Firebase config loaded in code:", JSON.parse(JSON.stringify(firebaseConfig)));
  // We are not initializing the app or db to ensure in-memory data is used.
}

/*
// Original Firebase initialization - Commented out for in-memory data testing

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    if (typeof window !== 'undefined') {
      console.log("[Firebase Setup] Firebase app initialized successfully (but db connection might be deferred).");
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
    console.log("[Firebase Setup] Existing Firebase app retrieved (but db connection might be deferred).");
  }
}

if (app!) {
  try {
    // db = getFirestore(app); // Commented out
    if (typeof window !== 'undefined') {
      // console.log("[Firebase Setup] Firestore instance would be obtained here.");
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
*/

// export { db }; // Exporting 'db' is commented out
// To use Firestore again, uncomment the initializations above and this export.

if (typeof window !== 'undefined') {
  console.log("[Firebase Setup] firebase.ts module loaded. Firestore usage is currently INACTIVE.");
}
