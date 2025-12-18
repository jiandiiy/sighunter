// src/utils/sigBingoImagePool.js
import { bingoImagePool } from "../data/sigBingoImagePool";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 단일 이미지 1장 랜덤 (기본: 일반 풀에서)
export function getRandomBingoImage(mode, opts = {}) {
  const { poolKey = "default" } = opts;

  const modePool = bingoImagePool?.[mode];
  const list =
    poolKey === "default"
      ? Array.isArray(modePool)
        ? modePool
        : []
      : Array.isArray(modePool?.[poolKey])
        ? modePool[poolKey]
        : [];

  if (!list.length) return "";
  const idx = Math.floor(Math.random() * list.length);
  return list[idx] || "";
}

/**
 * 초기 보드용: count개 뽑기
 * - opts.centerIndex: 가운데 인덱스(기본 4)
 * - opts.centerPoolKey: 가운데칸 전용 풀 키(예: "specialCenter")
 * - opts.useCenterPool: true면 가운데칸만 centerPoolKey에서 뽑음
 */
export function getRandomBingoImages(mode, count, opts = {}) {
  const {
    centerIndex = 4,
    centerPoolKey = "specialCenter",
    useCenterPool = false,
  } = opts;

  const modePool = bingoImagePool?.[mode];

  // ✅ 기존 구조(배열)도 지원
  const defaultList = Array.isArray(modePool) ? modePool : [];
  // ✅ 확장 구조(객체: { default: [], specialCenter: [] }) 지원
  const defaultList2 = Array.isArray(modePool?.default) ? modePool.default : [];
  const normalPool = defaultList.length ? defaultList : defaultList2;

  const centerPool = Array.isArray(modePool?.[centerPoolKey])
    ? modePool[centerPoolKey]
    : [];

  if (!normalPool.length && !(useCenterPool && centerPool.length)) {
    return Array(count).fill("");
  }

  // 일반 칸은 중복 없이 셔플로 뽑기(기존 동작 유지)
  const pickedNormal = normalPool.length
    ? shuffle(normalPool).slice(0, count).concat(Array(Math.max(0, count - normalPool.length)).fill(""))
    : Array(count).fill("");

  // 가운데칸만 전용 풀에서 교체
  if (useCenterPool && centerPool.length && centerIndex >= 0 && centerIndex < count) {
    pickedNormal[centerIndex] = getRandomBingoImage(mode, { poolKey: centerPoolKey });
  }

  return pickedNormal.slice(0, count);
}