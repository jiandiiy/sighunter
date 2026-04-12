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
    boardSize = 24, // 말 이동 시 모듈로 계산에 사용
  }) => {
    setLastLandedIndex(cellIndex);

    const raw = cells[cellIndex] || "";
    const textNoSpace = raw.replace(/\s/g, "");

    let diff = 0;
    let effectDesc = raw.replace(/\n/g, " / ");

    // --- 1) 점수 파싱 (+100점 / -200점 등) ---
    const plusMatch = textNoSpace.match(/\+(\d+)점/);
    const minusMatch = textNoSpace.match(/-(\d+)점/);

    if (plusMatch) {
      diff = Number(plusMatch[1]);
    } else if (minusMatch) {
      diff = -Number(minusMatch[1]);
    }

    // --- 2) 점수 반영 + 이펙트/사운드/토스트 ---
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

    // --- 3) 이동/특수 효과 파싱 (텍스트에 맞게 실제 이동) ---
    updateTokens((prev) =>
      prev.map((t) => {
        if (t.id !== token.id) return t;

        let next = { ...t };

        // (1) 앞으로 N칸 이동  예) "앞으로 2칸 이동"
        const forwardMatch = textNoSpace.match(/앞으로(\d+)칸이동/);
        if (forwardMatch) {
          const n = Number(forwardMatch[1]) || 0;
          next.pos = (next.pos + n + boardSize * 10) % boardSize;
        }

        // (2) 뒤로 N칸 이동  예) "뒤로 2칸 이동"
        const backMatch = textNoSpace.match(/뒤로(\d+)칸이동/);
        if (backMatch) {
          const n = Number(backMatch[1]) || 0;
          next.pos = (next.pos - n + boardSize * 10) % boardSize;
        }

        // (3) 제주: +100점 또는 -100점 (랜덤)
        if (textNoSpace.includes("제주+100점또는-100점(랜덤)")) {
          const delta = Math.random() < 0.5 ? 100 : -100;
          next.score += delta;

          setScoreChange({ tokenId: token.id, diff: delta });
          setTimeout(() => setScoreChange(null), 1200);

          if (delta > 0 && goodSoundRef.current) {
            goodSoundRef.current.currentTime = 0;
            goodSoundRef.current.play().catch(() => {});
          } else if (delta < 0 && badSoundRef.current) {
            badSoundRef.current.currentTime = 0;
            badSoundRef.current.play().catch(() => {});
          }
        }

        // (4) 세계여행: 원하는 도시로 이동
        // 여기서는 안내만, 실제 목적지 선택/이동은 UI(모달 등)에서 따로 처리하는 걸 권장
        // -> 위치 이동은 이 함수 안에서는 하지 않음

        // (5) 우주여행: 무작위 위치로 워프
        if (textNoSpace.includes("우주여행무작위위치로워프")) {
          const randPos = Math.floor(Math.random() * boardSize);
          next.pos = randPos;
        }

        // (6) 퀘백: 모두의 점수 절반
        // -> 전체 토큰에 적용해야 해서, 아래에서 한 번 더 처리
        return next;
      })
    );

    // 퀘백: 모두의 점수 절반 (전체 토큰에 한 번만 적용)
    if (textNoSpace.includes("퀘백모두의점수절반")) {
      updateTokens((prev) =>
        prev.map((t) => ({
          ...t,
          score: Math.floor(t.score / 2),
        }))
      );
    }

    // --- 4) 로그 추가: 칸 내용까지 저장 ---
    setLogs((prev) => {
      const newLog = {
        id: Date.now(),
        tokenName: token.name,
        dice: diceValue,
        cell: cellIndex + 1,
        text: effectDesc, // 칸 내용 (줄바꿈 → " / " 로 변환된 버전)
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