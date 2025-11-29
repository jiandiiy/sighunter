// src/components/GameCenter/GameHub.jsx
import React, { useState, useEffect } from "react";
import SigHunterFlip from "../SigHunterFlip/SigHunterFlip";
import MinesGame from "./MinesGame";
import BoardGame from "./BoardGame/BoardGame";
import BigWheelGame from "./BigWheelGame";
import BingoBoard from "./Bingo/BingoBoard";

export default function GameHub() {
  // "sig" | "mines" | "board" | "wheel" | "bingo"
  // 마지막에 보던 게임을 localStorage에서 불러와 초기값으로 사용
  const [game, setGame] = useState(() => {
    if (typeof window === "undefined") return "sig";
    const saved = window.localStorage.getItem("gameHub.lastGame");
    return saved || "sig";
  });

  // 식대전 빙고 안에서 1 / 2 선택
  const [bingoTab, setBingoTab] = useState(() => {
    if (typeof window === "undefined") return "1";
    const saved = window.localStorage.getItem("gameHub.lastBingoTab");
    return saved || "1";
  });

  // game 변경 시 저장
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("gameHub.lastGame", game);
  }, [game]);

  // bingoTab 변경 시 저장
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("gameHub.lastBingoTab", bingoTab);
  }, [bingoTab]);

  return (
    <div
      style={{
        minHeight: "100%",
        background: "transparent",
        color: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px 8px",
        boxSizing: "border-box",
        fontFamily:
          "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
        ></p>
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
            border:
              game === "sig" ? "2px solid #ffb6c1" : "1px solid #4b5563",
            background:
              game === "sig"
                ? "linear-gradient(135deg, #ff7eb3, #ffb6c1)"
                : "linear-gradient(135deg, #111827, #020617)",
            cursor: "pointer",
            fontFamily:
              "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontSize: 15,
            color: "#fff",
            fontWeight: 800,
          }}
        >
          🔍 시그헌터
        </button>

        {/* 식대전 빙고 버튼 (시그헌터 바로 옆) */}
        <button
          type="button"
          onClick={() => setGame("bingo")}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border:
              game === "bingo" ? "2px solid #f97316" : "1px solid #4b5563",
            background:
              game === "bingo"
                ? "linear-gradient(135deg, #f97316, #facc15)"
                : "linear-gradient(135deg, #111827, #020617)",
            color: "#fffbeb",
            fontWeight: 800,
            cursor: "pointer",
            fontSize: 15,
            fontFamily:
              "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          🍽️ 식대전 빙고
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
            fontFamily:
              "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
            fontFamily:
              "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            color: "#fff",
          }}
        >
          🎲 부루마불
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
            fontFamily:
              "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          🎡 빅휠게임
        </button>
      </div>

      {/* 게임 컨테이너 */}
      <div
        style={{
          width: "100%",
          height: "100vh",
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

        {game === "bingo" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              width: "100%",
            }}
          >
            {/* 내부 탭: 빙고 1 / 빙고 2 */}
            <div
              style={{
                display: "inline-flex",
                gap: 4,
                padding: 4,
                borderRadius: 999,
                background: "rgba(15,23,42,0.9)",
                boxShadow: "0 0 10px rgba(15,23,42,0.9)",
                marginBottom: 8,
              }}
            >
              <button
                type="button"
                onClick={() => setBingoTab("1")}
                style={{
                  padding: "4px 12px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily:
                    "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  background:
                    bingoTab === "1"
                      ? "linear-gradient(135deg, #f97316, #facc15)"
                      : "transparent",
                  color: bingoTab === "1" ? "#0f172a" : "#e5e7eb",
                }}
              >
                빙고 1
              </button>
              <button
                type="button"
                onClick={() => setBingoTab("2")}
                style={{
                  padding: "4px 12px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily:
                    "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  background:
                    bingoTab === "2"
                      ? "linear-gradient(135deg, #fb923c, #fef08a)"
                      : "transparent",
                  color: bingoTab === "2" ? "#0f172a" : "#e5e7eb",
                }}
              >
                빙고 2
              </button>
            </div>

            {/* 빙고판: 1,2 각각 독립 상태를 위해 key 분리 */}
            {bingoTab === "1" && <BingoBoard key="bingo1" boardId="bingo1" />}
            {bingoTab === "2" && <BingoBoard key="bingo2" boardId="bingo2" />}
          </div>
        )}
      </div>
    </div>
  );
}