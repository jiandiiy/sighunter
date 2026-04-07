// src/api/sigBingoStorage.js
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore as db } from "../firestore/firebase"; // 🔥 firestore → db로 변경

const BINGO_COLLECTION = "sigBingoStates"; // 🔥 컬렉션명 통일

console.log("[sigBingoStorage] *** 초기화 완료 ***");

// 🔧 Firestore 호출 타임아웃 헬퍼
async function withTimeout(promise, ms, label) {
  let timeoutId;
  const timeoutPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn(
        `[sigBingoStorage] ${label} TIMEOUT (${ms}ms) - null 반환`
      );
      resolve(null);
    }, ms);
  });

  const result = await Promise.race([promise, timeoutPromise]);
  clearTimeout(timeoutId);
  return result;
}

/**
 * 🎲 빙고 상태 불러오기 (Firestore + localStorage 폴백)
 */
export async function loadSigBingoState(boardId = "default") {
  try {
    console.log("[sigBingoStorage] 불러오기 시작", { boardId });

    // 🔥 Firestore 인스턴스 확인
    if (!db) {
      console.error("[sigBingoStorage] Firestore 초기화 안 됨");
      return loadFromLocalStorage(boardId);
    }

    // 🔥 Firestore 문서 참조
    const ref = doc(db, BINGO_COLLECTION, boardId);
    console.log("[sigBingoStorage] Firestore 경로:", ref.path);

    // 🔥 타임아웃 적용 (3초)
    const snap = await withTimeout(
      getDoc(ref),
      3000,
      `getDoc(${boardId})`
    );

    // 타임아웃 발생 시
    if (!snap) {
      console.warn("[sigBingoStorage] Firestore 타임아웃, localStorage 사용");
      return loadFromLocalStorage(boardId);
    }

    console.log("[sigBingoStorage] Firestore 응답:", {
      exists: snap.exists(),
    });

    // 🔥 데이터 존재 시
    if (snap.exists()) {
      const data = snap.data();
      console.log("[sigBingoStorage] Firestore 데이터 로드 완료", {
        mode: data.mode,
        cardCount: data.cards?.length,
      });
      
      // localStorage에도 백업
      saveToLocalStorage(boardId, data);
      
      return data;
    }

    // 🔥 Firestore에 없으면 localStorage 확인
    console.log("[sigBingoStorage] Firestore 데이터 없음, localStorage 확인");
    return loadFromLocalStorage(boardId);

  } catch (error) {
    console.error("[sigBingoStorage] Firestore 로드 에러:", error);
    return loadFromLocalStorage(boardId);
  }
}

/**
 * 🎲 빙고 상태 저장 (Firestore + localStorage)
 */
export async function saveSigBingoState(boardId = "default", state) {
  try {
    console.log("[sigBingoStorage] 저장 시작", { boardId, state });

    // 🔥 localStorage 먼저 저장 (즉시 반영)
    saveToLocalStorage(boardId, state);

    // 🔥 Firestore 확인
    if (!db) {
      console.warn("[sigBingoStorage] Firestore 초기화 안 됨, localStorage만 저장");
      return;
    }

    // 🔥 Firestore 저장
    const ref = doc(db, BINGO_COLLECTION, boardId);
    
    await withTimeout(
      setDoc(ref, {
        ...state,
        updatedAt: new Date().toISOString(),
        timestamp: Date.now(),
      }, { merge: true }),
      3000,
      `setDoc(${boardId})`
    );

    console.log("[sigBingoStorage] Firestore 저장 완료");

  } catch (error) {
    console.error("[sigBingoStorage] Firestore 저장 에러:", error);
    // localStorage는 이미 저장됨
  }
}

/* -------------------------------------------------------------------------- */
/* 🔧 localStorage 헬퍼 함수                                                  */
/* -------------------------------------------------------------------------- */

function loadFromLocalStorage(boardId) {
  try {
    if (typeof window === "undefined") return null;

    const key = `sigBingo-${boardId}`;
    const stored = window.localStorage.getItem(key);

    if (!stored) {
      console.log("[sigBingoStorage] localStorage 데이터 없음");
      return null;
    }

    const data = JSON.parse(stored);
    console.log("[sigBingoStorage] localStorage 데이터 로드 완료", {
      mode: data.mode,
      cardCount: data.cards?.length,
    });

    return data;
  } catch (error) {
    console.error("[sigBingoStorage] localStorage 로드 에러:", error);
    return null;
  }
}

function saveToLocalStorage(boardId, state) {
  try {
    if (typeof window === "undefined") return;

    const key = `sigBingo-${boardId}`;
    window.localStorage.setItem(key, JSON.stringify(state));
    
    console.log("[sigBingoStorage] localStorage 저장 완료");
  } catch (error) {
    console.error("[sigBingoStorage] localStorage 저장 에러:", error);
  }
}