import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "../firebase";   // ✅ 변경

const BINGO_COLLECTION = "sigBingo";

// boardId 로 문서 구분 (bingo1, bingo2 등)
export async function loadSigBingoState(boardId = "default") {
  const ref = doc(firestore, BINGO_COLLECTION, boardId);   // ✅ 변경
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data();
}

export async function saveSigBingoState(boardId = "default", state) {
  const ref = doc(firestore, BINGO_COLLECTION, boardId);   // ✅ 변경
  await setDoc(ref, { ...state, updatedAt: Date.now() }, { merge: true });
}