import React, { useState } from "react";
import SigHunterFlip from "../SigHunterFlip/SigHunterFlip";
import MinesGame from "./MinesGame";
import BoardGame from "./BoardGame/BoardGame";
import BigWheelGame from "./BigWheelGame"; // 🎡 빅휠 게임 추가

export default function GameHub() {
  // "sig" | "mines" | "board" | "wheel"
  const [game, setGame] = useState("sig");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "transparent",
        color: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px 8px",
        boxSizing: "border-box",
        fontFamily: "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* 상단 헤더 */}
      <div style={{ marginBottom: 16, textAlign: "center" }}>
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            letterSpacing: "0.05em",
            fontWeight: 900,
          }}
        >
          🎮 GAME CENTER 🎮
        </h1>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 13,
            opacity: 0.7,
          }}
        >
        </p>
      </div>

      {/* 게임 선택 버튼 */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {/* 시그헌터 버튼 */}
        <button
          type="button"
          onClick={() => setGame("sig")}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: game === "sig" ? "2px solid #ffb6c1" : "1px solid #4b5563",
            background:
              game === "sig"
                ? "linear-gradient(135deg, #ff7eb3, #ffb6c1)"
                : "linear-gradient(135deg, #111827, #020617)",
            cursor: "pointer",
            fontFamily: "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: 15,
          color: "#fff",
          fontWeight: 800,
          }} 
        >
          🔍 시그헌터
        </button>

        {/* 지뢰게임 버튼 */}
        <button
          type="button"
          onClick={() => setGame("mines")}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border:
              game === "mines" ? "2px solid #a5b4fc" : "1px solid #4b5563",
            background:
              game === "mines"
                ? "linear-gradient(135deg, #4c1d95, #6366f1)"
                : "linear-gradient(135deg, #111827, #020617)",
          fontFamily: "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          color: "#fff",
          fontWeight: 800,
            cursor: "pointer",
            fontSize: 15,
          }}
        >
          💣 지뢰게임
        </button>

        {/* 브루마블 버튼 */}
        <button
          type="button"
          onClick={() => setGame("board")}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border:
              game === "board" ? "2px solid #6ee7b7" : "1px solid #4b5563",
            background:
              game === "board"
                ? "linear-gradient(135deg, #10b981, #6ee7b7)"
                : "linear-gradient(135deg, #111827, #020617)",
            fontWeight: 800,
            cursor: "pointer",
            fontSize: 15,
            fontFamily: "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            color: "#fff",
          }}
        >  
          🎲 부루마블
        </button>

        {/* 빅휠 게임 버튼 */}
        <button
          type="button"
          onClick={() => setGame("wheel")}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border:
              game === "wheel" ? "2px solid #f9a8d4" : "1px solid #4b5563",
            background:
              game === "wheel"
                ? "linear-gradient(135deg, #ec4899, #a855f7)"
                : "linear-gradient(135deg, #111827, #020617)",
            color: "#fdf2f8",
            fontWeight: 800,
            cursor: "pointer",
            fontSize: 15,
            fontFamily: "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          🎡 빅휠게임
        </button>
      </div>

      {/* 게임 컨테이너 */}
      <div
        style={{
          width: "100%",
          maxWidth: 1024,
          flexGrow: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        {game === "sig" && <SigHunterFlip />}
        {game === "mines" && <MinesGame />}
        {game === "board" && <BoardGame />}
        {game === "wheel" && <BigWheelGame />}
      </div>
    </div>
  );
}