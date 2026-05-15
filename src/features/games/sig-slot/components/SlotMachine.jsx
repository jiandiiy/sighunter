import "../styles/slot.css";

// ─────────────────────────────────────────────
// 스파클
// ─────────────────────────────────────────────
export function Sparkles() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-yellow-300"
          style={{
            top: "50%", left: "50%",
            transform: `rotate(${(i / 12) * 360}deg) translateY(-70px)`,
            animation: `sparkle 0.6s ease-out ${(i * 0.07).toFixed(2)}s both`,
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 카드 플립
// ─────────────────────────────────────────────
export function FlipCard({ image, reward, isFlipped, onFlip, canFlip, size = "lg" }) {
  const dim       = size === "lg" ? "w-64 h-64" : "w-44 h-44";
  const titleSize = size === "lg" ? "text-xl"   : "text-base";
  const descSize  = size === "lg" ? "text-sm"   : "text-xs";
  return (
    <div
      className={`relative ${dim} cursor-pointer select-none transition-transform ${
        canFlip && !isFlipped ? "hover:scale-105" : ""
      }`}
      style={{ perspective: "1000px" }}
      onClick={canFlip ? onFlip : undefined}
    >
      <div
        className="relative w-full h-full transition-transform duration-700"
        style={{ transformStyle: "preserve-3d", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        {/* 앞면 */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border-4 border-purple-400"
          style={{ backfaceVisibility: "hidden" }}
        >
          <img src={image?.url} alt={image?.name} className="w-full h-full object-cover" />
          {canFlip && !isFlipped && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-sm font-bold animate-pulse text-center px-2">클릭하여<br />보상 확인</span>
            </div>
          )}
        </div>
        {/* 뒷면 — 보상 */}
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-800 shadow-2xl border-4 border-yellow-400 flex flex-col items-center justify-center p-4 gap-2"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="text-3xl">🎁</div>
          <div className={`text-yellow-300 ${titleSize} font-extrabold text-center`}>{reward?.name}</div>
          <div className="w-12 h-0.5 bg-yellow-400 rounded" />
          <div className={`text-white text-center ${descSize} leading-relaxed`}>{reward?.description}</div>
          {image?.sigNum && (
            <div className="mt-1 text-purple-300 text-xs">
              SIG <span className="font-bold text-yellow-300">{image.sigNum}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 슬롯 스피너
// ─────────────────────────────────────────────
function getSlideAnim(stage) {
  if (stage === 0) return "slideInFast 0.06s ease-out";
  if (stage === 1) return "slideInMid  0.10s ease-out";
  if (stage === 2) return "slideInSlow 0.18s ease-out";
  return              "slideInCrawl 0.30s cubic-bezier(0.22,1,0.36,1)";
}

export function SlotSpinner({ images, currentIndex, speedStage = 0, size = "lg" }) {
  const dim = size === "lg" ? "w-64 h-64" : "w-44 h-44";
  if (!images.length) return (
    <div className={`${dim} rounded-2xl bg-gray-800 border-4 border-gray-700 flex items-center justify-center`}>
      <span className="text-gray-500 text-xs text-center px-4">이미지 로딩 중...</span>
    </div>
  );
  const img = images[currentIndex % images.length];
  return (
    <div className={`relative ${dim} rounded-2xl overflow-hidden shadow-2xl border-4 border-purple-400 bg-black`}>
      <img
        key={currentIndex}
        src={img.url}
        alt={img.name}
        className="w-full h-full object-cover"
        style={{ animation: getSlideAnim(speedStage) }}
      />
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-center text-xs py-1 truncate px-2">
        {img.sigNum ? `SIG ${img.sigNum}` : img.name}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 슬롯머신 외관 + 슬롯 섹션
// ─────────────────────────────────────────────
export function SlotMachine({ 
  images, 
  rewards, 
  slotCount, 
  onResult,
  slots, // [s0, s1, s2] useSlot 훅 결과 배열
  onStart,
  onRefresh
}) {
  const anySpinning = slots.some((s) => s.phase === "spinning");
  const size = slotCount === 1 ? "lg" : "sm";

  return (
    <div className="relative">
      {/* 슬롯머신 본체 */}
      <div className="relative bg-gradient-to-b from-gray-800 via-gray-900 to-gray-800 rounded-3xl border-4 border-yellow-600 shadow-2xl p-8 pt-12 pb-6"
           style={{ boxShadow: "0 0 40px rgba(168, 85, 247, 0.4), inset 0 2px 20px rgba(0,0,0,0.5)" }}>
        
        {/* 상단 아치형 헤더 */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-4/5 h-20 bg-gradient-to-b from-purple-900 to-gray-800 rounded-t-full border-4 border-yellow-600 border-b-0 flex items-center justify-center"
             style={{ boxShadow: "0 -4px 20px rgba(168, 85, 247, 0.3)" }}>
          <div className="flex items-center gap-2">
            <span className="text-3xl">🎰</span>
            <span className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-300 drop-shadow-lg">
              SIG SLOT
            </span>
          </div>
        </div>

        {/* 경고등 */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-8 h-8 bg-yellow-400 rounded-full border-2 border-yellow-600"
             style={{ 
               boxShadow: "0 0 20px rgba(250, 204, 21, 0.8)",
               animation: anySpinning ? "blink 0.6s infinite" : "none"
             }} />

        {/* 슬롯 디스플레이 영역 */}
        <div className="bg-black/80 rounded-2xl p-6 border-2 border-gray-700 mb-6">
          <div className={`flex gap-0 ${slotCount === 3 ? "flex-row" : "flex-col items-center"}`}>
            {slots.map((slot, i) => (
              <div key={i} className="relative flex flex-col items-center gap-1">
                {slotCount === 3 && <span className="text-xs text-yellow-400 mb-1 font-bold">SLOT {i + 1}</span>}
                <div
                  className="relative"
                  style={
                    slot.phase === "stopped"
                      ? { animation: "glowPulse 1.2s ease-in-out infinite" }
                      : slot.bouncing
                      ? { animation: "stopBounce 0.55s cubic-bezier(0.36,0.07,0.19,0.97)" }
                      : {}
                  }
                >
                  {slot.phase === "stopped" || slot.phase === "flipped" ? (
                    <>
                      <FlipCard
                        image={slot.resultImage}
                        reward={slot.resultReward}
                        isFlipped={slot.phase === "flipped"}
                        onFlip={slot.flip}
                        canFlip={slot.phase === "stopped"}
                        size={size}
                      />
                      {slot.sparkle && <Sparkles />}
                    </>
                  ) : (
                  <SlotSpinner
  images={slot.shuffledImages.length > 0 ? slot.shuffledImages : images}
  currentIndex={slot.idx}
  speedStage={slot.speedStage}
  size={size}
/>
                  )}
                </div>
                <div className="h-5 text-xs text-gray-400 text-center">
                  {slot.phase === "idle"     && "대기 중"}
                  {slot.phase === "spinning" && "🎰 돌아가는 중..."}
                  {slot.phase === "stopped"  && "🎁 보상 확인"}
                  {slot.phase === "flipped"  && `🎁 ${slot.resultReward?.name}`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 버튼 패널 */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onRefresh}
            className="px-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm transition"
          >🔄 새로고침</button>
          <button
            onClick={onStart}
            disabled={anySpinning}
            className={`px-10 py-3 rounded-xl font-black text-lg tracking-widest transition border-2 ${
              anySpinning
                ? "bg-gray-700 text-gray-500 cursor-not-allowed border-gray-600"
                : "bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 shadow-lg text-white border-yellow-500"
            }`}
            style={!anySpinning ? { boxShadow: "0 0 20px rgba(168, 85, 247, 0.6)" } : {}}
          >▶ START</button>
        </div>

        {/* 우측 레버 장식 */}
        <div className="absolute -right-6 top-1/3 flex flex-col items-center">
          <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-red-700 shadow-lg" />
          <div className="w-2 h-32 bg-gradient-to-b from-yellow-600 to-yellow-700 rounded-full shadow-md" />
        </div>

        {/* 하단 장식 패널 */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-gradient-to-b from-yellow-600 to-yellow-700 rounded-b-lg border-2 border-yellow-700 border-t-0" />
      </div>
    </div>
  );
}
