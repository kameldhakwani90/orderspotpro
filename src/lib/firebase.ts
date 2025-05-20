
// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth'; // à activer plus tard si besoin

// ✅ Ta vraie configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAZgZ95qTjzzXtICx9O--m9U706mrFR_50",
  authDomain: "connecthost.firebaseapp.com",
  projectId: "connecthost",
  storageBucket: "connecthost.appspot.com",
  messagingSenderId: "812170721595",
  appId: "1:812170721595:web:bb01e08199c8fb31a75f1e"
};

// Log the projectId being used, especially important for client-side.
if (typeof window !== 'undefined') { // Only run this client-side check in the browser
  console.log("[Firebase Setup] Attempting to initialize Firebase with projectId:", firebaseConfig.projectId);
  if (firebaseConfig.apiKey === "AIzaSyAZgZ95qTjzzXtICx9O--m9U706mrFR_50" || !firebaseConfig.apiKey || firebaseConfig.apiKey.includes("YOUR_") || firebaseConfig.projectId.includes("YOUR_")) {
    console.error(
      "************************************************************************\n" +
      "CRITICAL Firebase Configuration Error:\n" +
      "The API Key or Project ID in firebaseConfig (src/lib/firebase.ts)\n" +
      "looks like a placeholder or is missing critical information.\n" +
      "Please ensure you have replaced ALL placeholder values with your\n" +
      "ACTUAL Firebase project configuration details from the Firebase console.\n" +
      "Firestore connection WILL FAIL with incorrect or placeholder values.\n" +
      "************************************************************************"
    );
  }
}

// ✅ Initialisation unique de Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  if (typeof window !== 'undefined') {
    console.log("[Firebase Setup] Firebase app initialized successfully.");
  }
} else {
  app = getApp();
  if (typeof window !== 'undefined') {
    console.log("[Firebase Setup] Existing Firebase app retrieved.");
  }
}

// ✅ Export de Firestore
const db = getFirestore(app);
export { db };
