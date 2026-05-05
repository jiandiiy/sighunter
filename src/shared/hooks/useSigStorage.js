// src/shared/hooks/useSigStorage.js
// 💾 시그헌터 공통 - Firestore 실시간 구독 + localStorage 동기화 통합 훅

import { useState, useEffect, useRef } from "react";
import {
  queendomSigCards,
  museSigCards,
  holicSigCards,
  museNormalMessages,
  museSpecialMessages,
  queendomNormalMessages,
  queendomSpecialMessages,
  holicNormalMessages,
  holicSpecialMessages,
} from "../../shared/data/sigData";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { firestore } from "../../resources/firestore/firebase";

const messagesByProjectDefault = {
  queendom: {
    normal: queendomNormalMessages,
    special: queendomSpecialMessages,
  },
  muse: {
    normal: museNormalMessages,
    special: museSpecialMessages,
  },
  holic: {
    normal: holicNormalMessages,
    special: holicSpecialMessages,
  },
};

const normalMessagesByProject = {
  queendom: queendomNormalMessages,
  muse: museNormalMessages,
  holic: holicNormalMessages,
};

const specialMessagesByProject = {
  queendom: queendomSpecialMessages,
  muse: museSpecialMessages,
  holic: holicSpecialMessages,
};

const getCardProject = (card) => {
  const id = Number(card.id);

  if (id >= 1 && id <= 11) return "queendom";
  if (id >= 12 && id <= 22) return "muse";
  if (id >= 23 && id <= 33) return "holic";

  return "queendom";
};

const getDefaultMessagesForCard = (card) => {
  const project = getCardProject(card);

  return card.isSpecial
    ? specialMessagesByProject[project]
    : normalMessagesByProject[project];
};

export function useSigStorage() {
  const [flipped, setFlippedState] = useState({});
  const [locked, setLockedState] = useState({});
  const [revealed, setRevealedBase] = useState({});
  const [randomImages, setRandomImagesState] = useState({});
  const [cardWeights, setCardWeightsState] = useState({});
  const [messagesByProject, setMessagesState] = useState(
    messagesByProjectDefault
  );
  const [loaded, setLoaded] = useState(false);

  // ✅ holicSigCards 추가
  const allSigCards = [...queendomSigCards, ...museSigCards, ...holicSigCards];
  const docRef = doc(firestore, "sigHunter", "main");

  // 원격 스냅샷으로 인한 setState 여부 표시 (무한 루프 방지)
  const fromRemoteRef = useRef(false);

  // ─────────────────────────────────────────
  // 🔹 기본 상태 생성
  // ─────────────────────────────────────────
  const buildDefaultState = () => {
    const initImgs = {};

    allSigCards.forEach((card) => {
      const imgs = card.frontImages;

      if (imgs?.length) {
        initImgs[card.id] = imgs[Math.floor(Math.random() * imgs.length)];
      }
    });

    const initWeights = {};

    allSigCards.forEach((card) => {
      const baseMessages = getDefaultMessagesForCard(card);
      initWeights[String(card.id)] = baseMessages.map((message) => {
        return message.weight ?? 1;
      });
    });

    localStorage.setItem("cardWeights", JSON.stringify(initWeights));

    return {
      flipped: {},
      locked: {},
      revealed: {},
      randomImages: initImgs,
      cardWeights: initWeights,
      messagesByProject: messagesByProjectDefault,
    };
  };

  // ─────────────────────────────────────────
  // 🔹 1) Firestore 실시간 구독
  // ─────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          fromRemoteRef.current = true;

          setFlippedState(data.flipped || {});
          setLockedState(data.locked || {});
          setRevealedBase(data.revealed || {});
          setRandomImagesState(data.randomImages || {});
          setCardWeightsState(data.cardWeights || {});

          setMessagesState(data.messagesByProject || messagesByProjectDefault);

          // cardWeights는 localStorage에도 미러링
          if (data.cardWeights) {
            localStorage.setItem(
              "cardWeights",
              JSON.stringify(data.cardWeights)
            );
          }
        } else {
          // 문서 없으면 기본값으로 생성
          const def = buildDefaultState();
          fromRemoteRef.current = true;

          setFlippedState(def.flipped);
          setLockedState(def.locked);
          setRevealedBase(def.revealed);
          setRandomImagesState(def.randomImages);
          setCardWeightsState(def.cardWeights);
          setMessagesState(def.messagesByProject);

          setDoc(docRef, def).catch((e) =>
            console.error("[useSigStorage] 초기 문서 생성 실패:", e)
          );
        }

        setLoaded(true);
      },
      (err) => {
        console.error("[useSigStorage] onSnapshot 에러:", err);

        // Firestore 실패 시 localStorage 폴백
        const fallback = {
          flipped: tryParse("sigFlipped", {}),
          locked: tryParse("sigLocked", {}),
          revealed: tryParse("sigRevealed", {}),
          randomImages: tryParse("sigImages", {}),
          cardWeights: tryParse("cardWeights", {}),
          messagesByProject: messagesByProjectDefault,
        };

        setFlippedState(fallback.flipped);
        setLockedState(fallback.locked);
        setRevealedBase(fallback.revealed);
        setRandomImagesState(fallback.randomImages);
        setCardWeightsState(fallback.cardWeights);
        setMessagesState(fallback.messagesByProject);
        setLoaded(true);
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────
  // 🔹 2) localStorage 동기화
  // ─────────────────────────────────────────
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

  // ─────────────────────────────────────────
  // 🔹 3) 원격 저장 헬퍼 (merge)
  // ─────────────────────────────────────────
  const pushToRemote = (next) => {
    setDoc(docRef, next, { merge: true }).catch((e) =>
      console.error("[useSigStorage] 원격 저장 실패:", e)
    );
  };

  // ─────────────────────────────────────────
  // 🔹 4) 공통 setter 래퍼 (로컬 변경 → Firestore 동기화)
  // ─────────────────────────────────────────
  const wrapSetter = (setState, key) => (updater) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;

      if (!fromRemoteRef.current) {
        pushToRemote({ [key]: next });
      }

      return next;
    });

    fromRemoteRef.current = false;
  };

  const setFlipped = wrapSetter(setFlippedState, "flipped");
  const setLocked = wrapSetter(setLockedState, "locked");
  const setRandomImages = wrapSetter(setRandomImagesState, "randomImages");
  const setMessagesByProject = wrapSetter(
    setMessagesState,
    "messagesByProject"
  );

  // cardWeights: Firestore + localStorage 동시 저장
  const setCardWeights = (updater) => {
    setCardWeightsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;

      localStorage.setItem("cardWeights", JSON.stringify(next));

      if (!fromRemoteRef.current) {
        pushToRemote({ cardWeights: next });
      }

      return next;
    });

    fromRemoteRef.current = false;
  };

  // setRevealed: 디버그 로그 포함 (개발 완료 후 wrapSetter 로 교체 가능)
  const setRevealed = (updater) => {
    if (typeof updater === "function") {
      setRevealedBase((prev) => {
        const next = updater(prev);

        if (!fromRemoteRef.current) {
          pushToRemote({ revealed: next });
        }

        fromRemoteRef.current = false;
        return next;
      });
    } else {
      if (!fromRemoteRef.current) {
        pushToRemote({ revealed: updater });
      }

      fromRemoteRef.current = false;
      setRevealedBase(updater);
    }
  };

  return {
    flipped,
    locked,
    revealed,
    randomImages,
    cardWeights,
    messagesByProject,
    setFlipped,
    setLocked,
    setRevealed,
    setRandomImages,
    setCardWeights,
    setMessagesByProject,
    loaded,
  };
}

// ─────────────────────────────────────────
// 🔹 유틸: localStorage 안전 파싱
// ─────────────────────────────────────────
function tryParse(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}