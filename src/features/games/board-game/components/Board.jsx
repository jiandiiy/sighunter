// src/components/GameCenter/BoardGame/Board.jsx
import React, { useMemo } from "react";
import { DiceBox } from "./Dice";

export default function Board({
  rows,
  cols,
  cells,
  tokens,
  currentTurnToken,
  isMoving,
  scoreChange,
  lastLandedIndex,
  selectedCellIndex,
  onClickCell,
  onResizeBoard,

  // 중앙 주사위
  diceValue,
  diceRotation3d,
  diceSnapRotation,
  isRolling,
  onRollDice,

  // ✅ 무인도 오버레이 (주사위 위에 뜨는 알림)
  prisonOverlay,
  // ✅ 히든 옵션 칸 인덱스 배열 (예: [3, 7, 12, 18, 22])
  hiddenOptionCells = [],
}) {
  // =========================
  // 0. 기본 보드 구조
  // =========================

  const perimeter = useMemo(() => {
    if (rows < 2 || cols < 2) return 0;
    return 2 * (rows + cols) - 4;
  }, [rows, cols]);

  const GRID_SIZE = 7;

  // 24칸 인덱스 → 7x7 좌표 (r,c)
  const indexToCoord24 = (index) => {
    const max = GRID_SIZE - 1; // 6

    if (index <= 6) return { r: 0, c: index }; // 상단
    if (index <= 11) return { r: index - 6, c: max }; // 오른쪽
    if (index <= 18) {
      const offset = index - 12;
      return { r: max, c: max - offset }; // 하단
    }
    const offset = index - 19;
    return { r: max - 1 - offset, c: 0 }; // 왼쪽
  };

  // =========================
  // 1. 기본 보드 데이터 (색/도시 이름만)
  // =========================

  const boardData24 = useMemo(
    () => [
      // 0~6: 상단 왼→오
      {
        bg: "#d1d5cf",
        text: "#1f2937",
        name: "START",
        icon: "🏁",
        isCorner: true,
      }, // 0
      { bg: "#513c33", text: "#fff", name: "타이베이" }, // 1
      { bg: "#d3bb98", text: "#422006", name: "베이징" }, // 2
      { bg: "#d1b690", text: "#422006", name: "마닐라" }, // 3
      { bg: "#ceb28e", text: "#422006", name: "싱가포르" }, // 4
      {
        bg: "#3b4f5b",
        text: "#fff",
        name: "황금열쇠",
        icon: "🔑",
        special: "key",
      }, // 5
      {
        bg: "#40b578",
        text: "#fff",
        name: "무인도",
        icon: "🏝️",
        isCorner: true,
        special: "prison",
      }, // 6

      // 7~11: 오른쪽 상→하
      { bg: "#e0d6df", text: "#4c1d95", name: "제주" }, // 7
      { bg: "#d2e0dd", text: "#065f46", name: "서울" }, // 8
      { bg: "#624d28", text: "#fff", name: "푸껫" }, // 9
      { bg: "#b48c56", text: "#422006", name: "하와이" }, // 10
      { bg: "#897a83", text: "#fff", name: "도쿄" }, // 11

      // 12~18: 하단 오→왼
      {
        bg: "#c9dce3",
        text: "#0c4a6e",
        name: "세계여행",
        icon: "✈️",
        isCorner: true,
        special: "world",
      }, // 12
      { bg: "#d1bfa5", text: "#422006", name: "파리" }, // 13
      { bg: "#cbb08b", text: "#422006", name: "로마" }, // 14
      { bg: "#cbae7e", text: "#422006", name: "런던" }, // 15
      {
        bg: "#caab78",
        text: "#422006",
        name: "황금열쇠",
        icon: "🔑",
        special: "key",
      }, // 16
      { bg: "#eb8c63", text: "#fff", name: "모스크바" }, // 17
      {
        bg: "#e6c7de",
        text: "#831843",
        name: "우주여행",
        icon: "🚀",
        isCorner: true,
        special: "space",
      }, // 18

      // 19~23: 왼쪽 하→상
      { bg: "#6c60ee", text: "#fff", name: "서울" }, // 19
      { bg: "#796af2", text: "#fff", name: "부산" }, // 20
      { bg: "#d5b987", text: "#422006", name: "뉴욕" }, // 21
      {
        bg: "#c7a470",
        text: "#422006",
        name: "황금열쇠",
        icon: "🔑",
        special: "key",
      }, // 22
      { bg: "#bb93b6", text: "#4c1d95", name: "퀘백", isCorner: true }, // 23
    ],
    []
  );

  const getBaseCellColor = (pos) => {
    if (pos < boardData24.length) return boardData24[pos];
    const colors = [
      { bg: "#10b981", text: "#fff" },
      { bg: "#3b82f6", text: "#fff" },
      { bg: "#f59e0b", text: "#fff" },
      { bg: "#ec4899", text: "#fff" },
    ];
    return colors[pos % 4];
  };

  const BOARD_BORDER = 6;
  const CENTER_PAD = 22;

  // =========================
  // 2. 렌더링 헬퍼
  // =========================

  const tokensOnCell = (pos) => tokens.filter((t) => t.pos === pos);
  const diceDisabled = !currentTurnToken || isMoving;
  // ✅ 이 칸이 히든 옵션 칸인지 여부
  const isHiddenCell = (pos) => hiddenOptionCells.includes(pos);

  const getCellStyleFromPos = (pos) => {
    const { r, c } = indexToCoord24(pos);
    const N = GRID_SIZE;

    const USED = 95;
    const cell = USED / N;
    const offset = (100 - USED) / 2;

    const isTop = r === 0;
    const isBottom = r === N - 1;
    const isLeft = c === 0;
    const isRight = c === N - 1;

    const leftBase = offset + c * cell;
    const topBase = offset + r * cell;

    const common = {
      position: "absolute",
      boxSizing: "border-box",
    };

    const CORNER_SIZE_FACTOR = 1.5;
    const CORNER_0_SHIFT_X = 0.4;
    const CORNER_0_SHIFT_Y = 0.5;
    const CORNER_6_SHIFT_X = 0.4;
    const CORNER_6_SHIFT_Y = 0.5;
    const CORNER_12_SHIFT_X = 0.3;
    const CORNER_12_SHIFT_Y = 0.5;
    const CORNER_18_SHIFT_X = 0.4;
    const CORNER_18_SHIFT_Y = 0.55;

    const isCorner = pos === 0 || pos === 6 || pos === 12 || pos === 18;
    if (isCorner) {
      const size = cell * CORNER_SIZE_FACTOR;

      let shiftX = 0.32;
      let shiftY = 0.4;

      if (pos === 0) {
        shiftX = CORNER_0_SHIFT_X;
        shiftY = CORNER_0_SHIFT_Y;
      } else if (pos === 6) {
        shiftX = CORNER_6_SHIFT_X;
        shiftY = CORNER_6_SHIFT_Y;
      } else if (pos === 12) {
        shiftX = CORNER_12_SHIFT_X;
        shiftY = CORNER_12_SHIFT_Y;
      } else if (pos === 18) {
        shiftX = CORNER_18_SHIFT_X;
        shiftY = CORNER_18_SHIFT_Y;
      }

      return {
        ...common,
        left: `${leftBase - (size - cell) * shiftX}%`,
        top: `${topBase - (size - cell) * shiftY}%`,
        width: `${size}%`,
        height: `${size}%`,
        zIndex: 5,
      };
    }

    const H_WIDTH_FACTOR = 1.0;
    const H_HEIGHT_FACTOR = 1.5;
    const H_TOP_OFFSET_TOP = 0.5;
    const H_TOP_OFFSET_BOTTOM = 0.4;

    const V_WIDTH_FACTOR = 1.6;
    const V_HEIGHT_FACTOR = 0.1;
    const V_LEFT_OFFSET_LEFT = 0.5;
    const V_LEFT_OFFSET_RIGHT = 0.2;
    const V_TOP_SHIFT = 0.01;

    if (isTop || isBottom) {
      const width = cell * H_WIDTH_FACTOR;
      const height = cell * H_HEIGHT_FACTOR;

      const top = isTop
        ? topBase - (height - cell) * H_TOP_OFFSET_TOP
        : topBase + (cell - height) * H_TOP_OFFSET_BOTTOM;

      return {
        ...common,
        left: `${leftBase - (width - cell) / 2}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`,
        zIndex: 4,
      };
    }

    if (isLeft || isRight) {
      const width = cell * V_WIDTH_FACTOR;
      const height = V_HEIGHT_FACTOR;

      const left = isLeft
        ? leftBase - (width - cell) * V_LEFT_OFFSET_LEFT
        : leftBase + (cell - width) * V_LEFT_OFFSET_RIGHT;

      return {
        ...common,
        left: `${left}%`,
        top: `${topBase - (height - cell) * V_TOP_SHIFT}%`,
        width: `${width}%`,
        height: `${height}%`,
        zIndex: 3,
      };
    }

    return {
      ...common,
      left: `${leftBase}%`,
      top: `${topBase}%`,
      width: `${cell}%`,
      height: `${cell}%`,
      zIndex: 1,
    };
  };

  const getMergedCellInfo = (pos) => {
    const base = getBaseCellColor(pos);
    return { base };
  };

  // =========================
  // 3. 렌더
  // =========================

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      {/* 헤더 타이틀 */}
      <h2
        style={{
          margin: 0,
          marginBottom: 8,
          fontSize: 32,
          fontWeight: 900,
          letterSpacing: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <span>🎲</span>
        <span
          style={{
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          모두의마불
        </span>
        <span>🎲</span>
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

      {/* 행/열 입력 */}
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

      {/* 실제 보드 영역 */}
      <div
        style={{
          position: "relative",
          aspectRatio: "1 / 1",
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
            overflow: "visible",
            height: "100%",
          }}
        >
          {/* 중앙 가이드 */}
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

          {/* 중앙 주사위 + 무인도 오버레이 */}
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
            {/* 주사위 */}
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

            {/* ✅ 무인도 알림 오버레이 */}
            {prisonOverlay && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "-65%",
                  transform: "translateX(-50%)",
                  padding: "6px 10px",
                  borderRadius: 999,
                  background:
                    "linear-gradient(135deg, rgba(239,68,68,0.95), rgba(249,115,22,0.95))",
                  color: "#f9fafb",
                  fontSize: 20,
                  fontWeight: 800,
                  boxShadow:
                    "0 4px 10px rgba(0,0,0,0.7), 0 0 12px rgba(248,250,252,0.7)",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  border: "1px solid rgba(248,250,252,0.8)",
                  textShadow: "0 1px 2px rgba(0,0,0,0.9)",
                }}
              >
                <span style={{ marginRight: 4 }}>🏝️ 무인도 당첨!</span>
                <span>
                  {prisonOverlay.tokenName} – {prisonOverlay.turns}턴 동안 이동
                  불가
                </span>
              </div>
            )}
          </div>

          {/* 둘레 칸들 */}
          {Array.from({ length: perimeter }, (_, pos) => {
  const { base } = getMergedCellInfo(pos);
  const onThis = tokensOnCell(pos);
  const displayName = base.name || cells[pos] || `칸${pos + 1}`;
  const isSelectedCell = selectedCellIndex === pos;
  const isLanded = lastLandedIndex === pos;
  const hidden = isHiddenCell(pos);

  // ✅ 방향 정보
  const isTopRow = pos >= 0 && pos <= 6;
  const isBottomRow = pos >= 12 && pos <= 18;

  const isCorner =
    pos === 0 || pos === 6 || pos === 12 || pos === 18;

  // ✅ “세로 글씨”가 필요한 일반칸: 상단/하단 & 코너 아님
  const isVerticalTextCell =
    !isCorner && (isTopRow || isBottomRow);
    // ✅ 일반칸의 황금열쇠 여부 (코너 아님 + special === "key")
const isNormalKeyCell = !isCorner && base.special === "key";

            // 모든 칸 공통 토큰 영역
            const tokenStack = (
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
                        fontSize: 20,
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
                            fontSize: 20,
                            fontWeight: 900,
                            color:
                              scoreChange.diff > 0 ? "#4ade80" : "#f87171",
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
            );

            return (
              <div
                key={pos}
                onClick={() => onClickCell(pos)}
                style={{
                  ...getCellStyleFromPos(pos),
                  background: base.bg,
                  border: isSelectedCell
                    ? ".1875rem solid #fbbf24"
                    : isLanded
                    ? ".1875rem solid #34d399"
                    : ".125rem solid rgba(0,0,0,0.3)",
                  boxShadow: hidden
                    ? "0 0 10px rgba(250,204,21,0.85)"
                    : isSelectedCell
                    ? "0 0 1.125rem rgba(251,191,36,0.9)"
                    : isLanded
                    ? "0 0 1.125rem rgba(52,211,153,0.9)"
                    : "inset 0 .125rem .25rem rgba(255,255,255,0.2), 0 .125rem .5rem rgba(0,0,0,0.4)",
                  borderRadius: base.isCorner ? 12 : 6,
                  padding: base.isCorner ? "8%" : "7%",
                  boxSizing: "border-box",
                  cursor: "pointer",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start", 
                  gap: 2,
                }}
              >
                {/* 상단 컨텐츠: 아이콘 + 이름 (코너/일반 공통) */}
                <div
                   style={{
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection:
      isVerticalTextCell && !isNormalKeyCell
        ? "row"
        : "column",
    alignItems: "center",
    justifyContent:
      isVerticalTextCell && !isNormalKeyCell
        ? "center"
        : "flex-start",
    gap:
      isVerticalTextCell && !isNormalKeyCell
        ? 4
        : base.isCorner
        ? 6
        : 2,
    marginBottom:
      isVerticalTextCell && !isNormalKeyCell ? 0 : 4,
      marginTop: base.isCorner ? -15 : -20,
  }}
>
                  {/* 아이콘 – START, 무인도, 황금열쇠, 세계여행, 우주여행 등 */}
                  {base.icon && (
                    <div
                      style={{
                        fontSize: base.isCorner ? 38 : 28,
                        lineHeight: 1,
                         marginBottom:
          isVerticalTextCell && !isNormalKeyCell ? 0 : 4,
                        marginTop: base.isCorner ? -15 : -20,
                      }}
                    >
                      {base.icon}
                    </div>
                  )}


                  {/* 이름 – 코너/일반 모두 가로 텍스트 */}
                  <div
                     style={{
      fontSize: base.isCorner
        ? 22
        : base.special
        ? 20
        : 22,
      fontWeight: 800,
      color: base.text,
      textAlign: "center",
      lineHeight: 1.2,
      // ✅ 상·하 일반칸에서 세로쓰기 느낌
      writingMode: isVerticalTextCell ? "vertical-rl" : "horizontal-tb",
      textOrientation: isVerticalTextCell ? "upright" : "mixed",
      whiteSpace: "nowrap",
    }}
  >
                    {displayName}
                  </div>
                </div>

                {/* 하단 보조 영역: 특별칸 부가 정보 */}
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    marginTop: base.isCorner ? 2 : 4,
                  }}
                >
                  {base.special === "prison" && (
                    <div
                      style={{ display: "flex", justifyContent: "center" }}
                    >
                      <span
                        style={{
                          padding: "1px 6px",
                          fontSize: base.isCorner ? 15 : 13,
                          color: "#e5e7eb",
                          writingMode: "horizontal-tb",
          textOrientation: "mixed",
          whiteSpace: "nowrap",
                        }}
                      >
                      (2턴 정지)
                      </span>
                    </div>
                  )}

                  {base.special === "world" && (
                    <div
                      style={{ display: "flex", justifyContent: "center" }}
                    >
                      <span
                        style={{
                          padding: "1px 6px",
                          fontSize: 15,
                          color: "#000",
                           writingMode: "horizontal-tb",
          textOrientation: "mixed",
          whiteSpace: "nowrap",
                        }}
                      >
                        원하는 도시로 이동
                      </span>
                    </div>
                  )}

                  {base.special === "space" && (
                    <div
                      style={{ display: "flex", justifyContent: "center" }}
                    >
                      <span
                        style={{
                          padding: "1px 6px",
                          fontSize: 15,
                          color: "#000",
                           writingMode: "horizontal-tb",
          textOrientation: "mixed",
          whiteSpace: "nowrap",
                        }}
                      >
                      (보너스 이동)
                      </span>
                    </div>
                  )}
                </div>

                {/* ✅ 히든 옵션 뱃지 */}
                {hidden && (
                  <div
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      padding: "1px 5px",
                      borderRadius: 999,
                      fontSize: 15,
                      fontWeight: 900,
                      background:
                        "radial-gradient(circle at 0 0, #facc15, #b45309)",
                      color: "#111827",
                      boxShadow: "0 0 6px rgba(250, 204, 21, 0.9)",
                      textShadow: "0 1px 1px rgba(255,255,255,0.7)",
                    }}
                  >
                    ❓HIDDEN
                  </div>
                )}

                {/* 코너/일반 공통 토큰 영역 */}
                {tokenStack}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}