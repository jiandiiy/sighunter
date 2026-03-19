// src/components/GameCenter/SigHunterBingo/useSigHunterBingoState.js

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getInitialHunterCells,
  HUNTER_MODES,
  createRandomHunterCell,
} from "../../utils/sigHunterBingoData";
import {
  loadSigHunterBingoState,
  saveSigHunterBingoState,
} from "../../api/sigHunterBingoApi";
import { loadAllCells } from "../../api/sigHunterBingoCellsApi";
import { toStorageUrl } from "../../core/storageUrl";

export const AVAILABLE_SIZES = [3, 5];

// 공용: 라인(가로/세로/대각) 인덱스 생성
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

// 플레이어 색 팔레트
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

export function useSigHunterBingoState(boardId = "hunter1") {
  const [loading, setLoading] = useState(true);

  // 모드 / 사이즈
  const [mode, setMode] = useState("muse"); // "muse" | "queendom" | "holic"
  const [size, setSize] = useState(5); // 3 | 5

  const cellCount = size * size;
  const lines = useMemo(() => makeLines(size), [size]);

  const stateKey = `${mode}-${size}`; // 메모리 내 모드별 상태 키
  const storageKey = `${boardId}-${mode}-${size}`; // 영구 저장 키 (참고용으로만 유지)

  // {id, sigName, sigCount, owner, images, counts, imageIndex, imageUrl, isSpecial?}
  const [cells, setCells] = useState([]);
  const [logs, setLogs] = useState([]);
  const [lineOwners, setLineOwners] = useState(() =>
    makeLines(5).map(() => ({ owner: null }))
  );
  const [playerColors, setPlayerColors] = useState({});
  const [modeStates, setModeStates] = useState({});

  // 팔레트 셔플
  const [shuffledPalette] = useState(() => {
    const arr = [...PLAYER_COLOR_PALETTE];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  // 닉네임 → 색상
  const getColorForPlayer = (name) => {
    if (!name) return null;
    if (playerColors[name]) return playerColors[name];

    const used = new Set(Object.values(playerColors));
    const unused = shuffledPalette.filter((c) => !used.has(c));

    let color;
    if (unused.length > 0) {
      color = unused[0];
    } else {
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

  // 줄 소유권 재계산
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

  // Firestore 저장: 현재 상태 기준
  const sync = useCallback(
    async (overrideState) => {
      const stateToSave =
        overrideState ??
        {
          cells,
          logs,
          lineOwners,
          playerColors,
        };

      try {
        await saveSigHunterBingoState(boardId, mode, size, stateToSave);
      } catch (e) {
        console.error("saveSigHunterBingoState failed", e);
      }
    },
    [boardId, mode, size, cells, logs, lineOwners, playerColors]
  );

  // 최초/모드/사이즈 변경 시 로드
  useEffect(() => {
    let alive = true;

    async function init() {
      setLoading(true);

      const stored = await loadSigHunterBingoState(boardId, mode, size);

      const initCells = getInitialHunterCells(mode, size);
      const initLineOwners = lines.map(() => ({ owner: null }));

      // cells 서브컬렉션에서 이미지 URL 로딩
      const cellDocs = await loadAllCells(boardId, mode, size);
      const imageUrlByIndex = {};
      cellDocs.forEach((doc) => {
        const idx = Number(doc.id);
        if (!Number.isNaN(idx)) {
          imageUrlByIndex[idx] = doc.imageUrl || null;
        }
      });

      if (!alive) return;

      if (stored) {
        let nextCells;
        if (Array.isArray(stored.cells) && stored.cells.length === cellCount) {
          nextCells = stored.cells.map((c, idx) => {
            const base = initCells[idx];
            const merged = {
              ...base,
              ...c,
              images:
                c.images && Array.isArray(c.images) ? c.images : base.images,
              counts:
                c.counts && Array.isArray(c.counts) ? c.counts : base.counts,
              imageIndex:
                typeof c.imageIndex === "number" ? c.imageIndex : 0,
              isSpecial:
                typeof c.isSpecial === "boolean"
                  ? c.isSpecial
                  : base.isSpecial ?? false,
            };

            if (imageUrlByIndex[idx]) {
              merged.imageUrl = imageUrlByIndex[idx];
            }

            return merged;
          });
        } else {
          nextCells = initCells.map((base, idx) => ({
            ...base,
            imageUrl: imageUrlByIndex[idx] || null,
          }));
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
        const nextCells = initCells.map((base, idx) => ({
          ...base,
          imageUrl: imageUrlByIndex[idx] || null,
        }));

        setCells(nextCells);
        setLogs([]);
        setLineOwners(initLineOwners);
        setPlayerColors({});

        setModeStates((prev) => ({
          ...prev,
          [stateKey]: {
            cells: nextCells,
            logs: [],
            lineOwners: initLineOwners,
            playerColors: {},
          },
        }));

        await saveSigHunterBingoState(boardId, mode, size, {
          cells: nextCells,
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
  }, [boardId, mode, size, cellCount, lines, stateKey, storageKey]);

  // 모드 변경
  const handleChangeMode = (nextMode) => {
    if (mode === nextMode) return;

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

      sync({
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

      sync({
        cells: initCells,
        logs: [],
        lineOwners: initLineOwners,
        playerColors: {},
      });
    }
  };

  // 사이즈 변경
  const handleChangeSize = (nextSize) => {
    if (size === nextSize) return;

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

      sync({
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

      sync({
        cells: initCells,
        logs: [],
        lineOwners: initLineOwners,
        playerColors: {},
      });
    }
  };

  // 현재 모드/사이즈 초기화
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

    sync({
      cells: initCells,
      logs: [],
      lineOwners: initLineOwners,
      playerColors: {},
    });
  };

  // 현재 이미지: 로컬 경로는 toStorageUrl로 변환
  const getCurrentImage = (cell) => {
    // 1) Firestore에 완성 URL(https://...) 이 저장된 경우 → 그대로 사용
    if (cell?.imageUrl?.startsWith("https://")) {
      console.log("[SIG] full url from Firestore =", cell.imageUrl);
      return cell.imageUrl;
    }

    // 2) Firestore에 상대 경로(/images/..., sigHunterBingo/...)인 경우 → toStorageUrl
    if (cell?.imageUrl) {
      const url = toStorageUrl(cell.imageUrl);
      console.log("[SIG] from imageUrl via toStorageUrl =", {
        src: url,
        imageUrl: cell.imageUrl,
      });
      return url;
    }

    // 3) fallback: 초기 데이터의 images 배열
    if (!cell?.images || cell.images.length === 0) {
      console.log("[SIG] no image for cell", cell);
      return null;
    }

    const idx =
      typeof cell.imageIndex === "number"
        ? cell.imageIndex % cell.images.length
        : 0;

    const url = toStorageUrl(cell.images[idx]);
    console.log("[SIG] from images[] via toStorageUrl =", {
      src: url,
      image: cell.images[idx],
    });
    return url;
  };

  const getCurrentCount = (cell) => {
    if (cell?.counts && cell.counts.length > 0) {
      const idx =
        typeof cell.imageIndex === "number"
          ? cell.imageIndex % cell.counts.length
          : 0;
      const value = cell.counts[idx];
      if (value != null) return value;
    }
    return cell.sigCount ?? 0;
  };

  // 보드 페이지: 칸 클릭(점령/쟁탈)
  const handleClickCell = (cellId, actorRaw) => {
    const actor = actorRaw?.trim();
    if (!actor) {
      alert("닉네임을 먼저 입력해 주세요.");
      return;
    }

    setCells((prevCells) => {
      const nextCells = prevCells.map((c) => ({ ...c }));
      let cell = nextCells[cellId];
      if (!cell) return prevCells;

      const prevOwner = cell.owner;

      const newCellBase = createRandomHunterCell(mode, size, cellId);

      cell = Object.assign(cell, {
        sigName: newCellBase.sigName,
        sigCount: newCellBase.sigCount,
        images: newCellBase.images,
        counts: newCellBase.counts,
        imageIndex: newCellBase.imageIndex,
        owner: actor,
        isSpecial: newCellBase.isSpecial ?? false,
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

        sync({
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

  return {
    // 상태
    loading,
    mode,
    size,
    cellCount,
    lines,
    cells,
    logs,
    lineOwners,
    playerColors,
    completedLineCount,
    // 상수
    HUNTER_MODES,
    AVAILABLE_SIZES,
    // 액션
    setMode,
    setSize,
    setCells,
    setLogs,
    setLineOwners,
    setPlayerColors,
    handleChangeMode,
    handleChangeSize,
    handleResetBoard,
    handleClickCell,
    getCurrentImage,
    getCurrentCount,
    getColorForPlayer,
  };
}