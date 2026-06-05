import React, { useState } from "react";
import useDiceGame from "../hooks/useDiceGame";
import DiceContainer from "./DiceContainer";
import ModeSelector from "./ModeSelector";
import ResultDisplay from "./ResultDisplay";
import ControlPanel from "./ControlPanel";
import HistoryPanel from "./HistoryPanel";
import AdminPanel from "./AdminPanel";

export default function DiceGame() {
  const [showAdmin, setShowAdmin] = useState(false);

  // Zustand에서 모든 필요한 상태와 액션 가져오기
  const phase = useDiceGame((state) => state.phase);
  const mode = useDiceGame((state) => state.mode);
  const result = useDiceGame((state) => state.result);
  const history = useDiceGame((state) => state.history);
  const isApiLoading = useDiceGame((state) => state.isApiLoading);
  const apiError = useDiceGame((state) => state.apiError);

  const setMode = useDiceGame((state) => state.setMode);
  const rollDice = useDiceGame((state) => state.rollDice);
  const flipResult = useDiceGame((state) => state.flipResult);
  const reset = useDiceGame((state) => state.reset);
  const toggleAdminPanel = useDiceGame((state) => state.toggleAdminPanel);

  // ────────────────────────────────────────────
  // 주사위 굴리기 (실제 API 호출)
  // ────────────────────────────────────────────
  const handleRoll = async () => {
    await rollDice(); // rollDice는 내부에서 state를 읽음
  };

  // ────────────────────────────────────────────
  // 결과 표시 (stopped → flipped로 전환)
  // ────────────────────────────────────────────
  const handleFlip = () => {
    flipResult();
  };

  // ────────────────────────────────────────────
  // 초기화
  // ────────────────────────────────────────────
  const handleReset = () => {
    reset();
  };

  // ────────────────────────────────────────────
  // 어드민 패널 토글
  // ────────────────────────────────────────────
  const handleAdminToggle = () => {
    setShowAdmin((v) => !v);
    toggleAdminPanel();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white flex flex-col items-center py-10 px-4 gap-6">
      {/* 헤더 */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🎲</span>
          <h1 className="text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-300 drop-shadow-lg">
            DICE GAME
          </h1>
        </div>
        <p className="text-gray-500 text-sm">
          주사위를 굴려 운을 시험해보세요!
        </p>
      </div>

      {/* API 오류 메시지 */}
      {apiError && (
        <div className="w-full max-w-2xl bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300 text-sm">
          ⚠️ {apiError}
        </div>
      )}

      {/* 모드 선택 */}
      <ModeSelector
        mode={mode}
        onModeChange={setMode}
        disabled={isApiLoading}
      />

      {/* 3D 주사위 */}
      <DiceContainer />

      {/* 로딩 상태 표시 */}
      {isApiLoading && (
        <div className="text-center">
          <p className="text-gray-400 text-sm">🎲 주사위를 굴리는 중...</p>
        </div>
      )}

      {/* 결과 표시 (stopped 상태) */}
      {result && phase === "stopped" && !isApiLoading && (
        <ResultDisplay
          mode={mode}
          result={result}
          onFlip={handleFlip}
        />
      )}

      {/* 컨트롤 패널 */}
      <ControlPanel
        phase={phase}
        isLoading={isApiLoading}
        onRoll={handleRoll}
        onReset={handleReset}
        onAdminToggle={handleAdminToggle}
      />

      {/* 어드민 패널 */}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

      {/* 히스토리 패널 */}
      <HistoryPanel mode={mode} history={history} />
    </div>
  );
}