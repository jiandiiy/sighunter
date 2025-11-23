// src/hooks/useDice.js
import { useState, useRef } from "react";

export function useDice({ onRollEnd } = {}) {
  const [diceValue, setDiceValue] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [diceRotation, setDiceRotation] = useState(0);

  const diceSoundRef = useRef(null);

  const attachDiceAudioRef = (el) => {
    diceSoundRef.current = el;
  };

  const rollDice = () => {
    if (isRolling) return;

    // 주사위 소리
    if (diceSoundRef.current) {
      diceSoundRef.current.currentTime = 0;
      diceSoundRef.current.play().catch(() => {});
    }

    setIsRolling(true);

    let count = 0;
    const maxCount = 12;
    const intervalMs = 70;

    const timer = setInterval(() => {
      const temp = Math.floor(Math.random() * 6) + 1;
      setDiceValue(temp);
      count += 1;

      setDiceRotation((prev) => {
        const direction = Math.random() < 0.5 ? -1 : 1;
        const base = 90;
        const jitter = Math.floor(Math.random() * 30) - 15;
        return prev + direction * (base + jitter);
      });

      if (count >= maxCount) {
        clearInterval(timer);

        const final = Math.floor(Math.random() * 6) + 1;
        setDiceValue(final);

        setDiceRotation((prev) => {
          const direction = Math.random() < 0.5 ? -1 : 1;
          return prev + direction * 120;
        });

        setIsRolling(false);

        // 최종 결과 콜백
        if (typeof onRollEnd === "function") {
          onRollEnd(final);
        }
      }
    }, intervalMs);
  };

  return {
    diceValue,
    isRolling,
    diceRotation,
    rollDice,
    attachDiceAudioRef,
  };
}