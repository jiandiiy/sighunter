// src/components/SigHunterBingo/SigHunterBingoBoard.jsx

import React, { useEffect, useState } from "react";
import "./SigHunterBingoBoard.css";

import {
  getInitialHunterCells,
  HUNTER_MODES,
} from "../../../utils/sigHunterBingoData";
import {
  loadSigHunterBingoState,
  saveSigHunterBingoState,
} from "../../../api/sigHunterBingoStorage";

const SIZE = 5;
const CELL_COUNT = SIZE * SIZE;

// 5×5 빙고 라인 정의
const LINES_5X5 = [
  // 가로
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  // 세로
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  // 대각
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

// 🔹 플레이어 18명용 예쁜 색 팔레트
const PLAYER_COLOR_PALETTE = [
  "#FF6B6B", // 1 코랄 레드
  "#FF9F43", // 2 오렌지
  "#FFC857", // 3 옐로우
  "#8BC34A", // 4 라임 그린
  "#26A69A", // 5 티얼
  "#4ECDC4", // 6 민트
  "#3498DB", // 7 블루
  "#5C7CFA", // 8 인디고
  "#9B59B6", // 9 퍼플
  "#E84393", // 10 핫핑크
  "#FF7675", // 11 살몬
  "#F8A5C2", // 12 연핑크
  "#FDCB6E", // 13 골드 옐로
  "#55EFC4", // 14 민트그린
  "#74B9FF", // 15 라이트 블루
  "#A29BFE", // 16 라일락
  "#D980FA", // 17 라이트 퍼플
  "#00CEC9", // 18 청록
];

// action: "capture" (빈칸 점령) | "steal" (다른 사람에게서 뺏음)
export default function SigHunterBingoBoard({ boardId = "hunter1" }) {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("muse"); // 뮤즈 / 퀸덤
  const [cells, setCells] = useState([]); // {id, sigName, sigCount, owner, images, counts, imageIndex}
  const [currentPlayer, setCurrentPlayer] = useState(""); // 현재 행동하는 사람 닉네임
  const [logs, setLogs] = useState([]); // 액션 로그
  const [lineOwners, setLineOwners] = useState(
    () => LINES_5X5.map(() => ({ owner: null }))
  );

  // 🔹 닉네임별 색상 매핑
  const [playerColors, setPlayerColors] = useState({});

  // 🔹 모드별 상태 저장 (muse, queendom 각각의 보드/로그/색)
  const [modeStates, setModeStates] = useState({});

  // 🔹 1) useState로 한 번만 랜덤 순서의 팔레트 생성
  const [shuffledPalette] = useState(() => {
    const arr = [...PLAYER_COLOR_PALETTE];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  // 줄 소유권 재계산
  const recalcLineOwners = (nextCells) => {
    const nextLineOwners = LINES_5X5.map((line) => {
      const ownersOnLine = line.map((idx) => nextCells[idx].owner);
      const nonNullOwners = ownersOnLine.filter((o) => !!o);

      // 5칸 모두 같은 소유자면 그 사람, 아니면 null
      if (
        nonNullOwners.length === SIZE &&
        nonNullOwners.every((o) => o === nonNullOwners[0])
      ) {
        return { owner: nonNullOwners[0] };
      }
      return { owner: null };
    });

    setLineOwners(nextLineOwners);
  };

  // 🔹 닉네임 → 색상 헬퍼
  const getColorForPlayer = (name) => {
    if (!name) return null;
    if (playerColors[name]) return playerColors[name];

    const usedCount = Object.keys(playerColors).length;
    const index = usedCount % shuffledPalette.length; // 0~17
    const color = shuffledPalette[index];

    setPlayerColors((prev) => ({ ...prev, [name]: color }));
    return color;
  };

  // 초기 로딩
  useEffect(() => {
    async function init() {
      const stored = await loadSigHunterBingoState(boardId);

      if (stored) {
        const storedMode = stored.mode || "muse";
        setMode(storedMode);

        let nextCells;
        if (Array.isArray(stored.cells) && stored.cells.length === CELL_COUNT) {
          const fresh = getInitialHunterCells(storedMode, CELL_COUNT);
          nextCells = stored.cells.map((c, idx) => ({
            ...fresh[idx],
            ...c,
            images:
              c.images && Array.isArray(c.images)
                ? c.images
                : fresh[idx].images,
            counts:
              c.counts && Array.isArray(c.counts)
                ? c.counts
                : fresh[idx].counts,
            imageIndex: typeof c.imageIndex === "number" ? c.imageIndex : 0,
          }));
        } else {
          nextCells = getInitialHunterCells(storedMode, CELL_COUNT);
        }

        const restoredLineOwners =
          Array.isArray(stored.lineOwners) &&
          stored.lineOwners.length === LINES_5X5.length
            ? stored.lineOwners
            : LINES_5X5.map(() => ({ owner: null }));

        const restoredPlayerColors = stored.playerColors || {};

        setCells(nextCells);
        setLogs(stored.logs || []);
        setLineOwners(restoredLineOwners);
        setPlayerColors(restoredPlayerColors);

        setModeStates({
          [storedMode]: {
            cells: nextCells,
            logs: stored.logs || [],
            lineOwners: restoredLineOwners,
            playerColors: restoredPlayerColors,
          },
        });
      } else {
        const initCells = getInitialHunterCells("muse", CELL_COUNT);
        const initLineOwners = LINES_5X5.map(() => ({ owner: null }));

        setMode("muse");
        setCells(initCells);
        setLogs([]);
        setLineOwners(initLineOwners);
        setPlayerColors({});
        setModeStates({
          muse: {
            cells: initCells,
            logs: [],
            lineOwners: initLineOwners,
            playerColors: {},
          },
        });

        await saveSigHunterBingoState(boardId, {
          mode: "muse",
          cells: initCells,
          logs: [],
          lineOwners: initLineOwners,
          playerColors: {},
        });
      }

      setLoading(false);
    }

    init();
  }, [boardId]);

  const sync = (nextState) => {
    saveSigHunterBingoState(boardId, nextState).catch((e) =>
      console.error("saveSigHunterBingoState failed", e)
    );
  };

  // 🔹 모드 변경: 각 모드별 보드/로그/색을 따로 기억하고 복원
  const handleChangeMode = (nextMode) => {
    if (mode === nextMode) return;

    setModeStates((prev) => ({
      ...prev,
      [mode]: { cells, logs, lineOwners, playerColors },
    }));

    const saved = modeStates[nextMode];

    if (saved) {
      setMode(nextMode);
      setCells(saved.cells);
      setLogs(saved.logs);
      setLineOwners(saved.lineOwners);
      setPlayerColors(saved.playerColors);

      sync({
        mode: nextMode,
        cells: saved.cells,
        logs: saved.logs,
        lineOwners: saved.lineOwners,
        playerColors: saved.playerColors,
      });
    } else {
      const initCells = getInitialHunterCells(nextMode, CELL_COUNT);
      const initLineOwners = LINES_5X5.map(() => ({ owner: null }));

      setMode(nextMode);
      setCells(initCells);
      setLogs([]);
      setLineOwners(initLineOwners);
      setPlayerColors({});

      setModeStates((prev) => ({
        ...prev,
        [nextMode]: {
          cells: initCells,
          logs: [],
          lineOwners: initLineOwners,
          playerColors: {},
        },
      }));

      sync({
        mode: nextMode,
        cells: initCells,
        logs: [],
        lineOwners: initLineOwners,
        playerColors: {},
      });
    }
  };

  // 초기화 버튼: **현재 모드만** 새로운 랜덤 이미지 세트로 재생성
  const handleResetBoard = () => {
    const initCells = getInitialHunterCells(mode, CELL_COUNT);
    const initLineOwners = LINES_5X5.map(() => ({ owner: null }));

    setCells(initCells);
    setLogs([]);
    setLineOwners(initLineOwners);
    setPlayerColors({});

    setModeStates((prev) => ({
      ...prev,
      [mode]: {
        cells: initCells,
        logs: [],
        lineOwners: initLineOwners,
        playerColors: {},
      },
    }));

    sync({
      mode,
      cells: initCells,
      logs: [],
      lineOwners: initLineOwners,
      playerColors: {},
    });
  };

  // 현재 셀에서 보여줄 이미지
  const getCurrentImage = (cell) => {
    if (!cell.images || cell.images.length === 0) return null;
    const idx =
      typeof cell.imageIndex === "number"
        ? cell.imageIndex % cell.images.length
        : 0;
    return cell.images[idx];
  };

  // 현재 셀에서 보여줄 숫자
  const getCurrentCount = (cell) => {
    if (!cell.counts || cell.counts.length === 0) return cell.sigCount ?? 0;
    const idx =
      typeof cell.imageIndex === "number"
        ? cell.imageIndex % cell.counts.length
        : 0;
    const value = cell.counts[idx];
    return value != null ? value : cell.sigCount ?? 0;
  };

  // 셀 클릭
  const handleClickCell = (cellId) => {
    if (!currentPlayer.trim()) {
      alert("닉네임을 먼저 입력해 주세요.");
      return;
    }

    const actor = currentPlayer.trim();

    setCells((prevCells) => {
      const nextCells = prevCells.map((c) => ({ ...c }));
      const cell = nextCells[cellId];
      const prevOwner = cell.owner;

      if (!prevOwner) {
        let currentIndex =
          typeof cell.imageIndex === "number" ? cell.imageIndex : 0;

        if (cell.images && cell.images.length > 0) {
          currentIndex =
            ((currentIndex % cell.images.length) + cell.images.length) %
            cell.images.length;
        } else {
          currentIndex = 0;
        }

        let currentCount = cell.sigCount ?? 0;
        if (cell.counts && cell.counts.length > 0) {
          const idx =
            cell.counts.length > 0 ? currentIndex % cell.counts.length : 0;
          const fromCounts = cell.counts[idx];
          if (fromCounts != null) currentCount = fromCounts;
        }

        cell.sigCount = currentCount;
      }

      cell.owner = actor;
      getColorForPlayer(actor);

      const newLog = {
        time: Date.now(),
        actor,
        cellId,
        action: prevOwner ? "steal" : "capture",
        prevOwner,
        sigName: cell.sigName,
        sigCount: cell.sigCount,
      };

      recalcLineOwners(nextCells);

      setLogs((prevLogs) => {
        const exists = prevLogs.some(
          (l) =>
            l.time === newLog.time &&
            l.cellId === newLog.cellId &&
            l.actor === newLog.actor &&
            l.action === newLog.action
        );
        if (exists) return prevLogs;

        const updatedLogs = [...prevLogs, newLog];

        setModeStates((prev) => ({
          ...prev,
          [mode]: {
            cells: nextCells,
            logs: updatedLogs,
            lineOwners,
            playerColors,
          },
        }));

        sync({
          mode,
          cells: nextCells,
          logs: updatedLogs,
          lineOwners,
          playerColors,
        });

        return updatedLogs;
      });

      return nextCells;
    });
  };

  const completedLineCount = lineOwners.filter((l) => !!l.owner).length;

  if (loading) {
    return <div style={{ color: "#fff" }}>로딩 중...</div>;
  }

  return (
    <div className="hunter-root">
      {/* 헤더: 모드 탭 + 초기화 + 제목 */}
      <header className="hunter-header">
        <div className="hunter-header-row">
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

          <button
            type="button"
            className="hunter-reset-btn"
            onClick={handleResetBoard}
          >
            초기화
          </button>
        </div>

        <h2 className="hunter-title-text">🎯 시그헌터 빙고 🎯</h2>
      </header>

      {/* 메인 영역: 왼쪽(빙고판) / 오른쪽(닉네임 + 미니맵 + 로그) */}
      <div className="hunter-main">
        {/* 왼쪽: 빙고판 */}
        <div className="hunter-main-left">
          {/* 빙고판 위 줄 카운트 */}
          <div className="hunter-line-count-under-board">
            현재 점령된 줄: <span>{completedLineCount}</span> 줄
          </div>

          <div className="hunter-grid">
            {cells.slice(0, CELL_COUNT).map((cell) => {
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
                  onClick={() => handleClickCell(cell.id)}
                >
                  <div className="hunter-cell-inner">
                    {/* 앞면: 이미지만 */}
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

                    {/* 뒷면: 상단 닉네임 / 하단 시그 갯수 */}
                    <div className="hunter-cell-back">
                      <div
                        className="hunter-cell-owner-area"
                        style={
                          ownerColor
                            ? { backgroundColor: ownerColor }
                            : {}
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

        {/* 오른쪽: 닉네임 입력 + 줄 카운트 + 미니맵 + 로그 */}
        <aside className="hunter-main-right">
          {/* 현재 플레이어 닉네임 입력 + 줄 카운트 */}
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

          {/* 🔹 줄 소유권 미니맵 (오른쪽으로 이동) */}
          <div className="hunter-lines-ownership">
            <h4 className="hunter-lines-ownership-title">줄 소유권 미니맵</h4>
            <div className="hunter-lines-ownership-list">
              {lineOwners.map((line, idx) => {
                const ownerName = line.owner;
                const color = ownerName
                  ? getColorForPlayer(ownerName)
                  : null;

                const lineLabel =
                  idx < 5
                    ? `가로 ${idx + 1}`
                    : idx < 10
                    ? `세로 ${idx - 4}`
                    : idx === 10
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
                      {Array.from({ length: 5 }).map((_, i) => (
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

          {/* 로그 영역 */}
          <section className="hunter-log-section">
            <h3 className="hunter-log-title">로그</h3>
            <div className="hunter-log-list">
              {logs.length === 0 && (
                <div className="hunter-log-empty">아직 로그가 없습니다.</div>
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
                        {log.prevOwner ? " 뺏었습니다." : " 점령했습니다."}
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