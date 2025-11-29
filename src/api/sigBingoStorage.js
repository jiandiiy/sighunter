// src/api/sigBingoStorage.js
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const BINGO_COLLECTION = "sigBingo";

// boardId 로 문서 구분 (bingo1, bingo2 등)
export async function loadSigBingoState(boardId = "default") {
  const ref = doc(db, BINGO_COLLECTION, boardId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data();
}

export async function saveSigBingoState(boardId = "default", state) {
  const ref = doc(db, BINGO_COLLECTION, boardId);
  await setDoc(ref, { ...state, updatedAt: Date.now() }, { merge: true });
}