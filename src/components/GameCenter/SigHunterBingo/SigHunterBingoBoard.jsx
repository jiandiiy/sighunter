// src/components/SigHunterBingo/SigHunterBingoBoard.jsx

import React, { useEffect, useMemo, useState, useRef } from "react";
import "./SigHunterBingoBoard.css";

import {
  getInitialHunterCells,
  HUNTER_MODES,
  createRandomHunterCell,
} from "../../../utils/sigHunterBingoData";
import {
  loadSigHunterBingoState,
  saveSigHunterBingoState,
} from "../../../api/sigHunterBingoStorage";

const AVAILABLE_SIZES = [3, 5];

// 라인(가로/세로/대각) 동적 생성: 3x3, 5x5 공용
const makeLines = (size) => {
  const lines = [];
  // rows
  for (let r = 0; r < size; r++) {
    lines.push(Array.from({ length: size }, (_, c) => r * size + c));
  }
  // cols
  for (let c = 0; c < size; c++) {
    lines.push(Array.from({ length: size }, (_, r) => r * size + c));
  }
  // diagonals
  lines.push(Array.from({ length: size }, (_, i) => i * size + i));
  lines.push(
    Array.from({ length: size }, (_, i) => i * size + (size - 1 - i))
  );
  return lines;
};

// 🔹 플레이어 18명용 예쁜 색 팔레트
const PLAYER_COLOR_PALETTE = [
  "#FF6B6B",
  "#FF9F43",
  "#FFC857",
  "#8BC34A",
  "#26A69A",
  "#4ECDC4",
  "#3498DB",
  "#5C7CFA",
  "#9B59B6",
  "#E84393",
  "#FF7675",
  "#F8A5C2",
  "#FDCB6E",
  "#55EFC4",
  "#74B9FF",
  "#A29BFE",
  "#D980FA",
  "#00CEC9",
];

export default function SigHunterBingoBoard({ boardId = "hunter1" }) {
  const [loading, setLoading] = useState(true);

  // ✅ mode + size 지원
  const [mode, setMode] = useState("muse"); // "muse" | "queendom"
  const [size, setSize] = useState(5); // 3 | 5

  const cellCount = size * size;
  const lines = useMemo(() => makeLines(size), [size]);
  const stateKey = `${mode}-${size}`; // modeStates key
  const storageKey = `${boardId}-${mode}-${size}`; // ✅ 저장도 완전 분리

  const [cells, setCells] = useState([]); // {id, sigName, sigCount, owner, images, counts, imageIndex}
  const [currentPlayer, setCurrentPlayer] = useState("");
  const [logs, setLogs] = useState([]);
  const [lineOwners, setLineOwners] = useState(() =>
    makeLines(5).map(() => ({ owner: null }))
  );

  // 🔹 닉네임별 색상 매핑
  const [playerColors, setPlayerColors] = useState({});

  // 🔹 mode+size별 상태 저장 (탭 이동시 즉시 복원용)
  const [modeStates, setModeStates] = useState({});

  // 🔹 파일 입력 ref (칸별 이미지 변경용)
  const fileInputRefs = useRef({});

  // 🔹 1) useState로 한 번만 랜덤 순서의 팔레트 생성
  const [shuffledPalette] = useState(() => {
    const arr = [...PLAYER_COLOR_PALETTE];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  // 줄 소유권 재계산 (size/lines 기반)
  const recalcLineOwners = (nextCells, nextSize, nextLines) => {
    const nextLineOwners = nextLines.map((line) => {
      const ownersOnLine = line.map((idx) => nextCells[idx]?.owner);
      const nonNullOwners = ownersOnLine.filter(Boolean);

      if (
        nonNullOwners.length === nextSize &&
        nonNullOwners.every((o) => o === nonNullOwners[0])
      ) {
        return { owner: nonNullOwners[0] };
      }
      return { owner: null };
    });

    setLineOwners(nextLineOwners);
    return nextLineOwners;
  };

  // 🔹 닉네임 → 색상 헬퍼
  const getColorForPlayer = (name) => {
    if (!name) return null;

    // 이미 색이 있으면 그 색 그대로
    if (playerColors[name]) return playerColors[name];

    // 1) 아직 팔레트에서 쓰지 않은 색이 있으면 그 색들 중 하나 사용
    const usedColors = new Set(Object.values(playerColors));
    const unused = shuffledPalette.filter((c) => !usedColors.has(c));

    let color;
    if (unused.length > 0) {
      color = unused[0];
    } else {
      // 2) 팔레트가 모두 소진된 경우: 새 랜덤 색 생성
      const randColor = () =>
        "#" +
        Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, "0")
          .toUpperCase();
      color = randColor();
    }

    setPlayerColors((prev) => ({ ...prev, [name]: color }));
    return color;
  };

  const sync = (key, nextState) => {
    saveSigHunterBingoState(key, nextState).catch((e) =>
      console.error("saveSigHunterBingoState failed", e)
    );
  };

  // ✅ mode/size 변경 시 해당 저장키에서 로드 (없으면 새로 생성)
  useEffect(() => {
    let alive = true;

    async function init() {
      setLoading(true);

      const stored = await loadSigHunterBingoState(storageKey);

      const initCells = getInitialHunterCells(mode, size);
      const initLineOwners = lines.map(() => ({ owner: null }));

      if (!alive) return;

      if (stored) {
        let nextCells;
        if (Array.isArray(stored.cells) && stored.cells.length === cellCount) {
          // 데이터셋(특히 가운데 카드 등)이 바뀌었을 수 있으니 fresh 위에 stored를 덮음
          nextCells = stored.cells.map((c, idx) => ({
            ...initCells[idx],
            ...c,
            images:
              c.images && Array.isArray(c.images)
                ? c.images
                : initCells[idx].images,
            counts:
              c.counts && Array.isArray(c.counts)
                ? c.counts
                : initCells[idx].counts,
            imageIndex:
              typeof c.imageIndex === "number" ? c.imageIndex : 0,
          }));
        } else {
          nextCells = initCells;
        }

        const restoredLineOwners =
          Array.isArray(stored.lineOwners) &&
          stored.lineOwners.length === lines.length
            ? stored.lineOwners
            : initLineOwners;

        const restoredPlayerColors = stored.playerColors || {};

        setCells(nextCells);
        setLogs(stored.logs || []);
        setLineOwners(restoredLineOwners);
        setPlayerColors(restoredPlayerColors);

        setModeStates((prev) => ({
          ...prev,
          [stateKey]: {
            cells: nextCells,
            logs: stored.logs || [],
            lineOwners: restoredLineOwners,
            playerColors: restoredPlayerColors,
          },
        }));
      } else {
        setCells(initCells);
        setLogs([]);
        setLineOwners(initLineOwners);
        setPlayerColors({});

        setModeStates((prev) => ({
          ...prev,
          [stateKey]: {
            cells: initCells,
            logs: [],
            lineOwners: initLineOwners,
            playerColors: {},
          },
        }));

        await saveSigHunterBingoState(storageKey, {
          mode,
          size,
          cells: initCells,
          logs: [],
          lineOwners: initLineOwners,
          playerColors: {},
        });
      }

      if (!alive) return;
      setLoading(false);
    }

    init();
    return () => {
      alive = false;
    };
  }, [storageKey, mode, size, cellCount, lines, stateKey]);

  // 모드 변경: modeStates에서 즉시 복원(있으면), 없으면 새로 생성 (저장은 storageKey로 분리됨)
  const handleChangeMode = (nextMode) => {
    if (mode === nextMode) return;

    // 현재 상태 백업
    setModeStates((prev) => ({
      ...prev,
      [`${mode}-${size}`]: { cells, logs, lineOwners, playerColors },
    }));

    const nextKey = `${nextMode}-${size}`;
    const saved = modeStates[nextKey];

    const nextLines = makeLines(size);
    const initLineOwners = nextLines.map(() => ({ owner: null }));

    setMode(nextMode);

    if (saved) {
      setCells(saved.cells);
      setLogs(saved.logs);
      setLineOwners(saved.lineOwners);
      setPlayerColors(saved.playerColors);

      sync(`${boardId}-${nextMode}-${size}`, {
        mode: nextMode,
        size,
        cells: saved.cells,
        logs: saved.logs,
        lineOwners: saved.lineOwners,
        playerColors: saved.playerColors,
      });
    } else {
      const initCells = getInitialHunterCells(nextMode, size);

      setCells(initCells);
      setLogs([]);
      setLineOwners(initLineOwners);
      setPlayerColors({});

      setModeStates((prev) => ({
        ...prev,
        [nextKey]: {
          cells: initCells,
          logs: [],
          lineOwners: initLineOwners,
          playerColors: {},
        },
      }));

      sync(`${boardId}-${nextMode}-${size}`, {
        mode: nextMode,
        size,
        cells: initCells,
        logs: [],
        lineOwners: initLineOwners,
        playerColors: {},
      });
    }
  };

  // ✅ 사이즈 변경: modeStates에서 즉시 복원(있으면), 없으면 새로 생성
  const handleChangeSize = (nextSize) => {
    if (size === nextSize) return;

    // 현재 상태 백업
    setModeStates((prev) => ({
      ...prev,
      [`${mode}-${size}`]: { cells, logs, lineOwners, playerColors },
    }));

    const nextKey = `${mode}-${nextSize}`;
    const saved = modeStates[nextKey];

    const nextLines = makeLines(nextSize);
    const initLineOwners = nextLines.map(() => ({ owner: null }));

    setSize(nextSize);

    if (saved) {
      setCells(saved.cells);
      setLogs(saved.logs);
      setLineOwners(saved.lineOwners);
      setPlayerColors(saved.playerColors);

      sync(`${boardId}-${mode}-${nextSize}`, {
        mode,
        size: nextSize,
        cells: saved.cells,
        logs: saved.logs,
        lineOwners: saved.lineOwners,
        playerColors: saved.playerColors,
      });
    } else {
      const initCells = getInitialHunterCells(mode, nextSize);

      setCells(initCells);
      setLogs([]);
      setLineOwners(initLineOwners);
      setPlayerColors({});

      setModeStates((prev) => ({
        ...prev,
        [nextKey]: {
          cells: initCells,
          logs: [],
          lineOwners: initLineOwners,
          playerColors: {},
        },
      }));

      sync(`${boardId}-${mode}-${nextSize}`, {
        mode,
        size: nextSize,
        cells: initCells,
        logs: [],
        lineOwners: initLineOwners,
        playerColors: {},
      });
    }
  };

  // 초기화 버튼: **현재 mode+size만** 재생성
  const handleResetBoard = () => {
    const initCells = getInitialHunterCells(mode, size);
    const initLineOwners = lines.map(() => ({ owner: null }));

    setCells(initCells);
    setLogs([]);
    setLineOwners(initLineOwners);
    setPlayerColors({});

    setModeStates((prev) => ({
      ...prev,
      [stateKey]: {
        cells: initCells,
        logs: [],
        lineOwners: initLineOwners,
        playerColors: {},
      },
    }));

    sync(storageKey, {
      mode,
      size,
      cells: initCells,
      logs: [],
      lineOwners: initLineOwners,
      playerColors: {},
    });
  };

  const getCurrentImage = (cell) => {
    if (!cell?.images || cell.images.length === 0) return null;
    const idx =
      typeof cell.imageIndex === "number"
        ? cell.imageIndex % cell.images.length
        : 0;
    return cell.images[idx];
  };

  const getCurrentCount = (cell) => {
    // counts 배열에 값이 있으면 그걸 우선
    if (cell?.counts && cell.counts.length > 0) {
      const idx =
        typeof cell.imageIndex === "number"
          ? cell.imageIndex % cell.counts.length
          : 0;
      const value = cell.counts[idx];
      if (value != null) return value;
    }
    // 없으면 sigCount
    return cell.sigCount ?? 0;
  };

  // ✅ 이미지 변경: 파일 선택 → 해당 칸 이미지 "추가" + 개수 입력
  const handleChangeCellImage = (e, cellId) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      if (!dataUrl) return;

      // 새 이미지 시그 개수 입력 받기
      const input = window.prompt(
        "이 이미지의 시그 개수를 입력하세요 (숫자만)",
        ""
      );
      const parsed = input != null ? parseInt(input, 10) : null;
      const sigCount = Number.isFinite(parsed) ? parsed : null;

      setCells((prev) => {
        const next = prev.map((c) => ({ ...c }));
        const cell = next[cellId];
        if (!cell) return prev;

        // 배열 초기화
        if (!Array.isArray(cell.images)) cell.images = [];
        if (!Array.isArray(cell.counts)) cell.counts = [];

        // ✅ 새 이미지를 기존 배열에 추가
        cell.images = [...cell.images, dataUrl];

        if (sigCount != null) {
          cell.counts = [...cell.counts, sigCount];
          cell.sigCount = sigCount;
        } else {
          cell.counts = [...cell.counts, cell.sigCount ?? 0];
        }

        // 방금 추가한 이미지를 바로 보이게
        cell.imageIndex = cell.images.length - 1;

        const nextState = {
          mode,
          size,
          cells: next,
          logs,
          lineOwners,
          playerColors,
        };

        sync(storageKey, nextState);

        setModeStates((prevStates) => ({
          ...prevStates,
          [stateKey]: nextState,
        }));

        return next;
      });

      // 같은 파일 재선택 가능하도록 초기화
      e.target.value = "";
    };

    reader.readAsDataURL(file);
  };

  const handleClickCell = (cellId) => {
    if (!currentPlayer.trim()) {
      alert("닉네임을 먼저 입력해 주세요.");
      return;
    }
    const actor = currentPlayer.trim();

    setCells((prevCells) => {
      const nextCells = prevCells.map((c) => ({ ...c }));
      let cell = nextCells[cellId];
      if (!cell) return prevCells;

      const prevOwner = cell.owner;

      // ✅ 점령/쟁탈 시마다 그 칸의 카드(이미지/숫자)를 새로 뽑아서 교체
      const newCellBase = createRandomHunterCell(mode, size, cellId);

      cell = Object.assign(cell, {
        sigName: newCellBase.sigName,
        sigCount: newCellBase.sigCount,
        images: newCellBase.images,
        counts: newCellBase.counts,
        // 원래 로직 유지 (필요하면 여기서 random index 써도 됨)
        imageIndex: newCellBase.imageIndex,
        owner: actor,
      });

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

      const nextLineOwners = recalcLineOwners(nextCells, size, lines);

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
          [stateKey]: {
            cells: nextCells,
            logs: updatedLogs,
            lineOwners: nextLineOwners,
            playerColors,
          },
        }));

        sync(storageKey, {
          mode,
          size,
          cells: nextCells,
          logs: updatedLogs,
          lineOwners: nextLineOwners,
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

          {/* ✅ 3x3 / 5x5 탭 */}
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

          {/* ✅ grid 컬럼도 size에 맞게 */}
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
                  onClick={() => handleClickCell(cell.id)}
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

                      {/* 🔹 이미지 변경 버튼 + 숨겨진 파일 input */}
                      <button
                        type="button"
                        className="hunter-img-change-btn"
                        onClick={(e) => {
                          e.stopPropagation(); // 점령 클릭 방지
                          const input = fileInputRefs.current[cell.id];
                          if (input) input.click();
                        }}
                        title="이미지 변경"
                      >
                        📷
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        ref={(el) => {
                          fileInputRefs.current[cell.id] = el;
                        }}
                        onChange={(e) => handleChangeCellImage(e, cell.id)}
                      />
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