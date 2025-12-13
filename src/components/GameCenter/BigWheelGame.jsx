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
function pickRandomMultiplier(tier) {
  const pool = TIER_MULTIPLIER_POOL[tier];
  if (!pool || pool.length === 0) return "1";
  const idx = Math.floor(Math.random() * pool.length);
  return String(pool[idx]);
}

// 🔹 티어별 칸 수를 기반으로 segments 생성 (셔플 포함)
function generateSegmentsFromCounts(counts) {
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

// 🔹 우측 패널 하단: 총 칸수 + 적용 버튼
function TierCountsFooter({ tierCounts, onApply }) {
  const total = Object.values(tierCounts).reduce(
    (sum, v) => sum + (Number(v) || 0),
    0
  );

  return (
    <div style={{ marginTop: 8 }}>
      <div
        style={{
          fontSize: 12,
          color: "#9ca3af",
          marginBottom: 8,
        }}
      >
        총 칸 수:{" "}
        <span style={{ color: "#facc15", fontWeight: 700 }}>
          {total}
        </span>
      </div>
      <button
        type="button"
        onClick={onApply}
        style={{
          width: "100%",
          padding: "6px 10px",
          borderRadius: 999,
          border: "1px solid #22c55e",
          background: "linear-gradient(135deg,#16a34a,#22c55e)",
          color: "#0f172a",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        이 칸 수로 휠 다시 생성
      </button>
    </div>
  );
}

export default function CasinoWheelHuge() {
  const wheelSize = 1000;

  // 🔹 티어별 칸 수 상태
  const [tierCounts, setTierCounts] = useState({
    DIAMOND: 1,
    EMERALD: 1,
    SAPPHIRE: 4,
    RUBY: 11,
    GOLD: 18,
    PEARL: 25,
    BONUS: 1,
  });

  const [segments, setSegments] = useState(() =>
    generateSegmentsFromCounts(tierCounts)
  );
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultIndex, setResultIndex] = useState(null);
  const [viewerTier, setViewerTier] = useState(null);
  const [viewerSigCount, setViewerSigCount] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const segmentCount = segments.length || 1;
  const segmentAngle = 360 / segmentCount;

  const currentSeg = resultIndex != null ? segments[resultIndex] : null;
  const viewerHit =
    currentSeg && viewerTier && currentSeg.tier === viewerTier;

  const parsedSig = Number(viewerSigCount) || 0;
  const parsedMultiplier = currentSeg ? Number(currentSeg.number) || 0 : 0;
  const totalSig = parsedSig * parsedMultiplier;

  // 포인터는 0deg 를 가리키고, index i 의 중앙은 i * segmentAngle 로 맞춘다
const spin = () => {
  if (isSpinning || segments.length === 0) return;
  setIsSpinning(true);

  const extraTurns = 4 + Math.floor(Math.random() * 3);
  const randomOffset = Math.random() * 360; // 0~360
  const targetAngle = extraTurns * 360 + randomOffset;

  setRotation((prev) => prev + targetAngle);

  setTimeout(() => {
    setIsSpinning(false);

    setRotation((prevFinal) => {
      const normalized = ((prevFinal % 360) + 360) % 360;

      const segmentCount = segments.length || 1;
      const segmentAngle = 360 / segmentCount;

      // ✅ 포인터가 화면 "위(12시)"를 가리키는 각도
      const POINTER_ANGLE = 0;

      // 포인터가 휠에서 가리키는 실제 각도
      const wheelAngleAtPointer =
        (POINTER_ANGLE - normalized + 360) % 360;

      // 경계에서 한 칸 밀림 방지: 반 칸(중앙) 보정
      const index = Math.floor(
        ((wheelAngleAtPointer + segmentAngle / 2) % 360) /
          segmentAngle
      );

      setResultIndex(index);
      return normalized;
    });
  }, 5000);
};
  

  const regenerateWheel = () => {
    if (isSpinning) return;
    setSegments(generateSegmentsFromCounts(tierCounts));
    setResultIndex(null);
    setRotation(0);
  };

  const handleCopyResult = async () => {
    if (!currentSeg || isSpinning) return;
    const valueToCopy = String(totalSig);

    try {
      await navigator.clipboard.writeText(valueToCopy);
      setCopyMessage("복사됨!");
      setTimeout(() => setCopyMessage(""), 1500);
    } catch (e) {
      setCopyMessage("복사 실패");
      setTimeout(() => setCopyMessage(""), 1500);
    }
  };

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
          display: "flex",
          gap: 32,
        }}
      >
        {/* 🔹 왼쪽: 휠 영역 전체 */}
        <div style={{ flex: "0 0 auto" }}>
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
              marginBottom: 8,
              textAlign: "center",
              fontSize: 15,
            }}
          >
            <span style={{ marginRight: 8 }}>
              시청자가 고른 티어(테스트):
            </span>
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

          {/* 시그 개수 입력 */}
          <div
            style={{
              marginBottom: 16,
              textAlign: "center",
              fontSize: 15,
            }}
          >
            <span style={{ marginRight: 8 }}>시청자 시그 개수:</span>
            <input
              type="number"
              min="0"
              value={viewerSigCount}
              onChange={(e) => setViewerSigCount(e.target.value)}
              style={{
                width: 120,
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid #4b5563",
                background: "#020617",
                color: "#e5e7eb",
                textAlign: "right",
              }}
              placeholder="예: 100"
            />
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
            {/* 포인터 (위쪽을 향함, 0deg 기준) */}
            <div
              style={{
                position: "absolute",
                top: "4.5%",
                left: "51.5%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "20px solid transparent",
                borderRight: "20px solid transparent",
                borderTop: "50px solid #fbbf24",
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
                {/* 바깥 갈색 링 */}
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
                  const angle = i * segmentAngle - 90;
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

                {/* 숫자 원 링 */}
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
                    const angle = i * segmentAngle - 90;  // 🔸위쪽 기준으로 회전 보정
                    const num = seg.number;
                    const isSpecial =
                      num === "28" || num === "18" || num === "9";
                    const size = 40;
                    const numberRadius = wheelSize * 0.43;

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
                          textShadow:
                            "0 0 3px rgba(255,255,255,0.7)",
                          transformOrigin: "50% 0%",
                          transform: `rotate(${angle}deg) translateX(${numberRadius}px)`,
                          boxShadow: "0 0 14px rgba(0,0,0,0.9)",
                          zIndex: 12,
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            transform: `rotate(${-angle}deg)`,
                          }}
                        >
                          {num}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* 안쪽 티어 링 */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    pointerEvents: "none",
                  }}
                >
                  {segments.map((seg, i) => {
                    const angle = i * segmentAngle - 90;
                    const midAngle = angle + segmentAngle / 2;
                    const color = TIER_GRADIENTS[seg.tier];

                    const baseLength = wheelSize * 0.29;
                    const baseThickness = wheelSize * 0.07;
                    const baseRadius = wheelSize * 0.19;

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
                          transform: `rotate(${midAngle}deg) translateX(${baseRadius}px)`,
                          zIndex: 10,
                        }}
                      >
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

              {/* 중앙 결과 원 */}
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
                      ? "결과"
                      : "시작"}
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

                  {/* 배수 표시 */}
                  {currentSeg && !isSpinning && (
                    <div
                      style={{
                        fontSize: 34,
                        color: "#fde68a",
                        fontWeight: 800,
                        marginBottom: 6,
                      }}
                    >
                      × {currentSeg.number}
                    </div>
                  )}

                  {/* 시그 × 배수 = 총 시그 */}
                  {currentSeg && !isSpinning && parsedSig > 0 && (
                    <div
                      style={{
                        fontSize: 20,
                        color: "#e5e7eb",
                        fontWeight: 700,
                        marginTop: 4,
                      }}
                    >
                      {parsedSig.toLocaleString()} ×{" "}
                      {parsedMultiplier} ={" "}
                      <span style={{ color: "#facc15" }}>
                        {totalSig.toLocaleString()}
                      </span>
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
              <div>
                결과 티어: <b>{currentSeg.tier}</b> ×{" "}
                <b>{currentSeg.number}</b>
                {viewerTier && (
                  <>
                    {" "}
                    / 시청자 선택: <b>{viewerTier}</b>{" "}
                    {viewerHit ? "→ 당첨!" : "→ 꽝"}
                  </>
                )}
              </div>

              {parsedSig > 0 && (
                <div style={{ marginTop: 4, fontSize: 16 }}>
                  {parsedSig.toLocaleString()} × {parsedMultiplier} ={" "}
                  <b style={{ color: "#facc15" }}>
                    {totalSig.toLocaleString()}
                  </b>
                </div>
              )}

              {/* 결과 복사 버튼 */}
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={handleCopyResult}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 999,
                    border: "1px solid #4b5563",
                    background: "#020617",
                    color: "#e5e7eb",
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  결과 복사
                </button>
                {copyMessage && (
                  <span
                    style={{
                      fontSize: 13,
                      color:
                        copyMessage === "복사됨!"
                          ? "#4ade80"
                          : "#f87171",
                    }}
                  >
                    {copyMessage}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 🔹 오른쪽: 티어별 칸 수 설정 패널 */}
        <div
          style={{
            width: 260,
            background: "rgba(15,23,42,0.85)",
            borderRadius: 24,
            padding: 18,
            border: "1px solid rgba(148,163,184,0.4)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#e5e7eb",
              marginBottom: 4,
            }}
          >
            티어별 칸 수 설정
          </div>

          {Object.keys(TIER_GRADIENTS).map((tier) => (
            <div
              key={tier}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "6px 8px",
                borderRadius: 12,
                background: "rgba(15,23,42,0.9)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    background: TIER_GRADIENTS[tier],
                    border: "1px solid rgba(15,23,42,0.8)",
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#e5e7eb",
                  }}
                >
                  {tier}
                </span>
              </div>

              <input
                type="number"
                min="0"
                value={tierCounts[tier] ?? 0}
                onChange={(e) => {
                  const v = e.target.value;
                  setTierCounts((prev) => ({
                    ...prev,
                    [tier]: v === "" ? "" : Math.max(0, Number(v) || 0),
                  }));
                }}
                style={{
                  width: 72,
                  padding: "4px 8px",
                  borderRadius: 999,
                  border: "1px solid #4b5563",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: 12,
                  textAlign: "right",
                }}
              />
            </div>
          ))}

          <TierCountsFooter
            tierCounts={tierCounts}
            onApply={() => {
              if (isSpinning) return;
              setSegments(generateSegmentsFromCounts(tierCounts));
              setResultIndex(null);
              setRotation(0);
            }}
          />
        </div>
      </div>
    </div>
  );
}