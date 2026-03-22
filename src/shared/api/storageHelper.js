
// src/api/storageHelper.js

/**
 * 로컬 경로를 Firebase Storage 다운로드 URL로 변환
 *
 * 로컬 경로 예시:  /images/muse/group01/sig_199.webp
 * Storage URL:     https://firebasestorage.googleapis.com/v0/b/
 *                  sig-hunter.firebasestorage.app/o/
 *                  images%2Fmuse%2Fgroup01%2Fsig_199.webp?alt=media
 */

const STORAGE_BASE_URL =
  "https://firebasestorage.googleapis.com/v0/b/sig-hunter.firebasestorage.app/o";

// ── 방어 처리: 이미 Storage URL인지 확인 ──────────────────────────
function isAlreadyStorageUrl(path) {
  return typeof path === "string" && path.startsWith("https://firebasestorage");
}

/**
 * 로컬 경로 → Firebase Storage URL 변환
 *
 * @param {string} localPath  예: "/images/muse/group01/sig_199.webp"
 * @returns {string}          Firebase Storage 다운로드 URL
 *                            입력이 없거나 이미 URL이면 그대로 반환
 */
export function toStorageUrl(localPath) {
  // ✅ null / undefined / 빈 문자열 방어
  if (!localPath) {
    console.warn("[storageHelper] toStorageUrl: 빈 경로 입력됨");
    return "";
  }

  // ✅ 이미 Storage URL이면 중복 변환 방지
  if (isAlreadyStorageUrl(localPath)) {
    return localPath;
  }

  // "/images/muse/group01/sig_199.webp"
  //   → "images%2Fmuse%2Fgroup01%2Fsig_199.webp"
  const encoded = localPath
    .replace(/^\//, "")   // 앞의 "/" 제거
    .replace(/\//g, "%2F"); // 나머지 "/" → "%2F"

  return `${STORAGE_BASE_URL}/${encoded}?alt=media`;
}

/**
 * 배열 내 경로들을 모두 Storage URL로 변환
 *
 * @param {string[]} paths
 * @returns {string[]}
 */
export function toStorageUrls(paths) {
  // ✅ 배열이 아닌 경우 방어
  if (!Array.isArray(paths)) {
    console.warn("[storageHelper] toStorageUrls: 배열이 아닌 값 입력됨", paths);
    return [];
  }
  return paths.map(toStorageUrl);
}

/**
 * Storage URL → 로컬 경로로 역변환 (디버깅 용도)
 *
 * @param {string} storageUrl
 * @returns {string}  예: "/images/muse/group01/sig_199.webp"
 */
export function toLocalPath(storageUrl) {
  if (!storageUrl) return "";
  try {
    // URL에서 경로 부분 추출 후 디코딩
    const match = storageUrl.match(/\/o\/(.+)\?alt=media/);
    if (!match) return storageUrl;
    return "/" + decodeURIComponent(match[1].replace(/%2F/gi, "/"));
  } catch {
    return storageUrl;
  }
}
