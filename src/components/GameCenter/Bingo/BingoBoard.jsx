// src/components/GameCenter/Bingo/BingoBoard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

export default function BingoBoard({
  boardId = "default",
  currentBoardNo = "1", // URL 기준 현재 빙고 번호
}) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("muse");
  const [images, setImages] = useState([]);
  const [checked, setChecked] = useState(Array(CELL_COUNT).fill(false));
  const [completedLines, setCompletedLines] = useState([]);

  const calcCompletedLines = (checkedArr) => {
    const done = [];
    LINES_3X3.forEach((line, idx) => {
      if (line.every((i) => checkedArr[i])) done.push(idx);
    });
    return done;
  };

  useEffect(() => {
    async function init() {
      const remote = await loadSigBingoState(boardId);

      const nextMode = remote?.mode || "muse";

      const randomImages = getRandomBingoImages(nextMode, CELL_COUNT);

      const initChecked =
        Array.isArray(remote?.checked) && remote.checked.length === CELL_COUNT
          ? remote.checked
          : Array(CELL_COUNT).fill(false);

      const newLines = Array.isArray(remote?.completedLines)
        ? remote.completedLines
        : calcCompletedLines(initChecked);

      setMode(nextMode);
      setImages(randomImages);
      setChecked(initChecked);
      setCompletedLines(newLines);

      await saveSigBingoState(boardId, {
        mode: nextMode,
        images: randomImages,
        checked: initChecked,
        completedLines: newLines,
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

  const isCellInCompletedLine = (cellIndex) =>
    LINES_3X3.some(
      (line, lineIndex) =>
        completedLines.includes(lineIndex) && line.includes(cellIndex)
    );

  const handleToggleCell = (idx) => {
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
    const newLines = calcCompletedLines(initChecked);
    setCompletedLines(newLines);

    sync({
      mode: nextMode,
      images: randomImages,
      checked: initChecked,
      completedLines: newLines,
    });
  };

  const handleResetBoard = () => {
    const randomImages = getRandomBingoImages(mode, CELL_COUNT);
    const initChecked = Array(CELL_COUNT).fill(false);

    setImages(randomImages);
    setChecked(initChecked);
    const newLines = calcCompletedLines(initChecked);
    setCompletedLines(newLines);

    sync({
      mode,
      images: randomImages,
      checked: initChecked,
      completedLines: newLines,
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

        {/* 뮤즈/퀸덤 아래 빙고 1,2,3 탭 */}
        <div
          style={{
            marginTop: 8,
            display: "flex",
            gap: 8,
            justifyContent: "center",
          }}
        >
          {["1", "2", "3"].map((no) => {
            const active = currentBoardNo === no;
            return (
              <button
                key={no}
                type="button"
                onClick={() => navigate(`/bingo/${no}`)}
                style={{
                  padding: "4px 12px",
                  borderRadius: 999,
                  border: active ? "2px solid #f97316" : "1px solid #f97316",
                  background: active ? "#0f172a" : "#020617",
                  color: "#f9fafb",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {`빙고 ${no}`}
              </button>
            );
          })}
        </div>

        <h2 className="bingo-title-text">🍽️ 식사대전 빙고 🍽️</h2>
      </header>

      <div className="bingo-grid">
        {images.slice(0, CELL_COUNT).map((src, idx) => {
          const inCompletedLine = isCellInCompletedLine(idx);

          return (
            <div
              key={idx}
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