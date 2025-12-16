import React, { useEffect, useMemo, useState } from "react";
import "./BingoBoard.css";

import {
  getRandomBingoImages,
  getRandomBingoImage,
} from "../../../utils/sigBingoImagePool";
import {
  loadSigBingoState,
  saveSigBingoState,
} from "../../../api/sigBingoStorage";

const MODES = ["muse", "queendom"];

const ROWS = 3;
const COLS = 3;
const CELL_COUNT = ROWS * COLS;

const LINES_3X3 = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const DEFAULT_RULES = {
  // 빙고1: 점령(클릭한 사람 닉네임으로 owner 저장)
  conquest: { enabled: false },

  // 빙고2: 가운데 스페셜
  specialCell: {
    enabled: false,
    index: 4,
    src: "/images/special.png",
    lock: false,      // true면 클릭 막힘
    autoChecked: false, // true면 시작부터 체크(프리칸)
  },
};

export default function BingoBoard({
  boardId = "default",
  boardRules = {},
}) {
  const rules = useMemo(
    () => ({
      conquest: { ...DEFAULT_RULES.conquest, ...(boardRules.conquest || {}) },
      specialCell: { ...DEFAULT_RULES.specialCell, ...(boardRules.specialCell || {}) },
    }),
    [boardRules]
  );

  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("muse");
  const [images, setImages] = useState([]);
  const [checked, setChecked] = useState(Array(CELL_COUNT).fill(false));
  const [completedLines, setCompletedLines] = useState([]);
  const [owners, setOwners] = useState(Array(CELL_COUNT).fill(null)); // ✅ 점령자 이름

  // ✅ 빙고1에서 사용할 닉네임(원하면 부모에서 내려줘도 됨)
  const [currentPlayer, setCurrentPlayer] = useState("");

  const calcCompletedLines = (checkedArr) => {
    const done = [];
    LINES_3X3.forEach((line, idx) => {
      if (line.every((i) => checkedArr[i])) done.push(idx);
    });
    return done;
  };

  const applySpecialCellToImages = (baseImages) => {
    if (!rules.specialCell.enabled) return baseImages;
    const next = [...baseImages];
    next[rules.specialCell.index] = rules.specialCell.src;
    return next;
  };

  useEffect(() => {
    async function init() {
      const remote = await loadSigBingoState(boardId);

      const nextMode = remote?.mode || "muse";

      let randomImages = getRandomBingoImages(nextMode, CELL_COUNT);
      randomImages = applySpecialCellToImages(randomImages);

      let initChecked =
        Array.isArray(remote?.checked) && remote.checked.length === CELL_COUNT
          ? remote.checked
          : Array(CELL_COUNT).fill(false);

      if (rules.specialCell.enabled && rules.specialCell.autoChecked) {
        initChecked = [...initChecked];
        initChecked[rules.specialCell.index] = true;
      }

      const initOwners =
        Array.isArray(remote?.owners) && remote.owners.length === CELL_COUNT
          ? remote.owners
          : Array(CELL_COUNT).fill(null);

      const newLines = Array.isArray(remote?.completedLines)
        ? remote.completedLines
        : calcCompletedLines(initChecked);

      setMode(nextMode);
      setImages(randomImages);
      setChecked(initChecked);
      setCompletedLines(newLines);
      setOwners(initOwners);

      // 저장(이미지는 항상 최신 풀로 덮어쓰기)
      await saveSigBingoState(boardId, {
        mode: nextMode,
        images: randomImages,
        checked: initChecked,
        completedLines: newLines,
        owners: initOwners,
      });

      setLoading(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  const sync = (next) => {
    saveSigBingoState(boardId, next).catch((e) =>
      console.error("saveSigBingoState failed", e)
    );
  };

  const isSpecialLockedCell = (idx) =>
    rules.specialCell.enabled && rules.specialCell.lock && idx === rules.specialCell.index;

  const isCellInCompletedLine = (cellIndex) =>
    LINES_3X3.some(
      (line, lineIndex) =>
        completedLines.includes(lineIndex) && line.includes(cellIndex)
    );

  // ✅ 빙고1 점령: 랜덤 칸 점령 + 이름 표시
 const handleConquestRandom = () => {
  const actor = currentPlayer.trim();
  if (!actor) {
    alert("닉네임을 먼저 입력해 주세요.");
    return;
  }

  // ✅ 점령 후보: 전체 칸(스페셜 lock만 제외)
  const candidates = [];
  for (let i = 0; i < CELL_COUNT; i++) {
    if (isSpecialLockedCell(i)) continue;
    candidates.push(i);
  }
  if (candidates.length === 0) return;

  const idx = candidates[Math.floor(Math.random() * candidates.length)];

  setChecked((prevChecked) => {
    const nextChecked = [...prevChecked];
    nextChecked[idx] = true;

    const newLines = calcCompletedLines(nextChecked);
    setCompletedLines(newLines);

    setOwners((prevOwners) => {
      const nextOwners = [...prevOwners];
      nextOwners[idx] = actor; // ✅ 기존 소유자여도 덮어쓰기(뺏기)

      sync({
        mode,
        images,
        checked: nextChecked,
        completedLines: newLines,
        owners: nextOwners,
      });

      return nextOwners;
    });

    return nextChecked;
  });
};

  const handleToggleCell = (idx) => {
    if (isSpecialLockedCell(idx)) return;

    // 점령 모드가 아니면 기존 토글
    if (!rules.conquest.enabled) {
      setChecked((prevChecked) => {
        const nextChecked = [...prevChecked];
        nextChecked[idx] = !nextChecked[idx];

        const newLines = calcCompletedLines(nextChecked);
        setCompletedLines(newLines);

        const isInCompletedLine = LINES_3X3.some(
          (line, lineIndex) => newLines.includes(lineIndex) && line.includes(idx)
        );

        let nextImages = images;
        if (isInCompletedLine) {
          const isSpecial = rules.specialCell.enabled && idx === rules.specialCell.index;
          if (!isSpecial) {
            nextImages = [...images];
            nextImages[idx] = getRandomBingoImage(mode);
            setImages(nextImages);
          }
        }

        sync({
          mode,
          images: nextImages,
          checked: nextChecked,
          completedLines: newLines,
          owners,
        });

        return nextChecked;
      });

      return;
    }

    // ✅ 점령 모드(빙고1): 클릭 시 해당 칸을 내 닉네임으로 점령 + 체크 true
    const actor = currentPlayer.trim();
    if (!actor) {
      alert("닉네임을 먼저 입력해 주세요.");
      return;
    }

    setChecked((prevChecked) => {
      const nextChecked = [...prevChecked];
      nextChecked[idx] = true;

      const newLines = calcCompletedLines(nextChecked);
      setCompletedLines(newLines);

      setOwners((prevOwners) => {
        const nextOwners = [...prevOwners];
        nextOwners[idx] = actor;

        sync({
          mode,
          images,
          checked: nextChecked,
          completedLines: newLines,
          owners: nextOwners,
        });

        return nextOwners;
      });

      return nextChecked;
    });
  };

  const handleChangeMode = (nextMode) => {
    if (mode === nextMode) return;

    let randomImages = getRandomBingoImages(nextMode, CELL_COUNT);
    randomImages = applySpecialCellToImages(randomImages);

    const initChecked = Array(CELL_COUNT).fill(false);
    if (rules.specialCell.enabled && rules.specialCell.autoChecked) {
      initChecked[rules.specialCell.index] = true;
    }

    setMode(nextMode);
    setImages(randomImages);
    setChecked(initChecked);
    setCompletedLines(calcCompletedLines(initChecked));

    // 모드 변경 시 점령자도 초기화(원하면 유지로 바꿔드림)
    const initOwners = Array(CELL_COUNT).fill(null);
    setOwners(initOwners);

    sync({
      mode: nextMode,
      images: randomImages,
      checked: initChecked,
      completedLines: calcCompletedLines(initChecked),
      owners: initOwners,
    });
  };

  const handleResetBoard = () => {
    let randomImages = getRandomBingoImages(mode, CELL_COUNT);
    randomImages = applySpecialCellToImages(randomImages);

    const initChecked = Array(CELL_COUNT).fill(false);
    if (rules.specialCell.enabled && rules.specialCell.autoChecked) {
      initChecked[rules.specialCell.index] = true;
    }

    setImages(randomImages);
    setChecked(initChecked);
    setCompletedLines(calcCompletedLines(initChecked));

    const initOwners = Array(CELL_COUNT).fill(null);
    setOwners(initOwners);

    sync({
      mode,
      images: randomImages,
      checked: initChecked,
      completedLines: calcCompletedLines(initChecked),
      owners: initOwners,
    });
  };

  if (loading) return <div style={{ color: "#fff" }}>로딩 중...</div>;

  return (
    <div className="bingo-root">
      <header className="bingo-header">
        <div className="bingo-header-row">
          <div className="bingo-mode-tabs">
            {MODES.map((m) => (
              <button
                key={m}
                className={"bingo-tab" + (mode === m ? " bingo-tab--active" : "")}
                onClick={() => handleChangeMode(m)}
              >
                {m === "muse" ? "뮤즈" : "퀸덤"}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="bingo-reset-btn"
            onClick={handleResetBoard}
          >
            초기화
          </button>
        </div>

        <h2 className="bingo-title-text">🍽️ 식사대전 빙고 🍽️</h2>

        {/* ✅ 빙고1 점령 UI */}
        {rules.conquest.enabled && (
          <div className="bingo-conquest-bar">
            <input
              className="bingo-player-input"
              value={currentPlayer}
              onChange={(e) => setCurrentPlayer(e.target.value)}
              placeholder="닉네임 입력"
            />
            <button
              type="button"
              className="bingo-random-capture-btn"
              onClick={handleConquestRandom}
            >
              랜덤 점령
            </button>
          </div>
        )}
      </header>

      <div className="bingo-grid">
        {images.slice(0, CELL_COUNT).map((src, idx) => {
          const inCompletedLine = isCellInCompletedLine(idx);
          const isSpecial = rules.specialCell.enabled && idx === rules.specialCell.index;

          return (
            <div
              key={idx}
              className={
                "bingo-cell" +
                (checked[idx] ? " bingo-cell--checked" : "") +
                (inCompletedLine ? " bingo-cell--line-completed" : "") +
                (isSpecial ? " bingo-cell--special" : "")
              }
              onClick={() => handleToggleCell(idx)}
            >
              <div className="bingo-cell-inner">
                <div className="bingo-cell-front">
                  <img src={src} alt={`bingo-sig-${idx + 1}`} />
                  <span className="bingo-cell-number">{idx + 1}</span>
                </div>

                <div className="bingo-cell-back">
                  <span className="bingo-check-icon">O</span>

                  {/* ✅ 체크표시 하단에 점령자 이름 */}
                  {rules.conquest.enabled && owners[idx] && (
                    <div className="bingo-owner-name">{owners[idx]}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {completedLines.map((lineIndex) => (
          <div
            key={`line-${lineIndex}`}
            className={`bingo-line-overlay bingo-line-${lineIndex}`}
          />
        ))}
      </div>
    </div>
  );
}