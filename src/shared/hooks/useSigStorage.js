// src/shared/hooks/useSigStorage.js
// 💾 시그헌터 공통 - Firestore 실시간 구독 + localStorage 동기화 통합 훅

import { useState, useEffect } from "react";
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
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { firestore } from "../../resources/firestore/firebase";

// ─────────────────────────────────────────
// 기본 메시지 세트
// ─────────────────────────────────────────
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

// ─────────────────────────────────────────
// 카드 → 프로젝트 / 기본 메시지
// ─────────────────────────────────────────
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

// ─────────────────────────────────────────
// 유틸: localStorage 안전 파싱
// ─────────────────────────────────────────
function tryParse(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

// ─────────────────────────────────────────
// 유틸: 중첩 필드 키 생성 (Firestore dot notation)
// 예) buildDotPath("flipped", "3") → "flipped.3"
// ─────────────────────────────────────────
const buildDotPath = (parent, key) => `${parent}.${key}`;

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

  const allSigCards = [...queendomSigCards, ...museSigCards, ...holicSigCards];
  const allCardIds = allSigCards.map((c) => String(c.id));

  const docRef = doc(firestore, "sigHunter", "main");

  // ─────────────────────────────────────────
  // flipped 정규화: 유효한 카드 ID만, true인 것만 유지
  // ─────────────────────────────────────────
  const sanitizeFlipped = (rawFlipped) => {
    if (!rawFlipped || typeof rawFlipped !== "object") return {};
    const safe = {};
    allCardIds.forEach((id) => {
      if (rawFlipped[id] === true) safe[id] = true;
    });
    return safe;
  };

  // ─────────────────────────────────────────
  // 기본 상태 생성
  // ─────────────────────────────────────────
  const buildDefaultState = () => {
    const initImgs = {};
    const initWeights = {};

    allSigCards.forEach((card) => {
      const imgs = card.frontImages;
      if (imgs?.length) {
        initImgs[card.id] = imgs[Math.floor(Math.random() * imgs.length)];
      }
      const baseMessages = getDefaultMessagesForCard(card);
      initWeights[String(card.id)] = baseMessages.map(
        (message) => message.weight ?? 1
      );
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
  // 1) Firestore 실시간 구독
  // hasPendingWrites: 내가 방금 쓴 변경은 무시 → 에코 루프 방지
  // ─────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      docRef,
      { includeMetadataChanges: true },
      (snap) => {
        // 로컬에서 방금 쓴 변경은 건너뜀 (에코 방지)
        if (snap.metadata.hasPendingWrites) return;

        if (snap.exists()) {
          const data = snap.data();

          // flipped: merge 방식 — 원격 변경분만 반영, 로컬 상태 덮어쓰지 않음
          const safeFlipped = sanitizeFlipped(data.flipped ?? {});
          setFlippedState((prev) => {
            // 원격에서 온 값과 현재 로컬 값이 동일하면 리렌더 방지
            const isSame =
              JSON.stringify(prev) === JSON.stringify(safeFlipped);
            return isSame ? prev : safeFlipped;
          });

          setLockedState(data.locked || {});
          setRevealedBase(data.revealed || {});
          setRandomImagesState(data.randomImages || {});
          setCardWeightsState(data.cardWeights || {});
          setMessagesState(data.messagesByProject || messagesByProjectDefault);

          if (data.cardWeights) {
            localStorage.setItem(
              "cardWeights",
              JSON.stringify(data.cardWeights)
            );
          }
        } else {
          // 문서 없으면 기본값으로 생성
          const def = buildDefaultState();

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
        setFlippedState(sanitizeFlipped(tryParse("sigFlipped", {})));
        setLockedState(tryParse("sigLocked", {}));
        setRevealedBase(tryParse("sigRevealed", {}));
        setRandomImagesState(tryParse("sigImages", {}));
        setCardWeightsState(tryParse("cardWeights", {}));
        setMessagesState(messagesByProjectDefault);
        setLoaded(true);
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────
  // 2) localStorage 동기화
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
  // 3) 원격 저장 헬퍼
  // ─────────────────────────────────────────

  // 전체 필드 교체 (locked, randomImages, messagesByProject 등)
  const pushToRemote = (payload) => {
    setDoc(docRef, payload, { merge: true }).catch((e) =>
      console.error("[useSigStorage] 원격 저장 실패:", e)
    );
  };

  // 단일 dot-notation 필드만 업데이트 (flipped.3 = true 등)
  // → 다른 카드 상태를 건드리지 않음
  const pushDotField = (dotKey, value) => {
    updateDoc(docRef, { [dotKey]: value }).catch((e) =>
      console.error("[useSigStorage] 필드 업데이트 실패:", e)
    );
  };

  // ─────────────────────────────────────────
  // 4) setFlipped — 핵심: 변경된 카드 키 하나만 Firestore에 push
  // ─────────────────────────────────────────
  const setFlipped = (updater) => {
    setFlippedState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;

      // 변경된 키만 찾아서 dot notation으로 부분 업데이트
      // → 다른 기기의 flipped 상태를 덮어쓰지 않음
      Object.keys(next).forEach((key) => {
        if (next[key] !== prev[key]) {
          if (next[key] === true) {
            pushDotField(buildDotPath("flipped", key), true);
          } else {
            // false or undefined → 필드 삭제 대신 false로 저장
            pushDotField(buildDotPath("flipped", key), false);
          }
        }
      });

      // prev에 있었는데 next에서 사라진 키 → false로 원격 반영
      Object.keys(prev).forEach((key) => {
        if (prev[key] === true && next[key] !== true) {
          pushDotField(buildDotPath("flipped", key), false);
        }
      });

      return next;
    });
  };

  // ─────────────────────────────────────────
  // 5) 나머지 setter — 전체 필드 교체 방식 유지
  // ─────────────────────────────────────────
  const wrapSetter = (setState, remoteKey) => (updater) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      pushToRemote({ [remoteKey]: next });
      return next;
    });
  };

  const setLocked = wrapSetter(setLockedState, "locked");
  const setRandomImages = wrapSetter(setRandomImagesState, "randomImages");
  const setMessagesByProject = wrapSetter(setMessagesState, "messagesByProject");

  // cardWeights: Firestore + localStorage 동시 저장
  const setCardWeights = (updater) => {
    setCardWeightsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      localStorage.setItem("cardWeights", JSON.stringify(next));
      pushToRemote({ cardWeights: next });
      return next;
    });
  };

  // setRevealed: Firestore 동기화
  const setRevealed = (updater) => {
    if (typeof updater === "function") {
      setRevealedBase((prev) => {
        const next = updater(prev);
        pushToRemote({ revealed: next });
        return next;
      });
    } else {
      pushToRemote({ revealed: updater });
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
