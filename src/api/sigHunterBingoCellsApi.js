// src/api/sigHunterBingoCellsApi.js
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
// firestore import는 실제로 쓰이지 않으므로 삭제했습니다.
// import { firestore } from "../firebase";
import { getBingoDocRef } from "./sigHunterBingoApi";

/**
 * 특정 보드(boardId-mode-size)의 cells 서브컬렉션 ref
 */
function getCellsCollectionRef(boardId, mode, size) {
  const boardRef = getBingoDocRef(boardId, mode, size);
  return collection(boardRef, "cells");
}

/**
 * 특정 셀 문서 ref
 * cellId 예: "r0c0", "cell_0", "center" 등
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