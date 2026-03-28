// src/shared/utils/getSigCountFromPool.js
import { sigHunterImagePool } from "../data/sigHunterImagePool";

// 이미지 경로(/images/muse/group01/sig_199.webp) → count 숫자
export const getSigCountFromPool = (imagePath) => {
  if (!imagePath) return null;

  // 쿼리 스트링 붙어 있을 수도 있으니 제거
  const purePath = imagePath.split("?")[0];

  // mode 계층을 모르는 상태에서 전체 풀 탐색
  for (const modeKey of Object.keys(sigHunterImagePool)) {
    const modeGroups = sigHunterImagePool[modeKey];
    for (const groupKey of Object.keys(modeGroups)) {
      const list = modeGroups[groupKey];
      const found = list.find((item) => item.path === purePath);
      if (found) return found.count;
    }
  }

  return null;
};