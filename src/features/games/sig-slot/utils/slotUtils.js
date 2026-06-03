// src/features/games/sig-slot/utils/slotUtils.js
// ✅ Firebase, 상수, 유틸 함수들을 한곳에 모음

import { initializeApp, getApps } from "firebase/app";
import { getStorage, ref as storageRef, listAll, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// ─────────────────────────────────────────────
// Firebase 초기화
// ─────────────────────────────────────────────
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDtSFww9PH2CEMJz9caYvN__C_SXmyxr0w",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "sig-hunter.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "sig-hunter",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "sig-hunter.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "702524786134",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:702524786134:web:259a88e3cd473531571077",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const storage = getStorage(app);
export const db = getFirestore(app);

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────
export const PROGRAMS = ["뮤즈", "퀸덤", "홀릭"];
export const PROGRAM_KEY_MAP = { 뮤즈: "muse", 퀸덤: "queendom", 홀릭: "holic" };

export const SIG_RANGES = [
  { label: "1000~2000", min: 1000, max: 2000 },
  { label: "1000~3000", min: 1000, max: 3000 },
  { label: "1000~5000", min: 1000, max: 5000 },
  { label: "5000~10000", min: 5000, max: 10000 },
];

export const SPEED_STAGES = [
  { interval: 60, frames: null },
  { interval: 110, frames: 6 },
  { interval: 200, frames: 5 },
  { interval: 340, frames: 3 },
];

export const DECEL_DURATION = SPEED_STAGES.slice(1).reduce(
  (sum, s) => sum + s.frames * s.interval,
  0
);
export const SPIN_MIN = DECEL_DURATION + 1500;
export const SPIN_MAX = DECEL_DURATION + 5000;

// ─────────────────────────────────────────────
// 이미지 캐시
// ─────────────────────────────────────────────
const imageCache = new Map();

/**
 * 이미지 배열을 프리로드
 */
export function preloadImages(images) {
  const promises = images.map((img) => {
    if (!img?.url) return Promise.resolve();
    if (imageCache.has(img.url)) return Promise.resolve();

    return new Promise((resolve) => {
      const el = new window.Image();
      el.onload = () => resolve();
      el.onerror = () => resolve();
      el.src = img.url;
      imageCache.set(img.url, el);
    });
  });

  return Promise.all(promises);
}

// ─────────────────────────────────────────────
// Firebase 함수
// ─────────────────────────────────────────────

/**
 * Firebase Storage에서 이미지 목록 가져오기
 */
export async function fetchImagesFromStorage(programKey, rangeFilter = null, onPartial = null) {
  const groups = [
    "group01",
    "group02",
    "group03",
    "group04",
    "group05",
    "group06",
    "group07",
    "group08",
  ];

  let accumulated = [];

  const promises = groups.map(async (group) => {
    try {
      const folderRef = storageRef(storage, `images/${programKey}/${group}`);
      const listResult = await listAll(folderRef);
      const items = await Promise.all(
        listResult.items.map(async (item) => {
          const url = await getDownloadURL(item);
          const name = item.name.replace(/\.[^.]+$/, "");
          const sigNum = parseInt(name, 10);
          return {
            id: item.fullPath,
            url,
            name,
            sigNum: isNaN(sigNum) ? null : sigNum,
            group,
          };
        })
      );

      if (onPartial) {
        accumulated = [...accumulated, ...items];
        const filtered = rangeFilter
          ? accumulated.filter(
              (img) => img.sigNum !== null && img.sigNum >= rangeFilter.min && img.sigNum <= rangeFilter.max
            )
          : accumulated;
        onPartial(filtered);
      }

      return items;
    } catch {
      return [];
    }
  });

  const results = await Promise.allSettled(promises);
  const allImages = results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  if (rangeFilter) {
    return allImages.filter(
      (img) => img.sigNum !== null && img.sigNum >= rangeFilter.min && img.sigNum <= rangeFilter.max
    );
  }
  return allImages;
}

/**
 * 프로그램 + 구간으로 Firestore 키 생성
 * 예: "muse_1000-2000" "queendom_1000-5000"
 */
export function makeRewardsKey(programKey, rangeLabel) {
  if (!rangeLabel) return programKey;
  return `${programKey}_${rangeLabel.replace(/~/g, "-")}`;
}

/**
 * Firestore에서 보상 가져오기 (프로그램 + 구간별)
 */
export async function fetchRewardsFromFirestore(programKey, rangeLabel = null) {
  const key = makeRewardsKey(programKey, rangeLabel);
  const docRef = doc(db, "sigSlotRewards", key);
  const snap = await getDoc(docRef);
  if (snap.exists()) return snap.data().items || [];
  return null;
}

/**
 * Firestore에 보상 저장 (프로그램 + 구간별)
 */
export async function saveRewardsToFirestore(programKey, rangeLabel = null, rewards) {
  const key = makeRewardsKey(programKey, rangeLabel);
  const docRef = doc(db, "sigSlotRewards", key);
  await setDoc(docRef, { items: rewards, updatedAt: new Date().toISOString() });
}

// ─────────────────────────────────────────────
// 보상 관련 함수
// ─────────────────────────────────────────────

/**
 * 기본 보상 목록 (모든 프로그램 & 구간에서 동일하게 사용)
 */
export const makeDefaultRewards = () => [
  { id: "r1", icon: "🎁", name: "기여도 보상", description: "기여도 +500 지급", probability: 40 },
  { id: "r2", icon: "💰", name: "상금 보상", description: "상금 10,000원 지급", probability: 30 },
  { id: "r3", icon: "🔑", name: "열쇠 보상", description: "열쇠 알파벳 A 지급", probability: 20 },
  { id: "r4", icon: "⭐", name: "특별 보상", description: "특별 아이템 지급", probability: 10 },
];

/**
 * 확률 기반 보상 추첨
 */
/**
 * Firestore에서 보상을 로드, 없으면 기본값 반환
 * 구간별로 독립적인 보상책을 관리하지만,
 * 처음에는 모두 동일한 기본 보상책으로 시작
 */
export async function getOrCreateRewards(programKey, rangeLabel) {
  try {
    const rewards = await fetchRewardsFromFirestore(programKey, rangeLabel);
    return rewards || makeDefaultRewards();
  } catch {
    return makeDefaultRewards();
  }
}

/**
 * 확률 기반 보상 추첨
 */
export function pickReward(rewards) {
  const total = rewards.reduce((s, r) => s + r.probability, 0);
  let rand = Math.random() * total;
  for (const r of rewards) {
    rand -= r.probability;
    if (rand <= 0) return r;
  }
  return rewards[rewards.length - 1];
}

// ─────────────────────────────────────────────
// 배열 유틸
// ─────────────────────────────────────────────

/**
 * 배열 랜덤 셔플
 */
export function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
