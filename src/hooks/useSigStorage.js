// src/hooks/useSigStorage.js
import { useState, useEffect } from "react";
import { sigCards, normalMessages, specialMessages } from "../data/sigData";

export function useSigStorage() {
  const [flipped, setFlipped] = useState({});
  const [locked, setLocked] = useState({});
  const [revealed, setRevealed] = useState({});
  const [randomImages, setRandomImages] = useState({});
  const [cardWeights, setCardWeights] = useState({});

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("cardWeights") || "{}");

    if (Object.keys(saved).length === 0) {
      // 기본 가중치 초기화 (문자열 키)
      const initWeights = {};
      sigCards.forEach((card) => {
        const base = card.isSpecial ? specialMessages : normalMessages;
        const key = String(card.id);
        initWeights[key] = base.map((m) => m.weight);
      });

      localStorage.setItem("cardWeights", JSON.stringify(initWeights));
      setCardWeights(initWeights);
    } else {
      setCardWeights(saved);
    }
  }, []);

  const debugSetRevealed = (updater) => {
    // updater가 함수인지 객체인지 구분
    if (typeof updater === "function") {
      setRevealed((prev) => {
        const next = updater(prev);
        console.log("🧩 [useSigStorage] setRevealed 호출:", { prev, next });
        return next;
      });
    } else {
      console.log("🧩 [useSigStorage] setRevealed 직접 대입:", updater);
      setRevealed(updater);
    }
  };

  return {
    flipped,
    locked,
    revealed,
    randomImages,
    cardWeights,
    setFlipped,
    setLocked,
    setRevealed,
    setRandomImages,
    setCardWeights,
  };
}