// src/components/GameCenter/SigHunterBingo/SigHunterBingoBoard.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import "./SigHunterBingoBoard.css";
import {
  useSigHunterBingoState,
  AVAILABLE_SIZES,
} from "./useSigHunterBingoState";

// ✅ 모드 탭 이름 매핑 (컴포넌트 밖에 선언 → 렌더링마다 재생성 방지)  
const MODE_LABELS = {  
  queendom: "퀸덤",  
  muse: "뮤즈",  
  holic: "홀릭",  
};  

export default function SigHunterBingoBoard({ boardId = "hunter1" }) {
  const {
    loading,
    mode,
    size,
    cellCount,
    cells,
    logs,
    lineOwners,
    playerColors,
    completedLineCount,
    HUNTER_MODES,
    handleChangeMode,
    handleChangeSize,
    handleResetBoard,
    handleClickCell,
    getCurrentImage,
    getCurrentCount,
    getColorForPlayer,
  } = useSigHunterBingoState(boardId);

  const [currentPlayer, setCurrentPlayer] = useState("");
  const [targetCellNo, setTargetCellNo] = useState(""); // 🔹 칸 번호 입력 상태

  // 🔹 입력창 포커스용 ref
  const playerInputRef = useRef(null);
  const cellNumberInputRef = useRef(null);

  // 🔹 Alt+Shift+D → 플레이어 닉네임 입력창 포커스
  //    Alt+Shift+F → 칸 번호 입력창 포커스
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 플레이어 닉네임 포커스
      if (e.altKey && e.shiftKey && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        if (playerInputRef.current) {
          playerInputRef.current.focus();
        }
      }

      // 칸 번호 입력창 포커스
      if (e.altKey && e.shiftKey && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        if (cellNumberInputRef.current) {
          cellNumberInputRef.current.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 🔹 플레이어별 점령 칸 수 집계
  const playerTerritoryCounts = useMemo(() => {
    const counts = {};
    cells.forEach((cell) => {
      if (!cell.owner) return;
      if (!counts[cell.owner]) counts[cell.owner] = 0;
      counts[cell.owner] += 1;
    });
    return counts;
  }, [cells]);

  // 🔹 번호(1~N)로 칸 찾아서 현재 플레이어로 클릭 처리
  const flipCellByNumber = (noStr) => {
    const n = Number(noStr);
    if (!Number.isFinite(n)) return;
    if (n < 1 || n > cellCount) return;

    const cell = cells[n - 1];
    if (!cell) return;

    handleClickCell(cell.id, currentPlayer);
  };

  if (loading) {
    return <div style={{ color: "#fff" }}>로딩 중...</div>;
  }

  return (
    <div className="hunter-root">
      <header className="hunter-header">
        <div className="hunter-header-row">
           {/* ✅ 모드 탭: MODE_LABELS 객체로 매핑, 폴백은 키값 그대로 */}
         <div className="hunter-mode-tabs">
            {HUNTER_MODES.map((m) => (
              <button
                key={m}
                className={
                  "hunter-tab" + (mode === m ? " hunter-tab--active" : "")
                }
                onClick={() => handleChangeMode(m)}
              >
                {MODE_LABELS[m] ?? m}
              </button>
            ))}
          </div>

          {/* 3x3 / 5x5 탭 */}
          <div className="hunter-mode-tabs" style={{ marginLeft: 12 }}>
            {AVAILABLE_SIZES.map((s) => (
              <button
                key={s}
                className={
                  "hunter-tab" + (size === s ? " hunter-tab--active" : "")
                }
                onClick={() => handleChangeSize(s)}
              >
                {s}×{s}
              </button>
            ))}
          </div>
        </div>

        <h2 className="hunter-title-text">🎯 시그 땅따먹기 🎯</h2>
      </header>

       <div className="hunter-main">
        {/* 좌측: 보드 */}
        <div className="hunter-main-left">
          <div className="hunter-line-count-under-board">
            <div>
              현재 점령된 줄: <span>{completedLineCount}</span> 줄
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className="hunter-reset-btn"
                onClick={handleResetBoard}
              >
                초기화
              </button>

              {/* 🔹 단축키 안내 문구 */}
              <span
                style={{
                  fontSize: 16,
                  color: "#000",
                  lineHeight: 1.4,
                }}
              >
                 *Alt+Shift+D → 닉네임
  <br />
 *Alt+Shift+F → 칸번호
              </span>
            </div>
          </div>

          <div
            className="hunter-grid"
            style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
          >
            {cells.slice(0, cellCount).map((cell) => {
              const isOwned = !!cell.owner;
              const currentImage = getCurrentImage(cell);
              const currentCount = getCurrentCount(cell);

              const ownerColor = cell.owner
                ? getColorForPlayer(cell.owner)
                : null;

              const cellStyle = ownerColor
                ? {
                    borderColor: ownerColor,
                    boxShadow: `0 0 0 2px ${ownerColor}55`,
                  }
                : {};

              return (
                <div
                  key={cell.id}
                  className={
                    "hunter-cell" + (isOwned ? " hunter-cell--owned" : "")
                  }
                  style={cellStyle}
                  onClick={() => handleClickCell(cell.id, currentPlayer)}
                >
                  <div className="hunter-cell-inner">
                    {/* 앞면: 이미지만 노출 */}
                    <div className="hunter-cell-front">
                      {currentImage && (
                        <div className="hunter-sig-image-wrap">
                          <img
                            src={currentImage}
                            alt={cell.sigName}
                            className="hunter-sig-image"
                          />
                        </div>
                      )}
                    </div>

                    {/* 뒷면: 소유자 / 점수 */}
                    <div className="hunter-cell-back">
                      <div
                        className="hunter-cell-owner-area"
                        style={
                          ownerColor ? { backgroundColor: ownerColor } : {}
                        }
                      >
                        <div className="hunter-cell-owner-text">
                          {cell.owner || "미점령"}
                        </div>
                      </div>

                      <div className="hunter-cell-count-area">
                        <div className="hunter-sig-count-back">
                          {currentCount != null ? currentCount : "???"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 우측: 닉네임, 칸 번호 입력, 플레이어 점령 현황, 줄 미니맵, 로그 */}
        <aside className="hunter-main-right">
          <div className="hunter-sidebar-top">
            <div className="hunter-player-input-row">
              <label className="hunter-player-label">
                플레이어 닉네임:
                <input
                  type="text"
                  className="hunter-player-input"
                  value={currentPlayer}
                  onChange={(e) => setCurrentPlayer(e.target.value)}
                  placeholder="닉네임"
                  ref={playerInputRef} // 🔹 단축키 포커스용 ref
                />
              </label>
              <div className="hunter-line-count">
                현재 <span>{completedLineCount}</span> 줄 점령 중
              </div>
            </div>

            {/* 🔹 플레이어 닉네임 아래: 칸 번호 입력 + 뒤집기 버튼 */}
            <div
              className="hunter-cellno-row"
              style={{
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: "#e5e7eb",
                  fontSize: 13,
                }}
              >
                <span>칸 번호:</span>

                {/* 🔹 칸 번호 입력 래퍼 (시그헌터 스타일 라벨) */}
                <div
                  className={
                    "hunter-cellno-wrapper" +
                    (targetCellNo ? " hunter-cellno-wrapper--filled" : "")
                  }
                  style={{ position: "relative", width: 70 }}
                >
                  <input
                    type="number"
                    min="1"
                    max={cellCount}
                    value={targetCellNo}
                    onChange={(e) => setTargetCellNo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        flipCellByNumber(targetCellNo);
                      }
                    }}
                    className="hunter-cellno-input"
                    style={{
                      width: "100%",
                      padding: "4px 6px",
                      borderRadius: 4,
                      border: "1px solid #e5e7eb",
                      fontSize: 18,
                      textAlign: "center",
                      backgroundColor: "#fff",
                      color: "#000",
                    }}
                    ref={cellNumberInputRef} // 🔹 단축키 포커스용 ref
                  />
                  {/* 🔹 라벨: 값 없고 포커스 없을 때만 보이게 CSS로 제어 */}
                  <span className="hunter-cellno-label">번호</span>
                </div>
              </label>

              <button
                type="button"
                onClick={() => flipCellByNumber(targetCellNo)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 10,
                  border: "1px solid #f97316",
                  background: "#111827",
                  color: "#f9fafb",
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                🎴 뒤집기
              </button>
            </div>
          </div>

          {/* 플레이어별 점령 칸 수 */}
          <div className="hunter-player-territory-summary">
            <h4 className="hunter-player-territory-title">
              플레이어 점령 현황
            </h4>

            {Object.keys(playerTerritoryCounts).length === 0 ? (
              <div className="hunter-player-territory-empty">
                아직 점령된 칸이 없습니다.
              </div>
            ) : (
              <ul className="hunter-player-territory-list">
                {Object.entries(playerTerritoryCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([player, count], index) => {
                    const color = getColorForPlayer(player);
                    const rank = index + 1;

                    return (
                      <li
                        key={player}
                        className="hunter-player-territory-item"
                      >
                        <span className="hunter-player-territory-rank">
                          {rank}위
                        </span>
                        <span
                          className="hunter-player-territory-color-dot"
                          style={{
                            backgroundColor: color,
                          }}
                        />
                        <span className="hunter-player-territory-name">
                          {player}
                        </span>
                        <span className="hunter-player-territory-count">
                          {count}칸
                        </span>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>

          {/* 줄 소유권 미니맵 */}
          <div className="hunter-lines-ownership">
            <h4 className="hunter-lines-ownership-title">
              줄 소유권 미니맵
            </h4>
            <div className="hunter-lines-ownership-list">
              {lineOwners.map((line, idx) => {
                const ownerName = line.owner;
                const color = ownerName
                  ? getColorForPlayer(ownerName)
                  : null;

                const lineLabel =
                  idx < size
                    ? `가로 ${idx + 1}`
                    : idx < size * 2
                    ? `세로 ${idx - (size - 1)}`
                    : idx === size * 2
                    ? "대각 ↘"
                    : "대각 ↙";

                return (
                  <div key={idx} className="hunter-line-mini">
                    <div className="hunter-line-mini-header">
                      <span className="hunter-line-mini-label">
                        {lineLabel}
                      </span>
                      <span
                        className={
                          "hunter-line-mini-owner" +
                          (ownerName
                            ? ""
                            : " hunter-line-mini-owner--empty")
                        }
                        style={
                          ownerName && color
                            ? { backgroundColor: color, color: "#fff" }
                            : {}
                        }
                      >
                        {ownerName || "미점령"}
                      </span>
                    </div>

                    <div className="hunter-line-mini-strip">
                      {Array.from({ length: size }).map((_, i) => (
                        <div
                          key={i}
                          className="hunter-line-mini-cell"
                          style={
                            ownerName && color
                              ? { backgroundColor: color }
                              : {}
                          }
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 로그 */}
          <section className="hunter-log-section">
            <h3 className="hunter-log-title">로그</h3>
            <div className="hunter-log-list">
              {logs.length === 0 && (
                <div className="hunter-log-empty">
                  아직 로그가 없습니다.
                </div>
              )}
              {logs
                .slice()
                .reverse()
                .map((log) => {
                  const color = log.actor
                    ? playerColors[log.actor] ||
                      getColorForPlayer(log.actor)
                    : null;

                  return (
                    <div
                      key={`${log.time}-${log.cellId}`}
                      className="hunter-log-item"
                      style={
                        color
                          ? {
                              borderLeft: `4px solid ${color}`,
                            }
                          : {}
                      }
                    >
                      <span className="hunter-log-time">
                        {new Date(log.time).toLocaleTimeString()}
                      </span>
                      <span className="hunter-log-text">
                        [{log.actor}] 님이{" "}
                        {log.prevOwner ? `${log.prevOwner} 님에게서 ` : ""}
                        {log.sigName} ({log.sigCount}점) 칸을
                        {log.prevOwner
                          ? " 뺏었습니다."
                          : " 점령했습니다."}
                      </span>
                    </div>
                  );
                })}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}