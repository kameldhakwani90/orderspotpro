// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuration based on user's provided details
const firebaseConfig = {
  apiKey: "AIzaSyAZgZ95qTjzzXtICx9O--m9U706mrFR_50", // As provided by user
  authDomain: "connecthost.firebaseapp.com",
  projectId: "connecthost",
  storageBucket: "connecthost.firebasestorage.app", // As provided by user
  messagingSenderId: "812170721595",
  appId: "1:812170721595:web:bb01e08199c8fb31a75f1e"
};

let app: FirebaseApp;
let db: any; // Firestore database instance

if (typeof window !== 'undefined') {
  console.log("[Firebase Setup] Using Firebase config:", JSON.parse(JSON.stringify(firebaseConfig)));
  console.log("[Firebase Setup] Attempting to initialize Firebase with projectId:", firebaseConfig.projectId);

  // Adjusted condition: Removed the direct check for "AIzaSyAZgZ95qTjzzXtICx9O--m9U706mrFR_50"
  // Kept general placeholder checks like "YOUR_..."
  if (!firebaseConfig.apiKey ||
      firebaseConfig.apiKey.includes("YOUR_API_KEY") || // Check for common placeholder patterns
      !firebaseConfig.projectId ||
      firebaseConfig.projectId.includes("YOUR_PROJECT_ID")) {
    console.error(
      "************************************************************************\n" +
      "CRITICAL Firebase Configuration Warning:\n" +
      "The API Key or Project ID in firebaseConfig (src/lib/firebase.ts)\n" +
      "might be a placeholder or missing critical information.\n" +
      "Please ensure you have verified ALL configuration values with your\n" +
      "ACTUAL Firebase project configuration details from the Firebase console.\n" +
      "Firestore connection may FAIL with incorrect or placeholder values.\n" +
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
    // Rethrow or handle as appropriate if initialization fails critically
  }
} else {
  app = getApp();
  if (typeof window !== 'undefined') {
    console.log("[Firebase Setup] Existing Firebase app retrieved.");
  }
}

// Ensure app is defined before calling getFirestore
if (app!) { // The non-null assertion operator assumes 'app' will be defined.
  try {
    db = getFirestore(app);
    if (typeof window !== 'undefined') {
      console.log("[Firebase Setup] Firestore instance obtained successfully.");
    }
  } catch (error) {
    if (typeof window !== 'undefined') {
      console.error("[Firebase Setup] Error obtaining Firestore instance:", error);
    }
    // db will remain undefined, subsequent calls might fail
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
