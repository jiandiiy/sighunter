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

/** 🎯 1~totalCells 사이에서 랜덤으로 mineCount개 뽑기 */
function generateMines(totalCells, mineCount) {
  const safeTotal = Math.max(10, Math.min(50, totalCells));
  const safeMines = Math.max(1, Math.min(5, mineCount));

  const result = new Set();
  while (result.size < Math.min(safeMines, safeTotal)) {
    const n = Math.floor(Math.random() * safeTotal) + 1; // 1~safeTotal
    result.add(n);
  }
  return Array.from(result);
}

export default function MinesGame() {
  // 방송 전에 조절할 수 있는 설정값
  const [totalCells, setTotalCells] = useState(20); // 10~50
  const [mineCount, setMineCount] = useState(3); // 1~5

  // 게임 진행 상태
  const [mines, setMines] = useState([]); // 지뢰 위치
  const [clicked, setClicked] = useState({}); // { 1: "safe" | "mine" }
  const [gameOver, setGameOver] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [round, setRound] = useState(1);

  // 설정 변경 시 새 판 세팅
  useEffect(() => {
    const m = generateMines(totalCells, mineCount);
    setMines(m);
    setClicked({});
    setGameOver(false);
    setCleared(false);
    setRound((r) => r + 1);
  }, [totalCells, mineCount]);

  // 안전 칸 진행도 계산
  const safeInfo = useMemo(() => {
    const totalSafe = totalCells - mines.length;
    const clickedSafe = Object.values(clicked).filter(
      (v) => v === "safe"
    ).length;
    return { totalSafe, clickedSafe };
  }, [totalCells, mines, clicked]);

  // 칸 클릭 처리
  const handleCellClick = (num) => {
    if (gameOver || cleared) return;
    if (clicked[num]) return;

    const isMine = mines.includes(num);
    const next = { ...clicked, [num]: isMine ? "mine" : "safe" };
    setClicked(next);

    if (isMine) {
      setGameOver(true);
      fireBombEffect();
      return;
    }

    const safeClicked = Object.values(next).filter((v) => v === "safe").length;
    const totalSafe = totalCells - mines.length;
    if (totalSafe > 0 && safeClicked >= totalSafe) {
      setCleared(true);
    }
  };

  // 새 판 시작 버튼
  const handleReset = () => {
    const m = generateMines(totalCells, mineCount);
    setMines(m);
    setClicked({});
    setGameOver(false);
    setCleared(false);
    setRound((r) => r + 1);
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 800,
        margin: "0 auto",
        padding: 16,
        boxSizing: "border-box",
        background:
          "radial-gradient(circle at top, rgba(15,23,42,0.96), rgba(3,7,18,0.96))",
        borderRadius: 16,
        border: "1px solid rgba(148,163,184,0.35)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.6)",
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "0.04em",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            💣 지뢰게임
            <span
              style={{
                fontSize: 12,
                color: "#fff",
                padding: "2px 8px",
                borderRadius: 9999,
                border: "1px solid rgba(248,250,252,0.2)",
                background: "rgba(15,23,42,0.9)",
              }}
            >
              ROUND {round}
            </span>
          </h2>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 12,
              color: "#fff",
              opacity: 0.7,
            }}
          >
            BJ가 말한 번호 버튼을 클릭하면 됩니다.
          </p>
        </div>

        <div
          style={{
            fontSize: 12,
            color: "#fff",
            textAlign: "right",
            lineHeight: 1.4,
          }}
        >
          <div>
            칸 수:{" "}
            <b>
              {totalCells} (지뢰 {mines.length}개)
            </b>
          </div>
          <div>
            안전 칸:{" "}
            <b>
              {safeInfo.clickedSafe}/{safeInfo.totalSafe}
            </b>
          </div>
        </div>
      </div>

      {/* 설정 영역 */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginBottom: 10,
          flexWrap: "wrap",
          fontSize: 12,
          color: "#fff",
        }}
      >
        <div
          style={{
            padding: "4px 8px",
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.45)",
          }}
        >
          <label style={{
            color: "#fff",
          }}>
            총 칸 수 (10~50)&nbsp;
            <input
              type="number"
              min={10}
              max={50}
              value={totalCells}
              onChange={(e) => {
                const v = Number(e.target.value) || 10;
                setTotalCells(Math.max(10, Math.min(50, v)));
              }}
              style={{
                width: 50,
                background: "transparent",
                border: "1px solid rgba(148,163,184,0.6)",
                color: "#f9fafb",
                fontSize: 12,
                borderRadius: 4,
                padding: "1px 4px",
              }}
            />
          </label>
        </div>

        <div
          style={{
            padding: "4px 8px",
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.45)",
          }}
        >
          <label style={{color: "#fff",}}>
            지뢰 개수 (1~5)&nbsp;
            <input
              type="number"
              min={1}
              max={5}
              value={mineCount}
              onChange={(e) => {
                const v = Number(e.target.value) || 1;
                setMineCount(Math.max(1, Math.min(5, v)));
              }}
              style={{
                width: 40,
                background: "transparent",
                border: "1px solid rgba(148,163,184,0.6)",
                color: "#f9fafb",
                fontSize: 12,
                borderRadius: 4,
                padding: "1px 4px",
              }}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={handleReset}
          style={{
            padding: "4px 10px",
            borderRadius: 9999,
            border: "1px solid rgba(248,250,252,0.7)",
            background:
              "linear-gradient(135deg, rgba(248,250,252,0.9), rgba(226,232,240,0.9))",
            color: "#111827",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          🔁 새 판 시작
        </button>
      </div>

      {/* 상태 메시지 */}
      <div style={{ marginBottom: 10, minHeight: 22 }}>
        {gameOver && (
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "#fecaca",
              fontWeight: 700,
            }}
          >
            💥 지뢰를 밟았습니다! (폭탄 터짐)
          </p>
        )}
        {!gameOver && cleared && (
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "#bbf7d0",
              fontWeight: 700,
            }}
          >
            🎉 모든 안전 칸을 다 찾았습니다! (클리어)
          </p>
        )}
        {!gameOver && !cleared && (
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "#e5e7eb",
              opacity: 0.85,
            }}
          >
            예: “5번!” → 5번 버튼을 눌러서 지뢰를 피해주세요.
          </p>
        )}
      </div>

      {/* 번호 버튼들 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(10, minmax(32px, 1fr))",
          gap: 6,
        }}
      >
        {Array.from({ length: totalCells }, (_, i) => {
          const num = i + 1;
          const state = clicked[num]; // "mine" | "safe" | undefined

          let bg = "rgba(31,41,55,0.9)";
          let border = "1px solid rgba(55,65,81,1)";
          let color = "#e5e7eb";
          let icon = num;

          if (state === "safe") {
            bg = "linear-gradient(135deg, #22c55e, #4ade80)";
            border = "1px solid rgba(22,163,74,0.9)";
            color = "#052e16";
          } else if (state === "mine") {
            bg = "linear-gradient(135deg, #ef4444, #f97316)";
            border = "1px solid rgba(248,113,113,0.9)";
            color = "#fef2f2";
            icon = "💣";
          } else if (gameOver || cleared) {
            bg = "rgba(15,23,42,0.8)";
            border = "1px solid rgba(30,64,175,0.4)";
            color = "#6b7280";
          }

          const disabled = !!state || gameOver || cleared;

          return (
            <button
              key={num}
              type="button"
              disabled={disabled}
              onClick={() => handleCellClick(num)}
              style={{
                padding: "6px 0 2px",
                borderRadius: 8,
                border,
                background: bg,
                color,
                fontSize: 14,
                fontWeight: 700,
                cursor: disabled ? "default" : "pointer",
                transition:
                  "transform 0.08s ease-out, box-shadow 0.08s ease-out, background 0.1s",
                boxShadow:
                  state === "mine"
                    ? "0 0 12px rgba(248,113,113,0.8)"
                    : state === "safe"
                    ? "0 0 10px rgba(52,211,153,0.7)"
                    : "0 0 4px rgba(15,23,42,0.6)",
              }}
            >
              {icon}
              <span
                style={{
                  display: "block",
                  fontSize: 9,
                  opacity: 0.8,
                  marginTop: -2,
                }}
              >
                {num}
              </span>
            </button>
          );
        })}
      </div>

      <p
        style={{
          marginTop: 10,
          fontSize: 11,
          color: "#fff",
          opacity: 0.55,
          textAlign: "right",
        }}
      >
        💡 지뢰 위치는 매 판마다 랜덤으로 바뀝니다.
      </p>
    </div>
  );
}