// src/hooks/useSigStorage.js
import { useState, useEffect, useRef } from "react";
import {
  queendomSigCards,
  museSigCards,
  normalMessages as defaultNormalMessages,
  specialMessages as defaultSpecialMessages,
} from "../data/sigData";

// ✅ Firestore 실시간 구독/저장
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase"; // ⚠️ 프로젝트에 맞게 경로 수정

export function useSigStorage() {
  const [flipped, setFlippedState] = useState({});
  const [locked, setLockedState] = useState({});
  const [revealed, setRevealedState] = useState({});
  const [randomImages, setRandomImagesState] = useState({});
  const [cardWeights, setCardWeightsState] = useState({});
  const [messages, setMessagesState] = useState({
    normal: defaultNormalMessages,
    special: defaultSpecialMessages,
  });
  const [loaded, setLoaded] = useState(false);

  // 🔹 두 프로젝트 카드 전부 포함 (상태는 공통 사용)
  const allSigCards = [...queendomSigCards, ...museSigCards];

  // ✅ Firestore 문서 위치
  const docRef = doc(db, "sigHunter", "main");

  // ✅ "지금 setState가 원격 스냅샷 때문에 일어난 것" 표시 (루프 방지)
  const fromRemoteRef = useRef(false);

  // 🔹 기본 상태 생성
  const buildDefaultState = () => {
    // 카드 앞면 랜덤 이미지
    const initImgs = {};
    allSigCards.forEach((c) => {
      const imgs = c.frontImages;
      if (imgs?.length) {
        initImgs[c.id] = imgs[Math.floor(Math.random() * imgs.length)];
      }
    });

    // 가중치 초기화 (문자열 키)
    const initWeights = {};
    allSigCards.forEach((card) => {
      const base = card.isSpecial
        ? defaultSpecialMessages
        : defaultNormalMessages;
      const key = String(card.id);
      initWeights[key] = base.map((m) => m.weight ?? 1);
    });

    localStorage.setItem("cardWeights", JSON.stringify(initWeights));

    return {
      flipped: {},
      locked: {},
      revealed: {},
      randomImages: initImgs,
      cardWeights: initWeights,
      messages: {
        normal: defaultNormalMessages,
        special: defaultSpecialMessages,
      },
    };
  };

  // 🔹 1) Firestore 실시간 구독
  useEffect(() => {
    const unsub = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();

          fromRemoteRef.current = true;

          setFlippedState(data.flipped || {});
          setLockedState(data.locked || {});
          setRevealedState(data.revealed || {});
          setRandomImagesState(data.randomImages || {});
          setCardWeightsState(data.cardWeights || {});
          setMessagesState({
            normal: data.messages?.normal || defaultNormalMessages,
            special: data.messages?.special || defaultSpecialMessages,
          });

          if (data.cardWeights) {
            localStorage.setItem(
              "cardWeights",
              JSON.stringify(data.cardWeights)
            );
          }
        } else {
          // 문서가 없으면 기본 상태 만들고 생성
          const def = buildDefaultState();

          fromRemoteRef.current = true;

          setFlippedState(def.flipped);
          setLockedState(def.locked);
          setRevealedState(def.revealed);
          setRandomImagesState(def.randomImages);
          setCardWeightsState(def.cardWeights);
          setMessagesState(def.messages);

          setDoc(docRef, def).catch((e) =>
            console.error("[useSigStorage] 초기 문서 생성 실패:", e)
          );
        }

        setLoaded(true);
      },
      (err) => {
        console.error("[useSigStorage] onSnapshot 에러:", err);

        const def = buildDefaultState();
        setFlippedState(def.flipped);
        setLockedState(def.locked);
        setRevealedState(def.revealed);
        setRandomImagesState(def.randomImages);
        setCardWeightsState(def.cardWeights);
        setMessagesState(def.messages);

        setLoaded(true);
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔹 2) 원격 저장 헬퍼 (merge)
  const pushToRemote = (next) => {
    setDoc(docRef, next, { merge: true }).catch((e) =>
      console.error("[useSigStorage] 원격 저장 실패:", e)
    );
  };

  // 🔹 공통 setter 래퍼
  const wrapSetter = (setState, key) => (updater) => {
    setState((prev) => {
      const next =
        typeof updater === "function" ? updater(prev) : updater;

      if (!fromRemoteRef.current) {
        pushToRemote({ [key]: next });
      }
      return next;
    });
    fromRemoteRef.current = false;
  };

  // 🔹 3) setter 래핑 (로컬 + 원격 동기화)
  const setFlipped = wrapSetter(setFlippedState, "flipped");
  const setLocked = wrapSetter(setLockedState, "locked");
  const setRandomImages = wrapSetter(setRandomImagesState, "randomImages");
  const setMessages = wrapSetter(setMessagesState, "messages");

  const setCardWeights = (updater) => {
    setCardWeightsState((prev) => {
      const next =
        typeof updater === "function" ? updater(prev) : updater;

      localStorage.setItem("cardWeights", JSON.stringify(next));

      if (!fromRemoteRef.current) {
        pushToRemote({ cardWeights: next });
      }
      return next;
    });
    fromRemoteRef.current = false;
  };

  const setRevealedBase = wrapSetter(setRevealedState, "revealed");

  // 🔹 디버그용 setRevealed (원래 쓰던 거 유지)
  const debugSetRevealed = (updater) => {
    if (typeof updater === "function") {
      setRevealedBase((prev) => {
        const next = updater(prev);
        console.log("🧩 [useSigStorage] setRevealed 호출:", { prev, next });
        return next;
      });
    } else {
      console.log("🧩 [useSigStorage] setRevealed 직접 대입:", updater);
      setRevealedBase(updater);
    }
  };

  return {
    flipped,
    locked,
    revealed,
    randomImages,
    cardWeights,
    messages,       // 🔹 추가
    setFlipped,
    setLocked,
    setRevealed: debugSetRevealed,
    setRandomImages,
    setCardWeights,
    setMessages,    // 🔹 추가
    loaded,
  };
}