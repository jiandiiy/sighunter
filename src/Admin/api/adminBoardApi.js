// src/shared/api/adminBoardApi.js
import {
  onSnapshot,
  doc,
  collection,
  setDoc,
  getDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../resources/firestore/firebase";
import { storage } from "../../resources/firestore/firebase";
import { ref, getDownloadURL } from "firebase/storage";

import { listSigResourceMeta } from "../../resources/firestore/sigGameResourceMeta";

// 기본 빙고 보드 설정 (config 문서 없을 때 fallback)
const DEFAULT_BINGO_CONFIG = {
  rows: 5,
  cols: 5,
  name: "시그헌터 메인 보드",
};

// 기본 플립 보드 설정
const DEFAULT_FLIP_CONFIG = {
  rows: 4,
  cols: 6,
  name: "시그헌터 플립",
  flipMode: "single",
};

/**
 * [Bingo] 보드 config + cells를 구독하는 함수
 *
 * @param {string} boardId
 * @param {{
 *   onConfig?: (config: any) => void,
 *   onCells?: (cells: Record<string, any>) => void,
 *   onError?: (error: unknown) => void,
 * }} handlers
 * @returns {() => void} unsubscribe 함수
 */
export function subscribeBoard(boardId, { onConfig, onCells, onError } = {}) {
  const boardRef = doc(db, "sigHunterBingoBoards", boardId);
  const cellsRef = collection(boardRef, "cells");

  let unsubCells;

  (async () => {
    try {
      // 1) config 문서 읽기
      const snap = await getDoc(boardRef);
      if (snap.exists()) {
        const data = snap.data();
        const nextConfig = data.config
          ? { ...DEFAULT_BINGO_CONFIG, ...data.config }
          : DEFAULT_BINGO_CONFIG;

        onConfig?.(nextConfig);
      } else {
        onConfig?.(DEFAULT_BINGO_CONFIG);
      }

      // 2) cells 실시간 구독
      unsubCells = onSnapshot(
        cellsRef,
        (qs) => {
          const map = {};
          qs.forEach((d) => {
            map[d.id] = d.data();
          });
          onCells?.(map);
        },
        (error) => {
          console.error("[adminBoardApi] bingo cells onSnapshot error", error);
          onError?.(error);
        }
      );
    } catch (e) {
      console.error("[adminBoardApi] subscribeBoard error", e);
      onError?.(e);
    }
  })();

  return () => {
    if (unsubCells) {
      unsubCells();
    }
  };
}

/**
 * [Bingo] 특정 보드의 특정 칸에 이미지/메타데이터를 설정
 *
 * @param {string} boardId
 * @param {string} cellId
 * @param {{ imageId: string; imageUrl: string; title?: string }} payload
 */
export async function updateBoardCell(boardId, cellId, payload) {
  const boardRef = doc(db, "sigHunterBingoBoards", boardId);
  const cellRef = doc(boardRef, "cells", cellId);

  await setDoc(
    cellRef,
    {
      ...payload,
      updatedAt: new Date(),
    },
    { merge: true }
  );
}

/**
 * [Flip] 플립 보드 config + cards를 구독하는 함수
 *
 * @param {string} boardId
 * @param {{
 *   onConfig?: (config: any) => void,
 *   onCards?: (cards: Record<string, any>) => void,
 *   onError?: (error: unknown) => void,
 * }} handlers
 * @returns {() => void} unsubscribe 함수
 */
export function subscribeFlipBoard(
  boardId,
  { onConfig, onCards, onError } = {}
) {
  const boardRef = doc(db, "sigHunterFlipBoards", boardId);
  const cardsRef = collection(boardRef, "cards");

  let unsubCards;

  (async () => {
    try {
      const snap = await getDoc(boardRef);
      if (snap.exists() && snap.data()?.config) {
        const data = snap.data();
        const nextConfig = data.config
          ? { ...DEFAULT_FLIP_CONFIG, ...data.config }
          : DEFAULT_FLIP_CONFIG;
        onConfig?.(nextConfig);
      } else {
        onConfig?.(DEFAULT_FLIP_CONFIG);
      }

      unsubCards = onSnapshot(
        cardsRef,
        (qs) => {
          const map = {};
          qs.forEach((d) => {
            map[d.id] = d.data();
          });
          onCards?.(map);
        },
        (error) => {
          console.error("[adminBoardApi] flip cards onSnapshot error", error);
          onError?.(error);
        }
      );
    } catch (e) {
      console.error("[adminBoardApi] subscribeFlipBoard error", e);
      onError?.(e);
    }
  })();

  return () => {
    if (unsubCards) {
      unsubCards();
    }
  };
}

/**
 * [Flip] 카드 업데이트/토글용 도메인 함수
 *
 * payload 패턴:
 * - 이미지 설정: { imageId, imageUrl, title, isFlipped, isMatched }
 * - 토글 플래그: { toggle: "flip" | "match" }
 *
 * @param {string} boardId
 * @param {string} cardId
 * @param {object} payload
 */
export async function updateFlipBoardCard(boardId, cardId, payload) {
  const boardRef = doc(db, "sigHunterFlipBoards", boardId);
  const cardRef = doc(boardRef, "cards", cardId);

  // 토글 요청인 경우 현재 상태를 읽어서 반전
  if (payload.toggle === "flip" || payload.toggle === "match") {
    const snap = await getDoc(cardRef);
    const data = snap.exists() ? snap.data() : {};
    const next = {};

    if (payload.toggle === "flip") {
      next.isFlipped = !(data.isFlipped ?? false);
    }
    if (payload.toggle === "match") {
      next.isMatched = !(data.isMatched ?? false);
    }

    await updateDoc(cardRef, {
      ...next,
      updatedAt: new Date(),
    });
    return;
  }

  // 일반적인 카드 정보 설정 (이미지 등)
  await setDoc(
    cardRef,
    {
      ...payload,
      updatedAt: new Date(),
    },
    { merge: true }
  );
}

/**
 * [Flip] 모든 카드를 초기 상태로 되돌리기
 * (isFlipped, isMatched → false)
 *
 * @param {string} boardId
 * @param {{ rows: number; cols: number }} config
 */
export async function resetAllFlipCards(boardId, config) {
  const { rows, cols } = {
    rows: config?.rows ?? DEFAULT_FLIP_CONFIG.rows,
    cols: config?.cols ?? DEFAULT_FLIP_CONFIG.cols,
  };

  const boardRef = doc(db, "sigHunterFlipBoards", boardId);
  const batch = writeBatch(db);

  for (let i = 1; i <= rows * cols; i++) {
    const cardRef = doc(boardRef, "cards", String(i));
    batch.update(cardRef, {
      isFlipped: false,
      isMatched: false,
      updatedAt: new Date(),
    });
  }

  await batch.commit();
}

/**
 * [Flip] 모든 카드를 공개 상태로 변경
 *
 * @param {string} boardId
 * @param {{ rows: number; cols: number }} config
 */
export async function flipAllFlipCards(boardId, config) {
  const { rows, cols } = {
    rows: config?.rows ?? DEFAULT_FLIP_CONFIG.rows,
    cols: config?.cols ?? DEFAULT_FLIP_CONFIG.cols,
  };

  const boardRef = doc(db, "sigHunterFlipBoards", boardId);
  const batch = writeBatch(db);

  for (let i = 1; i <= rows * cols; i++) {
    const cardRef = doc(boardRef, "cards", String(i));
    batch.update(cardRef, {
      isFlipped: true,
      updatedAt: new Date(),
    });
  }

  await batch.commit();
}

/**
 * [Bingo/Admin] SigHunterBoardControl.jsx에서 쓰는 "라이브러리(시그 이미지 목록)" 조회
 *
 * 입력: { type: "sighunter-bingo" | "meal-bingo" | "sighunter", activeOnly: boolean }
 * 출력: Array<{ id, imageUrl, title, ...meta }>
 */
export async function fetchSigItems({ type, activeOnly } = {}) {
  if (!type) return [];

  // SigImageAdminPage.jsx의 toGameKey(type) 매핑을 맞춤
  const game =
    type === "meal-bingo"
      ? "sigbingo"
      : type === "sighunter-bingo"
        ? "sigtag"
        : type === "sighunter"
          ? "sighunter"
          : null;

  if (!game) return [];

  // gameSigResources 조회 (리턴: {id, ...d.data()} 그대로)
  const metas = await listSigResourceMeta({ game });

  const filtered = activeOnly
    ? (metas || []).filter((m) => {
        // active 관련 필드명은 스키마 미확정이라 후보를 폴백 처리
        if (typeof m.isActive === "boolean") return m.isActive;
        if (typeof m.active === "boolean") return m.active;
        if (typeof m.status === "string") return m.status === "active";
        // activeOnly인데 명시 필드 없으면 포함(빌드 통과/화면 표시 우선)
        return true;
      })
    : metas || [];

  // storagePath -> imageUrl
  const items = await Promise.all(
    filtered.map(async (m) => {
      const storagePath = m.storagePath || "";
      let imageUrl = "";

      if (storagePath) {
        const fileRef = ref(storage, storagePath);
        imageUrl = await getDownloadURL(fileRef);
      }

      return {
        id: m.id,
        imageUrl,
        title: m.sigName || m.sigNumber || m.title || "",
        storagePath,
        ...m,
      };
    })
  );

  return items;
}