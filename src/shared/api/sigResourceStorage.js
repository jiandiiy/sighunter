// src/api/sigResourceStorage.js

import { storage } from "../core/firebase";
import {
  ref,
  listAll,
  getDownloadURL,
  uploadBytes,
  deleteObject,
} from "firebase/storage";

/**
 * 카테고리별 이미지 목록 조회
 * Storage 경로: images/{category}/...
 */
export async function listResources(category) {
  const folderRef = ref(storage, `images/${category}`);
  const result = await listAll(folderRef);

  const items = await Promise.all(
    result.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      return {
        fileName: itemRef.name, // 예: "sig_001.png"
        url,
      };
    })
  );

  return items;
}

/**
 * 이미지 업로드
 * Storage 경로: images/{category}/{file.name}
 */
export async function uploadResource(category, file) {
  const fileRef = ref(storage, `images/${category}/${file.name}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return { fileName: file.name, url };
}

/**
 * 이미지 삭제
 * Storage 경로: images/{category}/{fileName}
 */
export async function deleteResource(category, fileName) {
  const fileRef = ref(storage, `images/${category}/${fileName}`);
  await deleteObject(fileRef);
}