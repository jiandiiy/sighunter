// src/api/sigHunterImageLibraryApi.js
import { firestore, storage } from "../firebase";

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
} from "firebase/firestore";

import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

const COLLECTION = "sigItems";

export function resolveSigImageUrl(imagePath) {
  return imagePath || "";
}

/**
 * 시그 이미지 업로드
 */
export async function uploadSigItem({
  file,
  title,
  score,
  mode,
  type,
  rarity = "normal",
  isActive = true,
  slotIndex,
  boardIndex,
}) {
  if (!file) throw new Error("이미지 파일이 없습니다.");
  if (!mode) throw new Error("mode 값이 필요합니다.");
  if (!type) throw new Error("type 값이 필요합니다.");

  const ext = file.name.split(".").pop() || "png";
  const path = `sigItems/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const fileRef = storageRef(storage, path);
  await uploadBytes(fileRef, file);
  const imageUrl = await getDownloadURL(fileRef);

  const normalizedScore =
    score === undefined || score === null || score === ""
      ? null
      : Number(score);

  const normalizedSlotIndex =
    slotIndex === undefined || slotIndex === null || slotIndex === ""
      ? ""
      : String(slotIndex);

  const normalizedBoardIndex =
    boardIndex === undefined || boardIndex === null || boardIndex === ""
      ? ""
      : String(boardIndex);

  const now = Date.now();

  const docRef = await addDoc(collection(firestore, COLLECTION), {
    title: title ?? "",
    score: normalizedScore,
    mode,
    type,
    rarity,
    isActive: !!isActive,
    slotIndex: normalizedSlotIndex,
    boardIndex: normalizedBoardIndex,
    imageUrl,
    storagePath: path,
    createdAt: now,
  });

  return {
    id: docRef.id,
    title: title ?? "",
    score: normalizedScore,
    mode,
    type,
    rarity,
    isActive: !!isActive,
    slotIndex: normalizedSlotIndex,
    boardIndex: normalizedBoardIndex,
    imageUrl,
    createdAt: now,
  };
}

/**
 * 랜덤 뽑기
 */
export async function fetchRandomSigItems({
  mode,
  type,
  rarity,
  count = 1,
  boardIndex,
} = {}) {
  // 디버그 단계에서는 필터 없이 전체 목록에서 뽑도록 단순화
  const list = await fetchSigItems();

  if (!list.length) return [];

  const result = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * list.length);
    result.push(list[idx]);
  }
  return result;
}


/**
 * 시그 이미지 목록 조회
 * - 디버그용: 필터 없이 전체 조회 + 로그 출력
 */
export async function fetchSigItems() {
  const col = collection(firestore, COLLECTION);

  console.log("[API] fetchSigItems (DEBUG) get all sigItems");

  let snap;
  try {
    const q = query(col, orderBy("createdAt", "desc"));
    snap = await getDocs(q);
    console.log("[API] fetchSigItems AFTER getDocs (DEBUG)", {
      docCount: snap.docs.length,
    });
  } catch (err) {
    console.error("[API] ===== Firestore Query Error (DEBUG) =====");
    console.error(err);
    console.error("[API] =========================================");
    throw err;
  }

  const list = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      imageUrl: resolveSigImageUrl(data.imageUrl),
    };
  });

  console.log(
    "[API] fetchSigItems (DEBUG) first 3 items",
    list.slice(0, 3)
  );

  // createdAt 내림차순 정렬 (방어코드 포함)
  list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return list;
}

/**
 * 업데이트
 */
export async function updateSigItem(
  id,
  { title, score, slotIndex, boardIndex, isActive }
) {
  const ref = doc(firestore, COLLECTION, id);

  const updateData = {};

  if (title !== undefined) {
    updateData.title = title;
  }

  if (score !== undefined) {
    updateData.score =
      score === null || score === "" ? null : Number(score);
  }

  if (slotIndex !== undefined) {
    updateData.slotIndex =
      slotIndex === null || slotIndex === "" ? "" : String(slotIndex);
  }

  if (boardIndex !== undefined) {
    updateData.boardIndex =
      boardIndex === null || boardIndex === "" ? "" : String(boardIndex);
  }

  if (isActive !== undefined) {
    updateData.isActive = !!isActive;
  }

  if (Object.keys(updateData).length === 0) {
    const currentSnap = await getDoc(ref);
    const currentData = currentSnap.data() || {};
    return {
      id,
      ...currentData,
      imageUrl: resolveSigImageUrl(currentData.imageUrl),
    };
  }

  await updateDoc(ref, updateData);

  const snap = await getDoc(ref);
  const data = snap.data() || {};
  return {
    id,
    ...data,
    imageUrl: resolveSigImageUrl(data.imageUrl),
  };
}

/**
 * 삭제
 */
export async function deleteSigItem(id) {
  const ref = doc(firestore, COLLECTION, id);

  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    if (data.storagePath) {
      try {
        await deleteObject(storageRef(storage, data.storagePath));
      } catch (e) {
        console.warn("Storage 이미지 삭제 실패(무시):", e);
      }
    }
  }

  await deleteDoc(ref);
}