// ✅ FIXED - src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAnDkKDKwjg1Jp_sitm6nqX0P-sIQXu8o0",
  authDomain: "promptly-4f67d.firebaseapp.com",
  projectId: "promptly-4f67d",
  storageBucket: "promptly-4f67d.appspot.com",
  messagingSenderId: "1071226706698",
  appId: "1:1071226706698:web:8a983cd0702eade3fa78f3",
  measurementId: "G-59801ZHM6L",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); // ✅ this is the instance you want

// ✅ Export the instance, not the function
export { app, db, auth, storage };


// Optional: Initialize Analytics (uncomment to enable)
// let analytics;
// isSupported().then((supported) => {
//   if (supported) {
//     analytics = getAnalytics(app);
//   }
// });

 
