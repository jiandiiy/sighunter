// src/components/GameCenter/BigWheel/CasinoWheelHuge.jsx
import React, { useState } from "react";
import WheelView from "./WheelView";
import { generateSegmentsFromCountsMixed } from "../lib/wheelLogic";

// ✅ 티어별 아이콘(경로는 프로젝트에 맞게 수정: public 폴더 기준)
const TIER_ICON = {
  DIAMOND: "/images/gems/diamond.png",
  EMERALD: "/images/gems/emerald.png",
  SAPPHIRE: "/images/gems/sapphire.png",
  RUBY: "/images/gems/ruby.png",
  GOLD: "/images/gems/gold.png",
  PEARL: "/images/gems/pearl.png",
  BONUS: "/images/gems/bonus.png",
};

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
        이 칸 수로 휠 다시 생성(섞기)
      </button>
    </div>
  );
}

export default function CasinoWheelHuge() {
  const wheelSize = 1200;

  const [tierCounts, setTierCounts] = useState({
    DIAMOND: 1,
    EMERALD: 2,
    SAPPHIRE: 4,
    RUBY: 11,
    GOLD: 18,
    PEARL: 25,
    BONUS: 1,
  });

  //const totalSlots = useMemo(() => {
  //  return Object.values(tierCounts).reduce(
  //    (sum, v) => sum + (Number(v) || 0),
  //    0
  //  );
  //}, [tierCounts]);

  const makeSegments = () =>
    generateSegmentsFromCountsMixed(tierCounts, {
      avoidAdjacent: true,
      maxTries: 300,
    });

  const [segments, setSegments] = useState(() => makeSegments());

  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultIndex, setResultIndex] = useState(null);
  
  const [viewerTier, setViewerTier] = useState(null);
  const [viewerSigCount, setViewerSigCount] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  
  const [spinSegments, setSpinSegments] = useState(null);
  const [snapTransition, setSnapTransition] = useState(false);


  const activeSegments = spinSegments ?? segments;
 const currentSeg = resultIndex != null ? activeSegments[resultIndex] : null;
  const viewerHit = currentSeg && viewerTier && currentSeg.tier === viewerTier;

  const parsedSig = Number(viewerSigCount) || 0;
  const parsedMultiplier = currentSeg ? Number(currentSeg.number) || 0 : 0;
  const totalSig = parsedSig * parsedMultiplier;

const spin = () => {
  if (isSpinning || segments.length === 0) return;
  setSpinSegments(segments);   // 스핀 시작 시 배열 고정
  setIsSpinning(true);
  setSnapTransition(false);    // transition off(스핀 중엔 5s 기본 트랜지션)

  const segCount = segments.length;
  const segmentAngle = 360 / segCount;

  // 목표 인덱스
  const targetIndex = Math.floor(Math.random() * segCount);

  // targetIndex 중앙이 포인터(0deg)에 오도록
  const targetSegmentCenter = targetIndex * segmentAngle + segmentAngle / 2;
  const extraTurns = 4 + Math.floor(Math.random() * 3); // 4~6바퀴
  const totalTurnsAngle = extraTurns * 360;

  // 목표 최종 각도: 현재 회전 각도를 기준으로
  const targetRotation =
    rotation +
    totalTurnsAngle +
    (0 - targetSegmentCenter - (rotation % 360)); // 0:포인터 각도(고정), -(rotation%360)로 현재값 정렬

  setRotation(targetRotation); // 5초 스핀

  setTimeout(() => {
    setIsSpinning(false);
    setSnapTransition(true);      // 스냅에 transition 부드럽게

    setRotation((prevFinal) => {
      // 지금 위치(정확하지 않을 수도 있음) → 진짜 원하는 위치
      const normalized = ((prevFinal % 360) + 360) % 360; // 0~359
      const desired = (0 - targetIndex * segmentAngle - segmentAngle / 2 + 3600) % 360;

      // 최소 회전 보정(-180~180)
      let delta = desired - normalized;
      delta = ((delta + 540) % 360) - 180;

      setResultIndex(targetIndex);
      return prevFinal + delta;
    });

    setTimeout(() => setSnapTransition(false), 300); // 0.3초 뒤에 트랜지션 끔
  }, 5000);
};
  const regenerateWheel = () => {
    if (isSpinning) return;
     setSpinSegments(null);      // ✅ 여기서만 해제
    setSegments(makeSegments());
    setResultIndex(null);
    setRotation(0);

    // ✅ 추가: 선택/입력값도 초기화
  setViewerTier(null);
  setViewerSigCount("");
  setCopyMessage("");
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

  const tierFontSize = (tier) => {
  switch (tier) {
   case "DIAMOND":
      case "EMERALD":
      case "SAPPHIRE":
        return 114;
      case "RUBY":
      case "GOLD":
        return 190;
      case "PEARL":
      case "BONUS":
        return 160;
      default:
        return 140;
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
              fontSize: 50,
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
                    viewerTier === t
                      ? "2px solid #facc15"
                      : "1px solid #4b5563",
                  background: viewerTier === t ? "#1f2937" : "#020617",
                  color: "#e5e7eb",
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* 시그 개수 입력 */}
          <div style={{ marginBottom: 16, textAlign: "center", fontSize: 18 }}>
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
                fontSize: 18,
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
                fontSize: 18,
                cursor: isSpinning ? "not-allowed" : "pointer",
                opacity: isSpinning ? 0.6 : 1,
              }}
            >
              🔄 초기화
            </button>
          </div>

          {/* 휠 + 버튼(세로 스택) */}
          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <WheelView
              wheelSize={wheelSize}
              segments={activeSegments}
              rotation={rotation}
              isSpinning={isSpinning}
               snapTransition={snapTransition}
            >
              {/* 중앙 결과 원 */}
              <div
                style={{
                  position: "absolute",
                  left: "50.1%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: wheelSize * 0.42,
                  height: wheelSize * 0.42,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at 30% 30%, #1f2937, #020617 70%)",
                  border: "5px solid #fef3c7",
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
    fontSize: isSpinning ? 80 : tierFontSize(currentSeg?.tier),
    fontWeight: 900,
    color: "#f9fafb",
    marginBottom: 8,
    lineHeight: 1,
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
                        fontSize: 70,
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
            </WheelView>

            {/* SPIN 버튼 */}
            <div style={{ marginTop: 50 }}>
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
                  transition: "all 0.3s",
                }}
              >
                {isSpinning ? "SPINNING..." : "🎰 회전"}
              </button>
            </div>
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
                결과 티어: <b>{currentSeg.tier}</b> × <b>{currentSeg.number}</b>
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

          {Object.keys(TIER_ICON).map((tier) => (
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
                {TIER_ICON[tier] && (
                  <img
                    src={TIER_ICON[tier]}
                    alt={`${tier} icon`}
                    width={18}
                    height={18}
                    draggable={false}
                    style={{
                      display: "block",
                      objectFit: "contain",
                      background: "transparent",
                      border: 0,
                      boxShadow: "none",
                      filter: "drop-shadow(0 0 2px rgba(0,0,0,0.8))",
                    }}
                  />
                )}
                <span style={{ fontSize: 13, fontWeight: 700, color: "#e5e7eb" }}>
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
               setSpinSegments(null);      // ✅ 여기서만 해제
              setSegments(makeSegments());
              setResultIndex(null);
              setRotation(0);
            }}
          />
        </div>
      </div>
    </div>
  );
}