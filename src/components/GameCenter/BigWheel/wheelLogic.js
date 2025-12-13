// src/components/GameCenter/BigWheel/wheelLogic.js

// 티어별 배경 그라데이션
export const TIER_GRADIENTS = {
  DIAMOND: "linear-gradient(180deg, #ffffff 0%, #f3f5ff 45%, #c7d2ff 100%)",
  EMERALD: "linear-gradient(180deg, #bdfbe1 0%, #16c784 45%, #0f7f55 100%)",
  SAPPHIRE: "linear-gradient(180deg, #dff3ff 0%, #8fd7ff 45%, #5ba1d8 100%)",
  RUBY: "linear-gradient(180deg, #ffd6f0 0%, #ff5fa9 45%, #c02f74 100%)",
  GOLD: "linear-gradient(180deg, #fff4c4 0%, #ffd556 45%, #e2a734 100%)",
  PEARL: "linear-gradient(180deg, #e5e7eb 0%, #e5e7eb 45%, #cbd5f5 100%)",
  BONUS: "linear-gradient(180deg, #ffc3c3 0%, #ff2f3b 45%, #b71119 100%)",
};

// 티어 텍스트 스타일
export const TIER_TEXT_STYLES = {
  DIAMOND: { color: "#3b3b3b", stroke: "#ffffff" },
  EMERALD: { color: "#ffffff", stroke: "#075a3b" },
  SAPPHIRE: { color: "#ffffff", stroke: "#2b4f73" },
  RUBY: { color: "#ffe0f0", stroke: "#9b1746" },
  GOLD: { color: "#000000", stroke: "#7a5013" },
  PEARL: { color: "#0f172a", stroke: "#e5e7eb" },
  BONUS: { color: "#ffe9a6", stroke: "#7f1d1d" },
};

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

// 🔹 티어별 칸 수를 기반으로 segments 생성 (셔플 포함)
export function generateSegmentsFromCounts(counts) {
  const entries = Object.entries(counts);
  const segments = [];
  let id = 0;

  for (const [tier, count] of entries) {
    const n = Number(count) || 0;
    for (let i = 0; i < n; i++) {
      const number = pickRandomMultiplier(tier);
      segments.push({ id: id++, tier, number });
    }
  }

  // Fisher–Yates 셔플
  for (let i = segments.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [segments[i], segments[j]] = [segments[j], segments[i]];
  }

  return segments;
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

  const wheelAngleAtPointer =
    (pointerAngleDeg - normalized + 360) % 360;

  // 경계에서 한 칸 밀림 방지(중앙 보정)
  const index = Math.floor(
    ((wheelAngleAtPointer + segmentAngle / 2) % 360) / segmentAngle
  );

  return ((index % segCount) + segCount) % segCount;
}