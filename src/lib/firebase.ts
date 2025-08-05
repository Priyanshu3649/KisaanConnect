// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, CACHE_SIZE_UNLIMITED, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA884n274a1fAKE7p-b34v69yA8sc_26oQ",
  authDomain: "kisaanconnect-c10e1.firebaseapp.com",
  projectId: "kisaanconnect-c10e1",
  storageBucket: "kisaanconnect-c10e1.appspot.com",
  messagingSenderId: "190889003219",
  appId: "1:190889003219:web:65a1282f1fb25121b151e3",
  measurementId: "G-9X8EWN6T23"
};


// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth = getAuth(app);
export const storage = getStorage(app);

// Initialize Firestore with offline persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  })
});
