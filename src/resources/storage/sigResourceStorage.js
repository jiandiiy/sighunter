// src/api/sigResourceStorage.js

import { storage } from "../../resources/firestore/firebase";
import {
  ref,
  listAll,
  getDownloadURL,
  uploadBytes,
  deleteObject,
} from "firebase/storage";

/**
 * 게임별 리소스 폴더 매핑
 * (필요하다면 나중에 게임별 서브폴더를 추가할 수도 있음)
 * 지금은 프로그램/그룹 폴더를 공용으로 쓰므로,
 * 실제 파일 저장은 images/{program}/{group}/{fileName} 으로 통일.
 *
 * 이 매핑은 "게임별 전용 폴더"가 필요해질 때를 위해 남겨둔 상태.
 * 현재 직원용 어드민은 주로 아래의 program/group 유틸을 사용하게 됨.
 */
const CATEGORY_PATH_MAP = {
  sighunter: "sigHunterResources", // 시그헌터 전용 폴더 (필요 시 사용)
  sigbingo: "sigBingoResources",   // 식대전 빙고 전용 폴더 (필요 시 사용)
  sigtag: "sigTagResources",       // 시그땅따먹기 전용 폴더 (필요 시 사용)
};

/**
 * 내부용: 카테고리 → Storage ref
 * (지금은 프로그램/그룹 구조를 많이 쓸 거라, 이 매핑은 선택적으로 사용)
 */
function getCategoryRef(category) {
  const basePath = CATEGORY_PATH_MAP[category];
  if (!basePath) {
    throw new Error(`Unknown category: ${category}`);
  }
  return ref(storage, basePath);
}

/**
 * 카테고리별 이미지 목록 조회 (게임 폴더 버전)
 * 예: sighunter → sigHunterResources/ 이하 전체
 *
 * 현재 설계에서는 프로그램/그룹(images/{program}/{group})을 메인으로 쓰고,
 * 이 함수는 "게임별 전용 폴더"가 필요할 때 선택적으로 사용.
 */
export async function listGameResources(category) {
  const categoryRef = getCategoryRef(category);
  const result = await listAll(categoryRef);

  const items = await Promise.all(
    result.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      return {
        name: itemRef.name,       // 파일명 (예: "background.png")
        fullPath: itemRef.fullPath, // 예: "sigHunterResources/background.png"
        url,
      };
    })
  );

  return items;
}

/**
 * 이미지 업로드 (게임 카테고리 버전)
 * 같은 이름의 파일이 있으면 덮어쓰기(교체)됨
 * 예: sighunter + background.png → sigHunterResources/background.png
 *
 * 마찬가지로, 지금 메인 흐름은 프로그램/그룹이라
 * 이 함수도 필요할 때만 사용.
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
 * 이미지 삭제 (게임 카테고리 버전)
 * fullPath 기준으로 직접 지움
 * 예: "sigHunterResources/background.png"
 */
export async function deleteGameResource(fullPath) {
  const fileRef = ref(storage, fullPath);
  await deleteObject(fileRef);
}

/**
 * 게임에서 쓸 단일 리소스 조회 (게임 폴더 버전)
 * 예: getGameResourceUrl("sighunter", "background.png")
 */
export async function getGameResourceUrl(category, filename) {
  const categoryRef = getCategoryRef(category);
  const fileRef = ref(categoryRef, filename);
  const url = await getDownloadURL(fileRef);
  return url;
}

/* ──────────────────────────────────────────────
   ▼▼▼ 여기서부터 "프로그램 / 그룹"용 유틸 ▼▼▼
   직원용 어드민 페이지에서 실제로 많이 사용할 부분

   실제 파일 경로 규칙:
   images/{program}/{group}/{fileName}

   program: 'queendom' | 'muse' | 'holic'
   group: 'group1' ~ 'group12'
────────────────────────────────────────────── */

/**
 * 프로그램/그룹별 이미지 목록 조회
 * @param {string} program - 'queendom' | 'muse' | 'holic'
 * @param {string} group   - 'group01' ~ 'group12'
 *
 * 예: (queendom, group1)
 *  → images/queendom/group1/ 이하 모든 파일
 */
export async function listProgramGroupImages(program, group) {
  const folderRef = ref(storage, `images/${program}/${group}`);
  const result = await listAll(folderRef);

  const items = await Promise.all(
    result.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      return {
        fileName: itemRef.name,     // 예: "sig_001.png"
        fullPath: itemRef.fullPath, // 예: "images/queendom/group1/sig_001.png"
        url,
      };
    })
  );

  return items;
}

/**
 * 프로그램/그룹 폴더에 이미지 업로드
 * 같은 이름 파일이면 덮어쓰기(교체)
 *
 * 예:
 *  program = "queendom"
 *  group   = "group1"
 *  file.name = "sig_001.png"
 *
 *  → images/queendom/group1/sig_001.png
 */
export async function uploadProgramGroupImage(program, group, file) {
  const fileRef = ref(storage, `images/${program}/${group}/${file.name}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return {
    fileName: file.name,
    fullPath: fileRef.fullPath,
    url,
  };
}

/**
 * 프로그램/그룹 이미지 삭제
 * fullPath 그대로 넘겨서 삭제
 * 예: "images/queendom/group1/sig_001.png"
 */
export async function deleteProgramImage(fullPath) {
  const fileRef = ref(storage, fullPath);
  await deleteObject(fileRef);
}