// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

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
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
