// src/lib/firebase.ts
// import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
// import { getFirestore, type Firestore } from 'firebase/firestore';

// THIS FILE IS CURRENTLY CONFIGURED FOR IN-MEMORY DATA.
// FIREBASE IS NOT INITIALIZED.

/*
// 🔽 REPLACE THESE PLACEHOLDERS WITH YOUR ACTUAL FIREBASE CONFIG WHEN READY 🔽
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Replace with your actual API key
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com", // Replace YOUR_PROJECT_ID
  projectId: "YOUR_PROJECT_ID", // Replace with your actual project ID
  storageBucket: "YOUR_PROJECT_ID.appspot.com", // Replace YOUR_PROJECT_ID
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace
  appId: "YOUR_APP_ID" // Replace
};
// 🔼 REPLACE THE PLACEHOLDERS ABOVE 🔼

let app: FirebaseApp;
let db: Firestore;

if (typeof window !== 'undefined') {
  console.log("[Firebase Setup] Attempting to initialize Firebase with projectId:", firebaseConfig.projectId);
  if (firebaseConfig.apiKey.includes("YOUR_") || firebaseConfig.projectId.includes("YOUR_")) {
    console.error(
      "************************************************************************\n" +
      "CRITICAL Firebase Configuration Warning:\n" +
      "The API Key or Project ID in firebaseConfig (src/lib/firebase.ts)\n" +
      "looks like a placeholder or is missing critical information.\n" +
      "Please ensure you have replaced ALL placeholder values with your\n" +
      "ACTUAL Firebase project configuration details from the Firebase console.\n" +
      "Firestore connection WILL FAIL with incorrect or placeholder values.\n" +
      "************************************************************************"
    );
  }
}

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    if (typeof window !== 'undefined') console.log("[Firebase Setup] Firebase app initialized successfully.");
  } else {
    app = getApp();
    if (typeof window !== 'undefined') console.log("[Firebase Setup] Existing Firebase app retrieved.");
  }
  db = getFirestore(app);
  if (typeof window !== 'undefined') console.log("[Firebase Setup] Firestore instance obtained successfully.");
} catch (error) {
  if (typeof window !== 'undefined') {
    console.error("[Firebase Setup] Error during Firebase initialization or Firestore access:", error);
  }
  // @ts-ignore
  db = null; // Ensure db is null if setup fails
}

export { db };
*/

// Export a null db when using in-memory data to satisfy imports if not removed elsewhere
export const db = null;

if (typeof window !== 'undefined') {
  console.warn("[Firebase Setup] firebase.ts is currently configured for IN-MEMORY DATA. Firebase and Firestore are NOT initialized.");
}
