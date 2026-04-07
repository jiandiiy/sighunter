import React, { useState, useMemo } from "react";
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

export default function BoardGame() {
  const [rows, setRows] = useState(9);
  const [cols, setCols] = useState(9);

  const perimeter = useMemo(() => {
    if (rows < 2 || cols < 2) return 0;
    return 2 * (rows + cols) - 4;
  }, [rows, cols]);

  const [cells, setCells] = useState(() => makeDefaultCellTexts(perimeter));
  const [cellStyles, setCellStyles] = useState(() =>
    makeDefaultCellStyles(perimeter)
  );

  const initialTokens = Array.from({ length: 4 }, (_, i) =>
    makeToken(i + 1, `BJ${i + 1}`, TOKEN_COLORS[i % TOKEN_COLORS.length])
  );
  const [tokens, setTokens] = useState(initialTokens);
  const [selectedTokenId, setSelectedTokenId] = useState(
    initialTokens[0]?.id ?? null
  );
  const [diceTarget, setDiceTarget] = useState("turn");

  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [moveSteps, setMoveSteps] = useState(1);
  const [isMoving, setIsMoving] = useState(false);

  const [tokenNameEdit, setTokenNameEdit] = useState(
    initialTokens[0]?.name ?? ""
  );

  const [selectedCellIndex, setSelectedCellIndex] = useState(null);
  const [panelCellText, setPanelCellText] = useState("");
  const [panelCellStyle, setPanelCellStyle] = useState({
    fontSize: 12,
    fontWeight: 600,
    color: "#f9fafb",
  });

  const selectedToken = tokens.find((t) => t.id === selectedTokenId);
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
  } = useBoardEffects({ cells });

  /** 토큰 이동 애니메이션 */
  const moveTokenWithAnimation = (token, steps) => {
    if (!token) return;
    if (isMoving) return;

    const totalCells = 32; // 보드 둘레 32칸 기준
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

      setTokens((prev) =>
        prev.map((t) => (t.id === token.id ? { ...t, pos: currentPos } : t))
      );

      if (moved >= totalSteps) {
        clearInterval(timer);
        setIsMoving(false);

        applyCellEffect({
          cellIndex: currentPos,
          token,
          diceValue: steps, // 실제 이동 칸 수를 효과에 전달
          updateTokens: setTokens,
        });

        setCurrentTurnIndex((prev) =>
          tokens.length === 0 ? 0 : (prev + 1) % tokens.length
        );
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
    setSelectedCellIndex(index);
    setPanelCellText(cells[index] || "");
    setPanelCellStyle(
      cellStyles[index] || {
        fontSize: 12,
        fontWeight: 600,
        color: "#f9fafb",
      }
    );
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

    setTokens((prev) => prev.map((t) => ({ ...t, pos: 0 })));

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
    const resetTokens = Array.from({ length: 4 }, (_, i) =>
      makeToken(i + 1, `BJ${i + 1}`, TOKEN_COLORS[i % TOKEN_COLORS.length])
    );
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

    setCells(makeDefaultCellTexts(perimeter));
    setCellStyles(makeDefaultCellStyles(perimeter));

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
    rollDice();
  };

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
        <div style={{ 
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    maxWidth: "min(2000px, 70vw)",      // ✅ 원하는 최대 크기(px)
    width: "90%",}}>
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