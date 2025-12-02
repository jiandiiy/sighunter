// src/api/sigHunterBingoStorage.js

const STORAGE_KEY_PREFIX = "sigHunterBingo.";

/**
 * 시그헌터 빙고 상태 로드
 * boardId 기준으로 각각 다른 판을 저장할 수 있게 함.
 */
export async function loadSigHunterBingoState(boardId = "hunter-default") {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY_PREFIX + boardId);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("loadSigHunterBingoState parse error", e);
    return null;
  }
}

/**
 * 시그헌터 빙고 상태 저장
 */
export async function saveSigHunterBingoState(boardId, state) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY_PREFIX + boardId,
      JSON.stringify(state)
    );
  } catch (e) {
    console.error("saveSigHunterBingoState failed", e);
  }
}