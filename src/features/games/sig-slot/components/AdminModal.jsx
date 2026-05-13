import { useState } from "react";

// ─────────────────────────────────────────────
// 아이콘 선택기
// ─────────────────────────────────────────────
const REWARD_ICONS = ["🎁","💰","🔑","⭐","💎","🏆","🎖️","🎀","🌟","🔥","💫","🎊","🎯","🪙","📦"];

function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-lg bg-gray-700 hover:bg-gray-600 text-lg flex items-center justify-center transition"
      >{value || "🎁"}</button>
      {open && (
        <div className="absolute z-50 top-10 left-0 bg-gray-800 border border-gray-600 rounded-xl p-2 grid grid-cols-5 gap-1 shadow-2xl">
          {REWARD_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => { onChange(icon); setOpen(false); }}
              className={`text-lg w-8 h-8 rounded-lg hover:bg-gray-600 transition ${
                value === icon ? "bg-purple-700" : ""
              }`}
            >{icon}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 관리자 보상 설정 모달
// ─────────────────────────────────────────────
export function AdminModal({ program, programKey, rewardsMap, onSave, onClose, saveRewardsToFirestore }) {
  const [localRewards, setLocalRewards] = useState(() =>
    JSON.parse(JSON.stringify(rewardsMap[program] || []))
  );
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | success | error
  const [saveMsg,    setSaveMsg]    = useState("");

  const total = localRewards.reduce((s, r) => s + r.probability, 0);
  const isValid = total === 100 && localRewards.every((r) => r.name.trim());

  // ── 항목 조작
  const update = (i, field, val) =>
    setLocalRewards((prev) =>
      prev.map((r, j) =>
        j === i ? { ...r, [field]: field === "probability" ? Math.max(0, Number(val)) : val } : r
      )
    );
  const add = () =>
    setLocalRewards((prev) => [
      ...prev,
      { id: `r${Date.now()}`, icon: "🎁", name: "", description: "", probability: 0 },
    ]);
  const remove = (i) => setLocalRewards((prev) => prev.filter((_, j) => j !== i));
  const moveUp = (i) => {
    if (i === 0) return;
    setLocalRewards((prev) => {
      const next = [...prev];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  };
  const moveDown = (i) => {
    setLocalRewards((prev) => {
      if (i === prev.length - 1) return prev;
      const next = [...prev];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next;
    });
  };

  // ── 확률 자동 맞춤 (나머지를 마지막 항목에 배분)
  const autoFit = () => {
    if (localRewards.length === 0) return;
    setLocalRewards((prev) => {
      const base = Math.floor(100 / prev.length);
      const rem  = 100 - base * prev.length;
      return prev.map((r, i) => ({
        ...r,
        probability: i === prev.length - 1 ? base + rem : base,
      }));
    });
  };

  // ── 저장
  const handleSave = async () => {
    setSaveStatus("saving");
    setSaveMsg("");
    try {
      await saveRewardsToFirestore(programKey, localRewards);
      onSave(program, localRewards);
      setSaveStatus("success");
      setSaveMsg("Firestore에 저장됐습니다!");
      setTimeout(onClose, 1200);
    } catch (e) {
      setSaveStatus("error");
      setSaveMsg(`저장 실패: ${e.message}`);
    }
  };

  // 게이지 색상
  const gaugeColor =
    total === 100 ? "bg-green-500" :
    total  > 100  ? "bg-red-500"   : "bg-yellow-500";

  return (
    // 모달 오버레이
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 rounded-2xl w-full max-w-lg mx-4 border border-purple-700 shadow-2xl flex flex-col max-h-screen overflow-hidden">

        {/* 모달 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-white font-black text-lg">⚙️ 보상 설정</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              {program} · <code>sigSlotRewards/{programKey}</code>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-xl transition w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700"
          >✕</button>
        </div>

        {/* 확률 게이지 */}
        <div className="px-5 pt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">확률 합계</span>
            <div className="flex items-center gap-2">
              <button
                onClick={autoFit}
                className="text-xs text-purple-400 border border-purple-700 rounded-md px-2 py-0.5 hover:border-purple-400 transition"
              >자동 맞춤</button>
              <span className={`text-sm font-black ${
                total === 100 ? "text-green-400" :
                total  > 100  ? "text-red-400"  : "text-yellow-400"
              }`}>{total}%</span>
            </div>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-1">
            <div
              className={`h-full rounded-full transition-all ${gaugeColor}`}
              style={{ width: `${Math.min(total, 100)}%` }}
            />
          </div>
          {total !== 100 && (
            <p className="text-xs text-yellow-400">
              {total < 100 ? `${100 - total}% 부족합니다.` : `${total - 100}% 초과입니다.`}
            </p>
          )}
        </div>

        {/* 보상 목록 */}
        <div className="flex flex-col gap-2 overflow-y-auto px-5 py-3" style={{ maxHeight: "380px" }}>
          {localRewards.map((r, i) => (
            <div
              key={r.id}
              className="bg-gray-800 rounded-xl p-3 flex flex-col gap-2 border border-gray-700 hover:border-gray-600 transition"
            >
              {/* 행 1: 아이콘 + 보상명 + 확률 + 순서 + 삭제 */}
              <div className="flex items-center gap-2">
                <IconPicker
                  value={r.icon || "🎁"}
                  onChange={(icon) => update(i, "icon", icon)}
                />
                <input
                  className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="보상명"
                  value={r.name}
                  onChange={(e) => update(i, "name", e.target.value)}
                />
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    className="w-14 bg-gray-700 text-white rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-purple-500"
                    type="number" min={0} max={100}
                    value={r.probability}
                    onChange={(e) => update(i, "probability", e.target.value)}
                  />
                  <span className="text-gray-400 text-xs">%</span>
                </div>
                {/* 순서 이동 */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveUp(i)}
                    disabled={i === 0}
                    className="text-gray-400 hover:text-white disabled:opacity-20 text-xs leading-none"
                  >▲</button>
                  <button
                    onClick={() => moveDown(i)}
                    disabled={i === localRewards.length - 1}
                    className="text-gray-400 hover:text-white disabled:opacity-20 text-xs leading-none"
                  >▼</button>
                </div>
                <button
                  onClick={() => remove(i)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/30 w-7 h-7 rounded-lg flex items-center justify-center transition text-sm"
                >✕</button>
              </div>
              {/* 행 2: 설명 */}
              <input
                className="bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm w-full placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="보상 설명 (예: 상금 10,000원 지급)"
                value={r.description}
                onChange={(e) => update(i, "description", e.target.value)}
              />
              {/* 확률 미니 바 */}
              <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${Math.min(r.probability, 100)}%` }}
                />
              </div>
            </div>
          ))}

          {/* 추가 버튼 */}
          <button
            onClick={add}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-700 hover:border-purple-600 text-gray-500 hover:text-purple-400 text-sm font-bold transition"
          >+ 보상 항목 추가</button>
        </div>

        {/* 모달 푸터 */}
        <div className="px-5 py-4 border-t border-gray-800 flex items-center justify-between gap-3">
          <span className="text-xs text-gray-600">{localRewards.length}개 항목</span>

          {/* 저장 피드백 */}
          <div className="flex-1 text-center text-xs">
            {saveStatus === "saving"  && <span className="text-purple-300 animate-pulse">⏳ Firestore 저장 중...</span>}
            {saveStatus === "success" && <span className="text-green-400">✅ {saveMsg}</span>}
            {saveStatus === "error"   && <span className="text-red-400">❌ {saveMsg}</span>}
            {!isValid && saveStatus === "idle" && total !== 100 && (
              <span className="text-yellow-500">확률 합계를 100%로 맞춰주세요</span>
            )}
            {!isValid && saveStatus === "idle" && total === 100 && (
              <span className="text-yellow-500">보상명을 모두 입력해주세요</span>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!isValid || saveStatus === "saving"}
            className={`px-5 py-2 rounded-xl font-black text-sm transition ${
              !isValid || saveStatus === "saving"
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white shadow-lg shadow-purple-900"
            }`}
          >
            {saveStatus === "saving" ? "저장 중..." : "💾 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
