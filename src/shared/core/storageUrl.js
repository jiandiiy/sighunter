const STORAGE_BASE =
  "https://firebasestorage.googleapis.com/v0/b/sig-hunter.firebasestorage.app/o";

export function toStorageUrl(localPath) {
  if (!localPath) return "";

  if (typeof localPath !== "string") {
    return "";
  }

  // 완성 URL이면 그대로
  if (localPath.startsWith("https://")) return localPath;

  // "/images/..." -> "images/..."
  const withoutLeadingSlash = localPath.replace(/^\//, "");

 // ✅ objectKey가 실수로 'sig-hunter/images/...' 형태로 들어오면 제거
  const stripped = withoutLeadingSlash.replace(/^sig-hunter\//, "");

  // group6 -> group06 (여기부터 stripped 기준으로 정규화)
  const normalized = stripped.replace(
    /group(\d+)/g,
    (_, n) => `group${String(n).padStart(2, "0")}`
  );

  // objectKey를 그대로 인코딩 (prefix 강제하지 않음)
  const encoded = normalized
    .split("/")
    .map(encodeURIComponent)
    .join("%2F");

  // 캐시 무력화용 t 붙이기(개발 중 유지 가능)
  return `${STORAGE_BASE}/${encoded}?alt=media&t=${Date.now()}`;
}