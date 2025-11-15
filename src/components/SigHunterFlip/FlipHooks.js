import { useState, useEffect } from "react";
import { sigCards, normalMessages, specialMessages } from "../../data/sigData";

// 💾 공통 - 로컬스토리지 관리 훅
export function useSigStorage() {
  const [flipped, setFlipped] = useState({});
  const [locked, setLocked] = useState({});
  const [revealed, setRevealed] = useState(
    JSON.parse(localStorage.getItem("sigRevealed") || "{}")
  );
  const [randomImages, setRandomImages] = useState(() => {
    const saved = localStorage.getItem("sigImages");
    if (saved) return JSON.parse(saved);
    const init = {};
    sigCards.forEach((c) => {
      const imgs = c.frontImages;
      if (imgs?.length) init[c.id] = imgs[Math.floor(Math.random() * imgs.length)];
    });
    return init;
  });

  const [cardWeights, setCardWeights] = useState(() => {
    const saved = localStorage.getItem("cardWeights");
    if (saved) return JSON.parse(saved);
    const init = {};
    sigCards.forEach((card) => {
      init[card.id] = (card.isSpecial ? specialMessages : normalMessages).map(
        (m) => m.weight
      );
    });
    return init;
  });

  useEffect(() => {
    localStorage.setItem("sigRevealed", JSON.stringify(revealed));
  }, [revealed]);
  useEffect(() => {
    localStorage.setItem("sigImages", JSON.stringify(randomImages));
  }, [randomImages]);
  useEffect(() => {
    localStorage.setItem("sigLocked", JSON.stringify(locked));
  }, [locked]);
  useEffect(() => {
    localStorage.setItem("cardWeights", JSON.stringify(cardWeights));
  }, [cardWeights]);

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