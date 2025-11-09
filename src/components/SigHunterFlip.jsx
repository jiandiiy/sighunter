import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { sigCards } from "../data/sigData";
import "./flip.css";

export default function SigHunterNatural() {
  const [flipped, setFlipped] = useState({});
  const [revealed, setRevealed] = useState(() => {
    const saved = localStorage.getItem("sigRevealed");
    return saved ? JSON.parse(saved) : {};
  });
  const [popup, setPopup] = useState(null);
  const [randomImages, setRandomImages] = useState({}); // 이미지 파일 저장 상태

  /** 🎨 초기 이미지 불러오기 **/
  useEffect(() => {
    const savedImages = localStorage.getItem("sigImages");
    if (savedImages) {
      setRandomImages(JSON.parse(savedImages));
    } else {
      const initialImages = {};
      sigCards.forEach((card) => {
        const imgs = card.frontImages || [card.frontImage];
        const randomImage = imgs[Math.floor(Math.random() * imgs.length)];
        initialImages[card.id] = randomImage;
      });
      setRandomImages(initialImages);
    }
  }, []);

  /** 🎇 Confetti 애니메이션 **/
const fireConfetti = (amount, tier = "") => {
  const basePower = Math.min(amount / 300, 4);
  const isLegend = ["전설", "레전드"].includes(tier);
  const isRare = ["희귀", "레어"].includes(tier);

  // 💫 일반 등급 색상 & 전설 색상
  const colors = isLegend
    ? ["#ffd700", "#fff4b3", "#fa709a", "#fddb92"]
    : amount >= 1000
    ? ["#ffd700", "#ff69b4", "#fff7b5"]
    : amount >= 500
    ? ["#93f9b9", "#1d976c"]
    : ["#77a1d3", "#79cbca", "#e684ae"];

    if (!isLegend && !isRare) return;

  // 🌈 전설/레전드면 대폭죽 (화면 전체)
  if (isLegend) {
    const duration = 2000; // 2초간 퍼지는 폭죽
    const end = Date.now() + duration;

    (function frame() {
      // 여러 방향에서 동시에 confetti
      confetti({
  shapes: ['square', 'circle', 'star'],
  colors,
  particleCount: 8 + Math.random() * 10,
  startVelocity: 60,
  origin: { x: Math.random(), y: Math.random() - 0.1 },
});
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
    return;
  }

  // 🎇 일반 폭죽 (카드 중심 정도의 크기)
  if (isRare){
  confetti({
    particleCount: 80 * basePower,
    spread: 50 + basePower * 10,
    ticks: 150,
    startVelocity: 30 + basePower * 8,
    gravity: 0.8,
    scalar: 0.9,
    origin: { y: 0.7 },
    colors,
  });
  }
};

const handleFlip = (card) => {
  const { id, amount, messages } = card;

  // flip 토글
  setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));

  // 클릭 시 confetti (앞면 → 뒷면으로 전환할 때)
  setTimeout(() => {
    if (!flipped[id]) {
      const tier = revealed[id]?.tier;
      fireConfetti(amount, tier || ""); // tier 전달
    }
  }, 10);

  // 뒷면 메시지가 아직 없을 때만 랜덤 메시지 추첨
  if (!revealed[id]) {
    const random = messages[Math.floor(Math.random() * messages.length)];
    const result = { [id]: random };

    fireConfetti(amount, random.tier); // 🎆 전설이면 대폭죽 자동 실행

    if (["전설", "레전드"].includes(random.tier)) {
      setPopup({
        title: "🎶 전설 시그!",
        message: `${random.text}`,
        amount,
      });
    }

    setRevealed((prev) => {
      const updated = { ...prev, ...result };
      localStorage.setItem("sigRevealed", JSON.stringify(updated));
      return updated;
    });
  }
};

  /** 🖼 이미지 업로드 **/
  const handleImageChange = (event, cardId) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const newImageUrl = e.target.result;

    // 🖼 이미지 교체 + localStorage 저장
    setRandomImages((prev) => {
      const updated = { ...prev, [cardId]: newImageUrl };
      localStorage.setItem("sigImages", JSON.stringify(updated));
      return updated;
    });

    // ✅ 업로드 후엔 바로 앞면 보여주기 (뒤집힌 상태 해제)
    setFlipped((prev) => ({ ...prev, [cardId]: false }));
  };

  reader.readAsDataURL(file);
};

  /** 🔄 전체 초기화 **/
  const resetAll = () => {
    localStorage.removeItem("sigRevealed");
    localStorage.removeItem("sigImages");
    setRevealed({});
    setFlipped({});

    const resetImages = {};
    sigCards.forEach((card) => {
      const imgs = card.frontImages || [card.frontImage];
      const randomImg = imgs[Math.floor(Math.random() * imgs.length)];
      resetImages[card.id] = randomImg;
    });
    setRandomImages(resetImages);
  };

  const closePopup = () => setPopup(null);

  /** 🖥 UI 렌더링 **/
  return (
    <div className="natural-container">
      <h2>💖 시그헌터 💖</h2>
      <button className="reset-btn" onClick={resetAll}>
        🔄 전체 초기화
      </button>

      <div className="card-grid">
        {sigCards.map((card) => {
          const revealedMsg = revealed[card.id];
          const isGlow =
            revealedMsg && ["전설", "레전드"].includes(revealedMsg.tier);

          return (
            <div
              key={card.id}
              className={`natural-card ${flipped[card.id] ? "flipped" : ""} ${
                isGlow ? "glow" : ""
              }`}
              onClick={() => handleFlip(card)}
            >
              <div className="card-inner">
                {/* 앞면 */}
                <div className="card-front">
                  <img
                    key={randomImages[card.id]} // 이미지 변경 시 즉시 갱신
                    src={randomImages[card.id]}
                    alt="시그 이미지"
                  />
                </div>

                {/* 뒷면 */}
                <div className="card-back">
                  {revealedMsg ? (
                    <>
                      <h3>{revealedMsg.text}</h3>
                      <span
                        className={`tier ${revealedMsg.tier.toLowerCase()}`}
                      >
                        {revealedMsg.tier}
                      </span>
                    </>
                  ) : (
                    <h3>?</h3>
                  )}

                  {/* 🖼 이미지 변경 버튼 */}
                  <label htmlFor={`file-${card.id}`} className="upload-btn">
                    🖼
                  </label>
                  <input
                    id={`file-${card.id}`}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleImageChange(e, card.id)}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* 팝업 */}
        {popup && (
          <div className="popup-overlay" onClick={closePopup}>
            <div className="popup-box" onClick={(e) => e.stopPropagation()}>
              <h2>{popup.title}</h2>
              <p>🪙 {popup.amount} 하트</p>
              <p>{popup.message}</p>
              <button onClick={closePopup}>닫기 ✨</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}