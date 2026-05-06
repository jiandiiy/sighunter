// src/resources/storage/sigListStorage.js

import { storage } from "../../resources/firestore/firebase";
import {
  ref,
  listAll,
  getDownloadURL,
  uploadBytes,
  deleteObject,
} from "firebase/storage";

/**
 * 추천 경로:
 * sigHunterLists/{program}/{fileName}
 *
 * program: 'muse' | 'queendom' | 'holic'
 */

const ALLOWED_PROGRAMS = new Set(["muse", "queendom", "holic"]);

function sanitizeFileName(fileName) {
  if (!fileName) return "";
  // 브라우저가 c:\fakepath\name.csv 같은 값을 주는 경우 대비
  const normalized = String(fileName).replace(/^.*[/\\]/, "");
  // 디렉터리 구분자 제거(우회 업로드 방지)
  // 예: "a/b.csv" -> "b.csv"
  const noSlashes = normalized.replace(/[/\\]/g, "");
  return noSlashes.trim();
}

function isAllowedExt(name) {
  const lower = String(name || "").toLowerCase();
  return (
    lower.endsWith(".csv") ||
    lower.endsWith(".xls") ||
    lower.endsWith(".xlsx")
  );
}

export function validateSigListFile(file) {
  const ok = file && file.name && isAllowedExt(file.name);
  if (!ok) {
    throw new Error("CSV/XLS/XLSX 파일만 업로드할 수 있습니다.");
  }
}

/**
 * 해당 program 폴더의 파일 목록 조회
 * 반환: [{ fileName, fullPath, url }]
 */
export async function listSigListFiles(program) {
  if (!ALLOWED_PROGRAMS.has(program)) {
    throw new Error(`Invalid program: ${program}`);
  }

  const folderRef = ref(storage, `sigHunterLists/${program}/`);
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

  // 보기 좋게 파일명 기준 정렬
  items.sort((a, b) => a.fileName.localeCompare(b.fileName));

  return items;
}

/**
 * 업로드
 * @param {string} program
 * @param {File} file
 * @param {{ desiredFileName?: string }} options
 */
export async function uploadSigListFile(program, file, options = {}) {
  if (!ALLOWED_PROGRAMS.has(program)) {
    throw new Error(`Invalid program: ${program}`);
  }

  validateSigListFile(file);

  const desiredFileName = options.desiredFileName
    ? sanitizeFileName(options.desiredFileName)
    : "";

  const finalFileName = desiredFileName || file.name;

  if (!isAllowedExt(finalFileName)) {
    throw new Error("저장 파일명은 CSV/XLS/XLSX 확장자를 포함해야 합니다.");
  }

  const fileRef = ref(
    storage,
    `sigHunterLists/${program}/${finalFileName}`
  );

  // 같은 이름이면 덮어쓰기(교체)됨
  await uploadBytes(fileRef, file);

  const url = await getDownloadURL(fileRef);

  return {
    fileName: finalFileName,
    fullPath: fileRef.fullPath,
    url,
  };
}

/**
 * 삭제
 * fullPath: 'sigHunterLists/{program}/{fileName}' 그대로 넘김
 */
export async function deleteSigListFile(fullPath) {
  const fileRef = ref(storage, fullPath);
  await deleteObject(fileRef);
}