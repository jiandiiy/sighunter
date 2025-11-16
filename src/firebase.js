// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 🔹 아까 Firebase 콘솔에서 복사한 내용 붙여 넣기
const firebaseConfig = {
  apiKey: "AIzaSyDtSFww9PH2CEMJz9caYvN__C_SXmyxr0w",
  authDomain: "sig-hunter.firebaseapp.com",
  projectId: "sig-hunter",
  storageBucket: "sig-hunter.firebasestorage.app",
  messagingSenderId: "702524786134",
  appId: "1:702524786134:web:259a88e3cd473531571077",
  measurementId: "G-3VDF4EWY40"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);