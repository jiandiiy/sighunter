// src/shared/sigBingoPlayersApi.js

import { db } from "../firestore/firebase"; // 실제 firebase 초기화 경로에 맞게 수정
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

/**
 * program + group 기준 전체 인원 목록 로드
 * 반환: ["지안", "홍길동", ...]
 */
export async function loadSigHunterPlayers(program, group) {
  if (!program || !group) return [];
  const id = `${program}-${group}`;
  const ref = doc(db, "sigHunterPlayers", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return [];
  }
  const data = snap.data();
  return Array.isArray(data.players) ? data.players : [];
}

/**
 * program + group 기준 전체 인원 목록 저장
 * players: 문자열 배열
 * 반환: 정리(trim/filter)된 최종 배열
 */
export async function saveSigHunterPlayers(program, group, players) {
  if (!program || !group) return [];

  const id = `${program}-${group}`;
  const ref = doc(db, "sigHunterPlayers", id);

  const cleaned = (players || [])
    .map((n) => (n || "").trim())
    .filter(Boolean);

  await setDoc(
    ref,
    {
      program,
      group,
      players: cleaned,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return cleaned;
}