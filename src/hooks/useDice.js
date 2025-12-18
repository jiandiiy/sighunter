import { useState, useRef, useEffect, useCallback } from "react";

const rand = (min, max) => Math.random() * (max - min) + min;
const randi = (min, max) => Math.floor(rand(min, max + 1));

/** value -> 최종 스냅용 회전각 매핑 */
const getSnapRotationForValue = (v) => {
  switch (v) {
    case 1:
      return { x: 0, y: 0 };
    case 2:
      return { x: -90, y: 0 };
    case 3:
      return { x: 0, y: 90 };
    case 4:
      return { x: 0, y: -90 };
    case 5:
      return { x: 90, y: 0 };
    case 6:
      return { x: 180, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
};

export function useDice({ onRollEnd } = {}) {
  const [diceValue, setDiceValue] = useState(null);
  const [isRolling, setIsRolling] = useState(false);

  // 굴리는 동안의 3D 랜덤 회전
  const [diceRotation3d, setDiceRotation3d] = useState({
    x: 0,
    y: 0,
    z: 0,
  });

  // 멈출 때 결과 값에 맞게 스냅할 각도
  const [diceSnapRotation, setDiceSnapRotation] = useState({
    x: 0,
    y: 0,
  });

  const diceSoundRef = useRef(null);
  const spinTimerRef = useRef(null);
  const endTimerRef = useRef(null);

  const attachDiceAudioRef = useCallback((el) => {
    diceSoundRef.current = el;
  }, []);

  const clearTimers = useCallback(() => {
    if (spinTimerRef.current) {
      clearInterval(spinTimerRef.current);
      spinTimerRef.current = null;
    }
    if (endTimerRef.current) {
      clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const rollDice = useCallback(() => {
    if (isRolling) return;

    // 사운드 재생
    if (diceSoundRef.current) {
      try {
        diceSoundRef.current.currentTime = 0;
        diceSoundRef.current.play();
      } catch {}
    }

    clearTimers();
    setIsRolling(true);

    const duration = 700; // 굴리는 시간(ms)
    const intervalMs = 40;
    const start = Date.now();

    // 굴리는 동안: 계속 랜덤 3D 회전
    spinTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const k = 1 - t; // 감속 계수

      // 눈 출력은 연출용
      setDiceValue(randi(1, 6));

      setDiceRotation3d((prev) => {
        const sx = (Math.random() < 0.5 ? -1 : 1) * rand(90, 180) * (0.6 + k);
        const sy = (Math.random() < 0.5 ? -1 : 1) * rand(90, 180) * (0.6 + k);
        const sz = (Math.random() < 0.5 ? -1 : 1) * rand(20, 90) * (0.5 + k);
        return { x: prev.x + sx, y: prev.y + sy, z: prev.z + sz };
      });
    }, intervalMs);

    const final = randi(1, 6);

    // duration 후에 굴림 종료
    endTimerRef.current = setTimeout(() => {
      clearTimers();
      setDiceValue(final);
      setIsRolling(false);

      // 최종 결과 값에 맞게 스냅 회전각 설정
      setDiceSnapRotation(getSnapRotationForValue(final));

      if (typeof onRollEnd === "function") onRollEnd(final);
    }, duration);
  }, [isRolling, onRollEnd, clearTimers]);

  return {
    diceValue,
    isRolling,
    diceRotation3d,
    diceSnapRotation,
    rollDice,
    attachDiceAudioRef,
  };
}