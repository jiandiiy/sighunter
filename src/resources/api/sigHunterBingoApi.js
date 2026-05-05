// src/shared/api/sigHunterBingoApi.js

import {
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "../firestore/firebase";
import { sigHunterImagePresets } from "../../shared/data/sigHunterImagePresets";

// ===== 공통 상수 / 유틸 =====

const COLLECTION = "sigHunterBingo";

export const HUNTER_MODES = ["muse", "queendom", "holic"];
export const HUNTER_SIZES = [3, 5];
export const AVAILABLE_SIZES = [3, 5];

const IMAGES_PER_CELL = 10;

// undefined 값을 재귀적으로 제거 (Firestore는 undefined 저장 불가)
function removeUndefined(obj) {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, removeUndefined(v)])
    );
  }
  return obj;
}

// 공용: 라인(가로/세로/대각) 인덱스 생성
export const makeLines = (size) => {
  const lines = [];
  // rows
  for (let r = 0; r < size; r++) {
    lines.push(Array.from({ length: size }, (_, c) => r * size + c));
  }
  // cols
  for (let c = 0; c < size; c++) {
    lines.push(Array.from({ length: size }, (_, r) => r * size + c));
  }
  // diagonals
  lines.push(Array.from({ length: size }, (_, i) => i * size + i));
  lines.push(
    Array.from({ length: size }, (_, i) => i * size + (size - 1 - i))
  );
  return lines;
};

// 배열에서 랜덤 하나
function pickOne(list) {
  if (!list || list.length === 0) return null;
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

// 모드 + 그룹 목록에서 N장 랜덤 뽑기 (중복 허용)
// 반환값: 문자열 경로 배열 (e.g. "/images/holic/group01/sig_01.webp")
function getRandomImagesFromGroups(mode, groups, countPerCell) {
  const poolForMode = sigHunterImagePresets[mode] || {};

  // ✅ 유효한 그룹만 필터링
  const validGroups = groups.filter((rawGroup) => {
    const group = rawGroup.replace(/^group(\d)$/, "group0$1");
    return poolForMode[group] && poolForMode[group].length > 0;
  });

  // ✅ 유효한 그룹이 없으면 해당 모드의 전체 그룹으로 fallback
  const resolvedGroups =
    validGroups.length > 0
      ? validGroups
      : Object.keys(poolForMode).filter(
          (k) => poolForMode[k] && poolForMode[k].length > 0
        );

  const result = [];

  for (let i = 0; i < countPerCell; i++) {
    const gIdx = Math.floor(Math.random() * resolvedGroups.length);
    const rawGroup = resolvedGroups[gIdx];
    const group = rawGroup.replace(/^group(\d)$/, "group0$1");
    const list = poolForMode[group]; // [{ path, rawText, count }, ...]

    const preset = pickOne(list); // preset 하나 랜덤 선택
    if (preset) {
      result.push({
        path: preset.path,          // 실제 이미지 경로
        count: preset.count ?? 0,   // 수동 매칭 count
      });
    }
  }

  return result; // [{ path, count }, ...]
}

const GROUPS_BY_MODE_AND_SIZE = {
  muse: {
    normal: {
      5: ["group01", "group02", "group03"],
      3: ["group01", "group02", "group03"],
    },
    center: {
      5: ["group05", "group06"],
      3: ["group07"],
    },
  },
  queendom: {
    normal: {
      5: ["group01", "group02", "group03"],
      3: ["group01", "group02", "group03"],
    },
    center: {
      5: ["group05", "group06"],
      3: ["group08"],
    },
  },
  holic: {
    normal: {
      5: ["group01", "group02", "group03"],
      3: ["group01", "group02", "group03"],
    },
    center: {
      5: ["group05", "group06"],
      3: ["group07"],
    },
  },
};

const getCenterIndex = (size) => Math.floor((size * size) / 2);

// ===== 빙고 셀 프리셋 생성 =====

export function createRandomHunterCell(mode, size, idx) {
  if (!HUNTER_MODES.includes(mode)) {
    throw new Error(`Invalid mode: ${mode}`);
  }
  if (!HUNTER_SIZES.includes(size)) {
    throw new Error(`Invalid size: ${size}`);
  }

  const centerIndex = getCenterIndex(size);
  const cfg = GROUPS_BY_MODE_AND_SIZE[mode] || {};
  const normalGroups = cfg.normal?.[size] || [];
  const centerGroups = cfg.center?.[size] || [];

  const isCenter = idx === centerIndex;

  // ✅ 이제 { path, count } 배열을 받음
  const imageEntries = isCenter
    ? getRandomImagesFromGroups(mode, centerGroups, IMAGES_PER_CELL)
    : getRandomImagesFromGroups(mode, normalGroups, IMAGES_PER_CELL);

  const prefix =
    mode === "queendom"
      ? "퀸덤 시그"
      : mode === "holic"
      ? "홀릭 시그"
      : "뮤즈 시그";

  const images = imageEntries.map((e) => e.path);         // 경로만
  const counts = imageEntries.map((e) => e.count ?? 0);   // 각 이미지 count
  const sigCount = counts.reduce((sum, c) => sum + c, 0); // 필요하다면 합계

  return {
    id: idx,
    sigName: `${prefix} ${idx + 1}`,
    sigCount,    // ✅ 이제 실제 수동 count 기반 값
    owner: null,
    images,      // string[]
    counts,      // number[]
    imageIndex: 0,
  };
}

export function getInitialHunterCells(mode = "muse", size = 5) {
  if (!HUNTER_MODES.includes(mode)) {
    throw new Error(`Invalid mode: ${mode}`);
  }
  if (!HUNTER_SIZES.includes(size)) {
    throw new Error(
      `Invalid size: ${size} (allowed: ${HUNTER_SIZES.join(", ")})`
    );
  }

  const count = size * size;
  return Array.from({ length: count }, (_, idx) =>
    createRandomHunterCell(mode, size, idx)
  );
}

// ===== Firestore: 메인 상태(doc) =====

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
    const cleaned = removeUndefined({ mode, size, ...state }); // ← undefined 제거 후 저장
    await setDoc(ref, cleaned, { merge: true });
  } catch (e) {
    console.error("saveSigHunterBingoState failed", e);
  }
}

// ===== Firestore: cells 서브컬렉션 =====

/**
 * 특정 보드(boardId-mode-size)의 cells 서브컬렉션 ref
 */
function getCellsCollectionRef(boardId, mode, size) {
  const boardRef = getBingoDocRef(boardId, mode, size);
  return collection(boardRef, "cells");
}

/**
 * 특정 셀 문서 ref
 * cellId 예: "0", "1" ... 또는 "r0c0", "center" 등
 */
function getCellDocRef(boardId, mode, size, cellId) {
  const cellsCol = getCellsCollectionRef(boardId, mode, size);
  return doc(cellsCol, cellId);
}

/**
 * 보드의 모든 셀 데이터 1회 로드
 * return: [{ id, imageUrl, title, tags, updatedAt, ... }, ...]
 */
export async function loadAllCells(boardId, mode, size) {
  const cellsCol = getCellsCollectionRef(boardId, mode, size);
  const snap = await getDocs(cellsCol);
  const cells = [];
  snap.forEach((d) => {
    cells.push({
      id: d.id,
      ...d.data(),
    });
  });
  return cells;
}

/**
 * 특정 셀 업데이트 (imageUrl, title, tags 등)
 * data 예: { imageUrl, title, tags }
 */
export async function updateCell(boardId, mode, size, cellId, data) {
  const cellRef = getCellDocRef(boardId, mode, size, cellId);
  await setDoc(
    cellRef,
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * 모든 셀 실시간 구독
 * onData: (cells: Array<{ id, ... }>) => void
 * onError?: (error) => void
 */
export function subscribeAllCells(boardId, mode, size, onData, onError) {
  const cellsCol = getCellsCollectionRef(boardId, mode, size);
  return onSnapshot(
    cellsCol,
    (snap) => {
      const cells = [];
      snap.forEach((d) => {
        cells.push({ id: d.id, ...d.data() });
      });
      onData(cells);
    },
    (err) => {
      console.error("[BingoCells] onSnapshot error:", err);
      if (onError) onError(err);
    }
  );
}