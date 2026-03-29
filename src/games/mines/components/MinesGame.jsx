import React, { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";

/** 💥 폭탄 터지는 이펙트 (붉은 컨페티로 연출) */
function fireBombEffect() {
  try {
    confetti({
      particleCount: 120,
      spread: 200,
      origin: { y: 0.7 },
      ticks: 120,
      gravity: 1.2,
      scalar: 1.2,
      colors: ["#ff0000", "#ff6b6b", "#ffed4a", "#ffa500"],
    });
  } catch (e) {
    console.error("Bomb effect error:", e);
  }
}

/** 1~N 번호 → (row, col) */
function numToCoord(num, cols) {
  const idx = num - 1;
  const row = Math.floor(idx / cols);
  const col = idx % cols;
  return { row, col };
}

/** 빈 보드 생성 */
function createEmptyBoard(rows, cols) {
  const board = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r,
        col: c,
        isMine: false,
        isRevealed: false,
        adjacentMines: 0,
      });
    }
    board.push(row);
  }
  return board;
}

/** 🎯 보드에 지뢰 배치하고, 주변 숫자 계산 */
function generateBoard(rows, cols, mineCount) {
  const TOTAL_CELLS = rows * cols;
  const board = createEmptyBoard(rows, cols);

  // 지뢰 위치 랜덤 배치
  const positions = Array.from({ length: TOTAL_CELLS }, (_, i) => i);
  // Fisher–Yates shuffle
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  const maxMines = Math.max(1, TOTAL_CELLS - 1);
  const safeMines = Math.max(1, Math.min(maxMines, mineCount));

  for (let i = 0; i < safeMines; i++) {
    const idx = positions[i];
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    board[r][c].isMine = true;
  }

  // 주변 8칸 방향
  const dirs = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  // 각 칸별 주변 지뢰 수 계산
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].isMine) continue;
      let count = 0;
      dirs.forEach(([dr, dc]) => {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          if (board[nr][nc].isMine) count++;
        }
      });
      board[r][c].adjacentMines = count;
    }
  }

  return board;
}

export default function MinesGame2D() {
  /** 🔢 총 칸 수 (50~100) */
  const [totalCells, setTotalCells] = useState(50);

  /** 총 칸 수에 따른 행/열 계산 (열은 10 고정, 행은 자동) */
  const { rows, cols } = useMemo(() => {
    const cols = 10; // 그리드 폭 일정하게
    const rows = Math.ceil(totalCells / cols);
    return { rows, cols };
  }, [totalCells]);

  /** 지뢰 수 (기본 10개) */
  const [mineCount, setMineCount] = useState(10);

  // 🔹 초기 보드도 rows/cols에 맞춰 생성 (50칸 → 5x10)
  const [board, setBoard] = useState(() =>
    generateBoard(Math.ceil(50 / 10), 10, 10)
  );
  const [round, setRound] = useState(1);
  const [cleared, setCleared] = useState(false);

  /** 보드/칸수/지뢰 수가 바뀔 때 새 판 생성 */
  useEffect(() => {
    const b = generateBoard(rows, cols, mineCount);
    setBoard(b);
    setCleared(false);
    setRound((r) => r + 1);
  }, [rows, cols, mineCount]);

  // 안전 칸 / 찾은 지뢰 수 계산
  const { safeInfo, foundMines } = useMemo(() => {
    let totalSafe = 0;
    let revealedSafe = 0;
    let mines = 0;
    let revealedMines = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = board[r] && board[r][c];
        if (!cell) continue;

        if (cell.isMine) {
          mines++;
          if (cell.isRevealed) revealedMines++;
        } else {
          totalSafe++;
          if (cell.isRevealed) revealedSafe++;
        }
      }
    }

    return {
      safeInfo: { totalSafe, revealedSafe },
      foundMines: { mines, revealedMines },
    };
  }, [board, rows, cols]);

  /** 셀 클릭 (번호 기반) */
  const handleCellClick = (num) => {
    setBoard((prev) => {
      const next = prev.map((r) => r.map((c) => ({ ...c })));
      const { row, col } = numToCoord(num, cols);
      const cell = next[row][col];

      // 이미 연 칸이면 무시
      if (cell.isRevealed) return prev;

      if (cell.isMine) {
        cell.isRevealed = true;
        fireBombEffect();
      } else {
        cell.isRevealed = true;
      }

      // 지뢰를 전부 찾았는지 체크
      let mines = 0;
      let revealedMines = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cc = next[r][c];
          if (cc.isMine) {
            mines++;
            if (cc.isRevealed) revealedMines++;
          }
        }
      }
      if (mines > 0 && revealedMines >= mines) {
        setCleared(true);
      }

      return next;
    });
  };

  /** 새 판 시작 버튼 */
  const handleReset = () => {
    const b = generateBoard(rows, cols, mineCount);
    setBoard(b);
    setCleared(false);
    setRound((r) => r + 1);
  };

  const TOTAL_CELLS = rows * cols;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        maxWidth: 530,
        maxHeight: 710,
        margin: "40px auto",
        padding: 10,
        boxSizing: "border-box",
        background: "#C0C0C0",
        borderRadius: 6,
        border: "3px solid #808080",
        boxShadow:
          "inset 3px 3px 0 #FFFFFF, inset -3px -3px 0 #808080",
        fontFamily:
          "Tahoma, 'Microsoft Sans Serif', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* 상단 정보 영역 */}
      <div
        style={{
          border: "3px solid #808080",
          boxShadow:
            "inset 3px 3px 0 #FFFFFF, inset -3px -3px 0 #808080",
          padding: "6px 10px",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#C0C0C0",
        }}
      >
        {/* 왼쪽: ROUND */}
        <div
          style={{
            background: "black",
            color: "red",
            fontWeight: "bold",
            fontSize: 22,
            padding: "2px 8px",
            minWidth: 60,
            textAlign: "center",
            fontFamily: "Digital, 'DS-Digital', monospace",
          }}
        >
          {String(round).padStart(3, "0")}
        </div>

        {/* 가운데: 얼굴 버튼 */}
        <button
          type="button"
          onClick={handleReset}
          style={{
            width: 38,
            height: 38,
            borderRadius: 0,
            textAlign: "center",
            border: "3px solid #808080",
            background: "#C0C0C0",
            boxShadow:
              "inset 3px 3px 0 #FFFFFF, inset -3px -3px 0 #808080",
            cursor: "pointer",
            fontSize: 24,
            padding: 0,
            lineHeight: 1,
          }}
        >
          <span
            style={{
              display: "inline-block",
              transform: "translateX(-1px)",
            }}
          >
            {cleared ? "😎" : "🙂"}
          </span>
        </button>

        {/* 오른쪽: 지뢰 수 디스플레이 */}
        <div
          style={{
            background: "black",
            color: "red",
            fontWeight: "bold",
            fontSize: 22,
            padding: "2px 8px",
            minWidth: 60,
            textAlign: "center",
            fontFamily: "Digital, 'DS-Digital', monospace",
          }}
        >
          {String(mineCount).padStart(3, "0")}
        </div>
      </div>
{/* 설정 + 안내 */}
<div
  style={{
    border: "3px solid #808080",
    boxShadow: "inset 3px 3px 0 #FFFFFF, inset -3px -3px 0 #808080",
    padding: 8,
    marginBottom: 8,
    background: "#C0C0C0",
    fontSize: 13,
  }}
>
  {/* 1줄째: 보드 / 칸 수 / 지뢰 수 */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 4,
      flexWrap: "nowrap",
    }}
  >
    <div style={{ whiteSpace: "nowrap" }}>
      보드:{" "}
      <b>
        {cols} × {rows} (총 {TOTAL_CELLS}칸)
      </b>
    </div>

    {/* 칸 수 (50~100) */}
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
      }}
    >
      <span>칸 수</span>
      <input
        type="number"
        min={50}
        max={100}
        value={totalCells}
        onChange={(e) => {
          const v = Number(e.target.value) || 50;
          const clamped = Math.max(50, Math.min(100, v));
          setTotalCells(clamped);
          // setMineCount(Math.max(1, Math.floor(clamped * 0.2)));
        }}
        style={{
          width: 70,
          padding: "2px 4px",
          fontSize: 13,
          border: "1px solid #808080",
          background: "#E0E0E0",
        }}
      />
    </label>

    {/* 지뢰 수 */}
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
      }}
    >
      <span>지뢰 수</span>
      <input
        type="number"
        min={1}
        max={TOTAL_CELLS - 1}
        value={mineCount}
        onChange={(e) => {
          const v = Number(e.target.value) || 1;
          setMineCount(Math.max(1, Math.min(TOTAL_CELLS - 1, v)));
        }}
        style={{
          width: 60,
          padding: "2px 4px",
          fontSize: 13,
          border: "1px solid #808080",
          background: "#E0E0E0",
        }}
      />
    </label>

    <div style={{ flex: 1 }} />
  </div>

  {/* 2줄째: 안전 칸 / 찾은 지뢰 (보드 칸수 밑으로 분리) */}
  <div
    style={{
      fontSize: 13,
      marginBottom: 4,
      whiteSpace: "nowrap",
    }}
  >
    안전 칸:{" "}
    <b>
      {safeInfo.revealedSafe}/{safeInfo.totalSafe}
    </b>{" "}
    찾은 지뢰:{" "}
    <b>
      {foundMines.revealedMines}/{foundMines.mines}
    </b>
  </div>

  {/* 안내 문구 */}
  <div style={{ fontSize: 12, color: "#202020" }}>
    버튼 번호는 1~{TOTAL_CELLS}입니다. BJ가 말한 번호를 눌러 칸을 여세요.
  </div>
      </div>

      {/* 상태 메시지 */}
      <div
        style={{
          minHeight: 20,
          fontSize: 13,
          marginBottom: 6,
          color: "#202020",
        }}
      >
        {cleared
          ? "🎉 모든 지뢰를 다 찾았습니다!"
          : "지뢰를 모두 찾을 때까지 계속 눌러보세요. (지뢰를 밟아도 게임은 계속됩니다)"}
      </div>

      {/* 보드 */}
      <div
        style={{
          border: "3px solid #808080",
          boxShadow:
            "inset 3px 3px 0 #FFFFFF, inset -3px -3px 0 #808080",
          padding: 5,
          background: "#C0C0C0",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 2,
          }}
        >
          {Array.from({ length: TOTAL_CELLS }, (_, i) => {
            const num = i + 1; // 1~TOTAL_CELLS
            const { row, col } = numToCoord(num, cols);

            const rowData = board[row];
            if (!rowData) {
              // rows/cols가 먼저 바뀌고 board가 아직 재생성 안 된 시점 방어
              return (
                <button
                  key={num}
                  type="button"
                  disabled
                  style={{
                    width: "100%",
                    padding: "10px 0",
                    border: "3px solid #808080",
                    background: "#C0C0C0",
                    color: "#000000",
                    fontSize: 18,
                    fontWeight: 700,
                    boxShadow:
                      "inset 3px 3px 0 #FFFFFF, inset -3px -3px 0 #808080",
                    textAlign: "center",
                    lineHeight: 1.1,
                  }}
                >
                  {num}
                </button>
              );
            }

            const cell = rowData[col];
            if (!cell) {
              return (
                <button
                  key={num}
                  type="button"
                  disabled
                  style={{
                    width: "100%",
                    padding: "10px 0",
                    border: "3px solid #808080",
                    background: "#C0C0C0",
                    color: "#000000",
                    fontSize: 18,
                    fontWeight: 700,
                    boxShadow:
                      "inset 3px 3px 0 #FFFFFF, inset -3px -3px 0 #808080",
                    textAlign: "center",
                    lineHeight: 1.1,
                  }}
                >
                  {num}
                </button>
              );
            }

            const isRevealed = cell.isRevealed;

            let bg = "#C0C0C0";
            let border = "3px solid #808080";
            let color = "#000000";
            let boxShadow =
              "inset 3px 3px 0 #FFFFFF, inset -3px -3px 0 #808080";
            let label = "";

            if (isRevealed) {
              bg = "#DCDCDC";
              border = "3px solid #A0A0A0";
              boxShadow =
                "inset -3px -3px 0 #FFFFFF, inset 3px 3px 0 #808080";
            }

            if (cell.isMine && isRevealed) {
              bg = "#FF0000";
              border = "3px solid #800000";
              color = "#FFFFFF";
              boxShadow =
                "inset 3px 3px 0 #800000, inset -3px -3px 0 #FFA0A0";
              label = "💣";
            } else if (isRevealed && cell.adjacentMines > 0) {
              label = String(cell.adjacentMines);
              const n = cell.adjacentMines;
              const numColorMap = {
                1: "#0000FF",
                2: "#008000",
                3: "#FF0000",
                4: "#000080",
                5: "#800000",
                6: "#008080",
                7: "#000000",
                8: "#808080",
              };
              color = numColorMap[n] || "#000000";
            } else if (!isRevealed) {
              label = String(num);
            }

            const disabled = isRevealed;

            return (
              <button
                key={num}
                type="button"
                disabled={disabled}
                onClick={() => handleCellClick(num)}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  border,
                  background: bg,
                  color,
                  fontSize: 18,
                  fontWeight: 700,
                  cursor: disabled ? "default" : "pointer",
                  boxShadow,
                  textAlign: "center",
                  lineHeight: 1.1,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}