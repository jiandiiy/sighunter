// server/sigStore.js
const { v4: uuidv4 } = require("uuid");

// 메모리 상에 저장
let sigs = [];

/**
 * 새 시그 추가
 */
function addSig({
  title,
  score,
  mode,
  type,
  rarity,
  imageUrl,
  isActive,
  slotIndex,
  boardIndex,   // ✅ 빙고판 번호 추가
}) {
  const item = {
    id: uuidv4(), // 문자열 ID
    title: title || "",
    score: score != null ? Number(score) : 0,
    mode,
    type,
    rarity: rarity || "normal",
    imageUrl,
    isActive: !!isActive,
    slotIndex:
      slotIndex === null || slotIndex === undefined || slotIndex === ""
        ? null
        : Number(slotIndex),
    boardIndex:
      boardIndex === null || boardIndex === undefined || boardIndex === ""
        ? null
        : Number(boardIndex),           // ✅ 저장
    createdAt: new Date().toISOString(),
  };

  sigs.push(item);
  return item;
}

/**
 * 조건에 맞는 전체 조회
 */
function findAll({
  mode,
  type,
  rarity,
  boardIndex,          // ✅ 추가
  onlyActive = true,
} = {}) {
  return sigs.filter((item) => {
    if (mode && item.mode !== mode) return false;
    if (type && item.type !== type) return false;
    if (rarity && item.rarity !== rarity) return false;

    // ✅ 빙고판 번호 필터링
    if (
      boardIndex !== undefined &&
      boardIndex !== null &&
      boardIndex !== ""
    ) {
      if (Number(item.boardIndex) !== Number(boardIndex)) return false;
    }

    if (onlyActive && !item.isActive) return false;
    return true;
  });
}

/**
 * 랜덤 샘플
 */
function sampleRandom(arr, count) {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  const copy = [...arr];
  const n = Math.min(count, copy.length);
  const result = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return result;
}

/**
 * 시그 수정
 * patch: { title?, score?, slotIndex?, boardIndex?, isActive? }
 */
function updateSig(id, patch = {}) {
  const targetId = String(id);
  const idx = sigs.findIndex((item) => String(item.id) === targetId);
  if (idx === -1) return null;

  const prev = sigs[idx];
  const next = { ...prev };

  if (patch.title !== undefined) next.title = patch.title;

  if (patch.score !== undefined && patch.score !== "") {
    next.score = Number(patch.score);
  }
  if (patch.score === "") {
    next.score = 0;
  }

  if (patch.slotIndex !== undefined) {
    next.slotIndex =
      patch.slotIndex === null || patch.slotIndex === ""
        ? null
        : Number(patch.slotIndex);
  }

  // ✅ 빙고판 번호 수정
  if (patch.boardIndex !== undefined) {
    next.boardIndex =
      patch.boardIndex === null || patch.boardIndex === ""
        ? null
        : Number(patch.boardIndex);
  }

  if (patch.isActive !== undefined) {
    next.isActive = !!patch.isActive;
  }

  sigs[idx] = next;
  return next;
}

/**
 * 시그 삭제
 */
function removeSig(id) {
  const targetId = String(id);
  const idx = sigs.findIndex((item) => String(item.id) === targetId);
  if (idx === -1) return false;
  sigs.splice(idx, 1);
  return true;
}

module.exports = {
  addSig,
  findAll,
  sampleRandom,
  updateSig,
  removeSig,
};