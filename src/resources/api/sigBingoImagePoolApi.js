// src/shared/api/sigBingoImagePoolApi.js
// BingoBoard.jsx 에서 사용하는 빙고 이미지 + meal-bingo 상태 관련 API 래퍼

import { bingoImagePool } from "../../shared/data/sigBingoImagePresets";
import { toStorageUrl } from "../storage/storageUrl"; // ✅ core 의 IO는 여기서만 사용

// ⬇️ 시그헌터 빙고 상태 API는 여기(파일 상단)로 올리기
import {
  loadSigHunterBingoState,
  saveSigHunterBingoState,
} from "./sigHunterBingoApi"; // 실제 파일 경로에 맞게 필요하면 수정

/* -------------------------------------------------------------------------- */
/* 🔧 공통 유틸                                                                  */
/* -------------------------------------------------------------------------- */

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ✅ imageUrl 생성 시 toStorageUrl() 로 변환
function normalizeItem(raw, { mode, rarity = "normal", idx }) {
  if (!raw) return null;

  if (typeof raw === "object") {
    return {
      id: raw.id ?? `${mode}-${rarity}-${idx}`,
      title: raw.title ?? "",
      score: raw.score ?? 0,
      mode: raw.mode ?? mode,
      type: raw.type ?? "meal-bingo",
      rarity: raw.rarity ?? rarity,
      imageUrl: toStorageUrl(raw.imageUrl ?? raw.src ?? raw.url ?? ""),
    };
  }

  if (typeof raw === "string") {
    return {
      id: `${mode}-${rarity}-${idx}`,
      title: "",
      score: 0,
      mode,
      type: "meal-bingo",
      rarity,
      imageUrl: toStorageUrl(raw),
    };
  }

  return null;
}

function getLocalPools(mode) {
  const modePool = bingoImagePool?.[mode];

  const defaultList = Array.isArray(modePool) ? modePool : [];
  const defaultList2 = Array.isArray(modePool?.default)
    ? modePool.default
    : [];
  const normalRaw = defaultList.length ? defaultList : defaultList2;

  return { modePool, normalRaw };
}

function getLocalRandomBingoImages(mode, count, opts = {}) {
  const {
    centerIndex = 4,
    centerPoolKey = "specialCenter",
    useCenterPool = false,
    rarity = "normal",
  } = opts;

  const { modePool, normalRaw } = getLocalPools(mode);
  const centerRaw = Array.isArray(modePool?.[centerPoolKey])
    ? modePool[centerPoolKey]
    : [];

  if (!normalRaw.length && !(useCenterPool && centerRaw.length)) {
    return Array(count).fill(null);
  }

  const normalPool = normalRaw
    .map((item, idx) => normalizeItem(item, { mode, rarity, idx }))
    .filter(Boolean);

  const centerPool = centerRaw
    .map((item, idx) => normalizeItem(item, { mode, rarity: "special", idx }))
    .filter(Boolean);

  const base =
    normalPool.length > 0
      ? shuffle(normalPool)
          .slice(0, count)
          .concat(
            Array(Math.max(0, count - normalPool.length)).fill(
              normalPool[0] || null
            )
          )
      : Array(count).fill(null);

  if (
    useCenterPool &&
    centerPool.length &&
    centerIndex >= 0 &&
    centerIndex < count
  ) {
    base[centerIndex] = centerPool[0];
  }

  return base.slice(0, count);
}

function getLocalRandomBingoImage(mode, opts = {}) {
  const { poolKey = "default", rarity = "normal" } = opts;
  const modePool = bingoImagePool?.[mode];

  const list =
    poolKey === "default"
      ? Array.isArray(modePool)
        ? modePool
        : []
      : Array.isArray(modePool?.[poolKey])
      ? modePool[poolKey]
      : [];

  if (!list.length) return null;

  const idx = Math.floor(Math.random() * list.length);
  return normalizeItem(list[idx], { mode, rarity, idx });
}

/* -------------------------------------------------------------------------- */
/* 🌐 외부에 노출되는 API (BingoBoard.jsx 에서 사용)                              */
/* -------------------------------------------------------------------------- */

export async function getRandomBingoImages(
  mode,
  count,
  { rarity = "normal", ...restOpts } = {}
) {
  console.log(
    "[sigBingoImagePoolApi] 🔴 임시: 로컬 풀만 사용 (여러 장, Firestore 인덱스 대기 중)"
  );

  const localItems = getLocalRandomBingoImages(mode, count, {
    rarity,
    ...restOpts,
  });

  console.log("[sigBingoImagePoolApi] localItems", {
    mode,
    count,
    resultLength: localItems.length,
  });

  if (!localItems.length) {
    return Array(count).fill(null);
  }

  const result = [];
  let idx = 0;
  while (result.length < count) {
    result.push(localItems[idx % localItems.length]);
    idx += 1;
  }

  return result.slice(0, count);
}

export async function getRandomBingoImage(
  mode,
  { rarity = "normal", ...restOpts } = {}
) {
  console.log(
    "[sigBingoImagePoolApi] 🔴 임시: 로컬 풀만 사용 (단일 카드, Firestore 인덱스 대기 중)"
  );
  return getLocalRandomBingoImage(mode, { rarity, ...restOpts });
}

/* -------------------------------------------------------------------------- */
/* 🧩 meal-bingo 상태 저장 래퍼                                                  */
/* -------------------------------------------------------------------------- */

export async function loadMealBingoState(boardId) {
  return loadSigHunterBingoState(boardId);
}

export async function saveMealBingoState(boardId, state) {
  return saveSigHunterBingoState(boardId, state);
}