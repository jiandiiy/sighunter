// src/components/GameCenter/BoardGame/BoardGame.jsx
import React, { useState, useMemo, useCallback, useEffect } from "react";
import Board from "./Board";
import ControlPanel from "./ControlPanel";
import Toast from "./Toast";
import {
  TOKEN_COLORS,
  makeDefaultCellTexts,
  makeDefaultCellStyles,
  makeToken,
} from "../lib/constants";
import { useDice } from "../../../../shared/hooks/common/useDice";
import { useBoardEffects } from "../../../../shared/hooks";

const STORAGE_KEY = "boardGameState_v1";

export default function BoardGame() {
  // 7x7 고정
  const [rows, setRows] = useState(7);
  const [cols, setCols] = useState(7);

  // 둘레(칸 수) = 24 (7x7 기준)
  const perimeter = useMemo(() => {
    if (rows < 2 || cols < 2) return 0;
    return 2 * (rows + cols) - 4;
  }, [rows, cols]);

  // 초기 토큰 생성 함수
  const createInitialTokens = useCallback(() => {
    return Array.from({ length: 4 }, (_, i) =>
      makeToken(i + 1, `BJ${i + 1}`, TOKEN_COLORS[i % TOKEN_COLORS.length])
    ).map((t) => ({ ...t, skipTurns: 0 }));
  }, []);

  // =========================
  // 1. 상태 정의
  // =========================

  const [cells, setCells] = useState(() =>
    perimeter > 0 ? makeDefaultCellTexts(perimeter) : []
  );
  const [cellStyles, setCellStyles] = useState(() =>
    perimeter > 0 ? makeDefaultCellStyles(perimeter) : []
  );

  const [tokens, setTokens] = useState(() => createInitialTokens());
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [diceTarget, setDiceTarget] = useState("turn");

  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [moveSteps, setMoveSteps] = useState(1);
  const [isMoving, setIsMoving] = useState(false);

  const [tokenNameEdit, setTokenNameEdit] = useState("");

  const [selectedCellIndex, setSelectedCellIndex] = useState(null);
  const [panelCellText, setPanelCellText] = useState("");
  const [panelCellStyle, setPanelCellStyle] = useState({
    fontSize: 12,
    fontWeight: 600,
    color: "#f9fafb",
  });

  // 무인도 오버레이 (주사위 위 알림)
  const [prisonOverlay, setPrisonOverlay] = useState(null);
  // { tokenName, turns } | null

  // ✅ 세계여행/우주여행 목적지 선택 모드
  const [travelSelect, setTravelSelect] = useState(null);
  // { tokenId: number, type: 'world' | 'space' } | null

  const selectedToken =
    tokens.find((t) => t.id === selectedTokenId) || null;
  const currentTurnToken = tokens[currentTurnIndex] || null;

  const {
    toast,
    scoreChange,
    logs,
    lastLandedIndex,
    applyCellEffect,
    resetBoardEffects,
    attachGoodAudioRef,
    attachBadAudioRef,
    setToast,
  } = useBoardEffects({ cells });

  // =========================
  // 2. localStorage 복원
  // =========================

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // 초기값 세팅
        const initTokens = createInitialTokens();
        setTokens(initTokens);
        setSelectedTokenId(initTokens[0]?.id ?? null);
        setTokenNameEdit(initTokens[0]?.name ?? "");
        setCells(makeDefaultCellTexts(24));
        setCellStyles(makeDefaultCellStyles(24));
        return;
      }

      const saved = JSON.parse(raw);

      const savedCells = Array.isArray(saved.cells)
        ? saved.cells
        : makeDefaultCellTexts(24);
      const savedStyles = Array.isArray(saved.cellStyles)
        ? saved.cellStyles
        : makeDefaultCellStyles(24);
      const savedTokens = Array.isArray(saved.tokens)
        ? saved.tokens
        : createInitialTokens();

      setCells(savedCells);
      setCellStyles(savedStyles);
      setTokens(savedTokens);

      setSelectedTokenId(
        saved.selectedTokenId ?? savedTokens[0]?.id ?? null
      );
      setDiceTarget(saved.diceTarget || "turn");
      setCurrentTurnIndex(
        typeof saved.currentTurnIndex === "number"
          ? saved.currentTurnIndex
          : 0
      );
      setMoveSteps(
        typeof saved.moveSteps === "number" ? saved.moveSteps : 1
      );
      setSelectedCellIndex(
        typeof saved.selectedCellIndex === "number"
          ? saved.selectedCellIndex
          : null
      );
      setPanelCellText(saved.panelCellText || "");
      setPanelCellStyle(
        saved.panelCellStyle || {
          fontSize: 12,
          fontWeight: 600,
          color: "#f9fafb",
        }
      );

      const firstToken =
        savedTokens.find((t) => t.id === saved.selectedTokenId) ||
        savedTokens[0] ||
        null;
      setTokenNameEdit(firstToken?.name ?? "");
    } catch (e) {
      console.error("보드 상태 복원 실패:", e);
      const initTokens = createInitialTokens();
      setTokens(initTokens);
      setSelectedTokenId(initTokens[0]?.id ?? null);
      setTokenNameEdit(initTokens[0]?.name ?? "");
      setCells(makeDefaultCellTexts(24));
      setCellStyles(makeDefaultCellStyles(24));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 최초 1회만 복원

  // =========================
  // 3. localStorage 저장
  // =========================

  useEffect(() => {
    try {
      const data = {
        cells,
        cellStyles,
        tokens,
        selectedTokenId,
        diceTarget,
        currentTurnIndex,
        moveSteps,
        selectedCellIndex,
        panelCellText,
        panelCellStyle,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("보드 상태 저장 실패:", e);
    }
  }, [
    cells,
    cellStyles,
    tokens,
    selectedTokenId,
    diceTarget,
    currentTurnIndex,
    moveSteps,
    selectedCellIndex,
    panelCellText,
    panelCellStyle,
  ]);

  // =========================
  // 4. 턴/이동/주사위 로직
  // =========================

  /** 다음 턴으로 이동 + skipTurns 소모 */
  const goToNextTurn = () => {
    setTokens((prevTokens) => {
      if (prevTokens.length === 0) return prevTokens;

      let safety = 0;
      const nextTokens = [...prevTokens];

      let nextIndex =
        (currentTurnIndex + 1 + nextTokens.length) % nextTokens.length;

      while (safety < nextTokens.length * 2) {
        const candidate = nextTokens[nextIndex];

        if (candidate.skipTurns && candidate.skipTurns > 0) {
          // 이 토큰은 이번 턴 스킵, skipTurns -1
          nextTokens[nextIndex] = {
            ...candidate,
            skipTurns: candidate.skipTurns - 1,
          };
          nextIndex = (nextIndex + 1) % nextTokens.length;
          safety += 1;
          continue;
        }

        // skipTurns가 0이면 이 토큰이 다음 턴 주인공
        setCurrentTurnIndex(nextIndex);
        return nextTokens;
      }

      // 모든 토큰이 스킵 상태면 턴은 유지
      return nextTokens;
    });
  };

  /** Board에서 올려주는 칸 도착 콜백 (무인도 등) */
  const handleTokenLand = useCallback(
    (token, cellIndex, info) => {
      console.log("handleTokenLand 호출:", {
        tokenName: token.name,
        cellIndex,
        info,
      });

      if (info?.prisonSkip) {
        console.log("무인도 도착, prisonSkip =", info.prisonSkip);

        // skipTurns 증가
        setTokens((prev) =>
          prev.map((t) =>
            t.id === token.id
              ? {
                  ...t,
                  skipTurns: (t.skipTurns || 0) + info.prisonSkip,
                }
              : t
          )
        );

        const turns =
          typeof info.prisonSkip === "number" ? info.prisonSkip : 0;

        if (typeof setToast === "function") {
          setToast(
            `${token.name} 님이 무인도에 갇혔습니다! (${turns}턴 대기)`
          );
        }

        setPrisonOverlay({
          tokenName: token.name,
          turns,
        });

        setTimeout(() => {
          setPrisonOverlay(null);
        }, 2500);
      }
    },
    [setTokens, setToast]
  );

  /** 텍스트/무인도/세계·우주여행 등, 말이 어떤 칸에 "최종" 도착했을 때 공통 처리 */
  const handleFinalLand = (token, cellIndex, diceValue, options = {}) => {
    const totalCells = perimeter || 24;

    // 1) 텍스트 기반 칸 효과
    applyCellEffect({
      cellIndex,
      token,
      diceValue,
      updateTokens: setTokens,
      boardSize: totalCells,
    });

    // 2) 특수 칸 처리
    if (cellIndex === 6) {
      // 무인도
      handleTokenLand(token, cellIndex, {
        base: { special: "prison" },
        dynamic: null,
        prisonSkip: 2,
      });
    } else if (cellIndex === 12) {
      // 세계여행
      setTravelSelect({ tokenId: token.id, type: "world" });
      setToast?.(
        `${token.name} 님, 세계여행 도착! 이동할 칸을 선택하세요.`
      );
    } else if (cellIndex === 18) {
      // 우주여행
      setTravelSelect({ tokenId: token.id, type: "space" });
      setToast?.(
        `${token.name} 님, 우주여행 도착! 이동할 칸을 선택하세요.`
      );
    }

    // 3) 턴 넘기기
    if (!options.skipTurnAdvance) {
      goToNextTurn();
    }
  };

  /** 토큰 이동 애니메이션 */
  const moveTokenWithAnimation = (token, steps, options = {}) => {
    if (!token) return;
    if (isMoving) return;

    const totalCells = perimeter || 24; // 7x7 기준 24칸
    if (!totalCells) return;

    const intSteps = steps | 0;
    if (intSteps === 0) return;

    const direction = intSteps > 0 ? 1 : -1;
    const totalSteps = Math.abs(intSteps);

    setIsMoving(true);

    let currentPos = token.pos;
    let moved = 0;
    const stepMs = 180;

    const timer = setInterval(() => {
      moved += 1;
      currentPos = (currentPos + direction + totalCells) % totalCells;

      // 말 한 칸씩 이동
      setTokens((prev) =>
        prev.map((t) =>
          t.id === token.id ? { ...t, pos: currentPos } : t
        )
      );

      if (moved >= totalSteps) {
        clearInterval(timer);
        setIsMoving(false);

        // 최종 도착 처리 (텍스트 + 특수칸 + 턴 넘김)
        handleFinalLand(token, currentPos, steps, options);
      }
    }, stepMs);
  };

  /** 주사위 훅 */
  const {
    diceValue,
    isRolling,
    diceRotation3d,
    diceSnapRotation,
    rollDice,
    attachDiceAudioRef,
  } = useDice({
    onRollEnd: (final) => {
      setMoveSteps(final);

      const token =
        diceTarget === "selected" ? selectedToken : currentTurnToken;

      if (token && !isMoving) {
        moveTokenWithAnimation(token, final);
      }
    },
  });

  /** 보드 칸 클릭 */
  const handleClickCell = (index) => {
    // 패널 선택/수정 용도
    setSelectedCellIndex(index);
    setPanelCellText(cells[index] || "");
    setPanelCellStyle(
      cellStyles[index] || {
        fontSize: 12,
        fontWeight: 600,
        color: "#f9fafb",
      }
    );

    // ✅ 세계여행/우주여행 목적지 선택 모드일 때는 이동 처리
    if (!travelSelect) return;

    const targetToken = tokens.find(
      (t) => t.id === travelSelect.tokenId
    );
    if (!targetToken) {
      setTravelSelect(null);
      return;
    }

    const totalCells = perimeter || 24;
    const targetIndex = ((index % totalCells) + totalCells) % totalCells;

    // 토큰 위치를 선택한 칸으로 순간 이동
    setTokens((prev) =>
      prev.map((t) =>
        t.id === targetToken.id ? { ...t, pos: targetIndex } : t
      )
    );

    // 선택한 칸 효과 적용 + 무인도/세계·우주여행(재도착) 처리
    // 여기서는 "직행"이므로 diceValue는 0으로 둬도 됨
    handleFinalLand(
      { ...targetToken, pos: targetIndex },
      targetIndex,
      0,
      {
        // 목적지 선택 후에는 같은 턴에서 다시 턴 넘김을 할지 말지는 취향
        // 여기서는 턴 즉시 넘기도록 false (기본값) 유지
        skipTurnAdvance: false,
      }
    );

    setTravelSelect(null);
  };

  /** 보드 크기 변경 */
  const handleResizeBoard = (newRows, newCols) => {
    const r = Math.max(4, Math.min(20, newRows || rows));
    const c = Math.max(4, Math.min(20, newCols || cols));

    setRows(r);
    setCols(c);

    const newPerimeter = 2 * (r + c) - 4;

    setCells(makeDefaultCellTexts(newPerimeter));
    setCellStyles(makeDefaultCellStyles(newPerimeter));

    setTokens((prev) =>
      prev.map((t) => ({ ...t, pos: 0, skipTurns: 0 }))
    );

    setSelectedCellIndex(null);
    setPanelCellText("");
    setPanelCellStyle({
      fontSize: 12,
      fontWeight: 600,
      color: "#f9fafb",
    });

    setTravelSelect(null);
    resetBoardEffects();
  };

  /** 전체 게임 초기화 */
  const handleResetGame = () => {
    const resetTokens = createInitialTokens();

    setTokens(resetTokens);
    setSelectedTokenId(resetTokens[0]?.id ?? null);
    setTokenNameEdit(resetTokens[0]?.name ?? "");

    setCurrentTurnIndex(0);
    setMoveSteps(1);
    setIsMoving(false);

    setSelectedCellIndex(null);
    setPanelCellText("");
    setPanelCellStyle({
      fontSize: 12,
      fontWeight: 600,
      color: "#f9fafb",
    });

    setCells(makeDefaultCellTexts(perimeter || 24));
    setCellStyles(makeDefaultCellStyles(perimeter || 24));

    setPrisonOverlay(null);
    setTravelSelect(null);
    resetBoardEffects();
  };

  /** 말 선택 */
  const handleSelectToken = (id) => {
    if (isMoving || isRolling) return;
    setSelectedTokenId(id);
    const t = tokens.find((tk) => tk.id === id);
    setTokenNameEdit(t?.name ?? "");
  };

  /** 말 이름 변경 */
  const applyTokenNameChange = () => {
    if (!selectedToken) return;
    const newName = tokenNameEdit.trim();
    if (!newName) return;

    setTokens((prev) =>
      prev.map((t) =>
        t.id === selectedToken.id ? { ...t, name: newName } : t
      )
    );
  };

  /** 말 추가 */
  const handleAddToken = () => {
    if (tokens.length >= 18) return;
    const nextId = tokens.length
      ? Math.max(...tokens.map((t) => t.id)) + 1
      : 1;
    const color = TOKEN_COLORS[(nextId - 1) % TOKEN_COLORS.length];
    const baseToken = makeToken(nextId, `BJ${nextId}`, color);
    const newToken = { ...baseToken, skipTurns: 0 };

    const nextTokens = [...tokens, newToken];
    setTokens(nextTokens);
    setSelectedTokenId(newToken.id);
    setTokenNameEdit(newToken.name);
  };

  /** 선택된 말 삭제 */
  const handleRemoveToken = () => {
    if (!selectedToken) return;
    if (tokens.length <= 1) return;

    const nextTokens = tokens.filter((t) => t.id !== selectedToken.id);
    setTokens(nextTokens);

    const newSelected = nextTokens[0] || null;
    setSelectedTokenId(newSelected?.id ?? null);
    setTokenNameEdit(newSelected?.name ?? "");
    setCurrentTurnIndex(0);
  };

  /** 선택된 칸 내용/스타일 저장 */
  const applyPanelCellChange = () => {
    if (selectedCellIndex === null) return;

    const idx = selectedCellIndex;
    const nextCells = [...cells];
    nextCells[idx] = panelCellText;

    const nextStyles = [...cellStyles];
    nextStyles[idx] = { ...panelCellStyle };

    setCells(nextCells);
    setCellStyles(nextStyles);
  };

  /** 직접 이동 버튼 */
  const moveSelectedToken = (steps) => {
    const token = selectedToken;
    if (!token) return;
    moveTokenWithAnimation(token, steps);
  };

  /** 중앙 주사위 굴리기 */
  const rollDiceAndMove = () => {
    const token =
      diceTarget === "selected" ? selectedToken : currentTurnToken;

    if (!token) return;
    if (isRolling || isMoving) return;

    if (token.skipTurns && token.skipTurns > 0) {
      setToast(
        `${token.name} 님은 무인도 대기 중이라 이번 턴은 쉬어갑니다.`
      );
      return;
    }

    rollDice();
  };

  // =========================
  // 5. 렌더
  // =========================

  return (
    <>
      <audio
        ref={attachDiceAudioRef}
        src="/sounds/dice-roll.mp3"
        preload="auto"
      />
      <audio
        ref={attachGoodAudioRef}
        src="/sounds/good.mp3"
        preload="auto"
      />
      <audio ref={attachBadAudioRef} src="/sounds/bad.mp3" preload="auto" />

      <div
        style={{
          width: "100%",
          maxWidth: "2000px",
          margin: "0 auto",
          padding: 16,
          boxSizing: "border-box",
          background:
            "radial-gradient(circle at top, #1e1b4b, #020617 55%, #020617 100%)",
          borderRadius: 20,
          border: "1px solid rgba(147,51,234,0.7)",
          boxShadow:
            "0 20px 70px rgba(0,0,0,0.8), 0 0 30px rgba(129,140,248,0.5)",
          display: "flex",
          gap: 16,
          color: "#e5e7eb",
          fontFamily:
            "YUniverse, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* 보드 */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            maxWidth: "min(2000px, 70vw)",
            width: "90%",
          }}
        >
          <Board
            rows={rows}
            cols={cols}
            cells={cells}
            cellStyles={cellStyles}
            tokens={tokens}
            currentTurnToken={currentTurnToken}
            isMoving={isMoving}
            scoreChange={scoreChange}
            lastLandedIndex={lastLandedIndex}
            selectedCellIndex={selectedCellIndex}
            onClickCell={handleClickCell}
            onResizeBoard={handleResizeBoard}
            diceValue={diceValue}
            diceRotation3d={diceRotation3d}
            diceSnapRotation={diceSnapRotation}
            isRolling={isRolling}
            onRollDice={rollDiceAndMove}
            onTokenLand={handleTokenLand}
            prisonOverlay={prisonOverlay}
          />
        </div>

        {/* 컨트롤 패널 */}
        <div style={{ width: 300, flexShrink: 1 }}>
          <ControlPanel
            tokens={tokens}
            selectedToken={selectedToken}
            selectedTokenId={selectedTokenId}
            tokenNameEdit={tokenNameEdit}
            setTokenNameEdit={setTokenNameEdit}
            currentTurnToken={currentTurnToken}
            currentTurnIndex={currentTurnIndex}
            moveSteps={moveSteps}
            setMoveSteps={setMoveSteps}
            diceValue={diceValue}
            isRolling={isRolling}
            isMoving={isMoving}
            logs={logs}
            selectedCellIndex={selectedCellIndex}
            panelCellText={panelCellText}
            setPanelCellText={setPanelCellText}
            panelCellStyle={panelCellStyle}
            setPanelCellStyle={setPanelCellStyle}
            onAddToken={handleAddToken}
            onRemoveToken={handleRemoveToken}
            onSelectToken={handleSelectToken}
            onApplyTokenName={applyTokenNameChange}
            onMoveSelected={moveSelectedToken}
            onApplyCellChange={applyPanelCellChange}
            onResetGame={handleResetGame}
            diceTarget={diceTarget}
            setDiceTarget={setDiceTarget}
          />
        </div>
      </div>

      <Toast message={toast} />
    </>
  );
}