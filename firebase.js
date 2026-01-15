// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // ✅ RTDB

const firebaseConfig = {
  apiKey: "AIzaSyDtSFww9PH2CEMJz9caYvN__C_SXmyxr0w",
  authDomain: "sig-hunter.firebaseapp.com",
  projectId: "sig-hunter",
  storageBucket: "sig-hunter.firebasestorage.app",
  messagingSenderId: "702524786134",
  appId: "1:702524786134:web:259a88e3cd473531571077",
  measurementId: "G-3VDF4EWY40",
};

// 앱 초기화
const app = initializeApp(firebaseConfig);

// ✅ Realtime Database 인스턴스
const db = getDatabase(app);

// ✅ 이걸로만 사용
export { app, db };