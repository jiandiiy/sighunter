// src/components/GameCenter/SigHunterBingo/SigHunterBingoBoard.jsx

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
} from "react";
import "../styles/SigHunterBingoBoard.css";
import {
  useSigHunterBingoState,
  AVAILABLE_SIZES,
} from "../hooks/useSigHunterBingoState";
import {
  loadSigHunterPlayers,
  saveSigHunterPlayers,
} from "../../../../resources/api/sigBingoPlayersApi";

// 모드 탭 이름 매핑
const MODE_LABELS = {
  queendom: "퀸덤",
  muse: "뮤즈",
  holic: "홀릭",
};

export default function SigHunterBingoBoard({
  boardId = "hunter1",
  program = "muse",
  group = "group1",
}) {
  // 🔹 전체 인원 Firestore + 로컬 상태
  const [allPlayersByMode, setAllPlayersByMode] = useState({
    muse: [],
    queendom: [],
    holic: [],
  });
  const [allPlayersInput, setAllPlayersInput] = useState("");
  const [playersSaving, setPlayersSaving] = useState(false);
  const [playersLoading, setPlayersLoading] = useState(true);

  // 전체 인원 모달
  const [isAllPlayersModalOpen, setIsAllPlayersModalOpen] =
    useState(false);
  const openAllPlayersModal = () => setIsAllPlayersModalOpen(true);
  const closeAllPlayersModal = () => setIsAllPlayersModalOpen(false);

  useEffect(() => {
    let alive = true;

    async function loadAllModes() {
      setPlayersLoading(true);
      try {
        const modes = ["muse", "queendom", "holic"];
        const results = {};

        for (const m of modes) {
          const list = await loadSigHunterPlayers(m, group);
          results[m] = list || [];
        }

        if (!alive) return;

        setAllPlayersByMode(results);

        const initialList = results[program] || [];
        setAllPlayersInput(initialList.join("\n"));
      } catch (e) {
        console.error("[HUNTER] loadSigHunterPlayers failed", e);
      } finally {
        if (!alive) return;
        setPlayersLoading(false);
      }
    }

    loadAllModes();
    return () => {
      alive = false;
    };
    // group이 바뀌면 다시 로드
  }, [group, program]);

  const initialProgram = program;

  const {
    loading,
    mode,
    size,
    cellCount,
    cells,
    logs,
    lineOwners,
    playerColors,
    completedLineCount,
    HUNTER_MODES,
    handleChangeMode,
    handleChangeSize,
    handleResetBoard: rawResetBoard,
    handleClickCell: rawClickCell,
    getCurrentImage,
    getCurrentCount,
    getColorForPlayer,

    status,
    participants,
    mvpCandidate,
    safeHandleClickCell,
    startNextRound,
    handleBoardAutoComplete,
    lines,
  } = useSigHunterBingoState(boardId, {
    allPlayers: allPlayersByMode[initialProgram] || [],
    program: initialProgram,
    group,
  });

  // 모드 바뀔 때 textarea 내용 갱신
  useEffect(() => {
    const listForMode = allPlayersByMode[mode] || [];
    setAllPlayersInput(listForMode.join("\n"));
  }, [mode, allPlayersByMode]);

  const [currentPlayer, setCurrentPlayer] = useState("");
  const [targetCellNo, setTargetCellNo] = useState("");

  const [showSummaryBanner, setShowSummaryBanner] = useState(false);
  const [lastSummary, setLastSummary] = useState(null);

  const [highlightMvp, setHighlightMvp] = useState(false);
  const [highlightNonParticipants, setHighlightNonParticipants] =
    useState(false);

  const playerInputRef = useRef(null);
  const cellNumberInputRef = useRef(null);

  // ✅ 디버그 토글: 숫자 미노출이면 true로 두고 확인
  const DEBUG_SHOW_COUNT = true;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.altKey &&
        e.shiftKey &&
        (e.key === "d" || e.key === "D")
      ) {
        e.preventDefault();
        if (playerInputRef.current) {
          playerInputRef.current.focus();
        }
      }

      if (
        e.altKey &&
        e.shiftKey &&
        (e.key === "f" || e.key === "F")
      ) {
        e.preventDefault();
        if (cellNumberInputRef.current) {
          cellNumberInputRef.current.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const playerTerritoryCounts = useMemo(() => {
    const counts = {};
    cells.forEach((cell) => {
      if (!cell.owner) return;
      if (!counts[cell.owner]) counts[cell.owner] = 0;
      counts[cell.owner] += 1;
    });
    return counts;
  }, [cells]);

  // MVP 후보를 "점령칸수" 기반으로 계산
  const localMvpCandidate = useMemo(() => {
    if (mvpCandidate) return mvpCandidate;

    const entries = Object.entries(playerTerritoryCounts);
    if (entries.length === 0) return null;

    const [topPlayer, topCount] = entries.sort(
      (a, b) => b[1] - a[1]
    )[0];

    return { player: topPlayer, count: topCount };
  }, [mvpCandidate, playerTerritoryCounts]);

   // 현재 라운드 참여자: "현재 보드에서 한 칸 이상 점령 중인 사람"
  const localParticipants = useMemo(() => {
    const set = new Set();
    cells.forEach((cell) => {
      const owner = (cell.owner || "").trim();
      if (owner) set.add(owner);
    });
    return Array.from(set).sort();
  }, [cells]);

  // 현재 라운드 미참여자: 전체 인원 - localParticipants
  const localNonParticipants = useMemo(() => {
    const listForMode = allPlayersByMode[mode] || [];
    if (!listForMode || listForMode.length === 0) return [];

    const pSet = new Set(
      (localParticipants || []).map((name) => (name || "").trim())
    );

    return listForMode
      .map((name) => (name || "").trim())
      .filter(Boolean)
      .filter((name) => !pSet.has(name));
  }, [allPlayersByMode, mode, localParticipants]);

  const flipCellByNumber = (noStr) => {
    const n = Number(noStr);
    if (!Number.isFinite(n)) return;
    if (n < 1 || n > cellCount) return;

    const cell = cells[n - 1];
    if (!cell) return;
    if (!currentPlayer) return;

    if (safeHandleClickCell) {
      safeHandleClickCell(cell.id, currentPlayer);
    } else {
      rawClickCell(cell.id, currentPlayer);
    }
  };

  useEffect(() => {
    if (!handleBoardAutoComplete) return;

    async function checkComplete() {
      await handleBoardAutoComplete((summary) => {
        setLastSummary(summary);
        setShowSummaryBanner(true);
      });
    }
    checkComplete();
  }, [handleBoardAutoComplete]);

  const settlementText = useMemo(() => {
    const mvp = localMvpCandidate;

    const mvpText = mvp
      ? "MVP: " + mvp.player + " (" + mvp.count + "칸 점령)\n"
      : "MVP: 없음\n";

    const participantText =
      (localParticipants && localParticipants.length > 0
        ? "참여자: " + localParticipants.join(", ")
        : "참여자: 없음") + "\n";

    const nonPartText =
      localNonParticipants && localNonParticipants.length > 0
        ? "미참여자: " +
          localNonParticipants.join(", ") +
          " (−2,000점 예정)"
        : "미참여자: 없음";

    return mvpText + participantText + nonPartText;
  }, [localParticipants, localMvpCandidate, localNonParticipants]);

  const handleCopySettlementText = () => {
    navigator.clipboard
      .writeText(settlementText)
      .catch((err) =>
        console.error("[HUNTER] 정산 텍스트 복사 실패:", err)
      );
  };

  const handleCopyParticipants = () => {
    const text = localParticipants.join(", ");
    navigator.clipboard
      .writeText(text)
      .catch((err) =>
        console.error("[HUNTER] 참여자 복사 실패:", err)
      );
  };

  const canStartNextRound = status === "finished";

  const [roundDisplay, setRoundDisplay] = useState(1);

  const handleResetBoard = () => {
    if (status === "playing") {
      const ok = window.confirm(
        "현재 판이 진행 중입니다. 정말 초기화하시겠습니까?"
      );
      if (!ok) return;
    }

    setRoundDisplay(1);

    if (startNextRound) {
      startNextRound();
    } else {
      rawResetBoard();
    }
  };

  const handleCellClick = (cell) => {
    if (status === "finished") {
      return;
    }
    if (!currentPlayer) {
      alert("플레이어 닉네임을 먼저 입력해주세요.");
      return;
    }

    if (safeHandleClickCell) {
      safeHandleClickCell(cell.id, currentPlayer);
    } else {
      rawClickCell(cell.id, currentPlayer);
    }
  };

  const getCellClasses = (cell) => {
    const classes = ["hunter-cell"];
    if (cell.owner) {
      classes.push("hunter-cell--owned");
    }
    const mvp = localMvpCandidate;
    if (highlightMvp && mvp && cell.owner === mvp.player) {
      classes.push("hunter-cell-mvp-highlight");
    }
    return classes.join(" ");
  };

  const parseAllPlayersInput = (value) => {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  };

  const handleSaveAllPlayers = async () => {
    setPlayersSaving(true);
    try {
      const parsed = parseAllPlayersInput(allPlayersInput);
      const saved = await saveSigHunterPlayers(mode, group, parsed);

      setAllPlayersByMode((prev) => ({
        ...prev,
        [mode]: saved,
      }));
    } catch (e) {
      console.error("[HUNTER] saveSigHunterPlayers failed", e);
      alert("전체 인원 저장에 실패했습니다. 콘솔 로그를 확인해주세요.");
    } finally {
      setPlayersSaving(false);
    }
  };

  // ✅ 숫자 미노출 디버그: 첫 5칸의 currentCount를 로그로 확인
 useEffect(() => {
  if (loading) return;
  if (!cells || cells.length === 0) return;
  if (!DEBUG_SHOW_COUNT) return;

  const sampleCells = cells.slice(0, 5);
  sampleCells.forEach((cell) => {
    const currentCount = getCurrentCount(cell);
    console.log("[HUNTER][DEBUG] cell count", {
      cellId: cell.id,
      sigName: cell.sigName,
      currentCount,
      cell,
    });
  });
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [loading, cells, getCurrentCount, DEBUG_SHOW_COUNT]);

  if (loading) {
    return <div style={{ color: "#fff" }}>로딩 중...</div>;
  }

  return (
    <div className="hunter-root">
      <header className="hunter-header">
        <div className="hunter-header-row">
          <div className="hunter-mode-tabs">
            {HUNTER_MODES.map((m) => (
              <button
                key={m}
                className={
                  "hunter-tab" + (mode === m ? " hunter-tab--active" : "")
                }
                onClick={() => handleChangeMode(m)}
              >
                {MODE_LABELS[m] ?? m}
              </button>
            ))}
          </div>

          <div className="hunter-mode-tabs" style={{ marginLeft: 12 }}>
            {AVAILABLE_SIZES.map((s) => (
              <button
                key={s}
                className={
                  "hunter-tab" + (size === s ? " hunter-tab--active" : "")
                }
                onClick={() => handleChangeSize(s)}
              >
                {s}×{s}
              </button>
            ))}
          </div>
        </div>

        <h2 className="hunter-title-text">🎯 시그 땅따먹기 🎯</h2>
      </header>

      <div className="hunter-main">
        {/* 좌측: 보드 */}
        <div className="hunter-main-left">
          <div className="hunter-line-count-under-board">
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div>
                현재 점령된 줄: <span>{completedLineCount}</span> 줄
              </div>
              <div
                className={"hunter-status-pill hunter-status-pill--" + status}
                style={{ marginTop: 4 }}
              >
                현재 상태: {status} / 라운드: {roundDisplay}라운드
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className="hunter-reset-btn"
                onClick={handleResetBoard}
              >
                초기화
              </button>

              <button
                type="button"
                className="hunter-next-round-btn"
                onClick={() => {
                  setRoundDisplay((prev) => prev + 1);
                  startNextRound();
                }}
                disabled={!canStartNextRound}
              >
                다음 판 시작
              </button>

              <span
                style={{
                  fontSize: 16,
                  color: "#000",
                  lineHeight: 1.4,
                }}
              >
                *Alt+Shift+D → 닉네임
                <br />
                *Alt+Shift+F → 칸번호
              </span>
            </div>
          </div>

          {showSummaryBanner && lastSummary && (
            <div className="hunter-summary-banner">
              <div className="hunter-summary-main">
                <strong>이번 판 요약</strong>
                <div>
                  모드: {lastSummary.mode} / 그룹: {lastSummary.group} / 크기:{" "}
                  {lastSummary.size}×{lastSummary.size}
                </div>
                <div>
                  참여자:{" "}
                  {lastSummary.participants &&
                  lastSummary.participants.length > 0
                    ? lastSummary.participants.join(", ")
                    : "없음"}
                </div>
                <div>
                  MVP 후보:{" "}
                  {lastSummary.mvpCandidate
                    ? `${lastSummary.mvpCandidate.player} (${lastSummary.mvpCandidate.count}회 참여)`
                    : "없음"}
                </div>
                <div>
                  미참여자:{" "}
                  {lastSummary.nonParticipants &&
                  lastSummary.nonParticipants.length > 0
                    ? lastSummary.nonParticipants.join(", ") + " (−2,000점 예정)"
                    : "없음"}
                </div>
              </div>
              <div className="hunter-summary-actions">
                <button
                  type="button"
                  className="hunter-btn-outline"
                  onClick={handleCopySettlementText}
                >
                  문구 복사
                </button>
                <button
                  type="button"
                  className="hunter-btn-ghost"
                  onClick={() => setShowSummaryBanner(false)}
                >
                  닫기
                </button>
              </div>
            </div>
          )}

          <div
            className="hunter-grid"
            style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
          >
            {cells.slice(0, cellCount).map((cell) => {
              const currentImage = getCurrentImage(cell);
              if (!currentImage) {
                console.warn("[HUNTER] currentImage empty", {
                  cellId: cell.id,
                  sigName: cell.sigName,
                });
              }
              const currentCount = getCurrentCount(cell);

              const ownerColor = cell.owner
                ? getColorForPlayer(cell.owner)
                : null;

              const cellStyle = ownerColor
                ? { borderColor: ownerColor }
                : {};

              return (
                <div
                  key={cell.id}
                  className={getCellClasses(cell)}
                  style={cellStyle}
                  onClick={() => handleCellClick(cell)}
                >
                  <div className="hunter-cell-inner">
                    <div className="hunter-cell-front">
                      {currentImage && (
                        <div className="hunter-sig-image-wrap">
                          <img
                            src={currentImage}
                            alt={cell.sigName}
                            className="hunter-sig-image"
                            crossOrigin="anonymous"
                          />
                        </div>
                      )}
                    </div>

                    <div className="hunter-cell-back">
                      <div
                        className="hunter-cell-owner-area"
                        style={
                          ownerColor
                            ? { backgroundColor: ownerColor }
                            : {}
                        }
                      >
                        <div className="hunter-cell-owner-text">
                          {cell.owner || "미점령"}
                        </div>
                      </div>

                      <div className="hunter-cell-count-area">
                        <div
                          className="hunter-sig-count-back"
                          style={
                            DEBUG_SHOW_COUNT
                              ? {
                                  color: "#ffedd5",
                                  textShadow:
                                    "0 1px 2px rgba(0,0,0,0.7)",
                                  opacity: 1,
                                  position: "relative",
                                  zIndex: 5,
                                }
                              : undefined
                          }
                        >
                          {currentCount != null ? (
                            currentCount
                          ) : DEBUG_SHOW_COUNT ? (
                            `count?? (${cell?.sigName ?? "no-sig"})`
                          ) : (
                            "???"
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="hunter-main-right">
          <div className="hunter-sidebar-top">
            <div className="hunter-player-input-row">
              <label className="hunter-player-label">
                플레이어 닉네임:
                <input
                  type="text"
                  className="hunter-player-input"
                  value={currentPlayer}
                  onChange={(e) => setCurrentPlayer(e.target.value)}
                  placeholder="닉네임"
                  ref={playerInputRef}
                />
              </label>
              <div className="hunter-line-count">
                현재 <span>{completedLineCount}</span> 줄 점령 중
              </div>
            </div>

            <div
              className="hunter-cellno-row"
              style={{
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: "#e5e7eb",
                  fontSize: 13,
                }}
              >
                <span>칸 번호:</span>

                <div
                  className={
                    "hunter-cellno-wrapper" +
                    (targetCellNo
                      ? " hunter-cellno-wrapper--filled"
                      : "")
                  }
                  style={{ position: "relative", width: 70 }}
                >
                  <input
                    type="number"
                    min="1"
                    max={cellCount}
                    value={targetCellNo}
                    onChange={(e) => setTargetCellNo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        flipCellByNumber(targetCellNo);
                      }
                    }}
                    className="hunter-cellno-input"
                    style={{
                      width: "100%",
                      padding: "4px 6px",
                      borderRadius: 4,
                      border: "1px solid #e5e7eb",
                      fontSize: 18,
                      textAlign: "center",
                      backgroundColor: "#fff",
                      color: "#000",
                    }}
                    ref={cellNumberInputRef}
                  />
                  <span className="hunter-cellno-label">번호</span>
                </div>
              </label>

              <button
                type="button"
                onClick={() => flipCellByNumber(targetCellNo)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 10,
                  border: "1px solid #f97316",
                  background: "#111827",
                  color: "#f9fafb",
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                🎴 뒤집기
              </button>
            </div>
          </div>

          {/* 전체 인원 관리 */}
          <section className="hunter-panel-section">
            <h4 className="hunter-panel-title">
              전체 인원 관리 ({MODE_LABELS[mode]} / {group})
            </h4>

            {playersLoading ? (
              <div className="hunter-participants-empty">
                전체 인원 로딩 중...
              </div>
            ) : (
              <>
                <p className="hunter-panel-description">
                  전체 인원은 별도 팝업에서 관리합니다.
                  <br />
                  저장하면 미참여자 계산에 바로 반영됩니다.
                </p>

                <button
                  type="button"
                  className="hunter-btn-sm hunter-btn-primary"
                  onClick={openAllPlayersModal}
                >
                  전체 인원 입력 / 수정
                </button>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: "#9ca3af",
                  }}
                >
                  현재 인원 수: {(allPlayersByMode[mode] || []).length}명
                </div>
              </>
            )}
          </section>

          {/* 퀵 액션 */}
          <section className="hunter-panel-section">
            <h4 className="hunter-panel-title">퀵 액션</h4>
            <div className="hunter-quick-actions">
              <label className="hunter-toggle">
                <input
                  type="checkbox"
                  checked={highlightMvp}
                  onChange={(e) => setHighlightMvp(e.target.checked)}
                />
                <span>MVP 후보 하이라이트</span>
              </label>
              <label className="hunter-toggle">
                <input
                  type="checkbox"
                  checked={highlightNonParticipants}
                  onChange={(e) =>
                    setHighlightNonParticipants(e.target.checked)
                  }
                />
                <span>미참여자 상단 표시</span>
              </label>
            </div>
          </section>

          {/* 플레이어 점령 현황 */}
          <div className="hunter-player-territory-summary">
            <h4 className="hunter-player-territory-title">
              플레이어 점령 현황
            </h4>

            {Object.keys(playerTerritoryCounts).length === 0 ? (
              <div className="hunter-player-territory-empty">
                아직 점령된 칸이 없습니다.
              </div>
            ) : (
              <ul className="hunter-player-territory-list">
                {Object.entries(playerTerritoryCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([player, count], index) => {
                    const color = getColorForPlayer(player);
                    const rank = index + 1;
                    const isMvp =
                      localMvpCandidate &&
                      localMvpCandidate.player === player;

                    return (
                      <li
                        key={player}
                        className="hunter-player-territory-item"
                      >
                        <span className="hunter-player-territory-rank">
                          {rank}위
                        </span>
                        <span
                          className="hunter-player-territory-color-dot"
                          style={{ backgroundColor: color }}
                        />
                        <span className="hunter-player-territory-name">
                          {player}
                        </span>
                        <span className="hunter-player-territory-count">
                          {count}칸
                        </span>
                        {isMvp && (
                          <span className="hunter-player-mvp-badge">
                            MVP 후보
                          </span>
                        )}
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>

          {/* 참여자 */}
          <div className="hunter-participants-section">
            <div className="hunter-participants-header">
              <h4 className="hunter-participants-title">이번 판 참여자</h4>
              <button
                type="button"
                className="hunter-participants-copy-btn"
                onClick={handleCopyParticipants}
                disabled={localParticipants.length === 0}
              >
                참여자 복사
              </button>
            </div>

            {localParticipants.length === 0 ? (
              <div className="hunter-participants-empty">
                아직 참여한 플레이어가 없습니다.
              </div>
            ) : (
              <div className="hunter-participants-list">
                {localParticipants.map((p) => (
                  <span
                    key={p}
                    className="hunter-participants-chip"
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 미참여자 */}
          <section className="hunter-panel-section">
            <h4 className="hunter-panel-title">
              미참여자{" "}
              {localNonParticipants &&
              localNonParticipants.length > 0
                ? `(${localNonParticipants.length}명)`
                : ""}
            </h4>
            {(!localNonParticipants ||
              localNonParticipants.length === 0) && (
              <div className="hunter-participants-empty">
                전체 플레이어 정보가 없거나, 모두 참여했습니다.
              </div>
            )}
            {localNonParticipants &&
              localNonParticipants.length > 0 && (
                <div className="hunter-nonparticipants-list">
                  {localNonParticipants
                    .slice()
                    .sort()
                    .map((name) => (
                      <div
                        key={name}
                        className={
                          "hunter-nonparticipant-item" +
                          (highlightNonParticipants
                            ? " is-highlighted"
                            : "")
                        }
                      >
                        {name}
                      </div>
                    ))}
                </div>
              )}
          </section>

          {/* 결과용 */}
          <section className="hunter-panel-section">
            <div className="hunter-panel-header">
              <h4 className="hunter-panel-title">이번 판 결과</h4>
              <button
                type="button"
                className="hunter-btn-sm hunter-btn-primary"
                onClick={handleCopySettlementText}
              >
                결과 복사
              </button>
            </div>

            <pre className="hunter-settlement-preview">{settlementText}</pre>
          </section>

          {/* 줄 소유권 미니맵 */}
          <div className="hunter-lines-ownership">
            <h4 className="hunter-lines-ownership-title">
              줄 소유권 미니맵
            </h4>
            <div className="hunter-lines-ownership-list">
              {lineOwners.map((line, idx) => {
                const indicesForThisLine = lines[idx];
                const cellsForThisLine = indicesForThisLine
                  ? indicesForThisLine.map((i) => cells[i])
                  : [];

                const fullLineOwner = line.owner;
                const fullLineColor = fullLineOwner
                  ? getColorForPlayer(fullLineOwner)
                  : null;

                const lineLabel =
                  idx < size
                    ? `가로 ${idx + 1}`
                    : idx < size * 2
                      ? `세로 ${idx - (size - 1)}`
                      : idx === size * 2
                        ? "대각 ↘"
                        : "대각 ↙";

                return (
                  <div
                    key={idx}
                    className="hunter-line-mini"
                  >
                    <div className="hunter-line-mini-header">
                      <span className="hunter-line-mini-label">
                        {lineLabel}
                      </span>
                      <span
                        className={
                          "hunter-line-mini-owner" +
                          (fullLineOwner
                            ? ""
                            : " hunter-line-mini-owner--empty")
                        }
                        style={
                          fullLineOwner && fullLineColor
                            ? {
                                backgroundColor: fullLineColor,
                                color: "#fff",
                              }
                            : {}
                        }
                      >
                        {fullLineOwner || "미점령"}
                      </span>
                    </div>

                    <div className="hunter-line-mini-strip">
                      {cellsForThisLine.map((cell, i) => {
                        const ownerName = cell?.owner || null;
                        const color = ownerName
                          ? getColorForPlayer(ownerName)
                          : null;

                        return (
                          <div
                            key={i}
                            className="hunter-line-mini-cell"
                            style={
                              ownerName && color
                                ? { backgroundColor: color }
                                : {}
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 로그 */}
          <section className="hunter-log-section">
            <h3 className="hunter-log-title">로그</h3>
            <div className="hunter-log-list">
              {logs.length === 0 && (
                <div className="hunter-log-empty">
                  아직 로그가 없습니다.
                </div>
              )}
              {logs
                .slice()
                .reverse()
                .map((log) => {
                  const color = log.actor
                    ? playerColors[log.actor] ||
                      getColorForPlayer(log.actor)
                    : null;

                  return (
                    <div
                      key={`${log.time}-${log.cellId}`}
                      className="hunter-log-item"
                      style={
                        color
                          ? { borderLeft: `4px solid ${color}` }
                          : {}
                      }
                    >
                      <span className="hunter-log-time">
                        {new Date(log.time).toLocaleTimeString()}
                      </span>
                      <span className="hunter-log-text">
                        [{log.actor}] 님이{" "}
                        {log.prevOwner
                          ? `${log.prevOwner} 님에게서 `
                          : ""}
                        {log.sigName} ({log.sigCount}점) 칸을
                        {log.prevOwner
                          ? " 뺏었습니다."
                          : " 점령했습니다."}
                      </span>
                    </div>
                  );
                })}
            </div>
          </section>

          {/* 전체 인원 입력 모달 */}
          {isAllPlayersModalOpen && (
            <div
              className="hunter-modal-backdrop"
              onClick={closeAllPlayersModal}
            >
              <div
                className="hunter-modal-container"
                onClick={(e) => e.stopPropagation()}
              >
                <header className="hunter-modal-header">
                  <h2 className="hunter-modal-title">
                    전체 인원 입력 ({MODE_LABELS[mode]} / {group})
                  </h2>
                  <button
                    type="button"
                    className="hunter-modal-close"
                    onClick={closeAllPlayersModal}
                  >
                    ✕
                  </button>
                </header>

                <p className="hunter-modal-description">
                  한 줄에 한 명씩 입력해 주세요.
                  <br />
                  저장 시 미참여자 · 정산 문구에 바로 반영됩니다.
                </p>

                <textarea
                  className="hunter-modal-textarea"
                  rows={14}
                  value={allPlayersInput}
                  onChange={(e) => setAllPlayersInput(e.target.value)}
                  placeholder={"예)\n지안\n홍길동\n김코딩"}
                />

                <div className="hunter-modal-footer">
                  <button
                    type="button"
                    className="hunter-modal-btn hunter-modal-btn-secondary"
                    onClick={closeAllPlayersModal}
                    disabled={playersSaving}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className="hunter-modal-btn hunter-modal-btn-primary"
                    onClick={async () => {
                      await handleSaveAllPlayers();
                      closeAllPlayersModal();
                    }}
                    disabled={playersSaving}
                  >
                    {playersSaving ? "저장 중..." : "전체 인원 저장"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}