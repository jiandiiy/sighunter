// src/core/firebase.js
import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// ✅ Firebase 설정 (한 곳에서만 관리)
const firebaseConfig = {
   apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// ✅ 앱 초기화 (딱 1번만)
const app = initializeApp(firebaseConfig);

// ✅ Firestore (LongPolling 옵션 유지 - 기존 firebase.js 방식)
const firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

// ✅ Realtime DB
const rtdb = getDatabase(app);

// ✅ Storage
const storage = getStorage(app);

// ✅ db 별칭 (기존 코드 호환용 - db로 import 하는 곳도 있을 수 있어서)
const db = firestore;

export { app, firestore, db, rtdb, storage };