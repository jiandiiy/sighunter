// src/components/GameCenter/BoardGame/BoardGame.jsx
import React, { useState, useMemo } from "react";
import Board from "./Board";
import ControlPanel from "./ControlPanel";
import Toast from "./Toast";
import {
  TOKEN_COLORS,
  makeDefaultCellTexts,
  makeDefaultCellStyles,
  makeToken,
} from "./constants";
import { useDice } from "../../../hooks/useDice";
import { useBoardEffects } from "../../../hooks/useBoardEffects";

export default function BoardGame() {
  // 🔹 보드 크기 (기본 10x10, 변경 가능)
  const [rows, setRows] = useState(9);
  const [cols, setCols] = useState(10);

  // 🔹 현재 rows/cols 기준 둘레 칸 수 (Board 와 동일한 공식)
  const perimeter = useMemo(() => {
    if (rows < 2 || cols < 2) return 0;
    return 2 * (rows + cols) - 4; // 예: 10×10 → 36, 13×13 → 48
  }, [rows, cols]);

  // 칸 텍스트 + 스타일 (perimeter 기준)
  const [cells, setCells] = useState(() =>
    makeDefaultCellTexts(perimeter)
  );
  const [cellStyles, setCellStyles] = useState(() =>
    makeDefaultCellStyles(perimeter)
  );

  // 말 목록
  const initialTokens = Array.from({ length: 4 }, (_, i) =>
    makeToken(i + 1, `BJ${i + 1}`, TOKEN_COLORS[i % TOKEN_COLORS.length])
  );
  const [tokens, setTokens] = useState(initialTokens);
  const [selectedTokenId, setSelectedTokenId] = useState(
    initialTokens[0]?.id ?? null
  );
  const [diceTarget, setDiceTarget] = useState("turn");

  // 턴 시스템
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);

  // 이동 관련
  const [moveSteps, setMoveSteps] = useState(1);
  const [isMoving, setIsMoving] = useState(false);

  // 말 이름 편집
  const [tokenNameEdit, setTokenNameEdit] = useState(
    initialTokens[0]?.name ?? ""
  );

  // 우측 패널에서 수정할 "선택된 칸"
  const [selectedCellIndex, setSelectedCellIndex] = useState(null);
  const [panelCellText, setPanelCellText] = useState("");
  const [panelCellStyle, setPanelCellStyle] = useState({
    fontSize: 12,
    fontWeight: 600,
    color: "#f9fafb",
  });

  // 주사위 훅
  const {
    diceValue,
    isRolling,
    diceRotation,
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

  // 보드 효과 훅
  const {
    toast,
    scoreChange,
    logs,
    lastLandedIndex,
    applyCellEffect,
    resetBoardEffects,
    attachGoodAudioRef,
    attachBadAudioRef,
  } = useBoardEffects({ cells });

  const selectedToken = tokens.find((t) => t.id === selectedTokenId);
  const currentTurnToken = tokens[currentTurnIndex] || null;

  /** 보드 칸 클릭 시: 우측 패널용 선택 칸만 설정 (index는 0~perimeter-1) */
  const handleClickCell = (index) => {
    setSelectedCellIndex(index);
    setPanelCellText(cells[index] || "");
    setPanelCellStyle(
      cellStyles[index] || { fontSize: 12, fontWeight: 600, color: "#f9fafb" }
    );
  };

  /** 보드 크기 변경 */
  const handleResizeBoard = (newRows, newCols) => {
    const r = Math.max(4, Math.min(20, newRows || rows));
    const c = Math.max(4, Math.min(20, newCols || cols));

    setRows(r);
    setCols(c);

    const newPerimeter = 2 * (r + c) - 4;

    // 보드 칸 재초기화
    setCells(makeDefaultCellTexts(newPerimeter));
    setCellStyles(makeDefaultCellStyles(newPerimeter));

    // 말 위치 초기화
    setTokens((prev) => prev.map((t) => ({ ...t, pos: 0 })));

    // 선택 칸 초기화
    setSelectedCellIndex(null);
    setPanelCellText("");
    setPanelCellStyle({
      fontSize: 12,
      fontWeight: 600,
      color: "#f9fafb",
    });

    resetBoardEffects();
  };

  /** 전체 게임 초기화 */
  const handleResetGame = () => {
    // 말 전체 초기화
    const resetTokens = Array.from({ length: 4 }, (_, i) =>
      makeToken(i + 1, `BJ${i + 1}`, TOKEN_COLORS[i % TOKEN_COLORS.length])
    );
    setTokens(resetTokens);
    setSelectedTokenId(resetTokens[0]?.id ?? null);
    setTokenNameEdit(resetTokens[0]?.name ?? "");

    // 턴 / 이동 / 상태
    setCurrentTurnIndex(0);
    setMoveSteps(1);
    setIsMoving(false);

    // 선택 칸/우측 패널
    setSelectedCellIndex(null);
    setPanelCellText("");
    setPanelCellStyle({
      fontSize: 12,
      fontWeight: 600,
      color: "#f9fafb",
    });

    // 보드 내용도 완전히 초기화 (현재 perimeter 기준)
    setCells(makeDefaultCellTexts(perimeter));
    setCellStyles(makeDefaultCellStyles(perimeter));

    // 효과/로그 초기화
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

  /** 말 추가 (최대 18개) */
  const handleAddToken = () => {
    if (tokens.length >= 18) return;
    const nextId = tokens.length
      ? Math.max(...tokens.map((t) => t.id)) + 1
      : 1;
    const color = TOKEN_COLORS[(nextId - 1) % TOKEN_COLORS.length];
    const newToken = makeToken(nextId, `BJ${nextId}`, color);

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

  /** 토큰 이동 (애니메이션: 둘레 perimeter 기준) */
  const moveTokenWithAnimation = (token, steps) => {
    if (!token || perimeter <= 0) return;
    if (isMoving) return;

    const intSteps = steps | 0;
    if (intSteps === 0) return;

    const direction = intSteps > 0 ? 1 : -1;
    const totalSteps = Math.abs(intSteps);

    setIsMoving(true);

    let currentPos = token.pos; // 0 ~ perimeter-1
    let moved = 0;
    const stepMs = 180;

    const timer = setInterval(() => {
      moved += 1;

      currentPos = (currentPos + direction + perimeter) % perimeter;

      setTokens((prev) =>
        prev.map((t) =>
          t.id === token.id ? { ...t, pos: currentPos } : t
        )
      );

      if (moved >= totalSteps) {
        clearInterval(timer);
        setIsMoving(false);

        applyCellEffect({
          cellIndex: currentPos, // 0~perimeter-1
          token,
          diceValue,
          updateTokens: setTokens,
        });

        setCurrentTurnIndex((prev) =>
          tokens.length === 0 ? 0 : (prev + 1) % tokens.length
        );
      }
    }, stepMs);
  };

  /** 이동 버튼(직접 입력) */
  const moveSelectedToken = (steps) => {
    const token = selectedToken;
    if (!token) return;
    moveTokenWithAnimation(token, steps);
  };

  /** 주사위 굴리기 + 말 이동 */
  const rollDiceAndMove = () => {
    const token =
      diceTarget === "selected" ? selectedToken : currentTurnToken;

    if (!token) return;
    if (isRolling || isMoving) return;
    rollDice();
  };

  return (
    <>
      {/* 오디오 요소들 */}
      <audio
        ref={attachDiceAudioRef}
        src="/sounds/dice-roll.mp3"
        preload="auto"
      />
      <audio ref={attachGoodAudioRef} src="/sounds/good.mp3" preload="auto" />
      <audio ref={attachBadAudioRef} src="/sounds/bad.mp3" preload="auto" />

      <div
        style={{
          width: "100%",
          height: "100%",
          maxWidth: "2000px",
          maxHeight: "2000px",
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
        {/* 왼쪽: 보드 */}
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
        />

        {/* 오른쪽: 컨트롤 패널 */}
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
          diceRotation={diceRotation}
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
          onRollDice={rollDiceAndMove}
          onApplyCellChange={applyPanelCellChange}
          onResetGame={handleResetGame}
          diceTarget={diceTarget}
          setDiceTarget={setDiceTarget}
        />
      </div>

      <Toast message={toast} />
    </>
  );
}