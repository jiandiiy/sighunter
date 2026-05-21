// src/features/games/sig-slot/index.js

import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getStorage, ref as storageRef, listAll, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { SlotMachine } from "./components/SlotMachine";
import { AdminModal } from "./components/AdminModal";
import { ManualModal } from "./components/ManualModal";
import { HistoryPanel } from "./components/HistoryPanel";
import "./styles/slot.css";

// ─────────────────────────────────────────────
// Firebase 초기화
// ─────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY            || "AIzaSyDtSFww9PH2CEMJz9caYvN__C_SXmyxr0w",
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN        || "sig-hunter.firebaseapp.com",
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID         || "sig-hunter",
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET     || "sig-hunter.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID|| "702524786134",
  appId:             process.env.REACT_APP_FIREBASE_APP_ID             || "1:702524786134:web:259a88e3cd473531571077",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const storage = getStorage(app);
const db      = getFirestore(app);

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────
const PROGRAMS = ["뮤즈", "퀸덤", "홀릭"];
const PROGRAM_KEY_MAP = { 뮤즈: "muse", 퀸덤: "queendom", 홀릭: "holic" };
const SIG_RANGES = [
  { label: "1000~2000", min: 1000, max: 2000 },
  { label: "1000~3000", min: 1000, max: 3000 },
  { label: "1000~5000", min: 1000, max: 5000 },
  { label: "5000~10000", min: 5000, max: 10000 },
];

const SPEED_STAGES = [
  { interval: 60,  frames: null },
  { interval: 110, frames: 6  },
  { interval: 200, frames: 5  },
  { interval: 340, frames: 3  },
];

const DECEL_DURATION =
  SPEED_STAGES.slice(1).reduce((sum, s) => sum + s.frames * s.interval, 0);
const SPIN_MIN = DECEL_DURATION + 1500;
const SPIN_MAX = DECEL_DURATION + 5000;

// ─────────────────────────────────────────────
// 이미지 프리로딩 유틸
// ─────────────────────────────────────────────
function preloadImages(images) {
  images.forEach((img) => {
    if (!img?.url) return;
    const el = new Image();
    el.src = img.url;
  });
}

// ─────────────────────────────────────────────
// fetchImagesFromStorage
// ─────────────────────────────────────────────
async function fetchImagesFromStorage(programKey, rangeFilter = null, onPartial = null) {
  const groups = ["group01","group02","group03","group04",
                  "group05","group06","group07","group08"];

  let accumulated = [];

  const promises = groups.map(async (group) => {
    try {
      const folderRef = storageRef(storage, `images/${programKey}/${group}`);
      const listResult = await listAll(folderRef);
      const items = await Promise.all(
        listResult.items.map(async (item) => {
          const url  = await getDownloadURL(item);
          const name = item.name.replace(/\.[^.]+$/, "");
          const sigNum = parseInt(name, 10);
          return { id: item.fullPath, url, name, sigNum: isNaN(sigNum) ? null : sigNum, group };
        })
      );

      if (onPartial) {
        accumulated = [...accumulated, ...items];
        const filtered = rangeFilter
          ? accumulated.filter((img) => img.sigNum !== null && img.sigNum >= rangeFilter.min && img.sigNum <= rangeFilter.max)
          : accumulated;
        onPartial(filtered);
      }

      return items;
    } catch {
      return [];
    }
  });

  const results = await Promise.allSettled(promises);
  const allImages = results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  if (rangeFilter) {
    return allImages.filter(
      (img) => img.sigNum !== null && img.sigNum >= rangeFilter.min && img.sigNum <= rangeFilter.max
    );
  }
  return allImages;
}

// ─────────────────────────────────────────────
// Firestore — 보상 저장/불러오기
// ─────────────────────────────────────────────
async function fetchRewardsFromFirestore(programKey) {
  const docRef = doc(db, "sigSlotRewards", programKey);
  const snap   = await getDoc(docRef);
  if (snap.exists()) return snap.data().items || [];
  return null;
}

async function saveRewardsToFirestore(programKey, rewards) {
  const docRef = doc(db, "sigSlotRewards", programKey);
  await setDoc(docRef, { items: rewards, updatedAt: new Date().toISOString() });
}

// ─────────────────────────────────────────────
// 기본 보상 / 보상 추첨
// ─────────────────────────────────────────────
const makeDefaultRewards = () => [
  { id: "r1", icon: "🎁", name: "기여도 보상",  description: "기여도 +500 지급",   probability: 40 },
  { id: "r2", icon: "💰", name: "상금 보상",    description: "상금 10,000원 지급", probability: 30 },
  { id: "r3", icon: "🔑", name: "열쇠 보상",    description: "열쇠 알파벳 A 지급", probability: 20 },
  { id: "r4", icon: "⭐", name: "특별 보상",    description: "특별 아이템 지급",   probability: 10 },
];

function pickReward(rewards) {
  const total = rewards.reduce((s, r) => s + r.probability, 0);
  let rand = Math.random() * total;
  for (const r of rewards) {
    rand -= r.probability;
    if (rand <= 0) return r;
  }
  return rewards[rewards.length - 1];
}

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ─────────────────────────────────────────────
// useSlot 훅
// ─────────────────────────────────────────────
function useSlot(images, rewards) {
  const [phase, setPhase] = useState("idle");
  const [idx, setIdx] = useState(0);
  const [speedStage, setSpeedStage] = useState(0);
  const [resultImage, setResultImage] = useState(null);
  const [resultReward, setResultReward] = useState(null);
  const [sparkle, setSparkle] = useState(false);
  const [bouncing, setBouncing] = useState(false);
  const [shuffledImages, setShuffledImages] = useState([]);

  const frameRef       = useRef(null);
  const timerRefs      = useRef([]);
  const imagesRef      = useRef([]);
  const isSpinning     = useRef(false);
  const lastIdxRef     = useRef(0);
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
    phase, idx, speedStage, resultImage, resultReward, sparkle, bouncing,
    spin, reset, flip, softStopAt, shuffledImages,
  };
}

// ─────────────────────────────────────────────
// 메인 SigSlot 컴포넌트
// ─────────────────────────────────────────────
export default function SigSlot() {
  const [program, setProgram] = useState("뮤즈");
  const [slotMode, setSlotMode] = useState(1);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [savedPrograms, setSavedPrograms] = useState({});
  const [range, setRange] = useState(SIG_RANGES[0]);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const [imagesMap, setImagesMap] = useState({});
  const [loadedKeys, setLoadedKeys] = useState(new Set());
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState("");

  const [rewardsMap, setRewardsMap] = useState(() =>
    Object.fromEntries(PROGRAMS.map((p) => [p, makeDefaultRewards()]))
  );

  // ─────────────────────────────────────────────
  // 사운드 ref 초기화
  // slot.mp3  : 슬롯 회전 중 루프 재생
  // button.mp3: START 버튼 클릭 시 1회 재생
  // ─────────────────────────────────────────────
  const slotAudioRef   = useRef(null); // ✅ 기존 slot.mp3
  const buttonAudioRef = useRef(null); // ✅ [추가] button.mp3

  useEffect(() => {
    slotAudioRef.current = new Audio("/sounds/slot.mp3");
    slotAudioRef.current.loop = true;

    buttonAudioRef.current = new Audio("/sounds/button.mp3"); // ✅ [추가]

    return () => {
      slotAudioRef.current.pause();
      slotAudioRef.current = null;
      buttonAudioRef.current.pause();                         // ✅ [추가]
      buttonAudioRef.current = null;                          // ✅ [추가]
    };
  }, []);

  const cacheKey = `${program}-${range?.label ?? "전체"}`;
  const currentImages = imagesMap[cacheKey] || [];
  const currentRewards = rewardsMap[program] || [];
  const programKey = PROGRAM_KEY_MAP[program];
  const isFullyLoaded = loadedKeys.has(cacheKey);

  useEffect(() => {
    if (loadedKeys.has(cacheKey)) {
      setImgLoading(false);
      return;
    }

    const key = PROGRAM_KEY_MAP[program];
    setImgLoading(true);
    setImgError("");

    const handlePartial = (partialImages) => {
      preloadImages(partialImages);
    };

    fetchImagesFromStorage(key, range, handlePartial)
      .then((imgs) => {
        preloadImages(imgs);
        setImagesMap((prev) => ({ ...prev, [cacheKey]: imgs }));
        setLoadedKeys((prev) => new Set([...prev, cacheKey]));
        setImgLoading(false);
      })
      .catch((e) => {
        setImgError(e.message);
        setImgLoading(false);
      });
  }, [program, range, cacheKey, loadedKeys]);

  useEffect(() => {
    const key = PROGRAM_KEY_MAP[program];
    fetchRewardsFromFirestore(key).then((items) => {
      if (items) setRewardsMap((prev) => ({ ...prev, [program]: items }));
    });
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

  const s0 = useSlot(currentImages, currentRewards);
  const s1 = useSlot(currentImages, currentRewards);
  const s2 = useSlot(currentImages, currentRewards);
  const slots = [s0, s1, s2].slice(0, slotMode);

  const [targetSlotIdx, setTargetSlotIdx] = useState(null);

  const handleTargetSlot = useCallback((idx) => {
    setTargetSlotIdx((prev) => (prev === idx ? null : idx));
  }, []);

  const handlePickImage = useCallback((image) => {
    if (targetSlotIdx === null) return;
    const slot = [s0, s1, s2][targetSlotIdx];
    if (!slot || slot.phase !== "spinning") return;
    slot.softStopAt(image);
    setTargetSlotIdx(null);
  }, [targetSlotIdx, s0, s1, s2]);

  useEffect(() => {
    s0.reset();
    s1.reset();
    s2.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program, range]);

  // 슬롯 전체 정지 감지 → slot.mp3 중단
  const phaseKey = slots.map((s) => s.phase).join(",");

  useEffect(() => {
    const allStopped = slots.every((s) => s.phase !== "spinning");
    if (allStopped && slotAudioRef.current) {
      slotAudioRef.current.pause();
      slotAudioRef.current.currentTime = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseKey]);

  useEffect(() => {
    slots.forEach((slot) => {
      if (slot.phase === "stopped" && slot.resultImage && slot.resultReward) {
        addHistory(slot.resultImage, slot.resultReward);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseKey]);

  const handleStart = () => {
    const anySpinning = slots.some((s) => s.phase === "spinning");
    if (anySpinning) return;
    if (!isFullyLoaded) return;

    // ✅ [추가] button.mp3 — 클릭 즉시 1회 재생
    if (buttonAudioRef.current) {
      buttonAudioRef.current.currentTime = 0;
      buttonAudioRef.current.play().catch(() => {});
    }

    // slot.mp3 — 슬롯 회전 시작과 함께 루프 재생
    if (slotAudioRef.current) {
      slotAudioRef.current.currentTime = 0;
      slotAudioRef.current.play().catch(() => {});
    }

    slots.forEach((s, i) => {
      if (i === 0) {
        s.spin();
      } else {
        const id = setTimeout(() => s.spin(), i * 300);
        void id;
      }
    });
  };

  const handleRefresh = () => slots.forEach((s) => s.reset());

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white flex flex-col items-center py-10 px-4 gap-5">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🎰</span>
          <h1 className="text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-300 drop-shadow-lg">
            SIG SLOT
          </h1>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowAdmin((v) => !v)}
              className="text-xs text-gray-400 border border-gray-700 rounded-lg px-2 py-1 hover:border-purple-500 hover:text-purple-300 transition"
            >⚙️ 관리</button>
            <button
              onClick={() => setShowManual(true)}
              className="text-xs text-gray-400 border border-gray-700 rounded-lg px-2 py-1 hover:border-blue-500 hover:text-blue-300 transition"
            >📖 매뉴얼</button>
          </div>
          {savedPrograms[program] && (
            <span className="text-green-500 text-xs">✅ {savedPrograms[program]} 저장</span>
          )}
        </div>
      </div>

      {/* 프로그램 탭 */}
      <div className="flex gap-2">
        {PROGRAMS.map((p) => (
          <button
            key={p}
            onClick={() => setProgram(p)}
            className={`px-5 py-2 rounded-full font-bold text-sm transition ${
              program === p
                ? "bg-purple-600 text-white shadow-lg shadow-purple-900"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >{p}</button>
        ))}
      </div>

      {/* 슬롯 모드 전환 */}
      <div className="flex gap-2 bg-gray-900 rounded-xl p-1">
        {[1, 3].map((n) => (
          <button
            key={n}
            onClick={() => setSlotMode(n)}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${
              slotMode === n ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >{n === 1 ? "🎴" : "🎴🎴🎴"}</button>
        ))}
      </div>

      {/* 시그 구간 선택 */}
      <div className="flex gap-2 flex-wrap justify-center">
        {SIG_RANGES.map((r) => (
          <button
            key={r.label}
            onClick={() => setRange(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
              range?.label === r.label
                ? "border-yellow-400 text-yellow-300 bg-yellow-400/10"
                : "border-gray-700 text-gray-400 hover:border-gray-500"
            }`}
          >{r.label}</button>
        ))}
        <button
          onClick={() => setRange(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
            range === null
              ? "border-yellow-400 text-yellow-300 bg-yellow-400/10"
              : "border-gray-700 text-gray-400 hover:border-gray-500"
          }`}
        >전체</button>
      </div>

      {/* 매뉴얼 모달 */}
      {showManual && (
        <ManualModal onClose={() => setShowManual(false)} />
      )}

      {/* 관리자 모달 */}
      {showAdmin && (
        <AdminModal
          program={program}
          programKey={programKey}
          rewardsMap={rewardsMap}
          onSave={handleSaveRewards}
          onClose={() => setShowAdmin(false)}
          saveRewardsToFirestore={saveRewardsToFirestore}
        />
      )}

      {/* 이미지 로딩/에러 상태 */}
      <div className="min-h-[80px] flex flex-col items-center justify-center">
        {imgLoading && (
          <>
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-purple-300 text-sm mt-2">이미지 불러오는 중...</div>
          </>
        )}
        {imgError && !imgLoading && (
          <div className="text-red-400 text-xs bg-red-900/30 rounded-lg px-4 py-2">
            ⚠️ 이미지 로드 실패: {imgError}
          </div>
        )}
        {!imgLoading && !imgError && currentImages.length === 0 && (
          <div className="text-gray-500 text-xs">해당 구간의 이미지가 없습니다.</div>
        )}
      </div>

      {/* 슬롯머신 */}
      {isFullyLoaded && currentImages.length > 0 && (
        <SlotMachine
          images={currentImages}
          rewards={currentRewards}
          slotCount={slotMode}
          onResult={addHistory}
          slots={slots}
          onStart={handleStart}
          onRefresh={handleRefresh}
          targetSlotIdx={targetSlotIdx}
          onTargetSlot={handleTargetSlot}
          onPickImage={handlePickImage}
        />
      )}

      {/* 당첨 히스토리 */}
      <HistoryPanel
        history={history}
        show={showHistory}
        onToggle={() => setShowHistory((v) => !v)}
      />

      {/* 이미지 개수 표시 */}
      {currentImages.length > 0 && (
        <div className="text-gray-600 text-xs">
          {program} · {range?.label ?? "전체"} · {currentImages.length}개 이미지 로드됨
        </div>
      )}
    </div>
  );
}
