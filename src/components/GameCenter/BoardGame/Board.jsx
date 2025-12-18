// src/components/GameCenter/BoardGame/Board.jsx
import React, { useMemo } from "react";
import { DiceBox } from "./Dice";

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

  // ✅ 중앙 주사위
  diceValue,
  diceRotation3d,
  diceSnapRotation, // <- BoardGame에서 내려주는 경우 포함
  isRolling,
  onRollDice,
}) {
  const perimeter = useMemo(() => {
    if (rows < 2 || cols < 2) return 0;
    return 2 * (rows + cols) - 4;
  }, [rows, cols]);

  const indexToCoord = (pos) => {
    if (pos < cols) return { r: rows - 1, c: pos };
    if (pos < cols + rows - 1) {
      const offset = pos - cols;
      return { r: rows - 2 - offset, c: cols - 1 };
    }
    const topStart = cols + rows - 1;
    if (pos < topStart + cols - 1) {
      const offset = pos - topStart;
      return { r: 0, c: cols - 2 - offset };
    }
    const leftStart = topStart + cols - 1;
    const offset = pos - leftStart;
    return { r: 1 + offset, c: 0 };
  };

  const boardData32 = [
    { bg: "#d1d5cf", text: "#1f2937", name: "START", icon: "🏁", isCorner: true },
    { bg: "#513c33", text: "#fff", name: "타이베이" },
    { bg: "#d3bb98", text: "#422006", name: "베이징" },
    { bg: "#d1b690", text: "#422006", name: "마닐라" },
    { bg: "#ceb28e", text: "#422006", name: "싱가포르" },
    { bg: "#3b4f5b", text: "#fff", name: "황금열쇠", icon: "🔑", special: true },
    { bg: "#e0d6df", text: "#4c1d95", name: "제주" },
    { bg: "#d2e0dd", text: "#065f46", name: "서울" },
    { bg: "#40b578", text: "#fff", name: "무인도", icon: "🏝️", isCorner: true },
    { bg: "#624d28", text: "#fff", name: "푸껫" },
    { bg: "#b48c56", text: "#422006", name: "하와이" },
    { bg: "#976e3e", text: "#fff", name: "괌" },
    { bg: "#865d2d", text: "#fff", name: "오끼나와" },
    { bg: "#957241", text: "#fff", name: "황금열쇠", icon: "🔑", special: true },
    { bg: "#3a4034", text: "#fff", name: "다낭" },
    { bg: "#b9dce6", text: "#0c4a6e", name: "시드니" },
    { bg: "#c9dce3", text: "#0c4a6e", name: "세계여행", icon: "✈️", isCorner: true },
    { bg: "#897a83", text: "#fff", name: "도쿄" },
    { bg: "#d1bfa5", text: "#422006", name: "파리" },
    { bg: "#cbb08b", text: "#422006", name: "로마" },
    { bg: "#cbae7e", text: "#422006", name: "런던" },
    { bg: "#caab78", text: "#422006", name: "황금열쇠", icon: "🔑", special: true },
    { bg: "#c3a379", text: "#422006", name: "베를린" },
    { bg: "#eb8c63", text: "#fff", name: "모스크바" },
    { bg: "#e6c7de", text: "#831843", name: "우주여행", icon: "🚀", isCorner: true },
    { bg: "#6c60ee", text: "#fff", name: "서울" },
    { bg: "#796af2", text: "#fff", name: "부산" },
    { bg: "#d5b987", text: "#422006", name: "뉴욕" },
    { bg: "#c7a470", text: "#422006", name: "황금열쇠", icon: "🔑", special: true },
    { bg: "#d2b581", text: "#422006", name: "프라하" },
    { bg: "#cdac7a", text: "#422006", name: "취리히" },
    { bg: "#bb93b6", text: "#4c1d95", name: "퀘백" },
  ];

  const getCellColor = (pos) => {
    if (perimeter === 32 && pos < 32) return boardData32[pos];

    const { r, c } = indexToCoord(pos);
    const isCorner =
      (r === 0 && c === 0) ||
      (r === 0 && c === cols - 1) ||
      (r === rows - 1 && c === 0) ||
      (r === rows - 1 && c === cols - 1);

    if (isCorner) return { bg: "#60a5fa", text: "#1e3a8a", isCorner: true };

    const colors = [
      { bg: "#10b981", text: "#fff" },
      { bg: "#3b82f6", text: "#fff" },
      { bg: "#f59e0b", text: "#fff" },
      { bg: "#ec4899", text: "#fff" },
    ];
    return colors[pos % 4];
  };

  const INNER_PAD_PCT = 1.2;
  const BOARD_BORDER = 6;
  const CENTER_PAD = 30;

  const getCellStyleFromPos = (pos) => {
    const { r, c } = indexToCoord(pos);

    const is32 = perimeter === 32;

    const pad = INNER_PAD_PCT;
    const boardSize = 100 - pad * 2;
    const ringInset = 0.8;

    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

    if (!is32) {
      const baseW = (boardSize - ringInset * 2) / cols;
      const baseH = (boardSize - ringInset * 2) / rows;
      return {
        position: "absolute",
        width: `${baseW}%`,
        height: `${baseH}%`,
        left: `${pad + ringInset + c * baseW}%`,
        top: `${pad + ringInset + r * baseH}%`,
      };
    }

    const baseW = (boardSize - ringInset * 2) / 9;
    const baseH = (boardSize - ringInset * 2) / 9;

    const cornerScale = 1.28;
    const cornerW = baseW * cornerScale;
    const cornerH = baseH * cornerScale;

    const insetX = cornerW - baseW;
    const insetY = cornerH - baseH;

    let left = pad + ringInset + c * baseW;
    let top = pad + ringInset + r * baseH;
    let width = baseW;
    let height = baseH;

    const isTop = r === 0;
    const isBottom = r === 8;
    const isLeft = c === 0;
    const isRight = c === 8;

    const cornerTL = isTop && isLeft;
    const cornerTR = isTop && isRight;
    const cornerBR = isBottom && isRight;
    const cornerBL = isBottom && isLeft;

    if (cornerTL) {
      width = cornerW;
      height = cornerH;
    } else if (cornerTR) {
      width = cornerW;
      height = cornerH;
      left = pad + boardSize - ringInset - cornerW;
    } else if (cornerBR) {
      width = cornerW;
      height = cornerH;
      left = pad + boardSize - ringInset - cornerW;
      top = pad + boardSize - ringInset - cornerH;
    } else if (cornerBL) {
      width = cornerW;
      height = cornerH;
      top = pad + boardSize - ringInset - cornerH;
    } else {
      if (isTop || isBottom) {
        if (c === 1) left += insetX;
        if (c === 7) left -= insetX;
      }
      if (isLeft || isRight) {
        if (r === 1) top += insetY;
        if (r === 7) top -= insetY;
      }
    }

    const minL = pad;
    const minT = pad;
    const maxL = pad + boardSize - width;
    const maxT = pad + boardSize - height;

    left = clamp(left, minL, maxL);
    top = clamp(top, minT, maxT);

    return {
      position: "absolute",
      width: `${width}%`,
      height: `${height}%`,
      left: `${left}%`,
      top: `${top}%`,
    };
  };

  const tokensOnCell = (pos) => tokens.filter((t) => t.pos === pos);

  // 굴러가는 동안에는 흐려지지 않게: isRolling을 disabled 기준에서 분리
  const diceDisabled = !currentTurnToken || isMoving;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      <h2
        style={{
          margin: 0,
          marginBottom: 8,
          fontSize: 32,
          fontWeight: 900,
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: 1,
        }}
      >
        🎲 모두의마불 🎲
      </h2>

      <p
        style={{
          margin: "0 0 8px",
          fontSize: 14,
          opacity: 0.85,
          color: "#e2e8f0",
        }}
      >
        {rows} × {cols} 보드 · 둘레 {perimeter}칸
      </p>

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginBottom: 12,
          fontSize: 13,
          color: "#cbd5e1",
        }}
      >
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
            style={{
              width: 50,
              padding: "4px 6px",
              borderRadius: 6,
              border: "1px solid #475569",
              background: "#1e293b",
              color: "#e2e8f0",
            }}
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
            style={{
              width: 50,
              padding: "4px 6px",
              borderRadius: 6,
              border: "1px solid #475569",
              background: "#1e293b",
              color: "#e2e8f0",
            }}
          />
        </label>
      </div>

      <div
        style={{
          position: "relative",
          paddingBottom: "100%",
          width: "100%",
          background: "linear-gradient(135deg, #374151, #1f2937)",
          borderRadius: 20,
          boxShadow:
            "0 0 40px rgba(0,0,0,0.8), inset 0 0 60px rgba(0,0,0,0.5)",
          border: `${BOARD_BORDER}px solid #111827`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: BOARD_BORDER,
            borderRadius: 20 - BOARD_BORDER,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: `${CENTER_PAD}%`,
              right: `${CENTER_PAD}%`,
              top: `${CENTER_PAD}%`,
              bottom: `${CENTER_PAD}%`,
              borderRadius: 16,
              background: "linear-gradient(135deg, #475569, #334155)",
              boxShadow: "inset 0 0 40px rgba(0,0,0,0.7)",
            }}
          />

          {/* ✅ 중앙 주사위 */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%) scale(2.3)",
              transformOrigin: "center",
              pointerEvents: "none",
            }}
          >
            
            <div
              onClick={() => {
                if (diceDisabled || isRolling) return;
                onRollDice();
              }}
              style={{
                pointerEvents: "auto",
                cursor: diceDisabled || isRolling ? "not-allowed" : "pointer",
                // ✅ 굴러갈 때(isRolling)는 항상 1, 내 턴 아님/이동 중일 때만 살짝 흐리게
                opacity: diceDisabled ? 1 : 1,
              }}
            >
              <DiceBox
                value={diceValue}
                isRolling={isRolling}
                rotation3d={diceRotation3d}
                snapRotation={diceSnapRotation}
                onRoll={() => {}}
                disabled={diceDisabled || isRolling}
              />
            </div>
          </div>

          {/* 칸들 */}
          {Array.from({ length: perimeter }, (_, pos) => {
            const onThis = tokensOnCell(pos);
            const colorScheme = getCellColor(pos);
            const displayName = colorScheme.name || cells[pos] || `칸${pos + 1}`;

            const isSelectedCell = selectedCellIndex === pos;
            const isLanded = lastLandedIndex === pos;

            return (
              <div
                key={pos}
                onClick={() => onClickCell(pos)}
                style={{
                  ...getCellStyleFromPos(pos),
                  background: colorScheme.bg,
                  border: isSelectedCell
                    ? "3px solid #fbbf24"
                    : isLanded
                    ? "3px solid #34d399"
                    : "2px solid rgba(0,0,0,0.3)",
                  boxShadow: isSelectedCell
                    ? "0 0 18px rgba(251,191,36,0.9)"
                    : isLanded
                    ? "0 0 18px rgba(52,211,153,0.9)"
                    : "inset 0 2px 4px rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.4)",
                  borderRadius: colorScheme.isCorner ? 12 : 6,
                  padding: colorScheme.isCorner ? "8%" : "7%",
                  boxSizing: "border-box",
                  cursor: "pointer",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: colorScheme.isCorner ? "center" : "space-between",
                }}
              >
                {colorScheme.isCorner ? (
                  <div style={{ textAlign: "center" }}>
                    {colorScheme.icon && (
                      <div style={{ fontSize: 32, marginBottom: 4 }}>
                        {colorScheme.icon}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 900,
                        color: colorScheme.text,
                      }}
                    >
                      {displayName}
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ width: "100%", textAlign: "center" }}>
                      {colorScheme.special && colorScheme.icon && (
                        <div style={{ fontSize: 18, marginBottom: 2 }}>
                          {colorScheme.icon}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: colorScheme.special ? 10 : 8,
                          fontWeight: 700,
                          color: colorScheme.text,
                          opacity: colorScheme.special ? 1 : 0.7,
                        }}
                      >
                        {colorScheme.special ? "" : `#${pos + 1}`}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: colorScheme.text,
                        textAlign: "center",
                        lineHeight: 1.2,
                      }}
                    >
                      {displayName}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 2,
                        flexWrap: "wrap",
                        justifyContent: "center",
                        marginTop: "auto",
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
                              width: 11,
                              height: 11,
                              borderRadius: "50%",
                              background: t.color,
                              border: "2px solid #fff",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.6)",
                              transform: isMovingThis ? "scale(1.2)" : "none",
                              transition: "transform 0.2s ease-out",
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
                                  fontSize: 9,
                                  fontWeight: 900,
                                  color:
                                    scoreChange.diff > 0
                                      ? "#4ade80"
                                      : "#f87171",
                                  textShadow: "0 0 6px rgba(0,0,0,0.9)",
                                  whiteSpace: "nowrap",
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
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}