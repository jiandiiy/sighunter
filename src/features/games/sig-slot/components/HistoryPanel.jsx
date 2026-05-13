// ─────────────────────────────────────────────
// 당첨 히스토리 패널
// ─────────────────────────────────────────────
export function HistoryPanel({ history, show, onToggle }) {
  if (!history.length) return null;

  return (
    <>
      {/* 토글 버튼 */}
      <button
        onClick={onToggle}
        className="text-xs text-gray-400 border border-gray-700 rounded-lg px-3 py-1.5 hover:border-purple-500 hover:text-purple-300 transition"
      >
        {show ? "📜 히스토리 닫기" : `📜 당첨 히스토리 (${history.length})`}
      </button>

      {/* 히스토리 패널 */}
      {show && (
        <div className="bg-gray-900 rounded-2xl p-4 w-full max-w-md border border-gray-800">
          <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <span>📜</span>
            <span>당첨 히스토리</span>
            <span className="text-gray-500 text-xs font-normal">최근 {history.length}회</span>
          </h3>
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
            {history.map((h, i) => (
              <div
                key={h.id}
                className="bg-gray-800 rounded-lg p-3 flex items-center gap-3 border border-gray-700 hover:border-purple-700 transition"
              >
                <div className="text-gray-500 text-xs font-mono w-5 text-center">#{i + 1}</div>
                <img
                  src={h.image.url}
                  alt={h.image.name}
                  className="w-12 h-12 rounded-lg object-cover border border-purple-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{h.reward.icon || "🎁"}</span>
                    <span className="text-white text-sm font-bold truncate">{h.reward.name}</span>
                  </div>
                  <div className="text-gray-400 text-xs truncate">
                    {h.image.sigNum ? `SIG ${h.image.sigNum}` : h.image.name} · {h.program}
                  </div>
                </div>
                <div className="text-gray-500 text-xs whitespace-nowrap">{h.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
