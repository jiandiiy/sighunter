// src/api/sigBingoStorage.js
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "../firebase";   // ✅ 반드시 firestore 로

const BINGO_COLLECTION = "sigBingo";

// boardId 로 문서 구분 (bingo1, bingo2 등)
export async function loadSigBingoState(boardId = "default") {
  const ref = doc(firestore, BINGO_COLLECTION, boardId);   // ✅ 1번째 인자 firestore
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data();
}

export async function saveSigBingoState(boardId = "default", state) {
  const ref = doc(firestore, BINGO_COLLECTION, boardId);   // ✅ 동일
  await setDoc(ref, { ...state, updatedAt: Date.now() }, { merge: true });
}