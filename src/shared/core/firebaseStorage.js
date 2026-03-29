// src/api/firebaseStorage.js

import { storage } from "../core/firebase";
import {
  ref,
  listAll,
  getDownloadURL,
  uploadBytes,
  deleteObject,
} from "firebase/storage";

/**
 * ✅ 카테고리별 이미지 목록 가져오기
 * @param category "bingo" | "hpbattle" | "boardgame" | "bigwheel" | "flip" | "common"
 * @returns string[] (다운로드 URL 배열)
 */
export async function getImagesByCategory(category) {
  const folderRef = ref(storage, `images/${category}`);
  const result = await listAll(folderRef);

  const urls = await Promise.all(
    result.items.map((item) => getDownloadURL(item))
  );

  return urls;
}

/**
 * ✅ 이미지 업로드 (직원용 관리 페이지에서 사용)
 * @param category 위와 동일
 * @param file 업로드할 File 객체 (input[type="file"]에서 선택한 것)
 * @returns string (업로드 후 다운로드 URL)
 */
export async function uploadImage(category, file) {
  const fileRef = ref(storage, `images/${category}/${file.name}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return url;
}

/**
 * ✅ 이미지 삭제
 * @param category 카테고리
 * @param fileName 파일 이름 (예: "sig_001.png")
 */
export async function deleteImage(category, fileName) {
  const fileRef = ref(storage, `images/${category}/${fileName}`);
  await deleteObject(fileRef);
}