// src/components/SigHunterFlip/FlipHooks.js
// 💾 시그헌터 공통 - 로컬스토리지 관리 훅 (이미지/메시지/가중치)

import { useState, useEffect } from "react";
import { normalMessages, specialMessages } from "../../data/sigData";

// 카드 & 메시지 상태 + 로컬스토리지 동기화
export function useSigStorage() {
  const [flipped, setFlipped] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sigFlipped") || "{}");
    } catch {
      return {};
    }
  });

  const [locked, setLocked] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sigLocked") || "{}");
    } catch {
      return {};
    }
  });

  const [revealed, setRevealed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sigRevealed") || "{}");
    } catch {
      return {};
    }
  });

  // 🔹 업로드로 덮어쓴 이미지 (기본 이미지는 컴포넌트에서 처리)
  const [randomImages, setRandomImages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sigImages") || "{}");
    } catch {
      return {};
    }
  });

  // 🔹 일반/스페셜 메시지 세트
  const [messages, setMessages] = useState({
    normal: normalMessages,
    special: specialMessages,
  });

  // 🔹 카드별 메시지 가중치
  const [cardWeights, setCardWeights] = useState(() => {
    try {
      const saved = localStorage.getItem("cardWeights");
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    // 초깃값은 비워두고, 없을 경우 카드 뒤집을 때 base weight 사용
    return {};
  });

  const loaded = true;

  // 로컬스토리지 동기화
  useEffect(() => {
    localStorage.setItem("sigFlipped", JSON.stringify(flipped));
  }, [flipped]);

  useEffect(() => {
    localStorage.setItem("sigLocked", JSON.stringify(locked));
  }, [locked]);

  useEffect(() => {
    localStorage.setItem("sigRevealed", JSON.stringify(revealed));
  }, [revealed]);

  useEffect(() => {
    localStorage.setItem("sigImages", JSON.stringify(randomImages));
  }, [randomImages]);

  useEffect(() => {
    localStorage.setItem("cardWeights", JSON.stringify(cardWeights));
  }, [cardWeights]);

  return {
    flipped,
    locked,
    revealed,
    randomImages,
    messages,
    cardWeights,
    setFlipped,
    setLocked,
    setRevealed,
    setRandomImages,
    setMessages,
    setCardWeights,
    loaded,
  };
}