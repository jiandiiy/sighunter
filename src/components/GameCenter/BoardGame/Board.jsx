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
  const totalCells = rows * cols;

  const tokensOnCell = (index) => tokens.filter((t) => t.pos === index);

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
        🎰 부루마블 🎰
      </h2>
      <p
        style={{
          margin: "0 0 6px",
          fontSize: 14,
          opacity: 0.8,
          color: "#fff",
        }}
      >
        칸을 클릭해서 선택하고, 우측 패널에서 그 칸의 텍스트와 스타일을
        수정할 수 있습니다.
      </p>

      {/* 보드 크기 조절 */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 8,
          fontSize: 14,
          color: "#fff",
        }}
      >
        <span style={{ opacity: 0.85 }}>보드 크기:</span>
        <label>
          행(세로)&nbsp;
          <input
            type="number"
            min={3}
            max={10}
            value={rows}
            onChange={(e) =>
              onResizeBoard(Number(e.target.value) || 3, cols)
            }
            style={{
              width: 40,
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(129,140,248,0.8)",
              borderRadius: 6,
              color: "#e5e7eb",
              fontSize: 12,
              padding: "1px 4px",
              boxShadow: "0 0 8px rgba(79,70,229,0.6)",
            }}
          />
        </label>
        <label>
          열(가로)&nbsp;
          <input
            type="number"
            min={3}
            max={10}
            value={cols}
            onChange={(e) =>
              onResizeBoard(rows, Number(e.target.value) || 3)
            }
            style={{
              width: 40,
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(129,140,248,0.8)",
              borderRadius: 6,
              color: "#e5e7eb",
              fontSize: 12,
              padding: "1px 4px",
              boxShadow: "0 0 8px rgba(79,70,229,0.6)",
            }}
          />
        </label>
        <span style={{ opacity: 0.8, color: "#a5b4fc" }}>
          (현재 {rows} × {cols} = {totalCells}칸)
        </span>
      </div>

      {/* 보드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 3,
          background:
            "radial-gradient(circle at top, #0b1120, #020617)",
          padding: 6,
          borderRadius: 14,
          border: "1px solid rgba(129,140,248,0.7)",
          boxShadow:
            "0 0 15px rgba(55,65,81,0.9), inset 0 0 25px rgba(15,23,42,0.9)",
        }}
      >
        {Array.from({ length: totalCells }, (_, idx) => {
          const onThis = tokensOnCell(idx);
          const baseText = cells[idx] || "";
          const style = cellStyles[idx] || {
            fontSize: 12,
            fontWeight: 600,
            color: "#f9fafb",
          };
          const isSelectedCell = selectedCellIndex === idx;
          const isLanded = lastLandedIndex === idx;

          return (
            <div
              key={idx}
              onClick={() => onClickCell(idx)}
              style={{
                position: "relative",
                minHeight: 72,
                background:
                  idx === 0
                    ? "linear-gradient(135deg,#fde68a,#f97316)"
                    : "linear-gradient(135deg,rgba(15,23,42,0.98),rgba(17,24,39,0.98))",
                border: isSelectedCell
                  ? "2px solid rgba(244,114,182,0.95)"
                  : isLanded
                  ? "2px solid rgba(250,204,21,0.95)"
                  : "1px solid rgba(59,130,246,0.7)",
                boxShadow: isSelectedCell
                  ? "0 0 18px rgba(244,114,182,0.9)"
                  : isLanded
                  ? "0 0 18px rgba(250,204,21,0.9)"
                  : "0 0 8px rgba(59,130,246,0.6)",
                borderRadius: 10,
                padding: 4,
                cursor: "pointer",
                boxSizing: "border-box",
                overflow: "hidden",
                transition: "box-shadow 0.2s, transform 0.2s",
                transform: isLanded ? "translateY(-2px)" : "none",
              }}
            >
              {/* 칸 번호 */}
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: 4,
                  fontSize: 10,
                  opacity: 0.7,
                  color: idx === 0 ? "#1f2937" : "#a5b4fc",
                }}
              >
                #{idx + 1}
              </div>

              {/* 칸 텍스트 + 스타일 */}
              <div
                style={{
                  fontSize: style.fontSize,
                  fontWeight: style.fontWeight,
                  color: style.color,
                  whiteSpace: "pre-line",
                  textAlign: "center",
                  marginTop: 12,
                  textShadow: "0 0 6px rgba(15,23,42,0.8)",
                }}
              >
                {baseText}
              </div>

              {/* 이 칸에 있는 말들 */}
              <div
                style={{
                  position: "absolute",
                  bottom: 3,
                  left: 3,
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
                        width: 13,
                        height: 13,
                        borderRadius: "50%",
                        background: t.color,
                        border: "1px solid #020617",
                        boxShadow: "0 0 6px rgba(248,250,252,0.7)",
                        transform: isMovingThis
                          ? "translateY(-2px) scale(1.1)"
                          : "none",
                        transition: "transform 0.15s ease-out",
                        position: "relative",
                      }}
                    >
                      {isScoreChanging && (
                        <span
                          style={{
                            position: "absolute",
                            top: -16,
                            left: "50%",
                            transform: "translateX(-50%)",
                            fontSize: 10,
                            fontWeight: 700,
                            color:
                              scoreChange.diff > 0
                                ? "#bbf7d0"
                                : "#fecaca",
                            textShadow:
                              "0 0 6px rgba(15,23,42,0.9)",
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