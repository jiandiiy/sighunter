// src/utils/sigHunterBingoData.js

import { sigHunterImagePool } from "../data/sigHunterImagePool";

export const HUNTER_MODES = ["muse", "queendom"];

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
    // 사용할 그룹 중 하나 고르기
    const gIdx = Math.floor(Math.random() * groups.length);
    const group = groups[gIdx];
    const list = poolForMode[group];

    const img = pickOne(list);
    if (img) result.push(img);
  }

  return result;
}

// 중앙 제외 그룹 (1~7)
const RANDOM_GROUPS_BY_MODE = {
  muse: ["group1", "group2", "group3", "group4", "group5", "group6", "group7"],
  queendom: [
    "group1",
    "group2",
    "group3",
    "group4",
    "group5",
    "group6",
    "group7",
  ],
};

/**
 * 주어진 모드에 맞는 25칸 시그헌터 빙고 셀 초기값을 반환
 *
 * - 중앙(인덱스 12): group9, group10 에서만 이미지 뽑기
 * - 나머지: group1~7 에서만 이미지 뽑기
 * - 시그 이름(sigName): "뮤즈 시그 N", "퀸덤 시그 N" 형태로 자동 생성
 * - 시그 개수(sigCount): 첫 번째 이미지의 OCR count 사용
 */
export function getInitialHunterCells(mode = "muse", count = 25) {
  const randomGroups = RANDOM_GROUPS_BY_MODE[mode] || [];

  return Array.from({ length: count }, (_, idx) => {
    const isCenter = idx === 12;

    // 중앙은 group9 / group10, 나머지는 group1~7 에서 뽑기
    const images = isCenter
      ? getRandomImagesFromGroups(mode, ["group9", "group10"], IMAGES_PER_CELL)
      : getRandomImagesFromGroups(mode, randomGroups, IMAGES_PER_CELL);

    // 첫 번째 이미지의 OCR 숫자를 이 칸의 시그 갯수로 사용
    const first = images[0] || {};
    const sigCount = first.count ?? 0;

    // 모드별 기본 이름 (원하면 여기만 바꿔도 됨)
    const prefix = mode === "queendom" ? "퀸덤 시그" : "뮤즈 시그";

    return {
      id: idx,
      sigName: `${prefix} ${idx + 1}`, // 앞면에서 쓸 수 있는 이름 (지금은 숨김 상태)
      sigCount,                        // 뒷면 하단에 보여줄 시그 갯수 (OCR 숫자)
      owner: null,                     // 뒷면 상단에 보여줄 플레이어 닉네임
      images: images.map((img) => img.path),   // <img src> 용 경로만 저장
      counts: images.map((img) => img.count),  // 필요하면 이미지별 숫자도 보관
      imageIndex: 0,
    };
  });
}