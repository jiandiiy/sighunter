// src/components/GameCenter/Bingo/BingoBoard.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./BingoBoard.css";

import {
  getRandomBingoImages,
  getRandomBingoImage,
} from "../../../utils/sigBingoImagePool";
import { fetchSigItems } from "../../../api/sigHunterImageLibraryApi";
import {
  loadSigBingoState,
  saveSigBingoState,
} from "../../../api/sigBingoStorage";

console.log("[BINGO] *** BingoBoard.jsx 로드 완료 ***");

const MODES = ["muse", "queendom"];
const GLOBAL_MODE_KEY = "sigBingo-global-mode";

const ROWS = 3;
const COLS = 3;
const CELL_COUNT = ROWS * COLS;

const LINES_3X3 = [
  [0, 1, 2], // 가로1
  [3, 4, 5], // 가로2
  [6, 7, 8], // 가로3
  [0, 3, 6], // 세로1
  [1, 4, 7], // 세로2
  [2, 5, 8], // 세로3
  [0, 4, 8], // 대각선1
  [2, 4, 6], // 대각선2
];

export default function BingoBoard({
  boardId = "default",
  currentBoardNo = "1", // "1" | "2" | "3"
}) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("muse");
  const [cards, setCards] = useState([]);
  const [checked, setChecked] = useState(Array(CELL_COUNT).fill(false));
  const [completedLines, setCompletedLines] = useState([]);
  // { [mode]: { [cellIndex]: string[] } } 형태로 이미 나온 이미지 ID 기록
  const [shownHistory, setShownHistory] = useState({});

  // 🔢 번호로 칸 지정해서 뒤집기용 입력 상태
  const [targetCellNo, setTargetCellNo] = useState("");

  // 🔢 칸 번호 입력창 DOM 접근용 ref (단축키 포커스용)
  const cellNumberInputRef = useRef(null);

  /* -------------------------------------------------------------------------- */
  /* 🔧 유틸: 완성된 라인 계산                                                    */
  /* -------------------------------------------------------------------------- */
  const calcCompletedLines = (checkedArr) => {
    const done = [];
    LINES_3X3.forEach((line, idx) => {
      if (line.every((i) => checkedArr[i])) done.push(idx);
    });
    return done;
  };

  /* -------------------------------------------------------------------------- */
  /* 🔧 Firestore: 관리자가 등록한 식대전 빙고 카드 로드 (슬롯별)                  */
  /* -------------------------------------------------------------------------- */
  const loadSlotPoolsForBoard = useCallback(async (targetMode, boardNo) => {
    try {
      const list = await fetchSigItems({
        mode: targetMode,
        type: "meal-bingo",
        rarity: "normal",
        activeOnly: true,
        boardIndex: boardNo,
      });

      console.log("[BINGO] Firestore 슬롯별 카드 로드", {
        mode: targetMode,
        boardNo,
        count: list.length,
      });

      const slotPools = Array.from({ length: CELL_COUNT }, () => []);

      list.forEach((item) => {
        const raw = Number(item.slotIndex);
        if (!Number.isFinite(raw)) return;
        const idx = raw - 1; // slotIndex 1~9 → 0~8
        if (idx >= 0 && idx < CELL_COUNT) {
          slotPools[idx].push(item);
        }
      });

      console.log("[BINGO] 슬롯별 풀 구성 완료", {
        mode: targetMode,
        boardNo,
        slots: slotPools.map((pool, i) => ({
          slot: i + 1,
          size: pool.length,
        })),
      });

      return slotPools;
    } catch (error) {
      console.error("[BINGO] 슬롯별 카드 로드 실패:", error);
      return Array.from({ length: CELL_COUNT }, () => []);
    }
  }, []);

  /* -------------------------------------------------------------------------- */
  /* 🔧 히스토리 기반 중복 방지 카드 선택                                          */
  /* -------------------------------------------------------------------------- */
  const pickCardFromPoolWithGuarantee = useCallback(
    (pool, targetMode, cellIndex, history) => {
      if (!pool || !pool.length) {
        return { card: null, history };
      }

      const modeKey = targetMode;
      const cellKey = String(cellIndex);

      // 이미 나온 ID 목록
      const modeHistory = history[modeKey] || {};
      const seenIds = new Set(modeHistory[cellKey] || []);

      // 아직 안 나온 카드 우선 선택
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

      // 히스토리 업데이트
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
    },
    []
  );

  /* -------------------------------------------------------------------------- */
  /* 🎲 빙고판 한 장 구성 (랜덤 + Firestore 슬롯별 카드 혼합)                      */
  /* -------------------------------------------------------------------------- */
  const buildBoardWithRandomAndFixed = useCallback(
    async (targetMode, boardNo, baseHistory) => {
      try {
        console.log("[BINGO] 빙고판 구성 시작", {
          mode: targetMode,
          boardNo,
        });

        // 🔥 1) 기본 랜덤 카드 9장 (로컬 이미지 풀)
        const baseRandom = await getRandomBingoImages(targetMode, CELL_COUNT, {
          rarity: "normal",
        });

        console.log("[BINGO] 로컬 랜덤 카드 로드", {
          count: baseRandom.length,
        });

        // 🔥 2) 슬롯별 관리자 등록 카드 (Firestore)
        const slotPools = await loadSlotPoolsForBoard(targetMode, boardNo);

        console.log("[BINGO] Firestore 슬롯 풀 로드 완료");

        const combined = Array(CELL_COUNT).fill(null);
        let nextHistory = { ...baseHistory };

        // 🔥 3) 각 칸마다 랜덤 + 관리자 카드 합쳐서 선택
        for (let i = 0; i < CELL_COUNT; i++) {
          const pool = [];

          // 기본 랜덤 1장
          if (baseRandom[i]) pool.push(baseRandom[i]);

          // 이 칸 전용 관리자 이미지들
          if (slotPools[i]?.length) {
            pool.push(...slotPools[i]);
          }

          // 🔥 ID 중복 제거 (같은 이미지 여러 번 등록된 경우 대비)
          const uniqueMap = new Map();
          pool.forEach((item) => {
            if (!item) return;
            const key = item.id || item.imageUrl;
            if (!key) return;
            if (!uniqueMap.has(key)) uniqueMap.set(key, item);
          });
          const finalPool = Array.from(uniqueMap.values());

          if (!finalPool.length) {
            console.warn(`[BINGO] 칸 ${i + 1} 풀이 비어있음`);
            combined[i] = null;
            continue;
          }

          // 🔥 히스토리 기반 중복 방지 선택
          const picked = pickCardFromPoolWithGuarantee(
            finalPool,
            targetMode,
            i,
            nextHistory
          );

          combined[i] = picked.card;
          nextHistory = picked.history;
        }

        console.log("[BINGO] 빙고판 구성 완료", {
          mode: targetMode,
          boardNo,
          nonNull: combined.filter(Boolean).length,
        });

        return { cards: combined, history: nextHistory };
      } catch (error) {
        console.error("[BINGO] 빙고판 구성 에러:", error);
        return {
          cards: Array(CELL_COUNT).fill(null),
          history: baseHistory || {},
        };
      }
    },
    [loadSlotPoolsForBoard, pickCardFromPoolWithGuarantee]
  );

  /* -------------------------------------------------------------------------- */
  /* 🔧 디버그: 랜덤 이미지 API 테스트                                             */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    async function debugRandom() {
      try {
        console.log("[BINGO-DEBUG] 랜덤 이미지 API 테스트 시작");
        const result = await getRandomBingoImages("muse", 9, {
          rarity: "normal",
        });
        console.log("[BINGO-DEBUG] 랜덤 이미지 API 테스트 결과", {
          ok: Array.isArray(result),
          length: result.length,
          sample: result[0],
        });
      } catch (error) {
        console.error("[BINGO-DEBUG] 랜덤 이미지 API 테스트 실패:", error);
      }
    }

    debugRandom();
  }, []);

  /* -------------------------------------------------------------------------- */
  /* 🎬 초기화: Firestore 로드 + 빙고판 구성                                       */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    async function init() {
      try {
        console.log("[BINGO] 초기화 시작", { boardId, currentBoardNo });

        // 🔥 전역 모드 읽기 (localStorage)
        let globalMode = "muse";
        if (typeof window !== "undefined") {
          const v = window.localStorage.getItem(GLOBAL_MODE_KEY);
          if (v === "queendom") globalMode = "queendom";
        }

        // 🔥 Firestore에서 저장된 상태 로드
        const remote = await loadSigBingoState(boardId);

        if (remote && remote.mode === globalMode) {
          console.log("[BINGO] Firestore 데이터 복원", {
            mode: remote.mode,
            cardCount: remote.cards?.length,
          });

          // 저장된 상태 그대로 복원
          setMode(remote.mode);
          setCards(remote.cards || []);
          setChecked(remote.checked || Array(CELL_COUNT).fill(false));
          setCompletedLines(remote.completedLines || []);
          setShownHistory(remote.shownHistory || {});
        } else {
          console.log("[BINGO] 새 게임 시작 (Firestore 데이터 없음)");

          // 🔥 새 빙고판 구성
          const initialHistory = remote?.shownHistory || {};
          const built = await buildBoardWithRandomAndFixed(
            globalMode,
            currentBoardNo,
            initialHistory
          );

          const baseCards = built.cards;
          const historyToUse = built.history;

          const initChecked = Array(CELL_COUNT).fill(false);
          const newLines = calcCompletedLines(initChecked);

          setMode(globalMode);
          setCards(baseCards);
          setChecked(initChecked);
          setCompletedLines(newLines);
          setShownHistory(historyToUse);

          // 🔥 Firestore 저장
          saveSigBingoState(boardId, {
            mode: globalMode,
            cards: baseCards,
            checked: initChecked,
            completedLines: newLines,
            shownHistory: historyToUse,
          }).catch((e) => console.error("[BINGO] 저장 실패:", e));
        }

        setLoading(false);
      } catch (error) {
        console.error("[BINGO] 초기화 에러:", error);
        setLoading(false);
      }
    }

    init();
  }, [boardId, currentBoardNo, buildBoardWithRandomAndFixed]);

  /* -------------------------------------------------------------------------- */
  /* 🔧 Alt+Shift+F 단축키로 칸 번호 입력창으로 포커스 이동                        */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt + Shift + F 조합인지 확인
      if (e.altKey && e.shiftKey && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        if (cellNumberInputRef.current) {
          cellNumberInputRef.current.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  /* -------------------------------------------------------------------------- */
  /* 🔧 Firestore 동기화                                                         */
  /* -------------------------------------------------------------------------- */
  const sync = (next, historyOverride) => {
    const historyToSave =
      historyOverride !== undefined ? historyOverride : shownHistory;

    saveSigBingoState(boardId, {
      ...next,
      shownHistory: historyToSave,
    }).catch((e) => console.error("[BINGO] 동기화 실패:", e));
  };

  /* -------------------------------------------------------------------------- */
  /* 🔧 완성된 라인에 포함된 칸인지 확인                                            */
  /* -------------------------------------------------------------------------- */
  const isCellInCompletedLine = (cellIndex) =>
    LINES_3X3.some(
      (line, lineIndex) =>
        completedLines.includes(lineIndex) && line.includes(cellIndex)
    );

  /* -------------------------------------------------------------------------- */
  /* 🎯 칸 클릭 핸들러 (체크/해제 + 라인 완성 시 스페셜 카드 교체)                   */
  /* -------------------------------------------------------------------------- */
  const handleToggleCell = async (idx) => {
    try {
      const nextChecked = [...checked];
      nextChecked[idx] = !nextChecked[idx];

      const newLines = calcCompletedLines(nextChecked);

      // 🔥 라인 완성에 포함된 칸인지 확인
      const isInCompletedLine = LINES_3X3.some(
        (line, lineIndex) => newLines.includes(lineIndex) && line.includes(idx)
      );

      let nextCards = cards;

      // 🔥 라인 완성 시 스페셜 카드로 교체
      if (isInCompletedLine) {
        console.log(`[BINGO] 칸 ${idx + 1} 라인 완성! 스페셜 카드로 교체`);
        const newCard = await getRandomBingoImage(mode, { rarity: "special" });
        if (newCard) {
          nextCards = [...cards];
          nextCards[idx] = newCard;
        }
      }

      setChecked(nextChecked);
      setCompletedLines(newLines);
      setCards(nextCards);

      // 🔥 Firestore 저장
      sync({
        mode,
        cards: nextCards,
        checked: nextChecked,
        completedLines: newLines,
      });
    } catch (error) {
      console.error("[BINGO] 칸 클릭 에러:", error);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* 🔹 번호(1~9)로 칸 찾아서 토글                                               */
  /* -------------------------------------------------------------------------- */
  const flipCellByNumber = (noStr) => {
    const n = Number(noStr);
    if (!Number.isFinite(n)) return;
    if (n < 1 || n > CELL_COUNT) return;

    const idx = n - 1;
    handleToggleCell(idx);
  };

  /* -------------------------------------------------------------------------- */
  /* 🔄 모드 변경 핸들러 (뮤즈 ↔ 퀸덤)                                             */
  /* -------------------------------------------------------------------------- */
  const handleChangeMode = async (nextMode) => {
    if (mode === nextMode) return;

    try {
      console.log(`[BINGO] 모드 변경: ${mode} → ${nextMode}`);

      // 🔥 전역 모드 저장 (localStorage)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(GLOBAL_MODE_KEY, nextMode);
      }

      // 🔥 새 빙고판 구성
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

      // 🔥 Firestore 저장
      sync(
        {
          mode: nextMode,
          cards: baseCards,
          checked: initChecked,
          completedLines: newLines,
        },
        newHistory
      );
    } catch (error) {
      console.error("[BINGO] 모드 변경 에러:", error);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* 🔄 보드 초기화 핸들러 (히스토리 완전 리셋)                                     */
  /* -------------------------------------------------------------------------- */
  const handleResetBoard = async () => {
    try {
      console.log("[BINGO] 보드 초기화 (히스토리 완전 리셋)");

      // 🔥 히스토리 완전 리셋
      const emptyHistory = {};

      const built = await buildBoardWithRandomAndFixed(
        mode,
        currentBoardNo,
        emptyHistory
      );
      const baseCards = built.cards;
      const newHistory = built.history;

      const initChecked = Array(CELL_COUNT).fill(false);
      const newLines = calcCompletedLines(initChecked);

      setCards(baseCards);
      setChecked(initChecked);
      setCompletedLines(newLines);
      setShownHistory(newHistory);

      // 🔥 Firestore 저장
      sync(
        {
          mode,
          cards: baseCards,
          checked: initChecked,
          completedLines: newLines,
        },
        newHistory
      );
    } catch (error) {
      console.error("[BINGO] 보드 초기화 에러:", error);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* 🎨 렌더링                                                                   */
  /* -------------------------------------------------------------------------- */

  console.log("[BINGO] 렌더링", {
    mode,
    boardNo: currentBoardNo,
    cardCount: cards.length,
    loading,
  });

  if (loading) {
    return (
      <div style={{ color: "#fff", padding: "2rem", textAlign: "center" }}>
        🎲 빙고판 로딩 중...
      </div>
    );
  }

  return (
    <div className="bingo-root">
      {/* 헤더: 모드 탭 + 초기화 버튼 + 칸 번호 입력 */}
      <header className="bingo-header">
        <div className="bingo-header-row">
          {/* 모드 선택 탭 */}
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

          {/* 우측: 초기화 + 칸 번호 입력 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              className="bingo-reset-btn"
              onClick={handleResetBoard}
            >
              초기화
            </button>

            {/* 🔢 칸 번호 입력 (시그헌터 스타일 라벨) */}
            <div
              className="bingo-cellno-wrapper"
              style={{ position: "relative", width: 70 }}
            >
              <input
                type="number"
                min="1"
                max={CELL_COUNT}
                value={targetCellNo}
                onChange={(e) => setTargetCellNo(e.target.value)}
                className="bingo-cellno-input"
                ref={cellNumberInputRef}
                style={{
                  width: "100%",
                  padding: "8px 2px",
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  fontSize: 20,
                  textAlign: "center",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    flipCellByNumber(targetCellNo);
                  }
                }}
              />
              {/* 라벨: 포커스 없을 때만 보이게 CSS로 제어 */}
              <span className="bingo-cellno-label">칸 번호</span>
            </div>
          </div>
        </div>

        {/* 빙고 보드 선택 (1/2/3) + 번호로 뒤집기 버튼 */}
        <div
          style={{
            marginTop: 8,
            display: "flex",
            gap: 8,
            justifyContent: "center",
            alignItems: "flex-end",
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

          {/* 🎴 번호로 뒤집기 버튼 (빙고 버튼 오른쪽) */}
          <button
            type="button"
            onClick={() => flipCellByNumber(targetCellNo)}
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid #f97316",
              background: "#111827",
              color: "#f9fafb",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              marginLeft: 4,
            }}
          >
            🎴 뒤집기
          </button>
        </div>
        
         {/* 🔹 단축키 안내 문구 */}
        <span
          style={{
            fontSize: 16,
            color: "#4b5563",
            lineHeight: 1.4,
            textAlign: "left",
          }}
        >
          *Alt+Shift+F → 칸번호
        </span>


        {/* 제목 */}
        <h2 className="bingo-title-text">🍽️ 식사대전 빙고 🍽️</h2>
      </header>

      {/* 빙고 그리드 (3x3) */}
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
                {/* 앞면: 이미지 */}
                <div className="bingo-cell-front">
                  {card?.imageUrl && (
                    <img
                      src={card.imageUrl}
                      alt={card.title || `bingo-${idx}`}
                      onError={(e) => {
                        console.error(
                          `[BINGO] 이미지 로드 실패: ${card.imageUrl}`
                        );
                        e.target.style.display = "none";
                      }}
                    />
                  )}

                  {/* 칸 번호 (1~9) */}
                  <span className="bingo-cell-number">{idx + 1}</span>
                </div>

                {/* 뒷면: 체크 표시 (O) */}
                <div className="bingo-cell-back">
                  <span className="bingo-check-icon">O</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* 완성된 라인 오버레이 */}
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