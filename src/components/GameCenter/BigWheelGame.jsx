import React, { useState } from "react";

// 초기 섹터 설정 (원하면 여기 텍스트/색 바꿔도 됨)
const INITIAL_SEGMENTS = [
  { id: 1, label: "앞으로 3칸", color: "#f97316" },
  { id: 2, label: "뒤로 2칸", color: "#3b82f6" },
  { id: 3, label: "+500점", color: "#22c55e" },
  { id: 4, label: "-300점", color: "#e11d48" },
  { id: 5, label: "한 턴 쉬기", color: "#a855f7" },
  { id: 6, label: "랜덤 교체", color: "#facc15" },
  { id: 7, label: "시그헌터 1회", color: "#14b8a6" },
  { id: 8, label: "꽝", color: "#6b7280" },
];

export default function BigWheelGame() {
  const [segments, setSegments] = useState(INITIAL_SEGMENTS);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [lastIndex, setLastIndex] = useState(null);

  const segmentAngle = 360 / segments.length;

  // 빅휠 돌리기
  const spin = () => {
    if (isSpinning || segments.length === 0) return;
    setIsSpinning(true);

    // 결과가 연속으로 똑같이 나오지 않게 살짝 배려 (원하면 제거)
    let targetIndex = Math.floor(Math.random() * segments.length);
    if (segments.length > 1 && targetIndex === lastIndex) {
      targetIndex = (targetIndex + 1) % segments.length;
    }

    // 최소 3바퀴 ~ 최대 5바퀴
    const extraTurns = 3 + Math.floor(Math.random() * 3); // 3~5
    // 포인터는 화면 상단(0도)에 고정이고, 휠을 돌리므로
    // targetIndex의 중앙이 위에 오도록 각도 계산
    const targetAngle =
      extraTurns * 360 +
      (360 - (targetIndex * segmentAngle + segmentAngle / 2));

    setRotation((prev) => prev + targetAngle);

    // transition 시간: 아래 wheelStyle.transition 과 동일해야 함 (4초)
    setTimeout(() => {
      setIsSpinning(false);
      setLastIndex(targetIndex);
      setResult(segments[targetIndex]);
    }, 4000);
  };

  // 리스트에서 텍스트 수정
  const handleChangeLabel = (id, text) => {
    setSegments((prev) =>
      prev.map((seg) =>
        seg.id === id ? { ...seg, label: text } : seg
      )
    );
  };

  // 빅휠 스타일
  const wheelStyle = {
    width: 320,
    height: 320,
    borderRadius: "50%",
    border: "4px solid rgba(248,250,252,0.95)",
    boxShadow:
      "0 0 20px rgba(129,140,248,0.9), 0 0 50px rgba(59,130,246,0.8)",
    position: "relative",
    overflow: "hidden",
    transform: `rotate(${rotation}deg)`,
    transition: isSpinning
      ? "transform 4s cubic-bezier(0.12, 0.8, 0.2, 1)"
      : "none",
    background:
      "radial-gradient(circle at center, #0f172a, #020617)",
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "50vh",
        boxSizing: "border-box",
        background:
          "radial-gradient(circle at top, #1e1b4b, #020617 55%, #020617 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        color: "#e5e7eb",
        fontFamily: "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    > 
      <div
        style={{
          width: 960,
          maxWidth: "100%",
          borderRadius: 24,
          border: "1px solid rgba(168,85,247,0.9)",
          boxShadow:
            "0 20px 80px rgba(0,0,0,0.9), 0 0 40px rgba(129,140,248,0.6)",
          padding: 20,
          background:
            "radial-gradient(circle at top, rgba(30,64,175,0.95), rgba(15,23,42,0.98))",
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.5fr)",
          gap: 16,
        }}
      >
        {/* 왼쪽: 빅휠 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 800,
              color: "#fff",
              textShadow: "0 0 18px rgba(168,85,247,0.9)",
              letterSpacing: 1,
            }}
          >
            🎡 빅휠 🎡
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              opacity: 0.9,
              color: "#fff",
            }}
          >
            버튼을 눌러 휠을 돌리세요.
          </p>

          {/* 휠 + 포인터 영역 */}
          <div
            style={{
              position: "relative",
              width: 340,
              height: 360,
              marginTop: 8,
            }}
          >
            {/* 포인터 */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "14px solid transparent",
                borderRight: "14px solid transparent",
                borderBottom: "26px solid #facc15",
                filter:
                  "drop-shadow(0 0 10px rgba(250,204,21,0.95))",
                zIndex: 5,
              }}
            />

            {/* 휠 */}
            <div style={wheelStyle}>
              {/* 섹터들 */}
              {segments.map((seg, idx) => {
                const startAngle = idx * segmentAngle;
                return (
                  <div
                    key={seg.id}
                    style={{
                      position: "absolute",
                      width: "50%",
                      height: "50%",
                      top: "50%",
                      left: "50%",
                      transformOrigin: "0% 0%",
                      transform: `rotate(${startAngle}deg) skewY(${
                        90 - segmentAngle
                      }deg)`,
                      background: `linear-gradient(135deg, ${seg.color}, rgba(15,23,42,0.95))`,
                      opacity: 0.95,
                      borderRight:
                        "1px solid rgba(15,23,42,0.8)",
                    }}
                  />
                );
              })}

              {/* 중앙 원 + 현재 결과 텍스트 */}
              <div
                style={{
                  position: "absolute",
                  inset: "22% 22%",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at center, #020617, #111827)",
                  border:
                    "2px solid rgba(248,250,252,0.95)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: 10,
                  boxShadow:
                    "0 0 20px rgba(248,250,252,0.85)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      opacity: 0.8,
                      marginBottom: 4,
                      color: "#fff",
                      fontWeight: 500,
                    }}
                  >
                    {isSpinning
                      ? "도는 중..."
                      : result
                      ? "이번 결과"
                      : "준비 완료"}
                  </div>
                  <div
                    style={{
                      fontSize: 25,
                      fontWeight: 800,
                      color: "#fff",
                    }}
                  >
                    {isSpinning
                      ? "??"
                      : result
                      ? result.label
                      : "돌리기 버튼을 눌러주세요"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 버튼 + 결과 텍스트 */}
          <div
            style={{
              marginTop: 5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <button
              type="button"
              onClick={spin}
              disabled={isSpinning || segments.length === 0}
              style={{
                padding: "8px 20px",
                borderRadius: 999,
                border:
                  "1px solid rgba(147,197,253,0.95)",
                background:
                  "linear-gradient(135deg,rgba(59,130,246,0.98),rgba(129,140,248,0.98))",
                color: "#eff6ff",
                fontWeight: 800,
                fontSize: 16,
                cursor:
                  isSpinning || segments.length === 0
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  isSpinning || segments.length === 0
                    ? 0.6
                    : 1,
                boxShadow:
                  "0 0 18px rgba(59,130,246,0.95)",
              }}
            >
              {isSpinning
                ? "도는 중..."
                : "🎰 빅휠 돌리기"}
            </button>

            <div
              style={{
                fontSize: 14,
                opacity: 0.95,
                color: "#fff",
              }}
            >
              {result
                ? `마지막 결과: ${result.label}`
                : "아직 결과 없음"}
            </div>
          </div>
        </div>

        {/* 오른쪽: 섹터 리스트 / 편집 */}
        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(129,140,248,0.9)",
            background:
              "linear-gradient(145deg,rgba(15,23,42,0.95),rgba(17,24,39,0.98))",
            padding: 10,
            boxShadow:
              "0 0 18px rgba(129,140,248,0.7)",
            fontSize: 14,
          }}
        >
          <h3
            style={{
              margin: "0 0 8px",
              fontSize: 16,
              fontWeight: 800,
              color: "#f9fafb",
            }}
          >
            🎯 섹터 설정
          </h3>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 11,
              opacity: 0.9,
              color: "#fff",
            }}
          >
            각 칸에 들어갈 내용을 수정할 수 있습니다.  
          </p>

          <div
            style={{
              maxHeight: 260,
              overflowY: "auto",
              paddingRight: 4,
              marginBottom: 8,
            }}
          >
            {segments.map((seg, idx) => (
              <div
                key={seg.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 6,
                  padding: "4px 6px",
                  borderRadius: 10,
                  border:
                    "1px solid rgba(55,65,81,0.9)",
                  background:
                    "linear-gradient(135deg,rgba(15,23,42,0.95),rgba(17,24,39,0.98))",
                }}
              >
                {/* 색상 표시 동그라미 + 번호 */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    width: 40,
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: seg.color,
                      border: "1px solid #020617",
                      boxShadow:
                        "0 0 8px rgba(248,250,252,0.8)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
fontWeight: 600,
                      color: "#fff",
                    }}
                  >
                    {idx + 1}번
                  </span>
                </div>

                {/* 텍스트 입력 */}
                <input
                  type="text"
                  value={seg.label}
                  onChange={(e) =>
                    handleChangeLabel(seg.id, e.target.value)
                  }
                  style={{
                    flex: 1,
                    background: "rgba(15,23,42,0.95)",
                    border:
                      "1px solid rgba(129,140,248,0.85)",
                    borderRadius: 8,
                    color: "#e5e7eb",
                    fontSize: 14,
                    padding: "3px 6px",
                    fontFamily: "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontWeight: 800,
                  }}
                />
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: 11,
              opacity: 0.85,
              color: "#e5e7eb",
            }}
          >
          </div>
        </div>
      </div>
    </div>
  );
}
            //· 섹터 개수/색까지 방송 중에 바꾸고 싶다면,
            //이 컴포넌트에 버튼을 더 붙여서 동적으로
            //추가/삭제도 만들 수 있습니다.  
            //