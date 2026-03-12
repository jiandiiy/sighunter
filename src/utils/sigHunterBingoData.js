
// src/utils/sigHunterBingoData.js

import { sigHunterImagePool } from "../data/sigHunterImagePool";
import { toStorageUrl } from "../core/storageUrl"; // ✅ 추가

export const HUNTER_MODES = ["muse", "queendom"];
export const HUNTER_SIZES = [3, 5];

const IMAGES_PER_CELL = 10;

// 배열에서 랜덤 하나
function pickOne(list) {
  if (!list || list.length === 0) return null;
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

// 모드 + 그룹 목록에서 N장 랜덤 뽑기 (중복 허용)
// 반환값: { path, rawText, count } 의 배열
function getRandomImagesFromGroups(mode, groups, countPerCell) {
  const poolForMode = sigHunterImagePool[mode] || {};
  const result = [];

  for (let i = 0; i < countPerCell; i++) {
    const gIdx = Math.floor(Math.random() * groups.length);
    const group = groups[gIdx];
    const list = poolForMode[group];

    const img = pickOne(list);
    if (img) result.push(img);
  }

  return result;
}

/**
 * ✅ size별 그룹 정의
 * - 5x5: 중앙만 특수(group9/10), 나머지 group1~7
 * - 3x3: 중앙만 모드별 전용 그룹 사용
 *   - muse: group11
 *   - queendom: group12
 */
const GROUPS_BY_MODE_AND_SIZE = {
  muse: {
    normal: {
      5: ["group1", "group2", "group3", "group4", "group5", "group6", "group7"],
      3: ["group1", "group2", "group3", "group4", "group5", "group6", "group7"],
    },
    center: {
      5: ["group9", "group10"],
      3: ["group11"], // 뮤즈 3x3 중앙
    },
  },
  queendom: {
    normal: {
      5: ["group1", "group2", "group3", "group4", "group5", "group6", "group7"],
      3: ["group1", "group2", "group3", "group4", "group5", "group6", "group7"],
    },
    center: {
      5: ["group9", "group10"],
      3: ["group12"], // 퀸덤 3x3 중앙
    },
  },
};

const getCenterIndex = (size) => Math.floor((size * size) / 2);

/**
 * 셀 하나를 새로 생성 (초기 생성/점령·쟁탈 시 공용)
 */
export function createRandomHunterCell(mode, size, idx) {
  if (!HUNTER_MODES.includes(mode)) {
    throw new Error(`Invalid mode: ${mode}`);
  }
  if (!HUNTER_SIZES.includes(size)) {
    throw new Error(`Invalid size: ${size}`);
  }

  const centerIndex  = getCenterIndex(size);
  const cfg          = GROUPS_BY_MODE_AND_SIZE[mode] || {};
  const normalGroups = cfg.normal?.[size] || [];
  const centerGroups = cfg.center?.[size] || [];

  const isCenter = idx === centerIndex;

  const images = isCenter
    ? getRandomImagesFromGroups(mode, centerGroups, IMAGES_PER_CELL)
    : getRandomImagesFromGroups(mode, normalGroups, IMAGES_PER_CELL);

  const first    = images[0] || {};
  const sigCount = first.count ?? 0;
  const prefix   = mode === "queendom" ? "퀸덤 시그" : "뮤즈 시그";

  return {
    id:         idx,
    sigName:    `${prefix} ${idx + 1}`,
    sigCount,
    owner:      null,
    images:     images.map((img) => toStorageUrl(img.path)), // ✅ 변환
    counts:     images.map((img) => img.count),
    imageIndex: 0,
  };
}

/**
 * ✅ 주어진 모드/사이즈(3 또는 5)에 맞는 시그헌터 빙고 셀 초기값 반환
 */
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
