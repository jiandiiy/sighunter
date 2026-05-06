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
 */
const CATEGORY_PATH_MAP = {
  sighunter: "sigHunterResources",
  sigbingo: "sigBingoResources",
  sigtag: "sigTagResources",
};

function getCategoryRef(category) {
  const basePath = CATEGORY_PATH_MAP[category];
  if (!basePath) throw new Error(`Unknown category: ${category}`);
  return ref(storage, basePath);
}

/* ──────────────────────────────────────────────
   게임 카테고리 버전 (필요 시 사용)
────────────────────────────────────────────── */

export async function listGameResources(category) {
  const categoryRef = getCategoryRef(category);
  const result = await listAll(categoryRef);

  const items = await Promise.all(
    result.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      return {
        name: itemRef.name,
        fullPath: itemRef.fullPath,
        url,
      };
    })
  );

  return items;
}

export async function uploadGameResource(category, file) {
  const categoryRef = getCategoryRef(category);
  const fileRef = ref(categoryRef, file.name);

  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);

  return {
    name: file.name,
    fullPath: fileRef.fullPath,
    url,
  };
}

export async function deleteGameResource(fullPath) {
  const fileRef = ref(storage, fullPath);
  await deleteObject(fileRef);
}

export async function getGameResourceUrl(category, filename) {
  const categoryRef = getCategoryRef(category);
  const fileRef = ref(categoryRef, filename);
  const url = await getDownloadURL(fileRef);
  return url;
}

/* ──────────────────────────────────────────────
   ▼▼▼ 여기서부터 "프로그램 / 그룹"용 유틸 ▼▼▼
   직원용 어드민 페이지에서 실제로 많이 사용할 부분
────────────────────────────────────────────── */

/**
 * 프로그램/그룹별 이미지 목록 조회
 * @param {string} program - 'queendom' | 'muse' | 'holic'
 * @param {string} group   - 'group01' ~ 'group08'
 *
 * 예: (queendom, group01)
 *  → images/queendom/group01/ 이하 모든 파일
 */
export async function listProgramGroupImages(program, group) {
  const folderRef = ref(storage, `images/${program}/${group}`);
  const result = await listAll(folderRef);

  const items = await Promise.all(
    result.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      return {
        fileName: itemRef.name,
        fullPath: itemRef.fullPath,
        url,
      };
    })
  );

  return items;
}

/**
 * (추가) 업로드 시 저장 파일명 커스터마이즈용 헬퍼
 * - "path/같은 것"이 들어오면 제거하고
 * - 디렉터리 구분자(/, \)는 날려서 순수 파일명만 남김
 */
function normalizeUploadFileName(fileName) {
  if (!fileName) return "";

  // 브라우저가 이상한 값을 줄 때 대비 (예: c:\fakepath\name.png)
  const normalized = String(fileName).replace(/^.*[\\/]/, ""); // 마지막 / \ 이후만
  return normalized.trim();
}

/**
 * 프로그램/그룹 폴더에 이미지 업로드
 * 같은 이름 파일이면 덮어쓰기(교체)
 *
 * ✅ 변경점:
 * - 기존: uploadProgramGroupImage(program, group, file)
 * - 추가: (옵션) 원하는 저장 파일명(확장자 포함)을 지정 가능
 *
 * 예:
 *  uploadProgramGroupImage("queendom","group01", file, { fileName: "1000.webp" })
 *
 * @param {string} program
 * @param {string} group
 * @param {File} file
 * @param {{ fileName?: string }} [options]
 */
export async function uploadProgramGroupImage(
  program,
  group,
  file,
  options = {}
) {
  const desiredFileName = options?.fileName
    ? normalizeUploadFileName(options.fileName)
    : "";

  const finalFileName = desiredFileName || file.name;

  const fileRef = ref(
    storage,
    `images/${program}/${group}/${finalFileName}`
  );

  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);

  return {
    fileName: finalFileName,
    fullPath: fileRef.fullPath,
    url,
  };
}

/**
 * 프로그램/그룹 이미지 삭제
 * fullPath 그대로 넘겨서 삭제
 * 예: "images/queendom/group01/sig_001.png"
 */
export async function deleteProgramImage(fullPath) {
  const fileRef = ref(storage, fullPath);
  await deleteObject(fileRef);
}

/**
 * 프로그램/그룹 이미지 파일명 변경 (확장자 포함)
 * Firebase Storage는 직접 이름변경이 없으므로,
 * 기존 파일을 다운로드 → 새 파일명으로 재업로드 → 기존 파일 삭제
 *
 * @param {string} program - 'queendom' | 'muse' | 'holic'
 * @param {string} group   - 'group01' ~ 'group08'
 * @param {string} oldFullPath - 기존 fullPath (예: "images/queendom/group01/old.png")
 * @param {string} newFileName - 새 파일명 (확장자 포함, 예: "new.webp")
 * @returns {{fileName: string, fullPath: string, url: string}}
 */
export async function renameImageFile(
  program,
  group,
  oldFullPath,
  newFileName
) {
  if (!newFileName || typeof newFileName !== "string") {
    throw new Error("새 파일명(확장자 포함)을 입력해주세요.");
  }

  // 1) 경로 문자 제거 (보안)
  const normalized = String(newFileName)
    .trim()
    .replace(/[\\/]/g, "");

  if (!normalized) {
    throw new Error("유효한 파일명을 입력해주세요.");
  }

  // 2) 기존 파일 다운로드 (blob)
  const oldFileRef = ref(storage, oldFullPath);
  let blob;
  try {
    const response = await fetch(await getDownloadURL(oldFileRef));
    blob = await response.blob();
  } catch (err) {
    throw new Error("기존 파일을 다운로드할 수 없습니다: " + err.message);
  }

  // 3) 새 파일명으로 업로드
  const newFullPath = `images/${program}/${group}/${normalized}`;
  const newFileRef = ref(storage, newFullPath);

  try {
    await uploadBytes(newFileRef, blob);
  } catch (err) {
    throw new Error("새 파일명으로 업로드할 수 없습니다: " + err.message);
  }

  // 4) 기존 파일 삭제
  try {
    await deleteObject(oldFileRef);
  } catch (err) {
    console.warn("기존 파일 삭제 중 경고:", err.message);
    // 삭제 실패해도 진행 (이미 새 파일은 생성됨)
  }

  // 5) 새 파일의 URL 조회
  const newUrl = await getDownloadURL(newFileRef);

  return {
    fileName: normalized,
    fullPath: newFullPath,
    url: newUrl,
  };
}