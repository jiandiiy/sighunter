import React, { useState, useEffect, useRef } from "react";
import { sigCards, normalMessages, specialMessages } from "../../data/sigData";
import "./adminPopup.css";

export default function AdminPopup({ cardId, onClose, onUpdate }) {
  // 🧩 OBS 내부 모달에서는 props.cardId만 사용 (URL 파라미터 X)
  const id = Number(cardId);
  const card = sigCards.find((c) => c.id === id);

  const [weights, setWeights] = useState([]);
  const [messages, setMessages] = useState([]);
  const modalRef = useRef(null);



  /** 카드 데이터 로드 */
  useEffect(() => {
    if (!card) return;
    const base = card.isSpecial ? specialMessages : normalMessages;
    const saved = JSON.parse(localStorage.getItem("cardWeights") || "{}");
    const initialWeights = saved[id] || base.map((m) => m.weight);
    setWeights(initialWeights);
    setMessages(base);
  }, [id, card]);

  /** 스크롤 색상 효과 */
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const handleScroll = () => {
      const scrollTop = modal.scrollTop;
      const scrollHeight = modal.scrollHeight - modal.clientHeight;
      const percent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      modal.style.setProperty("--scroll-pos", `${percent}%`);
    };

    modal.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => modal.removeEventListener("scroll", handleScroll);
  }, []);

  /** 가중치 업데이트 로직 */
  const updateWeight = (index, value, e) => {
    const newWeights = [...weights];
    const numValue = parseInt(value, 10) || 0;
    newWeights[index] = numValue;
    setWeights(newWeights);

    if (e?.target)
      e.target.style.setProperty("--range-progress", `${numValue}%`);

    const all = JSON.parse(localStorage.getItem("cardWeights") || "{}");
    all[id] = newWeights;
    localStorage.setItem("cardWeights", JSON.stringify(all));

    onUpdate?.(newWeights, id);
  };

  /** 이 카드만 초기화 */
  const resetSingleCard = () => {
    if (!card) return;
    if (window.confirm(`카드 ${id}번 확률을 초기화하시겠습니까?`)) {
      const base = card.isSpecial ? specialMessages : normalMessages;
      const init = base.map((m) => m.weight);

      const all = JSON.parse(localStorage.getItem("cardWeights") || "{}");
      all[id] = init;
      localStorage.setItem("cardWeights", JSON.stringify(all));
      setWeights(init);
      onUpdate?.(init);
      alert(`✅ ${id}번 카드 확률이 초기값으로 복원되었습니다.`);
    }
  };

  /** 전체 초기화 */
  const resetAllCards = () => {
    if (window.confirm("모든 카드 확률을 초기값으로 복원하시겠습니까?")) {
      const normal = normalMessages.map((m) => m.weight);
      const special = specialMessages.map((m) => m.weight);
      const all = {};
      sigCards.forEach((c) => (all[c.id] = c.isSpecial ? special : normal));
      localStorage.setItem("cardWeights", JSON.stringify(all));
      setWeights(card?.isSpecial ? special : normal);
      onUpdate?.(card?.isSpecial ? special : normal);
      alert("✅ 전체 카드 확률이 기본값으로 복원되었습니다!");
    }
  };

  if (!card || isNaN(id))
    return (
      <div className="admin-overlay" onClick={onClose}>
        <div className="admin-modal">
          <h2>❌ 카드 ID 없음</h2>
          <p>올바른 카드가 선택되지 않았습니다.</p>
          <button className="close-btn" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    );

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div
        className="admin-modal"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-container">
          <h2>🎰 {id}번 카드 확률 조절</h2>
          <p className="card-type">
            {card.isSpecial ? "🌟 특별 카드" : "📇 일반 카드"}
          </p>

          <div className="prob-list">
            {messages.map((msg, i) => {
              const total = weights.reduce((a, b) => a + b, 0) || 1;
              const percent = ((weights[i] / total) * 100).toFixed(1);
              return (
                <div className="prob-control" key={i}>
                  <div className="prob-header">
                    <label>{msg.text}</label>
                    <span className="prob-percent">({percent}%)</span>
                  </div>
                  <div className="prob-inputs">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={weights[i] || 0}
                      onChange={(e) => updateWeight(i, e.target.value, e)}
                      className="range-input"
                      style={{
                        "--range-progress": `${weights[i] || 0}%`,
                      }}
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={weights[i] || 0}
                      onChange={(e) => updateWeight(i, e.target.value)}
                      className="number-input"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="button-group">
            <button className="reset-single-btn" onClick={resetSingleCard}>
              🔄 이 카드만 초기화
            </button>
            <button className="reset-all-btn" onClick={resetAllCards}>
              🔄 모든 카드 초기화
            </button>
            <button className="close-btn" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}