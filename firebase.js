// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";   // ✅ 기존 RTDB
import { getFirestore } from "firebase/firestore"; // ✅ Firestore 추가
import { getStorage } from "firebase/storage";     // ✅ Storage 추가

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

// ✅ Realtime Database 인스턴스 (예전 코드 호환용)
const db = getDatabase(app);

// ✅ Firestore + Storage 인스턴스 (시그 이미지 관리용)
const firestore = getFirestore(app);
const storage = getStorage(app);

// ✅ 내보내기
export { app, db, firestore, storage };