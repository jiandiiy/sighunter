// src/components/GameCenter/Bingo/BingoBoard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BingoBoard.css";

import {
  getRandomBingoImages,
  getRandomBingoImage,
} from "../../../utils/sigBingoImagePool";
import { fetchSigItems } from "../../../api/sigHunterImageLibraryApi";
import { saveSigBingoState } from "../../../api/sigBingoStorage";

console.log("[BINGO] *** THIS IS THE REAL BingoBoard.jsx ***");

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
  currentBoardNo = "1", // "1" | "2" | "3"
}) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("muse");
  // 각 칸마다 { id, title, score, imageUrl, slotIndex, boardIndex, ... }
  const [cards, setCards] = useState([]);
  const [checked, setChecked] = useState(Array(CELL_COUNT).fill(false));
  const [completedLines, setCompletedLines] = useState([]);
  // { [mode]: { [cellIndex]: string[](이미 한 번이라도 나온 이미지 id 목록) } }
  const [shownHistory, setShownHistory] = useState({});

  const calcCompletedLines = (checkedArr) => {
    const done = [];
    LINES_3X3.forEach((line, idx) => {
      if (line.every((i) => checkedArr[i])) done.push(idx);
    });
    return done;
  };

  /** 관리자에서 등록한 "식대전 빙고" 카드들을 칸별 풀로 리턴 */
  const loadSlotPoolsForBoard = async (targetMode, boardNo) => {
    try {
      const list = await fetchSigItems({
        mode: targetMode,
        type: "meal-bingo",
        rarity: "normal",
        activeOnly: true,
        boardIndex: boardNo,
      });

      console.log(
        "[BINGO] Firestore list",
        { targetMode, boardNo, count: list.length },
        list
      );

      const slotPools = Array.from({ length: CELL_COUNT }, () => []);

      list.forEach((item) => {
        const raw = Number(item.slotIndex);
        if (!Number.isFinite(raw)) return;
        const idx = raw - 1; // slotIndex 1~9 → 0~8
        if (idx >= 0 && idx < CELL_COUNT) {
          slotPools[idx].push(item);
        }
      });

      console.log("[BINGO] slotPools summary", {
        mode: targetMode,
        boardNo,
        slots: slotPools.map((pool, i) => ({
          slot: i + 1,
          size: pool.length,
          ids: pool.map((p) => p.id || p.imageUrl),
        })),
      });

      return slotPools;
    } catch (e) {
      console.error("loadSlotPoolsForBoard error:", e);
      return Array.from({ length: CELL_COUNT }, () => []);
    }
  };

  /** 풀에서 아직 안 나온 이미지를 우선 선택 */
  const pickCardFromPoolWithGuarantee = (
    pool,
    targetMode,
    cellIndex,
    history
  ) => {
    if (!pool || !pool.length) {
      return { card: null, history };
    }

    const modeKey = targetMode;
    const cellKey = String(cellIndex);

    const modeHistory = history[modeKey] || {};
    const seenIds = new Set(modeHistory[cellKey] || []);

    const unseen = pool.filter((item) => {
      if (!item) return false;
      const id = item.id || item.imageUrl;
      if (!id) return false;
      return !seenIds.has(id);
    });

    const candidates = unseen.length > 0 ? unseen : pool;
    const chosen =
      candidates[Math.floor(Math.random() * candidates.length)] || null;

    if (!chosen) return { card: null, history };

    const chosenId = chosen.id || chosen.imageUrl;
    if (!chosenId) return { card: chosen, history };

    const nextHistory = { ...history };
    const nextModeHistory = { ...(nextHistory[modeKey] || {}) };
    const prevArr = nextModeHistory[cellKey] || [];
    if (!prevArr.includes(chosenId)) {
      nextModeHistory[cellKey] = [...prevArr, chosenId];
    }
    nextHistory[modeKey] = nextModeHistory;

    return { card: chosen, history: nextHistory };
  };

  /** 빙고판 한 장 구성 */
  const buildBoardWithRandomAndFixed = async (
    targetMode,
    boardNo,
    baseHistory
  ) => {
    try {
      console.log("[BINGO] buildBoardWithRandomAndFixed ENTER", {
        targetMode,
        boardNo,
      });

      // 1) 기본 랜덤 카드 9장 (전체 풀에서)
      const baseRandom = await getRandomBingoImages(targetMode, CELL_COUNT, {
        rarity: "normal",
      });
      console.log("[BINGO] after getRandomBingoImages", {
        targetMode,
        boardNo,
        hasBaseRandom: Array.isArray(baseRandom),
        length: Array.isArray(baseRandom) ? baseRandom.length : null,
        baseRandom,
      });

      // 2) 슬롯별 관리자 풀
      const slotPools = await loadSlotPoolsForBoard(targetMode, boardNo);
      console.log("[BINGO] after loadSlotPoolsForBoard", {
        targetMode,
        boardNo,
        slotPoolsIsArray: Array.isArray(slotPools),
        slotPoolsLength: Array.isArray(slotPools) ? slotPools.length : null,
        slotPools,
      });

      const combined = Array(CELL_COUNT).fill(null);
      let nextHistory = { ...baseHistory };

      for (let i = 0; i < CELL_COUNT; i++) {
        const pool = [];

        // 기본 랜덤 1장
        if (baseRandom[i]) pool.push(baseRandom[i]);

        // 이 칸 전용 관리자 이미지들
        if (slotPools[i] && slotPools[i].length) {
          pool.push(...slotPools[i]);
        }

        // id/imageUrl 기준 중복 제거
        const uniqueMap = new Map();
        pool.forEach((item) => {
          if (!item) return;
          const key = item.id || item.imageUrl;
          if (!key) return;
          if (!uniqueMap.has(key)) uniqueMap.set(key, item);
        });
        const finalPool = Array.from(uniqueMap.values());

        if (!finalPool.length) {
          combined[i] = null;
          continue;
        }

        const picked = pickCardFromPoolWithGuarantee(
          finalPool,
          targetMode,
          i,
          nextHistory
        );

        combined[i] = picked.card;
        nextHistory = picked.history;
      }

      console.log("[BINGO] buildBoardWithRandomAndFixed EXIT", {
        targetMode,
        boardNo,
        nonNull: combined.filter(Boolean).length,
      });

      return { cards: combined, history: nextHistory };
    } catch (e) {
      console.error("[BINGO] buildBoardWithRandomAndFixed error >>>", e);
      // 에러가 나도 상위에서 Promise 에러 안 터지게 안전한 기본값 리턴
      return {
        cards: Array(CELL_COUNT).fill(null),
        history: baseHistory || {},
      };
    }
  };

  // 디버그용: 랜덤 이미지 API 테스트
  useEffect(() => {
    async function debugRandom() {
      try {
        console.log("[BINGO-DEBUG] test getRandomBingoImages START");
        const result = await getRandomBingoImages("muse", 9, {
          rarity: "normal",
        });
        console.log("[BINGO-DEBUG] test getRandomBingoImages RESULT", {
          ok: Array.isArray(result),
          length: Array.isArray(result) ? result.length : null,
        });
      } catch (e) {
        console.error("[BINGO-DEBUG] test getRandomBingoImages ERROR", e);
      }
    }

    debugRandom();
  }, []);

  useEffect(() => {
    async function init() {
      try {
        console.log("[BINGO] init start", { boardId, currentBoardNo });

        // Firestore 로드는 제거
        const remote = null;

        // 전역 모드 읽기 (없으면 muse)
        let globalMode = "muse";
        if (typeof window !== "undefined") {
          const v = window.localStorage.getItem(GLOBAL_MODE_KEY);
          if (v === "queendom") globalMode = "queendom";
        }
        const nextMode = globalMode;

        const initialHistory =
          remote && typeof remote.shownHistory === "object"
            ? remote.shownHistory
            : {};

        // 항상 최신 데이터 기준으로 보드를 새로 구성
        const built = await buildBoardWithRandomAndFixed(
          nextMode,
          currentBoardNo,
          initialHistory
        );
        const baseCards = built.cards;
        const historyToUse = built.history;

        console.log("[BINGO] init after buildBoardWithRandomAndFixed", {
          baseCardsLength: Array.isArray(baseCards) ? baseCards.length : null,
          nonNull: Array.isArray(baseCards)
            ? baseCards.filter(Boolean).length
            : null,
        });

        const initChecked = Array(CELL_COUNT).fill(false);
        const newLines = calcCompletedLines(initChecked);

        setMode(nextMode);
        setCards(baseCards);
        setChecked(initChecked);
        setCompletedLines(newLines);
        setShownHistory(historyToUse);

        saveSigBingoState(boardId, {
          mode: nextMode,
          cards: baseCards,
          checked: initChecked,
          completedLines: newLines,
          shownHistory: historyToUse,
        }).catch((e) => console.error("saveSigBingoState (init) failed", e));

        setLoading(false);
      } catch (err) {
        console.error("[BINGO] init error >>>", err);
        setLoading(false);
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, currentBoardNo]);

  const sync = (next, historyOverride) => {
    const historyToSave =
      historyOverride !== undefined ? historyOverride : shownHistory;

    saveSigBingoState(boardId, {
      ...next,
      shownHistory: historyToSave,
    }).catch((e) => console.error("saveSigBingoState failed", e));
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

      // 라인 완성에 포함된 칸이면 새 "스페셜" 카드로 교체
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

      // 모드 변경 시: 랜덤 + 슬롯별 풀 조합 새로 생성
      const built = await buildBoardWithRandomAndFixed(
        nextMode,
        currentBoardNo,
        shownHistory
      );
      const baseCards = built.cards;
      const newHistory = built.history;

      const initChecked = Array(CELL_COUNT).fill(false);
      const newLines = calcCompletedLines(initChecked);

      setMode(nextMode);
      setCards(baseCards);
      setChecked(initChecked);
      setCompletedLines(newLines);
      setShownHistory(newHistory);

      sync(
        {
          mode: nextMode,
          cards: baseCards,
          checked: initChecked,
          completedLines: newLines,
        },
        newHistory
      );
    } catch (err) {
      console.error("handleChangeMode error:", err);
    }
  };

  const handleResetBoard = async () => {
    try {
      const built = await buildBoardWithRandomAndFixed(
        mode,
        currentBoardNo,
        shownHistory
      );
      const baseCards = built.cards;
      const newHistory = built.history;

      const initChecked = Array(CELL_COUNT).fill(false);
      const newLines = calcCompletedLines(initChecked);

      setCards(baseCards);
      setChecked(initChecked);
      setCompletedLines(newLines);
      setShownHistory(newHistory);

      sync(
        {
          mode,
          cards: baseCards,
          checked: initChecked,
          completedLines: newLines,
        },
        newHistory
      );
    } catch (err) {
      console.error("handleResetBoard error:", err);
    }
  };

  console.log("[BINGO] render", {
    cardsLength: cards.length,
    mode,
    currentBoardNo,
    loading,
  });

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
                (checked[idx] ? " bingo-cell--checked " : " ") +
                (inCompletedLine ? " bingo-cell--line-completed" : "")
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