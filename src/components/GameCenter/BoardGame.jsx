import React, { useState } from "react";

/** 말(토큰) 한 개 생성 함수 */
function makeToken(id, name, color) {
  return { id, name, color, pos: 0 };
}

/** 말 색상 팔레트 (새 말 추가 시 순환하며 사용) */
const TOKEN_COLORS = [
  "#f97316",
  "#3b82f6",
  "#22c55e",
  "#e11d48",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#facc15",
  "#4ade80",
  "#60a5fa",
  "#fb7185",
  "#fbbf24",
  "#2dd4bf",
  "#a3e635",
  "#6366f1",
  "#f97316",
  "#22c55e",
  "#e11d48",
];

/** 보드 기본 텍스트 세트 (브루마블 느낌) */
function makeDefaultCellTexts(total) {
  const base = [
    "출발\n(Start)",
    "보너스\n+100점",
    "벌칙\n-100점",
    "앞으로 2칸 이동",
    "한 턴 쉬기",
    "시그헌터 1회",
    "지뢰게임 1회",
    "보너스\n+200점",
    "벌칙\n지뢰 선택",
    "뒤로 3칸 이동",
    "아이템 획득",
    "모두의 점수 절반",
    "랜덤 BJ랑 자리 바꾸기",
    "보너스\n+300점",
    "벌칙\n다시 출발로",
    "지뢰게임\n2회 연속",
    "시그헌터\n3번 뽑기",
    "보너스\n+500점",
    "벌칙\n시청자 벌칙 수행",
    "전부 재도전",
  ];

  const result = [];
  for (let i = 0; i < total; i++) {
    if (i < base.length) result.push(base[i]);
    else result.push(`칸 ${i + 1}`);
  }
  return result;
}

/** 한 칸의 스타일(글씨 크기/굵기/색) 기본값 */
function makeDefaultCellStyles(total) {
  return Array.from({ length: total }, () => ({
    fontSize: 12,
    fontWeight: 600,
    color: "#f9fafb",
  }));
}

/** 주사위 눈(1~6)에 맞춰 점(dot)들을 렌더링 */
function DiceFaces({ value }) {
  const dotStyle = {
    width: 6,
    height: 6,
    borderRadius: "50%",
    backgroundColor: "#111827",
  };

  // 3x3 그리드 안에 점 위치
  const positions = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  const active = positions[value] || [];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gridTemplateRows: "repeat(3, 1fr)",
        padding: 6,
        boxSizing: "border-box",
        gap: 4,
      }}
    >
      {Array.from({ length: 9 }).map((_, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {active.includes(idx) && <div style={dotStyle} />}
        </div>
      ))}
    </div>
  );
}

export default function BoardGame() {
  // 보드 크기
  const [rows, setRows] = useState(7);
  const [cols, setCols] = useState(7);
  const totalCells = rows * cols;

  // 칸 텍스트 + 스타일
  const [cells, setCells] = useState(() => makeDefaultCellTexts(totalCells));
  const [cellStyles, setCellStyles] = useState(() =>
    makeDefaultCellStyles(totalCells)
  );

  // 말 목록
  const initialTokens = Array.from({ length: 10 }, (_, i) =>
    makeToken(
      i + 1,
      `BJ${i + 1}`,
      TOKEN_COLORS[i % TOKEN_COLORS.length]
    )
  );
  const [tokens, setTokens] = useState(initialTokens);
  const [selectedTokenId, setSelectedTokenId] = useState(
    initialTokens[0]?.id ?? null
  );

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

  // 주사위 상태
  const [diceValue, setDiceValue] = useState(null); // 마지막 결과
  const [isRolling, setIsRolling] = useState(false); // 굴리는 중
  const [diceRotation, setDiceRotation] = useState(0); // 회전 각도

  const selectedToken = tokens.find((t) => t.id === selectedTokenId);

  /** 보드 칸 클릭 시: 우측 패널용 선택 칸만 설정 */
  const handleClickCell = (index) => {
    setSelectedCellIndex(index);
    setPanelCellText(cells[index] || "");
    setPanelCellStyle(
      cellStyles[index] || { fontSize: 12, fontWeight: 600, color: "#f9fafb" }
    );
  };

  /** 보드 크기 변경 */
  const handleResizeBoard = (newRows, newCols) => {
    const r = Math.max(3, Math.min(10, newRows));
    const c = Math.max(3, Math.min(10, newCols));
    const total = r * c;

    setRows(r);
    setCols(c);
    setCells(makeDefaultCellTexts(total));
    setCellStyles(makeDefaultCellStyles(total));

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
  };

  /** 토큰 이동 (애니메이션: 한 칸씩 이동) */
  const moveSelectedToken = (steps) => {
    if (!selectedToken || totalCells <= 0) return;
    if (isMoving) return;

    const totalSteps = Math.max(1, steps | 0);
    setIsMoving(true);

    let currentPos = selectedToken.pos;
    let moved = 0;
    const stepMs = 180;

    const timer = setInterval(() => {
      moved += 1;
      currentPos = (currentPos + 1) % totalCells;

      setTokens((prev) =>
        prev.map((t) =>
          t.id === selectedToken.id ? { ...t, pos: currentPos } : t
        )
      );

      if (moved >= totalSteps) {
        clearInterval(timer);
        setIsMoving(false);
      }
    }, stepMs);
  };

  /** 특정 칸에 있는 말들 */
  const tokensOnCell = (index) => tokens.filter((t) => t.pos === index);

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
    const nextId = tokens.length ? Math.max(...tokens.map((t) => t.id)) + 1 : 1;
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

  /** 주사위 굴리기 + 애니메이션 + 말 이동 (시계/반시계 랜덤) */
  const rollDiceAndMove = () => {
    if (!selectedToken) return;
    if (isRolling || isMoving) return;

    setIsRolling(true);

    let count = 0;
    const maxCount = 12; // 숫자 바뀌는 횟수
    const intervalMs = 70;

    const timer = setInterval(() => {
      // 중간 애니메이션: 1~6 랜덤
      const temp = Math.floor(Math.random() * 6) + 1;
      setDiceValue(temp);
      count += 1;

      // 회전 각도 갱신: 시계/반시계 방향을 랜덤으로
      setDiceRotation((prev) => {
        const direction = Math.random() < 0.5 ? -1 : 1; // -1: 반시계, 1: 시계
        const base = 90; // 기본 각도
        const jitter = Math.floor(Math.random() * 30) - 15; // -15 ~ +14
        return prev + direction * (base + jitter);
      });

      if (count >= maxCount) {
        clearInterval(timer);
        // 최종 값
        const final = Math.floor(Math.random() * 6) + 1;
        setDiceValue(final);
        setMoveSteps(final);

        // 마지막에도 방향 랜덤으로 조금 더 돌고 멈추기
        setDiceRotation((prev) => {
          const direction = Math.random() < 0.5 ? -1 : 1;
          return prev + direction * 120;
        });

        setIsRolling(false);

        // 말 이동
        moveSelectedToken(final);
      }
    }, intervalMs);
  };

  // 주사위 박스 스타일: 네온 느낌 + 회전
  const diceBoxStyle = {
    width: 44,
    height: 44,
    borderRadius: 10,
    border: "2px solid rgba(244,244,245,0.95)",
    background:
      "radial-gradient(circle at top, #f9fafb, #e5e7eb)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow:
      "0 0 10px rgba(244,244,245,0.8), 0 0 25px rgba(168,85,247,0.6)",
    transform: `rotate(${diceRotation}deg)`,
    transition: "transform 0.09s ease-in-out",
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1100,
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
          "-apple-system,BlinkMacSystemFont,system-ui,Segoe UI,sans-serif",
      }}
    >
      {/* 왼쪽: 보드 */}
      <div style={{ flex: 2, minWidth: 0 }}>
        <h2
          style={{
            margin: 0,
            marginBottom: 4,
            fontSize: 22,
            fontWeight: 800,
            color: "#f9fafb",
            textShadow: "0 0 12px rgba(168,85,247,0.9)",
            letterSpacing: 0.5,
          }}
        >
          🎰 브루마블 🎰
        </h2>
        <p
          style={{
            margin: "0 0 6px",
            fontSize: 12,
            opacity: 0.8,
            color: "#c7d2fe",
          }}
        >
          칸을 클릭해서 선택하고, 우측 패널에서 그 칸의 텍스트와 스타일을
          수정할 수 있습니다.
        </p>

        {/* 보드 크기 조절 */}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 8,
            fontSize: 12,
            color: "#e5e7eb",
          }}
        >
          <span style={{ opacity: 0.85 }}>보드 크기:</span>
          <label>
            행(세로)&nbsp;
            <input
              type="number"
              min={3}
              max={10}
              value={rows}
              onChange={(e) =>
                handleResizeBoard(Number(e.target.value) || 3, cols)
              }
              style={{
                width: 40,
                background: "rgba(15,23,42,0.9)",
                border: "1px solid rgba(129,140,248,0.8)",
                borderRadius: 6,
                color: "#e5e7eb",
                fontSize: 12,
                padding: "1px 4px",
                boxShadow: "0 0 8px rgba(79,70,229,0.6)",
              }}
            />
          </label>
          <label>
            열(가로)&nbsp;
            <input
              type="number"
              min={3}
              max={10}
              value={cols}
              onChange={(e) =>
                handleResizeBoard(rows, Number(e.target.value) || 3)
              }
              style={{
                width: 40,
                background: "rgba(15,23,42,0.9)",
                border: "1px solid rgba(129,140,248,0.8)",
                borderRadius: 6,
                color: "#e5e7eb",
                fontSize: 12,
                padding: "1px 4px",
                boxShadow: "0 0 8px rgba(79,70,229,0.6)",
              }}
            />
          </label>
          <span style={{ opacity: 0.8, color: "#a5b4fc" }}>
            (현재 {rows} × {cols} = {totalCells}칸)
          </span>
        </div>

        {/* 보드 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 3,
            background:
              "radial-gradient(circle at top, #0b1120, #020617)",
            padding: 6,
            borderRadius: 14,
            border: "1px solid rgba(129,140,248,0.7)",
            boxShadow:
              "0 0 15px rgba(55,65,81,0.9), inset 0 0 25px rgba(15,23,42,0.9)",
          }}
        >
          {Array.from({ length: totalCells }, (_, idx) => {
            const onThis = tokensOnCell(idx);
            const baseText = cells[idx] || "";
            const style = cellStyles[idx] || {
              fontSize: 12,
              fontWeight: 600,
              color: "#f9fafb",
            };
            const isSelectedCell = selectedCellIndex === idx;

            return (
              <div
                key={idx}
                onClick={() => handleClickCell(idx)}
                style={{
                  position: "relative",
                  minHeight: 72,
                  background:
                    "linear-gradient(135deg,rgba(15,23,42,0.98),rgba(17,24,39,0.98))",
                  border: isSelectedCell
                    ? "2px solid rgba(244,114,182,0.95)"
                    : "1px solid rgba(59,130,246,0.7)",
                  boxShadow: isSelectedCell
                    ? "0 0 18px rgba(244,114,182,0.9)"
                    : "0 0 8px rgba(59,130,246,0.6)",
                  borderRadius: 10,
                  padding: 4,
                  cursor: "pointer",
                  boxSizing: "border-box",
                  overflow: "hidden",
                }}
              >
                {/* 칸 번호 */}
                <div
                  style={{
                    position: "absolute",
                    top: 3,
                    left: 4,
                    fontSize: 10,
                    opacity: 0.7,
                    color: "#a5b4fc",
                  }}
                >
                  #{idx + 1}
                </div>

                {/* 칸 텍스트 + 스타일 */}
                <div
                  style={{
                    fontSize: style.fontSize,
                    fontWeight: style.fontWeight,
                    color: style.color,
                    whiteSpace: "pre-line",
                    textAlign: "center",
                    marginTop: 12,
                    textShadow: "0 0 6px rgba(15,23,42,0.8)",
                  }}
                >
                  {baseText}
                </div>

                {/* 이 칸에 있는 말들 */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 3,
                    left: 3,
                    display: "flex",
                    gap: 3,
                    flexWrap: "wrap",
                  }}
                >
                  {onThis.map((t) => (
                    <div
                      key={t.id}
                      title={t.name}
                      style={{
                        width: 13,
                        height: 13,
                        borderRadius: "50%",
                        background: t.color,
                        border: "1px solid #020617",
                        boxShadow: "0 0 6px rgba(248,250,252,0.7)",
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 오른쪽: 말/진행 제어 + 칸 내용 패널 */}
      <div
        style={{
          flex: 1,
          minWidth: 260,
          padding: 10,
          borderRadius: 16,
          border: "1px solid rgba(168,85,247,0.9)",
          background:
            "radial-gradient(circle at top, rgba(30,64,175,0.95), rgba(17,24,39,0.98))",
          fontSize: 12,
          boxShadow:
            "0 0 20px rgba(129,140,248,0.8), inset 0 0 20px rgba(15,23,42,0.95)",
        }}
      >
        <h3
          style={{
            margin: "0 0 8px",
            fontSize: 16,
            fontWeight: 800,
            color: "#f9fafb",
            textShadow: "0 0 10px rgba(129,140,248,0.9)",
          }}
        >
          🎰 컨트롤 센터
        </h3>

        {/* 말 추가/삭제 컨트롤 */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={handleAddToken}
            disabled={tokens.length >= 18 || isMoving || isRolling}
            style={{
              padding: "3px 8px",
              borderRadius: 999,
              border: "1px solid rgba(129,140,248,0.9)",
              background:
                "linear-gradient(135deg,rgba(56,189,248,0.9),rgba(129,140,248,0.95))",
              color: "#0f172a",
              fontSize: 11,
              fontWeight: 700,
              cursor:
                tokens.length >= 18 || isMoving || isRolling
                  ? "not-allowed"
                  : "pointer",
              opacity:
                tokens.length >= 18 || isMoving || isRolling ? 0.4 : 1,
              boxShadow: "0 0 10px rgba(56,189,248,0.9)",
            }}
          >
            + 말 추가 (최대 18)
          </button>
          <button
            type="button"
            onClick={handleRemoveToken}
            disabled={!selectedToken || tokens.length <= 1 || isMoving || isRolling}
            style={{
              padding: "3px 8px",
              borderRadius: 999,
              border: "1px solid rgba(248,113,113,0.9)",
              background:
                "linear-gradient(135deg,rgba(248,113,113,0.95),rgba(239,68,68,0.95))",
              color: "#0b1120",
              fontSize: 11,
              fontWeight: 700,
              cursor:
                !selectedToken || tokens.length <= 1 || isMoving || isRolling
                  ? "not-allowed"
                  : "pointer",
              opacity:
                !selectedToken || tokens.length <= 1 || isMoving || isRolling
                  ? 0.4
                  : 1,
              boxShadow: "0 0 10px rgba(248,113,113,0.9)",
            }}
          >
            − 선택 말 삭제
          </button>
          <span style={{ fontSize: 11, opacity: 0.9, color: "#e5e7eb" }}>
            (현재 {tokens.length}개)
          </span>
        </div>

        {/* 말 리스트 + 선택 */}
        <div
          style={{
            maxHeight: 190,
            overflowY: "auto",
            marginBottom: 8,
            paddingRight: 4,
          }}
        >
          {tokens.map((t) => {
            const isSel = t.id === selectedTokenId;
            return (
              <div
                key={t.id}
                onClick={() => handleSelectToken(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 6px",
                  marginBottom: 4,
                  borderRadius: 8,
                  border: isSel
                    ? "1px solid rgba(244,114,182,0.95)"
                    : "1px solid rgba(59,130,246,0.8)",
                  background: isSel
                    ? "linear-gradient(135deg,rgba(236,72,153,0.25),rgba(129,140,248,0.2))"
                    : "linear-gradient(135deg,rgba(15,23,42,0.95),rgba(17,24,39,0.98))",
                  cursor: isMoving || isRolling ? "default" : "pointer",
                  opacity: isMoving || isRolling ? 0.8 : 1,
                  boxShadow: isSel
                    ? "0 0 10px rgba(236,72,153,0.9)"
                    : "0 0 6px rgba(59,130,246,0.6)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: t.color,
                      border: "1px solid #020617",
                      boxShadow: "0 0 8px rgba(248,250,252,0.8)",
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#f9fafb",
                      }}
                    >
                      {t.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        opacity: 0.8,
                        color: "#c4b5fd",
                      }}
                    >
                      위치: {t.pos + 1}칸
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 선택된 말 이름 변경 + 이동/주사위 */}
        <div
          style={{
            marginTop: 4,
            paddingTop: 6,
            borderTop: "1px solid rgba(129,140,248,0.7)",
          }}
        >
          <div
            style={{
              marginBottom: 4,
              fontSize: 12,
              color: "#e5e7eb",
            }}
          >
            <span>선택된 말: </span>
            <b style={{ color: "#f9fafb" }}>
              {selectedToken ? selectedToken.name : "-"}
            </b>
          </div>

          {/* 이름 수정 */}
          <div
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 8,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              value={tokenNameEdit}
              onChange={(e) => setTokenNameEdit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyTokenNameChange();
              }}
              placeholder="BJ 이름 입력"
              style={{
                flex: 1,
                minWidth: 120,
                background: "rgba(15,23,42,0.9)",
                border: "1px solid rgba(129,140,248,0.85)",
                borderRadius: 8,
                color: "#e5e7eb",
                fontSize: 12,
                padding: "4px 6px",
                boxShadow: "0 0 8px rgba(129,140,248,0.8)",
              }}
            />
            <button
              type="button"
              onClick={applyTokenNameChange}
              disabled={!selectedToken || isMoving || isRolling}
              style={{
                padding: "3px 8px",
                borderRadius: 999,
                border: "1px solid rgba(250,249,246,0.9)",
                background:
                  "linear-gradient(135deg,rgba(251,191,36,0.95),rgba(244,114,182,0.95))",
                color: "#111827",
                fontSize: 11,
                fontWeight: 700,
                cursor:
                  !selectedToken || isMoving || isRolling
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  !selectedToken || isMoving || isRolling ? 0.5 : 1,
                boxShadow: "0 0 12px rgba(251,191,36,0.9)",
              }}
            >
              이름 변경
            </button>
          </div>

          {/* 이동 컨트롤 + 주사위 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 10,
            }}
          >
            {/* 직접 입력 이동 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <label style={{ color: "#e5e7eb" }}>
                이동 칸 수:&nbsp;
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={moveSteps}
                  onChange={(e) =>
                    setMoveSteps(Math.max(1, Number(e.target.value) || 1))
                  }
                  disabled={isMoving || isRolling}
                  style={{
                    width: 48,
                    background: "rgba(15,23,42,0.9)",
                    border: "1px solid rgba(129,140,248,0.85)",
                    borderRadius: 8,
                    color: "#e5e7eb",
                    fontSize: 12,
                    padding: "2px 5px",
                    boxShadow: "0 0 8px rgba(79,70,229,0.8)",
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => moveSelectedToken(moveSteps)}
                disabled={!selectedToken || isMoving || isRolling}
                style={{
                  padding: "4px 8px",
                  borderRadius: 999,
                  border: "1px solid rgba(45,212,191,0.95)",
                  background:
                    "linear-gradient(135deg,rgba(45,212,191,0.95),rgba(52,211,153,0.95))",
                  color: "#022c22",
                  fontWeight: 800,
                  fontSize: 12,
                  cursor:
                    !selectedToken || isMoving || isRolling
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    !selectedToken || isMoving || isRolling ? 0.5 : 1,
                  boxShadow: "0 0 10px rgba(45,212,191,0.9)",
                }}
              >
                ▶ 이동
              </button>
            </div>

            {/* 주사위 굴리기 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={rollDiceAndMove}
                disabled={!selectedToken || isMoving || isRolling}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(147,197,253,0.9)",
                  background:
                    "linear-gradient(135deg,rgba(59,130,246,0.95),rgba(129,140,248,0.95))",
                  color: "#eff6ff",
                  fontWeight: 800,
                  fontSize: 12,
                  cursor:
                    !selectedToken || isMoving || isRolling
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    !selectedToken || isMoving || isRolling ? 0.5 : 1,
                  boxShadow: "0 0 12px rgba(59,130,246,0.95)",
                }}
              >
                🎲 주사위
              </button>

              {/* 화면에 보이는 주사위 박스 */}
              <div style={diceBoxStyle}>
                {isRolling ? (
                  <DiceFaces value={diceValue || 1} />
                ) : diceValue ? (
                  <DiceFaces value={diceValue} />
                ) : (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    Ready
                  </span>
                )}
              </div>

              {/* 텍스트로 결과 표시 */}
              <div
                style={{
                  minWidth: 80,
                  fontSize: 11,
                  opacity: 0.9,
                  color: "#e5e7eb",
                }}
              >
                {diceValue
                  ? `마지막 결과: ${diceValue}`
                  : "아직 굴린 기록 없음"}
              </div>
            </div>
          </div>

          {/* 클릭해서 선택한 칸 내용 수정 영역 */}
          <div
            style={{
              marginTop: 4,
              paddingTop: 6,
              borderTop: "1px solid rgba(129,140,248,0.7)",
            }}
          >
            <div
              style={{
                marginBottom: 4,
                fontSize: 11,
                opacity: 0.9,
                color: "#e5e7eb",
              }}
            >
              {selectedCellIndex !== null ? (
                <>
                  선택한 칸:{" "}
                  <b style={{ color: "#f9fafb" }}>
                    {selectedCellIndex + 1}번 칸
                  </b>
                </>
              ) : (
                <>보드에서 칸을 클릭하면, 여기에서 그 칸 내용을 수정할 수 있습니다.</>
              )}
            </div>

            <textarea
              value={panelCellText}
              onChange={(e) => setPanelCellText(e.target.value)}
              rows={3}
              disabled={selectedCellIndex === null}
              placeholder="이 칸에 들어갈 내용을 입력하세요 (줄바꿈 가능)"
              style={{
                width: "96%",
                fontSize: 11,
                background: "rgba(15,23,42,0.95)",
                color: "#e5e7eb",
                borderRadius: 8,
                border: "1px solid rgba(129,140,248,0.9)",
                resize: "none",
                marginBottom: 4,
                padding: 6,
                opacity: selectedCellIndex !== null ? 1 : 0.5,
                boxShadow: "0 0 8px rgba(129,140,248,0.8)",
              }}
            />

            {/* 내용 스타일 설정 */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
                marginBottom: 4,
                alignItems: "center",
                opacity: selectedCellIndex !== null ? 1 : 0.5,
                color: "#e5e7eb",
              }}
            >
              <label style={{ fontSize: 10 }}>
                크기
                <input
                  type="number"
                  min={10}
                  max={24}
                  value={panelCellStyle.fontSize}
                  onChange={(e) =>
                    setPanelCellStyle((prev) => ({
                      ...prev,
                      fontSize: Math.max(
                        10,
                        Math.min(24, Number(e.target.value) || 12)
                      ),
                    }))
                  }
                  disabled={selectedCellIndex === null}
                  style={{
                    width: 42,
                    marginLeft: 2,
                    background: "rgba(15,23,42,0.9)",
                    border: "1px solid rgba(129,140,248,0.9)",
                    borderRadius: 6,
                    color: "#e5e7eb",
                    fontSize: 10,
                    padding: "1px 3px",
                  }}
                />
              </label>

              <label
  style={{
    fontSize: 10,
    display: "flex",
    alignItems: "center",
  }}>
                <span style={{ whiteSpace: "nowrap" }}>굵기</span>
                <select
                  value={panelCellStyle.fontWeight}
                  onChange={(e) =>
                    setPanelCellStyle((prev) => ({
                      ...prev,
                      fontWeight: Number(e.target.value),
                    }))
                  }
                  disabled={selectedCellIndex === null}
                  style={{
                    marginLeft: 2,
                    background: "rgba(15,23,42,0.9)",
                    border: "1px solid rgba(129,140,248,0.9)",
                    borderRadius: 6,
                    color: "#e5e7eb",
                    fontSize: 10,
                    padding: "1px 3px",
                  }}
                >
                  <option value={300}>얇게</option>
                  <option value={500}>보통</option>
                  <option value={700}>굵게</option>
                </select>
              </label>

              <label style={{ fontSize: 10 }}>
                색
                <select
                  value={panelCellStyle.color}
                  onChange={(e) =>
                    setPanelCellStyle((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                  disabled={selectedCellIndex === null}
                  style={{
                    marginLeft: 2,
                    background: "rgba(15,23,42,0.9)",
                    border: "1px solid rgba(129,140,248,0.9)",
                    borderRadius: 6,
                    color: "#e5e7eb",
                    fontSize: 10,
                    padding: "1px 3px",
                  }}
                >
                  <option value="#f9fafb">기본(흰색)</option>
                  <option value="#facc15">노랑</option>
                  <option value="#f97373">빨강</option>
                  <option value="#4ade80">초록</option>
                  <option value="#38bdf8">하늘</option>
                  <option value="#a855f7">보라</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={applyPanelCellChange}
              disabled={selectedCellIndex === null}
              style={{
                padding: "3px 8px",
                borderRadius: 999,
                border: "1px solid rgba(248,250,252,0.9)",
                background:
                  "linear-gradient(135deg,rgba(248,250,252,0.95),rgba(226,232,240,0.95))",
                color: "#111827",
                fontSize: 11,
                fontWeight: 700,
                cursor:
                  selectedCellIndex !== null ? "pointer" : "not-allowed",
                opacity: selectedCellIndex !== null ? 1 : 0.5,
                boxShadow: "0 0 10px rgba(248,250,252,0.9)",
              }}
            >
              이 칸 내용 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}