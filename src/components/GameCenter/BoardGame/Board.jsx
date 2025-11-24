// src/components/GameCenter/BoardGame/Board.jsx
import React from "react";

export default function Board({
  rows,
  cols,
  cells,
  cellStyles,
  tokens,
  currentTurnToken,
  isMoving,
  scoreChange,
  lastLandedIndex,
  selectedCellIndex,
  onClickCell,
  onResizeBoard,
}) {
 // 🔹 둘레 34칸 (아래 9, 오른쪽 8, 위 9, 왼쪽 8)
const perimeter = 34;

const getCellStyleFromPos = (pos) => {
  const base = {
    position: "absolute",
    width: "10%",  // 가로 꽤 넉넉하게
    height: "6%",  // 세로는 조금 작게 (카드형 텍스트용이면 6~7% 정도)
  };

  // 🔻 아래: 0~8 (9칸)
  if (pos >= 0 && pos <= 8) {
    const idx = pos; // 0~8
    return {
      ...base,
      bottom: "0%",
      left: `${idx * 10.5}%`, // 0 ~ 84
    };
  }

  // ➡ 오른쪽: 9~16 (8칸)
  if (pos >= 9 && pos <= 16) {
    const idx = pos - 9; // 0~7
    return {
      ...base,
      right: "0%",
      top: `${idx * 11.5}%`, // 0 ~ 80.5
    };
  }

  // 🔺 위: 17~25 (9칸)
  if (pos >= 17 && pos <= 25) {
    const idx = pos - 17; // 0~8
    return {
      ...base,
      top: "0%",
      left: `${idx * 10.5}%`,
    };
  }

  // ⬅ 왼쪽: 26~33 (8칸)
  if (pos >= 26 && pos <= 33) {
    const idx = pos - 26; // 0~7
    return {
      ...base,
      left: "0%",
      bottom: `${idx * 11.5}%`,
    };
  }

  return base;
};


  const tokensOnCell = (pos) =>
    tokens.filter((t) => t.pos === pos);

  return (
    <div style={{ flex: 2, minWidth: 0 }}>
      <h2
        style={{
          margin: 0,
          marginBottom: 4,
          fontSize: 26,
          fontWeight: 800,
          color: "#fff",
          textShadow: "0 0 12px rgba(168,85,247,0.9)",
          letterSpacing: 0.5,
        }}
      >
        🎰 부루마불 🎰
      </h2>
      <p
        style={{
          margin: "0 0 6px",
          fontSize: 14,
          opacity: 0.8,
          color: "#fff",
        }}
      >
        정사각형 보드 둘레 40칸을 따라 이동합니다.
      </p>

      {/* 크기 컨트롤 – 논리상 rows/cols 유지하지만 실제 레이아웃에는 사용 안 함 */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 10,
          fontSize: 14,
          color: "#fff",
        }}
      >
        <span style={{ opacity: 0.85 }}>보드 크기(논리):</span>
        <label>
          행&nbsp;
          <input
            type="number"
            min={13}
            max={13}
            value={rows}
            onChange={(e) =>
              onResizeBoard(Number(e.target.value) || 13, cols)
            }
            style={{ width: 40 }}
            readOnly
          />
        </label>
        <label>
          열&nbsp;
          <input
            type="number"
            min={13}
            max={13}
            value={cols}
            onChange={(e) =>
              onResizeBoard(rows, Number(e.target.value) || 13)
            }
            style={{ width: 40 }}
            readOnly
          />
        </label>
        <span style={{ opacity: 0.8 }}>
          (실제 게임 칸은 40칸)
        </span>
      </div>

      {/* 실제 정사각형 보드 */}
      <div
        style={{
          position: "relative",
          paddingBottom: "100%",
            width: "100%",     // 뷰포트 가로 전체
   maxWidth: "none",  
   maxHeight: "none", 

          margin: "0 auto",
          background:
            "radial-gradient(circle at center, #22c55e, #065f46)",
          borderRadius: 32,
          boxShadow:
            "0 0 25px rgba(15,23,42,0.9), inset 0 0 40px rgba(0,0,0,0.8)",
          border: "3px solid rgba(8,47,73,0.9)",
        }}
      >
        {/* 중앙 '부루마불' 한 칸 */}
        <div
          style={{
            position: "absolute",
            left: "18%",
            right: "18%",
            top: "18%",
            bottom: "18%",
            background:
              "radial-gradient(circle at center,#22c55e,#16a34a)",
            borderRadius: 24,
            boxShadow:
              "inset 0 0 30px rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#052e16",
            fontWeight: 900,
            fontSize: 32,
            letterSpacing: 4,
            textShadow: "0 0 10px rgba(254,252,232,0.9)",
          }}
        >
          부루마불
        </div>

        {/* 둘레 40칸 렌더링 */}
        {Array.from({ length: perimeter }, (_, pos) => {
          const onThis = tokensOnCell(pos);
          const baseText = cells[pos] || "";
          const style = cellStyles[pos] || {
            fontSize: 12,
            fontWeight: 600,
            color: "#f9fafb",
          };

          const isSelectedCell = selectedCellIndex === pos;
          const isLanded = lastLandedIndex === pos;
          const isStart = pos === 0;
          const isCorner = pos === 0 || pos === 10 || pos === 20 || pos === 30;

          return (
            <div
              key={pos}
              onClick={() => onClickCell(pos)}
              style={{
                ...getCellStyleFromPos(pos),
                background: isStart
                  ? "linear-gradient(135deg,#fde68a,#f97316)"
                  : "linear-gradient(135deg,rgba(15,23,42,0.98),rgba(17,24,39,0.98))",
                border: isSelectedCell
                  ? "2px solid rgba(244,114,182,0.95)"
                  : isLanded
                  ? "2px solid rgba(250,204,21,0.95)"
                  : "1px solid rgba(59,130,246,0.7)",
                boxShadow: isSelectedCell
                  ? "0 0 16px rgba(244,114,182,0.9)"
                  : isLanded
                  ? "0 0 16px rgba(250,204,21,0.9)"
                  : "0 0 8px rgba(15,23,42,0.9)",
                borderRadius: isCorner ? 14 : 10,
                padding: "4% 4% 14%",
                boxSizing: "border-box",
                cursor: "pointer",
                overflow: "hidden",
              }}
            >
              {/* 칸 번호 */}
              <div
                style={{
                  position: "absolute",
                  top: "4%",
                  left: "6%",
                  fontSize: 9,
                  opacity: 0.75,
                  color: isStart ? "#1f2937" : "#a5b4fc",
                }}
              >
                #{pos + 1}
              </div>

              {/* 칸 텍스트 */}
              <div
                style={{
                  fontSize: style.fontSize,
                  fontWeight: style.fontWeight,
                  color: style.color,
                  whiteSpace: "pre-line",
                  textAlign: "center",
                  marginTop: "10%",
                  textShadow: "0 0 4px rgba(15,23,42,0.9)",
                }}
              >
                {baseText}
              </div>

              {/* 말들 */}
              <div
                style={{
                  position: "absolute",
                  bottom: "4%",
                  left: "6%",
                  display: "flex",
                  gap: 3,
                  flexWrap: "wrap",
                }}
              >
                {onThis.map((t) => {
                  const isMovingThis =
                    isMoving && t.id === currentTurnToken?.id;
                  const isScoreChanging =
                    scoreChange && scoreChange.tokenId === t.id;

                  return (
                    <div
                      key={t.id}
                      title={`${t.name} (점수: ${t.score}점)`}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: t.color,
                        border: "1px solid #020617",
                        boxShadow: "0 0 4px rgba(248,250,252,0.8)",
                        transform: isMovingThis
                          ? "translateY(-1px) scale(1.08)"
                          : "none",
                        transition: "transform 0.15s ease-out",
                        position: "relative",
                      }}
                    >
                      {isScoreChanging && (
                        <span
                          style={{
                            position: "absolute",
                            top: -14,
                            left: "50%",
                            transform: "translateX(-50%)",
                            fontSize: 9,
                            fontWeight: 700,
                            color:
                              scoreChange.diff > 0
                                ? "#bbf7d0"
                                : "#fecaca",
                            textShadow:
                              "0 0 4px rgba(15,23,42,0.95)",
                          }}
                        >
                          {scoreChange.diff > 0 ? "+" : ""}
                          {scoreChange.diff}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}