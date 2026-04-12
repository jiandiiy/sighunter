// src/components/GameCenter/BoardGame/ControlPanel.jsx
import React from "react";

export default function ControlPanel({
  tokens,
  selectedToken,
  selectedTokenId,
  tokenNameEdit,
  setTokenNameEdit,
  currentTurnToken,
  currentTurnIndex,
  moveSteps,
  setMoveSteps,
  diceValue, // ✅ 마지막 결과만 표시용으로 유지
  isRolling,
  isMoving,
  logs,
  selectedCellIndex,
  panelCellText,
  setPanelCellText,
  panelCellStyle,
  setPanelCellStyle,
  onAddToken,
  onRemoveToken,
  onSelectToken,
  onApplyTokenName,
  onMoveSelected,
  onApplyCellChange,
  onResetGame, // 🔁 전체 초기화 핸들러
  diceTarget, // "turn" | "selected"
  setDiceTarget, // setter
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 200,
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

      {/* 현재 턴 표시 + 무인도 상태 배지 */}
      <div
        style={{
          marginBottom: 6,
          fontSize: 13,
          color: "#e5e7eb",
        }}
      >
        <div style={{ marginBottom: 4 }}>
          현재 턴:&nbsp;
          <b style={{ color: "#fef3c7" }}>
            {currentTurnToken ? currentTurnToken.name : "-"}
          </b>
        </div>

        {/* 🔥 현재 턴 말이 무인도에 갇혀 있는 경우 표시 */}
        {currentTurnToken && currentTurnToken.skipTurns > 0 && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 8px",
              borderRadius: 999,
              background:
                "linear-gradient(90deg, rgba(248,113,113,0.2), rgba(239,68,68,0.15))",
              border: "1px solid rgba(248,113,113,0.6)",
              color: "#fecaca",
              fontSize: 11,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "999px",
                backgroundColor: "#f97316",
                boxShadow: "0 0 6px rgba(248,113,113,0.7)",
              }}
            />
            <span>
              무인도 대기{" "}
              <strong>{currentTurnToken.skipTurns}</strong>턴 남음
            </span>
          </div>
        )}
      </div>

      {/* 말 추가/삭제 컨트롤 */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 8,
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={onAddToken}
          disabled={tokens.length >= 18 || isMoving || isRolling}
          style={{
            padding: "3px 8px",
            borderRadius: 999,
            border: "1px solid rgba(129,140,248,0.9)",
            background:
              "linear-gradient(135deg,rgba(56,189,248,0.9),rgba(129,140,248,0.95))",
            color: "#0f172a",
            fontSize: 13,
            fontWeight: 800,
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
          onClick={onRemoveToken}
          disabled={
            !selectedToken || tokens.length <= 1 || isMoving || isRolling
          }
          style={{
            padding: "3px 8px",
            borderRadius: 999,
            border: "1px solid rgba(248,113,113,0.9)",
            background:
              "linear-gradient(135deg,rgba(248,113,113,0.95),rgba(239,68,68,0.95))",
            color: "#0b1120",
            fontSize: 13,
            fontWeight: 800,
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

      {/* 🔁 전체 초기화 버튼 */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <button
          type="button"
          onClick={onResetGame}
          disabled={isMoving || isRolling}
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            border: "1px solid rgba(248,250,252,0.9)",
            background:
              "linear-gradient(135deg,rgba(248,250,252,0.95),rgba(226,232,240,0.95))",
            color: "#111827",
            fontSize: 12,
            fontWeight: 800,
            cursor: isMoving || isRolling ? "not-allowed" : "pointer",
            opacity: isMoving || isRolling ? 0.5 : 1,
            boxShadow: "0 0 12px rgba(248,250,252,0.85)",
          }}
        >
          🔁 게임 전체 초기화
        </button>
      </div>

      {/* 말 리스트 + 선택 */}
      <div
        style={{
          maxHeight: 200,
          overflowY: "auto",
          marginBottom: 8,
          paddingRight: 4,
        }}
      >
        {tokens.map((t, idx) => {
          const isSel = t.id === selectedTokenId;
          const isTurn = idx === currentTurnIndex;
          return (
            <div
              key={t.id}
              onClick={() => onSelectToken(t.id)}
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
                background: isTurn
                  ? "linear-gradient(135deg,rgba(251,191,36,0.25),rgba(129,140,248,0.2))"
                  : isSel
                  ? "linear-gradient(135deg,rgba(236,72,153,0.25),rgba(129,140,248,0.2))"
                  : "linear-gradient(135deg,rgba(15,23,42,0.95),rgba(17,24,39,0.98))",
                cursor: isMoving || isRolling ? "default" : "pointer",
                opacity: isMoving || isRolling ? 0.8 : 1,
                boxShadow: isTurn
                  ? "0 0 12px rgba(251,191,36,0.9)"
                  : isSel
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
                      fontSize: 14,
                      fontWeight: 800,
                      color: "#fff",
                    }}
                  >
                    {isTurn && "▶ "} {t.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.8,
                      color: "#fff",
                      fontWeight: 600,
                    }}
                  >
                    위치: {t.pos + 1}칸 /{" "}
                    <span style={{ color: "#fde68a" }}>
                      점수: {t.score}점
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 선택된 말 이름 변경 + 이동 */}
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
            fontSize: 14,
            color: "#fff",
          }}
        >
          <span>선택된 말: </span>
          <b style={{ color: "#fff" }}>
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
              if (e.key === "Enter") onApplyTokenName();
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
            onClick={onApplyTokenName}
            disabled={!selectedToken || isMoving || isRolling}
            style={{
              padding: "3px 8px",
              borderRadius: 999,
              border: "1px solid rgba(250,249,246,0.9)",
              background:
                "linear-gradient(135deg,rgba(251,191,36,0.95),rgba(244,114,182,0.95))",
              color: "#111827",
              fontSize: 12,
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

        {/* 이동 컨트롤 + 주사위 대상/결과만 표시 */}
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
            <label style={{ color: "#fff", fontSize: 14 }}>
              이동 칸 수:&nbsp;
              <input
                type="number"
                min={-50}
                max={50}
                value={moveSteps}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isNaN(v)) {
                    setMoveSteps(0);
                  } else {
                    setMoveSteps(Math.max(-50, Math.min(50, v)));
                  }
                }}
                disabled={isMoving || isRolling}
                style={{
                  width: 48,
                  background: "rgba(15,23,42,0.9)",
                  border: "1px solid rgba(129,140,248,0.85)",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 13,
                  padding: "2px 5px",
                  boxShadow: "0 0 8px rgba(79,70,229,0.8)",
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => onMoveSelected(moveSteps)}
              disabled={!currentTurnToken || isMoving || isRolling}
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

          {/* 주사위 대상 선택 */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              alignItems: "center",
              marginBottom: 4,
              color: "#e5e7eb",
              fontSize: 11,
            }}
          >
            <span style={{ opacity: 0.9 }}>주사위 대상:</span>
            <label
              style={{ display: "flex", alignItems: "center", gap: 3 }}
            >
              <input
                type="radio"
                name="diceTarget"
                value="turn"
                checked={diceTarget === "turn"}
                onChange={() => setDiceTarget("turn")}
              />
              <span>현재 턴 말</span>
            </label>
            <label
              style={{ display: "flex", alignItems: "center", gap: 3 }}
            >
              <input
                type="radio"
                name="diceTarget"
                value="selected"
                checked={diceTarget === "selected"}
                onChange={() => setDiceTarget("selected")}
              />
              <span>선택된 말</span>
            </label>
          </div>

          {/* 주사위 결과 텍스트만 표시 */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 2,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                minWidth: 80,
                fontSize: 14,
                opacity: 0.9,
                color: "#fff",
                fontWeight: 700,
                textAlign: "right",
              }}
            >
              {diceValue
                ? `마지막 결과: ${diceValue}`
                : "아직 굴린 기록 없음"}
            </div>
          </div>
        </div>

        {/* 로그 + 칸 내용 편집 */}
        <div
          style={{
            marginTop: 4,
            paddingTop: 6,
            borderTop: "1px solid rgba(129,140,248,0.7)",
          }}
        >
          {/* 로그 박스 */}
          <div
            style={{
              marginBottom: 8,
              maxHeight: 120,
              overflowY: "auto",
              background: "rgba(15,23,42,0.85)",
              borderRadius: 8,
              border: "1px solid rgba(129,140,248,0.6)",
              padding: 6,
              fontSize: 11,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                marginBottom: 4,
                color: "#e5e7eb",
              }}
            >
                로그
  </div>
  {logs.length === 0 ? (
    <div style={{ opacity: 0.6 }}>아직 로그 없음</div>
  ) : (
    logs.map((log) => (
      <div key={log.id} style={{ marginBottom: 4 }}>
        {/* 1줄: 누구 / 주사위 / 몇 번 칸 / 점수 변화 */}
        <div>
          <span style={{ color: "#bfdbfe" }}>{log.tokenName}</span> 님 주사위{" "}
          <span style={{ color: "#fee2e2" }}>{log.dice}</span> ➜{" "}
          <span style={{ color: "#fde68a" }}>{log.cell}번 칸</span>
          {log.diff !== 0 && (
            <>
              {" "}
              (
              <span
                style={{
                  color: log.diff > 0 ? "#bbf7d0" : "#fecaca",
                }}
              >
                {log.diff > 0 ? "+" : ""}
                {log.diff}점
              </span>
              )
            </>
          )}
        </div>

        {/* 2줄: 해당 칸의 효과 텍스트 (줄바꿈 유지) */}
        {log.text && (
          <div
            style={{
              marginTop: 2,
              marginLeft: 4,
              fontSize: 10,
              color: "#9ca3af",
              whiteSpace: "pre-line", // \n → 실제 줄바꿈
            }}
          >
            {log.text}
          </div>
        )}
      </div>
    ))
  )}
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
                fontSize: 14,
                opacity: 0.9,
                color: "#e5e7eb",
              }}
            >
              {selectedCellIndex !== null ? (
                <>
                  선택한 칸:{" "}
                  <b style={{ color: "#fff" }}>
                    {selectedCellIndex + 1}번 칸
                  </b>
                </>
              ) : (
                <>
                  보드에서 칸을 클릭하면, 여기에서 그 칸 내용을
                  수정할 수 있습니다.
                </>
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
                fontSize: 14,
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
                gap: 10,
                margin: "10px 0 10px",
                alignItems: "center",
                justifyContent: "center",
                opacity: selectedCellIndex !== null ? 1 : 0.5,
                color: "#fff",
              }}
            >
              <label style={{ fontSize: 12 }}>
                크기
                <input
                  type="number"
                  min={12}
                  max={30}
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
                    height: 20,
                    marginLeft: 2,
                    background: "rgba(15,23,42,0.9)",
                    border: "1px solid rgba(129,140,248,0.9)",
                    borderRadius: 4,
                    color: "#e5e7eb",
                    fontSize: 12,
                    padding: "1px 3px",
                  }}
                />
              </label>

              <label
                style={{
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                }}
              >
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
                    borderRadius: 4,
                    color: "#fff",
                    fontSize: 12,
                    padding: "3px 3px",
                  }}
                >
                  <option value={300}>얇게</option>
                  <option value={500}>보통</option>
                  <option value={700}>굵게</option>
                </select>
              </label>

              <label style={{ fontSize: 12 }}>
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
                    color: "#fff",
                    fontSize: 12,
                    padding: "3px 3px",
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

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 20,
              }}
            >
              <button
                type="button"
                onClick={onApplyCellChange}
                disabled={selectedCellIndex === null}
                style={{
                  padding: "5px 8px",
                  borderRadius: 4,
                  border: "1px solid rgba(248,250,252,0.9)",
                  background:
                    "linear-gradient(135deg,rgba(248,250,252,0.95),rgba(226,232,240,0.95))",
                  color: "#111827",
                  fontSize: 14,
                  fontWeight: 800,
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
    </div>
  );
}