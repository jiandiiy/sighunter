// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDtSFww9PH2CEMJz9caYvN__C_SXmyxr0w",
  authDomain: "sig-hunter.firebaseapp.com",
  projectId: "sig-hunter",
  storageBucket: "sig-hunter.firebasestorage.app",
  messagingSenderId: "702524786134",
  appId: "1:702524786134:web:259a88e3cd473531571077",
  measurementId: "G-3VDF4EWY40",
};

const app = initializeApp(firebaseConfig);

// ✅ Realtime Database (HP 배틀 등)
const rtdb = getDatabase(app);

// ✅ Firestore (시그 카드 상태 저장용)
const firestore = getFirestore(app);

export { app, rtdb, firestore };