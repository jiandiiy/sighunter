// src/utils/sigBingoImagePool.js
// 식대전 빙고용: 랜덤 카드(일반/스페셜) 가져오기
// - 1) 백엔드 API가 되면 API 우선 사용
// - 2) API 실패/미구동 시, 로컬 bingoImagePool 로 fallback

import { bingoImagePool } from "../data/sigBingoImagePool";
import { fetchRandomSigItems } from "../api/sigHunterImageLibraryApi";

/* 공용 유틸 */

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 🔹 로컬 풀 원소를 API에서 쓰는 카드 형식으로 통일
function normalizeItem(raw, { mode, rarity = "normal", idx }) {
  if (!raw) return null;

  // 이미 imageUrl 가진 객체면 그대로 (필수값만 기본 세팅)
  if (typeof raw === "object") {
    return {
      id: raw.id ?? `${mode}-${rarity}-${idx}`,
      title: raw.title ?? "",
      score: raw.score ?? 0,
      mode: raw.mode ?? mode,
      type: raw.type ?? "meal-bingo",
      rarity: raw.rarity ?? rarity,
      imageUrl:
        raw.imageUrl ??
        raw.src ??
        raw.url ??
        "", // 그래도 없으면 빈 문자열
    };
  }

  // 문자열이면 "이미지 경로"라고 가정
  if (typeof raw === "string") {
    return {
      id: `${mode}-${rarity}-${idx}`,
      title: "",
      score: 0,
      mode,
      type: "meal-bingo",
      rarity,
      imageUrl: raw,
    };
  }

  return null;
}

/* -------- 로컬 풀 기반 구현 (fallback) -------- */

function getLocalPools(mode) {
  const modePool = bingoImagePool?.[mode];

  const defaultList = Array.isArray(modePool) ? modePool : [];
  const defaultList2 = Array.isArray(modePool?.default) ? modePool.default : [];
  const normalRaw = defaultList.length ? defaultList : defaultList2;

  return {
    modePool,
    normalRaw,
  };
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

  // 기본 풀 정규화
  const normalPool = normalRaw
    .map((item, idx) => normalizeItem(item, { mode, rarity, idx }))
    .filter(Boolean);

  const centerPool = centerRaw
    .map((item, idx) =>
      normalizeItem(item, { mode, rarity: "special", idx })
    )
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

/* -------- 최종 export: API → 실패 시 로컬 -------- */

/**
 * 빙고 보드 전체용 카드 목록
 */
export async function getRandomBingoImages(
  mode,
  count,
  { rarity = "normal", ...restOpts } = {}
) {
  // 1) API 시도
  try {
    const items = await fetchRandomSigItems({
      mode,
      type: "meal-bingo",
      rarity,
      count,
    });

    if (Array.isArray(items) && items.length) return items;
  } catch (err) {
    console.warn(
      "[sigBingoImagePool] API 호출 실패, 로컬 bingoImagePool 로 fallback 합니다.",
      err
    );
  }

  // 2) 실패하면 로컬
  return getLocalRandomBingoImages(mode, count, { rarity, ...restOpts });
}

/**
 * 한 장만 (라인 완성 시 교체용)
 */
export async function getRandomBingoImage(
  mode,
  { rarity = "normal", ...restOpts } = {}
) {
  // 1) API 시도
  try {
    const items = await fetchRandomSigItems({
      mode,
      type: "meal-bingo",
      rarity,
      count: 1,
    });
    if (Array.isArray(items) && items[0]) return items[0];
  } catch (err) {
    console.warn(
      "[sigBingoImagePool] 단일 카드 API 실패, 로컬 bingoImagePool 로 fallback 합니다.",
      err
    );
  }

  // 2) 실패하면 로컬
  return getLocalRandomBingoImage(mode, { rarity, ...restOpts });
}