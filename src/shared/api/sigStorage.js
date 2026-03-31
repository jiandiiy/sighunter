// src/api/sigStorage.js
import { storage } from "../core/firebase";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

/**
 * 시그 이미지 업로드
 * @param {File} file - 업로드할 이미지 파일
 * @param {Object} options
 * @param {string} options.gameType - "meal-bingo" | "sighunter-bingo" | "sighunter"
 * @param {string} options.mode     - "muse" | "queendom"
 * @param {string} options.rarity   - "normal" | "special"
 * @param {number|string} options.boardIndex - (식대전 빙고 전용) 1/2/3
 * @param {number|string} options.slotIndex  - 칸 번호
 * @param {(progress: number) => void} [onProgress] - 진행률 콜백
 * @returns {Promise<{downloadURL: string, storagePath: string}>}
 */
export function uploadSigImageToStorage(
  file,
  { gameType, mode, rarity, boardIndex, slotIndex },
  onProgress
) {
  // Storage 경로 규칙 예시:
  // images/meal-bingo/queendom/normal/board-1/slot-3_파일이름.png
  const safeBoard = boardIndex ? `board-${boardIndex}` : "board-0";
  const safeSlot = `slot-${slotIndex}`;
  const fileName = file.name.replace(/\s+/g, "_"); // 공백 제거 정도만
  const storagePath = `images/${gameType}/${mode}/${rarity}/${safeBoard}/${safeSlot}_${fileName}`;

  const fileRef = ref(storage, storagePath);
  const task = uploadBytesResumable(fileRef, file);

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        if (!onProgress) return;
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(task.snapshot.ref);
        resolve({ downloadURL, storagePath });
      }
    );
  });
}

/**
 * Storage 에서 시그 이미지 삭제
 * @param {string} storagePath - Firestore 에 저장해둔 storagePath 그대로
 */
export async function deleteSigImageFromStorage(storagePath) {
  if (!storagePath) return;
  const fileRef = ref(storage, storagePath);
  await deleteObject(fileRef);
}