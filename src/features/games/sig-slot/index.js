// src/features/games/sig-slot/index.js

import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getStorage, ref as storageRef, listAll, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { SlotMachine } from "./components/SlotMachine";
import { AdminModal } from "./components/AdminModal";
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
const SPIN_MIN = 1500;
const SPIN_MAX = 5000;

// ─────────────────────────────────────────────
// 🚀 Fix 1 + Fix 3: 병렬 처리 + 점진적 로딩
// ─────────────────────────────────────────────
async function fetchImagesFromStorage(programKey, rangeFilter = null, onPartial = null) {
  const groups = ["group01","group02","group03","group04",
                  "group05","group06","group07","group08"];
  
  let accumulated = [];

  // 8개 그룹 병렬 요청
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
      
      // 점진적 로딩: 그룹 하나 완료될 때마다 콜백 호출
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

  const frameRef = useRef(null);
  const timerRefs = useRef([]);
  const imagesRef = useRef([]);

  const clearAll = useCallback(() => {
    clearInterval(frameRef.current);
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  }, []);

  const startLoop = useCallback((interval, stage) => {
    clearInterval(frameRef.current);
    setSpeedStage(stage);
    frameRef.current = setInterval(() => {
      const list = imagesRef.current.length > 0 ? imagesRef.current : images;
      setIdx((p) => (p + 1) % Math.max(list.length, 1));
    }, interval);
  }, [images]);

  const doStop = useCallback(() => {
    clearAll();
    setIdx((cur) => {
      const list = imagesRef.current.length > 0 ? imagesRef.current : images;
      const finalIdx = cur % Math.max(list.length, 1);
      setResultImage(list[finalIdx] ?? null);
      setResultReward(pickReward(rewards));
      setPhase("stopped");
      setBouncing(true);
      setTimeout(() => setBouncing(false), 600);
      setSparkle(true);
      setTimeout(() => setSparkle(false), 900);
      return finalIdx;
    });
  }, [clearAll, images, rewards]);

  const spin = useCallback((delayMs = 0) => {
    if (!images.length || !rewards.length) return;
    clearAll();
    const nextShuffledImages = shuffleArray(images);
    imagesRef.current = nextShuffledImages;
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
      const id = setTimeout(fn, delayMs + Math.max(delay, 0));
      timerRefs.current.push(id);
    };

    push(() => startLoop(SPEED_STAGES[0].interval, 0), 0);
    push(() => startLoop(SPEED_STAGES[1].interval, 1), t1);
    push(() => startLoop(SPEED_STAGES[2].interval, 2), t2);
    push(() => startLoop(SPEED_STAGES[3].interval, 3), t3);
    push(doStop, t4);
  }, [clearAll, startLoop, doStop, images, rewards]);

  const reset = useCallback(() => {
    clearAll();
    imagesRef.current = [];
    setShuffledImages([]);
    setPhase("idle");
    setResultImage(null);
    setResultReward(null);
    setIdx(images.length > 0 ? Math.floor(Math.random() * images.length) : 0);
    setSpeedStage(0);
    setBouncing(false);
    setSparkle(false);
  }, [clearAll, images.length]);

  const flip = useCallback(() => {
    if (phase === "stopped") setPhase("flipped");
  }, [phase]);

  useEffect(() => {
    reset();
  }, [images, reset]);

  useEffect(() => () => clearAll(), [clearAll]);

  return {
    phase, idx, speedStage, resultImage, resultReward, sparkle, bouncing,
    spin, reset, flip, shuffledImages,
  };
}

// ─────────────────────────────────────────────
// 메인 SigSlot 컴포넌트
// ─────────────────────────────────────────────
export default function SigSlot() {
  const [program, setProgram] = useState("뮤즈");
  const [slotMode, setSlotMode] = useState(1);
  const [showAdmin, setShowAdmin] = useState(false);
  const [savedPrograms, setSavedPrograms] = useState({});
  const [range, setRange] = useState(SIG_RANGES[0]);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // 🚀 Fix 2: 캐싱 — 키를 "프로그램-구간" 형태로 변경
  const [imagesMap, setImagesMap] = useState({});
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState("");

  const [rewardsMap, setRewardsMap] = useState(() =>
    Object.fromEntries(PROGRAMS.map((p) => [p, makeDefaultRewards()]))
  );

  // 캐시 키 생성
  const cacheKey = `${program}-${range?.label ?? "전체"}`;
  const currentImages = imagesMap[cacheKey] || [];
  const currentRewards = rewardsMap[program] || [];
  const programKey = PROGRAM_KEY_MAP[program];

  // ── 프로그램/구간 바뀔 때 이미지 로드 (캐싱 적용)
  useEffect(() => {
    // 이미 로드된 조합이면 스킵
    if (imagesMap[cacheKey]) {
      setImgLoading(false);
      return;
    }

    const key = PROGRAM_KEY_MAP[program];
    setImgLoading(true);
    setImgError("");

    // 점진적 로딩 콜백
    const handlePartial = (partialImages) => {
      setImagesMap((prev) => ({ ...prev, [cacheKey]: partialImages }));
    };

    fetchImagesFromStorage(key, range, handlePartial)
      .then((imgs) => {
        setImagesMap((prev) => ({ ...prev, [cacheKey]: imgs }));
        setImgLoading(false);
      })
      .catch((e) => {
        setImgError(e.message);
        setImgLoading(false);
      });
  }, [program, range, cacheKey, imagesMap]);

  // ── 프로그램 바뀔 때 보상 로드
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

  // ── 슬롯 훅 (3개)
  const s0 = useSlot(currentImages, currentRewards);
  const s1 = useSlot(currentImages, currentRewards);
  const s2 = useSlot(currentImages, currentRewards);
  const slots = [s0, s1, s2].slice(0, slotMode);

  // 프로그램/구간 바뀔 때 슬롯 리셋
  useEffect(() => {
    s0.reset();
    s1.reset();
    s2.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program, range, slotMode]);

  // 슬롯이 멈추면 히스토리에 추가
  const phaseKey = slots.map((s) => s.phase).join(",");
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
    slots.forEach((s, i) => s.spin(i * 500));
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
          <button
            onClick={() => setShowAdmin((v) => !v)}
            className="text-xs text-gray-400 border border-gray-700 rounded-lg px-2 py-1 hover:border-purple-500 hover:text-purple-300 transition"
          >⚙️ 관리</button>
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
      {currentImages.length > 0 && (
        <SlotMachine
          images={currentImages}
          rewards={currentRewards}
          slotCount={slotMode}
          onResult={addHistory}
          slots={slots}
          onStart={handleStart}
          onRefresh={handleRefresh}
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