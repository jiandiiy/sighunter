// src/api/sigRemoteStorage.js
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firestore/firebase";

const SIG_COLLECTION = "sigHunter";   // 컬렉션 이름
const SIG_DOC_ID = "sharedState";     // 모두가 공유하는 하나의 문서

// 서버에서 상태 불러오기
export async function loadSigState() {
  const ref = doc(db, SIG_COLLECTION, SIG_DOC_ID);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return null; // 아직 저장된 게 없으면 null
  }

  return snap.data();
}

// 서버에 상태 저장하기
export async function saveSigState(state) {
  const ref = doc(db, SIG_COLLECTION, SIG_DOC_ID);

  const payload = {
    ...state,
    updatedAt: Date.now(),
  };

  await setDoc(ref, payload, { merge: true });
}
