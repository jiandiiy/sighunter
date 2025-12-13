// src/components/GameCenter/BigWheel/CasinoWheelHuge.jsx
import React, { useState } from "react";
import WheelView from "./WheelView";
import {
  TIER_GRADIENTS,
  generateSegmentsFromCounts,
  getIndexAtPointer,
} from "./wheelLogic";

// 🔹 우측 패널 하단: 총 칸수 + 적용 버튼
function TierCountsFooter({ tierCounts, onApply }) {
  const total = Object.values(tierCounts).reduce(
    (sum, v) => sum + (Number(v) || 0),
    0
  );

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>
        총 칸 수:{" "}
        <span style={{ color: "#facc15", fontWeight: 700 }}>{total}</span>
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
  const viewerHit = currentSeg && viewerTier && currentSeg.tier === viewerTier;

  const parsedSig = Number(viewerSigCount) || 0;
  const parsedMultiplier = currentSeg ? Number(currentSeg.number) || 0 : 0;
  const totalSig = parsedSig * parsedMultiplier;

  const spin = () => {
    if (isSpinning || segments.length === 0) return;
    setIsSpinning(true);

    const extraTurns = 4 + Math.floor(Math.random() * 3);
    const randomOffset = Math.random() * 360;
    const targetAngle = extraTurns * 360 + randomOffset;

    setRotation((prev) => prev + targetAngle);

    setTimeout(() => {
      setIsSpinning(false);

      setRotation((prevFinal) => {
        const normalized = ((prevFinal % 360) + 360) % 360;

        // ✅ CSS rotate 기준: 오른쪽=0, 아래=90, 왼쪽=180, 위=270
        const POINTER_ANGLE = 0;

        const index = getIndexAtPointer({
          rotationDeg: normalized,
          segmentCount: segments.length || 1,
          pointerAngleDeg: POINTER_ANGLE,
        });

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
          background: "radial-gradient(circle at top, #7c2d12, #0f172a 70%)",
          boxShadow:
            "0 60px 160px rgba(0,0,0,0.95), 0 0 80px rgba(0,0,0,0.9)",
          display: "flex",
          gap: 32,
        }}
      >
        {/* 왼쪽 */}
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
          <div style={{ marginBottom: 8, textAlign: "center", fontSize: 15 }}>
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
                    viewerTier === t ? "2px solid #facc15" : "1px solid #4b5563",
                  background: viewerTier === t ? "#1f2937" : "#020617",
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
          <div style={{ marginBottom: 16, textAlign: "center", fontSize: 15 }}>
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

          {/* 휠 재구성 */}
          <div style={{ marginBottom: 20, textAlign: "center" }}>
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

          {/* ✅ 포인터 + 휠(분리된 컴포넌트) */}
          <div style={{ position: "relative" }}>
            <WheelView
              wheelSize={wheelSize}
              segments={segments}
              rotation={rotation}
              isSpinning={isSpinning}
            />

            {/* 중앙 결과 원(원래 코드 그대로) */}
            <div
              style={{
                position: "absolute",
                // WheelView의 휠 원이 (top:70,left:40)에 있으니 중앙도 같은 기준으로 맞춤
                top: 87 + wheelSize * 0.29,
                left: 55 + wheelSize * 0.3,
                width: wheelSize * 0.31,
                height: wheelSize * 0.31,
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
                zIndex: 50,
                pointerEvents: "none",
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
                  {isSpinning ? "SPINNING..." : currentSeg ? "결과" : "시작"}
                </div>

                <div
                  style={{
                    fontSize: 60,
                    fontWeight: 900,
                    color: "#f9fafb",
                    textShadow: "0 0 18px rgba(255,255,255,0.9)",
                    marginBottom: 8,
                  }}
                >
                  {isSpinning ? "??" : currentSeg ? currentSeg.tier : "버튼을 눌러주세요"}
                </div>

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

                {currentSeg && !isSpinning && parsedSig > 0 && (
                  <div
                    style={{
                      fontSize: 20,
                      color: "#e5e7eb",
                      fontWeight: 700,
                      marginTop: 4,
                    }}
                  >
                    {parsedSig.toLocaleString()} × {parsedMultiplier} ={" "}
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
                    {viewerHit ? "적은 티어와 일치! 당첨 🎉" : "적은 티어와 불일치"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SPIN 버튼 */}
          <div style={{ marginTop: 26, display: "flex", justifyContent: "center" }}>
            <button
              onClick={spin}
              disabled={isSpinning}
              style={{
                padding: "16px 46px",
                borderRadius: 999,
                border: "3px solid #fef3c7",
                background: "linear-gradient(145deg,#f97316,#fbbf24)",
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
            <div style={{ marginTop: 16, textAlign: "center", fontSize: 18, color: "#fef9c3" }}>
              <div>
                결과 티어: <b>{currentSeg.tier}</b> × <b>{currentSeg.number}</b>
                {viewerTier && (
                  <>
                    {" "}
                    / 시청자 선택: <b>{viewerTier}</b> {viewerHit ? "→ 당첨!" : "→ 꽝"}
                  </>
                )}
              </div>

              {parsedSig > 0 && (
                <div style={{ marginTop: 4, fontSize: 16 }}>
                  {parsedSig.toLocaleString()} × {parsedMultiplier} ={" "}
                  <b style={{ color: "#facc15" }}>{totalSig.toLocaleString()}</b>
                </div>
              )}

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
                      color: copyMessage === "복사됨!" ? "#4ade80" : "#f87171",
                    }}
                  >
                    {copyMessage}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽 패널 */}
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
          <div style={{ fontSize: 16, fontWeight: 700, color: "#e5e7eb", marginBottom: 4 }}>
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
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    background: TIER_GRADIENTS[tier],
                    border: "1px solid rgba(15,23,42,0.8)",
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#e5e7eb" }}>{tier}</span>
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