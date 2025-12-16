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

const DEFAULT_RULES = {
  // 빙고1: 점령(뺏기 가능) + 뒷면에 점령자 이름 표시
  conquest: {
    enabled: false,
    players: ["P1", "P2"], // 표시될 이름
    steal: true, // 뺏기 허용
  },

  // 빙고2: 가운데 스페셜 카드 (체크 가능 + 빙고 판정 포함)
  specialCell: {
    enabled: false,
    index: 4,
    src: "/images/special.png",
    lock: false, // true면 클릭 막힘(이번 요구사항은 체크 가능이므로 false)
    autoChecked: false, // true면 시작부터 프리칸 체크
  },
};

export default function BingoBoard({ boardId = "default", boardRules = {} }) {
  const rules = {
    conquest: { ...DEFAULT_RULES.conquest, ...(boardRules.conquest || {}) },
    specialCell: { ...DEFAULT_RULES.specialCell, ...(boardRules.specialCell || {}) },
  };

  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("muse");
  const [images, setImages] = useState([]);
  const [checked, setChecked] = useState(Array(CELL_COUNT).fill(false));
  const [completedLines, setCompletedLines] = useState([]); // [0..7]

  // 점령용 상태
  const [owners, setOwners] = useState(Array(CELL_COUNT).fill(null)); // string|null
  const [turn, setTurn] = useState(0); // 0..players-1

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

      // 항상 최신 풀에서 새로 뽑기 + 스페셜 이미지 적용
      let randomImages = getRandomBingoImages(nextMode, CELL_COUNT);
      randomImages = applySpecialCellToImages(randomImages);

      // checked 복원(없으면 초기화)
      let initChecked =
        Array.isArray(remote?.checked) && remote.checked.length === CELL_COUNT
          ? remote.checked
          : Array(CELL_COUNT).fill(false);

      // 스페셜 autoChecked면 true 강제
      if (rules.specialCell.enabled && rules.specialCell.autoChecked) {
        initChecked = [...initChecked];
        initChecked[rules.specialCell.index] = true;
      }

      // owners 복원(없으면 초기화)
      let initOwners =
        Array.isArray(remote?.owners) && remote.owners.length === CELL_COUNT
          ? remote.owners
          : Array(CELL_COUNT).fill(null);

      // turn 복원(없으면 0)
      const initTurn =
        typeof remote?.turn === "number" ? remote.turn : 0;

      const newLines = Array.isArray(remote?.completedLines)
        ? remote.completedLines
        : calcCompletedLines(initChecked);

      setMode(nextMode);
      setImages(randomImages);
      setChecked(initChecked);
      setCompletedLines(newLines);
      setOwners(initOwners);
      setTurn(initTurn);

      // Firestore에도 새 이미지로 덮어쓰기(owners/turn 포함)
      await saveSigBingoState(boardId, {
        mode: nextMode,
        images: randomImages,
        checked: initChecked,
        completedLines: newLines,
        owners: initOwners,
        turn: initTurn,
      });

      setLoading(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]); // 보드 바뀔 때마다 개별 상태 로딩

  const sync = (next) => {
    saveSigBingoState(boardId, next).catch((e) =>
      console.error("saveSigBingoState failed", e)
    );
  };

  const isSpecialLockedCell = (idx) =>
    rules.specialCell.enabled && rules.specialCell.lock && idx === rules.specialCell.index;

  const handleToggleCell = (idx) => {
    if (isSpecialLockedCell(idx)) return;

    // ✅ 점령 모드: 클릭하면 현재 플레이어가 점령(이미 점령되어 있어도 뺏기 가능)
    if (rules.conquest.enabled) {
      const players = rules.conquest.players?.length
        ? rules.conquest.players
        : DEFAULT_RULES.conquest.players;

      const playerName = players[turn % players.length];

      setOwners((prevOwners) => {
        const nextOwners = [...prevOwners];
        const prevOwner = nextOwners[idx];

        // 뺏기 금지면 이미 점령된 칸은 무시
        if (prevOwner && !rules.conquest.steal) return prevOwners;

        nextOwners[idx] = playerName;

        // 점령된 칸은 checked = true로 유지(빙고 판정 포함)
        setChecked((prevChecked) => {
          const nextChecked = [...prevChecked];
          nextChecked[idx] = true;

          const newLines = calcCompletedLines(nextChecked);
          setCompletedLines(newLines);

          const nextTurn = (turn + 1) % players.length;
          setTurn(nextTurn);

          sync({
            mode,
            images,
            checked: nextChecked,
            completedLines: newLines,
            owners: nextOwners,
            turn: nextTurn,
          });

          return nextChecked;
        });

        return nextOwners;
      });

      return;
    }

    // ✅ 일반 모드: 기존 체크 토글
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
        // 스페셜 칸은 이미지 고정(변경 금지)
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
        turn,
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

    // 점령은 모드 바꾸면 초기화(원하면 유지로 바꿔드림)
    const initOwners = Array(CELL_COUNT).fill(null);
    const initTurn = 0;
    setOwners(initOwners);
    setTurn(initTurn);

    sync({
      mode: nextMode,
      images: randomImages,
      checked: initChecked,
      completedLines: calcCompletedLines(initChecked),
      owners: initOwners,
      turn: initTurn,
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
    const initTurn = 0;
    setOwners(initOwners);
    setTurn(initTurn);

    sync({
      mode,
      images: randomImages,
      checked: initChecked,
      completedLines: calcCompletedLines(initChecked),
      owners: initOwners,
      turn: initTurn,
    });
  };

  const isCellInCompletedLine = (cellIndex) =>
    LINES_3X3.some(
      (line, lineIndex) =>
        completedLines.includes(lineIndex) && line.includes(cellIndex)
    );

  if (loading) {
    return <div style={{ color: "#fff" }}>로딩 중...</div>;
  }

  const players = rules.conquest.players?.length
    ? rules.conquest.players
    : DEFAULT_RULES.conquest.players;

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

        {rules.conquest.enabled && (
          <div className="bingo-turn-text" style={{ color: "#fff", marginTop: 8 }}>
            현재 턴: {players[turn % players.length]}
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