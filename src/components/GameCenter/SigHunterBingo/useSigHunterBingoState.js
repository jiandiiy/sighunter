// src/components/GameCenter/SigHunterBingo/useSigHunterBingoState.js

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getInitialHunterCells,
  HUNTER_MODES,
  createRandomHunterCell,
} from "../../../utils/sigHunterBingoData";
import {
  loadSigHunterBingoState,
  saveSigHunterBingoState,
} from "../../../api/sigHunterBingoApi";
import {
  loadAllCells,
  updateCell as updateCellDoc,
} from "../../../api/sigHunterBingoCellsApi";
import { uploadCellImage } from "../../../api/sigHunterBingoStorage";

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
  const [mode, setMode] = useState("muse"); // "muse" | "queendom"
  const [size, setSize] = useState(5); // 3 | 5

  const cellCount = size * size;
  const lines = useMemo(() => makeLines(size), [size]);

  const stateKey = `${mode}-${size}`; // 메모리 내 모드별 상태 키
  const storageKey = `${boardId}-${mode}-${size}`; // 영구 저장 키

  // {id, sigName, sigCount, owner, images, counts, imageIndex, imageUrl, isSpecial?}
  const [cells, setCells] = useState([]);
  const [logs, setLogs] = useState([]);
  const [lineOwners, setLineOwners] = useState(() =>
    makeLines(5).map(() => ({ owner: null }))
  );
  const [playerColors, setPlayerColors] = useState({});
  const [modeStates, setModeStates] = useState({});

  // 셀별 파일 input 참조 (설정 페이지에서 사용)
  const fileInputRefs = useRef({});

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

  // Firestore 저장
  const sync = (key, nextState) => {
    saveSigHunterBingoState(key, nextState).catch((e) =>
      console.error("saveSigHunterBingoState failed", e)
    );
  };

  // 최초/모드/사이즈 변경 시 로드
  useEffect(() => {
    let alive = true;

    async function init() {
      setLoading(true);

      const stored = await loadSigHunterBingoState(storageKey);

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
              // isSpecial 이 있으면 그대로 유지 (없으면 base 것 사용)
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

        await saveSigHunterBingoState(storageKey, {
          mode,
          size,
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
  }, [storageKey, mode, size, cellCount, lines, stateKey, boardId]);

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

    sync(storageKey, {
      mode,
      size,
      cells: initCells,
      logs: [],
      lineOwners: initLineOwners,
      playerColors: {},
    });
  };

  // 현재 이미지 / 카운트
  const getCurrentImage = (cell) => {
    if (cell?.imageUrl) return cell.imageUrl;

    if (!cell?.images || cell.images.length === 0) return null;
    const idx =
      typeof cell.imageIndex === "number"
        ? cell.imageIndex % cell.images.length
        : 0;
    return cell.images[idx];
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

  // 설정 페이지: 셀 이미지 변경 (Storage + Firestore)
  const handleChangeCellImage = async (e, cellId) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const input = window.prompt(
        "이 이미지의 시그 개수를 입력하세요 (숫자만, 생략 가능)",
        ""
      );
      const parsed = input != null ? parseInt(input, 10) : null;
      const sigCount = Number.isFinite(parsed) ? parsed : null;

      const url = await uploadCellImage(
        boardId,
        mode,
        size,
        String(cellId),
        file
      );

      await updateCellDoc(boardId, mode, size, String(cellId), {
        imageUrl: url,
        ...(sigCount != null ? { sigCount } : {}),
      });

      setCells((prev) => {
        const next = prev.map((c, idx) => {
          if (idx !== cellId) return c;
          const updated = { ...c, imageUrl: url };
          if (sigCount != null) updated.sigCount = sigCount;
          return updated;
        });

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
    } catch (err) {
      console.error("handleChangeCellImage error", err);
      alert("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      e.target.value = "";
    }
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

      // 기본 랜덤 셀 생성 (sigHunterBingoData 에 정의된 규칙 사용)
      const newCellBase = createRandomHunterCell(mode, size, cellId);

      cell = Object.assign(cell, {
        sigName: newCellBase.sigName,
        sigCount: newCellBase.sigCount,
        images: newCellBase.images,
        counts: newCellBase.counts,
        imageIndex: newCellBase.imageIndex,
        owner: actor,
        // 🔹 스페셜 여부가 정의돼 있다면 함께 반영
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
    fileInputRefs,
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
    handleChangeCellImage,
    handleClickCell,
    getCurrentImage,
    getCurrentCount,
    getColorForPlayer,
  };
}