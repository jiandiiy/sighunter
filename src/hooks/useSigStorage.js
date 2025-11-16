// src/hooks/useSigStorage.js
import { useState, useEffect, useRef } from "react";
import { sigCards, normalMessages, specialMessages } from "../data/sigData";
import { loadSigState, saveSigState } from "../api/sigRemoteStorage";

export function useSigStorage() {
  const [flipped, setFlipped] = useState({});
  const [locked, setLocked] = useState({});
  const [revealed, setRevealed] = useState({});
  const [randomImages, setRandomImages] = useState({});
  const [cardWeights, setCardWeights] = useState({});
  const [loaded, setLoaded] = useState(false); // 서버에서 로드 완료 여부

  // 🔹 초기값 세팅 (기존 cardWeights 초기화 + 랜덤 이미지 같이 처리)
  const initDefaults = () => {
    // 카드 앞면 랜덤 이미지
    const initImgs = {};
    sigCards.forEach((c) => {
      const imgs = c.frontImages;
      if (imgs?.length) {
        initImgs[c.id] = imgs[Math.floor(Math.random() * imgs.length)];
      }
    });
    setRandomImages(initImgs);

    // 가중치 초기화 (문자열 키)
    const initWeights = {};
    sigCards.forEach((card) => {
      const base = card.isSpecial ? specialMessages : normalMessages;
      const key = String(card.id);
      initWeights[key] = base.map((m) => m.weight);
    });

    localStorage.setItem("cardWeights", JSON.stringify(initWeights));
    setCardWeights(initWeights);
  };

  // 🔹 1) 앱 시작 시: Firestore → 없으면 로컬/기본값
  useEffect(() => {
    (async () => {
      try {
        const remote = await loadSigState();

        if (remote) {
          // 서버에 저장된 값이 있으면 그걸 우선 사용
          setFlipped(remote.flipped || {});
          setLocked(remote.locked || {});
          setRevealed(remote.revealed || {});
          setRandomImages(remote.randomImages || {});
          setCardWeights(remote.cardWeights || {});
        } else {
          // 서버에 아무것도 없으면 기존 로컬 초기화 로직 사용
          const saved = JSON.parse(localStorage.getItem("cardWeights") || "{}");

          if (Object.keys(saved).length === 0) {
            initDefaults();
          } else {
            setCardWeights(saved);

            // randomImages는 예전엔 안 저장했을 수 있으니 만들어 줌
            const initImgs = {};
            sigCards.forEach((c) => {
              const imgs = c.frontImages;
              if (imgs?.length) {
                initImgs[c.id] = imgs[Math.floor(Math.random() * imgs.length)];
              }
            });
            setRandomImages(initImgs);
          }
        }
      } catch (err) {
        console.error("[useSigStorage] 원격 로드 실패:", err);
        // 실패해도 최소한 동작은 해야 하므로 로컬/기본값으로
        const saved = JSON.parse(localStorage.getItem("cardWeights") || "{}");
        if (Object.keys(saved).length === 0) {
          initDefaults();
        } else {
          setCardWeights(saved);
        }
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // 🔹 2) 상태 변경 시 Firestore에 자동 저장 (0.5초 디바운스)
  const firstSyncDone = useRef(false);

  useEffect(() => {
    if (!loaded) return; // 아직 로딩 전이면 저장 X

    // 첫 로딩 후 한 번은 건너뛴다 (로드한 걸 다시 저장하지 않도록)
    if (!firstSyncDone.current) {
      firstSyncDone.current = true;
      return;
    }

    const stateToSave = {
      flipped,
      locked,
      revealed,
      randomImages,
      cardWeights,
    };

    const timeout = setTimeout(() => {
      // 로컬 cardWeights도 계속 같이 저장
      localStorage.setItem("cardWeights", JSON.stringify(cardWeights));

      saveSigState(stateToSave).catch((e) => {
        console.error("[useSigStorage] 원격 저장 실패:", e);
      });
    }, 500);

    return () => clearTimeout(timeout);
  }, [flipped, locked, revealed, randomImages, cardWeights, loaded]);

  // 🔹 디버그용 setRevealed (원래 쓰던 거 유지)
  const debugSetRevealed = (updater) => {
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
    setRevealed: debugSetRevealed, // 디버그 버전 유지하고 싶으면 이렇게
    setRandomImages,
    setCardWeights,
    loaded,
  };
}