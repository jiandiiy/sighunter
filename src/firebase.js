// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDtSFww9PH2CEMJz9caYvN__C_SXmyxr0w",
  authDomain: "sig-hunter.firebaseapp.com",
  projectId: "sig-hunter",
  storageBucket: "sig-hunter.firebasestorage.app",
  messagingSenderId: "702524786134",
  appId: "1:702524786134:web:259a88e3cd473531571077",
  measurementId: "G-3VDF4EWY40",
};

// ✅ Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// ✅ 인스턴스 생성 (순서 중요 X, 하지만 db 별칭은 밑에서)
const firestore = getFirestore(app);   // Firestore
const rtdb = getDatabase(app);         // Realtime DB
const storage = getStorage(app);       // Storage

// ✅ db 별칭은 firestore 생성 *이후*에
const db = firestore;

export { app, firestore, rtdb, storage, db };