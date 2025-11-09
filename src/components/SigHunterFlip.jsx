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
  const [randomImages, setRandomImages] = useState({}); // 🎨 이미지 상태 추가

  /** 초기 랜덤 이미지 한 번 세팅 **/
  useEffect(() => {
    const initialImages = {};
    sigCards.forEach((card) => {
      const imgs = card.frontImages || [card.frontImage];
      const randomImage = imgs[Math.floor(Math.random() * imgs.length)];
      initialImages[card.id] = randomImage;
    });
    setRandomImages(initialImages);
  }, []);

  /** 🎇 Confetti 강도 계산 (후원금 비례) **/
  const fireConfetti = (amount) => {
    const power = Math.min(amount / 300, 4);
    const colors =
      amount >= 1000
        ? ["#ffd700", "#ff69b4", "#fff7b5"]
        : amount >= 500
        ? ["#93f9b9", "#1d976c"]
        : ["#77a1d3", "#79cbca", "#e684ae"];

    confetti({
      particleCount: 80 * power,
      spread: 50 + power * 10,
      ticks: 150,
      startVelocity: 30 + power * 8,
      gravity: 0.8,
      scalar: 0.8 + power * 0.1,
      colors,
    });
  };

  /** 💫 카드 클릭 처리 (이미지 리롤 포함) **/
  const handleFlip = (card) => {
    const { id, amount, messages, frontImages } = card;
    if (revealed[id]) return;

    const random = messages[Math.floor(Math.random() * messages.length)];
    const result = { [id]: random };
    fireConfetti(amount);

    /** 전설·레전드일 때 팝업 표시 **/
    if (["전설", "레전드"].includes(random.tier)) {
      setPopup({
        title: "🎶 전설 시그!",
        message: `${random.text}`,
        amount,
      });
    }

    /** 시그 메시지 저장 **/
    setRevealed((prev) => {
      const updated = { ...prev, ...result };
      localStorage.setItem("sigRevealed", JSON.stringify(updated));
      return updated;
    });
    setFlipped((prev) => ({ ...prev, [id]: true }));

    /** 🖼 클릭된 카드만 랜덤 이미지 다시 뽑기 **/
    const imgs = frontImages || [card.frontImage];
    const newImage = imgs[Math.floor(Math.random() * imgs.length)];
    setRandomImages((prev) => ({ ...prev, [id]: newImage }));
  };

  /** 🔄 전체 초기화 (모든 이미지, 카드 상태 리셋) **/
  const resetAll = () => {
    localStorage.removeItem("sigRevealed");
    setRevealed({});
    setFlipped({});

    // 모든 카드 이미지 다시 랜덤 셋팅
    const newImages = {};
    sigCards.forEach((card) => {
      const imgs = card.frontImages || [card.frontImage];
      const randomImg = imgs[Math.floor(Math.random() * imgs.length)];
      newImages[card.id] = randomImg;
    });
    setRandomImages(newImages);
  };

  const closePopup = () => setPopup(null);

  /** 🖼 렌더 부분 **/
  return (
    <div className="natural-container">
      <h2>💖 시그헌터 💖</h2>
      <button className="reset-btn" onClick={resetAll}>
        🔄 초기화
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
                {/* 앞면: 현재 선택된 이미지 보여줌 */}
                <div className="card-front">
                  <img
                    src={randomImages[card.id]}
                    alt="시그 이미지"
                  />
                </div>

                {/* 뒷면: 결과 메시지 */}
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
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 팝업 */}
      {popup && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-box">
            <h2>{popup.title}</h2>
            <p>🪙 {popup.amount} 하트</p>
            <p>{popup.message}</p>
            <button onClick={closePopup}>닫기 ✨</button>
          </div>
        </div>
      )}
    </div>
  );
}