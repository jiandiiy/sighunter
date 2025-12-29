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
  diceSnapRotation,
  isRolling,
  onRollDice,
}) {
  const perimeter = useMemo(() => {
    if (rows < 2 || cols < 2) return 0;
    return 2 * (rows + cols) - 4;
  }, [rows, cols]);

  // ✅ 32칸(9×9 링) 전용 좌표 매핑
  const indexToCoord32 = (pos) => {
    const N = 9; // 9×9 그리드
    // bottom row: (8,0)~(8,8) : 9칸 (pos 0..8)
    if (pos < 9) return { r: N - 1, c: pos };

    // right col: (7,8)~(0,8) : 8칸 (pos 9..16)
    if (pos < 9 + 8) return { r: N - 2 - (pos - 9), c: N - 1 };

    // top row: (0,7)~(0,0) : 8칸 (pos 17..24)
    if (pos < 9 + 8 + 8)
      return { r: 0, c: N - 2 - (pos - (9 + 8)) };

    // left col: (1,0)~(7,0) : 7칸 (pos 25..31)
    return { r: 1 + (pos - (9 + 8 + 8)), c: 0 };
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

    const { r, c } = indexToCoord32(pos);
    const N = 9;
    const isCorner =
      (r === 0 && c === 0) ||
      (r === 0 && c === N - 1) ||
      (r === N - 1 && c === 0) ||
      (r === N - 1 && c === N - 1);

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
  const CENTER_PAD = 22;

  // ✅ 9×9 링 기준: 모서리=1×1, 상/하=1×2, 좌/우=2×1
  const getCellStyleFromPos = (pos) => {
    const N = 9;
      const RING = 2; // ✅ 링(테두리) 두께: 2칸
    const { r, c } = indexToCoord32(pos);

    const USED = 96;
    const base = USED / N;
    const offset = (100 - USED) / 2; // 가운데 정렬

    const isTop = r === 0;
    const isBottom = r === N - 1;
    const isLeft = c === 0;
    const isRight = c === N - 1;

    const isCorner =
      (isTop && isLeft) ||
      (isTop && isRight) ||
      (isBottom && isLeft) ||
      (isBottom && isRight);

    const left0 = offset + c * base;
    const top0 = offset + r * base;

    // 🔹 모서리: 1×1
  if (isCorner) {
    const left = isLeft ? left0 : left0 - (RING - 1) * base;   // 오른쪽 모서리는 안쪽으로
    const top = isTop ? top0 : top0 - (RING - 1) * base;       // 아래 모서리는 안쪽으로
    return {
      position: "absolute",
      left: `${left}%`,
      top: `${top}%`,
      width: `${base * RING}%`,
      height: `${base * RING}%`,
    };
    }

     if (isTop) {
    return {
      position: "absolute",
      left: `${left0}%`,
      top: `${top0}%`,
      width: `${base}%`,
      height: `${base * RING}%`,
    };
  }
  if (isBottom) {
    return {
      position: "absolute",
      left: `${left0}%`,
      top: `${top0 - (RING - 1) * base}%`,
      width: `${base}%`,
      height: `${base * RING}%`,
    };
  }

  // 🔹 좌/우: 가로 RING칸(안쪽으로), 세로 1칸
  if (isLeft) {
    return {
      position: "absolute",
      left: `${left0}%`,
      top: `${top0}%`,
      width: `${base * RING}%`,
      height: `${base}%`,
    };
  }

  // isRight
  return {
    position: "absolute",
    left: `${left0 - (RING - 1) * base}%`,
    top: `${top0}%`,
    width: `${base * RING}%`,
    height: `${base}%`,
  };
};

  const tokensOnCell = (pos) => tokens.filter((t) => t.pos === pos);
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
          margin: "0 0 .5rem",
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
              padding: ".25rem .375rem",
              borderRadius: 6,
              border: ".0625rem solid #475569",
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
              padding: ".25rem .375rem",
              borderRadius: 6,
              border: ".0625rem solid #475569",
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
            "0 0 2.5rem rgba(0,0,0,0.8), inset 0 0 3.75rem rgba(0,0,0,0.5)",
          border: `${BOARD_BORDER}px solid #111827`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: BOARD_BORDER,
            borderRadius: 20 - BOARD_BORDER,
            overflow: "visible", // 칸이 안쪽으로 2칸 확장돼도 안 잘리게
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
              background: "transparent",
              boxShadow: "none",
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
                opacity: 1,
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
                    ? ".1875rem solid #fbbf24"
                    : isLanded
                    ? ".1875rem solid #34d399"
                    : ".125rem solid rgba(0,0,0,0.3)",
                  boxShadow: isSelectedCell
                    ? "0 0 1.125rem rgba(251,191,36,0.9)"
                    : isLanded
                    ? "0 0 1.125rem rgba(52,211,153,0.9)"
                    : "inset 0 .125rem .25rem rgba(255,255,255,0.2), 0 .125rem .5rem rgba(0,0,0,0.4)",
                  borderRadius: colorScheme.isCorner ? 12 : 6,
                  padding: colorScheme.isCorner ? "8%" : "7%",
                  boxSizing: "border-box",
                  cursor: "pointer",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: colorScheme.isCorner
                    ? "center"
                    : "space-between",
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
                        flexDirection: "column",
                        gap: 2,
                        alignItems: "center",
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
                              position: "relative",
                              padding: ".0625rem .25rem",
                              borderRadius: 6,
                              background: t.color,
                              color: "#ffffff",
                              fontSize: 9,
                              fontWeight: 700,
                              boxShadow: "0 .125rem .25rem rgba(0,0,0,0.5)",
                              transform: isMovingThis ? "scale(1.05)" : "none",
                              transition: "transform 0.2s ease-out",
                              whiteSpace: "nowrap",
                              maxWidth: "100%",
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                            }}
                          >
                            {t.name}

                            {isScoreChanging && (
                              <span
                                style={{
                                  position: "absolute",
                                  top: -14,
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  fontSize: 9,
                                  fontWeight: 900,
                                  color:
                                    scoreChange.diff > 0
                                      ? "#4ade80"
                                      : "#f87171",
                                  textShadow: "0 0 .375rem rgba(0,0,0,0.9)",
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