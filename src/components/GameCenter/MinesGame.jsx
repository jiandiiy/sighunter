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
  // 지뢰는 최소 1개, 최대 (safeTotal - 1)개까지 허용
  const maxMines = Math.max(1, safeTotal - 1);
  const safeMines = Math.max(1, Math.min(maxMines, mineCount));

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
  const [mineCount, setMineCount] = useState(3); // 1~49

  // 게임 진행 상태
  const [mines, setMines] = useState([]); // 지뢰 위치
  const [clicked, setClicked] = useState({}); // { 1: "safe" | "mine" }
  const [cleared, setCleared] = useState(false);
  const [round, setRound] = useState(1);

  // 설정 변경 시 새 판 세팅
  useEffect(() => {
    const m = generateMines(totalCells, mineCount);
    setMines(m);
    setClicked({});
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
    // 클리어된 뒤에는 더 이상 누르지 못하게
    if (cleared) return;
    if (clicked[num]) return;

    const isMine = mines.includes(num);
    const next = { ...clicked, [num]: isMine ? "mine" : "safe" };
    setClicked(next);

    if (isMine) {
      // 게임은 끝내지 않고, 이펙트만
      fireBombEffect();
    }

    // 찾은 지뢰 개수
    const foundMines = Object.values(next).filter((v) => v === "mine").length;

    // 모든 지뢰를 찾으면 클리어
    if (mines.length > 0 && foundMines >= mines.length) {
      setCleared(true);
      return;
    }

    // (원래 있던 '모든 안전 칸 클릭 시 클리어' 로직은 제거)
  };

  // 새 판 시작 버튼
  const handleReset = () => {
    const m = generateMines(totalCells, mineCount);
    setMines(m);
    setClicked({});
    setCleared(false);
    setRound((r) => r + 1);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        maxWidth: 550,
        maxHeight: 500,
        margin: " 50px auto",
        padding: 16,
        boxSizing: "border-box",
        background:
          "radial-gradient(circle at top, #120824, #050014)", // 시그헌터 계열 남보라
        border: "1px solid rgba(129,140,248,0.65)", // 인디고 라인
        boxShadow: "0 22px 70px rgba(15,23,42,0.95)",
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
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "0.04em",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily:
                "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            💣 지뢰게임
            <span
              style={{
                fontSize: 12,
                color: "#fff",
                padding: "2px 8px",
                borderRadius: 9999,
                border: "1px solid rgba(191,219,254,0.5)",
                background:
                  "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,64,175,0.9))",
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
          {/* 칸 수 */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end", // 오른쪽 정렬
              gap: 4,
            }}
          >
            <span>칸 수:</span>
            <b>{totalCells}</b>
            <span>(지뢰 {mines.length}개)</span>
          </div>

          {/* 안전 칸 */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              gap: 4,
            }}
          >
            <span>안전 칸:</span>
            <b>
              {safeInfo.clickedSafe}/{safeInfo.totalSafe}
            </b>
          </div>
        </div>
      </div>

      {/* 설정 영역 */}
      {/* 설정 전체 래퍼 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 10,
          fontSize: 12,
          color: "#fff",
        }}
      >
        {/* 첫 줄: 총 칸 수 / 지뢰 개수 */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 180,
              padding: "6px 8px",
              borderRadius: 8,
              border: "1px solid rgba(129,140,248,0.55)",
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,64,175,0.75))",
            }}
          >
            <label
              style={{
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: 600,
              }}
            >
              <span>총 칸 수 (10~50)</span>
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
                  width: 40,
                  height: 22,
                  background: "rgba(15,23,42,0.85)",
                  border: "1px solid rgba(165,180,252,0.9)",
                  color: "#f9fafb",
                  fontSize: 16,
                  borderRadius: 4,
                  padding: "1px 4px",
                  marginLeft: 20,
                }}
              />
            </label>
          </div>

          <div
            style={{
              flex: 1,
              minWidth: 180,
              padding: "6px 8px",
              borderRadius: 8,
              border: "1px solid rgba(129,140,248,0.55)",
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,64,175,0.75))",
            }}
          >
            <label
              style={{
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: 600,
              }}
            >
              <span>지뢰 개수 (1~49)&nbsp;</span>
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
                  width: 40,
                  height: 22,
                  background: "rgba(15,23,42,0.85)",
                  border: "1px solid rgba(165,180,252,0.9)",
                  color: "#f9fafb",
                  fontSize: 16,
                  borderRadius: 4,
                  padding: "1px 4px",
                  marginLeft: 22,
                }}
              />
            </label>
          </div>
        </div>

        {/* 두 번째 줄: 새 판 시작 버튼 (전체 폭) */}
        <button
          type="button"
          onClick={handleReset}
          style={{
            width: "100%",
            padding: "5px",
            border: "1px solid rgba(248,250,252,0.8)",
            background:
              "linear-gradient(135deg, rgba(248,250,252,0.95), rgba(226,232,240,0.95))",
            color: "#111827",
            fontSize: 18,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          🔁 새 판 시작
        </button>
      </div>

      {/* 상태 메시지 */}
      <div style={{ marginBottom: 10, minHeight: 22 }}>
        {cleared ? (
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "#bbf7d0",
              fontWeight: 700,
            }}
          >
            🎉 모든 지뢰를 다 찾았습니다! (클리어)
          </p>
        ) : (
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "#e5e7eb",
              opacity: 0.85,
            }}
          >
            예: “5번!” → 5번 버튼을 눌러서 지뢰를 찾아보세요.
          </p>
        )}
      </div>

      {/* 번호 버튼들 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(10, minmax(32px, 1fr))",
          gap: 3,
        }}
      >
        {Array.from({ length: totalCells }, (_, i) => {
          const num = i + 1;
          const state = clicked[num]; // "mine" | "safe" | undefined

          let bg = "rgba(31,41,55,0.9)";
          let border = "1px solid rgba(55,65,81,1)";
          let color = "#e5e7eb";

          if (state === "safe") {
            bg = "linear-gradient(135deg, #22c55e, #4ade80)";
            border = "1px solid rgba(22,163,74,0.9)";
            color = "#052e16";
          } else if (state === "mine") {
            bg = "linear-gradient(135deg, #ef4444, #f97316)";
            border = "1px solid rgba(248,113,113,0.9)";
            color = "#fef2f2";
          } else if (cleared) {
            bg = "rgba(15,23,42,0.8)";
            border = "1px solid rgba(30,64,175,0.4)";
            color = "#6b7280";
          }

          const disabled = !!state || cleared;

          return (
            <button
              key={num}
              type="button"
              disabled={disabled}
              onClick={() => handleCellClick(num)}
              style={{
                padding: "10px 5px",
                border,
                background: bg,
                color,
                fontSize: 20,
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
              {state === "mine" ? "💣" : num}
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