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

export function useSigHunterBingoState(boardId = "hunter1") {
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
  // ✅ modeStates 제거 — 현재 읽는 곳 없음. 캐시 최적화 시 useRef로 재도입 예정

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
  // ✅ overrideMode, overrideSize 추가 — 클로저로 이전 mode/size가 캡처되는 버그 방지
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

      const targetMode = overrideMode ?? mode; // ✅ 명시적으로 받아서 사용
      const targetSize = overrideSize ?? size; // ✅ 명시적으로 받아서 사용

      try {
        await saveSigHunterBingoState(boardId, targetMode, targetSize, stateToSave);
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

      let nextCells; // ← 스코프 최상단에 선언 (if/else 모두 공유)

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
        // ← let nextCells 제거, 상단 선언 변수 사용
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

            // ✅ 수정 (유효한 URL만 주입)
            if (imageUrlByIndex[idx]) {
              const url = imageUrlByIndex[idx];
              const isValid =
                url.startsWith("https://") && url.includes("sig-hunter%2Fimages%2F");
              if (isValid) {
                merged.imageUrl = url;
              }
            }

            // ✅ 이미지 없으면 랜덤 보충 (관리 페이지 없이도 이미지 표시)
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

            // ✅ 이미지 없으면 랜덤 보충 (방어 코드)
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
        // ✅ setModeStates 제거
      } else {
        // ← const nextCells 제거, 상단 선언 변수 사용
        nextCells = initCells.map((base, idx) => {
          const cell = { ...base };

          if (imageUrlByIndex[idx]) {
            cell.imageUrl = imageUrlByIndex[idx];
          }

          // ✅ 이미지 없으면 랜덤 보충 (방어 코드)
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
        // ✅ setModeStates 제거

        await saveSigHunterBingoState(boardId, mode, size, {
          cells: nextCells,
          logs: [],
          lineOwners: initLineOwners,
          playerColors: {},
        });
      }

      // 임시 디버그 ← 확인 후 삭제
      console.log("=== CELLS imageUrl 체크 ===");
      nextCells.forEach((c, i) => {
        console.log(i, c.id, c.imageUrl ? "✅" : "❌ EMPTY", c.imageUrl?.slice(0, 60));
      });

      // ✅ 추가: index 4 상세 확인 ← 확인 후 삭제
console.log("=== index 4 상세 ===", JSON.stringify(nextCells[4], null, 2));

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

    // ✅ URL 쿼리 동기화 (replaceState: 히스토리 쌓지 않음)
    const params = new URLSearchParams(window.location.search);
    params.set("mode", nextMode);
    window.history.replaceState(null, "", "?" + params.toString());

    // ✅ setMode만 호출 — useEffect가 Firestore 로드 및 setCells를 처리함
    // ✅ 여기서 setCells / sync를 직접 호출하지 않음 (클로저 버그 + 덮어쓰기 방지)
    // ✅ setModeStates 제거 — 캐시 최적화 시 useRef로 재도입 예정
    setMode(nextMode);
  };

  // 사이즈 변경
  const handleChangeSize = (nextSize) => {
    if (size === nextSize) return;

    // ✅ URL 쿼리 동기화 (replaceState: 히스토리 쌓지 않음)
    const params = new URLSearchParams(window.location.search);
    params.set("size", nextSize);
    window.history.replaceState(null, "", "?" + params.toString());

    // ✅ setSize만 호출 — useEffect가 Firestore 로드 및 setCells를 처리함
    // ✅ 여기서 setCells / sync를 직접 호출하지 않음 (클로저 버그 + 덮어쓰기 방지)
    // ✅ setModeStates 제거 — 캐시 최적화 시 useRef로 재도입 예정
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
    // ✅ setModeStates 제거

    sync({
      cells: initCells,
      logs: [],
      lineOwners: initLineOwners,
      playerColors: {},
    });
  };

  const getCurrentImage = (cell) => {
    if (cell?.imageUrl?.startsWith("https://")) {
      // ✅ 올바른 경로만 통과: "sig-hunter/images/" 포함 여부로 판단
      // ❌ "sigHunterBingo/hunter-main-..." 패턴은 fallback으로 떨어짐
      if (cell.imageUrl.includes("sig-hunter%2Fimages%2F")) {
        return cell.imageUrl;
      }
      // 잘못된 URL → 아래 fallback으로 계속 진행
    }

    // 상대경로 imageUrl → toStorageUrl 변환
    if (cell?.imageUrl) {
      return toStorageUrl(cell.imageUrl);
    }

    // fallback: images[] 배열 (로컬 public 경로 → toStorageUrl)
    if (!cell?.images || cell.images.length === 0) {
      console.warn("[SIG] no image for cell", cell?.id);
      return null;
    }

    const idx =
      typeof cell.imageIndex === "number"
        ? cell.imageIndex % cell.images.length
        : 0;

    return toStorageUrl(cell.images[idx]);
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

        // ✅ setModeStates 제거

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