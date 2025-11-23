// src/components/GameCenter/BoardGame/Dice.jsx
import React from "react";

/** 주사위 눈(1~6)에 맞춰 점(dot)들을 렌더링 */
export function DiceFaces({ value }) {
  const dotStyle = {
    width: 6,
    height: 6,
    borderRadius: "50%",
    backgroundColor: "#111827",
  };

  // 3x3 그리드 안에 점 위치
  const positions = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  const active = positions[value] || [];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gridTemplateRows: "repeat(3, 1fr)",
        padding: 6,
        boxSizing: "border-box",
        gap: 4,
      }}
    >
      {Array.from({ length: 9 }).map((_, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {active.includes(idx) && <div style={dotStyle} />}
        </div>
      ))}
    </div>
  );
}

/** 주사위 박스 + 버튼 */
export function DiceBox({
  value,
  isRolling,
  rotation,
  onRoll,
  disabled,
}) {
  const diceBoxStyle = {
    width: 52,
    height: 52,
    borderRadius: 14,
    border: "2px solid rgba(244,244,245,0.95)",
    background: "radial-gradient(circle at top, #f9fafb, #e5e7eb)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow:
      "0 0 10px rgba(244,244,245,0.8), 0 0 25px rgba(168,85,247,0.7)",
    transform: `rotate(${rotation}deg)`,
    transition: "transform 0.09s ease-in-out",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={diceBoxStyle}>
        {isRolling ? (
          <DiceFaces value={value || 1} />
        ) : value ? (
          <DiceFaces value={value} />
        ) : (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Ready
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onRoll}
        disabled={disabled}
        style={{
          padding: "4px 10px",
          borderRadius: 999,
          border: "1px solid rgba(147,197,253,0.9)",
          background:
            "linear-gradient(135deg,rgba(59,130,246,0.95),rgba(129,140,248,0.95))",
          color: "#fff",
          fontWeight: 800,
          fontSize: 14,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          boxShadow: "0 0 12px rgba(59,130,246,0.95)",
        }}
      >
        🎲 주사위
      </button>
    </div>
  );
}