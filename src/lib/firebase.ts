// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, CACHE_SIZE_UNLIMITED, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCQCpE-lAJNmaiI7-vLz_ZZdF4BXYaSgxc",
  authDomain: "kisaanconnect-df948.firebaseapp.com",
  projectId: "kisaanconnect-df948",
  storageBucket: "kisaanconnect-df948.appspot.com",
  messagingSenderId: "391960082221",
  appId: "1:391960082221:web:030486459ee2e61c9f85a4",
  measurementId: "G-59CNGYXGRN"
};


// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);
