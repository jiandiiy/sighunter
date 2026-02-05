// src/api/sigHunterImageLibraryApi.js
// 기존 localhost:4000 API 대신 Firebase Firestore + Storage 직접 사용

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
  // Firebase Storage URL은 이미 절대 경로이므로 그대로 반환
  return imagePath || "";
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
  slotIndex, // 칸 번호
  boardIndex, // 빙고판 번호 (1~3)
}) {
  if (!file) throw new Error("이미지 파일이 없습니다.");

  // 1) Storage 에 파일 업로드
  const ext = file.name.split(".").pop() || "png";
  const path = `sigItems/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const fileRef = storageRef(storage, path);
  await uploadBytes(fileRef, file);
  const imageUrl = await getDownloadURL(fileRef);

  // 2) Firestore 에 메타데이터 저장
  const docRef = await addDoc(collection(firestore, COLLECTION), {
    title: title ?? "",
    score: score ?? "",
    mode,
    type,
    rarity,
    isActive: !!isActive,
    slotIndex: slotIndex ?? "",
    boardIndex: boardIndex ?? "",
    imageUrl,
    storagePath: path,
    createdAt: Date.now(),
  });

  return {
    id: docRef.id,
    title: title ?? "",
    score: score ?? "",
    mode,
    type,
    rarity,
    isActive: !!isActive,
    slotIndex: slotIndex ?? "",
    boardIndex: boardIndex ?? "",
    imageUrl,
  };
}

/**
 * 랜덤 조회 (게임에서 사용)
 */
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

/**
 * 관리용 전체 목록 조회
 */
export async function fetchSigItems({
  mode,
  type,
  rarity,
  activeOnly = true,
  boardIndex,
} = {}) {
  const col = collection(firestore, COLLECTION);

  const filters = [];
  if (mode) filters.push(where("mode", "==", mode));
  if (type) filters.push(where("type", "==", type));
  if (rarity) filters.push(where("rarity", "==", rarity));
  if (boardIndex !== undefined && boardIndex !== null && boardIndex !== "") {
    filters.push(where("boardIndex", "==", String(boardIndex)));
  }
  if (activeOnly) {
    filters.push(where("isActive", "==", true));
  }

  let q;
  if (filters.length > 0) {
    q = query(col, ...filters, orderBy("createdAt", "desc"));
  } else {
    q = query(col, orderBy("createdAt", "desc"));
  }

  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      imageUrl: resolveSigImageUrl(data.imageUrl),
    };
  });
}

/**
 * 시그 정보 수정 (이름, 점수, 칸번호, 빙고판, 활성 여부)
 */
export async function updateSigItem(
  id,
  { title, score, slotIndex, boardIndex, isActive }
) {
  const ref = doc(firestore, COLLECTION, id);

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (score !== undefined) updateData.score = score;
  if (slotIndex !== undefined) updateData.slotIndex = slotIndex;
  if (boardIndex !== undefined) updateData.boardIndex = boardIndex;
  if (isActive !== undefined) updateData.isActive = !!isActive;

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
 * 시그 삭제 (Firestore 문서 + Storage 이미지 같이 삭제)
 */
export async function deleteSigItem(id) {
  const ref = doc(firestore, COLLECTION, id);

  // storagePath 있으면 이미지도 같이 삭제
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    if (data.storagePath) {
      try {
        await deleteObject(storageRef(storage, data.storagePath));
      } catch (e) {
        // 스토리지에 없으면 그냥 무시
        // eslint-disable-next-line no-console
        console.warn("Storage 이미지 삭제 실패(무시):", e);
      }
    }
  }

  await deleteDoc(ref);
}