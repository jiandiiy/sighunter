// src/features/games/sig-slot/hooks/useSlotGame.js
// ✅ Firebase, 이미지 로딩, 슬롯 상태 등 공용 로직을 한곳에 모음
// index.js와 player.jsx에서 모두 사용 가능

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  PROGRAMS,
  PROGRAM_KEY_MAP,
  SIG_RANGES,
  SPEED_STAGES,
  SPIN_MIN,
  SPIN_MAX,
  makeDefaultRewards,
  pickReward,
  shuffleArray,
} from "../utils/slotUtils";
import {
  fetchImagesFromStorage,
  fetchRewardsFromFirestore,
  preloadImages,
} from "../utils/slotUtils";

// ─────────────────────────────────────────────
// useSlot 훅 — 개별 슬롯 상태 관리
// ─────────────────────────────────────────────
export function useSlot(images, rewards) {
  const [phase, setPhase] = useState("idle");
  const [idx, setIdx] = useState(0);
  const [speedStage, setSpeedStage] = useState(0);
  const [resultImage, setResultImage] = useState(null);
  const [resultReward, setResultReward] = useState(null);
  const [sparkle, setSparkle] = useState(false);
  const [bouncing, setBouncing] = useState(false);
  const [shuffledImages, setShuffledImages] = useState([]);

  const frameRef = useRef(null);
  const timerRefs = useRef([]);
  const imagesRef = useRef([]);
  const isSpinning = useRef(false);
  const lastIdxRef = useRef(0);
  const targetImageRef = useRef(null);

  useEffect(() => {
    if (!isSpinning.current) {
      imagesRef.current = images;
    }
  }, [images]);

  const clearAll = useCallback(() => {
    clearInterval(frameRef.current);
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  }, []);

  const startLoop = useCallback((interval, stage) => {
    clearInterval(frameRef.current);
    setSpeedStage(stage);
    frameRef.current = setInterval(() => {
      const list = imagesRef.current;
      setIdx((p) => {
        const next = (p + 1) % Math.max(list.length, 1);
        lastIdxRef.current = next;
        return next;
      });
    }, interval);
  }, []);

  const doStop = useCallback(() => {
    clearAll();
    isSpinning.current = false;

    const list = imagesRef.current;
    const curIdx = lastIdxRef.current;

    const picked = targetImageRef.current ?? list[curIdx % Math.max(list.length, 1)] ?? null;
    targetImageRef.current = null;

    const finalIdx = picked
      ? Math.max(list.findIndex((img) => img.id === picked.id), 0)
      : curIdx % Math.max(list.length, 1);

    setIdx(finalIdx);
    setResultImage(picked);
    setResultReward(pickReward(rewards));
    setPhase("stopped");
    setBouncing(true);
    setTimeout(() => setBouncing(false), 600);
    setSparkle(true);
    setTimeout(() => setSparkle(false), 900);
  }, [clearAll, rewards]);

  const spin = useCallback(() => {
    if (!images.length || !rewards.length) return;
    clearAll();

    const nextShuffledImages = shuffleArray(images);
    imagesRef.current = nextShuffledImages;
    isSpinning.current = true;

    setShuffledImages(nextShuffledImages);
    setPhase("spinning");
    setResultImage(null);
    setResultReward(null);
    setIdx(0);
    setSpeedStage(0);
    setBouncing(false);
    setSparkle(false);

    const spinDuration = SPIN_MIN + Math.random() * (SPIN_MAX - SPIN_MIN);
    const s3Duration = SPEED_STAGES[3].frames * SPEED_STAGES[3].interval;
    const s2Duration = SPEED_STAGES[2].frames * SPEED_STAGES[2].interval;
    const s1Duration = SPEED_STAGES[1].frames * SPEED_STAGES[1].interval;
    const t1 = spinDuration - s3Duration - s2Duration - s1Duration;
    const t2 = t1 + s1Duration;
    const t3 = t2 + s2Duration;
    const t4 = t3 + s3Duration;

    const push = (fn, delay) => {
      const id = setTimeout(fn, Math.max(delay, 0));
      timerRefs.current.push(id);
    };

    push(() => startLoop(SPEED_STAGES[0].interval, 0), 0);
    push(() => startLoop(SPEED_STAGES[1].interval, 1), t1);
    push(() => startLoop(SPEED_STAGES[2].interval, 2), t2);
    push(() => startLoop(SPEED_STAGES[3].interval, 3), t3);
    push(doStop, t4);
  }, [clearAll, startLoop, doStop, images, rewards]);

  const reset = useCallback(() => {
    if (isSpinning.current) return;
    clearAll();
    imagesRef.current = images;
    setShuffledImages([]);
    setPhase("idle");
    setResultImage(null);
    setResultReward(null);
    setIdx(images.length > 0 ? Math.floor(Math.random() * images.length) : 0);
    setSpeedStage(0);
    setBouncing(false);
    setSparkle(false);
  }, [clearAll, images]);

  const flip = useCallback(() => {
    if (phase === "stopped") setPhase("flipped");
  }, [phase]);

  const softStopAt = useCallback((targetImage) => {
    if (!isSpinning.current) return;

    targetImageRef.current = targetImage;
    clearAll();

    const s1 = SPEED_STAGES[1];
    const s2 = SPEED_STAGES[2];
    const s3 = SPEED_STAGES[3];
    const t1 = 0;
    const t2 = t1 + s1.frames * s1.interval;
    const t3 = t2 + s2.frames * s2.interval;
    const t4 = t3 + s3.frames * s3.interval;

    const push = (fn, delay) => {
      const id = setTimeout(fn, Math.max(delay, 0));
      timerRefs.current.push(id);
    };

    push(() => startLoop(s1.interval, 1), t1);
    push(() => startLoop(s2.interval, 2), t2);
    push(() => startLoop(s3.interval, 3), t3);
    push(doStop, t4);
  }, [clearAll, startLoop, doStop]);

  useEffect(() => () => clearAll(), [clearAll]);

  return {
    phase,
    idx,
    speedStage,
    resultImage,
    resultReward,
    sparkle,
    bouncing,
    spin,
    reset,
    flip,
    softStopAt,
    shuffledImages,
  };
}

// ─────────────────────────────────────────────
// useSlotGame 훅 — 전체 게임 상태 관리
// ─────────────────────────────────────────────
export function useSlotGame(defaultSlotMode = 1) {
  const [program, setProgram] = useState("뮤즈");
  const [slotMode, setSlotMode] = useState(defaultSlotMode);
  const [range, setRange] = useState(SIG_RANGES[0]);
  const [savedPrograms, setSavedPrograms] = useState({});
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const [imagesMap, setImagesMap] = useState({});
  const [preloadedKeys, setPreloadedKeys] = useState(new Set());
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState("");

  const [rewardsMap, setRewardsMap] = useState(() =>
    Object.fromEntries(PROGRAMS.map((p) => [p, makeDefaultRewards()]))
  );

  // 사운드
  const slotAudioRef = useRef(null);
  const buttonAudioRef = useRef(null);

  // 초기화: 사운드 객체 생성
  useEffect(() => {
    slotAudioRef.current = new Audio("/sounds/slot.mp3");
    slotAudioRef.current.loop = true;
    slotAudioRef.current.volume = 0.5;

    buttonAudioRef.current = new Audio("/sounds/button.mp3");
    buttonAudioRef.current.volume = 0.7;

    return () => {
      if (slotAudioRef.current) {
        slotAudioRef.current.pause();
        slotAudioRef.current.currentTime = 0;
      }
      if (buttonAudioRef.current) {
        buttonAudioRef.current.pause();
        buttonAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  const cacheKey = `${program}-${range?.label ?? "전체"}`;
  const currentImages = imagesMap[cacheKey] || [];
  const currentRewards = rewardsMap[program] || [];
  const programKey = PROGRAM_KEY_MAP[program];
  const isFullyLoaded = preloadedKeys.has(cacheKey);

  // ✅ 슬롯 객체 3개 생성 (index.js에서 필요)
  const s0 = useSlot(currentImages, currentRewards);
  const s1 = useSlot(currentImages, currentRewards);
  const s2 = useSlot(currentImages, currentRewards);

  // ✅ slotMode에 따라 slots 배열 생성
  const slots = useMemo(() => {
    return [s0, s1, s2].slice(0, slotMode);
  }, [s0, s1, s2, slotMode]);

  // 이미지 로딩
  useEffect(() => {
    if (preloadedKeys.has(cacheKey)) {
      setImgLoading(false);
      return;
    }

    const key = PROGRAM_KEY_MAP[program];
    setImgLoading(true);
    setImgError("");

    fetchImagesFromStorage(key, range, null)
      .then(async (imgs) => {
        setImagesMap((prev) => ({ ...prev, [cacheKey]: imgs }));
        await preloadImages(imgs);
        setPreloadedKeys((prev) => new Set([...prev, cacheKey]));
        setImgLoading(false);
      })
      .catch((e) => {
        setImgError(e.message);
        setImgLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program, range, cacheKey]);

  // 보상 로딩
  useEffect(() => {
    const key = PROGRAM_KEY_MAP[program];
    fetchRewardsFromFirestore(key).then((items) => {
      if (items) setRewardsMap((prev) => ({ ...prev, [program]: items }));
    });
  }, [program]);

  // 프로그램/범위 변경 시 슬롯 초기화
  useEffect(() => {
    slots.forEach((s) => s.reset());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program, range]);

  // ✅ 모든 슬롯이 정지되면 사운드 중단
  useEffect(() => {
    const allStopped = slots.every((s) => s.phase !== "spinning");
    if (allStopped && slotAudioRef.current) {
      slotAudioRef.current.pause();
      slotAudioRef.current.currentTime = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots.map((s) => s.phase).join(",")]);

  // ✅ 프로그램 변경 시 사운드 정지
  useEffect(() => {
    return () => {
      if (slotAudioRef.current) {
        slotAudioRef.current.pause();
        slotAudioRef.current.currentTime = 0;
      }
    };
  }, [program]);

  const handleSaveRewards = (prog, rewards) => {
    setRewardsMap((prev) => ({ ...prev, [prog]: rewards }));
    setSavedPrograms((prev) => ({
      ...prev,
      [prog]: new Date().toLocaleTimeString(),
    }));
  };

  const addHistory = useCallback(
    (image, reward) => {
      setHistory((prev) => [
        { id: Date.now(), image, reward, program, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9),
      ]);
    },
    [program]
  );

  // ✅ START 버튼 핸들러
  const handleStart = useCallback(() => {
    const anySpinning = slots.some((s) => s.phase === "spinning");
    if (anySpinning || !isFullyLoaded) return;

    // 버튼 사운드
    if (buttonAudioRef.current) {
      buttonAudioRef.current.pause();
      buttonAudioRef.current.currentTime = 0;
      buttonAudioRef.current.play().catch(() => {});
    }

    // 슬롯 사운드 준비 (버튼 음향 후 시작)
    if (slotAudioRef.current) {
      slotAudioRef.current.pause();
      slotAudioRef.current.currentTime = 0;
      setTimeout(() => {
        if (slotAudioRef.current && slotAudioRef.current.paused) {
          slotAudioRef.current.play().catch(() => {});
        }
      }, 100);
    }

    slots.forEach((s, i) => {
      if (i === 0) {
        s.spin();
      } else {
        setTimeout(() => s.spin(), i * 300);
      }
    });
  }, [slots, isFullyLoaded]);

  // ✅ 새로고침 핸들러
  const handleRefresh = useCallback(() => {
    slots.forEach((s) => s.reset());
  }, [slots]);

  // ✅ 슬롯 선택 핸들러 (연출 기능용)
  const handleTargetSlot = useCallback((idx) => {
    // 이건 index.js/player.jsx에서 자체 상태로 관리하도록 설계
    // 여기서는 구조만 제공
  }, []);

  // ✅ 이미지 선택 핸들러 (연출 기능용)
  const handlePickImage = useCallback((targetSlotIdx, image) => {
    if (targetSlotIdx === null) return;
    const slot = slots[targetSlotIdx];
    if (!slot || slot.phase !== "spinning") return;
    slot.softStopAt(image);
  }, [slots]);

  return {
    // State
    program,
    setProgram,
    slotMode,
    setSlotMode,
    range,
    setRange,
    savedPrograms,
    setSavedPrograms,
    history,
    setHistory,
    showHistory,
    setShowHistory,
    imagesMap,
    preloadedKeys,
    imgLoading,
    imgError,
    rewardsMap,
    setRewardsMap,

    // Computed
    cacheKey,
    currentImages,
    currentRewards,
    programKey,
    isFullyLoaded,

    // ✅ Slots (NEW)
    slots,
    s0,
    s1,
    s2,

    // Refs
    slotAudioRef,
    buttonAudioRef,

    // Handlers
    handleSaveRewards,
    addHistory,
    handleStart,
    handleRefresh,
    handleTargetSlot,
    handlePickImage,
  };
}