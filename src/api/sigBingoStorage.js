// src/api/sigBingoStorage.js
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "../firebase";

const BINGO_COLLECTION = "sigBingo";

console.log("[BINGO] *** THIS IS THE REAL sigBingoStorage.js ***");

// 공통: Firestore 호출을 타임아웃으로 감싸는 헬퍼
async function withTimeout(promise, ms, label) {
  let timeoutId;
  const timeoutPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn(
        `[sigBingoStorage] ${label} TIMEOUT after ${ms}ms – fallback to null`
      );
      resolve(null);
    }, ms);
  });

  // race: 먼저 끝나는 쪽이 승리
  const result = await Promise.race([promise, timeoutPromise]);
  clearTimeout(timeoutId);
  return result;
}

export async function loadSigBingoState(boardId = "default") {
  try {
    console.log("[sigBingoStorage] loadSigBingoState START", { boardId });

    // Firestore 인스턴스 안전 체크
    if (!firestore) {
      console.error(
        "[sigBingoStorage] loadSigBingoState: firestore NOT initialized"
      );
      return null;
    }

    const ref = doc(firestore, BINGO_COLLECTION, boardId);
    console.log("[sigBingoStorage] doc ref created", {
      boardId,
      refPath: ref.path,
    });

    // getDoc 에 1000ms 타임아웃 적용
    const snap = await withTimeout(
      getDoc(ref),
      1000,
      `loadSigBingoState getDoc(${boardId})`
    );

    // 타임아웃으로 null 들어오는 경우
    if (!snap) {
      console.warn(
        "[sigBingoStorage] loadSigBingoState: snap is null (timeout or error)"
      );
      return null;
    }

    console.log("[sigBingoStorage] after getDoc", {
      boardId,
      exists: snap.exists(),
    });

    if (!snap.exists()) return null;

    const data = snap.data();
    console.log("[sigBingoStorage] loadSigBingoState OK", {
      boardId,
      hasData: !!data,
    });

    return data;
  } catch (e) {
    console.error("[sigBingoStorage] loadSigBingoState error", {
      boardId,
      error: e,
    });
    return null;
  }
}

export async function saveSigBingoState(boardId = "default", state) {
  try {
    if (!firestore) {
      console.error(
        "[sigBingoStorage] saveSigBingoState: firestore NOT initialized"
      );
      return;
    }

    const ref = doc(firestore, BINGO_COLLECTION, boardId);
    await setDoc(ref, { ...state, updatedAt: Date.now() }, { merge: true });
  } catch (e) {
    console.error("[sigBingoStorage] saveSigBingoState error", {
      boardId,
      error: e,
    });
  }
}