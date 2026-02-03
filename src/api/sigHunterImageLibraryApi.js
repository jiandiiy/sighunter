// src/api/sigHunterImageLibraryApi.js

const API_BASE =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

const SIG_API_BASE = `${API_BASE}/api/sigs`;

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
  slotIndex,   // 칸 번호
  boardIndex,  // 빙고판 번호 (1~3)
}) {
  const formData = new FormData();
  formData.append("image", file);
  if (title) formData.append("title", title);
  if (score !== undefined && score !== null) {
    formData.append("score", String(score));
  }
  formData.append("mode", mode);
  formData.append("type", type);
  formData.append("rarity", rarity);
  formData.append("isActive", String(isActive));

  if (slotIndex !== undefined && slotIndex !== null && slotIndex !== "") {
    formData.append("slotIndex", String(slotIndex));
  }
  if (boardIndex !== undefined && boardIndex !== null && boardIndex !== "") {
    formData.append("boardIndex", String(boardIndex));
  }

  const res = await fetch(SIG_API_BASE, {
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
export async function fetchRandomSigItems({
  mode,
  type,
  rarity,
  count,
  boardIndex,
}) {
  const url = new URL(`${SIG_API_BASE}/random`);

  if (mode) url.searchParams.set("mode", mode);
  if (type) url.searchParams.set("type", type);
  if (rarity) url.searchParams.set("rarity", rarity);
  if (count) url.searchParams.set("count", String(count));
  if (boardIndex !== undefined && boardIndex !== null && boardIndex !== "") {
    url.searchParams.set("boardIndex", String(boardIndex));
  }

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
export async function fetchSigItems({
  mode,
  type,
  rarity,
  activeOnly = true,
  boardIndex,
}) {
  const url = new URL(SIG_API_BASE);

  if (mode) url.searchParams.set("mode", mode);
  if (type) url.searchParams.set("type", type);
  if (rarity) url.searchParams.set("rarity", rarity);
  url.searchParams.set("activeOnly", String(activeOnly));
  if (boardIndex !== undefined && boardIndex !== null && boardIndex !== "") {
    url.searchParams.set("boardIndex", String(boardIndex));
  }

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

/**
 * 시그 정보 수정 (이름, 점수, 칸번호, 빙고판, 활성 여부)
 */
export async function updateSigItem(
  id,
  { title, score, slotIndex, boardIndex, isActive }
) {
  const body = {};
  if (title !== undefined) body.title = title;
  if (score !== undefined) body.score = score;
  if (slotIndex !== undefined) body.slotIndex = slotIndex;
  if (boardIndex !== undefined) body.boardIndex = boardIndex;
  if (isActive !== undefined) body.isActive = isActive;

  const res = await fetch(`${SIG_API_BASE}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to update sig item");
  }

  const json = await res.json();
  return { ...json, imageUrl: resolveSigImageUrl(json.imageUrl) };
}

/**
 * 시그 삭제
 */
export async function deleteSigItem(id) {
  const res = await fetch(`${SIG_API_BASE}/${id}`, {
    method: "DELETE",
  });

  if (!res.ok && res.status !== 204) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to delete sig item");
  }
}