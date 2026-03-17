// src/core/firebase.js

import { initializeApp }        from "firebase/app";
import { initializeFirestore }  from "firebase/firestore";
import { getDatabase }          from "firebase/database";
import { getStorage }           from "firebase/storage";

// ✅ Firebase 설정 (CRA 환경변수 사용 - process.env.REACT_APP_)
const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

// ── 개발 중 누락된 환경변수 체크 ──────────────────────────────
if (process.env.NODE_ENV === "development") {
  const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    console.error(
      "❌ [Firebase] 누락된 환경변수:", missing,
      "\n👉 프로젝트 루트의 .env.local 파일을 확인하세요."
    );
  } else {
    console.log("✅ [Firebase] 환경변수 모두 정상 로드됨");
  }
}

// ✅ 앱 초기화 (딱 1번만)
const app = initializeApp(firebaseConfig);

// ✅ Firestore (LongPolling 옵션 유지 - 기존 방식 그대로)
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