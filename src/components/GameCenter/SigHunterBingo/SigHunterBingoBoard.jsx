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
        const storedMode = stored.mode || "muse";
        setMode(storedMode);

        let nextCells;
        if (Array.isArray(stored.cells) && stored.cells.length === CELL_COUNT) {
          // 예전 저장분에 images / counts / imageIndex 없을 수 있으니 보정
          const fresh = getInitialHunterCells(storedMode, CELL_COUNT);
          nextCells = stored.cells.map((c, idx) => ({
            ...fresh[idx], // 기본 구조(이미지/카운트) 우선
            ...c, // 저장된 owner, imageIndex, sigCount 덮어씀
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

        setCells(nextCells);
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

  // 초기화 버튼: 보드 전체를 새로운 랜덤 이미지 세트로 재생성
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

  // 현재 셀에서 보여줄 이미지
  const getCurrentImage = (cell) => {
    if (!cell.images || cell.images.length === 0) return null;
    const idx =
      typeof cell.imageIndex === "number"
        ? cell.imageIndex % cell.images.length
        : 0;
    return cell.images[idx];
  };

  // 현재 셀에서 보여줄 숫자 (안전하게 계산용 헬퍼)
  const getCurrentCount = (cell) => {
    if (!cell.counts || cell.counts.length === 0) return cell.sigCount ?? 0;
    const idx =
      typeof cell.imageIndex === "number"
        ? cell.imageIndex % cell.counts.length
        : 0;
    const value = cell.counts[idx];
    return value != null ? value : cell.sigCount ?? 0;
  };

  // 셀 클릭: 처음 점령 시 숫자 확정, 이후에는 닉네임만 변경
  const handleClickCell = (cellId) => {
      console.log("handleClickCell CALLED", cellId, Date.now());  // 🔥 이 줄 추가

    if (!currentPlayer.trim()) {
      alert("닉네임을 먼저 입력해 주세요.");
      return;
    }

    const actor = currentPlayer.trim();

    setCells((prevCells) => {
      const nextCells = prevCells.map((c) => ({ ...c }));
      const cell = nextCells[cellId];
      const prevOwner = cell.owner;

      // 1) 아직 아무도 안 가진 칸이면, 현재 imageIndex 기준으로 숫자 한 번만 설정
      if (!prevOwner) {
        // 현재 인덱스 (앞면 이미지 인덱스)
        let currentIndex =
          typeof cell.imageIndex === "number" ? cell.imageIndex : 0;

        if (cell.images && cell.images.length > 0) {
          currentIndex =
            ((currentIndex % cell.images.length) + cell.images.length) %
            cell.images.length;
        } else {
          currentIndex = 0;
        }

        // 해당 인덱스 기준으로 숫자 계산
        let currentCount = cell.sigCount ?? 0;
        if (cell.counts && cell.counts.length > 0) {
          const idx =
            cell.counts.length > 0 ? currentIndex % cell.counts.length : 0;
          const fromCounts = cell.counts[idx];
          if (fromCounts != null) currentCount = fromCounts;
        }

        // 이 칸의 숫자를 고정
        cell.sigCount = currentCount;
        // imageIndex 는 그대로 유지 → 앞면 이미지는 처음 상태로 고정
      }

      // 2) 닉네임(소유자)만 갱신
      cell.owner = actor;

      // 3) 로그 기록 (숫자는 항상 cell.sigCount 사용)
      const newLog = {
        time: Date.now(),
        actor,
        cellId,
        action: prevOwner ? "steal" : "capture",
        prevOwner,
        sigName: cell.sigName,
        sigCount: cell.sigCount,
      };

      // 4) 줄 소유권 재계산
      recalcLineOwners(nextCells);

      // 5) logs 상태와 저장을 한 번에 처리 (중복 방지)
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

  sync({
    mode,
    cells: nextCells,
    logs: updatedLogs,
    lineOwners,
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

      {/* 메인 영역: 왼쪽(빙고판) / 오른쪽(닉네임 + 로그) */}
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
              const currentCount = getCurrentCount(cell); // imageIndex 기준 숫자

              return (
                <div
                  key={cell.id}
                  className={
                    "hunter-cell" + (isOwned ? " hunter-cell--owned" : "")
                  }
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

                    {/* 뒷면: 상단 닉네임 / 하단 시그 갯수 (위아래 반반) */}
                    <div className="hunter-cell-back">
                      {/* 위 1/2: 플레이어 닉네임 */}
                      <div className="hunter-cell-owner-area">
                        <div className="hunter-cell-owner-text">
                          {cell.owner || "미점령"}
                        </div>
                      </div>

                      {/* 아래 1/2: 시그 갯수 */}
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

        {/* 오른쪽: 닉네임 입력 + 줄 카운트 + 로그 */}
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
        </aside>
      </div>
    </div>
  );
}