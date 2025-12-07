import React, { useState } from "react";

const TIER_COLORS = {
  SILVER: "#60a5fa",
  GOLD: "#fbbf24",
  EMERALD: "#a855f7",
  DIAMOND: "#c7d2fe",
  CRYSTAL: "#ec4899",
  JOKER: "#dc2626",
  MEGA: "#1e3a8a",
};

// 54칸 패턴
const SEGMENTS = [
  { id: 0,  number: "1",  tier: "SILVER" },
  { id: 1,  number: "2",  tier: "GOLD" },
  { id: 2,  number: "1",  tier: "SILVER" },
  { id: 3,  number: "5",  tier: "EMERALD" },
  { id: 4,  number: "2",  tier: "SILVER" },
  { id: 5,  number: "1",  tier: "GOLD" },
  { id: 6,  number: "1",  tier: "SILVER" },
  { id: 7,  number: "2",  tier: "SILVER" },
  { id: 8,  number: "5",  tier: "GOLD" },
  { id: 9,  number: "1",  tier: "SILVER" },
  { id: 10, number: "2",  tier: "SILVER" },
  { id: 11, number: "10", tier: "DIAMOND" },

  { id: 12, number: "1",  tier: "SILVER" },
  { id: 13, number: "2",  tier: "GOLD" },
  { id: 14, number: "1",  tier: "SILVER" },
  { id: 15, number: "5",  tier: "GOLD" },
  { id: 16, number: "2",  tier: "SILVER" },
  { id: 17, number: "1",  tier: "EMERALD" },
  { id: 18, number: "1",  tier: "SILVER" },
  { id: 19, number: "2",  tier: "SILVER" },
  { id: 20, number: "5",  tier: "GOLD" },
  { id: 21, number: "1",  tier: "SILVER" },
  { id: 22, number: "2",  tier: "SILVER" },
  { id: 23, number: "7",  tier: "CRYSTAL" },

  { id: 24, number: "1",  tier: "SILVER" },
  { id: 25, number: "2",  tier: "GOLD" },
  { id: 26, number: "1",  tier: "SILVER" },
  { id: 27, number: "5",  tier: "EMERALD" },
  { id: 28, number: "2",  tier: "SILVER" },
  { id: 29, number: "1",  tier: "GOLD" },
  { id: 30, number: "1",  tier: "SILVER" },
  { id: 31, number: "2",  tier: "SILVER" },
  { id: 32, number: "5",  tier: "GOLD" },
  { id: 33, number: "1",  tier: "SILVER" },
  { id: 34, number: "2",  tier: "SILVER" },
  { id: 35, number: "40", tier: "JOKER" },

  { id: 36, number: "2",  tier: "SILVER" },
  { id: 37, number: "5",  tier: "GOLD" },
  { id: 38, number: "1",  tier: "SILVER" },
  { id: 39, number: "2",  tier: "EMERALD" },
  { id: 40, number: "1",  tier: "SILVER" },
  { id: 41, number: "5",  tier: "GOLD" },
  { id: 42, number: "1",  tier: "SILVER" },
  { id: 43, number: "2",  tier: "SILVER" },
  { id: 44, number: "10", tier: "MEGA" },
  { id: 45, number: "1",  tier: "GOLD" },
  { id: 46, number: "2",  tier: "SILVER" },
  { id: 47, number: "5",  tier: "CRYSTAL" },

  { id: 48, number: "1",  tier: "SILVER" },
  { id: 49, number: "2",  tier: "GOLD" },
  { id: 50, number: "1",  tier: "SILVER" },
  { id: 51, number: "5",  tier: "EMERALD" },
  { id: 52, number: "2",  tier: "SILVER" },
  { id: 53, number: "7",  tier: "JOKER" },
];

export default function CasinoWheelHuge() {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultIndex, setResultIndex] = useState(null);
  const [viewerTier, setViewerTier] = useState(null);

  const segmentCount = SEGMENTS.length; // 54
  const segmentAngle = 360 / segmentCount;
  const currentSeg =
    resultIndex != null ? SEGMENTS[resultIndex] : null;
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
        (targetIndex * segmentAngle + segmentAngle / 2));

    setRotation((prev) => prev + targetAngle);

    setTimeout(() => {
      setIsSpinning(false);
      setResultIndex(targetIndex);
    }, 5000);
  };

  // 휠 지름 크게 (1000)
  const wheelSize = 1000;

  const wheelStyle = {
    width: wheelSize,
    height: wheelSize,
    borderRadius: "50%",
    position: "relative",
    transform: `rotate(${rotation}deg)`,
    transition: isSpinning
      ? "transform 5s cubic-bezier(0.12, 0.8, 0.2, 1)"
      : "none",
  };

  const selectableTiers = [
    "SILVER",
    "GOLD",
    "EMERALD",
    "DIAMOND",
    "CRYSTAL",
    "JOKER",
    "MEGA",
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

        {/* 시청자 티어 선택 (테스트용) */}
        <div
          style={{
            marginBottom: 20,
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

        {/* 포인터 + 휠 */}
        <div
          style={{
            position: "relative",
            width: wheelSize + 80,
            height: wheelSize + 140,
          }}
        >
          {/* 포인터 */}
          <div
            style={{
              position: "absolute",
              top: 14,
              left: "50%",
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
          <div style={wheelStyle}>
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

            {/* 금색 점 54개 */}
            {SEGMENTS.map((_, i) => {
              const angle = i * segmentAngle;
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
                inset: "3%",
                borderRadius: "50%",
                background: "#020617",
                width: "94%",
                height: "94%",
                 left: "3%",
                 top: "3%",
              }}
            >
              {SEGMENTS.map((seg, i) => {
                const angle = i * segmentAngle;
                const num = seg.number;
                const isSpecial =
                  num === "40" || num === "7";

                return (
                  <div
                    key={`outer-${i}`}
                    style={{
                      position: "absolute",
                      top: "47%",
                      left: "47%",
                      width: 44,
                      height: 44,
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
                      transform: `rotate(${angle}deg) translateY(-420px) translateX(-40px)`,
                      boxShadow:
                        "0 0 14px rgba(0,0,0,0.9)",
                    }}
                  >
                    <span
                      style={{
                        transform: `rotate(${-angle}deg)`,
                        display: "inline-block",
                      }}
                    >
                      {num}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 3) 안쪽 티어 직사각형 링 – 훨씬 두껍게, 글씨 크게 */}
            <div
              style={{
                position: "absolute",
                inset: "12%", // 숫자 링보다 안쪽
                borderRadius: "50%",
                overflow: "hidden",
                background: "#020617",
              }}
            >
              {SEGMENTS.map((seg, i) => {
                const angle = i * segmentAngle;
                const midAngle =
                  angle + segmentAngle / 2;
                const color = TIER_COLORS[seg.tier];

                return (
                  <React.Fragment key={`inner-${i}`}>
                    {/* 색 칸 */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "1%",
                        left: "50%",
                        width: "10%", // 두께 넓게
                        height: "100%",
                        transformOrigin: "0% 51%",
                        transform: `rotate(${midAngle}deg)`,
                      }}
                    >
                      <div
                        style={{
                          width: "60%",
                          height: "60%",
                          background: color,
                          borderLeft:
                            "1px solid rgba(15,23,42,0.9)",
                          borderRight:
                            "1px solid rgba(15,23,42,0.9)",
                        }}
                      />
                    </div>

                    {/* 티어 텍스트 */}
                    <div
                      style={{
                        position: "absolute",
                        top: "0%",
                        left: "50%",
                        width: "32%",
                        height: "100%",
                        transformOrigin: "0% 50%",
                        transform: `rotate(${midAngle}deg)`,
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          transform: "rotate(-90deg)",
                          color:
                            seg.tier === "MEGA" ||
                            seg.tier === "JOKER"
                              ? "#fff"
                              : "#020617",
                          fontSize: 20, // 큼
                          fontWeight: 900,
                          textShadow:
                            "0 0 5px rgba(0,0,0,0.9)",
                          whiteSpace: "nowrap",
                          letterSpacing: 0.8,
                        }}
                      >
                        {seg.tier}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* 4) 중앙 결과 원 */}
            <div
              style={{
                position: "absolute",
                inset: "38%",
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
                    fontSize: 40,
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
                      fontSize: 26,
                      color: "#fde68a",
                      fontWeight: 800,
                    }}
                  >
                    × {currentSeg.number}
                  </div>
                )}
                {viewerTier &&
                  !isSpinning &&
                  currentSeg && (
                    <div
                      style={{
                        marginTop: 12,
                        fontSize: 18,
                        fontWeight: 700,
                        color: viewerHit
                          ? "#4ade80"
                          : "#fca5a5",
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

        {/* 버튼 */}
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