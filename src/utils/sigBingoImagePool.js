// src/utils/sigBingoImagePool.js
import { bingoImagePool } from "../data/sigBingoImagePool";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 단일 이미지 1장 랜덤
export function getRandomBingoImage(mode) {
  const list = bingoImagePool[mode] || [];
  if (!list.length) return "";
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

// 초기 보드용: count개 뽑기
export function getRandomBingoImages(mode, count) {
  const list = bingoImagePool[mode] || [];
  if (!list.length) return Array(count).fill("");

  if (list.length <= count) {
    return shuffle(list).slice(0, count);
  }
  return shuffle(list).slice(0, count);
}