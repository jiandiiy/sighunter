// src/components/GameCenter/SigHunterBingo/useSigHunterBingoState.js

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getInitialHunterCells,
  HUNTER_MODES,
  createRandomHunterCell,
  loadSigHunterBingoState,
  saveSigHunterBingoState,
  loadAllCells,
} from "../../../shared/api";
import { toStorageUrl } from "../../../shared/utils";
import { getSigCountFromPool } from "../../../shared/utils";

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

// ✅ URL 쿼리에서 초기 mode 읽기 (없으면 "muse")
const getInitialMode = () => {
  const params = new URLSearchParams(window.location.search);
  const m = params.get("mode");
  return ["muse", "queendom", "holic"].includes(m) ? m : "muse";
};

// ✅ URL 쿼리에서 초기 size 읽기 (없으면 5)
const getInitialSize = () => {
  const params = new URLSearchParams(window.location.search);
  const s = Number(params.get("size"));
  return [3, 5].includes(s) ? s : 5;
};

// 🔹 라운드 ID 생성
const createNewRoundId = () => {
  return "round_" + Date.now();
};

export function useSigHunterBingoState(boardId = "hunter1", options = {}) {
  const { allPlayers = [], program, group } = options;

  const [loading, setLoading] = useState(true);

  // 모드 / 사이즈 — ✅ 초기값을 URL 쿼리에서 읽음
  const [mode, setMode] = useState(getInitialMode); // "muse" | "queendom" | "holic"
  const [size, setSize] = useState(getInitialSize); // 3 | 5

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

  // 🔹 판 상태 + 라운드 ID
  const [status, setStatus] = useState("ready"); // "ready" | "playing" | "finished"
  const [gameRoundId, setGameRoundId] = useState(() => createNewRoundId());

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

  // 🔹 플레이어별 점령 칸 수
  const playerTerritoryCounts = useMemo(() => {
    const counts = {};
    cells.forEach((cell) => {
      if (!cell.owner) return;
      if (!counts[cell.owner]) counts[cell.owner] = 0;
      counts[cell.owner] += 1;
    });
    return counts;
  }, [cells]);

  // 🔹 플레이어별 참여 횟수
  const playerParticipationCounts = useMemo(() => {
    const counts = {};
    logs.forEach((log) => {
      if (!log.actor) return;
      if (!counts[log.actor]) counts[log.actor] = 0;
      counts[log.actor] += 1;
    });
    return counts;
  }, [logs]);

  // 🔹 MVP 후보
  const mvpCandidate = useMemo(() => {
    const entries = Object.entries(playerParticipationCounts);
    if (entries.length === 0) return null;
    const [topPlayer, topCount] = entries.sort((a, b) => b[1] - a[1])[0];
    return { player: topPlayer, count: topCount };
  }, [playerParticipationCounts]);

  // 🔹 이번 판 참여자
  const participants = useMemo(() => {
    const set = new Set();
    logs.forEach((log) => {
      if (log.actor) set.add(log.actor.trim());
    });
    return Array.from(set).filter(Boolean).sort();
  }, [logs]);

  // 🔹 전체 인원(allPlayers) 기반 미참여자 계산 (trim 포함)
  const nonParticipants = useMemo(() => {
    if (!allPlayers || allPlayers.length === 0) return [];
    const pSet = new Set(participants.map((p) => p.trim()));
    return allPlayers
      .map((n) => (n || "").trim())
      .filter((name) => name && !pSet.has(name));
  }, [allPlayers, participants]);

  // 🔹 승자(최다 점령자)
  const winner = useMemo(() => {
    const entries = Object.entries(playerTerritoryCounts);
    if (entries.length === 0) return null;
    const [topPlayer, topCount] = entries.sort((a, b) => b[1] - a[1])[0];
    return { player: topPlayer, count: topCount };
  }, [playerTerritoryCounts]);

  // 🔹 보드 꽉 찼는지 (완판)
  const isBoardFull = useMemo(() => {
    return cells.length > 0 && cells.every((cell) => !!cell.owner);
  }, [cells]);

  // Firestore 저장: 현재 상태 기준
  const sync = useCallback(
    async (overrideState, overrideMode, overrideSize) => {
      const stateToSave =
        overrideState ??
        {
          cells,
          logs,
          lineOwners,
          playerColors,
        };

      const targetMode = overrideMode ?? mode;
      const targetSize = overrideSize ?? size;

      try {
        await saveSigHunterBingoState(
          boardId,
          targetMode,
          targetSize,
          stateToSave
        );
      } catch (e) {
        console.error("saveSigHunterBingoState failed", e);
      }
    },
    [boardId, mode, size, cells, logs, lineOwners, playerColors]
  );

  // 🔹 라운드 요약 Firestore 저장용 (지금은 console.log만)
  const saveRoundResult = useCallback(async () => {
    const roundSummary = {
      boardId,
      roundId: gameRoundId,
      timestamp: Date.now(),
      mode,
      program: program ?? null,
      group: group ?? null,
      size,
      participants,
      mvpCandidate,
      winner,
      nonParticipants,
      rawLogs: logs,
    };

    try {
      console.log("[HUNTER] round saved:", roundSummary);
    } catch (err) {
      console.error("[HUNTER] failed to save round:", err);
    }

    return roundSummary;
  }, [
    boardId,
    gameRoundId,
    mode,
    program,
    group,
    size,
    participants,
    mvpCandidate,
    winner,
    nonParticipants,
    logs,
  ]);

  // 최초/모드/사이즈 변경 시 로드
  useEffect(() => {
    let alive = true;

    async function init() {
      setLoading(true);

      let nextCells;

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
              const url = imageUrlByIndex[idx];
              const isValid =
                url.startsWith("https://") &&
                url.includes("sig-hunter%2Fimages%2F");
              if (isValid) {
                merged.imageUrl = url;
              }
            }

            const hasImage =
              merged.imageUrl ||
              (Array.isArray(merged.images) && merged.images.length > 0);

            if (!hasImage) {
              const fresh = createRandomHunterCell(mode, size, idx);
              merged.images = fresh.images;
              merged.counts = fresh.counts;
              merged.imageIndex = fresh.imageIndex;
            }

            return merged;
          });
        } else {
          nextCells = initCells.map((base, idx) => {
            const cell = { ...base };

            if (imageUrlByIndex[idx]) {
              cell.imageUrl = imageUrlByIndex[idx];
            }

            const hasImage =
              cell.imageUrl ||
              (Array.isArray(cell.images) && cell.images.length > 0);

            if (!hasImage) {
              const fresh = createRandomHunterCell(mode, size, idx);
              cell.images = fresh.images;
              cell.counts = fresh.counts;
              cell.imageIndex = fresh.imageIndex;
            }

            return cell;
          });
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
      } else {
        nextCells = initCells.map((base, idx) => {
          const cell = { ...base };

          if (imageUrlByIndex[idx]) {
            cell.imageUrl = imageUrlByIndex[idx];
          }

          const hasImage =
            cell.imageUrl ||
            (Array.isArray(cell.images) && cell.images.length > 0);

          if (!hasImage) {
            const fresh = createRandomHunterCell(mode, size, idx);
            cell.images = fresh.images;
            cell.counts = fresh.counts;
            cell.imageIndex = fresh.imageIndex;
          }

          return cell;
        });

        setCells(nextCells);
        setLogs([]);
        setLineOwners(initLineOwners);
        setPlayerColors({});

        await saveSigHunterBingoState(boardId, mode, size, {
          cells: nextCells,
          logs: [],
          lineOwners: initLineOwners,
          playerColors: {},
        });
      }

      console.log("=== CELLS imageUrl 체크 ===");
      nextCells.forEach((c, i) => {
        console.log(
          i,
          c.id,
          c.imageUrl ? "✅" : "❌ EMPTY",
          c.imageUrl?.slice(0, 60)
        );
      });

      console.log(
        "=== index 4 상세 ===",
        JSON.stringify(nextCells[4], null, 2)
      );

      if (!alive) return;
      setLoading(false);

      // 모드/사이즈 바뀌면 새 라운드로 보는 게 자연스럽다
      setStatus("ready");
      setGameRoundId(createNewRoundId());
    }

    init();
    return () => {
      alive = false;
    };
  }, [boardId, mode, size, cellCount, lines, stateKey, storageKey]);

  // 모드 변경
  const handleChangeMode = (nextMode) => {
    if (mode === nextMode) return;

    const params = new URLSearchParams(window.location.search);
    params.set("mode", nextMode);
    window.history.replaceState(null, "", "?" + params.toString());

    setMode(nextMode);
  };

  // 사이즈 변경
  const handleChangeSize = (nextSize) => {
    if (size === nextSize) return;

    const params = new URLSearchParams(window.location.search);
    params.set("size", nextSize);
    window.history.replaceState(null, "", "?" + params.toString());

    setSize(nextSize);
  };

  // 현재 모드/사이즈 초기화
  const handleResetBoard = () => {
    const initCells = getInitialHunterCells(mode, size);
    const initLineOwners = lines.map(() => ({ owner: null }));

    setCells(initCells);
    setLogs([]);
    setLineOwners(initLineOwners);
    setPlayerColors({});
    setStatus("ready");
    setGameRoundId(createNewRoundId());

    sync({
      cells: initCells,
      logs: [],
      lineOwners: initLineOwners,
      playerColors: {},
    });
  };

  const getCurrentImage = (cell) => {
    // 1) Firestore에 저장된 완전한 download URL (https) 이 있으면 그대로 사용
    if (cell?.imageUrl?.startsWith("https://")) {
      return cell.imageUrl;
    }

    // 2) imageUrl 이 있는데 절대 URL은 아니면, 이건 storagePath 로 간주 → toStorageUrl
    if (cell?.imageUrl && !cell.imageUrl.startsWith("http")) {
      return toStorageUrl(cell.imageUrl);
    }

    // 3) 과거 image pool 기반 (public/images) — 백업 용도
    if (!cell?.images || cell.images.length === 0) {
      console.warn("[SIG] no image for cell", cell?.id);
      return null;
    }

    const idx =
      typeof cell.imageIndex === "number"
        ? cell.imageIndex % cell.images.length
        : 0;

    const raw = cell.images[idx];
    const imagePath = typeof raw === "string" ? raw : raw?.path ?? null;

    if (!imagePath) {
      console.warn(
        "[SIG] images[idx] has no valid path — raw:",
        raw,
        "cell:",
        cell?.id
      );
      return null;
    }

    if (imagePath.startsWith("/images/")) {
       return toStorageUrl(imagePath);
    }

    return toStorageUrl(imagePath);
  };

  const getCurrentCount = (cell) => {
    let imagePath = null;

    if (cell?.imageUrl) {
      imagePath = cell.imageUrl;
    } else if (cell?.images && cell.images.length > 0) {
      const idx =
        typeof cell.imageIndex === "number"
          ? cell.imageIndex % cell.images.length
          : 0;
      const raw = cell.images[idx];
      const path = typeof raw === "string" ? raw : raw?.path ?? null;
      imagePath = path;
    }

    const mapped = getSigCountFromPool(imagePath);

    if (mapped != null) {
      return mapped;
    }

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

  // 보드 페이지: 칸 클릭(점령/쟁탈) - 원본
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

  // 🔹 진행 상태를 고려한 안전 래퍼 (상위 컴포넌트에서 사용)
  const safeHandleClickCell = (cellId, actorRaw) => {
    if (status === "finished") {
      return;
    }
    if (status === "ready") {
      setStatus("playing");
    }
    handleClickCell(cellId, actorRaw);
  };

  const completedLineCount = lineOwners.filter((l) => !!l.owner).length;

  // 🔹 5x5 완판 감지 후 콜백 호출 (상위에서 배너 띄우기용)
  const handleBoardAutoComplete = useCallback(
    async (onBoardCompleted) => {
      if (!isBoardFull) return;
      if (status === "finished") return;

      setStatus("finished");

      const summary = await saveRoundResult();
      if (typeof onBoardCompleted === "function") {
        onBoardCompleted(summary);
      }
    },
    [isBoardFull, status, saveRoundResult]
  );

  // 🔹 다음 판 시작 (현재 설정 유지)
  const startNextRound = useCallback(() => {
    const initCells = getInitialHunterCells(mode, size);
    const initLineOwners = lines.map(() => ({ owner: null }));

    setCells(initCells);
    setLogs([]);
    setLineOwners(initLineOwners);
    setPlayerColors({});
    setStatus("ready");
    setGameRoundId(createNewRoundId());

    sync({
      cells: initCells,
      logs: [],
      lineOwners: initLineOwners,
      playerColors: {},
    });
  }, [mode, size, lines, sync]);

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
    status,
    gameRoundId,
    participants,
    mvpCandidate,
    nonParticipants,
    winner,
    isBoardFull,

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
    setStatus,
    handleChangeMode,
    handleChangeSize,
    handleResetBoard,
    handleClickCell,      // 원본
    safeHandleClickCell,  // 상태 반영된 버전
    getCurrentImage,
    getCurrentCount,
    getColorForPlayer,
    saveRoundResult,
    startNextRound,
    handleBoardAutoComplete,
  };
}