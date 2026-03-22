// src/hooks/useBoardEffects.js
import { useState, useRef } from "react";

export function useBoardEffects({ cells }) {
  const [toast, setToast] = useState(null);
  const [scoreChange, setScoreChange] = useState(null); // { tokenId, diff }
  const [logs, setLogs] = useState([]);
  const [lastLandedIndex, setLastLandedIndex] = useState(null);

  const goodSoundRef = useRef(null);
  const badSoundRef = useRef(null);

  const attachGoodAudioRef = (el) => {
    goodSoundRef.current = el;
  };

  const attachBadAudioRef = (el) => {
    badSoundRef.current = el;
  };

  /** 특정 칸에 도착했을 때 효과 처리 */
  const applyCellEffect = ({
    cellIndex,
    token,
    diceValue,
    updateTokens, // (updaterFn) => void
  }) => {
    setLastLandedIndex(cellIndex);

    const raw = cells[cellIndex] || "";
    const textNoSpace = raw.replace(/\s/g, "");

    let diff = 0;
    let effectDesc = raw.replace(/\n/g, " / ");

    const plusMatch = textNoSpace.match(/\+(\d+)점/);
    const minusMatch = textNoSpace.match(/-(\d+)점/);

    if (plusMatch) {
      diff = Number(plusMatch[1]);
    } else if (minusMatch) {
      diff = -Number(minusMatch[1]);
    }

    if (diff !== 0) {
      // 점수 반영
      updateTokens((prev) =>
        prev.map((t) =>
          t.id === token.id ? { ...t, score: t.score + diff } : t
        )
      );

      // 점수 변경 이펙트
      setScoreChange({ tokenId: token.id, diff });
      setTimeout(() => setScoreChange(null), 1200);

      // 사운드
      if (diff > 0 && goodSoundRef.current) {
        goodSoundRef.current.currentTime = 0;
        goodSoundRef.current.play().catch(() => {});
      } else if (diff < 0 && badSoundRef.current) {
        badSoundRef.current.currentTime = 0;
        badSoundRef.current.play().catch(() => {});
      }

      // 토스트
      setToast(
        `${token.name}님 ${
          diff > 0 ? "점수 획득!" : "점수 감소..."
        } (${diff > 0 ? "+" : ""}${diff}점)`
      );
      setTimeout(() => setToast(null), 2500);
    } else {
      // 점수 변동이 없는 칸
      setToast(`효과: ${effectDesc}`);
      setTimeout(() => setToast(null), 2000);
    }

    // 로그 추가
    setLogs((prev) => {
      const newLog = {
        id: Date.now(),
        tokenName: token.name,
        dice: diceValue,
        cell: cellIndex + 1,
        text: effectDesc,
        diff,
      };
      return [newLog, ...prev].slice(0, 30);
    });
  };

  /** 외부에서 전체 리셋할 때 사용할 함수 */
  const resetBoardEffects = () => {
    setToast(null);
    setScoreChange(null);
    setLogs([]);
    setLastLandedIndex(null);
  };

  return {
    toast,
    scoreChange,
    logs,
    lastLandedIndex,
    applyCellEffect,
    resetBoardEffects,
    attachGoodAudioRef,
    attachBadAudioRef,
  };
}