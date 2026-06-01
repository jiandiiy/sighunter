// src/features/games/sig-slot/player.jsx
// ✅ 플레이어별 독립 페이지 — useSlotGame 훅으로 간단히 구현

import React, { useState, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSlot, useSlotGame } from "./hooks/useSlotGame";
import { PROGRAMS, SIG_RANGES } from "./utils/slotUtils";
import { SlotMachine } from "./components/SlotMachine";
import { AdminModal } from "./components/AdminModal";
import { ManualModal } from "./components/ManualModal";
import { HistoryPanel } from "./components/HistoryPanel";
import "./styles/slot.css";

export default function SigSlotPlayer() {
  const { playerNum } = useParams();
  const playerLabel = `${playerNum}`;

  // ✅ useSlotGame 훅으로 모든 상태 관리
  const game = useSlotGame(1); // 기본 1개 슬롯

  const [showAdmin, setShowAdmin] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [targetSlotIdx, setTargetSlotIdx] = useState(null);

  // 슬롯 생성
  const s0 = useSlot(game.currentImages, game.currentRewards);
  const s1 = useSlot(game.currentImages, game.currentRewards);
  const s2 = useSlot(game.currentImages, game.currentRewards);
  const slots = [s0, s1, s2].slice(0, game.slotMode);

  // 슬롯 선택 핸들러
  const handleTargetSlot = useCallback((idx) => {
    setTargetSlotIdx((prev) => (prev === idx ? null : idx));
  }, []);

  const handlePickImage = useCallback(
    (image) => {
      if (targetSlotIdx === null) return;
      const slot = [s0, s1, s2][targetSlotIdx];
      if (!slot || slot.phase !== "spinning") return;
      slot.softStopAt(image);
      setTargetSlotIdx(null);
    },
    [targetSlotIdx, s0, s1, s2]
  );

  // reset 트리거
  useEffect(() => {
    s0.reset();
    s1.reset();
    s2.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.program, game.range]);

  // 사운드 제어
  const phaseKey = slots.map((s) => s.phase).join(",");

  useEffect(() => {
    const allStopped = slots.every((s) => s.phase !== "spinning");
    if (allStopped && game.slotAudioRef.current) {
      game.slotAudioRef.current.pause();
      game.slotAudioRef.current.currentTime = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseKey]);

  useEffect(() => {
    slots.forEach((slot) => {
      if (slot.phase === "stopped" && slot.resultImage && slot.resultReward) {
        game.addHistory(slot.resultImage, slot.resultReward);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseKey]);

  // START 버튼
  const handleStart = () => {
    const anySpinning = slots.some((s) => s.phase === "spinning");
    if (anySpinning) return;
    if (!game.isFullyLoaded) return;

    if (game.buttonAudioRef.current) {
      game.buttonAudioRef.current.currentTime = 0;
      game.buttonAudioRef.current.play().catch(() => {});
    }

    if (game.slotAudioRef.current) {
      game.slotAudioRef.current.currentTime = 0;
      game.slotAudioRef.current.play().catch(() => {});
    }

    slots.forEach((s, i) => {
      if (i === 0) {
        s.spin();
      } else {
        const id = setTimeout(() => s.spin(), i * 300);
        void id;
      }
    });
  };

  const handleRefresh = () => slots.forEach((s) => s.reset());

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white flex flex-col items-center py-10 px-4 gap-5">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🎰</span>
          <h1 className="text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-300 drop-shadow-lg">
            {playerLabel}
          </h1>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowAdmin((v) => !v)}
              className="text-xs text-gray-400 border border-gray-700 rounded-lg px-2 py-1 hover:border-purple-500 hover:text-purple-300 transition"
            >
              ⚙️ 관리
            </button>
            <button
              onClick={() => setShowManual(true)}
              className="text-xs text-gray-400 border border-gray-700 rounded-lg px-2 py-1 hover:border-blue-500 hover:text-blue-300 transition"
            >
              📖 매뉴얼
            </button>
          </div>
          {game.savedPrograms[game.program] && (
            <span className="text-green-500 text-xs">
              ✅ {game.savedPrograms[game.program]} 저장
            </span>
          )}
        </div>
      </div>

      {/* 프로그램 탭 */}
      <div className="flex gap-2">
        {PROGRAMS.map((p) => (
          <button
            key={p}
            onClick={() => game.setProgram(p)}
            className={`px-5 py-2 rounded-full font-bold text-sm transition ${
              game.program === p
                ? "bg-purple-600 text-white shadow-lg shadow-purple-900"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* 슬롯 모드 전환 */}
      <div className="flex gap-2 bg-gray-900 rounded-xl p-1">
        {[1, 3].map((n) => (
          <button
            key={n}
            onClick={() => game.setSlotMode(n)}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${
              game.slotMode === n ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {n === 1 ? "🎴" : "🎴🎴🎴"}
          </button>
        ))}
      </div>

      {/* 시그 구간 선택 */}
      <div className="flex gap-2 flex-wrap justify-center">
        {SIG_RANGES.map((r) => (
          <button
            key={r.label}
            onClick={() => game.setRange(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
              game.range?.label === r.label
                ? "border-yellow-400 text-yellow-300 bg-yellow-400/10"
                : "border-gray-700 text-gray-400 hover:border-gray-500"
            }`}
          >
            {r.label}
          </button>
        ))}
        <button
          onClick={() => game.setRange(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
            game.range === null
              ? "border-yellow-400 text-yellow-300 bg-yellow-400/10"
              : "border-gray-700 text-gray-400 hover:border-gray-500"
          }`}
        >
          전체
        </button>
      </div>

      {showManual && <ManualModal onClose={() => setShowManual(false)} />}

      {showAdmin && (
        <AdminModal
          program={game.program}
          programKey={game.programKey}
          rewardsMap={game.rewardsMap}
          onSave={game.handleSaveRewards}
          onClose={() => setShowAdmin(false)}
          saveRewardsToFirestore={game.saveRewardsToFirestore}
        />
      )}

      {/* 이미지 로딩/에러 상태 */}
      <div className="min-h-[80px] flex flex-col items-center justify-center">
        {game.imgLoading && (
          <>
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-purple-300 text-sm mt-2">이미지 불러오는 중...</div>
          </>
        )}
        {game.imgError && !game.imgLoading && (
          <div className="text-red-400 text-xs bg-red-900/30 rounded-lg px-4 py-2">
            ⚠️ 이미지 로드 실패: {game.imgError}
          </div>
        )}
        {!game.imgLoading && !game.imgError && game.currentImages.length === 0 && (
          <div className="text-gray-500 text-xs">해당 구간의 이미지가 없습니다.</div>
        )}
      </div>

      {/* 슬롯머신 */}
      {game.isFullyLoaded && game.currentImages.length > 0 && (
        <SlotMachine
          images={game.currentImages}
          rewards={game.currentRewards}
          slotCount={game.slotMode}
          onResult={game.addHistory}
          slots={slots}
          onStart={handleStart}
          onRefresh={handleRefresh}
          targetSlotIdx={targetSlotIdx}
          onTargetSlot={handleTargetSlot}
          onPickImage={handlePickImage}
        />
      )}

      <HistoryPanel
        history={game.history}
        show={game.showHistory}
        onToggle={() => game.setShowHistory((v) => !v)}
      />

      {game.currentImages.length > 0 && (
        <div className="text-gray-600 text-xs">
          {game.program} · {game.range?.label ?? "전체"} · {game.currentImages.length}개 이미지 로드됨
        </div>
      )}
    </div>
  );
}