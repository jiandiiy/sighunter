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
const GLOBAL_MODE_KEY = "sigBingo-global-mode";

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
  currentBoardNo = "1",
}) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("muse");
  // 각 칸마다 { id, title, score, imageUrl, ... } 형태로 저장
  const [cards, setCards] = useState([]);
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
      try {
        const remote = await loadSigBingoState(boardId);

        // 전역 모드 읽기 (없으면 muse)
        let globalMode = "muse";
        if (typeof window !== "undefined") {
          const v = window.localStorage.getItem(GLOBAL_MODE_KEY);
          if (v === "queendom") globalMode = "queendom";
        }
        const nextMode = globalMode;

        // 저장된 카드가 새 포맷(객체 + imageUrl)이고, 모드도 일치하는지 검사
        const isValidCard = (c) =>
          c &&
          typeof c === "object" &&
          typeof c.imageUrl === "string" &&
          c.imageUrl.length > 0;

        const storedCards =
          remote?.mode === nextMode &&
          Array.isArray(remote?.cards) &&
          remote.cards.length === CELL_COUNT &&
          remote.cards.every(isValidCard)
            ? remote.cards
            : null;

        const randomCards =
          storedCards ||
          (await getRandomBingoImages(nextMode, CELL_COUNT, {
            rarity: "normal",
          }));

        const initChecked =
          Array.isArray(remote?.checked) &&
          remote.checked.length === CELL_COUNT
            ? remote.checked
            : Array(CELL_COUNT).fill(false);

        const newLines = Array.isArray(remote?.completedLines)
          ? remote.completedLines
          : calcCompletedLines(initChecked);

        setMode(nextMode);
        setCards(randomCards);
        setChecked(initChecked);
        setCompletedLines(newLines);

        await saveSigBingoState(boardId, {
          mode: nextMode,
          cards: randomCards,
          checked: initChecked,
          completedLines: newLines,
        });

        setLoading(false);
      } catch (err) {
        console.error("BingoBoard init error:", err);
        setLoading(false);
      }
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

  const handleToggleCell = async (idx) => {
    try {
      const nextChecked = [...checked];
      nextChecked[idx] = !nextChecked[idx];

      const newLines = calcCompletedLines(nextChecked);

      const isInCompletedLine = LINES_3X3.some(
        (line, lineIndex) => newLines.includes(lineIndex) && line.includes(idx)
      );

      let nextCards = cards;

      // 라인 완성에 포함된 칸이면 새 카드로 교체
      if (isInCompletedLine) {
        const newCard = await getRandomBingoImage(mode, { rarity: "special" });
        if (newCard) {
          nextCards = [...cards];
          nextCards[idx] = newCard;
        }
      }

      setChecked(nextChecked);
      setCompletedLines(newLines);
      setCards(nextCards);

      sync({
        mode,
        cards: nextCards,
        checked: nextChecked,
        completedLines: newLines,
      });
    } catch (err) {
      console.error("handleToggleCell error:", err);
    }
  };

  const handleChangeMode = async (nextMode) => {
    if (mode === nextMode) return;

    try {
      // 전역 모드 저장
      if (typeof window !== "undefined") {
        window.localStorage.setItem(GLOBAL_MODE_KEY, nextMode);
      }

      const randomCards = await getRandomBingoImages(nextMode, CELL_COUNT, {
        rarity: "normal",
      });
      const initChecked = Array(CELL_COUNT).fill(false);
      const newLines = calcCompletedLines(initChecked);

      setMode(nextMode);
      setCards(randomCards);
      setChecked(initChecked);
      setCompletedLines(newLines);

      sync({
        mode: nextMode,
        cards: randomCards,
        checked: initChecked,
        completedLines: newLines,
      });
    } catch (err) {
      console.error("handleChangeMode error:", err);
    }
  };

  const handleResetBoard = async () => {
    try {
      const randomCards = await getRandomBingoImages(mode, CELL_COUNT, {
        rarity: "normal",
      });
      const initChecked = Array(CELL_COUNT).fill(false);
      const newLines = calcCompletedLines(initChecked);

      setCards(randomCards);
      setChecked(initChecked);
      setCompletedLines(newLines);

      sync({
        mode,
        cards: randomCards,
        checked: initChecked,
        completedLines: newLines,
      });
    } catch (err) {
      console.error("handleResetBoard error:", err);
    }
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
        {cards.slice(0, CELL_COUNT).map((card, idx) => {
          const inCompletedLine = isCellInCompletedLine(idx);

          return (
            <div
              key={idx}
              className={
                "bingo-cell" +
                (checked[idx] ? "bingo-cell--checked " : " ") +
                (inCompletedLine ? "bingo-cell--line-completed" : "")
              }
              onClick={() => handleToggleCell(idx)}
            >
              <div className="bingo-cell-inner">
                <div className="bingo-cell-front">
                  {card?.imageUrl && (
                    <img
                      src={card.imageUrl}
                      alt={card.title || `bingo-${idx}`}
                    />
                  )}

                  {/* 번호만 표시 (이름/점수는 숨김) */}
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