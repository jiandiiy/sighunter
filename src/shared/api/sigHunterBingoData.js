// src/utils/sigHunterBingoData.js

import { sigHunterImagePool } from "../data/sigHunterImagePresets";
// ❌ 여기서는 더 이상 toStorageUrl을 사용하지 않습니다.
// import { toStorageUrl } from "../core/storageUrl";

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

   // ✅ 유효한 그룹만 필터링 (pool에 실제로 존재하고 비어있지 않은 것만)
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
    // ✅ groups → resolvedGroups 로 변경
    const gIdx = Math.floor(Math.random() * resolvedGroups.length);
    const rawGroup = resolvedGroups[gIdx];
    const group = rawGroup.replace(/^group(\d)$/, "group0$1");
    const list = poolForMode[group];

    const img = pickOne(list);
    if (img) result.push(img);
  }

  return result;
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

  const centerIndex = getCenterIndex(size);
  const cfg = GROUPS_BY_MODE_AND_SIZE[mode] || {};
  const normalGroups = cfg.normal?.[size] || [];
  const centerGroups = cfg.center?.[size] || [];

  const isCenter = idx === centerIndex;

  // images: string[] — 로컬 public 경로 문자열 배열
  const images = isCenter
    ? getRandomImagesFromGroups(mode, centerGroups, IMAGES_PER_CELL)
    : getRandomImagesFromGroups(mode, normalGroups, IMAGES_PER_CELL);

  const prefix =
    mode === "queendom"
      ? "퀸덤 시그"
      : mode === "holic"
      ? "홀릭 시그"
      : "뮤즈 시그";

  return {
    id: idx,
    sigName: `${prefix} ${idx + 1}`,
    sigCount: 0, // count 정보 없으므로 0으로 초기화
    owner: null,
    // ✅ 경로 문자열 그대로 보관 (toStorageUrl 적용 안 함)
    images,
    counts: images.map(() => null), // count 정보 없으므로 null로 초기화
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