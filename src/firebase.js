import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyACzQIprPX-tYOrealZCAIu-gmWxjN6BZY",
  authDomain: "tuviajest.firebaseapp.com",
  databaseURL: "https://tuviajest-default-rtdb.firebaseio.com",
  projectId: "tuviajest",
  storageBucket: "tuviajest.firebasestorage.app",
  messagingSenderId: "723862074013",
  appId: "1:723862074013:web:964ecd25b43fadabb49a74",
  measurementId: "G-ZWGB7WELSQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
