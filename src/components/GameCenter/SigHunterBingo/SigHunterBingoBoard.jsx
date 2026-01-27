// src/components/GameCenter/SigHunterBingo/SigHunterBingoBoard.jsx

import React, { useState } from "react";
import "./SigHunterBingoBoard.css";
import {
  useSigHunterBingoState,
  AVAILABLE_SIZES,
} from "./useSigHunterBingoState";

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

  if (loading) {
    return <div style={{ color: "#fff" }}>로딩 중...</div>;
  }

  return (
    <div className="hunter-root">
      <header className="hunter-header">
        <div className="hunter-header-row">
          {/* 모드 탭 */}
          <div className="hunter-mode-tabs">
            {HUNTER_MODES.map((m) => (
              <button
                key={m}
                className={
                  "hunter-tab" + (mode === m ? " hunter-tab--active" : "")
                }
                onClick={() => handleChangeMode(m)}
              >
                {m === "muse" ? "뮤즈" : "퀸덤"}
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

        <h2 className="hunter-title-text">🎯 시그헌터 빙고 🎯</h2>
      </header>

      <div className="hunter-main">
        {/* 좌측: 보드 */}
        <div className="hunter-main-left">
          <div className="hunter-line-count-under-board">
            <div>
              현재 점령된 줄: <span>{completedLineCount}</span> 줄
            </div>
            <button
              type="button"
              className="hunter-reset-btn"
              onClick={handleResetBoard}
            >
              초기화
            </button>
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

        {/* 우측: 닉네임, 줄 미니맵, 로그 */}
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
                  placeholder="닉네임 입력"
                />
              </label>
              <div className="hunter-line-count">
                현재 <span>{completedLineCount}</span> 줄 점령 중
              </div>
            </div>
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
                        {log.sigName} (x{log.sigCount}) 칸을
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