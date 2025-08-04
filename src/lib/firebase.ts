// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCtzyqEJg1BR3fxaZehy9V72QnHTEpnX1o",
  authDomain: "kisaanconnect-c10e1.firebaseapp.com",
  projectId: "kisaanconnect-c10e1",
  storageBucket: "kisaanconnect-c10e1.appspot.com",
  messagingSenderId: "190889003219",
  appId: "1:190889003219:web:28055d1f7702913a3eec26",
  measurementId: "G-ZR5FK6TJ5G"
};


// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);