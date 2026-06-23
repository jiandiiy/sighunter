
import { useState, useEffect, useRef, useCallback } from "react";

// ── 기본 설정값 ──────────────────────────────────────────
const DEFAULT_ITEMS = [
  { id: 1, label: "꽝",       count: 44, isTreasure: false },
  { id: 2, label: "기여도 2배", count: 3,  isTreasure: true  },
  { id: 3, label: "기여도 3배", count: 2,  isTreasure: true  },
  { id: 4, label: "보물 🎁",   count: 1,  isTreasure: true  },
];

// ── 유틸 ─────────────────────────────────────────────────
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
  // 부족하면 첫 번째 꽝 아이템으로 채움
  const fallback = items.find((it) => !it.isTreasure) || items[0];
  while (pool.length < totalCount) pool.push(fallback);
  return shuffle(pool.slice(0, totalCount)).map((item, idx) => ({
    cellId: idx,
    item,
    opened: false,
    flipping: false,
  }));
}

// ── 사운드 (Web Audio API) ────────────────────────────────
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

// ── 컨페티 ───────────────────────────────────────────────
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
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
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

// ── 금고 셀 ──────────────────────────────────────────────
function VaultCell({ cell, onOpen, disabled }) {
  const isTreasure = cell.item?.isTreasure;
  return (
    <div
      onClick={() => !cell.opened && !disabled && onOpen(cell.cellId)}
      style={{
        perspective: "600px",
        cursor: cell.opened || disabled ? "default" : "pointer",
        userSelect: "none",
      }}
    >
      <div
        style={{
          width: "100%",
          paddingBottom: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          transition: "transform 0.5s ease",
          transform: cell.opened ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* 앞면: 금고 */}
        <div
          style={{
            position: "absolute", inset: 0, backfaceVisibility: "hidden",
            background: "linear-gradient(145deg, #b8860b, #ffd700, #b8860b)",
            borderRadius: 8, border: "2px solid #ffd700",
            boxShadow: "0 0 8px rgba(255,215,0,0.6), inset 0 2px 4px rgba(255,255,255,0.3)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 2,
          }}
        >
          {/* 금고 아이콘 */}
          <div style={{ fontSize: "clamp(14px, 3vw, 28px)", lineHeight: 1 }}>🏆</div>
          <div style={{ fontSize: "clamp(7px, 1.2vw, 11px)", color: "#3d2000", fontWeight: 700 }}>
            {cell.cellId + 1}
          </div>
        </div>

        {/* 뒷면: 결과 */}
        <div
          style={{
            position: "absolute", inset: 0, backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: 8,
            background: isTreasure
              ? "linear-gradient(145deg, #1a0033, #4b0082)"
              : "linear-gradient(145deg, #1a1a1a, #333)",
            border: isTreasure ? "2px solid #ffd700" : "2px solid #555",
            boxShadow: isTreasure ? "0 0 16px rgba(255,215,0,0.8)" : "none",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", padding: 4,
          }}
        >
          {isTreasure ? (
            <>
              <div style={{ fontSize: "clamp(10px, 2vw, 18px)" }}>✨</div>
              <div style={{
                fontSize: "clamp(6px, 1vw, 10px)", color: "#ffd700",
                fontWeight: 800, textAlign: "center", lineHeight: 1.2,
              }}>
                {cell.item?.label}
              </div>
            </>
          ) : (
            <div style={{
              fontSize: "clamp(10px, 2vw, 18px)", color: "#ff4444",
              fontWeight: 900,
            }}>
              꽝
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────
export default function TreasureGame() {
  const [tab, setTab] = useState("game"); // "game" | "settings"
  const [totalCount, setTotalCount] = useState(50);
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [cells, setCells] = useState(() => buildCells(50, DEFAULT_ITEMS));
  const [banner, setBanner] = useState("누적 5천개 : 열쇠 1매 / 한방 1만개 이상 : 열쇠 3개");
  const [editingBanner, setEditingBanner] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [overlay, setOverlay] = useState(null); // { label, isTreasure }
  const [shakeId, setShakeId] = useState(null);
  const [draftItems, setDraftItems] = useState(DEFAULT_ITEMS);
  const [draftTotal, setDraftTotal] = useState(50);

  // 총 아이템 수 계산
  const totalItemCount = items.reduce((s, i) => s + i.count, 0);
  const treasureFound = cells.filter((c) => c.opened && c.item.isTreasure).length;
  const totalTreasure = items.filter((i) => i.isTreasure).reduce((s, i) => s + i.count, 0);
  const allTreasureFound = treasureFound >= totalTreasure;

  // 게임 초기화
  const resetGame = useCallback(() => {
    setCells(buildCells(totalCount, items));
    setOverlay(null);
    setShowConfetti(false);
  }, [totalCount, items]);

  // 설정 적용
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

  // 셀 클릭
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

  // 열리지 않은 셀 섞기
  const shuffleUnopened = () => {
    setCells((prev) => {
      const opened = prev.filter((c) => c.opened);
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

  // 드래프트 아이템 수정
  const updateDraftItem = (id, field, value) => {
    setDraftItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };
  const addDraftItem = () => {
    const newId = Date.now();
    setDraftItems((prev) => [...prev, { id: newId, label: "새 항목", count: 1, isTreasure: false }]);
  };
  const removeDraftItem = (id) => {
    setDraftItems((prev) => prev.filter((it) => it.id !== id));
  };

  // 설정 탭 열 때 드래프트 동기화
  const openSettings = () => {
    setDraftItems(items.map((i) => ({ ...i })));
    setDraftTotal(totalCount);
    setTab("settings");
  };

  // 컬럼 수 계산
  const cols = totalCount <= 20 ? 5 : totalCount <= 30 ? 6 : totalCount <= 40 ? 8 : 10;

  return (
    <div style={{
      minHeight: "100vh", background: "#000", color: "#fff",
      fontFamily: "'Noto Sans KR', sans-serif", padding: "12px",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      {/* 컨페티 */}
      {showConfetti && <Confetti />}

      {/* 오버레이 */}
      {overlay && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.55)",
        }}>
          <div style={{
            background: overlay.isTreasure
              ? "linear-gradient(135deg, #1a0033, #4b0082)"
              : "linear-gradient(135deg, #1a0000, #3d0000)",
            border: overlay.isTreasure ? "3px solid #ffd700" : "3px solid #ff4444",
            borderRadius: 20, padding: "40px 60px", textAlign: "center",
            boxShadow: overlay.isTreasure
              ? "0 0 60px rgba(255,215,0,0.8)"
              : "0 0 40px rgba(255,0,0,0.5)",
            animation: "popIn 0.3s ease",
          }}>
            <div style={{ fontSize: 60 }}>{overlay.isTreasure ? "🎉" : "💥"}</div>
            <div style={{
              fontSize: 36, fontWeight: 900,
              color: overlay.isTreasure ? "#ffd700" : "#ff4444",
              marginTop: 12,
            }}>
              {overlay.label}
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div style={{
        width: "100%", maxWidth: 900, marginBottom: 8,
        background: "linear-gradient(90deg, #0a0a2e, #1a0033, #0a0a2e)",
        border: "2px solid #ffd700", borderRadius: 12,
        padding: "10px 16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{
            margin: 0, fontSize: "clamp(18px, 4vw, 28px)", fontWeight: 900,
            background: "linear-gradient(90deg, #ffd700, #fff700, #ffd700)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            textShadow: "none", letterSpacing: 2,
          }}>
            SOL 보물을 찾아라!
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={shuffleUnopened} style={btnStyle("#333", "#ffd700")}>🔀 섞기</button>
            <button onClick={resetGame} style={btnStyle("#333", "#ffd700")}>🔄 리셋</button>
            <button onClick={openSettings} style={btnStyle("#4b0082", "#ffd700")}>⚙️ 설정</button>
          </div>
        </div>

        {/* 배너 */}
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
          {editingBanner ? (
            <input
              autoFocus
              value={banner}
              onChange={(e) => setBanner(e.target.value)}
              onBlur={() => setEditingBanner(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingBanner(false)}
              style={{
                flex: 1, background: "transparent", border: "1px solid #ffd700",
                color: "#ffd700", fontSize: 13, padding: "2px 6px", borderRadius: 4,
              }}
            />
          ) : (
            <span style={{ color: "#ffd700", fontSize: 13, fontWeight: 700 }}>{banner}</span>
          )}
          <button
            onClick={() => setEditingBanner(true)}
            style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 14 }}
          >✏️</button>
        </div>

        {/* 진행 현황 */}
        <div style={{ marginTop: 6, display: "flex", gap: 12, fontSize: 12, color: "#ccc" }}>
          <span>💎 보물 발견: <b style={{ color: "#ffd700" }}>{treasureFound} / {totalTreasure}</b></span>
          <span>📦 열린 금고: <b>{cells.filter((c) => c.opened).length} / {totalCount}</b></span>
          {allTreasureFound && (
            <span style={{ color: "#ffd700", fontWeight: 800 }}>🎊 모든 보물 발견! 리셋 해주세요.</span>
          )}
        </div>
      </div>

      {/* 게임 탭 */}
      {tab === "game" && (
        <div style={{
          width: "100%", maxWidth: 900,
          background: "linear-gradient(180deg, #0a1a0a, #001a00)",
          border: "2px solid #00aa00", borderRadius: 12, padding: 12,
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 6,
        }}>
          {cells.map((cell) => (
            <div
              key={cell.cellId}
              style={{
                animation: shakeId === cell.cellId ? "shake 0.4s ease" : "none",
              }}
            >
              <VaultCell
                cell={cell}
                onOpen={handleOpen}
                disabled={allTreasureFound}
              />
            </div>
          ))}
        </div>
      )}

      {/* 설정 탭 */}
      {tab === "settings" && (
        <div style={{
          width: "100%", maxWidth: 900,
          background: "#111", border: "2px solid #ffd700",
          borderRadius: 12, padding: 20,
        }}>
          <h2 style={{ color: "#ffd700", marginTop: 0 }}>⚙️ 게임 설정</h2>

          {/* 금고 개수 */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: "#ccc", fontSize: 14 }}>
              금고 개수: <b style={{ color: "#ffd700" }}>{draftTotal}개</b>
            </label>
            <input
              type="range" min={10} max={50} value={draftTotal}
              onChange={(e) => setDraftTotal(Number(e.target.value))}
              style={{ display: "block", width: "100%", marginTop: 6, accentColor: "#ffd700" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", color: "#666", fontSize: 11 }}>
              <span>10</span><span>20</span><span>30</span><span>40</span><span>50</span>
            </div>
          </div>

          {/* 아이템 목록 */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: "#ccc", fontSize: 14, marginBottom: 8 }}>
              결과 항목 설정
              <span style={{ marginLeft: 12, fontSize: 12, color: "#888" }}>
                총 {draftItems.reduce((s, i) => s + i.count, 0)}개 / 금고 {draftTotal}개
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {draftItems.map((item) => (
                <div key={item.id} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "#1a1a1a", borderRadius: 8, padding: "8px 12px",
                  border: item.isTreasure ? "1px solid #ffd700" : "1px solid #444",
                }}>
                  {/* 보물/꽝 토글 */}
                  <button
                    onClick={() => updateDraftItem(item.id, "isTreasure", !item.isTreasure)}
                    style={{
                      background: item.isTreasure ? "#ffd700" : "#444",
                      color: item.isTreasure ? "#000" : "#fff",
                      border: "none", borderRadius: 6, padding: "4px 8px",
                      fontSize: 11, cursor: "pointer", whiteSpace: "nowrap",
                    }}
                  >
                    {item.isTreasure ? "💎 보물" : "💀 꽝"}
                  </button>

                  {/* 텍스트 */}
                  <input
                    value={item.label}
                    onChange={(e) => updateDraftItem(item.id, "label", e.target.value)}
                    placeholder="항목명"
                    style={{
                      flex: 1, background: "#2a2a2a", border: "1px solid #555",
                      color: "#fff", borderRadius: 6, padding: "4px 8px", fontSize: 13,
                    }}
                  />

                  {/* 개수 */}
                  <input
                    type="number" min={0} value={item.count}
                    onChange={(e) => updateDraftItem(item.id, "count", Math.max(0, Number(e.target.value)))}
                    style={{
                      width: 60, background: "#2a2a2a", border: "1px solid #555",
                      color: "#ffd700", borderRadius: 6, padding: "4px 6px",
                      fontSize: 13, textAlign: "center",
                    }}
                  />
                  <span style={{ color: "#888", fontSize: 12 }}>개</span>

                  {/* 삭제 */}
                  <button
                    onClick={() => removeDraftItem(item.id)}
                    style={{
                      background: "#3d0000", border: "1px solid #ff4444",
                      color: "#ff4444", borderRadius: 6, padding: "4px 8px",
                      fontSize: 12, cursor: "pointer",
                    }}
                  >✕</button>
                </div>
              ))}
            </div>

            <button onClick={addDraftItem} style={{
              marginTop: 10, background: "#1a3300", border: "1px dashed #00aa00",
              color: "#00aa00", borderRadius: 8, padding: "8px 16px",
              fontSize: 13, cursor: "pointer", width: "100%",
            }}>
              + 항목 추가
            </button>
          </div>

          {/* 적용 / 취소 */}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={applySettings} style={{
              flex: 1, background: "linear-gradient(90deg, #b8860b, #ffd700)",
              border: "none", borderRadius: 8, padding: "12px",
              color: "#000", fontWeight: 900, fontSize: 15, cursor: "pointer",
            }}>
              ✅ 설정 적용 & 게임 시작
            </button>
            <button onClick={() => setTab("game")} style={{
              background: "#333", border: "1px solid #666",
              borderRadius: 8, padding: "12px 20px",
              color: "#ccc", fontSize: 14, cursor: "pointer",
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
          20%     { transform: translateX(-6px); }
          40%     { transform: translateX(6px); }
          60%     { transform: translateX(-4px); }
          80%     { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}

function btnStyle(bg, border) {
  return {
    background: bg, border: `1px solid ${border}`,
    color: border, borderRadius: 6, padding: "5px 10px",
    fontSize: 12, cursor: "pointer", fontWeight: 700,
  };
}
