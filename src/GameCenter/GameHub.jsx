// src/components/GameCenter/GameHub.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";

export default function GameHub() {
  const navigate = useNavigate();

  // "sig" | "mines" | "board" | "wheel" | "bingo" | "hunterBingo" | "hp"
  // 👉 버튼 스타일(선택 표시) 용도로만 사용
  const [game, setGame] = useState(() => {
    if (typeof window === "undefined") return "sig";
    const saved = window.localStorage.getItem("gameHub.lastGame");
    return saved || "sig";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("gameHub.lastGame", game);
  }, [game]);

  // 버튼 클릭 시, game state 업데이트 + 해당 라우트로 이동
  const handleSelectGame = (targetGame) => {
    setGame(targetGame);
    switch (targetGame) {
      case "sig":
        navigate("/sig");
        break;
      case "mines":
        navigate("/mines");
        break;
      case "board":
        navigate("/board");
        break;
      case "wheel":
        navigate("/bigwheel");
        break;
      case "bingo":
        navigate("/bingo/1"); // 식대전 빙고 기본: 1번
        break;
      case "hunterBingo":
        navigate("/hunter-bingo");
        break;
      case "hp":
        navigate("/hp-battle");
        break;
      default:
        navigate("/");
    }
  };

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#00ff00",
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
          onClick={() => handleSelectGame("sig")}
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

        {/* 식대전 빙고 버튼 */}
        <button
          type="button"
          onClick={() => handleSelectGame("bingo")}
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

        {/* 시그헌터 빙고 버튼 */}
        <button
          type="button"
          onClick={() => handleSelectGame("hunterBingo")}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border:
              game === "hunterBingo"
                ? "2px solid #22c55e"
                : "1px solid #4b5563",
            background:
              game === "hunterBingo"
                ? "linear-gradient(135deg, #22c55e, #a7f3d0)"
                : "linear-gradient(135deg, #111827, #020617)",
            color: "#ecfdf5",
            fontWeight: 800,
            cursor: "pointer",
            fontSize: 15,
            fontFamily:
              "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          🎯 시그 땅따먹기
        </button>

        {/* 시그 땅따먹기 설정 페이지로 이동 버튼 */}
        <button
          type="button"
          onClick={() => navigate("/hunter-bingo/control")}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: "1px solid #4b5563",
            background: "linear-gradient(135deg, #111827, #020617)",
            color: "#a5b4fc",
            fontWeight: 800,
            cursor: "pointer",
            fontSize: 13,
            fontFamily:
              "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          ⚙️ 시그 땅따먹기 설정
        </button>

        {/* 시그 이미지 관리(업로드) 버튼 */}
        <button
          type="button"
          onClick={() => navigate("/admin/sig")}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: "1px solid #4b5563",
            background: "linear-gradient(135deg, #0f172a, #020617)",
            color: "#fde68a",
            fontWeight: 800,
            cursor: "pointer",
            fontSize: 13,
            fontFamily:
              "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          🛠 시그 이미지 관리
        </button>

        {/* 지뢰게임 버튼 */}
        <button
          type="button"
          onClick={() => handleSelectGame("mines")}
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
          onClick={() => handleSelectGame("board")}
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
          onClick={() => handleSelectGame("wheel")}
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

        {/* HP 배틀 게이지 버튼 */}
        <button
          type="button"
          onClick={() => handleSelectGame("hp")}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border:
              game === "hp" ? "2px solid #22c55e" : "1px solid #4b5563",
            background:
              game === "hp"
                ? "linear-gradient(135deg, #22c55e, #a7f3d0)"
                : "linear-gradient(135deg, #111827, #020617)",
            color: "#ecfdf5",
            fontWeight: 800,
            cursor: "pointer",
            fontSize: 15,
            fontFamily:
              "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          💚 HP 배틀 게이지
        </button>
      </div>

      {/* 게임 컨테이너: 현재 URL 의 자식 라우트가 렌더링됨 */}
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
        <Outlet />
      </div>
    </div>
  );
}