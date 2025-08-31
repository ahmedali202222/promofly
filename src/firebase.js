// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import * as FFmpeg from "@ffmpeg/ffmpeg";
const { createFFmpeg, fetchFile } = FFmpeg;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MSID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ⬇️ pin to the same bucket (gs:// + bucket name)
const storage = getStorage(app, "gs://promptly-4f67d.firebasestorage.app");

console.log("Project:", app.options.projectId);
console.log("Bucket :", app.options.storageBucket); // should log promptly-4f67d.firebasestorage.app

export { app, db, auth, storage };
