// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA2sT5L272d8X_H2J1Am1L8b7i8eGf0p3c",
  authDomain: "dev-prototyper-genkit.firebaseapp.com",
  projectId: "dev-prototyper-genkit",
  storageBucket: "dev-prototyper-genkit.appspot.com",
  messagingSenderId: "283627234907",
  appId: "1:283627234907:web:8c67f81b16999b2447e0ab",
  measurementId: "G-R9B52BDH9N"
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
