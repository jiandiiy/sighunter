// src/api/sigHunterImageLibraryApi.js

const API_BASE =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

export function resolveSigImageUrl(imagePath) {
  if (!imagePath) return "";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  return `${API_BASE}${imagePath}`;
}

/**
 * 새 시그 업로드
 */
export async function uploadSigItem({
  file,
  title,
  score,
  mode,
  type,
  rarity = "normal",
  isActive,
}) {
  const formData = new FormData();
  formData.append("image", file);
  if (title) formData.append("title", title);
  if (score !== undefined && score !== null)
    formData.append("score", String(score));
  formData.append("mode", mode);
  formData.append("type", type);
  formData.append("rarity", rarity);
  formData.append("isActive", String(isActive));

  const res = await fetch(`${API_BASE}/api/sigs`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to upload sig item");
  }

  const json = await res.json();
  return { ...json, imageUrl: resolveSigImageUrl(json.imageUrl) };
}

/**
 * 랜덤 조회 (게임에서 사용)
 */
export async function fetchRandomSigItems({ mode, type, rarity, count }) {
  const url = new URL(`${API_BASE}/api/sigs/random`);

  if (mode) url.searchParams.set("mode", mode);
  if (type) url.searchParams.set("type", type);
  if (rarity) url.searchParams.set("rarity", rarity);
  if (count) url.searchParams.set("count", String(count));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error("Failed to fetch random sig items");
  }

  const arr = await res.json();
  return arr.map((item) => ({
    ...item,
    imageUrl: resolveSigImageUrl(item.imageUrl),
  }));
}

/**
 * 관리용 전체 목록 조회
 */
export async function fetchSigItems({ mode, type, rarity, activeOnly = true }) {
  const url = new URL(`${API_BASE}/api/sigs`);

  if (mode) url.searchParams.set("mode", mode);
  if (type) url.searchParams.set("type", type);
  if (rarity) url.searchParams.set("rarity", rarity);
  url.searchParams.set("activeOnly", String(activeOnly));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error("Failed to fetch sig items");
  }

  const arr = await res.json();
  return arr.map((item) => ({
    ...item,
    imageUrl: resolveSigImageUrl(item.imageUrl),
  }));
}