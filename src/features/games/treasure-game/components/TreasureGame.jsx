import { useState, useEffect, useRef, useCallback } from "react";

const DEFAULT_ITEMS = [
  { id: 1, label: "꽝",        count: 44, isTreasure: false },
  { id: 2, label: "기여도 2배", count: 3,  isTreasure: true  },
  { id: 3, label: "기여도 3배", count: 2,  isTreasure: true  },
  { id: 4, label: "보물 🎁",   count: 1,  isTreasure: true  },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCells(totalCount, items) {
  const pool = [];
  items.forEach((item) => {
    for (let i = 0; i < item.count; i++) pool.push(item);
  });
  const fallback = items.find((it) => !it.isTreasure) || items[0];
  while (pool.length < totalCount) pool.push(fallback);
  return shuffle(pool.slice(0, totalCount)).map((item, idx) => ({
    cellId: idx,
    item,
    opened: false,
  }));
}

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const g = ctx.createGain();
    g.connect(ctx.destination);
    if (type === "treasure") {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = freq;
        o.connect(g);
        g.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.12);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
        o.start(ctx.currentTime + i * 0.12);
        o.stop(ctx.currentTime + i * 0.12 + 0.3);
      });
    } else {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(200, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.4);
      o.connect(g);
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      o.start(ctx.currentTime);
      o.stop(ctx.currentTime + 0.4);
    }
  } catch (_) {}
}

function Confetti() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      w: Math.random() * 10 + 5,
      h: Math.random() * 6 + 3,
      color: `hsl(${Math.random() * 360},90%,60%)`,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 4 + 2,
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 6,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 9999 }}
    />
  );
}

// ── 셀: 번호 행 + 이미지 행을 별도로 분리 (레퍼런스 스타일) ──
function VaultCell({ cell, onOpen, disabled, shaking }) {
  const isTreasure = cell.item?.isTreasure;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        border: "1px solid #1a8c1a",
        background: "#050f05",
        animation: shaking ? "shake 0.4s ease" : "none",
        cursor: cell.opened || disabled ? "default" : "pointer",
        userSelect: "none",
        overflow: "hidden",
      }}
      onClick={() => !cell.opened && !disabled && onOpen(cell.cellId)}
    >
      {/* 번호 행 */}
      <div style={{
        background: "#0a1a0a",
        borderBottom: "1px solid #1a8c1a",
        textAlign: "center",
        fontSize: "clamp(11px, 1.4vw, 20px)",
        fontWeight: 700,
        color: "#e0e0e0",
        padding: "3px 0",
        lineHeight: 1.2,
      }}>
        {cell.cellId + 1}
      </div>

      {/* 이미지/결과 행 */}
      <div style={{
        flex: 1,
        perspective: "600px",
        position: "relative",
        // 정사각형 비율 유지
        aspectRatio: "1 / 1",
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
          transition: "transform 0.5s ease",
          transform: cell.opened ? "rotateY(180deg)" : "rotateY(0deg)",
        }}>
          {/* 앞면: 보물상자 */}
          <div style={{
            position: "absolute", inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background: "#050f05",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <img
              src="/images/rewardchest/RewardChest.png"
              alt="보물상자"
              style={{
                width: "86%",
                height: "86%",
                objectFit: "contain",
                filter: "drop-shadow(0 0 6px rgba(255,200,0,0.85))",
              }}
            />
          </div>

          {/* 뒷면: 결과 */}
          <div style={{
            position: "absolute", inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: isTreasure
              ? "linear-gradient(145deg, #1a0033, #4b0082)"
              : "linear-gradient(145deg, #1a0000, #2d0000)",
            border: isTreasure ? "2px solid #ffd700" : "none",
            boxShadow: isTreasure ? "0 0 16px rgba(255,215,0,0.7)" : "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}>
            {isTreasure ? (
              <>
                <div style={{ fontSize: "clamp(14px, 2vw, 28px)", lineHeight: 1 }}>✨</div>
                <div style={{
                  fontSize: "clamp(10px, 1.3vw, 18px)",
                  color: "#ffd700",
                  fontWeight: 800,
                  textAlign: "center",
                  lineHeight: 1.3,
                  wordBreak: "keep-all",
                  padding: "0 4px",
                }}>
                  {cell.item?.label}
                </div>
              </>
            ) : (
              <div style={{
                fontSize: "clamp(16px, 2.4vw, 32px)",
                color: "#ff3333",
                fontWeight: 900,
              }}>
                꽝
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TreasureGame() {
  const [tab, setTab] = useState("game");
  const [totalCount, setTotalCount] = useState(50);
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [cells, setCells] = useState(() => buildCells(50, DEFAULT_ITEMS));
  const [banner, setBanner] = useState("누적 5천개 : 열쇠 1매 / 한방 1만개 이상 : 열쇠 3개");
  const [editingBanner, setEditingBanner] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [overlay, setOverlay] = useState(null);
  const [shakeId, setShakeId] = useState(null);
  const [draftItems, setDraftItems] = useState(DEFAULT_ITEMS);
  const [draftTotal, setDraftTotal] = useState(50);

  const totalTreasure = items.filter((i) => i.isTreasure).reduce((s, i) => s + i.count, 0);
  const treasureFound = cells.filter((c) => c.opened && c.item.isTreasure).length;
  const allTreasureFound = treasureFound >= totalTreasure;

  const resetGame = useCallback(() => {
    setCells(buildCells(totalCount, items));
    setOverlay(null);
    setShowConfetti(false);
  }, [totalCount, items]);

  const applySettings = () => {
    const total = draftItems.reduce((s, i) => s + i.count, 0);
    if (total > draftTotal) {
      alert(`아이템 총 개수(${total})가 금고 개수(${draftTotal})를 초과합니다.`);
      return;
    }
    setItems(draftItems);
    setTotalCount(draftTotal);
    setCells(buildCells(draftTotal, draftItems));
    setOverlay(null);
    setShowConfetti(false);
    setTab("game");
  };

  const handleOpen = (cellId) => {
    const cell = cells[cellId];
    if (cell.opened) return;
    setCells((prev) =>
      prev.map((c) => (c.cellId === cellId ? { ...c, opened: true } : c))
    );
    if (cell.item.isTreasure) {
      playSound("treasure");
      setShowConfetti(true);
      setOverlay({ label: cell.item.label, isTreasure: true });
      setTimeout(() => setShowConfetti(false), 3000);
      setTimeout(() => setOverlay(null), 3000);
    } else {
      playSound("miss");
      setShakeId(cellId);
      setTimeout(() => setShakeId(null), 500);
      setOverlay({ label: "꽝!", isTreasure: false });
      setTimeout(() => setOverlay(null), 1200);
    }
  };

  const shuffleUnopened = () => {
    setCells((prev) => {
      const unopened = shuffle(prev.filter((c) => !c.opened));
      const merged = [...prev];
      let ui = 0;
      merged.forEach((_, i) => {
        if (!merged[i].opened) {
          merged[i] = { ...unopened[ui], cellId: merged[i].cellId };
          ui++;
        }
      });
      return merged;
    });
  };

  const updateDraftItem = (id, field, value) =>
    setDraftItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  const addDraftItem = () =>
    setDraftItems((prev) => [
      ...prev,
      { id: Date.now(), label: "새 항목", count: 1, isTreasure: false },
    ]);
  const removeDraftItem = (id) =>
    setDraftItems((prev) => prev.filter((it) => it.id !== id));
  const openSettings = () => {
    setDraftItems(items.map((i) => ({ ...i })));
    setDraftTotal(totalCount);
    setTab("settings");
  };

  // 50개 → 6열 (레퍼런스 기준)
  const COLS = totalCount <= 24 ? 4 : totalCount <= 36 ? 6 : 6;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      color: "#fff",
      fontFamily: "'Noto Sans KR', sans-serif",
      padding: "16px 20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      boxSizing: "border-box",
    }}>
      {showConfetti && <Confetti />}

      {/* 결과 오버레이 */}
      {overlay && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.6)",
        }}>
          <div style={{
            background: overlay.isTreasure
              ? "linear-gradient(135deg, #1a0033, #4b0082)"
              : "linear-gradient(135deg, #1a0000, #3d0000)",
            border: overlay.isTreasure ? "4px solid #ffd700" : "4px solid #ff4444",
            borderRadius: 24,
            padding: "56px 80px",
            textAlign: "center",
            boxShadow: overlay.isTreasure
              ? "0 0 80px rgba(255,215,0,0.8)"
              : "0 0 60px rgba(255,0,0,0.5)",
            animation: "popIn 0.3s ease",
          }}>
            <div style={{ fontSize: 80 }}>{overlay.isTreasure ? "🎉" : "💥"}</div>
            <div style={{
              fontSize: 48, fontWeight: 900, marginTop: 16,
              color: overlay.isTreasure ? "#ffd700" : "#ff4444",
            }}>
              {overlay.label}
            </div>
          </div>
        </div>
      )}

      {/* ── 헤더 ── */}
      <div style={{
        width: "100%",
        maxWidth: 1400,
        marginBottom: 12,
        background: "linear-gradient(90deg, #0a0a2e, #1a0033, #0a0a2e)",
        border: "2px solid #ffd700",
        borderRadius: 14,
        padding: "14px 24px",
        boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <h1 style={{
            margin: 0,
            fontSize: "clamp(24px, 3vw, 40px)",
            fontWeight: 900,
            background: "linear-gradient(90deg, #ffd700, #fff700, #ffd700)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: 3,
          }}>
            보물을 찾아라!
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={shuffleUnopened} style={btnStyle("#222", "#ffd700")}>🔀 섞기</button>
            <button onClick={resetGame}       style={btnStyle("#222", "#ffd700")}>🔄 리셋</button>
            <button onClick={openSettings}    style={btnStyle("#4b0082", "#ffd700")}>⚙️ 설정</button>
          </div>
        </div>

        {/* 배너 */}
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
          {editingBanner ? (
            <input
              autoFocus
              value={banner}
              onChange={(e) => setBanner(e.target.value)}
              onBlur={() => setEditingBanner(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingBanner(false)}
              style={{
                flex: 1, background: "transparent",
                border: "1px solid #ffd700",
                color: "#ffd700", fontSize: 17,
                padding: "4px 8px", borderRadius: 4,
              }}
            />
          ) : (
            <span style={{ color: "#ffd700", fontSize: 17, fontWeight: 700 }}>{banner}</span>
          )}
          <button
            onClick={() => setEditingBanner(true)}
            style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 18 }}
          >✏️</button>
        </div>

        {/* 진행 현황 */}
        <div style={{ marginTop: 8, display: "flex", gap: 20, fontSize: 16, color: "#ccc", flexWrap: "wrap" }}>
          <span>💎 보물 발견: <b style={{ color: "#ffd700" }}>{treasureFound} / {totalTreasure}</b></span>
          <span>📦 열린 금고: <b>{cells.filter((c) => c.opened).length} / {totalCount}</b></span>
          {allTreasureFound && (
            <span style={{ color: "#ffd700", fontWeight: 800 }}>🎊 모든 보물 발견! 리셋해주세요.</span>
          )}
        </div>
      </div>

      {/* ── 게임 그리드 ── */}
      {tab === "game" && (
        <div style={{
          width: "100%",
          maxWidth: 1400,
          background: "#050f05",
          border: "3px solid #1a8c1a",
          borderRadius: 10,
          // 외곽 테두리만 표시, 셀 간격은 border-collapse처럼
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          // 셀끼리 선이 겹치도록 gap 0, 셀 자체에 border
          gap: 0,
          overflow: "hidden",
        }}>
          {cells.map((cell) => (
            <VaultCell
              key={cell.cellId}
              cell={cell}
              onOpen={handleOpen}
              disabled={allTreasureFound}
              shaking={shakeId === cell.cellId}
            />
          ))}
        </div>
      )}

      {/* ── 설정 탭 ── */}
      {tab === "settings" && (
        <div style={{
          width: "100%", maxWidth: 1400,
          background: "#111",
          border: "2px solid #ffd700",
          borderRadius: 12,
          padding: 24,
          boxSizing: "border-box",
        }}>
          <h2 style={{ color: "#ffd700", marginTop: 0, fontSize: 24 }}>⚙️ 게임 설정</h2>

          <div style={{ marginBottom: 24 }}>
            <label style={{ color: "#ccc", fontSize: 16 }}>
              금고 개수: <b style={{ color: "#ffd700" }}>{draftTotal}개</b>
            </label>
            <input
              type="range" min={10} max={50} value={draftTotal}
              onChange={(e) => setDraftTotal(Number(e.target.value))}
              style={{ display: "block", width: "100%", marginTop: 8, accentColor: "#ffd700" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", color: "#666", fontSize: 13 }}>
              <span>10</span><span>20</span><span>30</span><span>40</span><span>50</span>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: "#ccc", fontSize: 16, marginBottom: 10 }}>
              결과 항목 설정
              <span style={{ marginLeft: 12, fontSize: 14, color: "#888" }}>
                총 {draftItems.reduce((s, i) => s + i.count, 0)}개 / 금고 {draftTotal}개
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {draftItems.map((item) => (
                <div key={item.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "#1a1a1a", borderRadius: 8, padding: "10px 14px",
                  border: item.isTreasure ? "1px solid #ffd700" : "1px solid #444",
                }}>
                  <button
                    onClick={() => updateDraftItem(item.id, "isTreasure", !item.isTreasure)}
                    style={{
                      background: item.isTreasure ? "#ffd700" : "#444",
                      color: item.isTreasure ? "#000" : "#fff",
                      border: "none", borderRadius: 6, padding: "6px 12px",
                      fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
                    }}
                  >
                    {item.isTreasure ? "💎 보물" : "💀 꽝"}
                  </button>
                  <input
                    value={item.label}
                    onChange={(e) => updateDraftItem(item.id, "label", e.target.value)}
                    placeholder="항목명"
                    style={{
                      flex: 1, background: "#2a2a2a", border: "1px solid #555",
                      color: "#fff", borderRadius: 6, padding: "6px 10px", fontSize: 15,
                    }}
                  />
                  <input
                    type="number" min={0} value={item.count}
                    onChange={(e) => updateDraftItem(item.id, "count", Math.max(0, Number(e.target.value)))}
                    style={{
                      width: 70, background: "#2a2a2a", border: "1px solid #555",
                      color: "#ffd700", borderRadius: 6, padding: "6px 8px",
                      fontSize: 15, textAlign: "center",
                    }}
                  />
                  <span style={{ color: "#888", fontSize: 14 }}>개</span>
                  <button
                    onClick={() => removeDraftItem(item.id)}
                    style={{
                      background: "#3d0000", border: "1px solid #ff4444",
                      color: "#ff4444", borderRadius: 6, padding: "6px 10px",
                      fontSize: 14, cursor: "pointer",
                    }}
                  >✕</button>
                </div>
              ))}
            </div>
            <button onClick={addDraftItem} style={{
              marginTop: 12, background: "#1a3300", border: "1px dashed #00aa00",
              color: "#00aa00", borderRadius: 8, padding: "10px 16px",
              fontSize: 15, cursor: "pointer", width: "100%",
            }}>
              + 항목 추가
            </button>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button onClick={applySettings} style={{
              flex: 1, background: "linear-gradient(90deg, #b8860b, #ffd700)",
              border: "none", borderRadius: 8, padding: "14px",
              color: "#000", fontWeight: 900, fontSize: 17, cursor: "pointer",
            }}>
              ✅ 설정 적용 &amp; 게임 시작
            </button>
            <button onClick={() => setTab("game")} style={{
              background: "#333", border: "1px solid #666",
              borderRadius: 8, padding: "14px 24px",
              color: "#ccc", fontSize: 16, cursor: "pointer",
            }}>
              취소
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes popIn {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-8px); }
          40%     { transform: translateX(8px); }
          60%     { transform: translateX(-5px); }
          80%     { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}

function btnStyle(bg, border) {
  return {
    background: bg,
    border: `1px solid ${border}`,
    color: border,
    borderRadius: 6,
    padding: "9px 18px",
    fontSize: 15,
    cursor: "pointer",
    fontWeight: 700,
  };
}