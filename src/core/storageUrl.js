const STORAGE_BASE =
  "https://firebasestorage.googleapis.com/v0/b/sig-hunter.firebasestorage.app/o";

export function toStorageUrl(localPath) {
  if (!localPath) return "";

  // 완성 URL은 건드리지 않음
  if (localPath.startsWith("https://")) return localPath;

  // "/images/holic/..." → "images/holic/..."
  const withoutLeadingSlash = localPath.replace(/^\//, "");

  // group6 → group06
  const padded = withoutLeadingSlash.replace(
    /group(\d+)/g,
    (_, n) => `group${String(n).padStart(2, "0")}`
  );

  // 이미 sig-hunter/로 시작하면 중복 방지
  const withPrefix = padded.startsWith("sig-hunter/")
    ? padded
    : `sig-hunter/${padded}`;

  // "sig-hunter/images/holic/group01/sig_01.webp" →
  // "sig-hunter%2Fimages%2Fholic%2Fgroup01%2Fsig_01.webp"
  const encoded = withPrefix.split("/").map(encodeURIComponent).join("%2F");

  return `${STORAGE_BASE}/${encoded}?alt=media`;
}