// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// 🔽🔽🔽 VERY IMPORTANT: REPLACE THE PLACEHOLDER VALUES BELOW 🔽🔽🔽
// Especially the apiKey. The current apiKey is a PUBLIC PLACEHOLDER.
const firebaseConfig = {
  apiKey: "AIzaSyAZgZ95qTjzzXtICx9O--m9U706mrFR_50", // <-- THIS IS LIKELY A PLACEHOLDER. REPLACE IT!
  authDomain: "connecthost.firebaseapp.com",
  projectId: "connecthost",
  storageBucket: "connecthost.firebasestorage.app",
  messagingSenderId: "812170721595",
  appId: "1:812170721595:web:bb01e08199c8fb31a75f1e"
};
// 🔼🔼🔼 VERY IMPORTANT: VERIFY AND REPLACE PLACEHOLDERS ABOVE 🔼🔼🔼

// Initialize Firebase
let app: FirebaseApp;

if (typeof window !== 'undefined') {
  console.log("[Firebase Setup] Initializing Firebase with the following configuration:");
  console.log("[Firebase Setup] Full Config:", JSON.parse(JSON.stringify(firebaseConfig))); // Log a deep copy
  console.log("[Firebase Setup] Project ID:", firebaseConfig.projectId);
  console.log("[Firebase Setup] API Key used:", firebaseConfig.apiKey);

  if (firebaseConfig.apiKey === "AIzaSyAZgZ95qTjzzXtICx9O--m9U706mrFR_50" || 
      !firebaseConfig.apiKey || 
      firebaseConfig.apiKey.includes("YOUR_") || 
      firebaseConfig.projectId.includes("YOUR_")) {
    console.error(
      "************************************************************************\n" +
      "CRITICAL Firebase Configuration Error:\n" +
      "The API Key or Project ID in firebaseConfig (src/lib/firebase.ts)\n" +
      "is a placeholder or is missing critical information.\n" +
      "Current API Key: " + firebaseConfig.apiKey + "\n" +
      "Current Project ID: " + firebaseConfig.projectId + "\n" +
      "Please ensure you have replaced ALL placeholder values with your\n" +
      "ACTUAL Firebase project configuration details from the Firebase console.\n" +
      "Firestore connection WILL FAIL with incorrect or placeholder values.\n" +
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
    // Re-throw or handle as appropriate, depending on how critical Firebase is at startup
    // For now, we'll let it proceed so db might be undefined, which other parts of the app should handle.
    // However, it's better to throw if Firebase is essential for the app to even start.
    // throw error; // Uncomment if Firebase must be initialized for the app to function at all.
  }
} else {
  app = getApp();
  if (typeof window !== 'undefined') {
    console.log("[Firebase Setup] Existing Firebase app retrieved.");
  }
}

// Export Firestore database instance
// Ensure 'app' is defined before calling getFirestore, handle cases where initialization might fail
let db: any; // Use 'any' to avoid type errors if app is undefined
if (app!) { // Check if app is initialized
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
