// src/api/sigGameResourceMeta.js

import { db } from "../core/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

const COLLECTION_NAME = "sigGameResources";

/**
 * 메타데이터 조회
 * filters: { game?, boardType?, program?, group?, storagePath? }
 */
export async function listSigResourceMeta(filters = {}) {
  const colRef = collection(db, COLLECTION_NAME);

  const clauses = [];
  if (filters.game) clauses.push(where("game", "==", filters.game));
  if (filters.boardType) clauses.push(where("boardType", "==", filters.boardType));
  if (filters.program) clauses.push(where("program", "==", filters.program));
  if (filters.group) clauses.push(where("group", "==", filters.group));
  // 특정 이미지의 메타만 찾고 싶을 때 사용 (Storage fullPath 기준)
  if (filters.storagePath) clauses.push(where("storagePath", "==", filters.storagePath));

  const q = clauses.length ? query(colRef, ...clauses) : colRef;
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

/**
 * 메타데이터 생성
 * payload: {
 *   game,           // 'sigbingo' | 'sighunter' | 'sigtag'
 *   boardType,      // 'board1' | 'board2' | 'board3' | '5x5' | '3x3' | null
 *   program,        // 'queendom' | 'muse' | 'holic'
 *   group,          // 'group1' ~ 'group12'
 *   slotIndex,      // number (칸 번호)
 *   sigNumber?,     // number | null (시그 숫자)
 *   sigName?,       // string (시그 이름)
 *   storagePath,    // "images/queendom/group1/xxx.png"
 *   imageUrl        // downloadURL
 * }
 */
export async function createSigResourceMeta(payload) {
  const colRef = collection(db, COLLECTION_NAME);
  const docRef = await addDoc(colRef, {
    ...payload,
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * 메타데이터 수정
 * payload 구조는 create와 동일 (필요한 필드만 넘겨도 됨)
 */
export async function updateSigResourceMeta(id, payload) {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

/**
 * 메타데이터 삭제
 */
export async function deleteSigResourceMeta(id) {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}