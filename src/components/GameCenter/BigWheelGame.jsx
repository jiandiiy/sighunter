import React, { useState } from "react";

// 티어별 배경 그라데이션
const TIER_GRADIENTS = {
  DIAMOND: "linear-gradient(180deg, #ffffff 0%, #f3f5ff 45%, #c7d2ff 100%)",
  EMERALD: "linear-gradient(180deg, #bdfbe1 0%, #16c784 45%, #0f7f55 100%)",
  SAPPHIRE: "linear-gradient(180deg, #dff3ff 0%, #8fd7ff 45%, #5ba1d8 100%)",
  RUBY: "linear-gradient(180deg, #ffd6f0 0%, #ff5fa9 45%, #c02f74 100%)",
  GOLD: "linear-gradient(180deg, #fff4c4 0%, #ffd556 45%, #e2a734 100%)",
  PEARL: "linear-gradient(180deg, #e5e7eb 0%, #e5e7eb 45%, #cbd5f5 100%)",
  BONUS: "linear-gradient(180deg, #ffc3c3 0%, #ff2f3b 45%, #b71119 100%)",
};

// 티어 텍스트 스타일
const TIER_TEXT_STYLES = {
  DIAMOND: {
    color: "#3b3b3b",
    stroke: "#ffffff",
  },
  EMERALD: {
    color: "#ffffff",
    stroke: "#075a3b",
  },
  SAPPHIRE: {
    color: "#ffffff",
    stroke: "#2b4f73",
  },
  RUBY: {
    color: "#ffe0f0",
    stroke: "#9b1746",
  },
  GOLD: {
    color: "#000000",
    stroke: "#7a5013",
  },
  PEARL: {
    color: "#0f172a",
    stroke: "#e5e7eb",
  },
  BONUS: {
    color: "#ffe9a6",
    stroke: "#7f1d1d",
  },
};

// 가중치 (칸 수 기반 / segmentCount=54 기준 비율)
const TIER_WEIGHTS = [
  { tier: "DIAMOND",  weight: 1 },  // 1칸 - 28배
  { tier: "EMERALD",  weight: 1 },  // 1칸 - 18배
  { tier: "SAPPHIRE", weight: 4 },  // 4칸 - 9배
  { tier: "RUBY",     weight: 11 }, // 11칸 - 5배
  { tier: "GOLD",     weight: 18 }, // 18칸 - 3배
  { tier: "PEARL",    weight: 25 }, // 25칸 - 2배
  { tier: "BONUS",    weight: 1 },  // 1칸 - 보너스
];

// 티어별 배수 (고정 1개씩)
const TIER_MULTIPLIER_POOL = {
  DIAMOND:  [28],
  EMERALD:  [18],
  SAPPHIRE: [9],
  RUBY:     [5],
  GOLD:     [3],
  PEARL:    [2],
  BONUS:    [0], // 보너스는 별도 로직이 있으면 여기 값 바꾸거나 따로 처리
};

// 가중치 랜덤으로 티어 하나 뽑기
function pickTierByWeight(weights) {
  const total = weights.reduce((sum, w) => sum + w.weight, 0);
  const r = Math.random() * total;
  let acc = 0;
  for (const w of weights) {
    acc += w.weight;
    if (r <= acc) return w.tier;
  }
  return weights[weights.length - 1].tier;
}

// 티어에 맞는 배수 하나 랜덤 선택
function pickRandomMultiplier(tier) {
  const pool = TIER_MULTIPLIER_POOL[tier];
  if (!pool || pool.length === 0) return "1";
  const idx = Math.floor(Math.random() * pool.length);
  return String(pool[idx]);
}

// segmentCount 개수만큼 확률 기반으로 SEGMENTS 생성
function generateSegments(segmentCount = 54) {
  return Array.from({ length: segmentCount }, (_, i) => {
    const tier = pickTierByWeight(TIER_WEIGHTS);
    const number = pickRandomMultiplier(tier);
    return { id: i, tier, number };
  });
}

export default function CasinoWheelHuge() {
  const wheelSize = 1000;
  const segmentCount = 54;

  const [segments, setSegments] = useState(() =>
    generateSegments(segmentCount)
  );
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultIndex, setResultIndex] = useState(null);
  const [viewerTier, setViewerTier] = useState(null);

  const segmentAngle = 360 / segmentCount;
  const offsetAngle = segmentAngle / 2; // 반 칸 시프트
  const startOffset = 1; // 1칸 시계 방향으로 밀기

  const globalTilt = -3;

  const currentSeg = resultIndex != null ? segments[resultIndex] : null;
  const viewerHit =
    currentSeg && viewerTier && currentSeg.tier === viewerTier;

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);

    const targetIndex = Math.floor(Math.random() * segmentCount);
    const extraTurns = 4 + Math.floor(Math.random() * 3);
    const targetAngle =
      extraTurns * 360 +
      (360 -
        ((targetIndex + startOffset) * segmentAngle +
          segmentAngle / 2 +
          offsetAngle));

    setRotation((prev) => prev + targetAngle);

    setTimeout(() => {
      setIsSpinning(false);
      setResultIndex(targetIndex);
    }, 5000);
  };

  // 휠 재구성
  const regenerateWheel = () => {
    if (isSpinning) return;
    setSegments(generateSegments(segmentCount));
    setResultIndex(null);
    setRotation(0);
  };

  // 시청자 선택용 티어 목록 (새 티어로 교체)
  const selectableTiers = [
    "DIAMOND",
    "EMERALD",
    "SAPPHIRE",
    "RUBY",
    "GOLD",
    "PEARL",
    "BONUS",
  ];

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: 20,
      }}
    >
      <div
        style={{
          borderRadius: 40,
          padding: 40,
          background:
            "radial-gradient(circle at top, #7c2d12, #0f172a 70%)",
          boxShadow:
            "0 60px 160px rgba(0,0,0,0.95), 0 0 80px rgba(0,0,0,0.9)",
        }}
      >
        <h2
          style={{
            margin: "0 0 20px",
            fontSize: 40,
            fontWeight: 900,
            color: "#fef9c3",
            textShadow: "0 0 24px rgba(250,204,21,0.9)",
            textAlign: "center",
          }}
        >
          BIG WHEEL
        </h2>

        {/* 시청자 티어 선택 */}
        <div
          style={{
            marginBottom: 16,
            textAlign: "center",
            fontSize: 15,
          }}
        >
          <span style={{ marginRight: 8 }}>시청자가 고른 티어(테스트):</span>
          {selectableTiers.map((t) => (
            <button
              key={t}
              onClick={() => setViewerTier(t)}
              style={{
                margin: "0 4px",
                padding: "6px 14px",
                borderRadius: 999,
                border:
                  viewerTier === t
                    ? "2px solid #facc15"
                    : "1px solid #4b5563",
                background:
                  viewerTier === t ? "#1f2937" : "#020617",
                color: "#e5e7eb",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* 휠 재구성 버튼 */}
        <div
          style={{
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          <button
            onClick={regenerateWheel}
            disabled={isSpinning}
            style={{
              padding: "8px 20px",
              borderRadius: 999,
              border: "2px solid #93c5fd",
              background: "#1d283a",
              color: "#bfdbfe",
              fontWeight: 700,
              fontSize: 14,
              cursor: isSpinning ? "not-allowed" : "pointer",
              opacity: isSpinning ? 0.6 : 1,
            }}
          >
            🔄 휠 재구성
          </button>
        </div>

        {/* 포인터 + 휠 */}
        <div
          style={{
            position: "relative",
            width: wheelSize + 80,
            height: wheelSize + 140,
          }}
        >
          {/* 포인터 (고정) */}
          <div
            style={{
              position: "absolute",
              top: "5%",
              left: "52%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "32px solid transparent",
              borderRight: "32px solid transparent",
              borderBottom: "60px solid #fbbf24",
              filter:
                "drop-shadow(0 0 18px rgba(251,191,36,0.95)) drop-shadow(0 0 40px rgba(252,211,77,0.9))",
              zIndex: 30,
            }}
          />

          {/* 휠 본체 */}
          <div
            style={{
              width: wheelSize,
              height: wheelSize,
              borderRadius: "50%",
              position: "relative",
              top: 70,
              left: 40,
            }}
          >
            {/* 회전하는 부분 */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning
                  ? "transform 5s cubic-bezier(0.12, 0.8, 0.2, 1)"
                  : "none",
              }}
            >
              {/* 1) 맨 바깥 갈색 링 */}
              <div
                style={{
                  position: "absolute",
                  inset: "-2%",
                  borderRadius: "50%",
                  background:
                    "conic-gradient(from 0deg, #92400e, #78350f, #92400e, #78350f)",
                  boxShadow:
                    "0 0 80px rgba(0,0,0,1), inset 0 0 30px rgba(0,0,0,0.7)",
                }}
              />

              {/* 금색 점 */}
              {segments.map((_, i) => {
                const angle =
                  (i + startOffset) * segmentAngle +
                  offsetAngle +
                  globalTilt;
                return (
                  <div
                    key={`dot-${i}`}
                    style={{
                      position: "absolute",
                      top: "49%",
                      left: "49%",
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background:
                        "radial-gradient(circle at 30% 30%, #fef3c7, #d97706)",
                      boxShadow:
                        "0 0 14px rgba(251,191,36,0.95)",
                      transform: `rotate(${angle}deg) translateY(-490px) translateX(-12px)`,
                    }}
                  />
                );
              })}

              {/* 2) 숫자 원 링 */}
              <div
                style={{
                  position: "absolute",
                  inset: "3.5%",
                  borderRadius: "50%",
                  background: "#020617",
                  width: "93%",
                  height: "93%",
                  left: "3.5%",
                  top: "3.5%",
                }}
              >
            {segments.map((seg, i) => {
  const angle =
    (i + startOffset) * segmentAngle +
    offsetAngle +
    globalTilt;
  const midAngle = angle + segmentAngle / 2;

  const num = seg.number;
  const isSpecial =
    num === "28" || num === "18" || num === "9";

  const size = 40;

  // 🔥 티어 링보다 바깥쪽에 위치시키기 위해 반지름을 더 크게 잡기
  // 티어 baseRadius = wheelSize * 0.19
  const numberRadius = wheelSize * 0.43; // 0.22~0.25 사이에서 조정해보면 됨

  return (
    <div
      key={`outer-${i}`}
      style={{
        position: "absolute",
        top: "52%",
        left: "50%",
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        borderRadius: "50%",
        background: isSpecial
          ? "radial-gradient(circle at 30% 30%, #ef4444, #7f1d1d)"
          : "radial-gradient(circle at 30% 30%, #e5e7eb, #6b7280)",
        border: "3px solid #020617",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 26,
        fontWeight: 900,
        color: "#020617",
        textShadow: "0 0 3px rgba(255,255,255,0.7)",

        // 위치만 회전 + 바깥으로 이동
        // 🔥 숫자 원도 휠과 똑같은 각도로 회전 + 바깥쪽으로 이동
          transformOrigin: "50% 0%",
          transform: `rotate(${angle}deg) translateX(${numberRadius}px)`,
          boxShadow: "0 0 14px rgba(0,0,0,0.9)",
          zIndex: 12,
      }}
    >
      <span
        style={{
          display: "inline-block",
           // angle 만큼 회전한 것을 되돌리고, 기본이 아래를 보고 있으니 +90 보정
            transform: `rotate(${-angle}deg)`,
        }}
      >
        {num}
      </span>
                    </div>
                  );
                })}
              </div>

              {/* 3) 안쪽 티어 링 */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  pointerEvents: "none",
                }}
              >
                {segments.map((seg, i) => {
                  const angle =
                    (i + startOffset) * segmentAngle +
                    offsetAngle +
                    globalTilt;
                  const midAngle = angle + segmentAngle / 2;
                  const color = TIER_GRADIENTS[seg.tier];

                  const baseLength = wheelSize * 0.29;
                  const baseThickness = wheelSize * 0.07;
                  const baseRadius = wheelSize * 0.19;

                  const radius = baseRadius;
                  const z = 10;

                  return (
                    <div
                      key={`inner-${i}`}
                      style={{
                        position: "absolute",
                        top: "47.5%",
                        left: "50.7%",
                        width: baseLength,
                        height: baseThickness,
                        transformOrigin: "-2% 30%",
                        transform: `rotate(${midAngle}deg) translateX(${radius}px)`,
                        zIndex: z,
                      }}
                    >
                      {/* 색 칸 */}
                      <div
                        style={{
                          width: "70%",
                          height: "70%",
                          background: color,
                          clipPath:
                            "polygon(0% 15%, 100% 0%, 100% 100%, 0% 80%)",
                          borderLeft:
                            "1px solid rgba(15,23,42,0.9)",
                          borderRight:
                            "1px solid rgba(15,23,42,0.9)",
                        }}
                      />

                      {/* 티어 텍스트 */}
                      <div
                        style={{
                          position: "absolute",
                          top: "35%",
                          left: "40%",
                          transform: "translate(-50%, -60%)",
                          pointerEvents: "none",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 24,
                            fontWeight: 900,
                            whiteSpace: "nowrap",
                            letterSpacing: 0.3,
                            color:
                              TIER_TEXT_STYLES[seg.tier].color,
                            textShadow: `
                              0 0 3px rgba(0,0,0,0.9),
                              -1px -1px 0 ${
                                TIER_TEXT_STYLES[seg.tier].stroke
                              },
                              1px -1px 0 ${
                                TIER_TEXT_STYLES[seg.tier].stroke
                              },
                              -1px 1px 0 ${
                                TIER_TEXT_STYLES[seg.tier].stroke
                              },
                              1px 1px 0 ${
                                TIER_TEXT_STYLES[seg.tier].stroke
                              }
                            `,
                          }}
                        >
                          {seg.tier}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 고정되는 중앙 결과 원 */}
            <div
              style={{
                position: "absolute",
                inset: "30%",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 30% 30%, #1f2937, #020617 70%)",
                border: "5px solid #fef3c7",
                boxShadow:
                  "0 0 40px rgba(254,243,199,0.95), inset 0 0 26px rgba(0,0,0,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: 30,
                zIndex: 10,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 20,
                    letterSpacing: 2,
                    color: "#fbbf24",
                    fontWeight: 700,
                    marginBottom: 10,
                  }}
                >
                  {isSpinning
                    ? "SPINNING..."
                    : currentSeg
                    ? "RESULT"
                    : "READY"}
                </div>
                <div
                  style={{
                    fontSize: 60,
                    fontWeight: 900,
                    color: "#f9fafb",
                    textShadow:
                      "0 0 18px rgba(255,255,255,0.9)",
                    marginBottom: 8,
                  }}
                >
                  {isSpinning
                    ? "??"
                    : currentSeg
                    ? currentSeg.tier
                    : "버튼을 눌러주세요"}
                </div>
                {currentSeg && !isSpinning && (
                  <div
                    style={{
                      fontSize: 50,
                      color: "#fde68a",
                      fontWeight: 800,
                    }}
                  >
                    × {currentSeg.number}
                  </div>
                )}
                {viewerTier && !isSpinning && currentSeg && (
                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 18,
                      fontWeight: 700,
                      color: viewerHit ? "#4ade80" : "#fca5a5",
                    }}
                  >
                    {viewerHit
                      ? "적은 티어와 일치! 당첨 🎉"
                      : "적은 티어와 불일치"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SPIN 버튼 */}
        <div
          style={{
            marginTop: 26,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button
            onClick={spin}
            disabled={isSpinning}
            style={{
              padding: "16px 46px",
              borderRadius: 999,
              border: "3px solid #fef3c7",
              background:
                "linear-gradient(145deg,#f97316,#fbbf24)",
              color: "#111827",
              fontWeight: 900,
              fontSize: 24,
              cursor: isSpinning ? "not-allowed" : "pointer",
              opacity: isSpinning ? 0.6 : 1,
              boxShadow:
                "0 0 38px rgba(251,191,36,0.95), 0 0 64px rgba(248,113,113,0.9)",
              transition: "all 0.3s",
            }}
          >
            {isSpinning ? "SPINNING..." : "🎰 SPIN THE WHEEL"}
          </button>
        </div>

        {/* 하단 결과 요약 */}
        {currentSeg && !isSpinning && (
          <div
            style={{
              marginTop: 16,
              textAlign: "center",
              fontSize: 18,
              color: "#fef9c3",
            }}
          >
            결과 티어: <b>{currentSeg.tier}</b> ×{" "}
            <b>{currentSeg.number}</b>{" "}
            {viewerTier && (
              <>
                / 시청자 선택: <b>{viewerTier}</b>{" "}
                {viewerHit ? "→ 당첨!" : "→ 꽝"}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}