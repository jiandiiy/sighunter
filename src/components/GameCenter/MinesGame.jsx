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

/** 🔢 5×10 보드 (총 50칸) */
const ROWS = 10;
const COLS = 5;
const TOTAL_CELLS = ROWS * COLS; // 50

function createEmptyBoard() {
  const board = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
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
function generateBoard(mineCount) {
  const board = createEmptyBoard();

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
    const r = Math.floor(idx / COLS);
    const c = idx % COLS;
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
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c].isMine) continue;
      let count = 0;
      dirs.forEach(([dr, dc]) => {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          if (board[nr][nc].isMine) count++;
        }
      });
      board[r][c].adjacentMines = count;
    }
  }

  return board;
}

/** 1~50 번호 → (row, col) */
function numToCoord(num) {
  const idx = num - 1;
  const row = Math.floor(idx / COLS);
  const col = idx % COLS;
  return { row, col };
}

export default function MinesGame2D_5x10() {
  const [mineCount, setMineCount] = useState(10); // 50칸 기준 기본 10개 정도
  const [board, setBoard] = useState(() => generateBoard(mineCount));
  const [round, setRound] = useState(1);
  const [cleared, setCleared] = useState(false);

  // 새 판 세팅 (지뢰 수 바뀔 때)
  useEffect(() => {
    const b = generateBoard(mineCount);
    setBoard(b);
    setCleared(false);
    setRound((r) => r + 1);
  }, [mineCount]);

  // 안전 칸 / 찾은 지뢰 수 계산
  const { safeInfo, foundMines } = useMemo(() => {
    let totalSafe = 0;
    let revealedSafe = 0;
    let mines = 0;
    let revealedMines = 0;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = board[r][c];
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
  }, [board]);

  /** 0인 칸 주변 자동 오픈 (지금은 안 씀) */
  const revealZeros = (b, row, col) => {
    const stack = [[row, col]];
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

    while (stack.length > 0) {
      const [r, c] = stack.pop();
      const cell = b[r][c];
      if (cell.isRevealed || cell.isMine) continue;

      cell.isRevealed = true;

      if (cell.adjacentMines === 0) {
        dirs.forEach(([dr, dc]) => {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
            const ncell = b[nr][nc];
            if (!ncell.isRevealed && !ncell.isMine) {
              stack.push([nr, nc]);
            }
          }
        });
      }
    }
  };

  /** 셀 클릭 (번호 기반) */
  const handleCellClick = (num) => {
    const { row, col } = numToCoord(num);

    setBoard((prev) => {
      const next = prev.map((r) => r.map((c) => ({ ...c })));
      const cell = next[row][col];

      // 이미 연 칸이면 무시
      if (cell.isRevealed) return prev;

      if (cell.isMine) {
        // 게임은 끝내지 않고, 이펙트 + 지뢰 표시만
        cell.isRevealed = true;
        fireBombEffect();
      } else {
        // 클릭한 칸만 연다
        cell.isRevealed = true;
      }

      // 지뢰를 전부 찾았는지 체크
      let mines = 0;
      let revealedMines = 0;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (next[r][c].isMine) {
            mines++;
            if (next[r][c].isRevealed) revealedMines++;
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
    const b = generateBoard(mineCount);
    setBoard(b);
    setCleared(false);
    setRound((r) => r + 1);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        maxWidth: 520,
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
          }}
        >
          {cleared ? "😎" : "🙂"}
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
          boxShadow:
            "inset 3px 3px 0 #FFFFFF, inset -3px -3px 0 #808080",
          padding: 8,
          marginBottom: 8,
          background: "#C0C0C0",
          fontSize: 13,
        }}
      >
        {/* 🔹 첫 줄: 보드 / 지뢰 수 / 안전 칸 / 찾은 지뢰 한 줄 정렬 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 6,
            flexWrap: "nowrap",
          }}
        >
          <div style={{ whiteSpace: "nowrap" }}>
            보드: <b>5 × 10 (총 50칸)</b>
          </div>

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
              max={49}
              value={mineCount}
              onChange={(e) => {
                const v = Number(e.target.value) || 1;
                setMineCount(Math.max(1, Math.min(49, v)));
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

          {/* 가운데 공간을 밀어주는 flex */}
          <div style={{ flex: 1 }} />

          <div style={{ fontSize: 13, whiteSpace: "nowrap" }}>
            안전 칸:{" "}
            <b>
              {safeInfo.revealedSafe}/{safeInfo.totalSafe}
            </b>{" "}
            · 찾은 지뢰:{" "}
            <b>
              {foundMines.revealedMines}/{foundMines.mines}
            </b>
          </div>
        </div>

        <div style={{ fontSize: 12, color: "#202020" }}>
          버튼 번호는 1~50입니다. BJ가 말한 번호를 눌러 칸을 여세요.
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

      {/* 5×10 보드 (총 50칸) */}
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
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gap: 2,
          }}
        >
          {Array.from({ length: TOTAL_CELLS }, (_, i) => {
            const num = i + 1; // 1~50
            const { row, col } = numToCoord(num);
            const cell = board[row][col];

            const isRevealed = cell.isRevealed;

            // 기본값: 아직 안 누른, 볼록한 버튼
            let bg = "#C0C0C0";
            let border = "3px solid #808080";
            let color = "#000000";
            let boxShadow =
              "inset 3px 3px 0 #FFFFFF, inset -3px -3px 0 #808080";
            let label = "";

            // 칸이 열린 경우: 눌린(오목한) 스타일
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
              // 방송용 번호
              label = String(num);
            }

            const disabled = isRevealed; // 이미 연 칸만 비활성화

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