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

// 로그 타입 설명용
// action: "capture" (빈칸 점령) | "steal" (다른 사람에게서 뺏음)
export default function SigHunterBingoBoard({ boardId = "hunter1" }) {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("muse"); // 뮤즈 / 퀸덤
  const [cells, setCells] = useState([]); // {id, sigName, sigCount, owner}
  const [currentPlayer, setCurrentPlayer] = useState(""); // 현재 행동하는 사람 닉네임
  const [logs, setLogs] = useState([]); // 액션 로그
  const [lineOwners, setLineOwners] = useState(
    () => LINES_5X5.map(() => ({ owner: null }))
  );

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

  // 초기 로딩
  useEffect(() => {
    async function init() {
      const stored = await loadSigHunterBingoState(boardId);

      if (stored) {
        setMode(stored.mode || "muse");
        setCells(
          Array.isArray(stored.cells) && stored.cells.length === CELL_COUNT
            ? stored.cells
            : getInitialHunterCells(stored.mode || "muse", CELL_COUNT)
        );
        setLogs(stored.logs || []);
        setLineOwners(
          Array.isArray(stored.lineOwners) &&
            stored.lineOwners.length === LINES_5X5.length
            ? stored.lineOwners
            : LINES_5X5.map(() => ({ owner: null }))
        );
      } else {
        const initCells = getInitialHunterCells("muse", CELL_COUNT);
        setMode("muse");
        setCells(initCells);
        setLogs([]);
        const initLineOwners = LINES_5X5.map(() => ({ owner: null }));
        setLineOwners(initLineOwners);

        await saveSigHunterBingoState(boardId, {
          mode: "muse",
          cells: initCells,
          logs: [],
          lineOwners: initLineOwners,
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

  const handleChangeMode = (nextMode) => {
    if (mode === nextMode) return;

    const initCells = getInitialHunterCells(nextMode, CELL_COUNT);
    const initLineOwners = LINES_5X5.map(() => ({ owner: null }));

    setMode(nextMode);
    setCells(initCells);
    setLogs([]);
    setLineOwners(initLineOwners);

    sync({
      mode: nextMode,
      cells: initCells,
      logs: [],
      lineOwners: initLineOwners,
    });
  };

  const handleResetBoard = () => {
    const initCells = getInitialHunterCells(mode, CELL_COUNT);
    const initLineOwners = LINES_5X5.map(() => ({ owner: null }));

    setCells(initCells);
    setLogs([]);
    setLineOwners(initLineOwners);

    sync({
      mode,
      cells: initCells,
      logs: [],
      lineOwners: initLineOwners,
    });
  };

  const handleClickCell = (cellId) => {
    if (!currentPlayer.trim()) {
      alert("닉네임을 먼저 입력해 주세요.");
      return;
    }

    setCells((prevCells) => {
      const nextCells = prevCells.map((c) => ({ ...c }));
      const cell = nextCells[cellId];
      const prevOwner = cell.owner;

      if (prevOwner === currentPlayer.trim()) {
        // 같은 사람이 다시 누르면 아무 변화 없도록 (원하면 해제 로직 추가 가능)
        return prevCells;
      }

      cell.owner = currentPlayer.trim();

      // 로그 추가
      setLogs((prevLogs) => [
        ...prevLogs,
        {
          time: Date.now(),
          actor: currentPlayer.trim(),
          cellId,
          action: prevOwner ? "steal" : "capture",
          prevOwner,
          sigName: cell.sigName,
          sigCount: cell.sigCount,
        },
      ]);

      // 줄 소유권 재계산
      recalcLineOwners(nextCells);

      sync({
        mode,
        cells: nextCells,
        logs: [
          ...logs,
          {
            time: Date.now(),
            actor: currentPlayer.trim(),
            cellId,
            action: prevOwner ? "steal" : "capture",
            prevOwner,
            sigName: cell.sigName,
            sigCount: cell.sigCount,
          },
        ],
        lineOwners, // setState 비동기라 엄밀히 맞추려면 useEffect로 따로 관리해도 됨
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
      {/* 헤더: 모드 탭 + 초기화 */}
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

        {/* 현재 플레이어 닉네임 입력 */}
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
      </header>

      {/* 빙고판 */}
      <div className="hunter-grid">
        {cells.slice(0, CELL_COUNT).map((cell) => {
          const isOwned = !!cell.owner;
          return (
            <div
              key={cell.id}
              className={
                "hunter-cell" + (isOwned ? " hunter-cell--owned" : "")
              }
              onClick={() => handleClickCell(cell.id)}
            >
              <div className="hunter-cell-inner">
                {/* 앞면: 시그 이름 + 갯수 */}
                <div className="hunter-cell-front">
                  <div className="hunter-sig-name">{cell.sigName}</div>
                  <div className="hunter-sig-count-front">
                    x{cell.sigCount}
                  </div>
                </div>

                {/* 뒷면: 닉네임 + 갯수 */}
                <div className="hunter-cell-back">
                  <div className="hunter-cell-owner">
                    {cell.owner || "미점령"}
                  </div>
                  <div className="hunter-sig-count-back">
                    x{cell.sigCount}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 빙고판 아래 줄 카운트 */}
      <div className="hunter-line-count-under-board">
        현재 점령된 줄: <span>{completedLineCount}</span> 줄
      </div>

      {/* 간단 로그 영역 */}
      <section className="hunter-log-section">
        <h3 className="hunter-log-title">로그</h3>
        <div className="hunter-log-list">
          {logs.length === 0 && (
            <div className="hunter-log-empty">아직 로그가 없습니다.</div>
          )}
          {logs
            .slice()
            .reverse()
            .map((log) => (
              <div
                key={`${log.time}-${log.cellId}`}
                className="hunter-log-item"
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
            ))}
        </div>
      </section>
    </div>
  );
}