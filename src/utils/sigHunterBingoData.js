// src/utils/sigHunterBingoData.js

import { sigHunterImagePool } from "../data/sigHunterImagePool";
import { toStorageUrl } from "../core/storageUrl";

export const HUNTER_MODES = ["muse", "queendom", "holic"];
export const HUNTER_SIZES = [3, 5];

const IMAGES_PER_CELL = 10;

// 배열에서 랜덤 하나
function pickOne(list) {
  if (!list || list.length === 0) return null;
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

// 모드 + 그룹 목록에서 N장 랜덤 뽑기 (중복 허용)
// 반환값: 문자열 경로 배열 (e.g. "/images/holic/group01/sig_01.webp")
function getRandomImagesFromGroups(mode, groups, countPerCell) {
  const poolForMode = sigHunterImagePool[mode] || {};
  const result = [];

  for (let i = 0; i < countPerCell; i++) {
    const gIdx = Math.floor(Math.random() * groups.length);
    // "group1" → "group01" 로 패딩 (imagePool 키가 "group01" 형식)
    const rawGroup = groups[gIdx];
    const group = rawGroup.replace(/^group(\d)$/, "group0$1");
    const list = poolForMode[group];

    const img = pickOne(list); // img는 "/images/holic/..." 문자열
    if (img) result.push(img);
  }

  return result; // string[]
}

const GROUPS_BY_MODE_AND_SIZE = {
  muse: {
    normal: {
      5: ["group1", "group2", "group3", "group4", "group5", "group6", "group7"],
      3: ["group1", "group2", "group3", "group4", "group5", "group6", "group7"],
    },
    center: {
      5: ["group9", "group10"],
      3: ["group11"],
    },
  },
  queendom: {
    normal: {
      5: ["group1", "group2", "group3", "group4", "group5", "group6", "group7"],
      3: ["group1", "group2", "group3", "group4", "group5", "group6", "group7"],
    },
    center: {
      5: ["group9", "group10"],
      3: ["group12"],
    },
  },
  holic: {
    normal: {
      5: ["group1", "group2", "group3", "group4", "group5", "group6", "group7"],
      3: ["group1", "group2", "group3", "group4", "group5", "group6", "group7"],
    },
    center: {
      5: ["group9", "group10"],
      3: ["group11"],
    },
  },
};

const getCenterIndex = (size) => Math.floor((size * size) / 2);

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

  // images: string[] — 로컬 public 경로 문자열 배열
  const images = isCenter
    ? getRandomImagesFromGroups(mode, centerGroups, IMAGES_PER_CELL)
    : getRandomImagesFromGroups(mode, normalGroups, IMAGES_PER_CELL);

  const prefix =
    mode === "queendom" ? "퀸덤 시그" :
    mode === "holic"    ? "홀릭 시그" :
                          "뮤즈 시그";

  return {
    id:         idx,
    sigName:    `${prefix} ${idx + 1}`,
    sigCount:   0,                              // ✅ count 정보 없으므로 0으로 초기화
    owner:      null,
    images:     images.map((img) => toStorageUrl(img)), // ✅ img가 문자열이므로 그대로 전달
    counts:     images.map(() => null),         // ✅ count 정보 없으므로 null로 초기화
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