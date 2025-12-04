// src/components/GameCenter/BoardGame/Board.jsx
import React, { useMemo } from "react";

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
  // 🔹 현재 rows×cols 격자의 "둘레 칸 수" 계산 (테두리만 사용)
  const perimeter = useMemo(() => {
    if (rows < 2 || cols < 2) return 0;
    return 2 * (rows + cols) - 4; // 예: 10×10 → 36칸
  }, [rows, cols]);

  // 🔹 0~perimeter-1 인덱스를 실제 (r,c) 좌표로 매핑
  const indexToCoord = (pos) => {
    // 아래쪽: 0 ~ (cols-1)
    if (pos < cols) {
      return { r: rows - 1, c: pos };
    }
    // 오른쪽: cols ~ (cols + rows - 2)
    if (pos < cols + rows - 1) {
      const offset = pos - cols;
      return { r: rows - 2 - offset, c: cols - 1 };
    }
    // 위쪽
    const topStart = cols + rows - 1;
    if (pos < topStart + cols - 1) {
      const offset = pos - topStart;
      return { r: 0, c: cols - 2 - offset };
    }
    // 왼쪽
    const leftStart = topStart + cols - 1;
    const offset = pos - leftStart;
    return { r: 1 + offset, c: 0 };
  };

  // 🔹 인덱스 → 스타일 (퍼센트 기반, 정사각형 안 테두리 배치)
  const getCellStyleFromPos = (pos) => {
    const { r, c } = indexToCoord(pos);
    const base = {
      position: "absolute",
      width: `${100 / cols}%`,
      height: `${(100 / rows) * 0.7}%`,
    };

    return {
      ...base,
      left: `${(c * 100) / cols}%`,
      top: `${(r * 100) / rows}%`,
    };
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
        {rows} × {cols} 보드의 둘레 {perimeter}칸을 따라 이동합니다.
      </p>

      {/* 행/열 크기 설정 */}
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
        <span style={{ opacity: 0.85 }}>보드 크기:</span>
        <label>
          행&nbsp;
          <input
            type="number"
            min={4}
            max={20}
            value={rows}
            onChange={(e) =>
              onResizeBoard(
                Math.max(4, Math.min(20, Number(e.target.value) || rows)),
                cols
              )
            }
            style={{ width: 48 }}
          />
        </label>
        <label>
          열&nbsp;
          <input
            type="number"
            min={4}
            max={20}
            value={cols}
            onChange={(e) =>
              onResizeBoard(
                rows,
                Math.max(4, Math.min(20, Number(e.target.value) || cols))
              )
            }
            style={{ width: 48 }}
          />
        </label>
        <span style={{ opacity: 0.8 }}>
          (실제 사용 칸: 둘레 {perimeter}칸)
        </span>
      </div>

      {/* 실제 정사각형 보드 */}
      <div
        style={{
          position: "relative",
          paddingBottom: "100%",
          width: "100%",
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
        {/* 중앙 '부루마불' 칸 */}
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
            boxShadow: "inset 0 0 30px rgba(0,0,0,0.7)",
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

        {/* 둘레 칸 렌더링 */}
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
                borderRadius: 10,
                padding: "2% 2% 9%",
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