// src/api/sigHunterImageLibraryApi.js
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "../firebase";

const IMAGES_COL = "sigHunterImages";

/**
 * 새 이미지 메타데이터 등록 (Storage 업로드는 별도)
 * @param {Object} data
 *   - url: string
 *   - title?: string
 *   - tags?: string[]
 *   - note?: string
 */
export async function createImageMeta(data) {
  const colRef = collection(firestore, IMAGES_COL);
  const docRef = await addDoc(colRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * 전체 이미지 목록 가져오기
 * return: [{ id, url, title, tags, note, ... }, ...]
 */
export async function getImageList() {
  const colRef = collection(firestore, IMAGES_COL);
  const snapshot = await getDocs(colRef);
  const list = [];
  snapshot.forEach((docSnap) => {
    list.push({
      id: docSnap.id,
      ...docSnap.data(),
    });
  });
  return list;
}

/**
 * 이미지 메타데이터 수정 (제목, 태그, 메모 등)
 */
export async function updateImageMeta(imageId, data) {
  const docRef = doc(firestore, IMAGES_COL, imageId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * 이미지 메타데이터 삭제
 * (Storage 실제 파일 삭제는 원하면 나중에 별도 추가)
 */
export async function deleteImageMeta(imageId) {
  const docRef = doc(firestore, IMAGES_COL, imageId);
  await deleteDoc(docRef);
}