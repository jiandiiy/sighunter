import { create } from 'zustand';

/**
 * Dice Game 상태 관리 (Zustand)
 * 
 * 개선사항:
 * - rollDice 후 result만 저장, phase는 rolling 유지
 * - finishRolling()으로 수동 전환 가능 (DiceContainer에서 호출)
 * - 애니메이션과 API 응답 독립적 관리
 */

const API_URL = process.env.REACT_APP_DICE_API_URL || 'https://impartial-determination-production-2dc2.up.railway.app';

const useDiceGame = create((set, get) => ({
  // ────────────────────────────────────────────
  // 게임 상태
  // ────────────────────────────────────────────
  mode: 1, // 1 | 2
  phase: 'idle', // 'idle' | 'rolling' | 'stopped' | 'flipped'

  // 현재 결과
  result: null, // { dice1, dice2, sum, timestamp, specialEffect }
  history: [], // 모든 결과 기록

  // ────────────────────────────────────────────
  // API 통신 상태
  // ────────────────────────────────────────────
  isApiLoading: false,
  apiError: null,

  // ────────────────────────────────────────────
  // 어드민 설정
  // ────────────────────────────────────────────
  adminSettings: {
    weightMode: 'normal', // 'normal' | 'high_number' | 'high_sum' | 'manual'
    targetNumber: 6,
    targetSum: 12,
    nextManualResult: null,
    isAdminPanelOpen: false,
  },

  // ────────────────────────────────────────────
  // 액션: 모드 변경
  // ────────────────────────────────────────────
  setMode: (newMode) => set({ mode: newMode, phase: 'idle', result: null }),

  // ────────────────────────────────────────────
  // 액션: 주사위 굴리기 (API 호출)
  // rolling 상태 유지 → DiceContainer에서 타이머 후 finishRolling() 호출
  // ────────────────────────────────────────────
  rollDice: async () => {
    const state = get();

    // 이미 로딩 중이면 중복 요청 방지
    if (state.isApiLoading) return;

    set({ phase: 'rolling', isApiLoading: true, apiError: null });

    try {
      const { mode, adminSettings } = state;
      const { weightMode, targetNumber, targetSum, nextManualResult } = adminSettings;

      // 요청 페이로드 구성
      const payload = {
        mode,
        weightMode,
      };

      // manual 모드일 때 추가 필드
      if (weightMode === 'manual' && nextManualResult) {
        payload.nextManualResult = nextManualResult;
      }
      // high_number 모드
      if (weightMode === 'high_number') {
        payload.targetNumber = targetNumber;
      }
      // high_sum 모드 (2개 모드에서만)
      if (weightMode === 'high_sum' && mode === 2) {
        payload.targetSum = targetSum;
      }

      // API 호출
      const response = await fetch(`${API_URL}/api/dice/roll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }

      const data = await response.json();
      const { dice1, dice2, sum, specialEffect } = data;

      // 결과 저장 (phase는 rolling 유지!)
      const timestamp = new Date().toISOString();
      const newResult = {
        dice1,
        dice2,
        sum,
        timestamp,
        specialEffect,
      };

      set((st) => ({
        result: newResult,
        // ⭐ phase: 'rolling' 유지 (stopped로 변경하지 않음)
        history: [newResult, ...st.history.slice(0, 49)],
        isApiLoading: false,
      }));
    } catch (error) {
      console.error('주사위 굴리기 실패:', error);
      set({
        apiError: error.message,
        phase: 'idle',
        isApiLoading: false,
      });
    }
  },

  // ────────────────────────────────────────────
  // 액션: Rolling 완료 (DiceContainer에서 타이머 후 호출)
  // ────────────────────────────────────────────
  finishRolling: () => set({ phase: 'stopped' }),

  // ────────────────────────────────────────────
  // 액션: 결과 표시 상태로 전환
  // ────────────────────────────────────────────
  flipResult: () => set({ phase: 'flipped' }),

  // ────────────────────────────────────────────
  // 액션: 리셋 (다시 idle 상태)
  // ────────────────────────────────────────────
  reset: () => set({ phase: 'idle', result: null, apiError: null }),

  // ────────────────────────────────────────────
  // 액션: 어드민 설정 수정
  // ────────────────────────────────────────────
  updateAdminSettings: (updates) =>
    set((state) => ({
      adminSettings: {
        ...state.adminSettings,
        ...updates,
      },
    })),

  // ────────────────────────────────────────────
  // 액션: 어드민 패널 토글
  // ────────────────────────────────────────────
  toggleAdminPanel: () =>
    set((state) => ({
      adminSettings: {
        ...state.adminSettings,
        isAdminPanelOpen: !state.adminSettings.isAdminPanelOpen,
      },
    })),

  // ────────────────────────────────────────────
  // 액션: 히스토리 클리어
  // ────────────────────────────────────────────
  clearHistory: () => set({ history: [] }),

  // ────────────────────────────────────────────
  // 셀렉터: 현재 phase 확인
  // ────────────────────────────────────────────
  isRolling: () => get().phase === 'rolling',
  isIdle: () => get().phase === 'idle',
  isStopped: () => get().phase === 'stopped',
  isFlipped: () => get().phase === 'flipped',

  // ────────────────────────────────────────────
  // 셀렉터: 특별 효과 확인
  // ────────────────────────────────────────────
  hasSpecialEffect: () => get().result?.specialEffect !== null,
  isDouble: () => get().result?.specialEffect === 'double',
  isMax: () => get().result?.specialEffect === 'max',
}));

export default useDiceGame;
export { useDiceGame as useDiceStore };
