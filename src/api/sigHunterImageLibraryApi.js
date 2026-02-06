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
    createdAt: Date.now(),
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
  };
}

export async function fetchRandomSigItems({
  mode,
  type,
  rarity,
  count = 1,
  boardIndex,
} = {}) {
  const list = await fetchSigItems({
    mode,
    type,
    rarity,
    boardIndex,
    activeOnly: true,
  });

  if (!list.length) return [];

  const result = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * list.length);
    result.push(list[idx]);
  }
  return result;
}

export async function fetchSigItems({
  mode,
  type,
  rarity,
  activeOnly = true,
  boardIndex,
} = {}) {
  const col = collection(firestore, COLLECTION);

  const filters = [];
  
  // 🔴 순서 변경: isActive를 먼저 (세 번째 인덱스 활용)
  if (activeOnly) {
    filters.push(where("isActive", "==", true));
  }
  
  if (mode) filters.push(where("mode", "==", mode));
  if (rarity) filters.push(where("rarity", "==", rarity));
  if (type) filters.push(where("type", "==", type));

  // 🔴 boardIndex 쿼리는 일단 제외 (클라이언트에서 필터링)
  // if (boardIndex !== undefined && boardIndex !== null && boardIndex !== "") {
  //   filters.push(where("boardIndex", "==", String(boardIndex)));
  // }

  console.log("[API] fetchSigItems BEFORE getDocs", { 
    mode, type, rarity, boardIndex, activeOnly, 
    filterCount: filters.length 
  });

  let q;
  if (filters.length > 0) {
    q = query(col, ...filters, orderBy("createdAt", "desc"));
  } else {
    q = query(col, orderBy("createdAt", "desc"));
  }

  let snap;
  try {
    snap = await getDocs(q);
    console.log("[API] fetchSigItems AFTER getDocs", { docCount: snap.docs.length });
  } catch (err) {
    console.error("[API] ===== Firestore Query Error =====");
    console.error(err);
    console.error("[API] =====================================");
    return [];
  }

  const list = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      imageUrl: resolveSigImageUrl(data.imageUrl),
    };
  });

  // 🔴 boardIndex 필터링은 클라이언트에서
  let filtered = list;
  if (boardIndex !== undefined && boardIndex !== null && boardIndex !== "") {
    filtered = list.filter(item => item.boardIndex === String(boardIndex));
  }

  filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return filtered;
}

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