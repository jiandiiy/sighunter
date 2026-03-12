// src/api/sigHunterBingoApi.js
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { firestore } from "../core/firebase";

const COLLECTION = "sigHunterBingo";

/**
 * Firestore 문서 참조
 * boardId, mode, size 조합으로 각기 다른 판을 분리 저장
 * 예: hunter-main-normal-5
 */
export const getBingoDocRef = (boardId, mode, size) =>
  doc(firestore, COLLECTION, `${boardId}-${mode}-${size}`);

/**
 * 시그헌터 빙고 상태 1회 로드 (초기 진입용)
 */
export async function loadSigHunterBingoState(boardId, mode, size) {
  const ref = getBingoDocRef(boardId, mode, size);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

/**
 * 시그헌터 빙고 상태 실시간 구독
 * onData: (state | null) => void
 * onError: (error) => void
 * return: () => unsubscribe
 */
export function subscribeSigHunterBingoState(
  boardId,
  mode,
  size,
  onData,
  onError
) {
  const ref = getBingoDocRef(boardId, mode, size);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) onData(snap.data());
      else onData(null);
    },
    (err) => {
      console.error("[Bingo] onSnapshot error:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * 시그헌터 빙고 상태 저장 (merge)
 * state: { cells, logs, lineOwners, playerColors, ... }
 */
export async function saveSigHunterBingoState(boardId, mode, size, state) {
  const ref = getBingoDocRef(boardId, mode, size);
  try {
    await setDoc(
      ref,
      {
        mode,
        size,
        ...state,
      },
      { merge: true }
    );
  } catch (e) {
    console.error("saveSigHunterBingoState failed", e);
  }
}