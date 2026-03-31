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
 * 게임별 리소스 폴더 매핑
 * 필요에 따라 실제 Storage 폴더 이름을 바꿔도 됨
 */
const CATEGORY_PATH_MAP = {
  sighunter: "sigHunterResources", // 시그헌터 전용 폴더
  sigbingo: "sigBingoResources", // 식대전 빙고 전용 폴더
  sigtag: "sigTagResources", // 시그땅따먹기 전용 폴더
};

/**
 * 내부용: 카테고리 → Storage ref
 */
function getCategoryRef(category) {
  const basePath = CATEGORY_PATH_MAP[category];
  if (!basePath) {
    throw new Error(`Unknown category: ${category}`);
  }
  return ref(storage, basePath);
}

/**
 * 카테고리별 이미지 목록 조회
 * 예: sighunter → sigHunterResources/ 이하 전체
 */
export async function listGameResources(category) {
  const categoryRef = getCategoryRef(category);
  const result = await listAll(categoryRef);

  const items = await Promise.all(
    result.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      return {
        name: itemRef.name, // 파일명 (예: "background.png")
        fullPath: itemRef.fullPath, // 예: "sigHunterResources/background.png"
        url,
      };
    })
  );

  return items;
}

/**
 * 이미지 업로드
 * 같은 이름의 파일이 있으면 덮어쓰기(교체)됨
 * 예: sighunter + background.png → sigHunterResources/background.png
 */
export async function uploadGameResource(category, file) {
  const categoryRef = getCategoryRef(category);
  const fileRef = ref(categoryRef, file.name); // 파일명을 그대로 사용

  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);

  return {
    name: file.name,
    fullPath: fileRef.fullPath,
    url,
  };
}

/**
 * 이미지 삭제
 * fullPath 기준으로 직접 지움
 * 예: "sigHunterResources/background.png"
 */
export async function deleteGameResource(fullPath) {
  const fileRef = ref(storage, fullPath);
  await deleteObject(fileRef);
}

/**
 * 게임에서 쓸 단일 리소스 조회
 * 예: getGameResourceUrl("sighunter", "background.png")
 */
export async function getGameResourceUrl(category, filename) {
  const categoryRef = getCategoryRef(category);
  const fileRef = ref(categoryRef, filename);
  const url = await getDownloadURL(fileRef);
  return url;
}