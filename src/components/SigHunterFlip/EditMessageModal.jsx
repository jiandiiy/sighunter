import React, { useState, useEffect } from "react";
import { sigCards } from "../../data/sigData";
import "./editMessage.css";

export default function EditMessageModal({
  cardId,
  initialMsg, // 부모(SigHunterFlip)에서 넘겨주는 현재 메시지
  onClose,
  onUpdate,
}) {
  const id = Number(cardId);

  const [currentMsg, setCurrentMsg] = useState({
    text: "",
    tier: "일반",
    color: "#ffffff",
    bgColor: "#443288",
  });

  const card = sigCards.find((c) => c.id === id);

  // 🔹 초기값 로드: initialMsg 우선, 없으면 localStorage fallback
  useEffect(() => {
    if (initialMsg) {
      setCurrentMsg((prev) => ({
        ...prev,
        ...initialMsg,
      }));
      return;
    }

    const saved = JSON.parse(localStorage.getItem("sigRevealed") || "{}");
    if (saved[id]) {
      setCurrentMsg(saved[id]);
    }
  }, [id, initialMsg]);

  /** 인풋 변경 핸들러 */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentMsg((prev) => ({ ...prev, [name]: value }));
  };

  /** 저장 로직 */
  const handleSave = () => {
    if (!currentMsg.text.trim()) {
      alert("메시지를 입력해주세요!");
      return;
    }

    try {
      // 1️⃣ localStorage에 메시지 저장
       const revealed = JSON.parse(localStorage.getItem("sigRevealed") || "{}");
   const editedMsg = { ...currentMsg, edited: true };
   revealed[id] = editedMsg;
      localStorage.setItem("sigRevealed", JSON.stringify(revealed));

      // 2️⃣ 잠금 해제
      const locked = JSON.parse(localStorage.getItem("sigLocked") || "{}");
      locked[id] = false;
      localStorage.setItem("sigLocked", JSON.stringify(locked));

      // 3️⃣ 부모 SPA 상태에 즉시 반영
        console.log("✅ [EditMessageModal] onUpdate 호출 직전:", editedMsg);
   onUpdate?.(editedMsg);

      alert(`✅ 카드 ${id}번 메시지 수정 완료!`);
      onClose();
    } catch (error) {
      alert("❌ 저장 실패: " + error.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => {
    e.stopPropagation(); // 오버레이 클릭도 카드까지 전달 안 되게
    onClose();
  }}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <h2>📝 카드 {id}번 메시지 수정</h2>

        <p className="card-info">
          {card?.isSpecial ? "🌟 특별 카드" : "📇 일반 카드"}
        </p>

        <label>메시지 내용</label>
        <input
          type="text"
          name="text"
          value={currentMsg.text}
          onChange={handleChange}
          placeholder="메시지를 입력하세요"
        />

        <label>등급 선택</label>
        <select name="tier" value={currentMsg.tier} onChange={handleChange}>
          <option value="일반">일반</option>
          <option value="희귀">희귀</option>
          <option value="레어">레어</option>
          <option value="전설">전설</option>
          <option value="레전드">레전드</option>
        </select>

        <label>🖌 텍스트 색상</label>
        <input
          type="color"
          name="color"
          value={currentMsg.color}
          onChange={handleChange}
        />

        <label>🎨 배경 색상</label>
        <input
          type="color"
          name="bgColor"
          value={currentMsg.bgColor}
          onChange={handleChange}
        />

        <div className="button-group">
          <button type="button"
  onClick={(e) => {
    e.stopPropagation();
    e.preventDefault();
    handleSave();
  }}>
            💾 저장
          </button>
          <button   type="button"
  onClick={(e) => {
    e.stopPropagation();
    e.preventDefault();
    onClose();
  }}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}