// src/api/sigHunterBingoStorage.js
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

/**
 * 특정 보드/셀에 대한 이미지 파일 업로드
 * @param {string} boardId  - 예: "hunter-main"
 * @param {string} mode     - 예: "normal" | "hard"
 * @param {number} size     - 예: 5 (5x5)
 * @param {string|number} cellId   - 예: "r0c0", "0", 0
 * @param {File} file       - <input type="file">로 받은 File 객체
 * @returns {Promise<string>} 다운로드 URL 반환
 */
export async function uploadCellImage(boardId, mode, size, cellId, file) {
  const timestamp = Date.now();
  const ext = file.name.split(".").pop() || "png";
  const fileName = `${timestamp}.${ext}`;

  // 예: sigHunterBingo/hunter-main-muse-5/0/1700000000000.png
  const boardKey = `${boardId}-${mode}-${size}`;
  const storagePath = `sigHunterBingo/${boardKey}/${cellId}/${fileName}`;
  const storageRef = ref(storage, storagePath);

  // 업로드
  await uploadBytes(storageRef, file);

  // 다운로드 URL 획득
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}