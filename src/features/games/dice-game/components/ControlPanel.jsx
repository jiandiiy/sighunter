import React from "react";

/**
 * ControlPanel
 * 
 * ROLL 버튼, 초기화, 어드민 패널 토글
 * - API 로딩 중 ROLL 버튼 비활성화
 * - 상태별 버튼 텍스트 변경
 */
export default function ControlPanel({
  phase,
  isLoading,
  onRoll,
  onReset,
  onAdminToggle,
}) {
  // ROLL 버튼 비활성화 조건: rolling 중이거나 API 통신 중
  const isRollDisabled = phase === "rolling" || isLoading;

  // 버튼 텍스트 동적 변경
  const getRollButtonText = () => {
    if (isLoading) return "🔄 API 호출 중...";
    if (phase === "rolling") return "🎲 굴리는 중...";
    return "🎲 ROLL";
  };

  return (
    <div className="flex gap-4 justify-center items-center flex-wrap">
      {/* ROLL 버튼 */}
      <button
        onClick={onRoll}
        disabled={isRollDisabled}
        className={`px-8 py-3 rounded-xl font-bold text-lg transition-all duration-200 ${
          isRollDisabled
            ? "bg-gray-600 text-gray-400 cursor-not-allowed opacity-50"
            : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-pink-500/50 active:scale-95"
        }`}
      >
        {getRollButtonText()}
      </button>

      {/* 초기화 버튼 */}
      <button
        onClick={onReset}
        disabled={isLoading}
        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
          isLoading
            ? "bg-gray-700 text-gray-400 cursor-not-allowed opacity-50"
            : "bg-gray-700 text-white hover:bg-gray-600 active:scale-95"
        }`}
      >
        🔄 초기화
      </button>

      {/* 어드민 패널 토글 버튼 */}
      <button
        onClick={onAdminToggle}
        disabled={isLoading}
        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
          isLoading
            ? "bg-gray-700 text-gray-400 cursor-not-allowed opacity-50"
            : "bg-gray-700 text-white hover:bg-gray-600 active:scale-95"
        }`}
      >
        ⚙️ 어드민
      </button>
    </div>
  );
}