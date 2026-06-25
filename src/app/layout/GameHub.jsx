import React, { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";

export default function GameHub() {
  const navigate = useNavigate();

  // "sig" | "sigslot" | "mines" | "board" | "wheel" | "bingo" | "hunterBingo" | "hp" | "dice" | "treasure"
  const [game, setGame] = useState(() => {
    if (typeof window === "undefined") return "sig";
    const saved = window.localStorage.getItem("gameHub.lastGame");
    return saved || "sig";
  });

  const [showPlayerModal, setShowPlayerModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("gameHub.lastGame", game);
  }, [game]);

  const handleSelectGame = (targetGame) => {
    setGame(targetGame);
    switch (targetGame) {
      case "sig":
        navigate("/sig");
        break;
      case "sigslot":
        setShowPlayerModal(true);
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
        navigate("/bingo/1");
        break;
      case "hunterBingo":
        navigate("/hunter-bingo");
        break;
      case "hp":
        navigate("/hp-battle");
        break;
      case "dice":
        navigate("/dice-game");
        break;
      case "treasure":
        navigate("/treasure");
        break;
      default:
        navigate("/");
    }
  };

  const handleSelectPlayer = (playerNum) => {
    setShowPlayerModal(false);
    navigate(`/sig-slot/${playerNum}`);
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
        <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.7 }}></p>
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
        {/* 시그헌터 */}
        <button
          type="button"
          onClick={() => handleSelectGame("sig")}
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

        {/* 시그슬롯 */}
        <button
          type="button"
          onClick={() => handleSelectGame("sigslot")}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: game === "sigslot" ? "2px solid #fbbf24" : "1px solid #4b5563",
            background:
              game === "sigslot"
                ? "linear-gradient(135deg, #f59e0b, #fbbf24)"
                : "linear-gradient(135deg, #111827, #020617)",
            cursor: "pointer",
            fontFamily: "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontSize: 15,
            color: "#fff",
            fontWeight: 800,
          }}
        >
          🎰 시그슬롯
        </button>

        {/* 주사위 게임 */}
        <button
          type="button"
          onClick={() => handleSelectGame("dice")}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: game === "dice" ? "2px solid #c084fc" : "1px solid #4b5563",
            background:
              game === "dice"
                ? "linear-gradient(135deg, #a855f7, #c084fc)"
                : "linear-gradient(135deg, #111827, #020617)",
            color: "#f3e8ff",
            fontWeight: 800,
            cursor: "pointer",
            fontSize: 15,
            fontFamily: "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          🎲 주사위게임
        </button>

        {/* 보물찾기 ✨ 신규 */}
        <button
          type="button"
          onClick={() => handleSelectGame("treasure")}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: game === "treasure" ? "2px solid #fcd34d" : "1px solid #4b5563",
            background:
              game === "treasure"
                ? "linear-gradient(135deg, #d97706, #fcd34d)"
                : "linear-gradient(135deg, #111827, #020617)",
            color: game === "treasure" ? "#1c1600" : "#fcd34d",
            fontWeight: 800,
            cursor: "pointer",
            fontSize: 15,
            fontFamily: "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          🏆 보물찾기
        </button>

        {/* 식대전 빙고 */}
        <button
          type="button"
          onClick={() => handleSelectGame("bingo")}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: game === "bingo" ? "2px solid #f97316" : "1px solid #4b5563",
            background:
              game === "bingo"
                ? "linear-gradient(135deg, #f97316, #facc15)"
                : "linear-gradient(135deg, #111827, #020617)",
            color: "#fffbeb",
            fontWeight: 800,
            cursor: "pointer",
            fontSize: 15,
            fontFamily: "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          🍽️ 식대전 빙고
        </button>

        {/* 시그 땅따먹기 */}
        <button
          type="button"
          onClick={() => handleSelectGame("hunterBingo")}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: game === "hunterBingo" ? "2px solid #22c55e" : "1px solid #4b5563",
            background:
              game === "hunterBingo"
                ? "linear-gradient(135deg, #22c55e, #a7f3d0)"
                : "linear-gradient(135deg, #111827, #020617)",
            color: "#ecfdf5",
            fontWeight: 800,
            cursor: "pointer",
            fontSize: 15,
            fontFamily: "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          🎯 시그 땅따먹기
        </button>

        {/* 지뢰게임 */}
        <button
          type="button"
          onClick={() => handleSelectGame("mines")}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: game === "mines" ? "2px solid #a5b4fc" : "1px solid #4b5563",
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

        {/* 부루마불 */}
        <button
          type="button"
          onClick={() => handleSelectGame("board")}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: game === "board" ? "2px solid #6ee7b7" : "1px solid #4b5563",
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
          🎲 부루마불
        </button>

        {/* 빅휠게임 */}
        <button
          type="button"
          onClick={() => handleSelectGame("wheel")}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: game === "wheel" ? "2px solid #f9a8d4" : "1px solid #4b5563",
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

        {/* HP 배틀 게이지 */}
        <button
          type="button"
          onClick={() => handleSelectGame("hp")}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: game === "hp" ? "2px solid #22c55e" : "1px solid #4b5563",
            background:
              game === "hp"
                ? "linear-gradient(135deg, #22c55e, #a7f3d0)"
                : "linear-gradient(135deg, #111827, #020617)",
            color: "#ecfdf5",
            fontWeight: 800,
            cursor: "pointer",
            fontSize: 15,
            fontFamily: "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          💚 HP 배틀 게이지
        </button>

        {/* 관리 센터 */}
        <button
          type="button"
          onClick={() => navigate("/admin")}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: "1px solid #4b5563",
            background: "linear-gradient(135deg, #0f172a, #020617)",
            color: "#fde68a",
            fontWeight: 800,
            cursor: "pointer",
            fontSize: 13,
            fontFamily: "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          🛠 관리 센터
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
        <Outlet />
      </div>

      {/* 플레이어 선택 모달 */}
      {showPlayerModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowPlayerModal(false)}
        >
          <div
            style={{
              backgroundColor: "#111827",
              border: "2px solid #fbbf24",
              borderRadius: 12,
              padding: 24,
              textAlign: "center",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                margin: "0 0 20px",
                color: "#fbbf24",
                fontSize: 20,
                fontWeight: 900,
              }}
            >
              🎰 플레이어 선택
            </h2>

            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              {[1, 2, 3].map((playerNum) => (
                <button
                  key={playerNum}
                  type="button"
                  onClick={() => handleSelectPlayer(playerNum)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "2px solid #fbbf24",
                    background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
                    color: "#000",
                    fontWeight: 900,
                    cursor: "pointer",
                    fontSize: 16,
                    fontFamily: "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    transition: "transform 0.1s",
                  }}
                  onMouseDown={(e) => (e.target.style.transform = "scale(0.95)")}
                  onMouseUp={(e) => (e.target.style.transform = "scale(1)")}
                >
                  👤 {playerNum}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowPlayerModal(false)}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "1px solid #4b5563",
                background: "linear-gradient(135deg, #1f2937, #111827)",
                color: "#9ca3af",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
                fontFamily: "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
