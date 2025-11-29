import React, { useEffect, useState } from "react";
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

// ⭐ 어떤 빙고인지 구분하는 boardId 추가
export default function BingoBoard({ boardId = "default" }) {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("muse");
  const [images, setImages] = useState([]);
  const [checked, setChecked] = useState(Array(CELL_COUNT).fill(false));
  const [completedLines, setCompletedLines] = useState([]); // [0..7]

  const calcCompletedLines = (checkedArr) => {
    const done = [];
    LINES_3X3.forEach((line, idx) => {
      const isComplete = line.every((i) => checkedArr[i]);
      if (isComplete) done.push(idx);
    });
    return done;
  };

  // 🔹 boardId 기준으로 상태 불러오기
  useEffect(() => {
    async function init() {
      const remote = await loadSigBingoState(boardId);

      if (remote) {
        setMode(remote.mode || "muse");
        setImages(
          Array.isArray(remote.images) && remote.images.length
            ? remote.images
            : getRandomBingoImages("muse", CELL_COUNT)
        );
        setChecked(
          Array.isArray(remote.checked) && remote.checked.length === CELL_COUNT
            ? remote.checked
            : Array(CELL_COUNT).fill(false)
        );
        setCompletedLines(remote.completedLines || []);
      } else {
        const randomImages = getRandomBingoImages("muse", CELL_COUNT);
        const initChecked = Array(CELL_COUNT).fill(false);

        setMode("muse");
        setImages(randomImages);
        setChecked(initChecked);
        setCompletedLines([]);

        await saveSigBingoState(boardId, {
          mode: "muse",
          images: randomImages,
          checked: initChecked,
          completedLines: [],
        });
      }

      setLoading(false);
    }

    init();
  }, [boardId]); // ← 빙고1/2 바뀔 때마다 개별 상태 로딩

  const sync = (next) => {
    saveSigBingoState(boardId, next).catch((e) =>
      console.error("saveSigBingoState failed", e)
    );
  };

  const handleToggleCell = (idx) => {
    setChecked((prevChecked) => {
      const nextChecked = [...prevChecked];
      nextChecked[idx] = !nextChecked[idx];

      const newLines = calcCompletedLines(nextChecked);

      setCompletedLines((prevLines) => {
        const merged = [...prevLines];
        newLines.forEach((l) => {
          if (!merged.includes(l)) merged.push(l);
        });
        return merged;
      });

      const isInCompletedLine = LINES_3X3.some(
        (line, lineIndex) =>
          (completedLines.includes(lineIndex) ||
            newLines.includes(lineIndex)) && line.includes(idx)
      );

      let nextImages = images;
      if (isInCompletedLine) {
        nextImages = [...images];
        nextImages[idx] = getRandomBingoImage(mode);
        setImages(nextImages);
      }

      sync({
        mode,
        images: nextImages,
        checked: nextChecked,
        completedLines: newLines,
      });

      return nextChecked;
    });
  };

  const handleChangeMode = (nextMode) => {
    if (mode === nextMode) return;
    const randomImages = getRandomBingoImages(nextMode, CELL_COUNT);
    const initChecked = Array(CELL_COUNT).fill(false);

    setMode(nextMode);
    setImages(randomImages);
    setChecked(initChecked);
    setCompletedLines([]);

    sync({
      mode: nextMode,
      images: randomImages,
      checked: initChecked,
      completedLines: [],
    });
  };

  const handleResetBoard = () => {
    const randomImages = getRandomBingoImages(mode, CELL_COUNT);
    const initChecked = Array(CELL_COUNT).fill(false);

    setImages(randomImages);
    setChecked(initChecked);
    setCompletedLines([]);

    sync({
      mode,
      images: randomImages,
      checked: initChecked,
      completedLines: [],
    });
  };

  // ✅ 어떤 셀이 빙고된 줄에 포함되는지
  const isCellInCompletedLine = (cellIndex) => {
    return LINES_3X3.some(
      (line, lineIndex) =>
        completedLines.includes(lineIndex) && line.includes(cellIndex)
    );
  };

  if (loading) {
    return <div style={{ color: "#fff" }}>로딩 중...</div>;
  }

  return (
    <div className="bingo-root">
      <header className="bingo-header">
        <h2>식사대전 빙고</h2>
        <p className="bingo-subtitle">group1~group6에서 랜덤 시그 9개</p>

        <div className="bingo-header-row">
          <div className="bingo-mode-tabs">
            {MODES.map((m) => (
              <button
                key={m}
                className={
                  "bingo-tab" + (mode === m ? " bingo-tab--active" : "")
                }
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
      </header>

      <div className="bingo-grid">
        {/* 카드 */}
        {images.slice(0, CELL_COUNT).map((src, idx) => {
          const inCompletedLine = isCellInCompletedLine(idx);

          return (
            <div
              key={idx} // ★ idx만 사용해서 플립 안정화
              className={
                "bingo-cell" +
                (checked[idx] ? " bingo-cell--checked" : "") +
                (inCompletedLine ? " bingo-cell--line-completed" : "")
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
                </div>
              </div>
            </div>
          );
        })}

        {/* 한 줄 빙고 라인 오버레이 */}
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