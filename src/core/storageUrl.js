
const STORAGE_BASE =
  "https://firebasestorage.googleapis.com/v0/b/sig-hunter.firebasestorage.app/o";

/**
 * 로컬 경로 → Firebase Storage URL 변환
 *
 * 로컬:    "/images/queendom/group3/sig_24.webp"
 * Storage: "images/queendom/group03/sig_24.webp"
 * URL:     "https://...o/images%2Fqueendom%2Fgroup03%2Fsig_24.webp?alt=media"
 *
 * @param {string} localPath - 로컬 이미지 경로 or 이미 완성된 Storage URL
 * @returns {string} Firebase Storage 다운로드 URL
 */
export function toStorageUrl(localPath) {
  if (!localPath) return "";

  // 이미 Storage URL이면 그대로 반환
  if (localPath.startsWith("https://")) return localPath;

  // 1) 앞 슬래시 제거
  //    "/images/queendom/group3/sig_24.webp" → "images/queendom/group3/sig_24.webp"
  const withoutLeadingSlash = localPath.replace(/^\//, "");

  // 2) group 번호 제로패딩
  //    "group3" → "group03"
  //    "group10" → "group10" (이미 2자리면 그대로)
  const padded = withoutLeadingSlash.replace(
    /group(\d+)/g,
    (_, n) => `group${String(n).padStart(2, "0")}`
  );

  // 3) 슬래시를 %2F 로 인코딩
  //    "images/queendom/group03/sig_24.webp"
  //    → "images%2Fqueendom%2Fgroup03%2Fsig_24.webp"
  const encoded = padded.split("/").map(encodeURIComponent).join("%2F");

  // 4) 최종 Storage 다운로드 URL 조합
  return `${STORAGE_BASE}/${encoded}?alt=media`;
}
