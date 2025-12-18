// src/components/GameCenter/BigWheel/wheelLogic.js


// 배경은 전부 흰색 고정
export const SEGMENT_BG = "#ffffff";

// 구분선(칸 라인)
export const SEGMENT_STROKE = "#000";
export const SEGMENT_STROKE_WIDTH = 2;

// 텍스트 그라데이션 “정의”
export const TIER_TEXT_GRADIENTS = {
  DIAMOND: ["#B9F2FF", "#6B7CFF", "#1E3A8A"],
  EMERALD: ["#BDFBE1", "#16C784", "#0F7F55"],
  SAPPHIRE: ["#DFF3FF", "#3498DB", "#2B4F73"],
  RUBY: ["#FF7AB6", "#FF2F8E", "#9B1746"],
  GOLD: ["#FFF3A3", "#E2A734", "#7A5013"],
  PEARL: ["#F8FAFC", "#94A3B8", "#334155"],
  BONUS: ["#FFC3C3", "#FF2F3B", "#7F1D1D"],
};

// ✅ 세그먼트 생성에서 사용할 티어 목록(여기서 파생)  
export const TIERS = Object.keys(TIER_TEXT_GRADIENTS);  

// 티어별 배수 (고정 1개씩)
const TIER_MULTIPLIER_POOL = {
  DIAMOND: [28],
  EMERALD: [18],
  SAPPHIRE: [9],
  RUBY: [5],
  GOLD: [3],
  PEARL: [2],
  BONUS: [0],
};

// 티어에 맞는 배수 하나 랜덤 선택
export function pickRandomMultiplier(tier) {
  const pool = TIER_MULTIPLIER_POOL[tier];
  if (!pool || pool.length === 0) return "1";
  const idx = Math.floor(Math.random() * pool.length);
  return String(pool[idx]);
}

// ✅ 포인터 방향(각도)과 회전값으로 결과 인덱스 계산
// CSS rotate 기준: 오른쪽=0, 아래=90, 왼쪽=180, 위=270
export function getIndexAtPointer({
  rotationDeg,
  segmentCount,
  pointerAngleDeg,
}) {
  const normalized = ((rotationDeg % 360) + 360) % 360;
  const segCount = segmentCount || 1;
  const segmentAngle = 360 / segCount;

  const wheelAngleAtPointer = (pointerAngleDeg - normalized + 360) % 360;

  const index = Math.floor(
    ((wheelAngleAtPointer + segmentAngle / 2) % 360) / segmentAngle
  );

  return ((index % segCount) + segCount) % segCount;
}

/* ------------------------------------------------------------------
   ✅ tierCounts 기반 섞기 생성 (요청 기능)
   - tierCounts에 있는 모든 티어를 각 개수만큼 넣고 섞음
   - avoidAdjacent=true면 원형 인접(마지막-첫번째 포함) 같은 티어를 최소화
------------------------------------------------------------------- */

export function generateSegmentsFromCountsMixed(tierCounts, options = {}) {
  const { avoidAdjacent = true, maxTries = 200 } = options;

  // ✅ 기존 코드의 TIER_GRADIENTS 의존 제거
  const tiers = TIERS;

  // 1) bag 만들기
  const bag = [];
  for (const t of tiers) {
    const c = Math.max(0, Number(tierCounts?.[t]) || 0);
    for (let i = 0; i < c; i++) bag.push(t);
  }
  if (bag.length === 0) return [];

  const shuffleInPlace = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const countCircularViolations = (arr) => {
    const n = arr.length;
    if (n <= 1) return 0;
    let v = 0;
    for (let i = 0; i < n; i++) {
      if (arr[i] === arr[(i + 1) % n]) v++;
    }
    return v;
  };

  // 2) 여러 번 시도해서 인접 중복 최소인 후보 선택
  let best = null;
  let bestV = Infinity;
  const tries = avoidAdjacent ? maxTries : 1;

  for (let k = 0; k < tries; k++) {
    const candidate = shuffleInPlace([...bag]);
    const v = avoidAdjacent ? countCircularViolations(candidate) : 0;

    if (v < bestV) {
      bestV = v;
      best = candidate;
      if (bestV === 0) break;
    }
  }

  // 3) segments로 변환
  return best.map((tier, idx) => ({
    id: idx,
    tier,
    number: pickRandomMultiplier(tier),
  }));
}